// ─── VersionHistoryPanel.jsx ──────────────────────────────────────────────────
// WordPress-style revision history panel for the Publication Studio.
//
// Shows all saved versions of the current issue (newest first).
// Clicking a version previews its page count and metadata.
// "Restore" replaces the live canvas with that version's pages_snapshot.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { listVersions, getVersion, renameVersion } from '../../../services/publicationVersionService';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';

const BG  = '#111009';
const BG2 = '#1A1712';
const BDR = 'rgba(255,255,255,0.09)';

// ── Relative time ─────────────────────────────────────────────────────────────
function relativeTime(dateStr) {
  if (!dateStr) return '';
  const d    = new Date(dateStr);
  const secs = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (secs < 60)   return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60)   return `${mins}m ago`;
  const hrs  = Math.floor(mins / 60);
  if (hrs  < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)    return `${days}d ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fullDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Label badge ───────────────────────────────────────────────────────────────
function LabelBadge({ label }) {
  const isAuto   = label?.toLowerCase().includes('auto');
  const isManual = label?.toLowerCase().includes('manual') || label?.toLowerCase().includes('save');
  const bg  = isAuto   ? 'rgba(255,255,255,0.07)'
            : isManual ? 'rgba(201,169,110,0.12)'
            : 'rgba(52,211,153,0.12)';
  const col = isAuto   ? MUTED
            : isManual ? GOLD
            : '#34d399';
  return (
    <span style={{
      display: 'inline-block',
      background: bg, color: col,
      fontFamily: NU, fontSize: 8, fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '2px 6px', borderRadius: 2,
    }}>
      {label || 'Save'}
    </span>
  );
}

// ── Version row ───────────────────────────────────────────────────────────────
function VersionRow({ v, active, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => onSelect(v)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', textAlign: 'left',
        background: active ? 'rgba(201,169,110,0.1)' : hov ? 'rgba(255,255,255,0.04)' : 'none',
        border: 'none',
        borderLeft: `3px solid ${active ? GOLD : 'transparent'}`,
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'all 0.12s',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{
          fontFamily: NU, fontSize: 11, fontWeight: 700,
          color: active ? GOLD : '#fff', letterSpacing: '0.02em',
        }}>
          Version {v.version_number}
        </span>
        <LabelBadge label={v.label} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
          {relativeTime(v.created_at)}
        </span>
        <span style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>·</span>
        <span style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
          {v.page_count} {v.page_count === 1 ? 'page' : 'pages'}
        </span>
      </div>
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function VersionHistoryPanel({ issue, currentPageCount, onRestore, onClose }) {
  const [versions,     setVersions]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selected,     setSelected]     = useState(null);   // version metadata
  const [loadingFull,  setLoadingFull]  = useState(false);  // fetching snapshot
  const [confirmMode,  setConfirmMode]  = useState(false);  // restore confirm
  const [restoring,    setRestoring]    = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft,   setLabelDraft]   = useState('');
  const [savingLabel,  setSavingLabel]  = useState(false);

  // ── Load version list ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!issue?.id) return;
    setLoading(true);
    setError(null);
    const { versions: v, error: e } = await listVersions(issue.id);
    setLoading(false);
    if (e) { setError(e); return; }
    setVersions(v);
    if (v.length > 0 && !selected) setSelected(v[0]);
  }, [issue?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // ── Restore ────────────────────────────────────────────────────────────────
  async function handleRestore() {
    if (!selected) return;
    setRestoring(true);
    const { version, error: e } = await getVersion(selected.id);
    setRestoring(false);
    if (e || !version?.pages_snapshot) {
      alert('Could not load this version — ' + (e || 'no snapshot found'));
      return;
    }
    onRestore(version.pages_snapshot);
    onClose();
  }

  // ── Rename ────────────────────────────────────────────────────────────────
  async function handleSaveLabel() {
    if (!selected || !labelDraft.trim()) return;
    setSavingLabel(true);
    await renameVersion(selected.id, labelDraft.trim());
    setSavingLabel(false);
    setEditingLabel(false);
    setVersions(prev =>
      prev.map(v => v.id === selected.id ? { ...v, label: labelDraft.trim() } : v)
    );
    setSelected(prev => prev ? { ...prev, label: labelDraft.trim() } : prev);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 380, maxWidth: '92vw',
          background: BG,
          borderLeft: `1px solid ${BDR}`,
          borderTop: `2px solid ${GOLD}`,
          display: 'flex', flexDirection: 'column',
          height: '100%',
          animation: 'vhSlide 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes vhSlide {
            from { transform: translateX(48px); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: '14px 16px 14px',
          borderBottom: `1px solid ${BDR}`,
          flexShrink: 0,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Publication Studio
            </div>
            <div style={{ fontFamily: GD, fontSize: 18, fontStyle: 'italic', color: '#F0EBE0', marginTop: 2 }}>
              Version history
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 4 }}>
              {versions.length} saved version{versions.length !== 1 ? 's' : ''} · last 50 kept
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: `1px solid ${BDR}`, borderRadius: 2,
              color: MUTED, padding: '5px 10px', cursor: 'pointer',
              fontFamily: NU, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* ── Body: two-column feel — list left, detail right (collapsed in 380px) ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center', padding: 40 }}>
              Loading history…
            </div>
          )}
          {error && !loading && (
            <div style={{ fontFamily: NU, fontSize: 10, color: '#F3C8C8', padding: '16px 16px 0' }}>
              {error}
            </div>
          )}
          {!loading && !error && versions.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: GD, fontStyle: 'italic', fontSize: 16, color: MUTED, marginBottom: 10 }}>
                No versions yet
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.7 }}>
                A version is saved every time you press Save (Ctrl+S).
                Your history will appear here.
              </div>
            </div>
          )}

          {/* Version list */}
          {!loading && versions.length > 0 && (
            <div style={{ paddingBottom: 80 }}>
              {/* Current state notice */}
              <div style={{
                padding: '10px 14px',
                background: 'rgba(52,211,153,0.06)',
                borderBottom: `1px solid rgba(52,211,153,0.12)`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 8, color: '#34d399' }}>●</span>
                <span style={{ fontFamily: NU, fontSize: 10, color: '#34d399', letterSpacing: '0.04em' }}>
                  Current — {currentPageCount} pages (unsaved changes may exist)
                </span>
              </div>

              {versions.map(v => (
                <div key={v.id}>
                  <VersionRow
                    v={v}
                    active={selected?.id === v.id}
                    onSelect={setSelected}
                  />
                  {/* Expanded detail when selected */}
                  {selected?.id === v.id && (
                    <div style={{
                      padding: '0 14px 14px 17px',
                      borderLeft: `3px solid ${GOLD}`,
                      background: 'rgba(201,169,110,0.05)',
                    }}>
                      {/* Full date */}
                      <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
                        {fullDate(v.created_at)}
                      </div>

                      {/* Rename label */}
                      {editingLabel ? (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                          <input
                            autoFocus
                            value={labelDraft}
                            onChange={e => setLabelDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') setEditingLabel(false); }}
                            maxLength={40}
                            placeholder="e.g. Client approved"
                            style={{
                              flex: 1,
                              background: 'rgba(255,255,255,0.06)',
                              border: `1px solid ${GOLD}`,
                              borderRadius: 2, color: '#fff',
                              fontFamily: NU, fontSize: 10,
                              padding: '5px 8px', outline: 'none',
                            }}
                          />
                          <button
                            onClick={handleSaveLabel}
                            disabled={savingLabel}
                            style={{
                              background: GOLD, border: 'none', borderRadius: 2,
                              color: '#0E0D0B', fontFamily: NU, fontSize: 9, fontWeight: 700,
                              padding: '5px 10px', cursor: 'pointer',
                            }}
                          >
                            {savingLabel ? '…' : '✓'}
                          </button>
                          <button
                            onClick={() => setEditingLabel(false)}
                            style={{
                              background: 'none', border: `1px solid ${BDR}`, borderRadius: 2,
                              color: MUTED, fontFamily: NU, fontSize: 9,
                              padding: '5px 8px', cursor: 'pointer',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setLabelDraft(v.label); setEditingLabel(true); }}
                          style={{
                            background: 'none', border: `1px solid ${BDR}`, borderRadius: 2,
                            color: MUTED, fontFamily: NU, fontSize: 9,
                            padding: '4px 9px', cursor: 'pointer', marginBottom: 10,
                            letterSpacing: '0.06em',
                          }}
                        >
                          ✎ Rename
                        </button>
                      )}

                      {/* Restore button / confirm */}
                      {!confirmMode ? (
                        <button
                          onClick={() => setConfirmMode(true)}
                          style={{
                            width: '100%',
                            background: 'rgba(201,169,110,0.14)',
                            border: '1px solid rgba(201,169,110,0.45)',
                            borderRadius: 2, color: GOLD,
                            fontFamily: NU, fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            padding: '8px', cursor: 'pointer',
                          }}
                        >
                          ↩ Restore this version
                        </button>
                      ) : (
                        <div style={{
                          background: 'rgba(255,100,100,0.08)',
                          border: '1px solid rgba(255,100,100,0.25)',
                          borderRadius: 2, padding: '10px 12px',
                        }}>
                          <div style={{ fontFamily: NU, fontSize: 10, color: '#F3C8C8', marginBottom: 10, lineHeight: 1.6 }}>
                            This will replace your current canvas with Version {v.version_number}.
                            Your current work will be saved as the latest version first.
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setConfirmMode(false)}
                              style={{
                                flex: 1, background: 'none', border: `1px solid ${BDR}`,
                                borderRadius: 2, color: MUTED,
                                fontFamily: NU, fontSize: 9, fontWeight: 700,
                                padding: '6px', cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleRestore}
                              disabled={restoring}
                              style={{
                                flex: 2,
                                background: restoring ? 'rgba(201,169,110,0.2)' : GOLD,
                                border: 'none', borderRadius: 2,
                                color: '#0E0D0B',
                                fontFamily: NU, fontSize: 10, fontWeight: 700,
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                                padding: '7px', cursor: restoring ? 'default' : 'pointer',
                              }}
                            >
                              {restoring ? '⟳ Restoring…' : '↩ Yes, restore'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer info ─────────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          borderTop: `1px solid ${BDR}`,
          padding: '10px 14px',
          background: BG2,
        }}>
          <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.2)', lineHeight: 1.7 }}>
            Versions are created on every save. The last 50 are kept.
            Restoring loads the selected snapshot — your current canvas is auto-saved first.
          </div>
        </div>
      </div>
    </div>
  );
}
