// ─── src/components/showcase/ShowcaseFaq.jsx ─────────────────────────────────
// FAQ accordion with JSON-LD FAQPage schema injection.
//
// Each question collapses by default and expands on click with a smooth
// CSS grid animation. JSON-LD is injected into <head> on mount so Google
// and AI models can surface answers as rich results.
//
// Props:
//   faqs        — array of { question, answer } (also accepts { q, a } shape)
//   eyebrow     — section label (default: 'Frequently Asked Questions')
//   headline    — optional section heading
//   accentColor — gold/brand colour
//   theme       — 'light' | 'dark'
//   bg          — background colour override
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useBreakpoint } from '../../hooks/useWindowWidth';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

function ChevronIcon({ open, gold }) {
  return (
    <svg
      width="18" height="18" viewBox="0 0 18 18" fill="none"
      style={{
        flexShrink: 0, marginTop: 3,
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <path
        d="M4.5 6.75l4.5 4.5 4.5-4.5"
        stroke={gold} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function AccordionItem({ question, answer, isOpen, onToggle, gold, text, muted, border }) {
  return (
    <div style={{ borderTop: `1px solid ${border}` }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          gap: 20, padding: '20px 0',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{
          fontFamily: NU, fontSize: 15, fontWeight: 600,
          color: text, lineHeight: 1.45, letterSpacing: '0.01em',
        }}>
          {question}
        </span>
        <ChevronIcon open={isOpen} gold={gold} />
      </button>

      {/* Smooth height animation using CSS grid trick */}
      <div style={{
        display: 'grid',
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <p style={{
            fontFamily: NU, fontSize: 14, color: muted,
            lineHeight: 1.8, margin: 0, paddingBottom: 22,
          }}>
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ShowcaseFaq({
  faqs = [],
  eyebrow = 'Frequently Asked Questions',
  headline,
  accentColor,
  theme = 'light',
  bg: bgOverride,
}) {
  const { isMobile } = useBreakpoint();
  const [openIdx, setOpenIdx] = useState(null);

  const isLight = theme === 'light';
  const bg      = bgOverride || (isLight ? '#faf9f6' : '#0f0e0c');
  const text    = isLight ? '#1a1209' : '#f5f0e8';
  const muted   = isLight ? 'rgba(26,18,9,0.62)' : 'rgba(245,240,232,0.6)';
  const border  = isLight ? '#e8e2d8' : 'rgba(245,240,232,0.1)';
  const gold    = accentColor || '#C4A35A';

  // Normalise both { question, answer } and legacy { q, a } shapes
  const items = faqs.map(f => ({
    question: f.question || f.q || '',
    answer:   f.answer   || f.a || '',
  })).filter(f => f.question && f.answer);

  // Inject JSON-LD FAQPage schema for AI and search rich results
  useEffect(() => {
    if (!items.length) return;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'lwd-faq-schema';
    script.textContent = JSON.stringify(schema, null, 2);
    document.getElementById('lwd-faq-schema')?.remove();
    document.head.appendChild(script);
    return () => { document.getElementById('lwd-faq-schema')?.remove(); };
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items.length) return null;

  const toggle = (i) => setOpenIdx(prev => prev === i ? null : i);

  return (
    <div style={{
      background: bg,
      padding: isMobile ? '56px 24px' : '72px 64px',
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Eyebrow + heading */}
        <p style={{
          fontFamily: NU, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: gold, margin: '0 0 14px',
        }}>
          {eyebrow}
        </p>
        {headline && (
          <h2 style={{
            fontFamily: GD, fontSize: isMobile ? 26 : 36,
            color: text, margin: '0 0 8px', fontWeight: 400, lineHeight: 1.15,
          }}>
            {headline}
          </h2>
        )}
        <div style={{ width: 40, height: 1, background: gold, margin: '0 0 40px' }} />

        {/* Accordion */}
        <div>
          {items.map((item, i) => (
            <AccordionItem
              key={i}
              question={item.question}
              answer={item.answer}
              isOpen={openIdx === i}
              onToggle={() => toggle(i)}
              gold={gold}
              text={text}
              muted={muted}
              border={border}
            />
          ))}
          {/* Bottom border */}
          <div style={{ borderTop: `1px solid ${border}` }} />
        </div>

      </div>
    </div>
  );
}
