const REFRESH_NOTES_MAX = 500;

const ApprovalWorkflowSection = ({ formData, onChange, currentUserId }) => {
  const editorial_approved = formData?.editorial_approved || false;
  const editorial_fact_checked = formData?.editorial_fact_checked || false;
  const editorial_last_reviewed_at = formData?.editorial_last_reviewed_at;
  const refresh_notes = formData?.refresh_notes || '';
  const refreshRemaining = REFRESH_NOTES_MAX - refresh_notes.length;
  const refreshNearLimit = refreshRemaining <= 50;
  const refreshAtLimit = refreshRemaining <= 10;

  const getApprovalStatusColor = () => {
    if (editorial_approved && editorial_fact_checked) return '#10b981'; // green
    if (editorial_fact_checked && !editorial_approved) return '#f59e0b'; // yellow
    return '#9ca3af'; // gray
  };

  const getApprovalStatusLabel = () => {
    if (editorial_approved && editorial_fact_checked) return 'Fully Approved';
    if (editorial_fact_checked && !editorial_approved) return 'Fact-Checked, Pending Approval';
    if (editorial_approved && !editorial_fact_checked) return 'Approved, Needs Fact-Check';
    return 'Not Approved';
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* ── APPROVAL STATUS INDICATOR ──────────────────────────────────── */}
      <div style={{
        marginBottom: 28,
        padding: '16px 16px',
        background: 'rgba(201,168,76,0.05)',
        border: `1px solid ${getApprovalStatusColor()}40`,
        borderRadius: 4,
        borderLeft: `4px solid ${getApprovalStatusColor()}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: getApprovalStatusColor(),
          }} />
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1a1a1a',
          }}>
            {getApprovalStatusLabel()}
          </div>
        </div>

        {editorial_last_reviewed_at && (
          <div style={{
            fontSize: 12,
            color: '#666',
            marginTop: 8,
          }}>
            Last reviewed: {formatRelativeTime(editorial_last_reviewed_at)}
          </div>
        )}
      </div>

      {/* ── APPROVAL TOGGLES ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #ebe7e0' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a1a1a', marginBottom: 16 }}>
          Approval Status
        </h3>

        {/* Fact-Checked Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          marginBottom: 12,
          background: editorial_fact_checked ? 'rgba(16,185,129,0.05)' : '#fafaf9',
          border: `1px solid ${editorial_fact_checked ? 'rgba(16,185,129,0.3)' : '#ebe7e0'}`,
          borderRadius: 4,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', letterSpacing: '0.03em' }}>
              ✓ Fact-Checked
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              Content has been verified against reliable sources
            </div>
          </div>
          <input
            type="checkbox"
            checked={editorial_fact_checked}
            onChange={e => onChange('editorial_fact_checked', e.target.checked)}
            style={{
              width: 20,
              height: 20,
              cursor: 'pointer',
              accentColor: '#10b981',
            }}
          />
        </div>

        {/* Approved Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: editorial_approved ? 'rgba(168,132,38,0.05)' : '#fafaf9',
          border: `1px solid ${editorial_approved ? 'rgba(168,132,38,0.3)' : '#ebe7e0'}`,
          borderRadius: 4,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', letterSpacing: '0.03em' }}>
              ★ Approved
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              Editorial approval status. When enabled, an approval badge displays on the public page
            </div>
          </div>
          <input
            type="checkbox"
            checked={editorial_approved}
            onChange={e => {
              onChange('editorial_approved', e.target.checked);
              // Auto-set review timestamp when approving
              if (e.target.checked) {
                onChange('editorial_last_reviewed_at', new Date().toISOString());
                if (currentUserId) {
                  onChange('editorial_last_reviewed_by', currentUserId);
                }
              }
            }}
            style={{
              width: 20,
              height: 20,
              cursor: 'pointer',
              accentColor: '#C9A84C',
            }}
          />
        </div>
      </div>

      {/* ── WORKFLOW HINTS ────────────────────────────────────────────── */}
      {!editorial_fact_checked && (
        <div style={{
          marginBottom: 20,
          padding: '12px 14px',
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: 4,
          fontSize: 12,
          color: '#92400e',
          display: 'flex',
          gap: 10,
        }}>
          <span>⚠️</span>
          <div>Fact-check the content before approving to ensure accuracy</div>
        </div>
      )}

      {editorial_fact_checked && !editorial_approved && (
        <div style={{
          marginBottom: 20,
          padding: '12px 14px',
          background: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: 4,
          fontSize: 12,
          color: '#1e40af',
          display: 'flex',
          gap: 10,
        }}>
          <span>ℹ️</span>
          <div>Content is fact-checked. You can now approve it for publication</div>
        </div>
      )}

      {/* ── REFRESH NOTES ──────────────────────────────────────────────– */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a1a1a', marginBottom: 12 }}>
          Admin Notes
        </h3>

        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#666' }}>
              Refresh Notes
            </label>
            <span style={{
              fontSize: 11,
              fontWeight: refreshAtLimit ? 700 : 400,
              color: refreshAtLimit ? '#dc2626' : refreshNearLimit ? '#f59e0b' : '#bbb',
              transition: 'color 0.2s',
            }}>
              {refreshRemaining} / {REFRESH_NOTES_MAX}
            </span>
          </div>

          <textarea
            value={refresh_notes}
            onChange={e => {
              if (e.target.value.length <= REFRESH_NOTES_MAX) onChange('refresh_notes', e.target.value);
            }}
            placeholder="Internal notes about content freshness, what may need rechecking, or other editorial reminders for future reviews."
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 13,
              lineHeight: 1.6,
              border: `1px solid ${refreshAtLimit ? '#fca5a5' : refreshNearLimit ? '#fcd34d' : '#ddd4c8'}`,
              borderRadius: 3,
              minHeight: 80,
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            maxLength={REFRESH_NOTES_MAX}
          />

          {/* Fill bar */}
          <div style={{ marginTop: 4, height: 2, backgroundColor: '#f0ebe3', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min((refresh_notes.length / REFRESH_NOTES_MAX) * 100, 100)}%`,
              backgroundColor: refreshAtLimit ? '#dc2626' : refreshNearLimit ? '#f59e0b' : '#C9A84C',
              borderRadius: 2,
              transition: 'width 0.15s ease, background-color 0.2s',
            }} />
          </div>
        </div>

        <p style={{ fontSize: 10, color: '#aaa', margin: '6px 0 0' }}>
          Internal only, not shown to users
        </p>
      </div>

    </section>
  );
};

export default ApprovalWorkflowSection;
