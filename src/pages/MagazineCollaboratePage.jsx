// ─── src/pages/MagazineCollaboratePage.jsx ───────────────────────────────────
// Collaborator invite-token landing page.
// Route: /magazine/collaborate/:token
//
// On load: validates token → marks collaborator active → shows issue read-only
// with a floating comment panel.

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { fetchIssueById } from '../services/magazineIssuesService';
import { fetchPages } from '../services/magazinePageService';
import { sendEmail } from '../services/emailSendService';

function buildCommentNotificationEmail({ authorName, authorEmail, issueName, pageNumber, content }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0A0908;font-family:sans-serif;">
  <div style="max-width:540px;margin:0 auto;padding:40px 24px;">
    <div style="border-top:3px solid #C9A84C;padding-top:28px;margin-bottom:28px;">
      <p style="font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#C9A84C;text-transform:uppercase;margin:0 0 10px;">
        LWD Magazine Studio — New Comment
      </p>
      <h1 style="font-family:Georgia,serif;font-size:22px;font-style:italic;font-weight:400;color:#F0EBE0;margin:0;line-height:1.3;">
        A new comment was added to <em>${issueName || 'an issue'}</em>
      </h1>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="padding:8px 0;font-size:11px;color:rgba(240,235,224,0.5);font-family:sans-serif;width:90px;">Author</td>
        <td style="padding:8px 0;font-size:13px;color:#F0EBE0;font-family:sans-serif;">${authorName || 'Anonymous'}${authorEmail ? ` &lt;${authorEmail}&gt;` : ''}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:11px;color:rgba(240,235,224,0.5);font-family:sans-serif;">Page</td>
        <td style="padding:8px 0;font-size:13px;color:#C9A84C;font-family:sans-serif;">Page ${pageNumber}</td>
      </tr>
    </table>
    <div style="background:rgba(255,255,255,0.04);border-left:3px solid #C9A84C;padding:14px 18px;border-radius:2px;margin-bottom:28px;">
      <p style="font-size:14px;color:rgba(240,235,224,0.85);font-family:sans-serif;line-height:1.7;margin:0;">
        ${content}
      </p>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:18px;text-align:center;">
      <span style="font-size:10px;color:rgba(255,255,255,0.25);font-family:sans-serif;">
        © ${new Date().getFullYear()} Luxury Wedding Directory
      </span>
    </div>
  </div>
</body>
</html>`;
}

const GOLD   = '#C9A96E';
const DARK   = '#141210';
const BORDER = 'rgba(255,255,255,0.1)';
const MUTED  = 'rgba(255,255,255,0.4)';
const NU     = "'Jost', sans-serif";
const GD     = "'Cormorant Garamond', Georgia, serif";

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const isEditor = role === 'editor';
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 10,
      background: isEditor ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.07)',
      border: `1px solid ${isEditor ? 'rgba(201,168,76,0.4)' : BORDER}`,
      color: isEditor ? GOLD : MUTED,
      fontFamily: NU, fontSize: 9, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      {isEditor ? 'Editor' : 'Viewer'}
    </span>
  );
}

// ── Page thumbnail card ───────────────────────────────────────────────────────
function PageThumb({ page, isCurrent, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 80, flexShrink: 0, cursor: 'pointer',
        border: `2px solid ${isCurrent ? GOLD : BORDER}`,
        borderRadius: 3, overflow: 'hidden',
        background: '#1a1612', transition: 'border-color 0.15s',
      }}
    >
      {page.image_url
        ? <img src={page.image_url} alt={`Page ${page.page_number}`}
            style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
        : <div style={{
            height: 110, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontFamily: NU, fontSize: 11, color: MUTED,
          }}>
            {page.page_number}
          </div>
      }
      <div style={{
        textAlign: 'center', fontFamily: NU, fontSize: 8, color: isCurrent ? GOLD : MUTED,
        padding: '4px 0', borderTop: `1px solid ${BORDER}`,
      }}>
        {page.page_number}
      </div>
    </div>
  );
}

// ── Comment item ─────────────────────────────────────────────────────────────
function CommentItem({ comment }) {
  const d = new Date(comment.created_at);
  const label = `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 4,
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${comment.resolved ? 'rgba(52,211,153,0.15)' : BORDER}`,
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: '#fff' }}>
          {comment.author_name || 'Anonymous'}
        </span>
        <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>· p{comment.page_number}</span>
        <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginLeft: 'auto' }}>{label}</span>
      </div>
      <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55 }}>
        {comment.content}
      </div>
      {comment.resolved && (
        <div style={{ marginTop: 6, fontFamily: NU, fontSize: 9, color: '#34d399' }}>✓ Resolved</div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MagazineCollaboratePage({ token, onBack }) {
  const [state, setState]           = useState('loading'); // loading | invalid | revoked | valid
  const [collaborator, setCollab]   = useState(null);
  const [issue, setIssue]           = useState(null);
  const [pages, setPages]           = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [comments, setComments]     = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk]     = useState(false);
  const [toast, setToast]           = useState('');
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    if (!token) { setState('invalid'); return; }
    (async () => {
      // 1. Look up collaborator by token
      const { data: collab, error } = await supabase
        .from('magazine_collaborators')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !collab) { setState('invalid'); return; }
      if (collab.status === 'revoked') { setState('revoked'); return; }

      // 2. Mark active
      await supabase
        .from('magazine_collaborators')
        .update({ status: 'active', last_active: new Date().toISOString() })
        .eq('id', collab.id);

      setCollab({ ...collab, status: 'active' });

      // 3. Fetch issue
      const { data: issueData } = await fetchIssueById(collab.issue_id);
      if (!issueData) { setState('invalid'); return; }
      setIssue(issueData);

      // 4. Fetch pages
      const { data: pagesData } = await fetchPages(collab.issue_id);
      if (pagesData) setPages(pagesData.sort((a, b) => a.page_number - b.page_number));

      // 5. Fetch existing comments
      const { data: cData } = await supabase
        .from('magazine_page_comments')
        .select('*')
        .eq('issue_id', collab.issue_id)
        .order('created_at', { ascending: false });
      if (cData) setComments(cData);

      setState('valid');
    })();
  }, [token]);

  const currentPageObj = pages.find(p => p.page_number === currentPage);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !collaborator) return;
    setSubmitting(true);
    try {
      const { data: inserted } = await supabase
        .from('magazine_page_comments')
        .insert({
          issue_id:    collaborator.issue_id,
          page_number: currentPage,
          content:     newComment.trim(),
          author_name: collaborator.name || collaborator.email || 'Collaborator',
          author_email: collaborator.email || null,
        })
        .select()
        .single();
      if (inserted) {
        setComments(prev => [inserted, ...prev]);
        setNewComment('');
        setSubmitOk(true);
        showToast('Comment added');
        setTimeout(() => setSubmitOk(false), 2500);

        // Feature 9: email notification to editorial team (non-blocking)
        sendEmail({
          subject:    `New comment on "${issue?.title || 'issue'}" — Page ${currentPage}`,
          fromName:   'LWD Magazine Studio',
          fromEmail:  'editorial@luxuryweddingdirectory.com',
          html:       buildCommentNotificationEmail({
            authorName:  collaborator.name || collaborator.email || 'Collaborator',
            authorEmail: collaborator.email || null,
            issueName:   issue?.title || 'Issue',
            pageNumber:  currentPage,
            content:     inserted.content,
          }),
          recipients: [{ email: 'editorial@luxuryweddingdirectory.com', name: 'LWD Editorial' }],
          type:       'transactional',
        }).catch(err => console.warn('[MagazineCollaboratePage] comment notify failed:', err));
      }
    } catch (err) {
      console.error('[MagazineCollaboratePage] comment error:', err);
    }
    setSubmitting(false);
  };

  // ── Render states ─────────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div style={{ height: '100vh', background: '#0C0B09', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 32, opacity: 0.2, animation: 'spin 2s linear infinite' }}>◈</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Verifying access…
        </div>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div style={{ height: '100vh', background: '#0C0B09', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 36, opacity: 0.25 }}>◈</span>
        <div style={{ fontFamily: GD, fontSize: 28, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>Link expired or invalid</div>
        <div style={{ fontFamily: NU, fontSize: 13, color: MUTED, maxWidth: 340, lineHeight: 1.6 }}>
          This collaboration link could not be found or has already been used.
        </div>
        {onBack && (
          <button onClick={onBack} style={{ marginTop: 16, fontFamily: NU, fontSize: 11, color: GOLD, background: 'none', border: `1px solid ${GOLD}`, padding: '9px 24px', borderRadius: 2, cursor: 'pointer' }}>
            Back to Home
          </button>
        )}
      </div>
    );
  }

  if (state === 'revoked') {
    return (
      <div style={{ height: '100vh', background: '#0C0B09', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 36, opacity: 0.25 }}>◈</span>
        <div style={{ fontFamily: GD, fontSize: 28, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>Invitation revoked</div>
        <div style={{ fontFamily: NU, fontSize: 13, color: MUTED, maxWidth: 340, lineHeight: 1.6 }}>
          This invitation has been revoked by the issue owner.
        </div>
        {onBack && (
          <button onClick={onBack} style={{ marginTop: 16, fontFamily: NU, fontSize: 11, color: GOLD, background: 'none', border: `1px solid ${GOLD}`, padding: '9px 24px', borderRadius: 2, cursor: 'pointer' }}>
            Back to Home
          </button>
        )}
      </div>
    );
  }

  // state === 'valid'
  const isEditor = collaborator?.role === 'editor';
  const pageComments = comments.filter(c => c.page_number === currentPage);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0C0B09', display: 'flex', flexDirection: 'column', fontFamily: NU }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 400,
          background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)',
          color: GOLD, padding: '8px 20px', borderRadius: 20,
          fontFamily: NU, fontSize: 11, letterSpacing: '0.06em', pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}

      {/* Header bar */}
      <div style={{
        height: 52, flexShrink: 0, background: '#141210',
        borderBottom: `1px solid ${BORDER}`, display: 'flex',
        alignItems: 'center', padding: '0 20px', gap: 14,
      }}>
        <div style={{ fontFamily: GD, fontSize: 13, fontStyle: 'italic', color: GOLD, letterSpacing: '0.04em', flexShrink: 0 }}>LWD</div>
        <div style={{ width: 1, height: 20, background: BORDER, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: GD, fontSize: 16, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {issue?.title || 'Untitled Issue'}
          </div>
          <div style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>
            {[issue?.issue_number && `Issue ${issue.issue_number}`, issue?.season, issue?.year].filter(Boolean).join(' · ')}
          </div>
        </div>
        {collaborator && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              {collaborator.name || collaborator.email}
            </span>
            <RoleBadge role={collaborator.role} />
          </div>
        )}
        <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, padding: '3px 9px', borderRadius: 10, flexShrink: 0 }}>
          Read Only
        </span>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Page viewer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          {/* Page image area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
            {currentPageObj?.image_url ? (
              <img
                src={currentPageObj.image_url}
                alt={`Page ${currentPage}`}
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', boxShadow: '0 8px 48px rgba(0,0,0,0.6)', borderRadius: 2 }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32, opacity: 0.15 }}>◈</span>
                <span style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>Page {currentPage}</span>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {pages.length > 0 && (
            <div style={{
              height: 110, flexShrink: 0, borderTop: `1px solid ${BORDER}`,
              background: '#100F0D', display: 'flex', gap: 10,
              overflowX: 'auto', padding: '12px 16px', alignItems: 'flex-start',
            }}>
              {pages.map(p => (
                <PageThumb
                  key={p.page_number}
                  page={p}
                  isCurrent={p.page_number === currentPage}
                  onClick={() => setCurrentPage(p.page_number)}
                />
              ))}
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: `1px solid ${BORDER}`, color: '#fff', fontSize: 18, cursor: currentPage <= 1 ? 'default' : 'pointer', opacity: currentPage <= 1 ? 0.3 : 1 }}
            >‹</button>
          </div>
          <div style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)' }}>
            <button
              onClick={() => setCurrentPage(p => Math.min(pages.length, p + 1))}
              disabled={currentPage >= pages.length}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: `1px solid ${BORDER}`, color: '#fff', fontSize: 18, cursor: currentPage >= pages.length ? 'default' : 'pointer', opacity: currentPage >= pages.length ? 0.3 : 1 }}
            >›</button>
          </div>

          {/* Page counter */}
          <div style={{ position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', border: `1px solid ${BORDER}`, borderRadius: 20, padding: '5px 16px', fontFamily: NU, fontSize: 11, color: MUTED }}>
            {currentPage} / {pages.length}
          </div>
        </div>

        {/* Comment panel (only for editors) */}
        {isEditor && (
          <div style={{
            width: 320, flexShrink: 0, borderLeft: `1px solid ${BORDER}`,
            background: '#141210', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Panel header */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
                ◆ Page Comments
              </div>
              <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>Page {currentPage}</div>
            </div>

            {/* Submit new comment */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Leave a comment on this page…"
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${BORDER}`, borderRadius: 4,
                  color: '#fff', fontFamily: NU, fontSize: 12,
                  padding: '8px 10px', outline: 'none', resize: 'vertical',
                  lineHeight: 1.5,
                }}
              />
              {submitOk && (
                <div style={{ fontFamily: NU, fontSize: 10, color: '#34d399', marginTop: 5, fontWeight: 700 }}>✓ Comment added</div>
              )}
              <button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                style={{
                  marginTop: 8, width: '100%', padding: '9px 0',
                  borderRadius: 3, cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
                  background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.4)`,
                  color: GOLD, fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  opacity: submitting || !newComment.trim() ? 0.5 : 1,
                }}
              >
                {submitting ? '⋯ Submitting…' : '✎ Add Comment'}
              </button>
            </div>

            {/* Comments list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {pageComments.length === 0 ? (
                <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, textAlign: 'center', paddingTop: 24 }}>
                  No comments on this page yet.
                </div>
              ) : (
                pageComments.map(c => <CommentItem key={c.id} comment={c} />)
              )}
              {comments.length > 0 && pageComments.length === 0 && (
                <div style={{ marginTop: 16, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
                  <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                    All Comments
                  </div>
                  {comments.slice(0, 5).map(c => <CommentItem key={c.id} comment={c} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
