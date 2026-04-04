// ─── src/chat/ChatContext.jsx ─────────────────────────────────────────────────
import {
  createContext, useContext, useState, useCallback, useRef, useEffect,
} from "react";
import { getRecommendations } from "./recommendationEngine";
import { supabase } from "../lib/supabaseClient";

// ── Image fetch for Aura visual responses ────────────────────────────────────
// Detects visual intent in the user's message and fetches relevant images
// from media_ai_index to attach to Aura's reply.

const VISUAL_TRIGGERS = [
  /\b(show|see|look|image|photo|picture|gallery|visual|beautiful|style|what.*look|how.*look|appear|interior|exterior|space|room|garden|ceremony)\b/i,
];

const STYLE_KEYWORDS = [
  "romantic", "modern", "rustic", "classic", "minimal", "editorial",
  "garden", "barn", "castle", "chateau", "villa", "vineyard", "beach",
  "ballroom", "intimate", "grand", "outdoor", "indoor",
];

function extractStyleKeywords(text) {
  const lower = text.toLowerCase();
  return STYLE_KEYWORDS.filter(kw => lower.includes(kw));
}

function hasVisualIntent(text) {
  return VISUAL_TRIGGERS.some(rx => rx.test(text));
}

async function fetchAuraImages({ listingId, region, country, keywords, limit = 6 }) {
  try {
    // Build query — prioritise listing context, then region, then platform-wide featured
    let query = supabase.from("media_ai_index")
      .select("media_id, url, title, alt_text, listing_name, listing_id, category, region, country, is_featured")
      .not("url", "is", null)
      .limit(limit);

    if (listingId) {
      // On a specific venue/listing page — show that listing's images
      query = query.eq("listing_id", listingId);
    } else if (keywords?.length) {
      // Style-keyword filter using OR across tags (style_tags is a text[] column in media_metadata_enrichment)
      // For now do a text search on title/alt_text; enrichment join can be added later
      query = query.or(
        keywords.map(kw => `title.ilike.%${kw}%,alt_text.ilike.%${kw}%`).join(",")
      );
      if (region) query = query.ilike("region", `%${region}%`);
    } else if (region) {
      query = query.ilike("region", `%${region}%`);
    }

    query = query.order("is_featured", { ascending: false })
                 .order("created_at",  { ascending: false });

    const { data } = await Promise.resolve(query);
    return (data || []).filter(r => r.url);
  } catch {
    return [];
  }
}

// ── AI backend ────────────────────────────────────────────────────────────────
const AI_URL  = 'https://qpkggfibwreznussudfh.supabase.co/functions/v1/ai-generate';
const ANON_KEY = typeof window !== 'undefined'
  ? (window.__VITE_SUPABASE_ANON_KEY__ || import.meta?.env?.VITE_SUPABASE_ANON_KEY || '')
  : '';

function buildAuraSystemPrompt(activeContext) {
  let prompt = `You are Aura, a private luxury wedding concierge for Luxury Wedding Directory.
Your role is to help couples plan their perfect wedding by sharing expert knowledge about venues and the planning process.
Keep responses warm, concise, and authoritative — no more than 3 sentences unless the user asks for detail.
Write in British English. Never mention AI, models, or being an assistant.`;

  if (activeContext?.venueInfo) {
    prompt += `\n\nYou are currently on the showcase page for this venue. Answer questions about it accurately:\n\n${activeContext.venueInfo}`;
  } else if (activeContext?.region) {
    prompt += `\n\nThe user is currently browsing ${activeContext.region}${activeContext.country ? `, ${activeContext.country}` : ''}. Bias responses towards this area when relevant.`;
  }
  return prompt;
}

async function callAuraAi(text, messages, activeContext) {
  const history = messages.slice(-8).map(m => `${m.from === 'user' ? 'User' : 'Aura'}: ${m.text}`).join('\n');
  const userPrompt = history ? `${history}\nUser: ${text}` : text;
  try {
    const res = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ feature: 'aura_chat', systemPrompt: buildAuraSystemPrompt(activeContext), userPrompt }),
    });
    const data = await res.json();
    if (!res.ok || data.error) return null;
    return data.text || data.content || data.response || data.output || null;
  } catch {
    return null;
  }
}

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
  const [activeContext,   setActiveContext]   = useState({ country: null, region: null, page: null, venueInfo: null, listingId: null });
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

  // When chat opens on a listing page, attach images to the opening message
  // so the couple immediately sees what the venue looks like.
  useEffect(() => {
    if (!activeContext.listingId) return;
    // Only enrich the INIT_MESSAGE (id=0) if it hasn't been enriched yet
    setMessages(prev => {
      const initMsg = prev.find(m => m.id === 0);
      if (!initMsg || initMsg.images) return prev; // already enriched or gone
      // Fire async — update when resolved
      fetchAuraImages({ listingId: activeContext.listingId, limit: 6 }).then(imgs => {
        if (!imgs?.length) return;
        setMessages(ms => ms.map(m =>
          m.id === 0 ? { ...m, images: imgs } : m
        ));
      });
      return prev; // no synchronous change
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContext.listingId]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(replyTimer.current), []);

  // ── Admin engage bridge ──────────────────────────────────────────────────
  // LiveStatsModule writes lwd_aura_engage to localStorage then opens "/"
  // in a new tab. The NEW TAB reads this key on mount and opens Aura.
  // Guard: never fire in an admin session (admin opens a new tab to trigger this,
  // not the current window — so if admin session is present, skip entirely).
  useEffect(() => {
    try {
      // If admin is authenticated in this window, this is the admin tab — skip.
      const isAdminSession = !!sessionStorage.getItem("lwd_admin_session");
      if (isAdminSession) return;

      const raw = localStorage.getItem("lwd_aura_engage");
      if (!raw) return;
      const engage = JSON.parse(raw);
      if (!engage?.ts || Date.now() - engage.ts > 30_000) {
        localStorage.removeItem("lwd_aura_engage");
        return;
      }
      localStorage.removeItem("lwd_aura_engage");
      const prompt = engage.prompt;
      if (!prompt) return;
      // Open chat then fire the message
      setTimeout(() => {
        openMiniBar();
        setTimeout(() => sendMessage(prompt), 450);
      }, 350);
    } catch { /* silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only — intentionally no deps

  // ── Actions ──────────────────────────────────────────────────────────────
  const openMiniBar   = useCallback(() => setChatUiState("open"),      []);
  const openWorkspace = useCallback(() => setChatUiState("fullchat"),  []);
  const closeChat     = useCallback(() => setChatUiState("closed"),    []);
  const closeFull     = useCallback(() => setChatUiState("open"),      []);
  const toggleTheme   = useCallback(() => setChatDark((d) => !d),      []);

  const setChatContext = useCallback((ctx) => {
    setActiveContext((prev) =>
      prev.country   === ctx.country   &&
      prev.region    === ctx.region    &&
      prev.page      === ctx.page      &&
      prev.venueInfo === ctx.venueInfo &&
      prev.listingId === ctx.listingId
        ? prev
        : { country: null, region: null, page: null, venueInfo: null, listingId: null, ...ctx }
    );
  }, []);

  const sendMessage = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg = { id: Date.now(), from: "user", text: trimmed };

    // Detect if we should attach images to the reply
    const wantsImages  = hasVisualIntent(trimmed);
    const styleKws     = extractStyleKeywords(trimmed);
    const ctx          = activeContext; // capture for closure

    setMessages((prev) => {
      const snapshot = [...prev, userMsg];
      setIsTyping(true);
      clearTimeout(replyTimer.current);

      const aiCall   = callAuraAi(trimmed, snapshot, ctx);
      const timeout  = new Promise(res => { replyTimer.current = setTimeout(() => res(null), 12000); });

      // Fire image fetch in parallel with AI — only when visually relevant
      const imagesFetch = (wantsImages || ctx.listingId)
        ? fetchAuraImages({
            listingId: ctx.listingId || null,
            region:    ctx.region    || null,
            country:   ctx.country   || null,
            keywords:  styleKws.length ? styleKws : null,
            limit:     6,
          })
        : Promise.resolve([]);

      Promise.all([
        Promise.race([aiCall, timeout]),
        imagesFetch,
      ]).then(([aiText, imgs]) => {
        setIsTyping(false);
        const reply  = aiText?.trim() || nextStub();
        const images = imgs?.length ? imgs : undefined;
        setMessages(m => [...m, {
          id:     Date.now() + 1,
          from:   "aura",
          text:   reply,
          images, // undefined when no images → strip not rendered
        }]);
      }).catch(() => {
        setIsTyping(false);
        setMessages(m => [...m, { id: Date.now() + 1, from: "aura", text: nextStub() }]);
      });

      return snapshot;
    });
  }, [activeContext]);

  const clearHistory = useCallback(() => {
    clearTimeout(replyTimer.current);
    setMessages([INIT_MESSAGE]);
    setIsTyping(false);
    setRecommendations({ items: [], summary: "Curated for you" });
  }, []);

  // ── Discovery nudge — fires after couple views 2+ images in lightbox ──────
  // Builds a contextual "show similar venues?" prompt based on the image they
  // were most engaged with (category + region).
  const nudgeDiscovery = useCallback((img) => {
    if (!img) return;
    const venue  = img.listing_name || "this venue";
    const region = img.region || activeContext.region || null;
    const cat    = img.category || "wedding venue";

    const nudge = region
      ? `These spaces are beautiful. Would you like me to show you similar ${cat}s in ${region}?`
      : `These images are striking. Would you like me to show you similar ${cat}s with this aesthetic?`;

    setMessages(m => [...m, {
      id:   Date.now(),
      from: "aura",
      text: nudge,
    }]);
  }, [activeContext.region]);

  return (
    <ChatCtx.Provider
      value={{
        chatUiState, chatDark, messages, isTyping,
        activeContext, recommendations, sessionId: sessionId.current,
        openMiniBar, openWorkspace, closeChat, closeFull,
        toggleTheme, setChatContext, sendMessage, clearHistory, nudgeDiscovery,
      }}
    >
      {children}
    </ChatCtx.Provider>
  );
}
