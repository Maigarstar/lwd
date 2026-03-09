const SUMMARY_MAX = 240;

const DescriptionSection = ({ formData, onChange }) => {
  const summary   = formData?.summary || '';
  const remaining = SUMMARY_MAX - summary.length;
  const nearLimit = remaining <= 40;
  const atLimit   = remaining <= 10;

  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid #e5ddd0' }}>

      {/* ── SUMMARY ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a1a1a' }}>
            Summary
          </label>
          <span style={{
            fontSize: 11,
            fontWeight: atLimit ? 700 : 400,
            color: atLimit ? '#dc2626' : nearLimit ? '#f59e0b' : '#bbb',
            transition: 'color 0.2s',
          }}>
            {remaining} / {SUMMARY_MAX}
          </span>
        </div>

        <textarea
          name="summary"
          value={summary}
          onChange={e => {
            if (e.target.value.length <= SUMMARY_MAX) onChange('summary', e.target.value);
          }}
          placeholder="A short editorial introduction — shown on listing cards and under the venue name on the listing page. Keep it punchy and evocative. (max 240 characters)"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            lineHeight: 1.6,
            border: `1px solid ${atLimit ? '#fca5a5' : nearLimit ? '#fcd34d' : '#ddd4c8'}`,
            borderRadius: 3,
            minHeight: 78,
            fontFamily: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          maxLength={SUMMARY_MAX}
        />

        {/* Inline char counter bar */}
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 3, backgroundColor: '#f0ebe3', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min((summary.length / SUMMARY_MAX) * 100, 100)}%`,
              backgroundColor: atLimit ? '#dc2626' : nearLimit ? '#f59e0b' : '#C9A84C',
              borderRadius: 2,
              transition: 'width 0.15s ease, background-color 0.2s',
            }} />
          </div>
          <span style={{ fontSize: 10, color: '#bbb', whiteSpace: 'nowrap' }}>
            Appears on listing cards &amp; page header
          </span>
        </div>
      </div>

      {/* ── DESCRIPTION ─────────────────────────────────────────────── */}
      <div>
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a1a1a', marginBottom: 6,
        }}>
          Description
        </label>
        <textarea
          name="description"
          value={formData?.description || ''}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Full description of the venue — its history, style, setting, atmosphere, and what makes it unique for a wedding…"
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            lineHeight: 1.65,
            border: '1px solid #ddd4c8',
            borderRadius: 3,
            minHeight: 180,
            fontFamily: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

    </section>
  );
};

export default DescriptionSection;
