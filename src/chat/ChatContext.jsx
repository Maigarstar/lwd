// ─── src/chat/ChatContext.jsx ─────────────────────────────────────────────────
import {
  createContext, useContext, useState, useCallback, useRef, useEffect,
} from "react";
import { getRecommendations } from "./recommendationEngine";
import { trackAuraQuery } from "../services/userEventService";
import { supabase, isSupabaseAvailable } from "../lib/supabaseClient";

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadMessages() {
  try { return JSON.parse(localStorage.getItem("lwd_chat_messages")) ?? null; }
  catch { return null; }
}
function saveMessages(msgs) {
  try { localStorage.setItem("lwd_chat_messages", JSON.stringify(msgs.slice(-100))); } catch {}
}
function getOrCreateSession() {
  let id = sessionStorage.getItem("lwd_session_id");
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("lwd_session_id", id);
  }
  return id;
}

// ── Stub responses ────────────────────────────────────────────────────────────
const STUBS = [
  "I've updated the recommendations on the right, take a look at a few venues that match what you're describing.",
  "Great question. Each region has its own distinct character. The right panel shows venues filtered to your preference.",
  "Our curated selection in the recommendations panel reflects your search, let me know if you'd like to refine further.",
  "I've picked out some options based on what you've shared. You'll see them highlighted in the panel beside this chat.",
  "Every venue in our collection offers full exclusive use. I've surfaced the best matches on the right.",
  "That is a wonderful question. Our team personally visits every venue in our collection to ensure it meets our standards for luxury and exclusivity.",
  "We recommend beginning your venue search at least 18 to 24 months before your intended wedding date, especially for peak summer and early autumn dates.",
];
let stubIdx = 0;
const nextStub = () => STUBS[stubIdx++ % STUBS.length];

// ── Initial message ───────────────────────────────────────────────────────────
const INIT_MESSAGE = {
  id: 0,
  from: "aura",
  text: "Hello, I'm Aura, your private wedding concierge. Tell me what you're looking for and I'll curate the perfect options.",
};

// ── Context ───────────────────────────────────────────────────────────────────
const ChatCtx = createContext(null);

export function useChat() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ChatProvider({ children }) {
  const sessionId  = useRef(getOrCreateSession());
  const replyTimer = useRef(null);

  // ── Core state ───────────────────────────────────────────────────────────
  const [chatUiState,     setChatUiState]     = useState("closed"); // "closed"|"open"|"fullchat"
  const [chatDark,        setChatDark]        = useState(true);
  const [messages,        setMessages]        = useState(() => loadMessages() ?? [INIT_MESSAGE]);
  const [isTyping,        setIsTyping]        = useState(false);
  const [activeContext,   setActiveContext]   = useState({ country: null, region: null, page: null, compareVenues: [] });
  const [recommendations, setRecommendations] = useState({ items: [], summary: "", intent: {} });

  // Persist messages
  useEffect(() => { saveMessages(messages); }, [messages]);

  // Recompute recommendations whenever messages or activeContext change
  useEffect(() => {
    try {
      setRecommendations(getRecommendations(messages, activeContext));
    } catch (err) {
      console.warn("[ChatContext] Error computing recommendations:", err);
      setRecommendations({ items: [], summary: "", intent: {} });
    }
  }, [messages, activeContext]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(replyTimer.current), []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const openMiniBar   = useCallback(() => setChatUiState("open"),      []);
  const openWorkspace = useCallback(() => setChatUiState("fullchat"),  []);
  const closeChat     = useCallback(() => setChatUiState("closed"),    []);
  const closeFull     = useCallback(() => setChatUiState("open"),      []);
  const toggleTheme   = useCallback(() => setChatDark((d) => !d),      []);

  const setChatContext = useCallback((ctx) => {
    setActiveContext((prev) => ({
      ...prev,
      ...ctx,
      // preserve existing compareVenues if new context doesn't provide them
      compareVenues: ctx.compareVenues ?? prev.compareVenues ?? [],
    }));
  }, []);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Track Aura query
    trackAuraQuery({
      query: trimmed,
      venuesRecommended: [],
      sourceSurface: activeContext?.page || 'aura_chat',
    });

    const userMsg = { id: Date.now(), from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // ── Build venue-aware system prompt from active context ────────────────
    const ctxLines = [
      activeContext.page     && `The user is currently on the ${activeContext.page} page.`,
      activeContext.country  && `They are interested in venues in ${activeContext.country}.`,
      activeContext.region   && `Specifically in ${activeContext.region}.`,
    ].filter(Boolean).join(' ');

    const systemPrompt = [
      `You are Aura, the AI wedding concierge for Luxury Wedding Directory — the world's finest curated collection of luxury wedding venues and vendors.`,
      `Your tone is warm, assured, and quietly expert — like a trusted specialist, not a chatbot.`,
      `Keep every response to 2–4 sentences. Be specific, never generic. Help the couple make a decision.`,
      ctxLines,
      `If they're comparing venues, highlight the genuine differences. If they have a question, answer it directly.`,
      `Never say you're an AI model. You are Aura.`,
    ].filter(Boolean).join(' ');

    // ── Try real AI via edge function ──────────────────────────────────────
    try {
      if (!isSupabaseAvailable()) throw new Error('Supabase unavailable');

      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: {
          feature: 'aura_chat',
          systemPrompt,
          userPrompt: trimmed,
        },
      });

      if (error || !data?.text) throw new Error(error?.message || 'Empty response');

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: 'aura', text: data.text },
      ]);
    } catch (err) {
      // ── Graceful fallback to stub responses ────────────────────────────
      console.warn('[Aura] AI call failed, using stub:', err?.message);
      clearTimeout(replyTimer.current);
      replyTimer.current = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, from: 'aura', text: nextStub() },
        ]);
      }, 600);
    }
  }, [activeContext]);

  const clearHistory = useCallback(() => {
    clearTimeout(replyTimer.current);
    setMessages([INIT_MESSAGE]);
    setIsTyping(false);
    setRecommendations({ items: [], summary: "Curated for you" });
  }, []);

  return (
    <ChatCtx.Provider
      value={{
        chatUiState, chatDark, messages, isTyping,
        activeContext, recommendations, sessionId: sessionId.current,
        openMiniBar, openWorkspace, closeChat, closeFull,
        toggleTheme, setChatContext, sendMessage, clearHistory,
      }}
    >
      {children}
    </ChatCtx.Provider>
  );
}
