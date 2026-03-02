// ─── src/chat/ChatContext.jsx ─────────────────────────────────────────────────
import {
  createContext, useContext, useState, useCallback, useRef, useEffect,
} from "react";
import { getRecommendations } from "./recommendationEngine";

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
  "I've updated the recommendations on the right — take a look at a few venues that match what you're describing.",
  "Great question. Each region has its own distinct character. The right panel shows venues filtered to your preference.",
  "Our curated selection in the recommendations panel reflects your search — let me know if you'd like to refine further.",
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
  text: "Hello. I am Aura, your personal wedding planning assistant. I can help you find the right venue, explore vendors, or connect you with one of our consultants. How can I help?",
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
  const [activeContext,   setActiveContext]   = useState({ country: null, region: null, page: null });
  const [recommendations, setRecommendations] = useState(
    () => getRecommendations([INIT_MESSAGE], null)
  );

  // Persist messages
  useEffect(() => { saveMessages(messages); }, [messages]);

  // Recompute recommendations whenever messages or activeContext change
  useEffect(() => {
    setRecommendations(getRecommendations(messages, activeContext));
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
    setActiveContext((prev) =>
      prev.country === ctx.country &&
      prev.region  === ctx.region  &&
      prev.page    === ctx.page
        ? prev
        : ctx
    );
  }, []);

  const sendMessage = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg = { id: Date.now(), from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    replyTimer.current = setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "aura", text: nextStub() },
      ]);
    }, 850);
  }, []);

  const clearHistory = useCallback(() => {
    clearTimeout(replyTimer.current);
    setMessages([INIT_MESSAGE]);
    setIsTyping(false);
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
