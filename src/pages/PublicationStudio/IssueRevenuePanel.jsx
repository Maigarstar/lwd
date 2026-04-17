// ─── IssueRevenuePanel.jsx ────────────────────────────────────────────────────
// Full-screen overlay showing the monetisation dashboard for a single issue.
// Shows stats strip + pages table with slot data.
// Part of the Revenue Engine.

const GOLD   = '#C9A96E';
const BORDER = '#3A3530';
const MUTED  = 'rgba(255,255,255,0.45)';
const NU     = "'Jost', sans-serif";
const GD     = "'Cormorant Garamond', Georgia, serif";

const STATUS_PILL = {
  available:  { label: 'Available',  bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.15)' },
  offered:    { label: 'Offered',    bg: 'rgba(201,169,110,0.1)',  color: GOLD,                   border: 'rgba(201,169,110,0.4)' },
  paid:       { label: 'Paid',       bg: 'rgba(52,211,153,0.1)',   color: '#34d399',              border: 'rgba(52,211,153,0.35)' },
  proof_sent: { label: 'Proof Sent', bg: 'rgba(167,139,250,0.1)', color: '#a78bfa',              border: 'rgba(167,139,250,0.35)' },
  published:  { label: 'Published',  bg: 'rgba(96,165,250,0.1)',   color: '#60a5fa',              border: 'rgba(96,165,250,0.35)' },
};

function StatusPill({ status }) {
  const cfg = STATUS_PILL[status] || STATUS_PILL.available;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 9px',
      borderRadius: 20,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.color,
      fontFamily: NU,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      flex: 1,
      background: 'rgba(201,169,110,0.07)',
      border: `1px solid rgba(201,169,110,0.2)`,
      borderRadius: 6,
      padding: '16px 18px',
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: GD, fontSize: 26, fontStyle: 'italic', color: GOLD, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function getPageLabel(i, total) {
  if (i === 0) return 'Cover';
  if (i === total - 1 && total % 2 === 0) return 'Back';
  return `P${i + 1}`;
}

export default function IssueRevenuePanel({ pages, issueName, onClose, onSendProof }) {
  // Compute stats
  const totalPages = pages.length;
  const slotsWithTier = pages.filter(p => p.slot?.tier);
  const slotsSold     = pages.filter(p => p.slot?.status === 'paid' || p.slot?.status === 'published');
  const slotsOffered  = pages.filter(p => p.slot?.status === 'offered');
  const slotsAvailable = pages.filter(p => !p.slot || p.slot?.status === 'available');
  const totalRevenue  = slotsSold.reduce((sum, p) => sum + (p.slot?.price ?? 0), 0);
  const pipelineValue = slotsOffered.reduce((sum, p) => sum + (p.slot?.price ?? 0), 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#141210',
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          width: 'min(860px, 94vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px 16px',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
              ◆ Issue Revenue
            </div>
            <div style={{ fontFamily: GD, fontSize: 18, fontStyle: 'italic', color: '#fff' }}>
              {issueName || 'Untitled Issue'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 6 }}
          >
            ✕
          </button>
        </div>

        {/* Stats strip */}
        <div style={{
          padding: '16px 24px',
          display: 'flex',
          gap: 12,
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          <StatCard
            label="Total Revenue"
            value={`£${totalRevenue.toLocaleString()}`}
            sub={`from ${slotsSold.length} sold slot${slotsSold.length !== 1 ? 's' : ''}`}
          />
          <StatCard
            label="Slots Sold"
            value={`${slotsSold.length} / ${totalPages}`}
            sub={pipelineValue > 0 ? `£${pipelineValue.toLocaleString()} in pipeline` : 'No pipeline'}
          />
          <StatCard
            label="Available"
            value={String(slotsAvailable.length)}
            sub={`of ${totalPages} total pages`}
          />
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: NU,
            fontSize: 12,
          }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['#', 'Page', 'Tier', 'Vendor', 'Status', 'Price'].map(col => (
                  <th
                    key={col}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontFamily: NU,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: MUTED,
                      background: '#141210',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map((page, i) => {
                const slot      = page.slot;
                const hasSlot   = slot && slot.tier;
                const label     = getPageLabel(i, pages.length);
                const tierLabel = slot?.tier
                  ? slot.tier.charAt(0).toUpperCase() + slot.tier.slice(1)
                  : null;

                return (
                  <tr
                    key={page.id || i}
                    style={{
                      borderBottom: `1px solid rgba(255,255,255,0.05)`,
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'; }}
                  >
                    {/* # */}
                    <td style={{ padding: '10px 16px', color: MUTED, width: 40, fontVariantNumeric: 'tabular-nums' }}>
                      {i + 1}
                    </td>

                    {/* Page name */}
                    <td style={{ padding: '10px 16px', color: '#fff' }}>
                      <span style={{ fontFamily: GD, fontStyle: 'italic' }}>{page.name || label}</span>
                      <span style={{ marginLeft: 8, color: MUTED, fontSize: 10 }}>{label}</span>
                    </td>

                    {/* Tier */}
                    <td style={{ padding: '10px 16px', color: hasSlot ? GOLD : MUTED }}>
                      {tierLabel || <span style={{ opacity: 0.4 }}>— No slot —</span>}
                    </td>

                    {/* Vendor */}
                    <td style={{ padding: '10px 16px', color: hasSlot && slot.vendor_name ? '#fff' : MUTED, maxWidth: 200 }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {slot?.vendor_name || <span style={{ opacity: 0.4 }}>—</span>}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {hasSlot
                          ? <StatusPill status={slot.status || 'available'} />
                          : <span style={{ color: MUTED, opacity: 0.4, fontSize: 11 }}>—</span>
                        }
                        {hasSlot && slot.status === 'paid' && onSendProof && (
                          <button
                            onClick={() => onSendProof(i)}
                            title="Send proof to vendor"
                            style={{
                              fontFamily: NU, fontSize: 8, fontWeight: 700,
                              letterSpacing: '0.06em', textTransform: 'uppercase',
                              padding: '3px 8px', borderRadius: 2, cursor: 'pointer',
                              background: 'rgba(201,168,76,0.08)',
                              border: `1px solid rgba(201,168,76,0.3)`,
                              color: GOLD, whiteSpace: 'nowrap',
                              transition: 'all 0.15s',
                            }}
                          >
                            ◈ Proof
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td style={{
                      padding: '10px 16px',
                      fontFamily: hasSlot && (slot.status === 'paid' || slot.status === 'published') ? GD : NU,
                      fontStyle: hasSlot && (slot.status === 'paid' || slot.status === 'published') ? 'italic' : 'normal',
                      fontSize: hasSlot && (slot.status === 'paid' || slot.status === 'published') ? 15 : 12,
                      color: hasSlot && (slot.status === 'paid' || slot.status === 'published')
                        ? '#34d399'
                        : hasSlot ? MUTED : 'rgba(255,255,255,0.2)',
                      whiteSpace: 'nowrap',
                    }}>
                      {hasSlot && slot.price != null
                        ? `£${slot.price.toLocaleString()}`
                        : <span style={{ opacity: 0.4 }}>—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
            {totalPages} page{totalPages !== 1 ? 's' : ''} · {slotsSold.length} sold · {slotsOffered.length} offered · {slotsAvailable.length} available
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: NU, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Revenue
            </span>
            <span style={{ fontFamily: GD, fontSize: 24, fontStyle: 'italic', color: GOLD }}>
              £{totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
