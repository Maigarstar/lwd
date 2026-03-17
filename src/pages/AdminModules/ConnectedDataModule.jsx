// ─── src/pages/AdminModules/ConnectedDataModule.jsx ──────────────────────────
// Admin Phase 2: Connected Data control centre.
// Manages Google OAuth connections (GA4 + Search Console) and surfaces
// real engagement + search performance data. Admin-only — internal testing
// before the feature is replicated into the user dashboard as a paid upgrade.
//
// Backend is fully built. This file is purely frontend:
//   - googleConnectionService.js  (OAuth flow, data fetch)
//   - supabase/functions/google-*  (edge functions, no changes needed)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getConnections,
  initiateOAuth,
  openOAuthPopup,
  selectProperty,
  disconnectService,
  fetchAnalyticsData,
  fetchSearchConsoleData,
} from '../../services/googleConnectionService';

// ─── Font tokens ─────────────────────────────────────────────────────────────
const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

// ─── Icons ────────────────────────────────────────────────────────────────────
function GoogleAnalyticsIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="20" width="8" height="16" rx="2" fill="#F9AB00" />
      <rect x="16" y="12" width="8" height="24" rx="2" fill="#E37400" />
      <rect x="28" y="4"  width="8" height="32" rx="2" fill="#F9AB00" />
    </svg>
  );
}

function GoogleSearchConsoleIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="18" cy="18" r="11" stroke="#4285F4" strokeWidth="3" fill="none" />
      <line x1="26" y1="26" x2="36" y2="36" stroke="#34A853" strokeWidth="3" strokeLinecap="round" />
      <circle cx="18" cy="18" r="5" fill="#4285F4" opacity="0.3" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n == null) return '--';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function fmtTimeAgo(date) {
  if (!date) return '';
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 10)  return 'just now';
  if (secs < 60)  return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function dateRangeLabel(range) {
  return { '7daysAgo': 'Last 7 days', '28daysAgo': 'Last 28 days', '90daysAgo': 'Last 90 days' }[range] || range;
}

function startDateFromRange(range) {
  const days = { '7daysAgo': 7, '28daysAgo': 28, '90daysAgo': 90 }[range] || 28;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ width = '100%', height = 18, radius = 4, style = {} }) {
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'cd-shimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, tint = 'neutral', C }) {
  const tintStyles = {
    ga:      { border: '1px solid rgba(249,171,0,0.18)',  bg: 'rgba(249,171,0,0.04)' },
    sc:      { border: '1px solid rgba(66,133,244,0.18)', bg: 'rgba(66,133,244,0.04)' },
    neutral: { border: `1px solid ${C.border}`,           bg: C.card },
  };
  const t = tintStyles[tint] || tintStyles.neutral;

  return (
    <div style={{
      backgroundColor: t.bg,
      border: t.border,
      borderRadius: 8,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.grey2 }}>
        {label}
      </div>
      <div style={{ fontFamily: GD, fontSize: 26, fontWeight: 400, color: C.white, lineHeight: 1 }}>
        {value ?? '--'}
      </div>
      {sub && (
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function MetricCardSkeleton({ C }) {
  return (
    <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px' }}>
      <Skeleton height={10} width="60%" style={{ marginBottom: 10 }} />
      <Skeleton height={28} width="70%" style={{ marginBottom: 8 }} />
      <Skeleton height={10} width="45%" />
    </div>
  );
}

// ─── Success toast ────────────────────────────────────────────────────────────
function SuccessToast({ service, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  const label = service === 'analytics' ? 'Google Analytics' : 'Google Search Console';
  return (
    <div style={{
      position: 'fixed',
      bottom: 28,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 20px',
      backgroundColor: '#0f2418',
      border: '1px solid rgba(34,197,94,0.35)',
      borderRadius: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      animation: 'cd-toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      pointerEvents: 'none',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
      <span style={{ fontFamily: NU, fontSize: 13, color: '#d1fae5', fontWeight: 500 }}>
        {label} connected successfully
      </span>
    </div>
  );
}

// ─── ConnectionCard ───────────────────────────────────────────────────────────
function ConnectionCard({ name, description, icon, integration, service, conn, onConnect, onDisconnect, onChangeProperty, onRefresh, isConnecting, C }) {
  const status     = conn?.status || 'disconnected';
  const connected  = status === 'connected';
  const isError    = status === 'error';
  const isPending  = status === 'pending' || isConnecting;
  const propName   = conn?.selected_property_name || null;
  const propId     = conn?.selected_property_id   || null;
  const typeLabel  = service === 'analytics' ? 'GA4' : 'GSC';

  // Manual property entry state (shown when connected but no property selected)
  const [showManual, setShowManual] = useState(false);
  const [manualId,   setManualId]   = useState('');
  const [savingMan,  setSavingMan]  = useState(false);
  const [manualErr,  setManualErr]  = useState('');

  const placeholder = service === 'analytics'
    ? 'e.g. properties/123456789'
    : 'e.g. https://www.example.com/';

  async function handleSaveManual() {
    const val = manualId.trim();
    if (!val) { setManualErr('Enter a property ID or URL.'); return; }
    // Basic format check
    if (service === 'analytics' && !val.startsWith('properties/')) {
      setManualErr('GA4 property ID must start with "properties/"');
      return;
    }
    setManualErr('');
    setSavingMan(true);
    try {
      await selectProperty(service, val, val);
      setShowManual(false);
      setManualId('');
      // Refresh connections list from parent
      onRefresh?.();
    } catch (e) {
      setManualErr(e.message || 'Failed to save property.');
    } finally {
      setSavingMan(false);
    }
  }

  return (
    <div style={{
      backgroundColor: C.card,
      border: `1px solid ${connected ? 'rgba(34,197,94,0.22)' : isError ? 'rgba(239,68,68,0.2)' : C.border}`,
      borderRadius: 10,
      padding: '24px 28px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 20,
      transition: 'border-color 0.2s ease',
    }}>
      {/* Icon */}
      <div style={{ flexShrink: 0, marginTop: 2 }}>{icon}</div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: GD, fontSize: 17, fontWeight: 400, color: C.off }}>{name}</span>
          {connected && (
            <span style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.2)', borderRadius: 3, padding: '1px 6px',
            }}>Connected</span>
          )}
          {isError && (
            <span style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.18)', borderRadius: 3, padding: '1px 6px',
            }}>Error</span>
          )}
        </div>

        <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.7, margin: '0 0 10px' }}>
          {description}
        </p>

        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>
          Unlocks: <span style={{ color: '#c9a84c' }}>{integration}</span>
        </div>

        {/* Connected property detail — explicit admin view */}
        {connected && (propName || propId) && (
          <div style={{
            marginTop: 12,
            padding: '10px 12px',
            backgroundColor: 'rgba(34,197,94,0.05)',
            border: '1px solid rgba(34,197,94,0.15)',
            borderRadius: 5,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#22c55e' }}>
                Connected · {typeLabel}
              </span>
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: '#d1fae5', marginBottom: propId ? 3 : 0 }}>
              <span style={{ color: C.grey2 }}>Property: </span>{propName || propId}
            </div>
            {propId && (
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.grey2 }}>
                <span style={{ color: C.grey2 }}>ID: </span>
                <span style={{ color: '#86efac' }}>{propId}</span>
              </div>
            )}
            {conn?.available_properties?.length > 1 && (
              <button
                onClick={onChangeProperty}
                style={{
                  marginTop: 7,
                  fontFamily: NU, fontSize: 10, color: C.grey2, background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 2,
                }}
              >
                Change property ({conn.available_properties.length} available)
              </button>
            )}
          </div>
        )}

        {/* Manual property entry — shown when connected but no property resolved */}
        {connected && !propId && (
          <div style={{ marginTop: 12 }}>
            {!showManual ? (
              <div style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(201,168,76,0.05)',
                border: '1px solid rgba(201,168,76,0.18)',
                borderRadius: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}>
                <div>
                  <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
                    No property selected
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, lineHeight: 1.5 }}>
                    {service === 'analytics'
                      ? 'Auto-fetch returned 0 properties. Enter your GA4 property ID manually.'
                      : 'Auto-fetch returned 0 properties. Enter your Search Console site URL manually.'}
                  </div>
                </div>
                <button
                  onClick={() => setShowManual(true)}
                  style={{
                    flexShrink: 0,
                    fontFamily: NU, fontSize: 11, fontWeight: 600,
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(201,168,76,0.35)',
                    color: '#c9a84c',
                    borderRadius: 4, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Set manually
                </button>
              </div>
            ) : (
              <div style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(201,168,76,0.05)',
                border: '1px solid rgba(201,168,76,0.22)',
                borderRadius: 5,
              }}>
                <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  {service === 'analytics' ? 'Enter GA4 Property ID' : 'Enter Search Console Site URL'}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    value={manualId}
                    onChange={e => { setManualId(e.target.value); setManualErr(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSaveManual()}
                    placeholder={placeholder}
                    style={{
                      flex: 1,
                      fontFamily: 'monospace', fontSize: 12,
                      padding: '7px 10px',
                      backgroundColor: C.dark,
                      border: `1px solid ${manualErr ? 'rgba(239,68,68,0.45)' : C.border2}`,
                      borderRadius: 4,
                      color: C.white,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSaveManual}
                    disabled={savingMan}
                    style={{
                      flexShrink: 0,
                      fontFamily: NU, fontSize: 11, fontWeight: 600,
                      padding: '7px 14px',
                      backgroundColor: '#c9a84c',
                      border: 'none', color: '#000',
                      borderRadius: 4, cursor: savingMan ? 'not-allowed' : 'pointer',
                      opacity: savingMan ? 0.6 : 1,
                    }}
                  >
                    {savingMan ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setShowManual(false); setManualId(''); setManualErr(''); }}
                    style={{
                      flexShrink: 0,
                      fontFamily: NU, fontSize: 11, color: C.grey2,
                      background: 'none', border: 'none', cursor: 'pointer', padding: '7px 6px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {manualErr && (
                  <div style={{ marginTop: 5, fontFamily: NU, fontSize: 11, color: '#f87171' }}>
                    {manualErr}
                  </div>
                )}
                <div style={{ marginTop: 7, fontFamily: NU, fontSize: 10, color: C.grey2, lineHeight: 1.5 }}>
                  {service === 'analytics'
                    ? 'Find this in Google Analytics: Admin > Property Settings. Format: properties/XXXXXXXXX'
                    : 'Use the exact URL registered in Search Console (include trailing slash if applicable).'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {isError && conn?.error_message && (
          <div style={{ marginTop: 8, fontFamily: NU, fontSize: 11, color: '#f87171' }}>
            {conn.error_message}
          </div>
        )}

        {/* Connected-at + last synced */}
        {connected && conn?.connected_at && (
          <div style={{ marginTop: 6, fontFamily: NU, fontSize: 10, color: C.grey2, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>Connected {new Date(conn.connected_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {conn?.token_expiry && (
              <>
                <span style={{ color: C.border }}>·</span>
                <span style={{ color: new Date(conn.token_expiry) > new Date() ? '#86efac' : '#f87171' }}>
                  Token {new Date(conn.token_expiry) > new Date() ? 'valid' : 'expired'}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <div style={{ flexShrink: 0, minWidth: 130, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingTop: 2 }}>
        {isPending ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              border: `2px solid #c9a84c`, borderTopColor: 'transparent',
              animation: 'cd-spin 0.7s linear infinite',
            }} />
            <span style={{ fontFamily: NU, fontSize: 11, color: '#c9a84c' }}>Connecting...</span>
          </div>
        ) : connected ? (
          <button
            onClick={onDisconnect}
            style={{
              fontFamily: NU, fontSize: 11, fontWeight: 600,
              padding: '7px 14px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(239,68,68,0.25)',
              color: 'rgba(239,68,68,0.7)',
              borderRadius: 5, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            style={{
              fontFamily: NU, fontSize: 12, fontWeight: 600,
              padding: '9px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #c9a84c',
              color: '#c9a84c',
              borderRadius: 5, cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {isError ? 'Reconnect' : 'Connect via Google'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PropertySelectorModal ────────────────────────────────────────────────────
function PropertySelectorModal({ service, properties, currentId, onSelect, onClose, C }) {
  const label = service === 'analytics' ? 'Google Analytics 4' : 'Search Console';

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        backgroundColor: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'cd-overlay-in 0.22s ease',
      }}
    >
      <div style={{
        backgroundColor: C.black,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '32px 28px',
        width: '100%', maxWidth: 520,
        boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
        animation: 'cd-panel-in 0.26s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <div style={{ marginBottom: 6 }}>
          <h2 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, color: C.white, margin: '0 0 6px' }}>
            Select {label} Property
          </h2>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0, lineHeight: 1.6 }}>
            Choose which property to use. This can be changed at any time.
          </p>
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
          {properties.map(p => {
            const isActive = p.id === currentId;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                style={{
                  fontFamily: NU, textAlign: 'left', width: '100%',
                  padding: '12px 14px',
                  backgroundColor: isActive ? 'rgba(201,168,76,0.08)' : C.card,
                  border: `1px solid ${isActive ? 'rgba(201,168,76,0.35)' : C.border}`,
                  borderRadius: 6, cursor: 'pointer',
                  transition: 'all 0.12s',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = C.dark; e.currentTarget.style.borderColor = C.border2; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = C.card; e.currentTarget.style.borderColor = C.border; } }}
              >
                <span style={{ fontSize: 13, color: C.white, fontWeight: isActive ? 600 : 400 }}>
                  {p.displayName || p.name}
                  {isActive && <span style={{ marginLeft: 8, fontSize: 9, color: '#c9a84c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active</span>}
                </span>
                <span style={{ fontSize: 10, color: C.grey2 }}>{p.id}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 20, width: '100%',
            fontFamily: NU, fontSize: 11, color: C.grey2,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px 0', textDecoration: 'underline', textUnderlineOffset: 2,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── DateRangeSelector ────────────────────────────────────────────────────────
function DateRangeSelector({ value, onChange, C }) {
  const options = ['7daysAgo', '28daysAgo', '90daysAgo'];

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              fontFamily: NU, fontSize: 11, fontWeight: active ? 700 : 400,
              padding: '5px 12px',
              backgroundColor: active ? C.gold : 'transparent',
              border: `1px solid ${active ? C.gold : C.border}`,
              color: active ? '#fff' : C.grey,
              borderRadius: 4, cursor: 'pointer',
              transition: 'all 0.13s',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = C.grey; e.currentTarget.style.color = C.white; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.grey; } }}
          >
            {dateRangeLabel(opt).replace('Last ', '')}
          </button>
        );
      })}
    </div>
  );
}

// ─── NotConnectedGuard ────────────────────────────────────────────────────────
function NotConnectedGuard({ service, onGoToConnections, C }) {
  const label = service === 'analytics' ? 'Google Analytics' : 'Google Search Console';
  const icon  = service === 'analytics' ? <GoogleAnalyticsIcon size={32} /> : <GoogleSearchConsoleIcon size={32} />;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', textAlign: 'center',
      backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
    }}>
      <div style={{ marginBottom: 16, opacity: 0.6 }}>{icon}</div>
      <h3 style={{ fontFamily: GD, fontSize: 18, fontWeight: 400, color: C.white, margin: '0 0 8px' }}>
        {label} not connected
      </h3>
      <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: '0 0 20px', lineHeight: 1.7, maxWidth: 360 }}>
        Connect your {label} account to start seeing real data here. It takes under a minute.
      </p>
      <button
        onClick={onGoToConnections}
        style={{
          fontFamily: NU, fontSize: 12, fontWeight: 600,
          padding: '9px 22px',
          backgroundColor: C.gold,
          border: 'none', color: '#fff', borderRadius: 5, cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        Go to Connections
      </button>
    </div>
  );
}

// ─── NoPropertyGuard ──────────────────────────────────────────────────────────
function NoPropertyGuard({ service, conn, onChangeProperty, C }) {
  const label = service === 'analytics' ? 'Google Analytics' : 'Search Console';
  const hasProps = (conn?.available_properties || []).length > 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 20px', textAlign: 'center',
      backgroundColor: 'rgba(201,168,76,0.04)',
      border: '1px solid rgba(201,168,76,0.15)',
      borderRadius: 10,
    }}>
      <span style={{ fontSize: 28, marginBottom: 14 }}>📡</span>
      <h3 style={{ fontFamily: GD, fontSize: 17, fontWeight: 400, color: C.white, margin: '0 0 8px' }}>
        No {label} property selected
      </h3>
      <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: '0 0 18px', lineHeight: 1.7, maxWidth: 340 }}>
        {hasProps
          ? `${conn.available_properties.length} ${conn.available_properties.length === 1 ? 'property' : 'properties'} available. Select one to start viewing data.`
          : 'No properties were found on this account. Make sure the connected Google account has access to at least one property.'}
      </p>
      {hasProps && (
        <button
          onClick={onChangeProperty}
          style={{
            fontFamily: NU, fontSize: 12, fontWeight: 600,
            padding: '9px 22px',
            backgroundColor: 'transparent',
            border: '1px solid #c9a84c', color: '#c9a84c',
            borderRadius: 5, cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          Select Property
        </button>
      )}
    </div>
  );
}

// ─── RefreshButton ────────────────────────────────────────────────────────────
function RefreshButton({ onRefresh, loading, C }) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      title="Refresh data"
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: NU, fontSize: 11, color: loading ? C.grey2 : C.grey,
        background: 'none',
        border: `1px solid ${C.border}`,
        borderRadius: 4, cursor: loading ? 'default' : 'pointer',
        padding: '5px 10px',
        opacity: loading ? 0.5 : 1,
        transition: 'all 0.13s',
      }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = C.grey; e.currentTarget.style.color = C.white; } }}
      onMouseLeave={e => { if (!loading) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.grey; } }}
    >
      <svg
        width="12" height="12" viewBox="0 0 16 16" fill="none"
        style={{ animation: loading ? 'cd-spin 0.8s linear infinite' : 'none', flexShrink: 0 }}
      >
        <path d="M13.65 2.35A8 8 0 1 0 15 8h-2a6 6 0 1 1-1.05-3.35L10 7h5V2l-1.35.35z" fill="currentColor" />
      </svg>
      {loading ? 'Loading...' : 'Refresh'}
    </button>
  );
}

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry, C }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '12px 16px',
      backgroundColor: 'rgba(239,68,68,0.06)',
      border: '1px solid rgba(239,68,68,0.18)',
      borderRadius: 6, marginBottom: 20,
    }}>
      <span style={{ fontFamily: NU, fontSize: 12, color: '#f87171', flex: 1 }}>
        {message}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontFamily: NU, fontSize: 11, fontWeight: 600,
            padding: '5px 12px', flexShrink: 0,
            backgroundColor: 'transparent',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#f87171', borderRadius: 4, cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── AnalyticsView ────────────────────────────────────────────────────────────
function AnalyticsView({ conn, dateRange, onDateChange, onGoToConnections, onChangeProperty, C }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  const propId = conn?.selected_property_id;

  const load = useCallback(async () => {
    if (!propId) return;
    setLoading(true);
    setError(null);
    try {
      const start = startDateFromRange(dateRange);
      const end   = todayStr();
      const result = await fetchAnalyticsData(propId, { startDate: start, endDate: end });
      setData(result);
      setFetchedAt(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load Analytics data.');
    } finally {
      setLoading(false);
    }
  }, [propId, dateRange]);

  useEffect(() => { load(); }, [load]);

  if (!conn || conn.status !== 'connected') {
    return <NotConnectedGuard service="analytics" onGoToConnections={onGoToConnections} C={C} />;
  }
  if (!propId) {
    return <NoPropertyGuard service="analytics" conn={conn} onChangeProperty={onChangeProperty} C={C} />;
  }

  const s = data?.summary;

  // Detect all-zeros (API enabled but data not yet backfilled)
  const allZeros = s != null && s.sessions === 0 && s.totalUsers === 0 && s.newUsers === 0;

  // ── Performance insight builder ────────────────────────────────────────────
  function buildInsight(d) {
    if (!d?.summary || allZeros) return null;
    const { sessions, engagedSessions, bounceRate, totalUsers, newUsers, avgSessionFormatted, pagesPerSession } = d.summary;
    const engageRate = sessions > 0 ? Math.round((engagedSessions / sessions) * 100) : 0;
    const returnRate = totalUsers > 0 ? Math.round(((totalUsers - newUsers) / totalUsers) * 100) : 0;
    const topChannel = d.channels?.[0];

    let sentimentColor = C.green;
    let sentimentLabel = 'Performing well';
    if (bounceRate > 65 || engageRate < 30) { sentimentColor = '#f87171'; sentimentLabel = 'Needs attention'; }
    else if (bounceRate > 45 || engageRate < 50) { sentimentColor = '#fbbf24'; sentimentLabel = 'Room to improve'; }

    const lines = [];
    if (sessions > 0) {
      lines.push(`${fmtNum(sessions)} sessions recorded with a ${engageRate}% engagement rate${engageRate >= 60 ? ', indicating strong visitor intent' : engageRate >= 40 ? ', showing moderate audience engagement' : ', suggesting visitors are not finding what they need'}.`);
    }
    if (bounceRate != null) {
      lines.push(`Bounce rate is ${bounceRate}% (${bounceRate < 40 ? 'excellent' : bounceRate < 55 ? 'acceptable' : bounceRate < 70 ? 'elevated' : 'high'}) with an average session of ${avgSessionFormatted ?? '0s'} and ${pagesPerSession ?? 0} pages per visit.`);
    }
    if (topChannel) {
      lines.push(`Primary traffic source is ${topChannel.channel} at ${topChannel.pct}%${returnRate > 20 ? ` with ${returnRate}% returning visitors` : ''}.`);
    }
    return { lines, sentimentColor, sentimentLabel };
  }

  // ── Flagged issues builder ─────────────────────────────────────────────────
  function buildFlags(d) {
    if (!d?.summary || allZeros) return [];
    const flags = [];
    const { bounceRate, engagedSessions, sessions } = d.summary;
    const engageRate = sessions > 0 ? Math.round((engagedSessions / sessions) * 100) : 0;
    const channels = d.channels ?? [];
    const unassigned = channels.find(ch => ch.channel === 'Unassigned' || ch.channel === '(other)');
    const organic = channels.find(ch => ch.channel === 'Organic Search');

    if (bounceRate > 65) {
      flags.push({ icon: '⚠', label: 'High Bounce Rate', detail: `${bounceRate}% of sessions bounce immediately. Review landing page relevance and load speed.`, sev: 'high' });
    } else if (bounceRate > 50) {
      flags.push({ icon: '◎', label: 'Elevated Bounce Rate', detail: `${bounceRate}% bounce rate. Consider improving above-the-fold content on top landing pages.`, sev: 'med' });
    }
    if (unassigned && unassigned.pct > 15) {
      flags.push({ icon: '◎', label: 'Unassigned Traffic', detail: `${unassigned.pct}% of sessions are unattributed. Check UTM tagging on paid and referral campaigns.`, sev: 'med' });
    }
    if (organic && organic.pct < 15 && sessions > 200) {
      flags.push({ icon: '◎', label: 'Low Organic Contribution', detail: `Organic search drives only ${organic.pct}% of traffic. Content SEO and backlink strategy may need attention.`, sev: 'med' });
    }
    if (!organic && sessions > 200) {
      flags.push({ icon: '◎', label: 'No Organic Search Traffic', detail: 'Zero sessions from organic search detected. Pages may not be indexed or ranking for target queries.', sev: 'high' });
    }
    if (engageRate < 30 && sessions > 50) {
      flags.push({ icon: '⚠', label: 'Low Engagement Signal', detail: `Only ${engageRate}% of sessions are classified as engaged. Users may be leaving before interacting with content.`, sev: 'high' });
    }
    return flags;
  }

  const insight = buildInsight(data);
  const flags   = buildFlags(data);

  // ── Engagement label helper ────────────────────────────────────────────────
  function engagementLabel(row, medianSessions) {
    const br = row.bounceRate ?? 0;
    const sess = row.sessions ?? 0;
    if (br < 38 && sess >= medianSessions) return { label: 'Strong',  color: '#4ade80', bg: 'rgba(74,222,128,0.08)'  };
    if (br < 55)                           return { label: 'Average', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)'  };
    return                                        { label: 'Weak',    color: '#f87171', bg: 'rgba(248,113,113,0.08)' };
  }

  // ── Conversion risk helper ─────────────────────────────────────────────────
  function conversionRisk(row) {
    const br = row.bounceRate ?? 0;
    // parse avgDuration string (e.g. "1m 24s" or "45s") to seconds
    const raw = row.avgDuration ?? '';
    const mins = parseInt((raw.match(/(\d+)m/) || [])[1] ?? '0', 10);
    const secs = parseInt((raw.match(/(\d+)s/) || [])[1] ?? '0', 10);
    const dur = mins * 60 + secs;

    if (br < 40 && dur >= 60) return { label: 'Low Risk',  color: '#4ade80' };
    if (br < 60 && dur >= 30) return { label: 'Med Risk',  color: '#fbbf24' };
    return                           { label: 'High Risk', color: '#f87171' };
  }

  // Median sessions across landing pages for engagement label calibration
  const sortedSess = [...(data?.landingPages ?? [])].map(r => r.sessions).sort((a, b) => a - b);
  const medianSess = sortedSess.length ? sortedSess[Math.floor(sortedSess.length / 2)] : 0;

  // Bounce rate colour
  function bounceColor(br) {
    if (br == null) return C.grey;
    if (br < 40)   return '#4ade80';
    if (br < 60)   return '#fbbf24';
    return '#f87171';
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GoogleAnalyticsIcon size={20} />
            <span style={{ fontFamily: GD, fontSize: 17, color: C.white, fontWeight: 400 }}>
              Google Analytics
            </span>
            <span style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
              backgroundColor: 'rgba(249,171,0,0.1)', color: '#F9AB00',
              border: '1px solid rgba(249,171,0,0.2)', borderRadius: 3, padding: '1px 6px',
            }}>GA4</span>
          </div>
          <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{conn.selected_property_name && conn.selected_property_name !== propId ? conn.selected_property_name : ''}</span>
            {conn.selected_property_name && conn.selected_property_name !== propId && (
              <span style={{ color: C.border }}>·</span>
            )}
            <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{propId}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshButton onRefresh={load} loading={loading} C={C} />
          <DateRangeSelector value={dateRange} onChange={onDateChange} C={C} />
        </div>
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={load} C={C} />}

      {/* Performance Insight block */}
      {!loading && insight && (
        <div style={{
          backgroundColor: C.card,
          border: `1px solid rgba(249,171,0,0.18)`,
          borderRadius: 8,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}>
          <div style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: 6,
            backgroundColor: `${insight.sentimentColor}18`,
            border: `1px solid ${insight.sentimentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15,
          }}>💡</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.grey2 }}>
                Performance Insight
              </span>
              <span style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                color: insight.sentimentColor,
                backgroundColor: `${insight.sentimentColor}15`,
                border: `1px solid ${insight.sentimentColor}35`,
                borderRadius: 3, padding: '1px 6px',
              }}>{insight.sentimentLabel}</span>
            </div>
            {insight.lines.map((line, i) => (
              <p key={i} style={{
                fontFamily: NU, fontSize: 12, color: C.white, lineHeight: 1.65,
                margin: 0, marginBottom: i < insight.lines.length - 1 ? 4 : 0,
              }}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 10, marginBottom: allZeros ? 12 : 24,
        opacity: allZeros ? 0.45 : 1,
        transition: 'opacity 0.3s ease',
      }}>
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => <MetricCardSkeleton key={i} C={C} />)
        ) : s ? (
          <>
            <MetricCard label="Sessions"          value={allZeros ? '--' : fmtNum(s.sessions ?? 0)}          tint="ga" C={C} />
            <MetricCard label="Engaged Sessions"  value={allZeros ? '--' : fmtNum(s.engagedSessions ?? 0)}   tint="ga" C={C} />
            <MetricCard label="Bounce Rate"       value={allZeros ? '--' : `${s.bounceRate ?? 0}%`}           tint="ga" C={C} sub="lower is better" />
            <MetricCard label="Avg Session"       value={allZeros ? '--' : (s.avgSessionFormatted ?? '0s')}   tint="ga" C={C} />
            <MetricCard label="Pages / Session"   value={allZeros ? '--' : (s.pagesPerSession ?? 0)}          tint="ga" C={C} />
            <MetricCard label="New Users"         value={allZeros ? '--' : fmtNum(s.newUsers ?? 0)}           tint="ga" C={C} />
            <MetricCard label="Total Users"       value={allZeros ? '--' : fmtNum(s.totalUsers ?? 0)}         tint="ga" C={C} />
          </>
        ) : null}
      </div>

      {/* Flagged Issues */}
      {!loading && flags.length > 0 && (
        <div style={{
          backgroundColor: C.card,
          border: `1px solid rgba(248,113,113,0.18)`,
          borderRadius: 8, overflow: 'hidden',
          marginBottom: 20,
        }}>
          <div style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: 'rgba(248,113,113,0.04)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 12 }}>🚩</span>
            <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#f87171' }}>
              Flagged Issues ({flags.length})
            </span>
          </div>
          {flags.map((flag, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 16px',
              borderBottom: i < flags.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{
                flexShrink: 0, fontSize: 12, marginTop: 1,
                color: flag.sev === 'high' ? '#f87171' : '#fbbf24',
              }}>{flag.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontFamily: NU, fontSize: 11, fontWeight: 600,
                  color: flag.sev === 'high' ? '#f87171' : '#fbbf24',
                }}>{flag.label}</span>
                <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginLeft: 8 }}>
                  {flag.detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zero-state sync notice */}
      {!loading && allZeros && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 16px', marginBottom: 24,
          backgroundColor: 'rgba(249,171,0,0.05)',
          border: '1px solid rgba(249,171,0,0.18)',
          borderRadius: 6,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⏳</span>
          <div>
            <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: '#F9AB00', marginBottom: 3 }}>
              Data is still syncing with Google Analytics
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, lineHeight: 1.6 }}>
              This can take up to 24 hours after initial connection. The API is live and receiving requests correctly. Check back later or hit Refresh to re-poll.
            </div>
          </div>
        </div>
      )}

      {/* Channels + Devices row */}
      {!loading && (data?.channels?.length > 0 || data?.devices?.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>

          {/* Traffic channels */}
          {data?.channels?.length > 0 && (
            <div style={{ backgroundColor: C.card, border: `1px solid rgba(249,171,0,0.12)`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, backgroundColor: 'rgba(249,171,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.grey2 }}>Traffic Channels</span>
                <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.grey2 }}>Sessions</span>
              </div>
              {data.channels.map((ch, i) => (
                <div key={i} style={{ padding: '8px 14px', borderBottom: i < data.channels.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: NU, fontSize: 11, color: C.white }}>{ch.channel}</span>
                    <span style={{ fontFamily: NU, fontSize: 11, color: C.white }}>{fmtNum(ch.sessions)} <span style={{ color: C.grey2, fontSize: 10 }}>({ch.pct}%)</span></span>
                  </div>
                  <div style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(ch.pct, 100)}%`, backgroundColor: '#F9AB00', borderRadius: 2, opacity: 0.7 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Device breakdown */}
          {data?.devices?.length > 0 && (
            <div style={{ backgroundColor: C.card, border: `1px solid rgba(249,171,0,0.12)`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.border}`, backgroundColor: 'rgba(249,171,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.grey2 }}>Devices</span>
                <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.grey2 }}>Sessions</span>
              </div>
              {data.devices.map((dv, i) => {
                const icon = dv.device === 'mobile' ? '📱' : dv.device === 'desktop' ? '🖥' : dv.device === 'tablet' ? '📲' : '📡';
                return (
                  <div key={i} style={{ padding: '8px 14px', borderBottom: i < data.devices.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: NU, fontSize: 11, color: C.white, textTransform: 'capitalize' }}>{icon} {dv.device}</span>
                      <span style={{ fontFamily: NU, fontSize: 11, color: C.white }}>{fmtNum(dv.sessions)} <span style={{ color: C.grey2, fontSize: 10 }}>({dv.pct}%)</span></span>
                    </div>
                    <div style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(dv.pct, 100)}%`, backgroundColor: '#F9AB00', borderRadius: 2, opacity: 0.55 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Landing pages table */}
      {!loading && data?.landingPages?.length > 0 && (
        <div style={{
          backgroundColor: C.card,
          border: `1px solid rgba(249,171,0,0.12)`,
          borderRadius: 8, overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 72px 90px 100px 80px 80px',
            padding: '10px 16px',
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: 'rgba(249,171,0,0.04)',
          }}>
            {['Top Landing Pages', 'Sessions', 'Bounce', 'Avg Duration', 'Engagement', 'Conv. Risk'].map((h, i) => (
              <span key={i} style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: C.grey2,
                textAlign: i === 0 ? 'left' : 'right',
              }}>{h}</span>
            ))}
          </div>
          {data.landingPages.map((row, i) => {
            const eng  = engagementLabel(row, medianSess);
            const risk = conversionRisk(row);
            const br   = row.bounceRate ?? 0;
            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 72px 90px 100px 80px 80px',
                padding: '9px 16px',
                borderBottom: i < data.landingPages.length - 1 ? `1px solid ${C.border}` : 'none',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: 11, color: C.grey,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  paddingRight: 10,
                }}>{row.page}</span>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.white, textAlign: 'right' }}>{fmtNum(row.sessions)}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontFamily: NU, fontSize: 12,
                    color: bounceColor(br),
                    fontWeight: br >= 60 ? 600 : 400,
                  }}>{br}%</span>
                  {br >= 60 && <span style={{ fontFamily: NU, fontSize: 8, color: bounceColor(br), display: 'block', lineHeight: 1.2 }}>
                    {br < 70 ? 'elevated' : 'high'}
                  </span>}
                  {br < 40 && <span style={{ fontFamily: NU, fontSize: 8, color: bounceColor(br), display: 'block', lineHeight: 1.2 }}>good</span>}
                </div>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, textAlign: 'right' }}>{row.avgDuration}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                    color: eng.color,
                    backgroundColor: eng.bg,
                    border: `1px solid ${eng.color}35`,
                    borderRadius: 3, padding: '2px 6px',
                  }}>{eng.label}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                    color: risk.color,
                    backgroundColor: `${risk.color}12`,
                    border: `1px solid ${risk.color}35`,
                    borderRadius: 3, padding: '2px 6px',
                  }}>{risk.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && data && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>
              {data.startDate} to {data.endDate} · Live data via Google Analytics Data API
            </span>
          </div>
          {fetchedAt && (
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>
              Last updated: {fmtTimeAgo(fetchedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SearchConsoleView ────────────────────────────────────────────────────────
function SearchConsoleView({ conn, dateRange, onDateChange, onGoToConnections, onChangeProperty, C }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [sortBy,    setSortBy]    = useState('clicks'); // clicks | impressions | position
  const [fetchedAt, setFetchedAt] = useState(null);

  const propId = conn?.selected_property_id;

  const load = useCallback(async () => {
    if (!propId) return;
    setLoading(true);
    setError(null);
    try {
      const start = startDateFromRange(dateRange);
      const end   = todayStr();
      const result = await fetchSearchConsoleData(propId, { rowLimit: 20, startDate: start, endDate: end });
      setData(result);
      setFetchedAt(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load Search Console data.');
    } finally {
      setLoading(false);
    }
  }, [propId, dateRange]);

  useEffect(() => { load(); }, [load]);

  if (!conn || conn.status !== 'connected') {
    return <NotConnectedGuard service="search_console" onGoToConnections={onGoToConnections} C={C} />;
  }
  if (!propId) {
    return <NoPropertyGuard service="search_console" conn={conn} onChangeProperty={onChangeProperty} C={C} />;
  }

  const t = data?.totals;

  const sortedRows = data?.rows ? [...data.rows].sort((a, b) => {
    if (sortBy === 'clicks')      return b.clicks      - a.clicks;
    if (sortBy === 'impressions') return b.impressions - a.impressions;
    if (sortBy === 'position')    return a.position    - b.position;
    return 0;
  }) : [];

  function SortHeader({ field, label }) {
    const active = sortBy === field;
    return (
      <button
        onClick={() => setSortBy(field)}
        style={{
          fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: active ? '#c9a84c' : C.grey2,
          background: active ? 'rgba(201,168,76,0.08)' : 'none',
          border: 'none', cursor: 'pointer',
          padding: '3px 6px', borderRadius: 3,
          textAlign: 'right',
        }}
      >
        {label}{active ? ' ▼' : ''}
      </button>
    );
  }

  // Build insight line from real data
  function buildInsight(rows, totals) {
    if (!rows || rows.length === 0 || !totals) return null;
    const page1 = rows.filter(r => (r.position ?? 99) <= 10).length;
    const top3  = rows.filter(r => (r.position ?? 99) <= 3).length;
    const avgPos = totals.position;
    if (top3 > 0) {
      return `${top3} ${top3 === 1 ? 'query' : 'queries'} ranking in the top 3 positions — strong visibility for branded and high-intent terms.`;
    }
    if (page1 > 3) {
      return `${page1} queries on page one. Average position ${avgPos} — good foundation with room to push key terms higher.`;
    }
    if (avgPos && avgPos < 20) {
      return `Average position ${avgPos} across top queries. Several terms are close to page one — worth optimising.`;
    }
    return `${totals.clicks?.toLocaleString() || 0} clicks from ${totals.impressions?.toLocaleString() || 0} impressions over this period.`;
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GoogleSearchConsoleIcon size={20} />
            <span style={{ fontFamily: GD, fontSize: 17, color: C.white, fontWeight: 400 }}>
              Search Console
            </span>
            <span style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
              backgroundColor: 'rgba(66,133,244,0.1)', color: '#4285F4',
              border: '1px solid rgba(66,133,244,0.2)', borderRadius: 3, padding: '1px 6px',
            }}>GSC</span>
          </div>
          <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            {conn.selected_property_name && conn.selected_property_name !== propId && (
              <>
                <span>{conn.selected_property_name}</span>
                <span style={{ color: C.border }}>·</span>
              </>
            )}
            <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{propId}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshButton onRefresh={load} loading={loading} C={C} />
          <DateRangeSelector value={dateRange} onChange={onDateChange} C={C} />
        </div>
      </div>

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={load} C={C} />}

      {/* Totals strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 10, marginBottom: 24,
      }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} C={C} />)
        ) : t ? (
          <>
            <MetricCard label="Total Clicks"      value={fmtNum(t.clicks ?? 0)}          tint="sc" C={C} />
            <MetricCard label="Impressions"       value={fmtNum(t.impressions ?? 0)}      tint="sc" C={C} />
            <MetricCard label="Avg CTR"           value={`${t.ctr ?? '0.0'}%`}            tint="sc" C={C} sub="click-through rate" />
            <MetricCard label="Avg Position"      value={t.position ?? '--'}              tint="sc" C={C} sub="lower is better" />
          </>
        ) : null}
      </div>

      {/* Insight line */}
      {!loading && sortedRows.length > 0 && (() => {
        const insight = buildInsight(data?.rows, data?.totals);
        return insight ? (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 14px', marginBottom: 14,
            backgroundColor: 'rgba(66,133,244,0.05)',
            border: '1px solid rgba(66,133,244,0.15)',
            borderRadius: 6,
          }}>
            <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
            <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.6 }}>{insight}</span>
          </div>
        ) : null;
      })()}

      {/* Queries table */}
      {!loading && sortedRows.length > 0 && (
        <div style={{
          backgroundColor: C.card,
          border: '1px solid rgba(66,133,244,0.12)',
          borderRadius: 8, overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 72px 96px 56px 64px',
            padding: '10px 16px',
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: 'rgba(66,133,244,0.04)',
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.grey2 }}>Query</span>
            <SortHeader field="clicks"      label="Clicks"  />
            <SortHeader field="impressions" label="Impr."   />
            <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.grey2, textAlign: 'right' }}>CTR</span>
            <SortHeader field="position"    label="Pos."    />
          </div>
          {sortedRows.map((row, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 72px 96px 56px 64px',
              padding: '9px 16px',
              borderBottom: i < sortedRows.length - 1 ? `1px solid ${C.border}` : 'none',
              alignItems: 'center',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.dark; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{
                fontFamily: NU, fontSize: 12, color: C.white,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                paddingRight: 12,
              }}>{row.query}</span>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.white, textAlign: 'right' }}>{fmtNum(row.clicks ?? 0)}</span>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, textAlign: 'right' }}>{fmtNum(row.impressions ?? 0)}</span>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, textAlign: 'right' }}>{row.ctr != null ? `${row.ctr}%` : '--'}</span>
              <span style={{
                fontFamily: NU, fontSize: 11, fontWeight: 600, textAlign: 'right',
                color: (row.position ?? 99) <= 3 ? '#22c55e'
                     : (row.position ?? 99) <= 10 ? '#c9a84c'
                     : C.grey2,
              }}>{row.position != null ? `#${row.position}` : '--'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty queries */}
      {!loading && !error && data && sortedRows.length === 0 && (
        <div style={{
          padding: '36px 20px', textAlign: 'center',
          backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
        }}>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0 }}>
            No query data found for this date range. Try selecting a wider range.
          </p>
        </div>
      )}

      {/* Footer */}
      {!loading && data && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>
              {data.startDate} to {data.endDate} · Live data via Google Search Console API
            </span>
          </div>
          {fetchedAt && (
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>
              Last updated: {fmtTimeAgo(fetchedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main module ──────────────────────────────────────────────────────────────
export default function ConnectedDataModule({ C }) {
  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('connections');

  // ── Connection state ─────────────────────────────────────────────────────────
  const [connections,        setConnections]        = useState({ analytics: null, search_console: null });
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [connecting,         setConnecting]         = useState(null); // 'analytics' | 'search_console'
  const [connError,          setConnError]          = useState(null);
  const [propertyModal,      setPropertyModal]      = useState(null); // { service, properties }
  const [successService,     setSuccessService]     = useState(null); // for toast
  const oauthCleanup = useRef(null);

  // ── Date range (persists across tab switches) ─────────────────────────────────
  const [dateRange, setDateRange] = useState('28daysAgo');

  // ── Load connections on mount ─────────────────────────────────────────────────
  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const c = await getConnections();
      setConnections(c);
    } catch (e) {
      console.error('ConnectedDataModule: failed to load connections', e);
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  // Cleanup OAuth popup on unmount
  useEffect(() => () => { oauthCleanup.current?.(); }, []);

  // ── OAuth connect flow ────────────────────────────────────────────────────────
  const handleConnect = useCallback(async (service) => {
    setConnecting(service);
    setConnError(null);
    try {
      const oauthUrl = await initiateOAuth(service);
      const cleanup  = openOAuthPopup(
        oauthUrl,
        async (svc, properties) => {
          oauthCleanup.current = null;
          const fresh = await getConnections();
          setConnections(fresh);
          setConnecting(null);
          setSuccessService(svc);

          if (properties && properties.length > 1) {
            setPropertyModal({ service: svc, properties });
          } else if (properties && properties.length === 1) {
            await selectProperty(svc, properties[0].id, properties[0].displayName);
            const updated = await getConnections();
            setConnections(updated);
          }
        },
        (err) => {
          oauthCleanup.current = null;
          setConnError(err);
          setConnecting(null);
          loadConnections();
        },
      );
      oauthCleanup.current = cleanup;
    } catch (e) {
      setConnError(e.setupRequired
        ? `Setup required: ${e.instructions || e.message}`
        : e.message);
      setConnecting(null);
    }
  }, [loadConnections]);

  // ── Disconnect ────────────────────────────────────────────────────────────────
  const handleDisconnect = useCallback(async (service) => {
    const label = service === 'analytics' ? 'Google Analytics' : 'Google Search Console';
    if (!window.confirm(`Disconnect ${label}? This will remove all saved tokens and property selections.`)) return;
    try {
      await disconnectService(service);
      await loadConnections();
    } catch (e) {
      setConnError(e.message);
    }
  }, [loadConnections]);

  // ── Property selection ────────────────────────────────────────────────────────
  const handleSelectProperty = useCallback(async (service, prop) => {
    try {
      await selectProperty(service, prop.id, prop.displayName);
      setPropertyModal(null);
      await loadConnections();
    } catch (e) {
      setConnError(e.message);
    }
  }, [loadConnections]);

  const openPropertyModal = useCallback((service) => {
    const conn  = connections[service];
    const props = conn?.available_properties || [];
    if (props.length > 0) setPropertyModal({ service, properties: props });
  }, [connections]);

  // ── Connection counts ─────────────────────────────────────────────────────────
  const connectedCount = [connections.analytics, connections.search_console]
    .filter(c => c?.status === 'connected').length;

  // ── Tabs config ───────────────────────────────────────────────────────────────
  const tabs = [
    {
      key:   'connections',
      label: 'Connections',
      dot:   connectedCount === 2 ? 'green' : connectedCount === 1 ? 'yellow' : 'grey',
    },
    {
      key:   'analytics',
      label: 'Analytics',
      dot:   connections.analytics?.status === 'connected' ? 'green' : 'grey',
    },
    {
      key:   'search-console',
      label: 'Search Console',
      dot:   connections.search_console?.status === 'connected' ? 'green' : 'grey',
    },
  ];

  const dotColor = { green: '#22c55e', yellow: '#f9ab00', grey: C.border };

  return (
    <div style={{ padding: '32px 28px 60px', backgroundColor: C.black, minHeight: '100%' }}>

      {/* ── Global keyframes ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes cd-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes cd-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes cd-toast-in {
          from { transform: translateX(-50%) translateY(16px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);   opacity: 1; }
        }
        @keyframes cd-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cd-panel-in {
          from { transform: scale(0.97) translateY(10px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontFamily: GD, fontSize: 26, fontWeight: 400, color: C.white, margin: 0, lineHeight: 1.2 }}>
                Connected Data
              </h1>
              <span style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                backgroundColor: 'rgba(201,168,76,0.1)', color: C.gold,
                border: `1px solid ${C.gold}44`, borderRadius: 3, padding: '2px 7px',
              }}>Admin only</span>
            </div>
            <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0, lineHeight: 1.7, maxWidth: 560 }}>
              Internal testing layer for Google Analytics and Search Console integration.
              Connect, select properties, and validate the full data flow before replicating to the user dashboard.
            </p>
          </div>

          {/* Connection status pill */}
          {!connectionsLoading && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px',
              backgroundColor: connectedCount === 2 ? 'rgba(34,197,94,0.06)' : C.card,
              border: `1px solid ${connectedCount === 2 ? 'rgba(34,197,94,0.2)' : C.border}`,
              borderRadius: 6, flexShrink: 0,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                backgroundColor: connectedCount === 2 ? '#22c55e' : connectedCount === 1 ? '#f9ab00' : C.grey2,
              }} />
              <span style={{ fontFamily: NU, fontSize: 11, color: connectedCount === 2 ? '#86efac' : C.grey }}>
                {connectedCount} of 2 connected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 28,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {tabs.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                fontFamily: NU, fontSize: 12, fontWeight: active ? 700 : 400,
                padding: '10px 18px',
                background: 'none', border: 'none',
                color: active ? C.white : C.grey,
                cursor: 'pointer',
                borderBottom: active ? `2px solid ${C.gold}` : '2px solid transparent',
                marginBottom: -1,
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.white; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.grey; }}
            >
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                backgroundColor: dotColor[tab.dot],
                transition: 'background-color 0.3s',
              }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Connections tab ──────────────────────────────────────────────────── */}
      {activeTab === 'connections' && (
        <div style={{ maxWidth: 760 }}>

          {/* Error banner */}
          {connError && (
            <ErrorBanner
              message={connError}
              onRetry={() => { setConnError(null); }}
              C={C}
            />
          )}

          {connectionsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2].map(i => (
                <div key={i} style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '24px 28px' }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <Skeleton width={36} height={36} radius={4} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <Skeleton height={16} width="40%" style={{ marginBottom: 10 }} />
                      <Skeleton height={11} width="80%" style={{ marginBottom: 6 }} />
                      <Skeleton height={11} width="60%" />
                    </div>
                    <Skeleton width={120} height={36} radius={5} style={{ flexShrink: 0 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ConnectionCard
                name="Google Analytics"
                description="Unlock engagement signals including sessions, bounce rate, average session duration, pages per session, and top landing pages for any connected property."
                icon={<GoogleAnalyticsIcon size={36} />}
                integration="Analytics tab — full engagement dashboard"
                service="analytics"
                conn={connections.analytics}
                onConnect={() => handleConnect('analytics')}
                onDisconnect={() => handleDisconnect('analytics')}
                onChangeProperty={() => openPropertyModal('analytics')}
                onRefresh={loadConnections}
                isConnecting={connecting === 'analytics'}
                C={C}
              />
              <ConnectionCard
                name="Google Search Console"
                description="Unlock keyword visibility data including top search queries, click-through rates, impressions, and average position for any connected Search Console property."
                icon={<GoogleSearchConsoleIcon size={36} />}
                integration="Search Console tab — queries and ranking signals"
                service="search_console"
                conn={connections.search_console}
                onConnect={() => handleConnect('search_console')}
                onDisconnect={() => handleDisconnect('search_console')}
                onChangeProperty={() => openPropertyModal('search_console')}
                onRefresh={loadConnections}
                isConnecting={connecting === 'search_console'}
                C={C}
              />
            </div>
          )}

          {/* How it works */}
          <div style={{
            marginTop: 32, padding: '18px 22px',
            backgroundColor: 'rgba(201,168,76,0.04)',
            border: `1px solid rgba(201,168,76,0.15)`,
            borderRadius: 8,
          }}>
            <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.gold, marginBottom: 10 }}>
              How connections work
            </div>
            <ul style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: 0, paddingLeft: 18, lineHeight: 2.1 }}>
              <li>A Google consent screen opens in a popup. No passwords are stored, ever.</li>
              <li>Only read-only access is requested. We never write to your Google account.</li>
              <li>Tokens are stored securely in Supabase and handled server-side only.</li>
              <li>Data also appears in Website Audits domain detail panels automatically.</li>
              <li>You can disconnect at any time. Tokens are fully wiped on disconnect.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Analytics tab ────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <AnalyticsView
          conn={connections.analytics}
          dateRange={dateRange}
          onDateChange={setDateRange}
          onGoToConnections={() => setActiveTab('connections')}
          onChangeProperty={() => openPropertyModal('analytics')}
          C={C}
        />
      )}

      {/* ── Search Console tab ───────────────────────────────────────────────── */}
      {activeTab === 'search-console' && (
        <SearchConsoleView
          conn={connections.search_console}
          dateRange={dateRange}
          onDateChange={setDateRange}
          onGoToConnections={() => setActiveTab('connections')}
          onChangeProperty={() => openPropertyModal('search_console')}
          C={C}
        />
      )}

      {/* ── Property selector modal ──────────────────────────────────────────── */}
      {propertyModal && (
        <PropertySelectorModal
          service={propertyModal.service}
          properties={propertyModal.properties}
          currentId={connections[propertyModal.service]?.selected_property_id}
          onSelect={(prop) => handleSelectProperty(propertyModal.service, prop)}
          onClose={() => setPropertyModal(null)}
          C={C}
        />
      )}

      {/* ── Success toast ────────────────────────────────────────────────────── */}
      {successService && (
        <SuccessToast
          service={successService}
          onDone={() => setSuccessService(null)}
        />
      )}
    </div>
  );
}
