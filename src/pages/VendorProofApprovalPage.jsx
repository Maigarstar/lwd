// ─── VendorProofApprovalPage.jsx ──────────────────────────────────────────────
// Public page for vendors to approve or request changes on their editorial proof.
// Route: /magazine/proof-approval/:token
// Token = btoa(`${issueId}:${pageNum}:${vendorEmail}`)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { sendEmail } from '../services/emailSendService';

const GOLD  = '#C9A84C';
const GD    = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU    = "var(--font-body, 'Jost', sans-serif)";
const MUTED = 'rgba(255,255,255,0.45)';
const BORDER= 'rgba(255,255,255,0.1)';

export default function VendorProofApprovalPage({ token, onBack }) {
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [slot,      setSlot]      = useState(null);
  const [issueName, setIssueName] = useState('');
  const [issueId,   setIssueId]   = useState('');
  const [pageNum,   setPageNum]   = useState(null);
  const [vendorEmail, setVendorEmail] = useState('');

  // Action state
  const [action,      setAction]      = useState(null); // null | 'approve' | 'changes'
  const [feedback,    setFeedback]    = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitErr,   setSubmitErr]   = useState('');

  // Decode token on mount
  useEffect(() => {
    if (!token) { setError('Invalid or missing approval token.'); setLoading(false); return; }
    let decoded;
    try {
      decoded = atob(token);
    } catch {
      setError('Invalid approval token.'); setLoading(false); return;
    }
    const parts = decoded.split(':');
    if (parts.length < 3) { setError('Malformed approval token.'); setLoading(false); return; }
    const [iid, pn, ...emailParts] = parts;
    const email = emailParts.join(':'); // handle emails with colons
    setIssueId(iid);
    setPageNum(parseInt(pn) || 1);
    setVendorEmail(email);

    // Check URL for pre-set action
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'changes') {
      setAction('changes');
    }

    // Fetch issue + page data
    (async () => {
      try {
        const [issueRes, pageRes] = await Promise.all([
          supabase.from('magazine_issues').select('title').eq('id', iid).single(),
          supabase.from('magazine_issue_pages').select('template_data').eq('issue_id', iid).eq('page_number', parseInt(pn) || 1).single(),
        ]);
        if (issueRes.data) setIssueName(issueRes.data.title || 'Editorial Issue');
        if (pageRes.data?.template_data?.slot) setSlot(pageRes.data.template_data.slot);
      } catch (err) {
        console.warn('[VendorProofApprovalPage] Fetch error:', err);
      }
      setLoading(false);
    })();
  }, [token]);

  async function handleSubmit() {
    if (!action) return;
    if (action === 'changes' && !feedback.trim()) return;
    setSubmitting(true); setSubmitErr('');
    try {
      // Upsert proof approval record
      await supabase.from('magazine_proof_approvals').insert({
        issue_id:     issueId,
        page_number:  pageNum,
        vendor_email: vendorEmail,
        vendor_name:  slot?.vendor_name || null,
        approved:     action === 'approve',
        notes:        feedback.trim() || null,
      });

      // Notify editorial team
      const isApproved = action === 'approve';
      await sendEmail({
        subject: isApproved
          ? `✓ Proof approved by ${slot?.vendor_name || vendorEmail} — ${issueName}`
          : `⚠ Changes requested by ${slot?.vendor_name || vendorEmail} — ${issueName}`,
        fromName:  'Luxury Wedding Directory',
        fromEmail: 'editorial@luxuryweddingdirectory.com',
        html: `<!DOCTYPE html><html><body style="background:#0A0908;font-family:sans-serif;margin:0;padding:0"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><div style="border-top:3px solid ${isApproved ? '#34d399' : '#f59e0b'};padding-top:32px"><p style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:${isApproved ? '#34d399' : '#f59e0b'};text-transform:uppercase;margin:0 0 12px">LWD · Proof ${isApproved ? 'Approval' : 'Changes Requested'}</p><h2 style="font-family:Georgia,serif;font-size:24px;font-style:italic;font-weight:400;color:#F0EBE0;margin:0 0 20px">${isApproved ? 'Proof approved' : 'Changes requested'} — ${issueName}</h2><p style="color:rgba(240,235,224,0.7);font-size:14px;line-height:1.6"><strong style="color:#F0EBE0">Vendor:</strong> ${slot?.vendor_name || vendorEmail}<br><strong style="color:#F0EBE0">Email:</strong> ${vendorEmail}<br><strong style="color:#F0EBE0">Page:</strong> ${pageNum}</p>${feedback.trim() ? `<div style="margin:20px 0;padding:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:4px"><p style="font-size:10px;font-weight:700;color:rgba(240,235,224,0.45);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px">Feedback</p><p style="color:rgba(240,235,224,0.8);font-size:14px;line-height:1.6;margin:0">${feedback.trim()}</p></div>` : ''}</div></div></body></html>`,
        recipients: [{ email: 'editorial@luxuryweddingdirectory.com', name: 'LWD Editorial' }],
        type: 'campaign',
      }).catch(() => {});

      setSubmitted(true);
    } catch (err) {
      console.error('[VendorProofApprovalPage] Submit failed:', err);
      setSubmitErr(err.message || 'Failed to submit response. Please try again.');
    }
    setSubmitting(false);
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: NU, fontSize: 12, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Loading proof…
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#080706', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: GD, fontSize: 24, fontStyle: 'italic', color: '#F0EBE0', marginBottom: 12 }}>
            Approval link invalid
          </div>
          <div style={{ fontFamily: NU, fontSize: 13, color: MUTED, marginBottom: 24 }}>{error}</div>
          <button onClick={onBack} style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '10px 24px', borderRadius: 3, cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, color: MUTED,
          }}>← Back</button>
        </div>
      </div>
    );
  }

  // ── Thank you screen ─────────────────────────────────────────────────────────
  if (submitted) {
    const isApproved = action === 'approve';
    return (
      <div style={{ minHeight: '100vh', background: '#080706', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>{isApproved ? '✓' : '✎'}</div>
          <div style={{ fontFamily: GD, fontSize: 28, fontStyle: 'italic', color: '#F0EBE0', marginBottom: 12 }}>
            {isApproved ? 'Proof approved.' : 'Changes requested.'}
          </div>
          <div style={{ fontFamily: NU, fontSize: 14, color: MUTED, lineHeight: 1.7 }}>
            {isApproved
              ? 'Thank you for approving your editorial proof. Our team will proceed with your placement.'
              : 'Thank you for your feedback. Our editorial team will review your changes and be in touch shortly.'}
          </div>
        </div>
      </div>
    );
  }

  // ── Main page ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#080706', fontFamily: NU }}>
      {/* Gold top bar */}
      <div style={{ height: 3, background: GOLD }} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Brand */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: GOLD, textTransform: 'uppercase', marginBottom: 8 }}>
            Luxury Wedding Directory — Editorial
          </div>
          <div style={{ fontFamily: GD, fontSize: 32, fontStyle: 'italic', fontWeight: 400, color: '#F0EBE0', lineHeight: 1.2 }}>
            Your editorial proof
          </div>
        </div>

        {/* Issue + vendor info */}
        <div style={{
          padding: '18px 20px', borderRadius: 6,
          background: 'rgba(201,168,76,0.06)', border: `1px solid rgba(201,168,76,0.2)`,
          marginBottom: 28,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            {[
              ['Issue', issueName || '—'],
              ['Vendor', slot?.vendor_name || '—'],
              ['Tier', slot?.tier ? slot.tier.charAt(0).toUpperCase() + slot.tier.slice(1) : '—'],
              ['Page', String(pageNum)],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: GD, fontSize: 15, fontStyle: 'italic', color: '#F0EBE0' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Proof image */}
        {slot?.proof_url && (
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <img
              src={slot.proof_url}
              alt="Your editorial proof"
              style={{
                maxWidth: '100%', maxHeight: 600, objectFit: 'contain',
                border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 4,
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              }}
            />
            <div style={{ marginTop: 12 }}>
              <a
                href={slot.proof_url} target="_blank" rel="noopener noreferrer"
                style={{
                  fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: GOLD, textDecoration: 'none',
                }}
              >
                View Full Size ↗
              </a>
            </div>
          </div>
        )}

        {!slot?.proof_url && (
          <div style={{ marginBottom: 32, padding: '24px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 6 }}>
            <div style={{ fontFamily: GD, fontSize: 16, fontStyle: 'italic', color: MUTED }}>
              Proof image will appear here when ready.
            </div>
          </div>
        )}

        {/* Action selection */}
        {!action ? (
          <div>
            <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
              Your response
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setAction('approve')}
                style={{
                  flex: 1, padding: '16px 0', borderRadius: 4, cursor: 'pointer',
                  background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.4)',
                  color: '#34d399', fontFamily: NU, fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.15s',
                }}
              >
                ✓ Approve Proof
              </button>
              <button
                onClick={() => setAction('changes')}
                style={{
                  flex: 1, padding: '16px 0', borderRadius: 4, cursor: 'pointer',
                  background: 'rgba(248,113,113,0.08)', border: '2px solid rgba(248,113,113,0.3)',
                  color: '#f87171', fontFamily: NU, fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.15s',
                }}
              >
                ✗ Request Changes
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Action chosen */}
            <div style={{
              marginBottom: 20, padding: '12px 16px', borderRadius: 4,
              background: action === 'approve' ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.06)',
              border: `1px solid ${action === 'approve' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: action === 'approve' ? '#34d399' : '#f87171' }}>
                {action === 'approve' ? '✓ Approving proof' : '✗ Requesting changes'}
              </div>
              <button
                onClick={() => setAction(null)}
                style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 14, padding: 4 }}
              >
                ✕
              </button>
            </div>

            {action === 'changes' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Describe the changes you need *
                </label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Please describe what changes you'd like to see…"
                  rows={5}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                    borderRadius: 4, color: '#fff', fontFamily: NU, fontSize: 13,
                    padding: '10px 12px', outline: 'none', resize: 'vertical', lineHeight: 1.6,
                  }}
                />
              </div>
            )}

            {action === 'approve' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Any additional comments? (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Any final notes or comments…"
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                    borderRadius: 4, color: '#fff', fontFamily: NU, fontSize: 13,
                    padding: '10px 12px', outline: 'none', resize: 'vertical', lineHeight: 1.6,
                  }}
                />
              </div>
            )}

            {submitErr && (
              <div style={{ marginBottom: 12, fontFamily: NU, fontSize: 11, color: '#f87171' }}>
                ✕ {submitErr}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || (action === 'changes' && !feedback.trim())}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 4, cursor: submitting ? 'not-allowed' : 'pointer',
                background: action === 'approve'
                  ? submitting ? 'rgba(52,211,153,0.06)' : 'rgba(52,211,153,0.15)'
                  : submitting ? 'rgba(248,113,113,0.06)' : 'rgba(248,113,113,0.12)',
                border: action === 'approve'
                  ? `1px solid ${submitting ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.5)'}`
                  : `1px solid ${submitting ? 'rgba(248,113,113,0.15)' : 'rgba(248,113,113,0.4)'}`,
                color: action === 'approve'
                  ? submitting ? 'rgba(52,211,153,0.4)' : '#34d399'
                  : submitting ? 'rgba(248,113,113,0.4)' : '#f87171',
                fontFamily: NU, fontSize: 12, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.15s',
                opacity: action === 'changes' && !feedback.trim() ? 0.4 : 1,
              }}
            >
              {submitting ? '⋯ Submitting…' : action === 'approve' ? '✓ Submit Approval' : '✗ Submit Changes Request'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, borderTop: `1px solid ${BORDER}`, paddingTop: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>
            © {new Date().getFullYear()} Luxury Wedding Directory ·{' '}
            <a href="mailto:editorial@luxuryweddingdirectory.com" style={{ color: 'rgba(201,168,76,0.4)', textDecoration: 'none' }}>
              editorial@luxuryweddingdirectory.com
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
