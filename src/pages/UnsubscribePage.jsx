import { useState, useEffect } from 'react';

/**
 * Unsubscribe landing page — /unsubscribe?email=xxx
 * Called from email footer "Unsubscribe" links.
 * Reads ?email= from the URL, confirms with user, then updates status in DB.
 */
export default function UnsubscribePage() {
  const [email,   setEmail]   = useState('');
  const [status,  setStatus]  = useState('idle'); // idle | loading | done | error | not_found
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get('email') || '';
    setEmail(e);
  }, []);

  const handleUnsubscribe = async () => {
    if (!email.trim() || !email.includes('@')) {
      setStatus('error');
      setMessage('No valid email address found. Please contact us directly.');
      return;
    }
    setStatus('loading');
    try {
      const { supabase } = await import('../lib/supabaseClient');
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
        .eq('email', email.trim().toLowerCase());

      if (error) {
        // If row doesn't exist that's fine - mark as done anyway
        if (error.code === 'PGRST116') {
          setStatus('not_found');
        } else {
          throw error;
        }
      } else {
        setStatus('done');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err?.message || 'Something went wrong. Please try again.');
    }
  };

  const S = {
    page: {
      minHeight: '100vh',
      background: '#f6f1e8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body, Inter, sans-serif)',
      padding: '40px 20px',
    },
    card: {
      background: '#ffffff',
      border: '1px solid rgba(168,132,38,0.2)',
      borderRadius: 8,
      padding: '52px 48px',
      maxWidth: 480,
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
    },
    logo: {
      fontFamily: 'var(--font-heading, Georgia, serif)',
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: '#8f7420',
      marginBottom: 36,
      display: 'block',
    },
    heading: {
      fontFamily: 'var(--font-heading, Georgia, serif)',
      fontSize: 26,
      fontWeight: 700,
      color: '#171717',
      margin: '0 0 12px',
      lineHeight: 1.2,
    },
    sub: {
      fontFamily: 'var(--font-body, Inter, sans-serif)',
      fontSize: 14,
      color: '#666',
      lineHeight: 1.7,
      margin: '0 0 32px',
    },
    emailBadge: {
      display: 'inline-block',
      background: 'rgba(143,116,32,0.08)',
      border: '1px solid rgba(143,116,32,0.2)',
      borderRadius: 20,
      padding: '6px 16px',
      fontFamily: 'var(--font-body, Inter, sans-serif)',
      fontSize: 13,
      color: '#8f7420',
      fontWeight: 600,
      marginBottom: 32,
    },
    btn: {
      display: 'block',
      width: '100%',
      padding: '13px 0',
      background: '#8f7420',
      color: '#fff',
      border: 'none',
      borderRadius: 4,
      fontFamily: 'var(--font-body, Inter, sans-serif)',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      marginBottom: 14,
    },
    link: {
      fontFamily: 'var(--font-body, Inter, sans-serif)',
      fontSize: 12,
      color: '#999',
      textDecoration: 'none',
      cursor: 'pointer',
    },
    icon: {
      fontSize: 48,
      marginBottom: 16,
      display: 'block',
    },
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <span style={S.logo}>Luxury Wedding Directory</span>

        {/* IDLE - confirmation screen */}
        {status === 'idle' && (
          <>
            <h1 style={S.heading}>Unsubscribe</h1>
            <p style={S.sub}>
              We are sorry to see you go. Clicking below will remove you from our mailing list immediately.
            </p>
            {email && <div style={S.emailBadge}>{email}</div>}
            {!email && (
              <div style={{ ...S.sub, color: '#ef4444', marginBottom: 24 }}>
                No email address detected. Please use the unsubscribe link from your email.
              </div>
            )}
            <button onClick={handleUnsubscribe} style={S.btn} disabled={!email}>
              Confirm Unsubscribe
            </button>
            <a href="/" style={S.link}>No thanks, take me back</a>
          </>
        )}

        {/* LOADING */}
        {status === 'loading' && (
          <>
            <span style={S.icon}>...</span>
            <h1 style={{ ...S.heading, fontSize: 20 }}>Processing</h1>
            <p style={S.sub}>Removing your email from our list.</p>
          </>
        )}

        {/* SUCCESS */}
        {status === 'done' && (
          <>
            <span style={S.icon}>✓</span>
            <h1 style={{ ...S.heading, color: '#10b981' }}>Unsubscribed</h1>
            <p style={S.sub}>
              <strong>{email}</strong> has been removed from our mailing list. You will not receive any further newsletters from us.
            </p>
            <p style={{ ...S.sub, fontSize: 12, marginBottom: 24 }}>
              Changed your mind? You can re-subscribe at any time from our website.
            </p>
            <a href="/" style={{ ...S.btn, textDecoration: 'none', display: 'inline-block', padding: '13px 32px', width: 'auto' }}>
              Return to site
            </a>
          </>
        )}

        {/* NOT FOUND (already unsubscribed or never subscribed) */}
        {status === 'not_found' && (
          <>
            <span style={S.icon}>✓</span>
            <h1 style={{ ...S.heading, fontSize: 22 }}>Already unsubscribed</h1>
            <p style={S.sub}>
              <strong>{email}</strong> is not on our active mailing list. No further action is needed.
            </p>
            <a href="/" style={{ ...S.btn, textDecoration: 'none', display: 'inline-block', padding: '13px 32px', width: 'auto' }}>
              Return to site
            </a>
          </>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <>
            <span style={{ ...S.icon, color: '#ef4444' }}>!</span>
            <h1 style={{ ...S.heading, color: '#ef4444', fontSize: 22 }}>Something went wrong</h1>
            <p style={S.sub}>{message}</p>
            <button onClick={() => setStatus('idle')} style={S.btn}>Try again</button>
            <a
              href="mailto:hello@luxuryweddingdirectory.co.uk?subject=Unsubscribe request&body=Please remove me from your mailing list. My email: "
              style={S.link}>
              Contact us to unsubscribe manually
            </a>
          </>
        )}
      </div>
    </div>
  );
}
