// ClientPortal.jsx
// Premium client-facing portal for managed account clients (venues, hotels, planners).
// Entirely separate from /vendor (which is for regular directory vendors).
//
// Menu is admin-controlled per account via portal_config on managed_accounts.
// Auth: vendor login -> if vendor_id is linked to a managed account -> this portal.
//
// Aesthetic: dark luxury, warm near-black, gold accents, editorial typography.

import { useState, useEffect } from "react";
import { useVendorAuth } from "../context/VendorAuthContext";
import {
  fetchManagedAccountByVendorId,
  fetchPortalConfig,
  buildDefaultPortalConfig,
  fetchClientContentSummary,
  fetchContent,
  fetchCampaigns,
} from "../services/socialStudioService";
import { fetchUpcomingEventsForVenue, fetchPortalEventBookings, formatEventDate, formatEventTime } from "../services/eventService";
import { fetchListingByManagedAccountId } from "../services/listings.ts";
import { useAdaptiveColor } from "../hooks/useAdaptiveColor";
import { getConnections, fetchSearchConsoleData, fetchAnalyticsData } from "../services/googleConnectionService";
import { fetchEntityEvents } from "../services/adminUserEventsService";
import { supabase } from "../lib/supabaseClient";

// -- Fonts / tokens ------------------------------------------------------------
const SERIF = "'Cormorant Garamond', 'Georgia', serif";
const SANS  = "'Inter', 'system-ui', sans-serif";

const T = {
  bg:       "#0b0906",
  sidebar:  "#110e0a",
  card:     "#1a1510",
  border:   "#2a2218",
  border2:  "#3a3020",
  gold:     "#c9a84c",
  goldDim:  "#8f7420",
  white:    "#f5efe4",
  off:      "#d4c8b0",
  grey:     "#8a7d6a",
  grey2:    "#5a5045",
  green:    "#4ade80",
  amber:    "#f59e0b",
  red:      "#f87171",
  blue:     "#60a5fa",
};

// -- Fallback managed account for dev ------------------------------------------
const DEV_ACCOUNT = {
  id:                  "a1b2c3d4-0001-0000-0000-000000000001",
  name:                "Villa d'Este",
  plan:                "signature",
  status:              "active",
  serviceStatus:       "active",
  primaryContactName:  "Sofia Ricci",
  primaryContactEmail: "sofia@villacomo.it",
  accountManager:      "James Holloway",
  portalConfig:        null,
  heroImageUrl:        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
};

// -- Helpers -------------------------------------------------------------------
function fmtDate(d) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function fmtShort(d) {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });
}

function greet(name) {
  const h = new Date().getHours();
  const time = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${time}, ${name || ""}`;
}

// -- Reusable components -------------------------------------------------------
function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.gold, marginBottom: 14 }}>
      {children}
    </div>
  );
}

function EmptyState({ title, body, accent }) {
  return (
    <div style={{
      padding: "56px 32px",
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle gold top accent */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 48, height: 2, background: T.goldDim }} />
      {accent && (
        <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.goldDim, marginBottom: 16 }}>
          {accent}
        </div>
      )}
      <div style={{ fontFamily: SERIF, fontSize: 24, color: T.off, marginBottom: 12, fontWeight: 500, lineHeight: 1.3 }}>{title}</div>
      {body && (
        <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: 0, lineHeight: 1.9, maxWidth: 400, marginInline: "auto" }}>
          {body}
        </p>
      )}
    </div>
  );
}

const STATUS_META = {
  brief:     { label: "Brief",     bg: T.grey2 + "44",  color: T.grey  },
  draft:     { label: "Draft",     bg: "#3a2a0044",      color: T.amber },
  review:    { label: "In Review", bg: "#1a2a4044",      color: T.blue  },
  approved:  { label: "Approved",  bg: "#1a3a2244",      color: T.green },
  scheduled: { label: "Scheduled", bg: "#2a1a4044",      color: "#a78bfa" },
  live:      { label: "Live",      bg: "#1a3a2244",      color: T.green },
  reported:  { label: "Reported",  bg: T.grey2 + "44",  color: T.grey  },
};

const PLATFORM_ICON = {
  instagram: "IG",
  facebook:  "FB",
  pinterest: "PI",
  linkedin:  "LI",
  tiktok:    "TK",
  web:       "WB",
  email:     "EM",
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.brief;
  return (
    <span style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600,
      letterSpacing: "0.04em", textTransform: "uppercase",
      padding: "3px 8px", borderRadius: 4,
      background: m.bg, color: m.color,
    }}>
      {m.label}
    </span>
  );
}

function PlatformTag({ platform }) {
  return (
    <span style={{
      fontFamily: SANS, fontSize: 9, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      padding: "2px 6px", borderRadius: 3,
      border: `1px solid ${T.border2}`,
      color: T.grey, background: "transparent",
    }}>
      {PLATFORM_ICON[platform] || platform?.slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}

// -- Overview Page -------------------------------------------------------------
function OverviewPage({ account, summary, listing }) {
  const mgr = account.portalConfig?.accountManager;
  const heroUrl = account.heroImageUrl || account.logoUrl || listing?.heroImage || null;
  const { textColor, subColor, accentColor, overlayStyle } = useAdaptiveColor(heroUrl, { region: "center", sampleHeight: 120 });

  const thisWeek = [
    summary?.scheduled > 0  && { type: "scheduled",  text: `${summary.scheduled} post${summary.scheduled > 1 ? "s" : ""} scheduled` },
    summary?.draft > 0       && { type: "draft",      text: `${summary.draft} item${summary.draft > 1 ? "s" : ""} in draft` },
    summary?.activeCampaign  && { type: "campaign",   text: `Active campaign: ${summary.activeCampaign}` },
  ].filter(Boolean);

  const statColor = (val, thresholds) => {
    if (val >= thresholds[0]) return T.green;
    if (val >= thresholds[1]) return T.amber;
    return T.grey;
  };

  return (
    <div>
      {/* Greeting banner */}
      <div style={{
        position: "relative", borderRadius: 12, overflow: "hidden",
        marginBottom: 32, minHeight: heroUrl ? 200 : "auto",
        display: "flex", alignItems: "flex-end",
      }}>
        {heroUrl && (
          <img src={heroUrl} alt="" style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            pointerEvents: "none", userSelect: "none",
          }} crossOrigin="anonymous" />
        )}
        {heroUrl && <div style={{ position: "absolute", inset: 0, ...overlayStyle }} />}
        <div style={{ position: heroUrl ? "relative" : "static", zIndex: 1, padding: heroUrl ? "28px 32px" : "0", width: "100%" }}>
          <div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: heroUrl ? accentColor : T.goldDim, marginBottom: 10 }}>
            Client Overview
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: heroUrl ? 40 : 36, fontWeight: 600, margin: "0 0 8px", color: heroUrl ? textColor : T.white }}>
            {greet(account.name)}
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 13, margin: 0, lineHeight: 1.7, color: heroUrl ? subColor : T.grey }}>
            Here is what is happening with your account this week.
          </p>
        </div>
      </div>

      {/* Listing card (if linked) */}
      {listing && (
        <div style={{ marginBottom: 32 }}>
          <SectionTitle>Your Listing</SectionTitle>
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "16px 20px", background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 10,
          }}>
            {listing.cardImage && (
              <img src={listing.cardImage} alt="" style={{ width: 56, height: 56, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: T.off, marginBottom: 3 }}>{listing.name}</div>
              {listing.heroTagline && (
                <div style={{ fontFamily: SANS, fontSize: 12, color: T.grey, marginBottom: 4 }}>{listing.heroTagline}</div>
              )}
              <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey2 }}>
                {[listing.city, listing.country].filter(Boolean).join(", ")}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <span style={{
                fontFamily: SANS, fontSize: 10, fontWeight: 600,
                letterSpacing: "0.04em", textTransform: "uppercase",
                padding: "3px 8px", borderRadius: 4,
                background: listing.status === "published" ? "#1a3a2244" : T.grey2 + "44",
                color: listing.status === "published" ? T.green : T.grey,
              }}>
                {listing.status === "published" ? "Live" : listing.status || "Draft"}
              </span>
              {listing.slug && (
                <div>
                  <a
                    href={`/wedding-venues/${listing.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontFamily: SANS, fontSize: 11, color: T.gold, textDecoration: "none", display: "inline-block", marginTop: 6 }}
                  >
                    View live page
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* This week */}
      {thisWeek.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <SectionTitle>This Week</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {thisWeek.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", background: T.card,
                border: `1px solid ${T.border}`, borderRadius: 8,
              }}>
                <span style={{ color: T.gold, fontSize: 12, flexShrink: 0 }}>
                  {item.type === "campaign" ? "◎" : item.type === "scheduled" ? "◈" : "◇"}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 13, color: T.off }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content pipeline stats */}
      {summary && (
        <div style={{ marginBottom: 32 }}>
          <SectionTitle>Content Pipeline</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {[
              { label: "Scheduled",       value: summary.scheduled,     color: statColor(summary.scheduled, [3, 1]) },
              { label: "In Progress",     value: summary.draft,         color: statColor(summary.draft, [2, 1]) },
              { label: "Live This Month", value: summary.liveThisMonth, color: statColor(summary.liveThisMonth, [4, 2]) },
            ].map(s => (
              <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, padding: "18px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontFamily: SANS, fontSize: 9, color: T.grey2, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
          {summary.lastPublished && (
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey, marginTop: 10, paddingLeft: 4 }}>
              Last published: <span style={{ color: T.off }}>{fmtDate(summary.lastPublished)}</span>
            </div>
          )}
        </div>
      )}

      {/* No content yet */}
      {summary && summary.scheduled === 0 && summary.draft === 0 && summary.liveThisMonth === 0 && (
        <div style={{ marginBottom: 32 }}>
          <EmptyState
            accent="Content Pipeline"
            title="Your strategy is being built"
            body="Your account team is developing your content calendar. Your first briefs will appear here as soon as they are ready for your review and approval."
          />
        </div>
      )}

      {/* Account manager */}
      {mgr?.name && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          {mgr.photo ? (
            <img src={mgr.photo} alt={mgr.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: T.gold + "22", border: `1px solid ${T.gold}44`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 13, fontWeight: 700, color: T.gold }}>
              {mgr.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          )}
          <div>
            <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: T.off, marginBottom: 2 }}>{mgr.name}</div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey }}>{mgr.title || "Your Account Manager"}</div>
            {mgr.email && (
              <a href={`mailto:${mgr.email}`} style={{ fontFamily: SANS, fontSize: 11, color: T.gold, textDecoration: "none" }}>
                {mgr.email}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -- Content Page --------------------------------------------------------------
function ContentPage({ account }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchContent({ managedAccountId: account.id });
      setItems(data || []);
      setLoading(false);
    })();
  }, [account.id]);

  const STATUS_TABS = [
    { key: "all",       label: "All" },
    { key: "brief",     label: "Brief" },
    { key: "draft",     label: "Draft" },
    { key: "review",    label: "Review" },
    { key: "approved",  label: "Approved" },
    { key: "scheduled", label: "Scheduled" },
    { key: "live",      label: "Live" },
  ];

  const filtered = activeStatus === "all" ? items : items.filter(i => i.status === activeStatus);

  if (loading) {
    return <div style={{ fontFamily: SANS, fontSize: 13, color: T.grey, padding: "40px 0" }}>Loading content...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: T.white, marginBottom: 6 }}>Content Pipeline</div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: 0, lineHeight: 1.7 }}>
          All content items in your pipeline, from brief through to published.
        </p>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {STATUS_TABS.map(st => {
          const count = st.key === "all" ? items.length : items.filter(i => i.status === st.key).length;
          if (st.key !== "all" && count === 0) return null;
          return (
            <button
              key={st.key}
              onClick={() => setActiveStatus(st.key)}
              style={{
                fontFamily: SANS, fontSize: 11, fontWeight: activeStatus === st.key ? 600 : 400,
                padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                border: `1px solid ${activeStatus === st.key ? T.gold : T.border}`,
                background: activeStatus === st.key ? T.gold + "18" : "transparent",
                color: activeStatus === st.key ? T.gold : T.grey,
                transition: "all 0.12s",
              }}
            >
              {st.label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          accent={items.length === 0 ? "Content Pipeline" : undefined}
          title={items.length === 0 ? "Your pipeline is being built" : `No ${activeStatus} items`}
          body={items.length === 0 ? "Your account team is preparing your first content items. They will appear here, organised by status, as they move through the pipeline." : null}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 90px 100px", gap: 12, padding: "8px 16px", fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.grey2 }}>
            <div>Title</div>
            <div>Type</div>
            <div>Platform</div>
            <div>Date</div>
            <div>Status</div>
          </div>
          {filtered.map(item => (
            <div key={item.id} style={{
              display: "grid", gridTemplateColumns: "1fr 80px 60px 90px 100px", gap: 12,
              padding: "14px 16px", background: T.card, border: `1px solid ${T.border}`,
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: T.off, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                {item.campaign && (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey, marginTop: 2 }}>{item.campaign}</div>
                )}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey, textTransform: "capitalize" }}>{item.type}</div>
              <div><PlatformTag platform={item.platform} /></div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey }}>{fmtShort(item.date) || "-"}</div>
              <div><StatusBadge status={item.status} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Campaigns Page ------------------------------------------------------------
const CAMPAIGN_STATUS_COLORS = {
  active:   { color: T.green, bg: "#1a3a2244" },
  paused:   { color: T.amber, bg: "#3a2a0044" },
  complete: { color: T.blue,  bg: "#1a2a4044" },
  archived: { color: T.grey,  bg: T.grey2 + "44" },
};

function CampaignsPage({ account }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchCampaigns(account.id);
      setCampaigns(data || []);
      setLoading(false);
    })();
  }, [account.id]);

  if (loading) {
    return <div style={{ fontFamily: SANS, fontSize: 13, color: T.grey, padding: "40px 0" }}>Loading campaigns...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: T.white, marginBottom: 6 }}>Campaigns</div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: 0, lineHeight: 1.7 }}>
          Grouped content campaigns running for your account.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          accent="Campaigns"
          title="No active campaigns"
          body="Campaigns group your content by theme or goal. Your account manager will set up your first campaign once your content strategy is in place."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {campaigns.map(c => {
            const s = CAMPAIGN_STATUS_COLORS[c.status] || CAMPAIGN_STATUS_COLORS.active;
            return (
              <div key={c.id} style={{ padding: "20px 24px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: c.description ? 10 : 0 }}>
                  <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: T.off }}>{c.name}</div>
                  <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 4, background: s.bg, color: s.color, flexShrink: 0 }}>
                    {c.status}
                  </span>
                </div>
                {c.description && (
                  <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: "0 0 10px", lineHeight: 1.7 }}>{c.description}</p>
                )}
                {(c.startDate || c.endDate) && (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey2 }}>
                    {fmtShort(c.startDate)} {c.startDate && c.endDate ? "to" : ""} {fmtShort(c.endDate)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -- Events Page ---------------------------------------------------------------
function EventsPage({ account, listing }) {
  const [events, setEvents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [bookings, setBookings]     = useState({});   // { [eventId]: [] }
  const [loadingBkgs, setLoadingBkgs] = useState({}); // { [eventId]: bool }
  const [showRequest, setShowRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({ eventType: '', preferredDate: '', notes: '' });
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const venueId = listing?.id || null;
      const fetched = venueId
        ? await fetchUpcomingEventsForVenue(venueId, 20)
        : [];
      if (!cancelled) { setEvents(fetched); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [account?.id, listing?.id]);

  const upcoming = events.filter(e => {
    if (!e.startDate) return false;
    return e.startDate >= new Date().toISOString().split('T')[0];
  });
  const past = events.filter(e => {
    if (!e.startDate) return false;
    return e.startDate < new Date().toISOString().split('T')[0];
  });

  const toggleBookings = async (eventId) => {
    if (expandedId === eventId) { setExpandedId(null); return; }
    setExpandedId(eventId);
    if (!bookings[eventId]) {
      setLoadingBkgs(prev => ({ ...prev, [eventId]: true }));
      const rows = await fetchPortalEventBookings(eventId);
      setBookings(prev => ({ ...prev, [eventId]: rows }));
      setLoadingBkgs(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const STATUS_COLOUR = { confirmed: T.green, pending: T.amber, cancelled: T.red, waitlist: '#a78bfa' };

  function EventCard({ ev }) {
    const dateStr   = formatEventDate(ev.startDate);
    const timeStr   = ev.startTime ? formatEventTime(ev.startTime) : null;
    const isExpanded = expandedId === ev.id;
    const evBookings = bookings[ev.id] || [];
    const confirmed  = evBookings.filter(b => b.status === 'confirmed').length;
    const totalGuests = evBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.guest_count || 1), 0);

    return (
      <div style={{
        background: T.card, border: `1px solid ${isExpanded ? T.border2 : T.border}`,
        borderRadius: 4, marginBottom: 12,
        transition: 'border-color 0.2s',
      }}>
        {/* Main row */}
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 20 }}>
          {/* Date badge */}
          <div style={{ flexShrink: 0, width: 52, textAlign: "center", background: T.border, borderRadius: 4, padding: "8px 6px" }}>
            <div style={{ fontFamily: SERIF, fontSize: 22, color: T.gold, lineHeight: 1 }}>
              {ev.startDate ? new Date(ev.startDate + 'T00:00:00').getDate() : "—"}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 9, color: T.grey, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
              {ev.startDate ? new Date(ev.startDate + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' }) : ""}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: SERIF, fontSize: 17, color: T.off, fontWeight: 500 }}>{ev.title}</span>
              {ev.isVirtual && (
                <span style={{ fontFamily: SANS, fontSize: 9, color: T.blue, letterSpacing: "0.1em", textTransform: "uppercase",
                  background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 2, padding: "2px 6px" }}>
                  Virtual
                </span>
              )}
              {ev.status === 'cancelled' && (
                <span style={{ fontFamily: SANS, fontSize: 9, color: T.red, letterSpacing: "0.1em", textTransform: "uppercase",
                  background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 2, padding: "2px 6px" }}>
                  Cancelled
                </span>
              )}
            </div>
            {ev.subtitle && (
              <div style={{ fontFamily: SANS, fontSize: 12, color: T.grey, marginBottom: 6 }}>{ev.subtitle}</div>
            )}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {dateStr && (
                <span style={{ fontFamily: SANS, fontSize: 11, color: T.grey2 }}>📅 {dateStr}{timeStr ? ` · ${timeStr}` : ""}</span>
              )}
              {ev.locationName && !ev.isVirtual && (
                <span style={{ fontFamily: SANS, fontSize: 11, color: T.grey2 }}>📍 {ev.locationName}</span>
              )}
              {ev.capacity && (
                <span style={{ fontFamily: SANS, fontSize: 11, color: T.grey2 }}>👥 {ev.capacity} capacity</span>
              )}
              {typeof ev.bookingCount === 'number' && (
                <span style={{ fontFamily: SANS, fontSize: 11, color: T.green }}>✓ {ev.bookingCount} registered</span>
              )}
            </div>
          </div>

          {/* Right: type badge + bookings toggle */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ fontFamily: SANS, fontSize: 9, color: T.gold, letterSpacing: "0.1em", textTransform: "uppercase",
              background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 2, padding: "3px 8px" }}>
              {ev.eventType?.replace(/_/g, ' ') || 'Event'}
            </div>
            {ev.bookingMode !== 'external' && (
              <button
                onClick={() => toggleBookings(ev.id)}
                style={{
                  fontFamily: SANS, fontSize: 10, color: isExpanded ? T.gold : T.grey,
                  background: 'transparent', border: `1px solid ${isExpanded ? T.gold + '40' : T.border}`,
                  borderRadius: 3, padding: '4px 10px', cursor: 'pointer',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {isExpanded ? 'Hide' : 'Attendees'} {ev.bookingCount > 0 ? `· ${ev.bookingCount}` : ''}
              </button>
            )}
          </div>
        </div>

        {/* Expanded bookings panel */}
        {isExpanded && (
          <div style={{ borderTop: `1px solid ${T.border}`, padding: '16px 24px 20px' }}>
            {loadingBkgs[ev.id] ? (
              <div style={{ fontFamily: SANS, fontSize: 12, color: T.grey2, padding: '12px 0' }}>Loading attendees…</div>
            ) : evBookings.length === 0 ? (
              <div style={{ fontFamily: SANS, fontSize: 12, color: T.grey2, padding: '12px 0' }}>No registrations yet.</div>
            ) : (
              <>
                {/* Summary strip */}
                <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                  {[
                    { label: 'Registered', val: confirmed,    colour: T.green },
                    { label: 'Total guests', val: totalGuests, colour: T.gold },
                    { label: 'All bookings', val: evBookings.length, colour: T.off },
                  ].map(({ label, val, colour }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: SERIF, fontSize: 20, color: colour }}>{val}</div>
                      <div style={{ fontFamily: SANS, fontSize: 9, color: T.grey, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Attendee rows */}
                <div style={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  {/* Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 60px 80px', gap: 12, padding: '7px 14px', background: T.bg }}>
                    {['Name', 'Email', 'Guests', 'Status'].map(h => (
                      <span key={h} style={{ fontFamily: SANS, fontSize: 9, color: T.grey, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>{h}</span>
                    ))}
                  </div>
                  {evBookings.map((b, i) => (
                    <div key={b.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 60px 80px', gap: 12,
                      padding: '10px 14px', alignItems: 'center',
                      borderTop: i > 0 ? `1px solid ${T.border}` : 'none',
                    }}>
                      <div style={{ fontFamily: SANS, fontSize: 13, color: T.off }}>{b.first_name} {b.last_name}</div>
                      <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.email}</div>
                      <div style={{ fontFamily: SERIF, fontSize: 16, color: T.off, textAlign: 'center' }}>{b.guest_count || 1}</div>
                      <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, color: STATUS_COLOUR[b.status] || T.grey,
                        background: `${STATUS_COLOUR[b.status] || T.grey}18`, border: `1px solid ${STATUS_COLOUR[b.status] || T.grey}35`,
                        borderRadius: 3, padding: '3px 7px', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
                        {b.status}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: T.gold, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Events</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 28, color: T.off, fontWeight: 400, margin: "0 0 8px" }}>Your Events</h1>
          <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: 0, lineHeight: 1.7 }}>
            Manage open days, virtual tours, and exhibitions. Click Attendees to view registrations.
          </p>
        </div>
        <button
          onClick={() => setShowRequest(r => !r)}
          style={{
            fontFamily: SANS, fontSize: 11, color: T.gold,
            background: 'transparent', border: `1px solid ${T.gold}40`,
            borderRadius: 3, padding: '8px 16px', cursor: 'pointer',
            letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0, marginTop: 4,
          }}
        >
          + Request Event
        </button>
      </div>

      {/* Request event form */}
      {showRequest && (
        <div style={{ background: T.card, border: `1px solid ${T.border2}`, borderRadius: 4, padding: '24px 28px', marginBottom: 32 }}>
          {requestSent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontFamily: SERIF, fontSize: 20, color: T.gold, marginBottom: 8 }}>Request sent</div>
              <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: 0 }}>
                Your account manager will be in touch to confirm details and set up the event.
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: SANS, fontSize: 10, color: T.gold, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Request a New Event</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: T.grey, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Event Type</div>
                  <select
                    value={requestForm.eventType}
                    onChange={e => setRequestForm(f => ({ ...f, eventType: e.target.value }))}
                    style={{ width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3, padding: '9px 12px', fontFamily: SANS, fontSize: 13, color: T.off, outline: 'none' }}
                  >
                    <option value="">Select type…</option>
                    {['Open Day', 'Private Viewing', 'Wedding Fair', 'Masterclass', 'Showcase', 'Experience', 'Virtual Tour'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: T.grey, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Preferred Date</div>
                  <input
                    type="date"
                    value={requestForm.preferredDate}
                    onChange={e => setRequestForm(f => ({ ...f, preferredDate: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3, padding: '9px 12px', fontFamily: SANS, fontSize: 13, color: T.off, outline: 'none', colorScheme: 'dark' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: SANS, fontSize: 10, color: T.grey, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Notes for your account manager</div>
                <textarea
                  value={requestForm.notes}
                  onChange={e => setRequestForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Expected capacity, theme, any special requirements…"
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 3, padding: '9px 12px', fontFamily: SANS, fontSize: 13, color: T.off, outline: 'none', resize: 'vertical' }}
                />
              </div>
              <button
                onClick={() => {
                  // For now: log the request and show confirmation
                  // In future: submit via edge function → creates a CRM task/lead
                  console.log('[Portal] Event request:', { account: account?.id, ...requestForm });
                  setRequestSent(true);
                  setTimeout(() => { setShowRequest(false); setRequestSent(false); setRequestForm({ eventType: '', preferredDate: '', notes: '' }); }, 4000);
                }}
                style={{
                  fontFamily: SANS, fontSize: 11, color: '#1a1a1a',
                  background: T.gold, border: 'none', borderRadius: 3,
                  padding: '10px 24px', cursor: 'pointer',
                  letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                }}
              >
                Send Request
              </button>
            </>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ fontFamily: SANS, fontSize: 13, color: T.grey2, padding: "40px 0", textAlign: "center" }}>Loading events…</div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 4, padding: "48px 32px", textAlign: "center" }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: T.off, marginBottom: 12 }}>No events scheduled</div>
          <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, maxWidth: 360, margin: "0 auto 24px", lineHeight: 1.8 }}>
            Use the Request Event button above to ask your account manager to schedule an open day, showcase, or virtual tour.
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <div style={{ fontFamily: SANS, fontSize: 10, color: T.gold, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
                Upcoming · {upcoming.length} event{upcoming.length !== 1 ? 's' : ''}
              </div>
              {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <div style={{ fontFamily: SANS, fontSize: 10, color: T.grey2, letterSpacing: "0.2em", textTransform: "uppercase", margin: "32px 0 16px" }}>
                Past events · {past.length}
              </div>
              {past.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}

// -- Performance Page ----------------------------------------------------------
function PerformancePage({ account, listing, summary }) {
  const now       = new Date();
  const monthName = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const mgr       = account?.portalConfig?.accountManager;

  // Time range state
  const [days, setDays]           = useState(30);

  // Live data states
  const [connections, setConns]   = useState(null);
  const [scData, setScData]       = useState(null);
  const [gaData, setGaData]       = useState(null);
  const [bookingCount, setBkCount]= useState(null);
  const [entityData, setEntData]  = useState(null);
  const [dataLoading, setDLoding] = useState(true);

  // Real content metrics from summary
  const published  = summary?.liveThisMonth ?? 0;
  const scheduled  = summary?.scheduled     ?? 0;
  const inPipeline = summary?.draft         ?? 0;
  const lastPub    = summary?.lastPublished ? fmtDate(summary.lastPublished) : null;
  const campaign   = summary?.activeCampaign ?? null;
  const hasContent = published > 0 || scheduled > 0 || inPipeline > 0;

  // Build curated narrative sentences
  const narrative = [];
  if (published > 0)  narrative.push(`${published} piece${published !== 1 ? "s" : ""} of content published this month.`);
  if (scheduled > 0)  narrative.push(`${scheduled} post${scheduled !== 1 ? "s" : ""} scheduled for the coming weeks.`);
  if (campaign)       narrative.push(`Active campaign: ${campaign}.`);
  if (!hasContent)    narrative.push("Your content programme is being prepared. Items will appear here as they enter the pipeline.");

  function startDate(d) {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    return dt.toISOString().split("T")[0];
  }

  useEffect(() => {
    let cancelled = false;
    async function loadLiveData() {
      setDLoding(true);
      setScData(null);
      setGaData(null);
      setEntData(null);

      const start = startDate(days);
      const end   = new Date().toISOString().split("T")[0];

      // 1. Load connection status
      const conns = await getConnections().catch(() => null);
      if (cancelled) return;
      setConns(conns);

      const tasks = [];

      // 2. GSC
      const scConn = conns?.search_console;
      if (scConn?.status === "connected" && scConn.selected_property_id) {
        tasks.push(
          fetchSearchConsoleData(scConn.selected_property_id, { rowLimit: 8, startDate: start, endDate: end })
            .then(d => { if (!cancelled) setScData(d); })
            .catch(() => { if (!cancelled) setScData("error"); })
        );
      }

      // 3. GA
      const gaConn = conns?.analytics;
      if (gaConn?.status === "connected" && gaConn.selected_property_id) {
        tasks.push(
          fetchAnalyticsData(gaConn.selected_property_id, { startDate: start, endDate: end })
            .then(d => { if (!cancelled) setGaData(d); })
            .catch(() => { if (!cancelled) setGaData("error"); })
        );
      }

      // 4. Event bookings count for this venue
      if (listing?.id) {
        tasks.push(
          supabase
            .from("event_bookings")
            .select("id", { count: "exact", head: true })
            .eq("venue_id", listing.id)
            .gte("created_at", start + "T00:00:00")
            .eq("status", "confirmed")
            .then(({ count }) => { if (!cancelled) setBkCount(count ?? 0); })
            .catch(() => {})
        );

        // 5. Profile views + enquiry signals via user_events edge function
        tasks.push(
          fetchEntityEvents(listing.id, days)
            .then(d => { if (!cancelled) setEntData(d); })
            .catch(() => {})
        );
      }

      await Promise.allSettled(tasks);
      if (!cancelled) setDLoding(false);
    }
    loadLiveData();
    return () => { cancelled = true; };
  }, [days, listing?.id]);

  const scConn      = connections?.search_console;
  const gaConn      = connections?.analytics;
  const scConnected = scConn?.status === "connected";
  const gaConnected = gaConn?.status === "connected";

  const scTotals = scData && scData !== "error" ? scData?.totals : null;
  const scRows   = scData && scData !== "error" ? (scData?.rows || []) : [];
  const gaS      = gaData && gaData !== "error" ? gaData?.summary : null;

  // Profile views + enquiry signals derived from entity_events
  const profileViews      = entityData?.byType?.["profile_view"]       ?? null;
  const enquiriesStarted  = entityData?.byType?.["enquiry_started"]    ?? null;
  const enquiriesSubmitted= entityData?.byType?.["enquiry_submitted"]  ?? null;
  const enqConversion     = enquiriesStarted > 0 && enquiriesSubmitted != null
    ? `${Math.round((enquiriesSubmitted / enquiriesStarted) * 100)}%`
    : null;

  // Est. pipeline: bookings × listing price × 8% conversion assumption
  const estPipeline = listing?.priceFrom && bookingCount > 0
    ? Math.round(bookingCount * listing.priceFrom * 0.08).toLocaleString()
    : null;
  const currency = listing?.priceCurrency || "EUR";

  // Sub-components
  function DayFilter() {
    return (
      <div style={{ display: "flex", gap: 4 }}>
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{
            fontFamily: SANS, fontSize: 10, padding: "4px 10px",
            background: days === d ? T.gold : "transparent",
            color: days === d ? "#0b0906" : T.grey,
            border: `1px solid ${days === d ? T.gold : T.border}`,
            borderRadius: 3, cursor: "pointer",
            fontWeight: days === d ? 700 : 400,
            letterSpacing: "0.08em", transition: "all 0.15s",
          }}>{d}d</button>
        ))}
      </div>
    );
  }

  function LiveBadge({ connected }) {
    return (
      <span style={{
        fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", padding: "3px 10px", borderRadius: 20,
        border: `1px solid ${connected ? T.gold + "44" : T.border}`,
        color: connected ? T.gold : T.grey2, flexShrink: 0,
      }}>
        {connected ? "Live" : "Not Connected"}
      </span>
    );
  }

  function NotConnectedNote({ service }) {
    return (
      <div style={{ padding: "20px 24px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6 }}>
        <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey2, margin: 0, lineHeight: 1.7 }}>
          {service} is not yet connected for this account. Contact your account manager to enable this view.
        </p>
      </div>
    );
  }

  function KpiGrid({ items }) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 1 }}>
        {items.map(m => (
          <div key={m.label} style={{ background: T.card, border: `1px solid ${T.border}`, padding: "18px 18px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: m.color || T.off, lineHeight: 1, marginBottom: 6 }}>
              {m.value}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 9, color: T.grey2, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: m.note ? 3 : 0 }}>
              {m.label}
            </div>
            {m.note && <div style={{ fontFamily: SANS, fontSize: 9, color: T.grey2, opacity: 0.65 }}>{m.note}</div>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header + time filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: T.white, marginBottom: 6 }}>Performance</div>
          <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: 0, lineHeight: 1.7 }}>
            The impact of your account, measured across content delivery, search presence, and enquiry performance.
          </p>
        </div>
        <DayFilter />
      </div>

      {/* Month in review */}
      <div style={{ marginBottom: 36, padding: "24px 28px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, borderTop: `2px solid ${T.goldDim}` }}>
        <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.goldDim, marginBottom: 10 }}>
          {monthName}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: T.off, marginBottom: 14, lineHeight: 1.3 }}>
          {hasContent ? "Here is where things stand this month." : "Your account is being set up."}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {narrative.map((line, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ color: T.goldDim, fontSize: 10, marginTop: 2, flexShrink: 0 }}>-</span>
              <span style={{ fontFamily: SANS, fontSize: 13, color: T.grey, lineHeight: 1.7 }}>{line}</span>
            </div>
          ))}
        </div>
        {mgr?.name && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
            {mgr.photo && <img src={mgr.photo} alt={mgr.name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
            <span style={{ fontFamily: SANS, fontSize: 11, color: T.grey2 }}>
              Your account manager is {mgr.name}{mgr.title ? `, ${mgr.title}` : ""}.
              {mgr.email && <> Contact: <a href={`mailto:${mgr.email}`} style={{ color: T.gold, textDecoration: "none" }}>{mgr.email}</a>.</>}
            </span>
          </div>
        )}
      </div>

      {/* Directory presence */}
      {listing && (
        <div style={{ marginBottom: 36 }}>
          <SectionTitle>Directory Presence</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {[
              { label: "Rating",         value: listing.rating ? `${listing.rating}/5` : "-", color: T.gold,  note: listing.reviewCount ? `${listing.reviewCount} review${listing.reviewCount !== 1 ? "s" : ""}` : null },
              { label: "Listing Status", value: listing.status === "published" ? "Live" : listing.status || "Draft", color: listing.status === "published" ? T.green : T.grey, note: listing.name },
              { label: "Starting From",  value: listing.priceFrom ? `${listing.priceCurrency || "EUR"} ${listing.priceFrom.toLocaleString()}` : "-", color: T.off, note: null },
            ].map(s => (
              <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, padding: "20px 20px 18px", textAlign: "center" }}>
                <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontFamily: SANS, fontSize: 9, color: T.grey2, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: s.note ? 4 : 0 }}>{s.label}</div>
                {s.note && <div style={{ fontFamily: SANS, fontSize: 10, color: T.grey }}>{s.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Views */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionTitle style={{ margin: 0 }}>Profile Views</SectionTitle>
          <span style={{
            fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "3px 10px", borderRadius: 20,
            border: `1px solid ${profileViews > 0 ? T.gold + "44" : T.border}`,
            color: profileViews > 0 ? T.gold : T.grey2,
          }}>
            {profileViews == null ? "Loading…" : profileViews > 0 ? "Active" : "Building"}
          </span>
        </div>
        {profileViews == null ? (
          <div style={{ padding: "20px 24px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 6 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, color: T.grey2 }}>Loading profile data…</div>
          </div>
        ) : (
          <>
            <KpiGrid items={[
              {
                label: "Page Views",
                value: profileViews.toLocaleString(),
                color: T.gold,
                note: `last ${days}d`,
              },
              {
                label: "Enquiries Started",
                value: enquiriesStarted != null ? enquiriesStarted.toLocaleString() : "-",
                color: T.off,
                note: "form opens",
              },
              {
                label: "Enquiries Sent",
                value: enquiriesSubmitted != null ? enquiriesSubmitted.toLocaleString() : "-",
                color: enquiriesSubmitted > 0 ? T.green : T.grey2,
                note: enqConversion ? `${enqConversion} conversion` : "submitted forms",
              },
            ]} />
            {profileViews === 0 && (
              <p style={{ fontFamily: SANS, fontSize: 11, color: T.grey2, marginTop: 12, lineHeight: 1.6 }}>
                No profile views recorded yet for this period. Views will appear here once your listing receives visitors.
              </p>
            )}
          </>
        )}
      </div>

      {/* Content Impact */}
      <div style={{ marginBottom: 36 }}>
        <SectionTitle>Content Impact</SectionTitle>
        <div style={{ padding: "24px 28px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: T.off }}>Content Pipeline</div>
            <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, border: `1px solid ${hasContent ? T.gold + "44" : T.border2}`, color: hasContent ? T.gold : T.grey2, flexShrink: 0 }}>
              {hasContent ? "Live" : "Building"}
            </span>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: "0 0 20px", lineHeight: 1.8 }}>
            Content published, in progress, and scheduled across your active campaigns.
            {lastPub && <> Last published {lastPub}.</>}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { label: "Published This Month", value: published },
              { label: "Scheduled",            value: scheduled },
              { label: "In Pipeline",          value: inPipeline },
            ].map(m => (
              <div key={m.label} style={{ padding: "14px 14px 12px", background: T.bg, border: `1px solid ${m.value > 0 ? T.border2 : T.border}`, borderRadius: 6, textAlign: "center" }}>
                <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: m.value > 0 ? T.off : T.grey2, lineHeight: 1, marginBottom: 6 }}>
                  {m.value > 0 ? m.value : "-"}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 9, color: T.grey2, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search Visibility — GSC */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionTitle style={{ margin: 0 }}>Search Visibility</SectionTitle>
          <LiveBadge connected={scConnected} />
        </div>
        {!scConnected ? (
          <NotConnectedNote service="Google Search Console" />
        ) : scData === null ? (
          <div style={{ padding: "20px 24px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 6 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, color: T.grey2 }}>Loading search data…</div>
          </div>
        ) : scData === "error" ? (
          <div style={{ padding: "20px 24px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 6 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, color: T.grey2 }}>Could not load Search Console data. Please try again later.</div>
          </div>
        ) : (
          <div>
            <KpiGrid items={[
              { label: "Impressions",  value: scTotals?.impressions?.toLocaleString() || "0",   color: T.off,  note: `last ${days}d` },
              { label: "Clicks",       value: scTotals?.clicks?.toLocaleString()      || "0",   color: T.gold, note: `last ${days}d` },
              { label: "CTR",          value: scTotals?.ctr != null ? `${(scTotals.ctr * 100).toFixed(1)}%` : "-", color: T.off, note: "click-through" },
              { label: "Avg Position", value: scTotals?.position != null ? scTotals.position.toFixed(1) : "-", color: T.off, note: "search ranking" },
            ]} />
            {scRows.length > 0 && (
              <div style={{ marginTop: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: "0 0 6px 6px", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 70px", gap: 8, padding: "8px 16px", background: T.bg }}>
                  {["Top Queries", "Clicks", "Impr.", "Position"].map(h => (
                    <span key={h} style={{ fontFamily: SANS, fontSize: 9, color: T.grey, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600, textAlign: h !== "Top Queries" ? "right" : "left" }}>{h}</span>
                  ))}
                </div>
                {scRows.slice(0, 6).map((row, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 80px 70px", gap: 8, padding: "9px 16px", borderTop: `1px solid ${T.border}`, alignItems: "center" }}>
                    <span style={{ fontFamily: SANS, fontSize: 12, color: T.off, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.query}</span>
                    <span style={{ fontFamily: SANS, fontSize: 12, color: T.gold, textAlign: "right" }}>{row.clicks?.toLocaleString()}</span>
                    <span style={{ fontFamily: SANS, fontSize: 12, color: T.grey, textAlign: "right" }}>{row.impressions?.toLocaleString()}</span>
                    <span style={{ fontFamily: SANS, fontSize: 12, color: T.grey, textAlign: "right" }}>{row.position?.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Traffic Overview — GA */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionTitle style={{ margin: 0 }}>Traffic Overview</SectionTitle>
          <LiveBadge connected={gaConnected} />
        </div>
        {!gaConnected ? (
          <NotConnectedNote service="Google Analytics" />
        ) : gaData === null ? (
          <div style={{ padding: "20px 24px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 6 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, color: T.grey2 }}>Loading analytics data…</div>
          </div>
        ) : gaData === "error" ? (
          <div style={{ padding: "20px 24px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 6 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, color: T.grey2 }}>Could not load Analytics data. Please try again later.</div>
          </div>
        ) : (
          <KpiGrid items={[
            { label: "Sessions",         value: gaS?.sessions?.toLocaleString()         || "0", color: T.gold, note: `last ${days}d` },
            { label: "Engaged Sessions", value: gaS?.engagedSessions?.toLocaleString()  || "0", color: T.off,  note: "quality visits" },
            { label: "Bounce Rate",      value: gaS?.bounceRate != null ? `${gaS.bounceRate}%` : "-", color: gaS?.bounceRate > 60 ? T.red : gaS?.bounceRate > 40 ? T.amber : T.green, note: gaS?.bounceRate > 60 ? "needs attention" : gaS?.bounceRate > 40 ? "room to improve" : "performing well" },
          ]} />
        )}
      </div>

      {/* Enquiry Value */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionTitle style={{ margin: 0 }}>Enquiry Value</SectionTitle>
          <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, border: `1px solid ${bookingCount > 0 ? T.gold + "44" : T.border}`, color: bookingCount > 0 ? T.gold : T.grey2 }}>
            {bookingCount > 0 ? "Active" : "Building"}
          </span>
        </div>
        <KpiGrid items={[
          { label: "Event Bookings",  value: bookingCount != null ? bookingCount.toString() : "-", color: T.gold, note: `last ${days}d` },
          { label: "Starting Price",  value: listing?.priceFrom ? `${currency} ${listing.priceFrom.toLocaleString()}` : "-", color: T.off, note: "per event / stay" },
          { label: "Est. Pipeline",   value: estPipeline ? `${currency} ${estPipeline}` : "-", color: estPipeline ? T.green : T.grey2, note: "indicative value" },
        ]} />
        {bookingCount === 0 && (
          <p style={{ fontFamily: SANS, fontSize: 11, color: T.grey2, marginTop: 12, lineHeight: 1.6 }}>
            No confirmed event bookings in this period. Create and publish an event to start tracking enquiry value.
          </p>
        )}
      </div>
    </div>
  );
}

// -- Brand Page ----------------------------------------------------------------
function BrandPage({ account, listing }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: T.white, marginBottom: 6 }}>Your Brand</div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: 0, lineHeight: 1.7 }}>
          Your live listing and brand identity as it appears in the directory.
        </p>
      </div>

      {listing ? (
        <div>
          {/* Hero image */}
          {(listing.heroImage || listing.cardImage) && (
            <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 24, height: 220, position: "relative" }}>
              <img
                src={listing.heroImage || listing.cardImage}
                alt={listing.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 24px" }}>
                <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{listing.name}</div>
                {listing.heroTagline && (
                  <div style={{ fontFamily: SANS, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{listing.heroTagline}</div>
                )}
              </div>
            </div>
          )}

          {/* Listing details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Listing Name",     value: listing.name },
              { label: "Location",         value: [listing.city, listing.country].filter(Boolean).join(", ") || "-" },
              { label: "Status",           value: listing.status === "published" ? "Live" : listing.status || "Draft" },
              { label: "Listing Type",     value: listing.listingType || "-" },
            ].map(f => (
              <div key={f.label} style={{ padding: "14px 16px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.grey2, marginBottom: 6 }}>{f.label}</div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: T.off }}>{f.value}</div>
              </div>
            ))}
          </div>

          {listing.slug && (
            <a
              href={`/wedding-venues/${listing.slug}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: SANS, fontSize: 13, fontWeight: 600,
                padding: "10px 20px", borderRadius: 6,
                border: `1px solid ${T.gold}`, color: T.gold,
                textDecoration: "none", background: "transparent",
                transition: "background 0.15s",
              }}
            >
              View your live listing page
            </a>
          )}
        </div>
      ) : (
        <EmptyState
          accent="Your Brand"
          title="Listing not yet linked"
          body="Your account manager will connect your directory listing to this portal. Once linked, your live page, brand identity, and editorial presence will be visible here."
        />
      )}
    </div>
  );
}

// -- Requests Page -------------------------------------------------------------
const REQUEST_TYPES = [
  { value: "content-brief",  label: "Content Brief" },
  { value: "campaign-idea",  label: "Campaign Idea" },
  { value: "listing-change", label: "Listing Update" },
  { value: "other",          label: "Other" },
];

function RequestsPage({ account }) {
  const [form, setForm]       = useState({ type: "content-brief", subject: "", body: "", urgency: "normal" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return;
    setSending(true);
    // Store locally - production would POST to an API or Supabase table
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 28, color: T.off, marginBottom: 10, fontWeight: 500 }}>Request Sent</div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, lineHeight: 1.8, maxWidth: 360, margin: "0 auto 24px" }}>
          Your request has been received. Your account manager will be in touch within 24 hours.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ type: "content-brief", subject: "", body: "", urgency: "normal" }); }}
          style={{ fontFamily: SANS, fontSize: 12, color: T.gold, background: "none", border: `1px solid ${T.gold}44`, borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}
        >
          Submit another request
        </button>
      </div>
    );
  }

  const inputStyle = {
    width: "100%", padding: "10px 12px",
    background: T.card, border: `1px solid ${T.border2}`,
    borderRadius: 6, color: T.off,
    fontFamily: SANS, fontSize: 13,
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: T.white, marginBottom: 6 }}>Submit a Request</div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: 0, lineHeight: 1.7 }}>
          Send a brief, suggest a campaign idea, or request changes to your listing.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
        {/* Request type */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: T.grey, display: "block", marginBottom: 8 }}>Request Type</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {REQUEST_TYPES.map(rt => (
              <button
                key={rt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: rt.value }))}
                style={{
                  fontFamily: SANS, fontSize: 12, fontWeight: form.type === rt.value ? 600 : 400,
                  padding: "10px 14px", borderRadius: 6, cursor: "pointer",
                  border: `1px solid ${form.type === rt.value ? T.gold : T.border}`,
                  background: form.type === rt.value ? T.gold + "18" : T.card,
                  color: form.type === rt.value ? T.gold : T.grey,
                  textAlign: "left", transition: "all 0.12s",
                }}
              >
                {rt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: T.grey, display: "block", marginBottom: 8 }}>Subject</label>
          <input
            type="text"
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Brief title for your request..."
            style={inputStyle}
            required
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: T.grey, display: "block", marginBottom: 8 }}>Details</label>
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Describe your request in as much detail as helpful..."
            rows={5}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            required
          />
        </div>

        {/* Urgency */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: T.grey, display: "block", marginBottom: 8 }}>Urgency</label>
          <select
            value={form.urgency}
            onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="low">Low - no rush</option>
            <option value="normal">Normal</option>
            <option value="high">High - needed soon</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={sending || !form.subject.trim() || !form.body.trim()}
          style={{
            fontFamily: SANS, fontSize: 13, fontWeight: 600,
            padding: "12px 28px", borderRadius: 6,
            background: (sending || !form.subject.trim() || !form.body.trim()) ? T.grey2 : T.gold,
            color: (sending || !form.subject.trim() || !form.body.trim()) ? T.grey : "#0b0906",
            border: "none", cursor: (sending || !form.subject.trim() || !form.body.trim()) ? "not-allowed" : "pointer",
            opacity: (sending || !form.subject.trim() || !form.body.trim()) ? 0.6 : 1,
            transition: "all 0.15s",
          }}
        >
          {sending ? "Sending..." : "Send Request"}
        </button>
      </form>
    </div>
  );
}

// -- Settings Page -------------------------------------------------------------
function SettingsPage({ account }) {
  const [notif, setNotif] = useState({ contentUpdates: true, campaignUpdates: true, reportReady: true, weeklyDigest: false });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: T.white, marginBottom: 6 }}>Settings</div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, margin: 0, lineHeight: 1.7 }}>
          Your account preferences and contact information.
        </p>
      </div>

      {/* Account info */}
      <div style={{ marginBottom: 32 }}>
        <SectionTitle>Account Details</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "Account Name",   value: account.name },
            { label: "Plan",           value: account.plan ? (account.plan.charAt(0).toUpperCase() + account.plan.slice(1)) : "-" },
            { label: "Primary Contact", value: account.primaryContactName || "-" },
            { label: "Contact Email",  value: account.primaryContactEmail || "-" },
            { label: "Status",         value: account.serviceStatus || account.status || "-" },
            { label: "Account Manager", value: account.accountManager || (account.portalConfig?.accountManager?.name) || "-" },
          ].map(f => (
            <div key={f.label} style={{ padding: "14px 16px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.grey2, marginBottom: 6 }}>{f.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 13, color: T.off }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification preferences */}
      <div>
        <SectionTitle>Notification Preferences</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[
            { key: "contentUpdates", label: "Content updates", desc: "When new content items are added or status changes" },
            { key: "campaignUpdates", label: "Campaign updates", desc: "When campaigns are launched or paused" },
            { key: "reportReady",    label: "Report ready",    desc: "When your monthly performance report is available" },
            { key: "weeklyDigest",   label: "Weekly digest",   desc: "A summary of activity and upcoming content" },
          ].map(item => (
            <div key={item.key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", background: T.card, border: `1px solid ${T.border}`,
            }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: T.off, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: T.grey }}>{item.desc}</div>
              </div>
              <button
                onClick={() => setNotif(n => ({ ...n, [item.key]: !n[item.key] }))}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: "none",
                  background: notif[item.key] ? T.gold : T.border2,
                  cursor: "pointer", position: "relative",
                  transition: "background 0.2s", flexShrink: 0,
                }}
              >
                <div style={{
                  position: "absolute", top: 3,
                  left: notif[item.key] ? 21 : 3,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: SANS, fontSize: 11, color: T.grey2, marginTop: 12, lineHeight: 1.6 }}>
          Notification settings are for reference. Contact your account manager to update email preferences.
        </p>
      </div>
    </div>
  );
}

// -- Main Portal Shell ---------------------------------------------------------
export default function ClientPortal() {
  const { vendor, isAuthenticated, loading: authLoading } = useVendorAuth();
  const [account,  setAccount]  = useState(null);
  const [listing,  setListing]  = useState(null);
  const [menu,     setMenu]     = useState([]);
  const [tab,      setTab]      = useState("overview");
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [sideOpen, setSideOpen] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      setLoading(true);
      let acc = null;

      if (isAuthenticated && vendor?.id) {
        acc = await fetchManagedAccountByVendorId(vendor.id);
      }

      // Dev fallback
      if (!acc && import.meta.env.DEV) acc = DEV_ACCOUNT;

      if (acc) {
        setAccount(acc);
        const cfg = acc.portalConfig || (await fetchPortalConfig(acc.id, acc.plan || 'essentials'));
        const sorted = [...(cfg?.menu || buildDefaultPortalConfig(acc.plan).menu)]
          .sort((a, b) => a.order - b.order)
          .filter(m => m.enabled);
        setMenu(sorted);
        if (sorted.length > 0) setTab(sorted[0].key);

        // Load content summary and linked listing in parallel
        const [contentSummary, linkedListing] = await Promise.all([
          fetchClientContentSummary(acc.id),
          fetchListingByManagedAccountId(acc.id).catch(() => null),
        ]);
        setSummary(contentSummary);
        setListing(linkedListing);
      }
      setLoading(false);
    }
    load();
  }, [authLoading, isAuthenticated, vendor]);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 13, color: T.grey, letterSpacing: "2px" }}>
          Loading your portal...
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 32 }}>
        <div style={{ fontFamily: SERIF, fontSize: 28, color: T.off }}>Portal not found</div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: T.grey, textAlign: "center", lineHeight: 1.8, maxWidth: 360 }}>
          Your account does not have a client portal set up yet.<br />
          Please contact your account manager.
        </p>
      </div>
    );
  }

  const SIDEBAR_W = sideOpen ? 240 : 64;

  function renderPage() {
    switch (tab) {
      case "overview":    return <OverviewPage account={account} summary={summary} listing={listing} />;
      case "content":     return <ContentPage account={account} />;
      case "campaigns":   return <CampaignsPage account={account} />;
      case "performance": return <PerformancePage account={account} listing={listing} summary={summary} />;
      case "brand":       return <BrandPage account={account} listing={listing} />;
      case "requests":    return <RequestsPage account={account} />;
      case "events":      return <EventsPage account={account} listing={listing} />;
      case "settings":    return <SettingsPage account={account} />;
      default:            return <SettingsPage account={account} />;
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", fontFamily: SANS }}>
      {/* Sidebar */}
      <div style={{
        width: SIDEBAR_W, minHeight: "100vh",
        background: T.sidebar, borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", flexShrink: 0,
        transition: "width 0.2s ease", overflow: "hidden",
        position: "sticky", top: 0, alignSelf: "flex-start",
      }}>
        {/* Top: logo + toggle */}
        <div style={{
          padding: sideOpen ? "24px 20px 16px" : "24px 16px 16px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center",
          justifyContent: sideOpen ? "space-between" : "center",
        }}>
          {sideOpen && (
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: T.gold, letterSpacing: "0.02em", lineHeight: 1.2 }}>
                {account.name}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 9, color: T.grey, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 3 }}>
                Client Portal
              </div>
            </div>
          )}
          <button
            onClick={() => setSideOpen(o => !o)}
            style={{ background: "none", border: "none", color: T.grey, cursor: "pointer", fontSize: 16, padding: 4, lineHeight: 1, flexShrink: 0 }}
          >
            {sideOpen ? "←" : "→"}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {menu.map(item => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                title={!sideOpen ? item.label : undefined}
                style={{
                  display: "flex", alignItems: "center",
                  gap: sideOpen ? 10 : 0,
                  width: "100%", padding: sideOpen ? "10px 20px" : "10px 0",
                  justifyContent: sideOpen ? "flex-start" : "center",
                  background: active ? T.gold + "14" : "none",
                  border: "none",
                  borderLeft: `2px solid ${active ? T.gold : "transparent"}`,
                  color: active ? T.gold : T.grey,
                  fontSize: sideOpen ? 13 : 16, fontFamily: SANS,
                  cursor: "pointer", transition: "all 0.12s",
                  textAlign: "left", whiteSpace: "nowrap",
                }}
              >
                <span style={{ flexShrink: 0, fontSize: 13 }}>{item.icon}</span>
                {sideOpen && <span style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom: logout */}
        <div style={{ padding: sideOpen ? "12px 20px 24px" : "12px 16px 24px", borderTop: `1px solid ${T.border}` }}>
          <button
            onClick={() => window.location.href = "/vendor/login"}
            title={!sideOpen ? "Sign out" : undefined}
            style={{
              display: "flex", alignItems: "center",
              gap: sideOpen ? 8 : 0,
              justifyContent: sideOpen ? "flex-start" : "center",
              width: "100%", background: "none", border: "none",
              color: T.grey2, fontSize: 11, fontFamily: SANS, cursor: "pointer", padding: "6px 0",
            }}
          >
            <span style={{ fontSize: 12 }}>⊠</span>
            {sideOpen && "Sign out"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "48px 56px", maxWidth: 860, margin: "0 auto", minWidth: 0 }}>
        {renderPage()}
      </div>
    </div>
  );
}
