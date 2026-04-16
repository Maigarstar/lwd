// ─── src/pages/PublicationsReader/EmailGate.jsx ──────────────────────────────
// Email capture gate for the full publication reader.
// Triggers after page threshold OR time fallback. Submitting unlocks reading
// for the session and writes a lead record via leadEngineService.
//
// Scope (Phase 3): lead capture only. No Stripe, no email automation.
// Does NOT apply to the embed reader (/publications/embed/[slug]).

import { useState } from 'react';
import { createLead } from '../../services/leadEngineService';

const GOLD = '#C9A84C';
const GD   = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU   = "var(--font-body, 'Jost', sans-serif)";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Destination personalisation ──────────────────────────────────────────────
// Detect a destination from the issue title and tailor the headline.
// Order matters: specific regions/cities before their country.
const DESTINATIONS = [
  // Italy — regions & cities first
  { match: /amalfi/i,          label: 'Amalfi',        headline: 'Continue your Amalfi editorial' },
  { match: /lake\s*como|como/i,label: 'Lake Como',     headline: 'Continue your Lake Como editorial' },
  { match: /tuscany|tuscan/i,  label: 'Tuscany',       headline: 'Unlock the full Tuscany wedding collection' },
  { match: /puglia/i,          label: 'Puglia',        headline: 'Unlock the full Puglia wedding collection' },
  { match: /sicily|sicilian/i, label: 'Sicily',        headline: 'Unlock the full Sicily wedding collection' },
  { match: /venice|venetian/i, label: 'Venice',        headline: 'Continue your Venice editorial' },
  { match: /capri/i,           label: 'Capri',         headline: 'Continue your Capri editorial' },
  { match: /rome|roman/i,      label: 'Rome',          headline: 'Continue your Rome editorial' },
  { match: /italy|italian/i,   label: 'Italy',         headline: 'Unlock the full Italy wedding collection' },
  // France
  { match: /paris|parisian/i,  label: 'Paris',         headline: 'Continue your Paris editorial' },
  { match: /provence/i,        label: 'Provence',      headline: 'Unlock the full Provence wedding collection' },
  { match: /cote d.?azur|riviera|c[oô]te/i, label: 'Côte d’Azur', headline: 'Continue your Côte d’Azur editorial' },
  { match: /france|french/i,   label: 'France',        headline: 'Unlock the full France wedding collection' },
  // Greece
  { match: /santorini/i,       label: 'Santorini',     headline: 'Continue your Santorini editorial' },
  { match: /mykonos/i,         label: 'Mykonos',       headline: 'Continue your Mykonos editorial' },
  { match: /greece|greek/i,    label: 'Greece',        headline: 'Unlock the full Greece wedding collection' },
  // Spain
  { match: /ibiza/i,           label: 'Ibiza',         headline: 'Continue your Ibiza editorial' },
  { match: /mallorca|majorca/i,label: 'Mallorca',      headline: 'Continue your Mallorca editorial' },
  { match: /spain|spanish/i,   label: 'Spain',         headline: 'Unlock the full Spain wedding collection' },
  // UK
  { match: /cotswolds/i,       label: 'Cotswolds',     headline: 'Unlock the full Cotswolds wedding collection' },
  { match: /london/i,          label: 'London',        headline: 'Continue your London editorial' },
  // Others
  { match: /marrakech|morocco/i,label: 'Morocco',      headline: 'Continue your Morocco editorial' },
  { match: /bali/i,            label: 'Bali',          headline: 'Continue your Bali editorial' },
  { match: /hamptons/i,        label: 'Hamptons',      headline: 'Continue your Hamptons editorial' },
];

function personaliseFromIssue(issue) {
  const hay = `${issue?.title || ''} ${issue?.subtitle || ''}`;
  if (!hay.trim()) return null;
  for (const d of DESTINATIONS) {
    if (d.match.test(hay)) return d;
  }
  return null;
}

export default function EmailGate({
  issue,
  slug,
  currentPage,
  triggerReason = 'page_threshold', // 'page_threshold' | 'time_fallback'
  onUnlock,      // called on successful submit
  onSkip,        // called on "Skip for now" — soft close, no localStorage write
}) {
  const [firstName, setFirstName] = useState('');
  const [email,     setEmail]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,  setErrorMsg]  = useState('');

  const canSubmit = firstName.trim().length >= 2 && EMAIL_RE.test(email.trim()) && !submitting;

  // Destination-aware headline (falls back to default)
  const destination = personaliseFromIssue(issue);
  const headline    = destination?.headline || 'Continue your private viewing';

  async function handleSubmit(e) {
    e?.preventDefault?.();
    if (!canSubmit) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const result = await createLead({
        leadSource:  'publication_gate',
        leadChannel: 'publication_reader',
        leadType:    'publication_reader',
        firstName:   firstName.trim(),
        email:       email.trim().toLowerCase(),
        requirementsJson: {
          issue_id:         issue?.id ?? null,
          issue_slug:       slug ?? null,
          issue_title:      issue?.title ?? null,
          page_at_trigger:  currentPage ?? null,
          triggered_by:     triggerReason,
          destination:      destination?.label ?? null,
        },
        tagsJson: [
          'publication_reader',
          slug ? `issue:${slug}` : null,
          destination?.label ? `destination:${destination.label.toLowerCase().replace(/\s+/g, '_')}` : null,
        ].filter(Boolean),
        consentMarketing:      true,
        consentDataProcessing: true,
      });

      if (!result?.success) {
        throw new Error(result?.error?.message || 'Could not save. Please try again.');
      }

      onUnlock?.();
    } catch (err) {
      console.error('[EmailGate] submit failed:', err);
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-gate-title"
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(8,7,6,0.92)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      {/* Cover thumbnail */}
      {issue?.cover_image && (
        <div style={{
          width: 100, height: 142, borderRadius: 3,
          backgroundImage: `url(${issue.cover_image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          marginBottom: 24, flexShrink: 0,
          opacity: 0.75,
        }} />
      )}

      {/* ✦ icon */}
      <div style={{ color: GOLD, fontSize: 20, letterSpacing: 4, marginBottom: 10 }}>✦</div>

      {/* Headline */}
      <h2
        id="email-gate-title"
        style={{
          fontFamily: GD, fontSize: 30, fontWeight: 400,
          color: '#ffffff', margin: '0 0 10px',
          letterSpacing: '0.02em', lineHeight: 1.15,
        }}
      >
        {headline}
      </h2>

      {/* Sub */}
      <p style={{
        fontFamily: NU, fontSize: 13, color: 'rgba(255,255,255,0.6)',
        margin: '0 0 24px', maxWidth: 400, lineHeight: 1.65,
      }}>
        Enter your details to unlock the full issue and discover venues, planners,
        and destinations curated for luxury weddings.
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          width: '100%', maxWidth: 340,
        }}
      >
        <input
          type="text"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          placeholder="First name"
          autoComplete="given-name"
          disabled={submitting}
          style={inputStyle}
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          disabled={submitting}
          style={inputStyle}
        />

        {errorMsg && (
          <div style={{
            fontFamily: NU, fontSize: 11, color: '#E5A8A8',
            marginTop: 2, lineHeight: 1.5,
          }}>
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            background: canSubmit
              ? 'linear-gradient(135deg, #D4B06A 0%, #C9A96E 100%)'
              : 'rgba(201,169,110,0.35)',
            border: 'none', borderRadius: 2,
            color: canSubmit ? '#18120A' : 'rgba(24,18,10,0.5)',
            fontFamily: NU, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '14px 24px',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            marginTop: 4,
          }}
        >
          {submitting ? '✦ Unlocking…' : '✦ Continue Reading'}
        </button>

        <button
          type="button"
          onClick={onSkip}
          disabled={submitting}
          style={{
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: NU, fontSize: 10, fontWeight: 500,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '8px',
            cursor: submitting ? 'default' : 'pointer',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { if (!submitting) e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
        >
          Skip for now
        </button>
      </form>

      {/* Fine print */}
      <p style={{
        fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.25)',
        margin: '22px 0 0', lineHeight: 1.5, maxWidth: 320,
      }}>
        We'll only email you about new issues and editorial. Unsubscribe anytime.
      </p>
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 2,
  color: '#ffffff',
  fontFamily: NU,
  fontSize: 13,
  letterSpacing: '0.02em',
  padding: '12px 14px',
  outline: 'none',
  transition: 'border-color 0.15s, background 0.15s',
};
