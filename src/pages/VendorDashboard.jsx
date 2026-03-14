// ─── src/pages/VendorDashboard.jsx ───────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme, ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import { GoldBadge } from "../components/ui/Badges";
import Pill from "../components/ui/Pill";
import { MField, Btn } from "../components/ui/FormHelpers";
import { GLOBAL_VENDORS } from "../data/globalVendors";
import CuratedIndexBadge from "../components/ui/CuratedIndexBadge";
import { computeCuratedIndex, FACTOR_LABELS } from "../engine/index.js";
import FooterForVendors from "../components/sections/FooterForVendors";
import { getVendorMetrics, subscribeToVendorMetrics, getVendorEnquiries } from "../services/vendorMetricsService";
import VendorLeadInbox from "../components/VendorLeadInbox";
import { useVendorAuth } from "../context/VendorAuthContext";
import { exitAdminPreview } from "../context/AdminPreviewContext";
import { getMySubmission, upsertSubmission } from "../services/artistryService";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Local helpers ────────────────────────────────────────────────────────────
function Badge({ text, color, bg, border }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: color ?? "#0f0d0a",
        background: bg ?? "#C9A84C",
        border: border ? `1px solid ${border}` : "none",
        padding: "3px 8px",
        borderRadius: "var(--lwd-radius-input)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function MiniChart({ data, labels, color }) {
  const C = useTheme();
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: "100%",
              background: color,
              opacity: 0.7 + (v / max) * 0.3,
              height: `${(v / max) * 70}px`,
              transition: "height 0.5s ease",
              minHeight: 3,
              borderRadius: "1px 1px 0 0",
            }}
          />
          <span style={{ fontFamily: NU, fontSize: 8, color: C.grey, letterSpacing: "0.5px" }}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function LeadRow({ lead, expanded }) {
  const C = useTheme();
  const [open, setOpen] = useState(false);
  const statusColors = { new: C.gold, replied: C.blue, booked: C.green };

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${lead.status === "new" ? C.border2 : C.border}`,
        borderRadius: "var(--lwd-radius-card)",
        marginBottom: 8,
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.border2)}
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor =
          lead.status === "new" ? C.border2 : C.border)
      }
    >
      <div
        style={{
          padding: "14px 18px",
          display: "flex",
          gap: 16,
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setOpen((x) => !x)}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: C.goldDim,
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "var(--lwd-radius-input)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            color: C.gold,
            flexShrink: 0,
            fontWeight: 700,
            fontFamily: GD,
          }}
        >
          {lead.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white }}>
              {lead.name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: statusColors[lead.status],
                background: `rgba(${
                  lead.status === "new"
                    ? "201,168,76"
                    : lead.status === "replied"
                    ? "96,165,250"
                    : "34,197,94"
                },0.1)`,
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {lead.status}
            </span>
          </div>
          <div
            style={{
              fontFamily: NU,
              fontSize: 12,
              color: C.grey,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span>▫ {lead.date}</span>
            <span>⊞ {lead.guests}</span>
            <span>◈ {lead.budget}</span>
            <span>◔ {lead.time}</span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.grey, flexShrink: 0 }}>
          {open ? "▲" : "▼"}
        </div>
      </div>

      {(open || expanded) && open && (
        <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${C.border}` }}>
          <div
            style={{
              fontFamily: NU,
              fontSize: 13,
              color: C.grey,
              lineHeight: 1.7,
              margin: "12px 0",
            }}
          >
            {lead.msg}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              style={{
                background: C.gold,
                color: C.black,
                border: "none",
                borderRadius: "var(--lwd-radius-input)",
                padding: "9px 18px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: NU,
              }}
            >
              Reply Now
            </button>
            <button
              style={{
                background: "none",
                border: `1px solid ${C.border2}`,
                borderRadius: "var(--lwd-radius-input)",
                color: C.grey,
                padding: "9px 14px",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: NU,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              View Profile
            </button>
            <button
              style={{
                background: "none",
                border: `1px solid ${C.border2}`,
                borderRadius: "var(--lwd-radius-input)",
                color: C.grey,
                padding: "9px 14px",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: NU,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Mark Booked ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notification chime (Web Audio API, no external files) ──────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    // Two-note luxury chime: E5 → G5
    [659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.15 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.7);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (_) { /* silent fallback */ }
}

// ── Simulated incoming chat requests ────────────────────────────────────────
const INCOMING_CHATS = [
  { id: 1, name: "Sophie & James",  page: "Your Venue Profile",         msg: "Hi! We love your venue, is June 2026 available?", guests: "80–150" },
  { id: 2, name: "Aisha & Tom",     page: "Lake Como, Venues",         msg: "We're comparing a few venues. Can you tell us about packages?", guests: "30–80" },
  { id: 3, name: "Elena & Marco",   page: "Your Photo Gallery",         msg: "The ballroom looks stunning! Do you offer winter weddings?", guests: "30–80" },
  { id: 4, name: "Priya & Daniel",  page: "Wedding Venue Search",       msg: "We need space for 200+ guests. Is that possible?", guests: "150–300" },
  { id: 5, name: "Charlotte & Will", page: "Your Catering Menu",        msg: "Do you accommodate fully vegan menus?", guests: "150–300" },
];

// ── Chat notification popup ─────────────────────────────────────────────────
function ChatNotification({ notification, C, onAccept, onDismiss, isMobile }) {
  if (!notification) return null;
  return (
    <div style={{
      position: "fixed",
      top: isMobile ? 16 : 24,
      right: isMobile ? 16 : 24,
      left: isMobile ? 16 : "auto",
      zIndex: 9999,
      width: isMobile ? "auto" : 380, background: C.card,
      border: `1px solid ${C.gold}`,
      borderRadius: "var(--lwd-radius-card)",
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${C.border}, 0 0 20px rgba(201,168,76,0.15)`,
      animation: "chatNotifSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)",
      overflow: "hidden",
    }}>
      {/* Gold top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.gold2})` }} />

      <div style={{ padding: "18px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: C.green,
              boxShadow: `0 0 6px ${C.green}`, animation: "pulse 1.5s infinite",
            }} />
            <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>
              Client Enquiry
            </span>
          </div>
          <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>Just now</span>
        </div>

        {/* Couple info */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "var(--lwd-radius-image)",
            background: C.goldDim, border: `1px solid rgba(201,168,76,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: GD, fontSize: 14, color: C.gold,
          }}>
            {notification.name.split(" ")[0][0]}{notification.name.includes("&") ? notification.name.split("& ")[1]?.[0] || "" : ""}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: NU, fontSize: 14, fontWeight: 700, color: C.white }}>{notification.name}</div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
              on <span style={{ color: C.gold }}>{notification.page}</span> · {notification.guests} guests
            </div>
          </div>
        </div>

        {/* Message preview */}
        <div style={{
          background: C.black,
          padding: "10px 14px", borderRadius: "var(--lwd-radius-card)",
          border: `1px solid ${C.border}`,
          marginBottom: 16,
        }}>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
            "{notification.msg}"
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onAccept} style={{
            flex: 1, padding: "10px 0",
            background: `linear-gradient(135deg, ${C.gold}, ${C.gold2})`,
            border: "none", borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
            fontFamily: NU, fontSize: 11, fontWeight: 700,
            letterSpacing: "1.5px", textTransform: "uppercase",
            color: "#0f0d0a",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px rgba(201,168,76,0.3)`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            ◈ Accept Chat
          </button>
          <button onClick={onDismiss} style={{
            padding: "10px 20px",
            background: "none",
            border: `1px solid ${C.border2}`,
            borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
            fontFamily: NU, fontSize: 11, fontWeight: 600,
            letterSpacing: "1px", textTransform: "uppercase",
            color: C.grey,
            transition: "border-color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.grey}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border2}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────────
export default function VendorDashboard({ onBack, onVendorLogin }) {
  const { vendor: _contextVendor, isAuthenticated, loading, logout } = useVendorAuth();

  // ── Admin Preview Mode ─────────────────────────────────────────────────────
  // Synchronous sessionStorage read, no async, no Supabase race conditions.
  // The admin sidebar sets "lwd_admin_preview" before navigating here.
  // To remove later: delete this block + the exitAdminPreview import above.
  const _adminPreviewData = (() => {
    try { return JSON.parse(sessionStorage.getItem("lwd_admin_preview") || "null"); } catch { return null; }
  })();
  const isAdminPreview = _adminPreviewData?.type === "vendor";
  // If in preview mode, use a mock vendor object; otherwise use the real context vendor.
  const vendor = isAdminPreview
    ? { id: _adminPreviewData.id || "vdr-13", name: _adminPreviewData.name || "The Grand Pavilion", email: _adminPreviewData.email || "contact@grandpavilion.com", isAdminPreview: true }
    : _contextVendor;
  // ─────────────────────────────────────────────────────────────────────────
  const [currentTheme, setCurrentTheme] = useState(
    document.documentElement.getAttribute("data-lwd-mode") || "light"
  );
  const C = currentTheme === "dark" ? getDarkPalette() : getLightPalette();

  // ── All useState/useRef calls MUST be before any conditional returns ──────
  const [dashTab, setDashTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Real-time metrics from Supabase
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [enquiries, setEnquiries] = useState([]);
  const unsubscribeRef = useRef(null);

  // ── Authentication Guard ──────────────────────────────────────────────────
  // Admin preview bypasses all auth checks (vendor comes from sessionStorage above).
  if (!isAdminPreview) {
    if (loading) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: C.grey }}>Loading...</p>
        </div>
      );
    }
    if (!isAuthenticated || !vendor) {
      window.location.href = "/vendor/login";
      return null;
    }
  }

  // Track theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      const mode = document.documentElement.getAttribute("data-lwd-mode") || "light";
      setCurrentTheme(mode);
    };
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Track window resize
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth < 1024);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Load real metrics from Supabase and subscribe to changes
  useEffect(() => {
    const loadData = async () => {
      // Safety check: ensure vendor exists
      if (!vendor?.id) {
        console.error("Vendor ID not found");
        setMetricsLoading(false);
        return;
      }

      setMetricsLoading(true);

      // Load metrics
      const metricsResult = await getVendorMetrics(vendor.id);
      if (metricsResult.error) {
        console.error("Error loading vendor metrics:", metricsResult.error);
        setMetrics(null);
      } else {
        setMetrics(metricsResult.data);
      }

      // Load enquiries
      const enquiriesResult = await getVendorEnquiries(vendor.id, 5);
      if (!enquiriesResult.error) {
        setEnquiries(enquiriesResult.data);
      }

      setMetricsLoading(false);
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToVendorMetrics(vendor.id, (updatedMetrics) => {
      setMetrics(updatedMetrics);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [vendor.id]);

  const [aiBio, setAiBio] = useState("");
  const [genBio, setGenBio] = useState(false);

  // ── Live chat notifications ──────────────────────────────────────────────
  const [chatNotif, setChatNotif] = useState(null);
  const chatIdx = useRef(0);

  useEffect(() => {
    // First notification after 8 seconds, then every 30–50s
    const first = setTimeout(() => {
      const chat = INCOMING_CHATS[chatIdx.current % INCOMING_CHATS.length];
      setChatNotif(chat);
      playChime();
      chatIdx.current++;
    }, 8000);

    const interval = setInterval(() => {
      if (!document.hidden) {
        const chat = INCOMING_CHATS[chatIdx.current % INCOMING_CHATS.length];
        setChatNotif(chat);
        playChime();
        chatIdx.current++;
      }
    }, 35000);

    return () => { clearTimeout(first); clearInterval(interval); };
  }, []);

  const acceptChat = useCallback(() => {
    setChatNotif(null);
    setDashTab("livechat");
  }, []);

  const dismissChat = useCallback(() => {
    setChatNotif(null);
  }, []);

  // ── Active chat thread ─────────────────────────────────────────────────
  const [activeChat, setActiveChat] = useState(null);
  const [chatMsg, setChatMsg] = useState("");
  const [chatMessages, setChatMessages] = useState({});
  const chatEndRef = useRef(null);
  const [takenOverChats, setTakenOverChats] = useState(new Set()); // AI handles by default; vendor takes over on request
  const [engagementTooltip, setEngagementTooltip] = useState(false);

  // Chat sources, where each enquiry came from
  const CHAT_SOURCES = {
    "Sophie & James": { source: "Venue Listing", icon: "⊙" },
    "Aisha & Tom": { source: "Contact Form", icon: "✉" },
    "Elena & Marco": { source: "Photo Gallery", icon: "⊞" },
    "Mark & Lisa": { source: "Venue Card", icon: "◈" },
  };

  const AURA_COACHING = {
    "Sophie & James": {
      strategies: ["Confirm June 2026 availability quickly, scarcity creates urgency", "Offer a private virtual walkthrough of the Walled Garden", "Send personalised mood board based on garden ceremony preference"],
      reasoning: "High-intent couple with specific date and guest count, fast, personalised response converts at 3.2× rate",
    },
    "Aisha & Tom": {
      strategies: ["Lead with social proof, share recent 5-star reviews", "Offer a downloadable brochure with package pricing"],
      reasoning: "Comparison stage, they need differentiation, not pressure. Build trust with transparency.",
    },
    "Elena & Marco": {
      strategies: ["Send a follow-up with exclusive availability hold offer", "Share a short video tour from a recent wedding", "Suggest a no-obligation callback at their convenience"],
      reasoning: "Warm but not committed, re-engage with value, not sales pressure. Follow-up within 24h converts 68% of warm leads.",
    },
    "Mark & Lisa": {
      strategies: ["Provide clear payment plan breakdown with deposit options", "Highlight flexible cancellation policy to reduce friction", "Offer to schedule a call with the events coordinator"],
      reasoning: "High budget, high intent, financial clarity removes the last barrier. Payment flexibility increases conversion by 41%.",
    },
  };

  const CHAT_THREADS = {
    "Sophie & James": [
      { from: "couple", text: "Hi! We love your venue, is June 2026 available?", time: "2:14 PM" },
      { from: "couple", text: "We're planning for around 120 guests, garden ceremony ideally.", time: "2:14 PM" },
      { from: "aura", text: "Thank you for your enquiry, Sophie & James! June 2026 has limited availability at The Grand Pavilion. For 120 guests with a garden ceremony, we'd recommend our Walled Garden setting. A member of the team will be with you shortly to discuss your vision in detail.", time: "2:14 PM" },
    ],
    "Aisha & Tom": [
      { from: "couple", text: "We're comparing a few venues. Can you tell us about packages?", time: "2:08 PM" },
      { from: "aura", text: "Welcome, Aisha & Tom! The Grand Pavilion offers three curated packages: The Signature (from £35k), The Bespoke (from £55k), and The Grand (from £85k). Each includes exclusive use of the estate. I'll have the venue coordinator share a full brochure with you shortly.", time: "2:08 PM" },
    ],
    "Elena & Marco": [
      { from: "couple", text: "The ballroom looks stunning! Do you offer winter weddings?", time: "1:56 PM" },
      { from: "aura", text: "Thank you, Elena & Marco! The Grand Pavilion is truly magical in winter. We offer a heated marquee extension and our renowned mulled wine reception. Let me connect you with our events team for details.", time: "1:57 PM" },
      { from: "vendor", text: "Thank you, Elena! Yes, our winter packages are very popular. We offer a full heated marquee extension and mulled wine reception.", time: "1:58 PM" },
      { from: "couple", text: "That sounds amazing. What's the capacity for a winter setup?", time: "1:59 PM" },
      { from: "vendor", text: "We can comfortably seat 80 guests for a winter ceremony, with standing room for 120 at the evening reception.", time: "2:01 PM" },
      { from: "couple", text: "Thanks so much! We'll be in touch soon.", time: "2:03 PM" },
    ],
    "Mark & Lisa": [
      { from: "couple", text: "Do you offer a payment plan for the deposit?", time: "1:12 PM" },
      { from: "aura", text: "Great question, Mark & Lisa! The Grand Pavilion offers flexible payment plans including a 3-month deposit arrangement. A team member will share the full details with you now.", time: "1:13 PM" },
      { from: "vendor", text: "Hi Mark & Lisa! Yes, we offer a 3-month payment plan for the initial deposit. I'll send you the details now.", time: "1:15 PM" },
    ],
  };

  const openChat = useCallback((chatName) => {
    setActiveChat(chatName);
    if (!chatMessages[chatName]) {
      setChatMessages(prev => ({ ...prev, [chatName]: CHAT_THREADS[chatName] || [] }));
    }
  }, [chatMessages]);

  const sendChatMsg = useCallback(() => {
    if (!chatMsg.trim() || !activeChat) return;
    const now = new Date();
    const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setChatMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), { from: "vendor", text: chatMsg.trim(), time }],
    }));
    setChatMsg("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [chatMsg, activeChat]);

  // ── Email compose modal ────────────────────────────────────────────────
  const [emailModal, setEmailModal] = useState(null); // null or { to, name, subject, body, template }
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const COUPLE_EMAILS = {
    "Sophie & James": "sophie@email.com",
    "Aisha & Tom": "aisha@email.com",
    "Elena & Marco": "elena@email.com",
    "Mark & Lisa": "mark@email.com",
    "Priya & Daniel": "priya@email.com",
    "Charlotte & Will": "charlotte@email.com",
  };

  const EMAIL_TEMPLATES = [
    { id: "custom", label: "Custom Email", subject: "", body: "" },
    { id: "thankyou", label: "Thank You for Your Enquiry", subject: "Thank you for your enquiry, The Grand Pavilion",
      body: "Dear {name},\n\nThank you so much for reaching out to The Grand Pavilion. We're delighted that you're considering us for your special day.\n\nWe'd love to learn more about your vision and discuss how we can make it a reality. Would you be available for a call or a venue visit this week?\n\nWarm regards,\nThe Grand Pavilion Team" },
    { id: "availability", label: "Availability Confirmation", subject: "Your date availability, The Grand Pavilion",
      body: "Dear {name},\n\nGreat news, we have availability on your requested date.\n\nI'd love to schedule a showround so you can experience the venue in person. We have slots available this week and next.\n\nShall I reserve a time for you?\n\nWarm regards,\nThe Grand Pavilion Team" },
    { id: "pricing", label: "Pricing & Packages", subject: "Your bespoke wedding package, The Grand Pavilion",
      body: "Dear {name},\n\nThank you for your interest in our wedding packages. I've attached our brochure with full pricing details.\n\nOur packages start from £12,500 and include exclusive venue hire, catering for up to 300 guests, a dedicated wedding coordinator, and complimentary bridal suite.\n\nI'd be happy to put together a bespoke quote tailored to your vision. Would you like to discuss further?\n\nWarm regards,\nThe Grand Pavilion Team" },
    { id: "followup", label: "Post-Showround Follow Up", subject: "Lovely to meet you, The Grand Pavilion",
      body: "Dear {name},\n\nIt was an absolute pleasure showing you around The Grand Pavilion today. I hope you could feel the magic of the space.\n\nAs discussed, I've reserved your preferred date provisionally for 14 days. To confirm, we'd need a £2,500 deposit.\n\nPlease don't hesitate to reach out with any questions. We'd be honoured to host your celebration.\n\nWarm regards,\nThe Grand Pavilion Team" },
    { id: "review", label: "Review Request", subject: "How was your experience?, The Grand Pavilion",
      body: "Dear {name},\n\nCongratulations once again on your beautiful wedding! It was a privilege to be part of your special day.\n\nWe'd be incredibly grateful if you could spare a moment to share your experience. Your feedback helps other couples discover their perfect venue.\n\nYou can leave a review here: [Review Link]\n\nWith warmest wishes,\nThe Grand Pavilion Team" },
  ];

  const openEmailModal = useCallback((recipientName) => {
    const email = COUPLE_EMAILS[recipientName] || "";
    const firstName = recipientName?.split(" & ")[0] || recipientName || "";
    setEmailModal({
      to: email,
      name: recipientName,
      subject: "",
      body: "",
      template: "custom",
    });
    setEmailSent(false);
  }, []);

  const applyTemplate = useCallback((templateId) => {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!tpl || !emailModal) return;
    const firstName = emailModal.name?.split(" & ")[0] || "";
    setEmailModal(prev => ({
      ...prev,
      template: templateId,
      subject: tpl.subject || prev.subject,
      body: (tpl.body || "").replace(/\{name\}/g, firstName) || prev.body,
    }));
  }, [emailModal]);

  const sendEmail = useCallback(() => {
    if (!emailModal?.to || !emailModal?.body?.trim()) return;
    setEmailSending(true);
    // Simulate sending
    setTimeout(() => {
      setEmailSending(false);
      setEmailSent(true);
      // Log in chat timeline
      const now = new Date();
      const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      if (emailModal.name && chatMessages[emailModal.name]) {
        setChatMessages(prev => ({
          ...prev,
          [emailModal.name]: [...(prev[emailModal.name] || []),
            { from: "system", text: `✉ Email sent: "${emailModal.subject}"`, time }
          ],
        }));
      }
      setTimeout(() => setEmailModal(null), 1500);
    }, 1200);
  }, [emailModal, chatMessages]);

  // ── Auto-wait message for queued conversations ─────────────────────────
  const sendWaitMsg = useCallback((chatName) => {
    const now = new Date();
    const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const waitMins = Math.floor(Math.random() * 3) + 2; // 2–4 minutes
    setChatMessages(prev => ({
      ...prev,
      [chatName]: [...(prev[chatName] || CHAT_THREADS[chatName] || []),
        { from: "vendor", text: `Thanks for reaching out! We're currently helping another couple, we'll be with you in approximately ${waitMins} minutes. ✦`, time, auto: true }
      ],
    }));
  }, []);

  // ── Delete / archive conversation ──────────────────────────────────────
  const [archivedChats, setArchivedChats] = useState(new Set());

  const archiveChat = useCallback((chatName) => {
    setArchivedChats(prev => { const n = new Set(prev); n.add(chatName); return n; });
    if (activeChat === chatName) setActiveChat(null);
  }, [activeChat]);

  // ── Live chat toggle ─────────────────────────────────────────────────
  const [liveChatEnabled, setLiveChatEnabled] = useState(true);

  // ── Zoom meeting state ──────────────────────────────────────────────────
  const [zoomDropdown, setZoomDropdown] = useState(null);
  const [zoomDate, setZoomDate] = useState("");
  const [zoomTime, setZoomTime] = useState("");
  const [zoomDuration, setZoomDuration] = useState("30");
  const [scheduledMeetings, setScheduledMeetings] = useState({});

  const scheduleZoom = useCallback(() => {
    if (!zoomDate || !zoomTime || !activeChat) return;
    const dateObj = new Date(zoomDate + "T" + zoomTime);
    const formatted = dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + " at " + dateObj.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const meetId = Math.random().toString(36).slice(2, 10);
    const now = new Date();
    const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setChatMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []),
        { from: "system", text: `\u2727 Video meeting scheduled \u2014 ${formatted} (${zoomDuration} min) \u00b7 Join: zoom.us/j/${meetId}`, time }
      ],
    }));
    setScheduledMeetings(prev => ({ ...prev, [activeChat]: { date: zoomDate, time: zoomTime, duration: zoomDuration, id: meetId } }));
    setZoomDropdown(null);
    setZoomDate("");
    setZoomTime("");
    setZoomDuration("30");
  }, [zoomDate, zoomTime, zoomDuration, activeChat]);

  // ── WhatsApp state ──────────────────────────────────────────────────────
  const [whatsappDropdown, setWhatsappDropdown] = useState(false);
  const [whatsappNumber] = useState("+44 7700 900123");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  // ── File upload + voice ─────────────────────────────────────────────────
  const fileInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  // ── Calendar ────────────────────────────────────────────────────────────
  const [calendarEvents] = useState([
    { date: "2026-03-15", title: "Showround \u2014 Sophie & James", type: "showround", time: "10:00 AM" },
    { date: "2026-03-18", title: "Tasting \u2014 Priya & Daniel", type: "tasting", time: "2:00 PM" },
    { date: "2026-03-22", title: "Wedding \u2014 Charlotte & Will", type: "wedding", time: "All Day" },
    { date: "2026-04-05", title: "Zoom Call \u2014 Elena & Marco", type: "meeting", time: "11:00 AM" },
    { date: "2026-04-12", title: "Showround \u2014 Aisha & Tom", type: "showround", time: "3:00 PM" },
  ]);

  const IS = {
    width: "100%",
    background: C.card,
    border: `1px solid ${C.border2}`,
    borderRadius: "var(--lwd-radius-input)",
    color: C.white,
    padding: "12px 14px",
    fontSize: 13,
    outline: "none",
    fontFamily: NU,
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  // Use real enquiries from Supabase if available, otherwise use mock data
  const leads = enquiries.length > 0 ? enquiries.map(e => ({
    id: e.id,
    name: e.couple_name || "Unknown Couple",
    email: e.couple_email || "no-email@example.com",
    date: e.event_date || "TBA",
    guests: e.guest_count || "TBA",
    budget: e.budget || "TBA",
    msg: e.message || "No message provided",
    status: e.status || "new",
    time: e.created_at ? new Date(e.created_at).toLocaleDateString() : "Recently",
  })) : [
    { id: 1, name: "Sophie & James", email: "sophie@email.com", date: "12 Jun 2025", guests: "80–150", budget: "£25–50k", msg: "We love your venue and would love to discuss availability for June 2025...", status: "new", time: "2 hrs ago" },
    { id: 2, name: "Priya & Daniel", email: "priya@email.com", date: "18 Sep 2025", guests: "150–300", budget: "£50–100k", msg: "We're planning a large Asian fusion celebration and your ballroom looks perfect...", status: "replied", time: "1 day ago" },
    { id: 3, name: "Elena & Marco", email: "elena@email.com", date: "3 Mar 2026", guests: "30–80", budget: "£10–25k", msg: "Looking for an intimate winter wedding venue in London...", status: "new", time: "3 hrs ago" },
    { id: 4, name: "Charlotte & Will", email: "charlotte@email.com", date: "21 Aug 2025", guests: "150–300", budget: "£50–100k", msg: "We saw your venue on Vogue Weddings and have been dreaming about it ever since...", status: "booked", time: "5 days ago" },
    { id: 5, name: "Aisha & Tom", email: "aisha@email.com", date: "14 Feb 2026", guests: "30–80", budget: "£25–50k", msg: "Valentine's Day wedding, is this something you'd consider?", status: "new", time: "6 hrs ago" },
  ];

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const leadsData = [12, 18, 15, 22, 28, 31, 29, 35, 38, 41, 47, 52];
  const viewsData = [320, 410, 380, 520, 680, 760, 710, 890, 940, 1020, 1240, 1380];

  const handleGenBio = () => {
    setGenBio(true);
    setAiBio("");
    const text = `The Grand Pavilion stands as London's most iconic wedding venue, a breathtaking Victorian ballroom where crystal chandeliers cast a golden glow across hand-carved marble floors. Exclusively yours for your wedding day, this legendary space accommodates up to 320 seated guests or 500 for a standing celebration.\n\nOur award-winning in-house culinary team craft bespoke menus for every couple, while our dedicated wedding concierge ensures every detail is flawlessly executed. With 60 luxurious guest bedrooms and an exquisite bridal suite, your entire wedding party can celebrate and stay in one magnificent location.\n\nWinner of the Hitched 2025 Award and featured in Vogue Weddings, The Grand Pavilion is where London's most extraordinary love stories begin.`;
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      setAiBio(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setGenBio(false); }
    }, 20);
  };

  const DTab = ({ id, label, icon }) => (
    <button
      onClick={() => { setDashTab(id); if (isMobile) setSidebarOpen(false); }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        background: dashTab === id ? "rgba(201,168,76,0.1)" : "none",
        borderTop: 0,
        borderRight: 0,
        borderBottom: 0,
        borderLeft: dashTab === id ? `2px solid ${C.gold}` : "2px solid transparent",
        color: dashTab === id ? C.gold : C.grey,
        padding: sidebarOpen ? "12px 20px" : "12px 14px",
        fontSize: 13,
        fontWeight: dashTab === id ? 700 : 400,
        cursor: "pointer",
        fontFamily: NU,
        textAlign: "left",
        transition: "all 0.2s",
        justifyContent: sidebarOpen ? "flex-start" : "center",
      }}
    >
      {icon} {sidebarOpen && label}
    </button>
  );

  const StatCard = ({ label, val, change, icon, color = C.gold }) => (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: isMobile ? "14px 16px" : "20px 22px" }}>
      <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: GD, fontSize: isMobile ? 26 : 36, fontWeight: 600, color, lineHeight: 1 }}>{val}</div>
      {change && <div style={{ fontFamily: NU, fontSize: 12, color: C.green, marginTop: 6 }}>↑ {change} this month</div>}
    </div>
  );

  // Check authentication status
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <p style={{ fontFamily: NU, fontSize: 13, color: "#666" }}>Loading...</p>
      </div>
    );
  }

  // Dev mode: Allow access without authentication
  // TODO: Re-enable authentication check in production

  return (
    <ThemeCtx.Provider value={C}>

    {/* ── Admin Access Mode Banner ──────────────────────────────────────────── */}
    {/* Shown only when admin is accessing this vendor dashboard directly.       */}
    {/* Click "Return to Admin" to exit and go back to /admin.                  */}
    {vendor?.isAdminPreview && (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "linear-gradient(90deg, #1a0a00, #2a1200)",
        borderBottom: "2px solid #c9a84c",
        padding: "8px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontFamily: "var(--font-body)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            background: "#c9a84c",
            color: "#0f0d0a",
            padding: "3px 8px",
            borderRadius: 2,
          }}>
            Admin Access Mode
          </span>
          <span style={{ fontSize: 12, color: "#c9a84c", fontWeight: 500 }}>
            Viewing as vendor: <strong>{vendor?.name || vendor?.id}</strong>
          </span>
          <span style={{ fontSize: 11, color: "rgba(201,168,76,0.5)" }}>
           , changes here are real
          </span>
        </div>
        <button
          onClick={exitAdminPreview}
          style={{
            background: "none",
            border: "1px solid rgba(201,168,76,0.5)",
            borderRadius: 3,
            color: "#c9a84c",
            fontSize: 10,
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "5px 14px",
            cursor: "pointer",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.15)"; e.currentTarget.style.borderColor = "#c9a84c"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; }}
        >
          ← Return to Admin
        </button>
      </div>
    )}
    {/* Spacer so content doesn't sit under the fixed banner */}
    {vendor?.isAdminPreview && <div style={{ height: 42 }} />}
    {/* ── End Admin Access Mode Banner ─────────────────────────────────────── */}

    {/* Notification slide-in animation */}
    <style>{`
      @keyframes chatNotifSlideIn {
        from { transform: translateX(420px); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
      }
    `}</style>

    {/* Live chat notification popup */}
    <ChatNotification notification={chatNotif} C={C} onAccept={acceptChat} onDismiss={dismissChat} isMobile={isMobile} />

    {/* ─── Email Compose Modal ─── */}
    {emailModal && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }} onClick={(e) => { if (e.target === e.currentTarget) setEmailModal(null); }}>
        <div style={{
          width: isMobile ? "calc(100vw - 32px)" : 640, maxHeight: "90vh", background: C.card,
          border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "chatNotifSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}>
          {/* Gold bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.gold2})` }} />

          {/* Header */}
          <div style={{
            padding: isMobile ? "12px 16px" : "16px 24px", borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, fontWeight: 700, marginBottom: 2 }}>
                {"\u2709"} Compose Email
              </div>
              <div style={{ fontFamily: GD, fontSize: 18, color: C.white }}>
                Send to {emailModal.name}
              </div>
            </div>
            <button onClick={() => setEmailModal(null)} style={{
              background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
              color: C.grey, padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: NU,
            }}>✕</button>
          </div>

          {/* Template selector */}
          <div style={{ padding: isMobile ? "10px 16px" : "12px 24px", borderBottom: `1px solid ${C.border}`, background: C.dark }}>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.grey, marginBottom: 8 }}>
              Quick Templates
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {EMAIL_TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => applyTemplate(tpl.id)} style={{
                  background: emailModal.template === tpl.id ? C.goldDim : "transparent",
                  border: `1px solid ${emailModal.template === tpl.id ? C.gold : C.border2}`,
                  borderRadius: "var(--lwd-radius-input)", padding: "5px 10px", cursor: "pointer",
                  fontFamily: NU, fontSize: 10, color: emailModal.template === tpl.id ? C.gold : C.grey,
                  transition: "all 0.15s",
                }}>{tpl.label}</button>
              ))}
            </div>
          </div>

          {/* Form body */}
          <div style={{ padding: isMobile ? "12px 16px" : "16px 24px", flex: 1, overflowY: "auto" }}>
            {/* To */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: NU, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: C.grey, display: "block", marginBottom: 4 }}>To</label>
              <div style={{
                padding: "10px 14px", background: C.dark, border: `1px solid ${C.border}`,
                borderRadius: "var(--lwd-radius-input)", fontFamily: NU, fontSize: 13, color: C.white,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontWeight: 600 }}>{emailModal.name}</span>
                <span style={{ color: C.grey, fontSize: 12 }}>‹{emailModal.to}›</span>
              </div>
            </div>
            {/* From */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: NU, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: C.grey, display: "block", marginBottom: 4 }}>From</label>
              <div style={{
                padding: "10px 14px", background: C.dark, border: `1px solid ${C.border}`,
                borderRadius: "var(--lwd-radius-input)", fontFamily: NU, fontSize: 13, color: C.grey,
              }}>
                The Grand Pavilion ‹hello@grandpavilion.com› <span style={{ color: C.gold, fontSize: 10, marginLeft: 6 }}>via LWD</span>
              </div>
            </div>
            {/* Subject */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: NU, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: C.grey, display: "block", marginBottom: 4 }}>Subject</label>
              <input
                value={emailModal.subject}
                onChange={e => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter subject line..."
                style={{
                  width: "100%", padding: "10px 14px", background: C.dark,
                  border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
                  fontFamily: NU, fontSize: 13, color: C.white, outline: "none",
                  boxSizing: "border-box", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.border2}
              />
            </div>
            {/* Body */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <label style={{ fontFamily: NU, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: C.grey }}>Message</label>
                <button style={{
                  background: C.goldDim, border: `1px solid rgba(201,168,76,0.3)`,
                  borderRadius: "var(--lwd-radius-input)", padding: "3px 10px", cursor: "pointer",
                  fontFamily: NU, fontSize: 9, letterSpacing: "1px", textTransform: "uppercase",
                  color: C.gold, fontWeight: 600,
                }}>✧ AI Rewrite</button>
              </div>
              <textarea
                value={emailModal.body}
                onChange={e => setEmailModal(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Compose your email..."
                rows={10}
                style={{
                  width: "100%", padding: "14px", background: C.dark,
                  border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
                  fontFamily: NU, fontSize: 13, color: C.white, outline: "none",
                  boxSizing: "border-box", resize: "vertical", lineHeight: 1.7,
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = C.border2}
              />
            </div>

            {/* Email preview note */}
            <div style={{
              padding: "10px 14px", background: C.goldDim,
              border: `1px solid rgba(201,168,76,0.2)`, borderRadius: "var(--lwd-radius-card)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontFamily: NU, fontSize: 10, color: C.gold }}>✦</span>
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
                Sent via <span style={{ color: C.gold, fontWeight: 600 }}>Luxury Wedding Directory</span> · Branded email template · Logged in conversation history
              </span>
            </div>
          </div>

          {/* Footer actions */}
          <div style={{
            padding: isMobile ? "12px 16px" : "14px 24px", borderTop: `1px solid ${C.border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
          }}>
            <div style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>
              Powered by <span style={{ color: C.gold, fontWeight: 600 }}>Taigenic.ai</span> · Part of 5 Star Weddings Ltd.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEmailModal(null)} style={{
                background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)",
                padding: "10px 20px", cursor: "pointer",
                fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: "1px",
                textTransform: "uppercase", color: C.grey,
              }}>Cancel</button>
              <button onClick={sendEmail} disabled={emailSending || !emailModal.body?.trim()} style={{
                background: emailModal.body?.trim() ? `linear-gradient(135deg, ${C.gold}, ${C.gold2})` : C.dark,
                border: emailModal.body?.trim() ? "none" : `1px solid ${C.border2}`,
                borderRadius: "var(--lwd-radius-input)", padding: "10px 28px", cursor: emailModal.body?.trim() ? "pointer" : "default",
                fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: emailModal.body?.trim() ? "#0f0d0a" : C.grey,
                transition: "all 0.2s",
                opacity: emailSending ? 0.6 : 1,
              }}>
                {emailSent ? "✓ Sent!" : emailSending ? "Sending..." : "✉ Send Email"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    <div style={{ height: "100vh", background: C.dark, display: "flex", flexDirection: "column" }}>
      {/* Dashboard nav */}
      <div
        style={{
          background: C.dark,
          borderBottom: `1px solid ${C.border}`,
          padding: isMobile ? "10px 16px" : isTablet ? "12px 20px" : "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
          {isMobile && <button onClick={() => setSidebarOpen(s => !s)} style={{ background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)", color: C.gold, padding: "7px 10px", fontSize: 16, cursor: "pointer", fontFamily: NU }}>&#9776;</button>}
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-input)",
              color: C.grey,
              padding: "7px 14px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: NU,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            {isMobile ? "\u2190" : "\u2190 Back to Site"}
          </button>
          {!isMobile && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: GD, fontSize: 18, color: C.white, fontWeight: 600 }}>
              Luxury Wedding Directory <span style={{ color: C.gold }}>·</span> Vendor Portal
            </div>
            {!isMobile && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ fontFamily: NU, fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>✧ Powered by Taigenic.ai</span>
              <span style={{ fontFamily: NU, fontSize: 8, color: C.grey2, fontWeight: 300 }}>· Part of 5 Star Weddings Ltd.</span>
            </div>}
          </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
          <button
            onClick={() => {
              const root = document.documentElement;
              const currentMode = root.getAttribute("data-lwd-mode") || "light";
              const newMode = currentMode === "dark" ? "light" : "dark";
              root.setAttribute("data-lwd-mode", newMode);
              localStorage.setItem("lwd_user_theme", newMode);
              setTimeout(() => { window.location.reload(); }, 50);
            }}
            style={{
              background: currentTheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-input)",
              color: C.gold,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.25s ease",
            }}
            title={currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {currentTheme === "dark" ? "\u2600" : "\u263E"}
          </button>
          <div
            style={{
              width: 8,
              height: 8,
              background: C.green,
              borderRadius: "50%",
              animation: "pulse 2s infinite",
            }}
          />
          {!isMobile && <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Live · {vendor.name}</span>}
          <div
            style={{
              width: 32,
              height: 32,
              background: C.goldDim,
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "var(--lwd-radius-image)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: C.gold,
              fontFamily: GD,
            }}
          >
            GP
          </div>
          {/* Logout Button */}
          <button
            onClick={async () => {
              await logout();
              // Redirect to login using custom router history
              if (onVendorLogin) {
                onVendorLogin();
              } else {
                window.history.pushState(null, "", "/vendor/login");
                window.location.href = "/vendor/login";
              }
            }}
            style={{
              background: "rgba(220,38,38,0.1)",
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-input)",
              color: "#dc2626",
              padding: "6px 12px",
              fontFamily: NU,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, alignItems: "stretch", overflow: "auto" }}>
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 7999 }} />}
        {/* Sidebar */}
        <div style={{
          ...(isMobile ? {
            position: "fixed", top: 0, left: 0, bottom: 0, width: 280, zIndex: 8000,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
          } : {
            width: sidebarOpen ? 280 : 70,
            flexShrink: 0,
            transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)",
            display: "flex",
            flexDirection: "column",
          }),
          background: C.dark, borderRight: `1px solid ${C.border}`, paddingTop: 24,
          boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}>
          {/* Close button on mobile only */}
          {isMobile && <button onClick={() => setSidebarOpen(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: C.grey, fontSize: 18, cursor: "pointer", zIndex: 10 }}>✕</button>}

          {/* Collapse button on desktop */}
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                position: "absolute",
                top: 24,
                right: 8,
                background: "none",
                border: "none",
                color: C.grey,
                fontSize: 18,
                cursor: "pointer",
                padding: "4px 8px",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => e.target.style.color = C.gold}
              onMouseLeave={e => e.target.style.color = C.grey}
            >
              ›
            </button>
          )}

          <div style={{ padding: sidebarOpen ? "0 20px 20px" : "0 12px 20px", borderBottom: `1px solid ${C.border}`, minWidth: 0 }}>
            {sidebarOpen && (
              <>
                <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>
                  Your Listing
                </div>
                <div style={{ fontFamily: NU, fontSize: 14, color: C.white, fontWeight: 600 }}>{vendor.name}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <Badge text="Featured" />
                  <Badge text="Verified" color={C.green} bg="rgba(34,197,94,0.08)" border="rgba(34,197,94,0.2)" />
                </div>
              </>
            )}
          </div>
          <div style={{ paddingTop: 8 }}>
            <DTab id="overview" icon="◈" label="Overview" />
            <DTab id="leads" icon="◇" label="Lead Inbox" />
            <DTab id="livechat" icon="◉" label="Live Conversations" />
            <DTab id="analytics" icon="◎" label="Analytics" />
            <DTab id="ai" icon="✧" label="AI Insights" />
            <DTab id="profile" icon="✦" label="My Profile" />
            <DTab id="seo" icon="⊡" label="SEO Tools" />
            <DTab id="billing" icon="◆" label="Billing" />
            <DTab id="calendar" icon="▦" label="Calendar" />
            <DTab id="awards" icon="✦" label="Artistry Awards" />
          </div>
          {sidebarOpen && (
            <div
              style={{
                margin: "24px 16px 0",
                padding: 16,
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "var(--lwd-radius-card)",
              }}
            >
              <div style={{ fontFamily: NU, fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 4 }}>{"\u2726"} FEATURED PLAN</div>
              <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.6 }}>Unlimited leads {"\u00b7"} Top placement {"\u00b7"} Analytics</div>
              <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 8 }}>Renews 1 Mar 2026</div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{
          flex: 1,
          padding: isMobile ? 16 : isTablet ? 20 : 32,
          overflowY: "auto",
          marginLeft: !isMobile && !sidebarOpen ? "auto" : 0,
          marginRight: !isMobile && !sidebarOpen ? "auto" : 0,
          maxWidth: !isMobile && !sidebarOpen ? "900px" : "100%",
        }}>
          {/* OVERVIEW */}
          {dashTab === "overview" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>Dashboard Overview</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
                  <h2 style={{ fontFamily: GD, fontSize: isMobile ? 24 : 32, color: C.white, fontWeight: 600, margin: 0 }}>Good morning, Grand Pavilion {"\u2726"}</h2>
                  <button
                    onClick={() => {
                      const slug = vendor.name.toLowerCase().replace(/\s+/g, "-");
                      window.open(`/listing/${slug}`, "_blank");
                    }}
                    style={{
                      background: "none",
                      border: `1px solid ${C.gold}`,
                      color: C.gold,
                      fontFamily: NU,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      padding: "10px 24px",
                      borderRadius: "var(--lwd-radius-input)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = C.gold;
                      e.currentTarget.style.color = "#0a0906";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = C.gold;
                    }}
                  >
                    ◆ View Public Listing
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 16, marginBottom: 32 }}>
                <StatCard label="New Enquiries" val={metricsLoading ? " - " : metrics?.newEnquiries || 0} change="Real-time" icon="◇" />
                <StatCard label="Profile Views" val={metricsLoading ? " - " : (metrics?.profileViews || 0).toLocaleString()} change="Real-time" icon="⊙" color={C.blue} />
                <StatCard label="Conversion Rate" val={metricsLoading ? " - " : `${metrics?.conversionRate || 0}%`} icon="△" color={C.green} />
                <StatCard label="Avg Response Time" val={metricsLoading ? " - " : `${metrics?.responseTimeHours || 0}h`} icon="⟡" color="#a78bfa" />
              </div>

              {/* ── Shortlist/Favorites (B2B) ──────────────────────────────────── */}
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: "var(--lwd-radius-card)",
                  padding: 20,
                  marginBottom: 28,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      background: `linear-gradient(135deg, ${C.gold}20, ${C.gold}10)`,
                      borderRadius: "var(--lwd-radius-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                    }}
                  >
                    ♥
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontFamily: NU,
                        fontSize: 11,
                        color: C.grey,
                        margin: 0,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        fontWeight: 600,
                      }}
                    >
                      Saved by Couples
                    </p>
                    <p
                      style={{
                        fontFamily: GD,
                        fontSize: 24,
                        color: C.gold,
                        margin: "4px 0 0 0",
                        fontWeight: 400,
                      }}
                    >
                      {metricsLoading ? " - " : metrics?.savedByCouples || 0}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontFamily: NU,
                        fontSize: 12,
                        color: C.green,
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      ↑ +12%
                    </p>
                    <p
                      style={{
                        fontFamily: NU,
                        fontSize: 10,
                        color: C.grey,
                        margin: "2px 0 0 0",
                      }}
                    >
                      This month
                    </p>
                  </div>
                </div>
              </div>

              {/* ── LWD Curated Index ──────────────────────────────────── */}
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: "var(--lwd-radius-card)",
                  padding: 28,
                  marginBottom: 28,
                }}
              >
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 32, flexWrap: "wrap" }}>
                  {/* Left column – score */}
                  <div
                    style={{
                      minWidth: 140,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: NU,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "2.5px",
                        textTransform: "uppercase",
                        color: C.gold,
                        marginBottom: 8,
                      }}
                    >
                      {"\u2726"} LWD CURATED INDEX
                    </div>
                    <div
                      style={{
                        fontFamily: GD,
                        fontSize: isMobile ? 42 : 56,
                        color: C.gold,
                        lineHeight: 1,
                      }}
                    >
                      {(vendor.lwdScore / 10).toFixed(1)}
                    </div>
                    <div
                      style={{
                        fontFamily: NU,
                        fontSize: 11,
                        color: C.grey,
                        marginTop: 4,
                      }}
                    >
                      out of 10.0
                    </div>
                  </div>

                  {/* Right column – breakdown */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: NU,
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.white,
                        marginBottom: 14,
                      }}
                    >
                      Score Breakdown
                    </div>
                    {(() => {
                      const indexResult = computeCuratedIndex(vendor);
                      return Object.entries(FACTOR_LABELS).map(([key, label]) => ({
                        label,
                        value: indexResult.breakdown[key] != null
                          ? Math.round(indexResult.breakdown[key] * 10)  // 0–10 → 0–100%
                          : null,
                      })).filter((item) => item.value != null);
                    })().map((item) => (
                      <div key={item.label} style={{ marginBottom: 10 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>
                            {item.label}
                          </span>
                          <span
                            style={{
                              fontFamily: NU,
                              fontSize: 12,
                              color: C.white,
                              fontWeight: 700,
                            }}
                          >
                            {item.value}%
                          </span>
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: C.border,
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${item.value}%`,
                              height: "100%",
                              background: `linear-gradient(90deg, ${C.gold}, ${C.gold2 || C.gold})`,
                              borderRadius: 2,
                              transition: "width 0.6s ease",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    marginTop: 20,
                    paddingTop: 18,
                  }}
                >
                  <div
                    style={{
                      fontFamily: NU,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: C.white,
                      marginBottom: 12,
                    }}
                  >
                    HOW TO IMPROVE YOUR SCORE
                  </div>
                  {[
                    "Add a video tour to boost Presentation Quality",
                    "Respond to new enquiries within 2 hours",
                    "Encourage recent couples to leave a review",
                  ].map((tip) => (
                    <div
                      key={tip}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ color: C.green, fontSize: 13 }}>→</span>
                      <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>
                        {tip}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Recent Enquiries</span>
                  <button onClick={() => setDashTab("leads")} style={{ background: "none", border: "none", color: C.gold, fontSize: 12, cursor: "pointer", fontFamily: NU, letterSpacing: "1px" }}>View All →</button>
                </div>
                {leads.slice(0, 3).map((l) => (
                  <LeadRow key={l.id} lead={l} />
                ))}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 24 }}>
                <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 20 }}>Lead Volume, Last 12 Months</div>
                <MiniChart data={leadsData} labels={months} color={C.gold} />
              </div>
            </div>
          )}

          {/* LEADS */}
          {dashTab === "leads" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>Lead Management</div>
                <h2 style={{ fontFamily: GD, fontSize: isMobile ? 24 : 32, color: C.white, fontWeight: 600 }}>Enquiry Inbox</h2>
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                {[
                  ["All", leads.length],
                  ["New", leads.filter((l) => l.status === "new").length],
                  ["Replied", leads.filter((l) => l.status === "replied").length],
                  ["Booked", leads.filter((l) => l.status === "booked").length],
                ].map(([l, c]) => (
                  <div
                    key={l}
                    style={{
                      padding: "8px 16px",
                      background: C.card,
                      border: `1px solid ${C.border2}`,
                      borderRadius: "var(--lwd-radius-input)",
                      fontSize: 12,
                      fontFamily: NU,
                      color: C.white,
                      cursor: "pointer",
                    }}
                  >
                    {l} <span style={{ color: C.gold, fontWeight: 700 }}>({c})</span>
                  </div>
                ))}
              </div>
              {leads.map((l) => (
                <LeadRow key={l.id} lead={l} expanded />
              ))}
            </div>
          )}

          {/* LEAD INBOX, Mini CRM Pipeline */}
          {dashTab === "leads" && (
            <VendorLeadInbox vendorId={vendor.id} C={C} isMobile={isMobile} />
          )}

          {/* INQUIRIES */}
          {dashTab === "inquiries" && (
            <VendorInquiryManager vendorId={vendor.id} />
          )}

          {/* LIVE CONVERSATIONS, Client Intelligence System */}
          {dashTab === "livechat" && (
            <div>
              <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end" }}>
                <div>
                  <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>Client Intelligence</div>
                  <h2 style={{ fontFamily: GD, fontSize: isMobile ? 24 : 32, color: C.white, fontWeight: 600, margin: 0 }}>Live Conversations</h2>
                </div>
                {/* Live Chat Toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: liveChatEnabled ? C.green : C.grey, fontWeight: 600 }}>
                    {liveChatEnabled ? "● Online" : "○ Offline"}
                  </span>
                  <button onClick={() => setLiveChatEnabled(e => !e)} style={{
                    width: 44, height: 24, borderRadius: 12, cursor: "pointer", border: "none",
                    background: liveChatEnabled ? C.green : C.border2,
                    position: "relative", transition: "background 0.25s",
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", background: "#fff",
                      position: "absolute", top: 2,
                      left: liveChatEnabled ? 22 : 2,
                      transition: "left 0.25s cubic-bezier(0.16,1,0.3,1)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }} />
                  </button>
                </div>
              </div>

              {/* Engagement Performance + Revenue Intelligence */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 16, marginBottom: 12 }}>
                <StatCard label="Live Enquiries" val="2" icon="◉" color={C.green} />
                <StatCard label="Response Intelligence" val="< 1m" icon="⟡" color={C.blue} />
                <StatCard label="Client Sessions Today" val="14" change="22%" icon="◇" />
                <div style={{ position: "relative" }}
                  onMouseEnter={() => setEngagementTooltip(true)}
                  onMouseLeave={() => setEngagementTooltip(false)}
                >
                  <StatCard label="Engagement Score" val="98%" icon="✦" color={C.green} />
                  {engagementTooltip && (
                    <div style={{
                      position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                      width: isMobile ? "auto" : 220, background: "#111214",
                      borderTop: `2px solid ${C.gold}`, borderRadius: "var(--lwd-radius-card)",
                      padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                      zIndex: 20,
                    }}>
                      <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>How it's calculated</div>
                      <p style={{ fontFamily: NU, fontSize: 11, color: "#e5e7eb", margin: 0, lineHeight: 1.5 }}>Based on response time, interaction depth, and reply rate</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue Opportunity Missed, luxury urgency banner */}
              <div style={{
                display: "flex", alignItems: isMobile ? "flex-start" : "center",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 8 : 0,
                background: "#1a1214", borderLeft: "3px solid #C41E3A",
                borderRadius: "var(--lwd-radius-card)", padding: isMobile ? "12px 16px" : "10px 20px",
                marginBottom: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: isMobile ? "unset" : 1 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#C41E3A", flexShrink: 0 }} />
                  <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#C41E3A" }}>Revenue Opportunity Missed</span>
                </div>
                <div style={{ flex: isMobile ? "unset" : 2, textAlign: isMobile ? "left" : "center" }}>
                  <span style={{ fontFamily: NU, fontSize: 12, color: "#e5e7eb" }}>3 high-intent enquiries not replied within 4 hours</span>
                </div>
                <div style={{ flex: isMobile ? "unset" : 1, textAlign: isMobile ? "left" : "right" }}>
                  <span style={{ fontFamily: GD, fontSize: 16, fontWeight: 600, color: "#C41E3A" }}>Potential value: £48k</span>
                </div>
              </div>

              {/* Revenue Intelligence Row */}
              <div style={{
                display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 20,
              }}>
                {[
                  { label: "Estimated Pipeline Value", val: "£285k", icon: "◈", color: C.gold },
                  { label: "High-Intent Enquiries", val: "4", icon: "✧", color: C.green },
                  { label: "Hot Leads This Week", val: "7", icon: "△", color: "#a78bfa" },
                ].map(s => (
                  <div key={s.label} style={{
                    background: C.card, borderRadius: "var(--lwd-radius-card)",
                    padding: "16px 18px",
                    borderTop: `2px solid ${s.color}`,
                    borderRight: `1px solid ${C.border}`,
                    borderBottom: `1px solid ${C.border}`,
                    borderLeft: `1px solid ${C.border}`,
                  }}>
                    <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>
                      {s.icon} {s.label}
                    </div>
                    <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.val}</div>
                    {s.label === "Estimated Pipeline Value" && (
                      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                        <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>Pipeline Confidence: <span style={{ color: C.gold, fontWeight: 700 }}>72%</span></span>
                        <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>Projected Conversion: <span style={{ color: C.green, fontWeight: 700 }}>18%</span></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pipeline Confidence Breakdown */}
              <div style={{
                display: "flex", flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 8 : 16, marginBottom: 12,
              }}>
                {[
                  { label: "High Confidence", val: "£120k", accent: "#22c55e" },
                  { label: "Medium", val: "£90k", accent: C.gold },
                  { label: "Early Stage", val: "£75k", accent: "#6b7280" },
                ].map(tier => (
                  <div key={tier.label} style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 10,
                    background: C.card, borderLeft: `3px solid ${tier.accent}`,
                    borderRadius: 2, padding: "8px 14px",
                  }}>
                    <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>{tier.label}</span>
                    <span style={{ fontFamily: GD, fontSize: 16, fontWeight: 600, color: tier.accent, marginLeft: "auto" }}>{tier.val}</span>
                  </div>
                ))}
              </div>

              {/* Gold divider */}
              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}40, transparent)`, marginBottom: 20 }} />

              {/* Split: conversation list + chat window, ALWAYS DARK luxury treatment */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : (activeChat ? (isTablet ? "280px 1fr" : "320px 1fr") : "1fr"), gap: 0, border: "none", borderRadius: 4, overflow: "hidden", height: isMobile ? "calc(100vh - 280px)" : isTablet ? 480 : 520, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>

                {/* ─── Conversation list (left panel), dark layered ─── */}
                <div style={{ background: "#141517", borderRight: activeChat ? "1px solid #2a2b2f" : "none", display: isMobile && activeChat ? "none" : "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ padding: "12px 18px", borderBottom: "1px solid #2a2b2f", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, minHeight: 58, boxSizing: "border-box" }}>
                    <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: "#ffffff" }}>Client Enquiries</span>
                    <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "#22c55e", fontWeight: 600 }}>◉ {liveChatEnabled ? "2 Live" : "Offline"}</span>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                  {[
                    { name: "Sophie & James", msg: "Hi! We love your venue, is June 2026 available?", time: "Just now", status: "active", unread: 2, value: "£65–120k", intent: "high" },
                    { name: "Aisha & Tom", msg: "We're comparing a few venues. Can you tell us about packages?", time: "3m ago", status: "active", unread: 1, value: "£45–80k", intent: "medium" },
                    { name: "Elena & Marco", msg: "Thanks so much! We'll be in touch soon.", time: "18m ago", status: "ended", unread: 0, value: "£25–50k", intent: "high" },
                    { name: "Mark & Lisa", msg: "Do you offer a payment plan for the deposit?", time: "1h ago", status: "ended", unread: 0, value: "£80–150k", intent: "high" },
                  ].filter(c => !archivedChats.has(c.name)).map((chat, i) => (
                    <div key={i} onClick={() => openChat(chat.name)} style={{
                      padding: "14px 18px", borderBottom: "1px solid #1e1f23",
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                      background: activeChat === chat.name ? "#1e1f23" : "transparent",
                      borderLeft: activeChat === chat.name ? `3px solid ${C.gold}` : "3px solid transparent",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (activeChat !== chat.name) e.currentTarget.style.background = "#1a1b1e"; }}
                    onMouseLeave={e => { if (activeChat !== chat.name) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: "var(--lwd-radius-image)", flexShrink: 0,
                        background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: GD, fontSize: 11, color: C.gold,
                      }}>
                        {chat.name.split(" ")[0][0]}{chat.name.includes("&") ? chat.name.split("& ")[1]?.[0] || "" : ""}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontFamily: NU, fontSize: 12, fontWeight: chat.unread ? 700 : 400, color: "#ffffff" }}>{chat.name}</span>
                          <span style={{ fontFamily: NU, fontSize: 9, color: "#6b7280" }}>{chat.time}</span>
                        </div>
                        <div style={{ fontFamily: NU, fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
                          {chat.msg}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: NU, fontSize: 9, color: "#e5e7eb", fontWeight: 600 }}>{chat.value}</span>
                          <span style={{
                            fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                            color: chat.intent === "high" ? "#22c55e" : C.gold2,
                            padding: "1px 5px", borderRadius: 2,
                            background: chat.intent === "high" ? "rgba(34,197,94,0.1)" : "rgba(201,168,76,0.1)",
                          }}>{chat.intent === "high" ? "◈ Hot" : "◇ Warm"}</span>
                          <span style={{
                            fontFamily: NU, fontSize: 8, letterSpacing: "0.5px",
                            color: takenOverChats.has(chat.name) ? "#60a5fa" : "#a78bfa",
                            padding: "1px 5px", borderRadius: 2,
                            background: takenOverChats.has(chat.name) ? "rgba(96,165,250,0.1)" : "rgba(167,139,250,0.1)",
                          }}>{takenOverChats.has(chat.name) ? "◉ You" : "✧ Aura"}</span>
                          {CHAT_SOURCES[chat.name] && <span style={{ fontFamily: NU, fontSize: 8, color: "#6b7280" }}>via {CHAT_SOURCES[chat.name].source}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        {chat.unread > 0 && (
                          <span style={{
                            width: 18, height: 18, borderRadius: "50%",
                            background: C.gold, color: "#0f0d0a",
                            fontFamily: NU, fontSize: 9, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>{chat.unread}</span>
                        )}
                        <span style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: chat.status === "active" ? "#22c55e" : "#4b5563",
                          boxShadow: chat.status === "active" ? "0 0 6px #22c55e" : "none",
                        }} />
                      </div>
                    </div>
                  ))}
                  </div>
                </div>

                {/* ─── Chat window (right panel) ─── */}
                {activeChat && (
                  <div style={{ display: "flex", flexDirection: "column", background: "#111214", overflow: "hidden" }}>
                    {/* Chat header */}
                    <div style={{
                      padding: "12px 20px", background: "#1c1d21",
                      borderBottom: "1px solid #2e2f33", minHeight: 58, boxSizing: "border-box",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      flexWrap: "wrap", gap: 8,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {isMobile && <button onClick={() => setActiveChat(null)} style={{ background: "none", border: "none", color: "#ffffff", fontSize: 13, cursor: "pointer", fontFamily: NU, marginRight: 6, padding: 0 }}>←</button>}
                        <div style={{
                          width: 32, height: 32, borderRadius: "var(--lwd-radius-image)",
                          background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: GD, fontSize: 11, color: C.gold,
                        }}>
                          {activeChat.split(" ")[0][0]}{activeChat.includes("&") ? activeChat.split("& ")[1]?.[0] || "" : ""}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{activeChat}</span>
                            {CHAT_SOURCES[activeChat] && <span style={{ fontFamily: NU, fontSize: 8, color: "#6b7280", letterSpacing: "0.5px" }}>via {CHAT_SOURCES[activeChat].source}</span>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: NU, fontSize: 10, color: "#22c55e" }}>◉ Online now</span>
                            <span style={{ fontFamily: NU, fontSize: 9, color: takenOverChats.has(activeChat) ? "#60a5fa" : "#a78bfa" }}>
                              {takenOverChats.has(activeChat) ? "· You're managing" : "· Aura is assisting"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        {!takenOverChats.has(activeChat) ? (
                          <button onClick={() => setTakenOverChats(prev => { const n = new Set(prev); n.add(activeChat); return n; })} style={{
                            background: "#C41E3A", border: "none",
                            borderRadius: "var(--lwd-radius-input)", color: "#ffffff", padding: "5px 12px", fontSize: 10, cursor: "pointer",
                            fontFamily: NU, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                          }}>◈ Take Over</button>
                        ) : (
                          <button onClick={() => setTakenOverChats(prev => { const n = new Set(prev); n.delete(activeChat); return n; })} style={{
                            background: "none", border: "1px solid #3d3e42",
                            borderRadius: "var(--lwd-radius-input)", color: "#9ca3af", padding: "5px 12px", fontSize: 10, cursor: "pointer",
                            fontFamily: NU, letterSpacing: "0.5px",
                          }}>Return to Aura</button>
                        )}
                        <div style={{ position: "relative" }}>
                          <button onClick={() => setZoomDropdown(zoomDropdown === activeChat ? null : activeChat)} style={{
                            background: scheduledMeetings[activeChat] ? C.goldDim : "none",
                            border: `1px solid ${scheduledMeetings[activeChat] ? C.gold : "#3d3e42"}`,
                            borderRadius: "var(--lwd-radius-input)", color: scheduledMeetings[activeChat] ? C.gold : "#ffffff",
                            padding: "5px 10px", fontSize: 10, cursor: "pointer",
                            fontFamily: NU, letterSpacing: "0.5px",
                            transition: "border-color 0.15s, color 0.15s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                          onMouseLeave={e => { if (!scheduledMeetings[activeChat]) { e.currentTarget.style.borderColor = "#3d3e42"; e.currentTarget.style.color = "#ffffff"; }}}
                          >◈ Zoom{scheduledMeetings[activeChat] ? " ●" : ""}</button>
                          {zoomDropdown === activeChat && (
                            <div style={{
                              position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100,
                              width: 280, background: "#1e1f23", border: `1px solid ${C.border}`,
                              borderRadius: "var(--lwd-radius-card)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                              padding: 16,
                            }}>
                              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.gold, marginBottom: 10, fontWeight: 700 }}>{"\u2727"} Schedule Meeting</div>
                              <div style={{ marginBottom: 8 }}>
                                <label style={{ fontFamily: NU, fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 4 }}>Date</label>
                                <input type="date" value={zoomDate} onChange={e => setZoomDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#111214", border: "1px solid #2a2b2f", borderRadius: "var(--lwd-radius-input)", color: "#e5e7eb", fontFamily: NU, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <label style={{ fontFamily: NU, fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 4 }}>Time</label>
                                <input type="time" value={zoomTime} onChange={e => setZoomTime(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#111214", border: "1px solid #2a2b2f", borderRadius: "var(--lwd-radius-input)", color: "#e5e7eb", fontFamily: NU, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <label style={{ fontFamily: NU, fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 4 }}>Duration</label>
                                <select value={zoomDuration} onChange={e => setZoomDuration(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: "#111214", border: "1px solid #2a2b2f", borderRadius: "var(--lwd-radius-input)", color: "#e5e7eb", fontFamily: NU, fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                                  <option value="15">15 minutes</option>
                                  <option value="30">30 minutes</option>
                                  <option value="60">1 hour</option>
                                </select>
                              </div>
                              <button onClick={scheduleZoom} disabled={!zoomDate || !zoomTime} style={{
                                width: "100%", padding: "10px 0", cursor: zoomDate && zoomTime ? "pointer" : "default",
                                background: zoomDate && zoomTime ? `linear-gradient(135deg, ${C.gold}, ${C.gold2})` : "#2a2b2f",
                                border: "none", borderRadius: "var(--lwd-radius-input)", fontFamily: NU, fontSize: 10, fontWeight: 700,
                                letterSpacing: "1.5px", textTransform: "uppercase",
                                color: zoomDate && zoomTime ? "#0f0d0a" : "#6b7280",
                              }}>Create Meeting Link</button>
                            </div>
                          )}
                        </div>
                        <button onClick={() => sendWaitMsg(activeChat)} title="Send wait time message" style={{
                          background: "none", border: "1px solid #3d3e42", borderRadius: "var(--lwd-radius-input)",
                          color: "#ffffff", padding: "5px 10px", fontSize: 10, cursor: "pointer",
                          fontFamily: NU, letterSpacing: "0.5px",
                          transition: "border-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#60a5fa"; e.currentTarget.style.color = "#60a5fa"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#3d3e42"; e.currentTarget.style.color = "#ffffff"; }}
                        >◔ Hold</button>
                        <button onClick={() => openEmailModal(activeChat)} title="Send email" style={{
                          background: "none", border: "1px solid #3d3e42", borderRadius: "var(--lwd-radius-input)",
                          color: "#ffffff", padding: "5px 10px", fontSize: 10, cursor: "pointer",
                          fontFamily: NU, letterSpacing: "0.5px",
                          transition: "border-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#3d3e42"; e.currentTarget.style.color = "#ffffff"; }}
                        >✉ Email</button>
                        <button onClick={() => archiveChat(activeChat)} title="Archive conversation" style={{
                          background: "none", border: "1px solid #3d3e42", borderRadius: "var(--lwd-radius-input)",
                          color: "#ffffff", padding: "5px 10px", fontSize: 10, cursor: "pointer",
                          fontFamily: NU, letterSpacing: "0.5px",
                          transition: "border-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#f43f5e"; e.currentTarget.style.color = "#f43f5e"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#3d3e42"; e.currentTarget.style.color = "#ffffff"; }}
                        >▧ Archive</button>
                        <button onClick={() => setActiveChat(null)} style={{
                          background: "none", border: "1px solid #3d3e42", borderRadius: "var(--lwd-radius-input)",
                          color: "#ffffff", padding: "5px 10px", fontSize: 10, cursor: "pointer",
                          fontFamily: NU, letterSpacing: "0.5px",
                        }}>✕</button>
                      </div>
                    </div>

                    {/* Messages area */}
                    <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "14px 16px" : "20px 24px", minHeight: 0 }}>
                      {(chatMessages[activeChat] || []).map((m, i) => (
                        m.from === "system" ? (
                          /* System message (email sent, etc.) */
                          <div key={i} style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                            <div style={{
                              padding: "6px 16px", borderRadius: 20,
                              background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
                            }}>
                              <span style={{ fontFamily: NU, fontSize: 11, color: C.gold, fontWeight: 600 }}>{m.text}</span>
                              <span style={{ fontFamily: NU, fontSize: 9, color: C.grey, marginLeft: 8 }}>{m.time}</span>
                            </div>
                          </div>
                        ) : (
                        <div key={i} style={{
                          display: "flex",
                          justifyContent: m.from === "vendor" || m.from === "aura" ? "flex-end" : "flex-start",
                          alignItems: "flex-end",
                          gap: 8,
                          marginBottom: 12,
                        }}>
                          {/* Message bubble */}
                          <div style={{
                            maxWidth: "70%",
                            padding: "10px 16px",
                            borderRadius: m.from === "vendor" || m.from === "aura" ? "10px 10px 3px 10px" : "10px 10px 10px 3px",
                            background: m.from === "aura"
                              ? "linear-gradient(135deg, #2d1f5e, #1a1040)"
                              : m.from === "vendor"
                                ? m.auto ? "#1a1b1e" : "#1a3a4a"
                                : "#1e1f23",
                            border: m.from === "aura"
                              ? "1px solid rgba(167,139,250,0.3)"
                              : m.from === "vendor"
                                ? m.auto ? "1px solid #2a2b2f" : "1px solid #2a4a5a"
                                : "1px solid #2a2b2f",
                            color: m.from === "aura" ? "#e5e7eb" : m.from === "vendor" ? (m.auto ? "#9ca3af" : "#e5e7eb") : "#e5e7eb",
                          }}>
                            {m.from === "vendor" && !m.auto && <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#5eead4", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>The Grand Pavilion</div>}
                            {m.from === "aura" && <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: "#a78bfa", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>✧ Aura AI</div>}
                            <p style={{ fontFamily: NU, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{m.text}</p>
                            {m.from === "aura" && AURA_COACHING[activeChat] && (
                              <div style={{ marginTop: 10 }}>
                                <div style={{ height: 1, background: "rgba(167,139,250,0.2)", marginBottom: 8 }} />
                                <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#a78bfa", marginBottom: 6 }}>Suggested Strategy</div>
                                {AURA_COACHING[activeChat].strategies.map((s, si) => (
                                  <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 3 }}>
                                    <span style={{ fontFamily: NU, fontSize: 10, color: "#a78bfa", lineHeight: 1.4, flexShrink: 0 }}>•</span>
                                    <span style={{ fontFamily: NU, fontSize: 10, color: "#d1d5db", lineHeight: 1.4 }}>{s}</span>
                                  </div>
                                ))}
                                <div style={{ fontFamily: NU, fontSize: 9, fontStyle: "italic", color: "#6b7280", marginTop: 6, lineHeight: 1.4 }}>{AURA_COACHING[activeChat].reasoning}</div>
                              </div>
                            )}
                            {m.auto && <span style={{ fontFamily: NU, fontSize: 9, color: C.blue, fontStyle: "italic" }}> Auto-reply</span>}
                            {m.attachment && <div style={{ fontFamily: NU, fontSize: 9, color: C.gold, marginTop: 4 }}>{"\uD83D\uDCCE"} File attachment</div>}
                            {m.voice && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <div style={{ display: "flex", gap: 2 }}>
                                {[...Array(12)].map((_, vi) => <div key={vi} style={{ width: 3, height: Math.random() * 12 + 4, background: "#1a3a4a80", borderRadius: 1 }} />)}
                              </div>
                              <span style={{ fontFamily: NU, fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{"\u25B6"}</span>
                            </div>}
                            <div style={{
                              fontFamily: NU, fontSize: 9, marginTop: 4,
                              color: m.from === "vendor" ? (m.auto ? "#6b7280" : "rgba(255,255,255,0.5)") : "#6b7280",
                              textAlign: m.from === "vendor" ? "right" : "left",
                            }}>{m.time}</div>
                          </div>
                          {m.from === "vendor" && !m.auto && (
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                              backgroundImage: `url(${vendor.imgs?.[0] || ""})`,
                              backgroundSize: "cover", backgroundPosition: "center",
                              border: "2px solid #2a4a5a",
                            }} />
                          )}
                        </div>
                        )
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* ── AI Coaching Bar, only when vendor has taken over ── */}
                    {takenOverChats.has(activeChat) && <div style={{
                      padding: "10px 20px", borderTop: "1px solid #2a2b2f",
                      background: "rgba(201,168,76,0.06)",
                      display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexWrap: "wrap",
                    }}>
                      <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.gold, fontWeight: 700, flexShrink: 0 }}>{"\u2727"} AI Assist</span>
                      <div style={{ height: 16, width: 1, background: `${C.gold}40` }} />
                      {(() => {
                        const chatIntent = activeChat === "Aisha & Tom" ? "medium" : "high";
                        const recommended = chatIntent === "high" ? "Invite to a private video consultation" : "Offer brochure link";
                        return [
                          "Offer brochure link",
                          "Invite to private showround",
                          "Suggest availability check",
                          "Invite to a private video consultation",
                        ].map((suggestion, si) => {
                          const isRec = suggestion === recommended;
                          return (
                            <button key={si} onClick={() => { setChatMsg(suggestion === "Offer brochure link"
                              ? "I'd love to send you our full brochure with pricing and imagery. Shall I email it across?"
                              : suggestion === "Invite to private showround"
                              ? "Would you like to arrange a private showround? We have availability this week and would love to show you the space in person."
                              : suggestion === "Invite to a private video consultation"
                              ? "Would you like to schedule a private video consultation? We can walk you through the venue virtually and answer all your questions."
                              : "Let me check our availability for your preferred dates and get back to you shortly."
                            ); }} style={{
                              background: isRec ? C.gold : "transparent",
                              border: isRec ? `1px solid ${C.gold}` : `1px solid rgba(201,168,76,0.3)`,
                              borderRadius: "var(--lwd-radius-input)", padding: "4px 10px", cursor: "pointer",
                              fontFamily: NU, fontSize: 10,
                              color: isRec ? "#000000" : C.gold,
                              fontWeight: isRec ? 700 : 400,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={e => { if (!isRec) { e.currentTarget.style.background = `${C.gold}20`; e.currentTarget.style.borderColor = C.gold; } }}
                            onMouseLeave={e => { if (!isRec) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = `rgba(201,168,76,0.3)`; } }}
                            >{isRec ? `◈ ${suggestion}` : suggestion}</button>
                          );
                        });
                      })()}
                    </div>}

                    {/* Compose bar, only when vendor has taken over, otherwise show AI status */}
                    {!takenOverChats.has(activeChat) ? (
                      <div style={{
                        padding: "16px 20px", borderTop: "1px solid #2a2b2f",
                        background: "#18191c", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa", animation: "pulse 2s infinite" }} />
                          <span style={{ fontFamily: NU, fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>Aura AI is handling this conversation</span>
                        </div>
                        <button onClick={() => setTakenOverChats(prev => { const n = new Set(prev); n.add(activeChat); return n; })} style={{
                          background: "#C41E3A", border: "none",
                          borderRadius: "var(--lwd-radius-input)", color: "#ffffff", padding: "8px 16px", fontSize: 10, cursor: "pointer",
                          fontFamily: NU, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                        }}>◈ Take Over Chat</button>
                      </div>
                    ) : (
                    <div style={{
                      padding: "14px 20px", borderTop: "1px solid #2a2b2f",
                      background: "#18191c", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
                    }}>
                      <button onClick={() => fileInputRef.current?.click()} title="Attach file" style={{
                        background: "none", border: "1px solid #2a2b2f", borderRadius: "var(--lwd-radius-input)",
                        color: "#9ca3af", padding: "10px", cursor: "pointer", fontSize: 14, flexShrink: 0,
                        transition: "border-color 0.15s, color 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2b2f"; e.currentTarget.style.color = "#9ca3af"; }}
                      >{"\u229E"}</button>
                      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: "none" }} onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file || !activeChat) return;
                        const now = new Date();
                        const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                        setChatMessages(prev => ({
                          ...prev,
                          [activeChat]: [...(prev[activeChat] || []),
                            { from: "vendor", text: `\uD83D\uDCCE Attached: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`, time, attachment: true }
                          ],
                        }));
                        e.target.value = "";
                      }} />
                      <input
                        value={chatMsg}
                        onChange={e => setChatMsg(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMsg(); } }}
                        placeholder="Type your message..."
                        style={{
                          flex: 1, background: "#1e1f23", border: "1px solid #2a2b2f",
                          borderRadius: "var(--lwd-radius-input)", padding: "10px 14px", color: "#e5e7eb",
                          fontFamily: NU, fontSize: 13, outline: "none",
                          transition: "border-color 0.2s", minWidth: 120,
                        }}
                        onFocus={e => e.target.style.borderColor = C.gold}
                        onBlur={e => e.target.style.borderColor = "#2a2b2f"}
                      />
                      <button onClick={() => {
                        if (isRecording) {
                          setIsRecording(false);
                          const now = new Date();
                          const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                          const duration = Math.floor(Math.random() * 20) + 5;
                          setChatMessages(prev => ({
                            ...prev,
                            [activeChat]: [...(prev[activeChat] || []),
                              { from: "vendor", text: `\uD83C\uDFA4 Voice message \u00b7 ${duration}s`, time, voice: true }
                            ],
                          }));
                        } else {
                          setIsRecording(true);
                        }
                      }} style={{
                        background: isRecording ? "rgba(239,68,68,0.15)" : "none",
                        border: `1px solid ${isRecording ? "#ef4444" : "#2a2b2f"}`,
                        borderRadius: "var(--lwd-radius-input)", color: isRecording ? "#ef4444" : "#9ca3af",
                        padding: "10px", cursor: "pointer", fontSize: 14, flexShrink: 0,
                        transition: "all 0.15s",
                        animation: isRecording ? "pulse 1.5s infinite" : "none",
                      }}
                      onMouseEnter={e => { if (!isRecording) { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}}
                      onMouseLeave={e => { if (!isRecording) { e.currentTarget.style.borderColor = "#2a2b2f"; e.currentTarget.style.color = "#9ca3af"; }}}
                      title={isRecording ? "Stop recording" : "Record voice message"}
                      >{isRecording ? "\u25A0" : "\u25CF"}</button>
                      <button onClick={sendChatMsg} style={{
                        background: chatMsg.trim() ? `linear-gradient(135deg, ${C.gold}, ${C.gold2})` : "#1e1f23",
                        border: chatMsg.trim() ? "none" : "1px solid #2a2b2f",
                        borderRadius: "var(--lwd-radius-input)", padding: "10px 20px", cursor: "pointer",
                        fontFamily: NU, fontSize: 10, fontWeight: 700,
                        letterSpacing: "1.5px", textTransform: "uppercase",
                        color: chatMsg.trim() ? "#0f0d0a" : "#9ca3af",
                        transition: "all 0.2s",
                      }}>
                        Send {"\u25B8"}
                      </button>
                      <button onClick={() => openEmailModal(activeChat)} style={{
                        background: "none", border: "1px solid #2a2b2f", borderRadius: "var(--lwd-radius-input)",
                        padding: "10px 14px", cursor: "pointer", color: "#9ca3af",
                        fontFamily: NU, fontSize: 10, fontWeight: 600,
                        letterSpacing: "1px", textTransform: "uppercase",
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2b2f"}
                      >
                        {"\u2709"} Email
                      </button>
                      <div style={{ position: "relative" }}>
                        <button onClick={() => setWhatsappDropdown(!whatsappDropdown)} style={{
                          background: "none", border: "1px solid #25D366", borderRadius: "var(--lwd-radius-input)",
                          padding: "10px 14px", cursor: "pointer", color: "#25D366",
                          fontFamily: NU, fontSize: 10, fontWeight: 600,
                          letterSpacing: "1px", textTransform: "uppercase",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(37,211,102,0.08)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          {"\u25C8"} WhatsApp
                        </button>
                        {whatsappDropdown && (
                          <div style={{
                            position: "absolute", bottom: "calc(100% + 8px)", right: 0, zIndex: 100,
                            width: 240, background: "#1e1f23", border: "1px solid #2a2b2f",
                            borderRadius: "var(--lwd-radius-card)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", padding: 12,
                          }}>
                            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "#25D366", marginBottom: 8, fontWeight: 700 }}>{"\u25C8"} WhatsApp</div>
                            <button onClick={() => {
                              const msg = chatMsg.trim() || "Hello! Thank you for your interest in The Grand Pavilion.";
                              const num = whatsappNumber.replace(/\s/g, "");
                              window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
                              const now = new Date();
                              const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                              setChatMessages(prev => ({
                                ...prev,
                                [activeChat]: [...(prev[activeChat] || []), { from: "system", text: `\u25C8 WhatsApp message sent to ${activeChat}`, time }],
                              }));
                              setWhatsappDropdown(false);
                            }} style={{
                              width: "100%", padding: "8px 12px", marginBottom: 6, cursor: "pointer",
                              background: "transparent", border: "1px solid #2a2b2f", borderRadius: "var(--lwd-radius-input)",
                              fontFamily: NU, fontSize: 11, color: "#e5e7eb", textAlign: "left",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#25D36615"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >Send via WhatsApp</button>
                            <button onClick={() => {
                              const now = new Date();
                              const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                              setChatMessages(prev => ({
                                ...prev,
                                [activeChat]: [...(prev[activeChat] || []), { from: "system", text: `\u25C8 WhatsApp contact shared: wa.me/${whatsappNumber.replace(/\s/g, "")}`, time }],
                              }));
                              setWhatsappDropdown(false);
                            }} style={{
                              width: "100%", padding: "8px 12px", cursor: "pointer",
                              background: "transparent", border: "1px solid #2a2b2f", borderRadius: "var(--lwd-radius-input)",
                              fontFamily: NU, fontSize: 11, color: "#e5e7eb", textAlign: "left",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#25D36615"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >Share WhatsApp Link</button>
                          </div>
                        )}
                      </div>
                    </div>
                    )}
                  </div>
                )}

                {/* Empty state when no chat selected */}
                {!activeChat && (
                  <div style={{ display: "none" }} />
                )}
              </div>

              {/* Gold divider */}
              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}40, transparent)`, marginTop: 20, marginBottom: 20 }} />

              {/* Intelligence panels, 3 columns */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr", gap: 16 }}>
                {/* AI Assisted Messaging */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 20 }}>
                  <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>✧ AI-Assisted Messaging</div>
                  <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 14 }}>Response Automation</div>
                  {[
                    { label: "Availability enquiries", enabled: true },
                    { label: "Pricing intelligence", enabled: true },
                    { label: "Capacity matching", enabled: false },
                    { label: "After-hours concierge", enabled: true },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{r.label}</span>
                      <span style={{
                        fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                        color: r.enabled ? C.green : C.grey2,
                        padding: "2px 6px", borderRadius: 2,
                        background: r.enabled ? "rgba(34,197,94,0.08)" : "transparent",
                        border: `1px solid ${r.enabled ? "rgba(34,197,94,0.2)" : C.border}`,
                      }}>{r.enabled ? "Active" : "Off"}</span>
                    </div>
                  ))}
                </div>

                {/* Engagement Performance */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 20 }}>
                  <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>◎ Engagement Performance</div>
                  <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 14 }}>Conversion Intelligence</div>
                  {[
                    { metric: "Client conversations", val: "47" },
                    { metric: "First response time", val: "42s", color: C.green },
                    { metric: "Resolution time", val: "8 min" },
                    { metric: "Enquiry to lead rate", val: "26%", color: C.gold },
                    { metric: "Client satisfaction", val: "4.9 / 5.0", color: C.green },
                  ].map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{m.metric}</span>
                      <span style={{ fontFamily: NU, fontSize: 11, color: m.color || C.white, fontWeight: 600 }}>{m.val}</span>
                    </div>
                  ))}
                </div>

                {/* Listing Visibility Intelligence */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 20 }}>
                  <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>◈ Listing Intelligence</div>
                  <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 14 }}>Visibility & Exposure</div>
                  {/* AI Visibility Score */}
                  <div style={{ textAlign: "center", padding: "12px 0 16px", borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
                    <div style={{ fontFamily: GD, fontSize: 40, color: C.gold, fontWeight: 600, lineHeight: 1 }}>84</div>
                    <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: C.grey, marginTop: 4 }}>AI Visibility Score</div>
                    <div style={{ width: "80%", height: 3, background: C.border2, borderRadius: 2, margin: "8px auto 0", overflow: "hidden" }}>
                      <div style={{ width: "84%", height: "100%", background: `linear-gradient(90deg, ${C.gold}, ${C.gold2})`, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginTop: 8 }}>
                      Last month: 76 → This month: 84 <span style={{ color: "#22c55e", fontWeight: 700 }}>↑ 8 pts</span>
                    </div>
                  </div>
                  {[
                    { metric: "Search ranking", val: "#3", color: C.gold },
                    { metric: "Homepage exposure", val: "Featured", color: C.green },
                    { metric: "AI recommendation rate", val: "78%", color: C.blue },
                    { metric: "Category position", val: "#1", color: C.gold },
                  ].map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{m.metric}</span>
                      <span style={{ fontFamily: NU, fontSize: 11, color: m.color, fontWeight: 700 }}>{m.val}</span>
                    </div>
                  ))}

                  {/* Improve to 90+ */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: C.gold, marginBottom: 10 }}>◈ Improve to 90+</div>
                    {[
                      "Add 10 more real wedding photos",
                      "Update availability calendar",
                      "Add pricing guide",
                      "Add FAQ section",
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", border: `1.5px solid ${C.grey}`, flexShrink: 0 }} />
                        <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {dashTab === "analytics" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>Performance Analytics</div>
                <h2 style={{ fontFamily: GD, fontSize: isMobile ? 24 : 32, color: C.white, fontWeight: 600 }}>Your Numbers</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 24 }}>
                  <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>Profile Views</div>
                  <MiniChart data={viewsData} labels={months} color={C.blue} />
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 24 }}>
                  <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>Lead Volume</div>
                  <MiniChart data={leadsData} labels={months} color={C.gold} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
                {[
                  { label: "Top Traffic Source", val: "Google Search", sub: "62% of views" },
                  { label: "Top Country", val: "United Kingdom", sub: "48% of enquiries" },
                  { label: "Avg. Budget Enquiring", val: "£25–50k", sub: "Most common range" },
                  { label: "Peak Enquiry Day", val: "Tuesday", sub: "28% more than avg" },
                  { label: "Profile Completeness", val: "94%", sub: "Add video to reach 100%" },
                  { label: "Directory Ranking", val: "#1", sub: "Venues · London" },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: "18px 20px" }}>
                    <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: C.grey, marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontFamily: GD, color: C.white, fontWeight: 600 }}>{s.val}</div>
                    <div style={{ fontFamily: NU, fontSize: 12, color: C.green, marginTop: 4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI INSIGHTS */}
          {dashTab === "ai" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>AI-Powered Intelligence</div>
                <h2 style={{ fontFamily: GD, fontSize: isMobile ? 24 : 32, color: C.white, fontWeight: 600 }}>Your AI Performance</h2>
              </div>

              {/* Taigenic branding */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 24,
                padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`,
                borderRadius: "var(--lwd-radius-card)",
              }}>
                <span style={{ fontFamily: GD, fontSize: 14, color: C.gold, fontWeight: 400 }}>✧</span>
                <div>
                  <span style={{
                    fontFamily: NU, fontSize: 10, letterSpacing: "1.5px",
                    textTransform: "uppercase", color: C.white, fontWeight: 600,
                  }}>Powered by Taigenic.ai</span>
                  <span style={{ fontFamily: NU, fontSize: 9, color: C.grey, fontWeight: 300, marginLeft: 10 }}>
                    Part of 5 Star Weddings Ltd.
                  </span>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 4px ${C.green}` }} />
                  <span style={{ fontFamily: NU, fontSize: 9, color: C.green, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Active</span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 16, marginBottom: 28 }}>
                <StatCard label="AI Mentions" val="42" change="26%" icon="✧" />
                <StatCard label="AI-Driven Enquiries" val="18" change="31%" icon="◇" color={C.green} />
                <StatCard label="Recommendation Score" val="9.2" icon="◈" color={C.blue} />
                <StatCard label="Search Appearances" val="384" change="18%" icon="⊡" color="#a78bfa" />
              </div>

              {/* What couples are asking */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 24 }}>
                  <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>{"\u2727"} What Couples Ask About You</div>
                  <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>Top AI Conversation Topics</div>
                  {[
                    { topic: "Availability & dates", pct: 34 },
                    { topic: "Pricing & packages", pct: 28 },
                    { topic: "Guest capacity & layout", pct: 18 },
                    { topic: "Catering options", pct: 12 },
                    { topic: "Accommodation", pct: 8 },
                  ].map((t) => (
                    <div key={t.topic} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>{t.topic}</span>
                        <span style={{ fontFamily: NU, fontSize: 12, color: C.white, fontWeight: 700 }}>{t.pct}%</span>
                      </div>
                      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                          width: `${t.pct}%`, height: "100%",
                          background: `linear-gradient(90deg, ${C.gold}, ${C.gold2 || C.gold})`,
                          borderRadius: 2, transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 24 }}>
                  <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>✧ How AI Positions You</div>
                  <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>Competitive AI Ranking</div>
                  {[
                    { dest: "London", rank: "#1", of: "24 venues", color: C.gold },
                    { dest: "United Kingdom", rank: "#3", of: "89 venues", color: C.blue },
                    { dest: "Luxury Ballrooms", rank: "#1", of: "12 venues", color: C.gold },
                    { dest: "Large Weddings (200+)", rank: "#2", of: "31 venues", color: C.green },
                  ].map((r) => (
                    <div key={r.dest} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 0", borderBottom: `1px solid ${C.border}`,
                    }}>
                      <span style={{ fontFamily: GD, fontSize: 20, color: r.color, fontWeight: 600, minWidth: 36 }}>{r.rank}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: NU, fontSize: 13, color: C.white, fontWeight: 500 }}>{r.dest}</span>
                        <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontWeight: 300, marginLeft: 8 }}>{r.of}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Optimization Suggestions */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 24 }}>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>✧ AI Optimization Engine</div>
                <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>Suggestions to Increase AI Recommendations</div>
                {[
                  { tip: "Add structured dining menu options to boost Catering Quality score", impact: "High", color: C.gold },
                  { tip: "Upload 360° virtual tour to improve Presentation Quality", impact: "High", color: C.gold },
                  { tip: "Complete winter availability to capture off-season AI searches", impact: "Medium", color: C.blue },
                  { tip: "Add testimonials from recent couples for social proof weighting", impact: "Medium", color: C.blue },
                  { tip: "List proximity to airports and train stations for logistics matching", impact: "Low", color: C.grey },
                ].map((s) => (
                  <div key={s.tip} style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 0", borderBottom: `1px solid ${C.border}`,
                  }}>
                    <span style={{ color: C.green, fontSize: 13, flexShrink: 0, marginTop: 2 }}>→</span>
                    <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.5, flex: 1 }}>{s.tip}</span>
                    <span style={{
                      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                      color: s.color, background: `${s.color}15`, padding: "3px 10px", borderRadius: "var(--lwd-radius-input)",
                      flexShrink: 0,
                    }}>{s.impact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROFILE */}
          {dashTab === "profile" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>Profile Editor</div>
                <h2 style={{ fontFamily: GD, fontSize: isMobile ? 24 : 32, color: C.white, fontWeight: 600 }}>Your Listing</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
                {[
                  ["Business Name", "The Grand Pavilion"],
                  ["City", "London"],
                  ["Country", "United Kingdom"],
                  ["Starting Price", "\u00A38,500"],
                  ["Seated Capacity", "320"],
                  ["Standing Capacity", "500"],
                  ["Response Time", "< 2 hrs"],
                  ["Availability", "Booking 2025\u20132026"],
                  ["WhatsApp Number", "+44 7700 900123"],
                ].map(([l, v]) => (
                  <div key={l} style={{ marginBottom: 4 }}>
                    <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: C.grey, marginBottom: 6 }}>{l}</div>
                    <input defaultValue={v} style={{ ...IS, fontSize: 13 }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setWhatsappEnabled(e => !e)} style={{
                  width: 40, height: 22, borderRadius: 11, cursor: "pointer", border: "none",
                  background: whatsappEnabled ? "#25D366" : C.border2,
                  position: "relative", transition: "background 0.2s",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 2,
                    left: whatsappEnabled ? 20 : 2,
                    transition: "left 0.2s",
                  }} />
                </button>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Enable WhatsApp for client conversations</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <Btn gold onClick={() => {}}>
                  Save Changes
                </Btn>
              </div>
            </div>
          )}

          {/* SEO TOOLS */}
          {dashTab === "seo" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>AI-Powered SEO Tools</div>
                <h2 style={{ fontFamily: GD, fontSize: isMobile ? 24 : 32, color: C.white, fontWeight: 600 }}>Rank Higher. Get More Leads.</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 24 }}>
                {[
                  { label: "SEO Score", val: "87/100", color: C.green, sub: "↑ 12 points this month" },
                  { label: "Keywords Ranking", val: "34", color: C.gold, sub: "Top 10 Google positions" },
                  { label: "Organic Traffic", val: "1,240", color: C.blue, sub: "Monthly visitors from search" },
                  { label: "Directory Page Rank", val: "#1", color: "#a78bfa", sub: "London luxury venues" },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>
                    <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: C.grey, marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontFamily: GD, fontSize: 34, color: s.color, fontWeight: 600 }}>{s.val}</div>
                    <div style={{ fontFamily: NU, fontSize: 12, color: C.green, marginTop: 4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 28, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>✦ AI Profile Writer</div>
                    <div style={{ fontFamily: NU, fontSize: 15, color: C.white, fontWeight: 600 }}>Generate SEO-Optimised Description</div>
                    <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, marginTop: 4 }}>AI writes a compelling, keyword-rich profile that ranks on Google</div>
                  </div>
                  <button
                    onClick={handleGenBio}
                    style={{
                      background: `linear-gradient(135deg,${C.gold},${C.gold2})`,
                      color: C.black,
                      border: "none",
                      borderRadius: "var(--lwd-radius-input)",
                      padding: "10px 20px",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: NU,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {genBio ? "Generating..." : "✦ Generate with AI"}
                  </button>
                </div>
                {(aiBio || genBio) && (
                  <div
                    style={{
                      background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${C.border2}`,
                      borderRadius: "var(--lwd-radius-card)",
                      padding: "16px 18px",
                      fontFamily: NU,
                      fontSize: 13,
                      color: C.grey,
                      lineHeight: 1.8,
                      minHeight: 120,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {aiBio || <span style={{ color: C.gold }}>Writing your profile...</span>}
                    {genBio && <span style={{ animation: "pulse 1s infinite", color: C.gold }}>|</span>}
                  </div>
                )}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: 24 }}>
                <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>Recommended Keywords for Your Listing</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    "luxury wedding venues London",
                    "Victorian ballroom wedding",
                    "exclusive wedding hire London",
                    "wedding venue crystal chandelier",
                    "London wedding 300 guests",
                    "black tie wedding London",
                    "wedding venue with accommodation London",
                  ].map((k) => (
                    <Pill key={k} text={k} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BILLING */}
          {dashTab === "billing" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>Billing & Plans</div>
                <h2 style={{ fontFamily: GD, fontSize: isMobile ? 24 : 32, color: C.white, fontWeight: 600 }}>Your Subscription</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                {[
                  { name: "Essential", price: "£49", per: "/mo", features: ["Basic listing", "5 leads/month", "Standard placement", "Email support"], current: false },
                  { name: "Featured", price: "£149", per: "/mo", features: ["Premium listing", "Unlimited leads", "Top placement", "AI profile writer", "Analytics dashboard", "Priority support"], current: true },
                  { name: "Elite", price: "£299", per: "/mo", features: ["Everything in Featured", "#1 category placement", "Video showcase", "Dedicated account manager", "Monthly strategy call", "Custom lead forms"], current: false },
                ].map((p, i) => (
                  <div
                    key={i}
                    style={{
                      background: p.current ? "rgba(201,168,76,0.06)" : C.card,
                      border: `1px solid ${p.current ? C.gold : C.border}`,
                      borderRadius: "var(--lwd-radius-card)",
                      padding: 24,
                      position: "relative",
                    }}
                  >
                    {p.current && (
                      <div
                        style={{
                          position: "absolute",
                          top: -1,
                          left: 0,
                          right: 0,
                          height: 2,
                          background: `linear-gradient(90deg,${C.gold},${C.gold2})`,
                        }}
                      />
                    )}
                    {p.current && (
                      <div style={{ position: "absolute", top: 14, right: 14 }}>
                        <Badge text="Current Plan" />
                      </div>
                    )}
                    <div style={{ fontFamily: NU, fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: C.grey, marginBottom: 8 }}>{p.name}</div>
                    <div style={{ fontFamily: GD, fontSize: 40, color: p.current ? C.gold : C.white, fontWeight: 600 }}>
                      {p.price}
                      <span style={{ fontSize: 16, color: C.grey, fontFamily: GD }}>{p.per}</span>
                    </div>
                    <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16 }}>
                      {p.features.map((f) => (
                        <div key={f} style={{ fontFamily: NU, fontSize: 12, color: C.grey, display: "flex", gap: 6, marginBottom: 6 }}>
                          <span style={{ color: C.green }}>✓</span>
                          {f}
                        </div>
                      ))}
                    </div>
                    {!p.current && (
                      <div style={{ marginTop: 16 }}>
                        <Btn onClick={() => {}} gold={i === 2}>
                          {i === 2 ? "Upgrade to Elite" : "Downgrade"}
                        </Btn>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: "var(--lwd-radius-card)",
                  padding: 24,
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.grey,
                  lineHeight: 1.7,
                }}
              >
                Current plan: <span style={{ color: C.gold, fontWeight: 700 }}>Featured, £149/month</span> · Next billing date:{" "}
                <span style={{ color: C.white }}>1 March 2026</span> · All prices exclude VAT
              </div>
            </div>
          )}

          {/* CALENDAR */}
          {dashTab === "calendar" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>Schedule & Events</div>
                <h2 style={{ fontFamily: GD, fontSize: isMobile ? 24 : 32, color: C.white, fontWeight: 600 }}>Venue Calendar</h2>
              </div>

              {/* Calendar sync status */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
                padding: "14px 18px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
                <span style={{ fontFamily: NU, fontSize: 12, color: C.white }}>Connected to <span style={{ color: C.gold, fontWeight: 600 }}>Google Calendar</span></span>
                <span style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginLeft: "auto" }}>Last synced: 2 min ago</span>
              </div>

              {/* Upcoming events */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: isMobile ? 16 : 24, marginBottom: 20 }}>
                <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>Upcoming Events</div>
                {calendarEvents.map((ev, i) => {
                  const typeColors = { showround: C.gold, tasting: C.blue, wedding: C.green, meeting: "#a78bfa" };
                  const typeIcons = { showround: "\u25C8", tasting: "\u25C7", wedding: "\u2726", meeting: "\u25C9" };
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
                      borderBottom: i < calendarEvents.length - 1 ? `1px solid ${C.border}` : "none",
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "var(--lwd-radius-image)", flexShrink: 0,
                        background: `${typeColors[ev.type]}10`, border: `1px solid ${typeColors[ev.type]}30`,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontFamily: NU, fontSize: 14, color: typeColors[ev.type], fontWeight: 700 }}>
                          {new Date(ev.date).getDate()}
                        </span>
                        <span style={{ fontFamily: NU, fontSize: 8, color: typeColors[ev.type], textTransform: "uppercase" }}>
                          {new Date(ev.date).toLocaleDateString("en-GB", { month: "short" })}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: NU, fontSize: 13, color: C.white, fontWeight: 500 }}>{ev.title}</div>
                        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 2 }}>{ev.time}</div>
                      </div>
                      <span style={{
                        fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                        color: typeColors[ev.type], padding: "3px 8px", borderRadius: 2,
                        background: `${typeColors[ev.type]}10`, border: `1px solid ${typeColors[ev.type]}25`,
                      }}>{typeIcons[ev.type]} {ev.type}</span>
                    </div>
                  );
                })}
              </div>

              {/* Calendar feed info */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "var(--lwd-radius-card)", padding: isMobile ? 16 : 24 }}>
                <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, marginBottom: 4 }}>{"\u2727"} Calendar Integration</div>
                <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.white, marginBottom: 14 }}>Connected Calendars</div>
                {[
                  { name: "Google Calendar", status: "Connected", color: C.green },
                  { name: "Venue Booking Feed", status: "Active", color: C.green },
                  { name: "LWD Listing Calendar", status: "Auto-sync", color: C.blue },
                ].map((cal, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>{cal.name}</span>
                    <span style={{
                      fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase",
                      color: cal.color, padding: "2px 8px", borderRadius: 2,
                      background: `${cal.color}10`, border: `1px solid ${cal.color}25`,
                    }}>{cal.status}</span>
                  </div>
                ))}
                <div style={{ marginTop: 16, fontFamily: NU, fontSize: 11, color: C.grey, lineHeight: 1.6 }}>
                  Calendar events automatically sync to your venue listing and booking page. Couples can see your availability in real-time.
                </div>
              </div>
            </div>
          )}

          {/* ── Artistry Awards Tab ─────────────────────────────────────────── */}
          {dashTab === "awards" && (
            <AwardsSubmissionTab vendor={vendor} C={C} GD={GD} NU={NU} isMobile={isMobile} />
          )}
        </div>
      </div>
    </div>

    {/* Footer */}
    <FooterForVendors />

    </ThemeCtx.Provider>
  );
}

// ── Awards Submission Tab ─────────────────────────────────────────────────────
const AWARD_CATEGORIES = [
  'Photography', 'Film', 'Venues', 'Florals', 'Planning',
  'Styling', 'Cakes', 'Music', 'Hair & Makeup', 'Content Creators',
];

function AwardsSubmissionTab({ vendor, C, GD, NU, isMobile }) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [imageUrls, setImageUrls] = useState(['', '', '', '', '']);

  const [form, setForm] = useState({
    vendor_name:     '',
    category:        '',
    location:        '',
    country:         '',
    quote:           '',
    micro_different: '',
    micro_moment:    '',
    micro_perfect:   '',
    video_url:       '',
  });

  const vendorId = vendor?.id || vendor?.legacy_vendor_id || 'unknown';

  useEffect(() => {
    if (!vendorId || vendorId === 'unknown') { setLoading(false); return; }
    getMySubmission(vendorId).then(({ data }) => {
      if (data) {
        setSubmission(data);
        setForm({
          vendor_name:     data.vendor_name     || vendor?.name || '',
          category:        data.category        || '',
          location:        data.location        || '',
          country:         data.country         || '',
          quote:           data.quote           || '',
          micro_different: data.micro_different || '',
          micro_moment:    data.micro_moment    || '',
          micro_perfect:   data.micro_perfect   || '',
          video_url:       data.video_url       || '',
        });
        const imgs = data.images || [];
        setImageUrls([...imgs, '', '', '', '', ''].slice(0, 5));
      } else {
        setForm(f => ({ ...f, vendor_name: vendor?.name || '' }));
      }
      setLoading(false);
    });
  }, [vendorId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.vendor_name || !form.category || !form.location || !form.country || !form.quote) {
      setSaveMsg({ ok: false, text: 'Please fill in all required fields.' });
      return;
    }
    const images = imageUrls.filter(u => u.trim());
    if (images.length === 0) {
      setSaveMsg({ ok: false, text: 'Please add at least one image URL.' });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    const { data, error, alreadyApproved } = await upsertSubmission(vendorId, { ...form, images });
    setSaving(false);
    if (alreadyApproved) {
      setSaveMsg({ ok: false, text: 'Your entry is already approved and live on the awards page.' });
      return;
    }
    if (error) {
      setSaveMsg({ ok: false, text: 'Something went wrong. Please try again.' });
      return;
    }
    setSubmission(data);
    setSaveMsg({ ok: true, text: submission ? 'Entry updated and resubmitted for review.' : 'Entry submitted! Our team will review it shortly.' });
  };

  const statusColors = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
  const statusLabels = { pending: '⏳ Under Review', approved: '✓ Approved', rejected: '✗ Not Selected' };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: NU, fontSize: 13, color: C.grey }}>Loading…</div>
  );

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '3px', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
          ✦ Wedding Artistry Awards
        </div>
        <h2 style={{ fontFamily: GD, fontSize: isMobile ? 24 : 32, color: C.white, fontWeight: 600, margin: '0 0 10px' }}>
          The Wedding Artistry Awards 2026
        </h2>
        <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, lineHeight: 1.6, margin: 0 }}>
          Submit your work for consideration. Approved entries appear on the public awards page at{' '}
          <span style={{ color: C.gold }}>/artistry-awards</span>. One submission per vendor.
        </p>
      </div>

      {/* Status badge (if already submitted) */}
      {submission && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 18px', marginBottom: 28,
          background: `${statusColors[submission.status]}12`,
          border: `1px solid ${statusColors[submission.status]}40`,
          borderRadius: 8,
        }}>
          <span style={{
            fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: statusColors[submission.status],
          }}>
            {statusLabels[submission.status]}
          </span>
          {submission.admin_note && (
            <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, marginLeft: 8 }}>
             , {submission.admin_note}
            </span>
          )}
          {submission.status === 'rejected' && (
            <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginLeft: 'auto' }}>
              You can edit and resubmit below.
            </span>
          )}
        </div>
      )}

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Row 1: Name + Category */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Business / Artist Name *
            </label>
            <input
              value={form.vendor_name}
              onChange={e => set('vendor_name', e.target.value)}
              placeholder="e.g. Marco Battista Photography"
              style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', fontFamily: NU, fontSize: 13, color: C.white, outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Category *
            </label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', fontFamily: NU, fontSize: 13, color: form.category ? C.white : C.grey, outline: 'none' }}
            >
              <option value="">Select category…</option>
              {AWARD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Location + Country */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Location *
            </label>
            <input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Lake Como, Italy"
              style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', fontFamily: NU, fontSize: 13, color: C.white, outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Country *
            </label>
            <input
              value={form.country}
              onChange={e => set('country', e.target.value)}
              placeholder="e.g. Italy"
              style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', fontFamily: NU, fontSize: 13, color: C.white, outline: 'none' }}
            />
          </div>
        </div>

        {/* Quote */}
        <div>
          <label style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Your Signature Quote * <span style={{ color: C.grey, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>(shown on your award card)</span>
          </label>
          <textarea
            value={form.quote}
            onChange={e => set('quote', e.target.value)}
            rows={2}
            maxLength={160}
            placeholder="A short, memorable line that defines your work…"
            style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', fontFamily: NU, fontSize: 13, color: C.white, outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
          />
          <div style={{ textAlign: 'right', fontFamily: NU, fontSize: 10, color: C.grey, marginTop: 4 }}>{form.quote.length}/160</div>
        </div>

        {/* Micro-prompts */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: isMobile ? 16 : 22 }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: C.gold, marginBottom: 18 }}>
            3 Questions, Shown in your profile panel
          </div>
          {[
            { key: 'micro_different', label: 'What makes you different?' },
            { key: 'micro_moment',    label: 'The moment you live for?' },
            { key: 'micro_perfect',   label: 'Your perfect day?' },
          ].map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: NU, fontSize: 11, color: C.grey, display: 'block', marginBottom: 6 }}>{label}</label>
              <textarea
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                rows={2}
                maxLength={200}
                style={{ width: '100%', boxSizing: 'border-box', background: '#1a1a1a', border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', fontFamily: NU, fontSize: 12, color: C.white, outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
              />
            </div>
          ))}
        </div>

        {/* Images */}
        <div>
          <label style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Images for Judging * <span style={{ color: C.grey, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>(up to 5, paste public image URLs)</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {imageUrls.map((url, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, minWidth: 16 }}>{i + 1}.</span>
                <input
                  value={url}
                  onChange={e => {
                    const next = [...imageUrls];
                    next[i] = e.target.value;
                    setImageUrls(next);
                  }}
                  placeholder={i === 0 ? 'Primary image URL (required)' : `Image ${i + 1} URL (optional)`}
                  style={{ flex: 1, background: C.card, border: `1px solid ${i === 0 ? C.border : C.border}`, borderRadius: 6, padding: '9px 12px', fontFamily: NU, fontSize: 12, color: C.white, outline: 'none' }}
                />
                {url && (
                  <img src={url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0, border: `1px solid ${C.border}` }} onError={e => { e.target.style.display = 'none'; }} />
                )}
              </div>
            ))}
          </div>
          <p style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 8, lineHeight: 1.5 }}>
            Tip: use Unsplash, your CDN, or any publicly accessible image URL. Images must be portrait or square for best display.
          </p>
        </div>

        {/* Video URL */}
        <div>
          <label style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            Video URL <span style={{ color: C.grey, fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>(optional, YouTube, TikTok or Instagram Reel)</span>
          </label>
          <input
            value={form.video_url}
            onChange={e => set('video_url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', fontFamily: NU, fontSize: 13, color: C.white, outline: 'none' }}
          />
        </div>

        {/* Save message */}
        {saveMsg && (
          <div style={{
            padding: '11px 16px', borderRadius: 6,
            background: saveMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${saveMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontFamily: NU, fontSize: 13,
            color: saveMsg.ok ? '#10b981' : '#ef4444',
          }}>
            {saveMsg.text}
          </div>
        )}

        {/* Submit button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={handleSubmit}
            disabled={saving || submission?.status === 'approved'}
            style={{
              background: submission?.status === 'approved' ? C.border : C.gold,
              color: submission?.status === 'approved' ? C.grey : '#0a0a0a',
              border: 'none', borderRadius: 6,
              padding: '12px 28px',
              fontFamily: NU, fontSize: 13, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: saving || submission?.status === 'approved' ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Submitting…' : submission ? (submission.status === 'approved' ? 'Entry Approved ✓' : 'Update & Resubmit') : 'Submit Entry'}
          </button>
          {submission && submission.status !== 'approved' && (
            <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
              Last submitted: {new Date(submission.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
