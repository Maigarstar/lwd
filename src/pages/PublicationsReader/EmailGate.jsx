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
          issue_id:       issue?.id ?? null,
          issue_slug:     slug ?? null,
          issue_title:    issue?.title ?? null,
          page_at_trigger: currentPage ?? null,
          triggered_by:   triggerReason,
        },
        tagsJson: [
          'publication_reader',
          slug ? `issue:${slug}` : null,
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
        Continue reading the issue
      </h2>

      {/* Sub */}
      <p style={{
        fontFamily: NU, fontSize: 13, color: 'rgba(255,255,255,0.6)',
        margin: '0 0 24px', maxWidth: 380, lineHeight: 1.6,
      }}>
        Enter your name and email to keep reading{' '}
        {issue?.title ? <em style={{ color: 'rgba(255,255,255,0.82)' }}>{issue.title}</em> : 'this issue'}
        {' '}— plus get early access to future editions.
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
