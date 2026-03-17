// ─── src/pages/GoogleOAuthCallback.jsx ───────────────────────────────────────
// Standalone page rendered at /admin/oauth/callback.
// Google redirects here after the user grants or denies OAuth consent.
// This page:
//   1. Reads code + state from the URL query string
//   2. Calls the google-oauth-callback edge function to exchange the code
//   3. Posts a message to the opener window (if in a popup) so the main
//      Connections tab can update state immediately
//   4. Auto-closes if in a popup, or redirects to /admin#seo otherwise

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const NU = 'var(--font-body)';
const GD = 'var(--font-heading-primary)';
const G  = '#c9a84c';

export default function GoogleOAuthCallback() {
  const [phase,   setPhase]   = useState('processing'); // processing | success | error
  const [service, setService] = useState('');
  const [message, setMessage] = useState('Connecting your Google account...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');   // "service:uuid"
    const error  = params.get('error');   // e.g. "access_denied"

    // Handle user-denied consent
    if (error) {
      const msg = error === 'access_denied'
        ? 'You declined access. You can close this window and try again when ready.'
        : `Google returned an error: ${error}`;
      setPhase('error');
      setMessage(msg);
      if (window.opener) {
        window.opener.postMessage({ type: 'lwd-oauth-error', error: msg }, '*');
        setTimeout(() => window.close(), 2200);
      }
      return;
    }

    if (!code || !state) {
      const msg = 'Invalid callback — missing required parameters.';
      setPhase('error');
      setMessage(msg);
      return;
    }

    // Parse service from state ("service:uuid" format)
    const colonIdx = state.indexOf(':');
    const svc = state.substring(0, colonIdx);
    setService(svc);

    async function exchange() {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('google-oauth-callback', {
          body: { code, state },
        });

        if (fnError || data?.error) {
          throw new Error(data?.error || fnError?.message || 'Token exchange failed');
        }

        setPhase('success');
        setMessage(`${svc === 'analytics' ? 'Google Analytics' : 'Google Search Console'} connected successfully.`);

        if (window.opener) {
          window.opener.postMessage({
            type:       'lwd-oauth-success',
            service:    svc,
            properties: data.properties || [],
          }, '*');
          setTimeout(() => window.close(), 1600);
        } else {
          // Not a popup — redirect back to admin
          setTimeout(() => { window.location.href = '/admin#seo'; }, 2000);
        }

      } catch (err) {
        setPhase('error');
        setMessage(err.message || 'An error occurred during connection.');
        if (window.opener) {
          window.opener.postMessage({ type: 'lwd-oauth-error', service: svc, error: err.message }, '*');
        }
      }
    }

    exchange();
  }, []);

  const serviceLabel = service === 'analytics' ? 'Google Analytics' : service === 'search_console' ? 'Google Search Console' : 'Google';

  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      background:      '#0f0e0c',
      fontFamily:       NU,
    }}>
      <div style={{
        background:   '#1a1916',
        border:       '1px solid rgba(201,168,76,0.18)',
        borderRadius:  12,
        padding:       '44px 52px',
        textAlign:     'center',
        width:         380,
        maxWidth:      '90vw',
        boxShadow:     '0 20px 60px rgba(0,0,0,0.5)',
      }}>

        {/* LWD wordmark */}
        <div style={{ fontFamily: GD, fontSize: 18, color: G, letterSpacing: '0.12em', marginBottom: 28, opacity: 0.7 }}>
          LWD
        </div>

        {phase === 'processing' && (
          <>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              border: '3px solid rgba(201,168,76,0.15)',
              borderTopColor: G,
              animation: 'spin 0.85s linear infinite',
              margin: '0 auto 22px',
            }} />
            <div style={{ fontFamily: GD, fontSize: 16, color: '#f5f2ec', marginBottom: 8 }}>
              {message}
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: '#6b7280' }}>
              Please wait, this will only take a moment.
            </div>
          </>
        )}

        {phase === 'success' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 18 }}>✓</div>
            <div style={{ fontFamily: GD, fontSize: 17, color: '#22c55e', marginBottom: 8, fontWeight: 400 }}>
              {serviceLabel} connected
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              {window.opener ? 'You can close this window.' : 'Redirecting you back to the dashboard...'}
            </div>
          </>
        )}

        {phase === 'error' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 18 }}>✗</div>
            <div style={{ fontFamily: GD, fontSize: 16, color: '#ef4444', marginBottom: 12, fontWeight: 400 }}>
              Connection failed
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: '#9ca3af', lineHeight: 1.7, marginBottom: 20 }}>
              {message}
            </div>
            <button
              onClick={() => window.opener ? window.close() : (window.location.href = '/admin#seo')}
              style={{
                padding: '9px 22px', background: G, border: 'none',
                color: '#fff', borderRadius: 5, fontFamily: NU,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {window.opener ? 'Close Window' : 'Back to Dashboard'}
            </button>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
