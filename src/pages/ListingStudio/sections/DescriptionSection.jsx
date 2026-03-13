import RichTextEditor from '../components/RichTextEditor';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import { LUXURY_TONE_SYSTEM, buildAboutPrompt } from '../../../lib/aiPrompts';

const SUMMARY_MAX = 240;

const DescriptionSection = ({ formData, onChange }) => {
  const summary   = formData?.summary || '';
  const remaining = SUMMARY_MAX - summary.length;
  const nearLimit = remaining <= 40;
  const atLimit   = remaining <= 10;

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* ── SUMMARY (plain text, max 240 chars) ──────────────────── */}
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
          placeholder="A short editorial introduction — shown on listing cards and under the venue name on the listing page. Keep it punchy and evocative."
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

        {/* Fill bar */}
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
            Card &amp; page header
          </span>
        </div>
      </div>

      {/* ── DESCRIPTION (rich text via TipTap) ───────────────────── */}
      <div>
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.04em',
          color: '#1a1a1a', marginBottom: 8,
        }}>
          Description
        </label>

        {/* AI Content Generator - Generate Description with AI */}
        <div style={{ marginBottom: 16 }}>
          <AIContentGenerator
            feature="about_description"
            systemPrompt={LUXURY_TONE_SYSTEM}
            userPrompt={buildAboutPrompt(formData?.venue_name || '', formData)}
            venueId={formData?.id}
            onInsert={(text) => onChange('description', text)}
            label="Generate Description"
          />
        </div>

        {/* Manual editing via RichTextEditor */}
        <RichTextEditor
          value={formData?.description || ''}
          onChange={html => onChange('description', html)}
          placeholder="Full description of the venue — its history, setting, atmosphere, and what makes it unique for a wedding…"
          minHeight={200}
        />
        <p style={{ fontSize: 10, color: '#aaa', margin: '4px 0 0' }}>
          Supports bold, italic, headings, lists, links and blockquotes. Paste from Word — formatting is auto-cleaned.
        </p>
      </div>

    </section>
  );
};

export default DescriptionSection;
