import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import { LUXURY_TONE_SYSTEM, buildAboutPrompt } from '../../../lib/aiPrompts';

const HERO_SUMMARY_MAX = 500;
const SECTION_INTRO_MAX = 300;

const SECTION_LABELS = {
  overview: 'Overview',
  spaces: 'Event Spaces',
  dining: 'Dining & Culinary',
  rooms: 'Accommodation',
  art: 'Art & Collections',
  weddings: 'Weddings'
};

const EditorialContentSection = ({ formData, onChange }) => {
  const heroSummary = formData?.hero_summary || '';
  const sectionIntros = formData?.section_intros || {};
  const description = formData?.description || '';

  const heroRemaining = HERO_SUMMARY_MAX - heroSummary.length;
  const heroNearLimit = heroRemaining <= 50;
  const heroAtLimit = heroRemaining <= 10;

  const renderSectionIntro = (key, label) => {
    const intro = sectionIntros[key] || '';
    const remaining = SECTION_INTRO_MAX - intro.length;
    const nearLimit = remaining <= 30;
    const atLimit = remaining <= 10;

    return (
      <div key={key} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a1a1a' }}>
            {label}
          </label>
          <span style={{
            fontSize: 11,
            fontWeight: atLimit ? 700 : 400,
            color: atLimit ? '#dc2626' : nearLimit ? '#f59e0b' : '#bbb',
            transition: 'color 0.2s',
          }}>
            {remaining} / {SECTION_INTRO_MAX}
          </span>
        </div>

        <textarea
          value={intro}
          onChange={e => {
            if (e.target.value.length <= SECTION_INTRO_MAX) {
              onChange('section_intros', {
                ...sectionIntros,
                [key]: e.target.value
              });
            }
          }}
          placeholder={`Introductory text for the ${label.toLowerCase()} section on the showcase page.`}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            lineHeight: 1.6,
            border: `1px solid ${atLimit ? '#fca5a5' : nearLimit ? '#fcd34d' : '#ddd4c8'}`,
            borderRadius: 3,
            minHeight: 72,
            fontFamily: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          maxLength={SECTION_INTRO_MAX}
        />

        {/* Fill bar */}
        <div style={{ marginTop: 4, height: 2, backgroundColor: '#f0ebe3', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min((intro.length / SECTION_INTRO_MAX) * 100, 100)}%`,
            backgroundColor: atLimit ? '#dc2626' : nearLimit ? '#f59e0b' : '#C9A84C',
            borderRadius: 2,
            transition: 'width 0.15s ease, background-color 0.2s',
          }} />
        </div>
      </div>
    );
  };

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* ── HERO SUMMARY ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #ebe7e0' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a1a1a', marginBottom: 12 }}>
          Hero Summary
        </h3>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#666' }}>
              Luxury Hero Description
            </label>
            <span style={{
              fontSize: 11,
              fontWeight: heroAtLimit ? 700 : 400,
              color: heroAtLimit ? '#dc2626' : heroNearLimit ? '#f59e0b' : '#bbb',
              transition: 'color 0.2s',
            }}>
              {heroRemaining} / {HERO_SUMMARY_MAX}
            </span>
          </div>

          <textarea
            value={heroSummary}
            onChange={e => {
              if (e.target.value.length <= HERO_SUMMARY_MAX) onChange('hero_summary', e.target.value);
            }}
            placeholder="A luxury-toned description of the venue's defining character and appeal. Distinct from the main description, used in hero sections of showcase pages."
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 13,
              lineHeight: 1.6,
              border: `1px solid ${heroAtLimit ? '#fca5a5' : heroNearLimit ? '#fcd34d' : '#ddd4c8'}`,
              borderRadius: 3,
              minHeight: 100,
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            maxLength={HERO_SUMMARY_MAX}
          />

          {/* Fill bar */}
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 3, backgroundColor: '#f0ebe3', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((heroSummary.length / HERO_SUMMARY_MAX) * 100, 100)}%`,
                backgroundColor: heroAtLimit ? '#dc2626' : heroNearLimit ? '#f59e0b' : '#C9A84C',
                borderRadius: 2,
                transition: 'width 0.15s ease, background-color 0.2s',
              }} />
            </div>
            <span style={{ fontSize: 10, color: '#bbb', whiteSpace: 'nowrap' }}>
              Showcase hero
            </span>
          </div>
        </div>

        {/* AI Generation for hero summary */}
        <div style={{ marginBottom: 16 }}>
          <AIContentGenerator
            feature="hero_summary"
            systemPrompt={LUXURY_TONE_SYSTEM}
            userPrompt={buildAboutPrompt(formData?.venue_name || '', formData)}
            venueId={formData?.id}
            onInsert={(text) => onChange('hero_summary', text.substring(0, HERO_SUMMARY_MAX))}
            label="Generate Hero Summary"
          />
        </div>
      </div>

      {/* ── SECTION INTROS (6 sections) ───────────────────────────────────── */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a1a1a', marginBottom: 20 }}>
          Section Intros
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
        }}>
          {Object.entries(SECTION_LABELS).map(([key, label]) =>
            renderSectionIntro(key, label)
          )}
        </div>

        {/* AI Generation note */}
        <div style={{
          marginTop: 28,
          padding: '14px 16px',
          background: '#f9f7f3',
          border: '1px solid #ebe7e0',
          borderRadius: 4,
          fontSize: 12,
          color: '#666',
          lineHeight: 1.6,
        }}>
          <strong>Tip:</strong> Use the AI generation tools to create section intros based on your venue description. Each intro should be distinctive and highlight what makes that section special.
        </div>
      </div>

    </section>
  );
};

export default EditorialContentSection;
