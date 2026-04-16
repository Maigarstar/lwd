// src/pages/PublicationStudio/PageCommentsPanel.jsx
// Sidebar panel for inline page notes/comments on a magazine issue page.

import { useState, useEffect, useCallback } from 'react';
import {
  fetchPageComments,
  addComment,
  resolveComment,
  deleteComment,
} from '../../services/magazineCommentsService';

const GOLD   = '#C9A96E';
const NU     = "var(--font-body, 'Nunito Sans', sans-serif)";
const BG     = '#1A1814';
const SURF   = '#2A2520';
const BORDER = '#3A3530';
const MUTED  = 'rgba(255,255,255,0.45)';

function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function CommentCard({ comment, onResolve, onDelete, onReplyClick, isReply }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        marginLeft: isReply ? 16 : 0,
        padding: '10px 12px',
        background: comment.resolved ? 'rgba(255,255,255,0.02)' : SURF,
        border: `1px solid ${comment.resolved ? 'rgba(255,255,255,0.06)' : BORDER}`,
        borderRadius: 4,
        opacity: comment.resolved ? 0.55 : 1,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{
          fontFamily: NU,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: comment.resolved ? MUTED : GOLD,
        }}>
          {comment.resolved ? '✓ ' : ''}{comment.author_name}
        </span>
        <span style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
          {fmtDate(comment.created_at)}
        </span>
      </div>
      <div style={{ fontFamily: NU, fontSize: 12, color: comment.resolved ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {comment.content}
      </div>
      {hov && !comment.resolved && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {!isReply && (
            <button
              onClick={() => onReplyClick(comment)}
              style={btnStyle}
            >
              Reply
            </button>
          )}
          <button
            onClick={() => onResolve(comment.id)}
            style={{ ...btnStyle, color: '#34d399' }}
          >
            ✓ Resolve
          </button>
          <button
            onClick={() => onDelete(comment.id)}
            style={{ ...btnStyle, color: '#f87171' }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  fontFamily: "var(--font-body, 'Nunito Sans', sans-serif)",
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.06em',
  background: 'none',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 2,
  color: 'rgba(255,255,255,0.5)',
  padding: '3px 8px',
  cursor: 'pointer',
};

export default function PageCommentsPanel({ issue, currentPageNumber, onClose }) {
  const [comments,    setComments]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [content,     setContent]     = useState('');
  const [authorName,  setAuthorName]  = useState('Admin');
  const [submitting,  setSubmitting]  = useState(false);
  const [replyTo,     setReplyTo]     = useState(null); // comment object

  const load = useCallback(async () => {
    if (!issue?.id || !currentPageNumber) return;
    setLoading(true);
    const { data } = await fetchPageComments(issue.id, currentPageNumber);
    setComments(data || []);
    setLoading(false);
  }, [issue?.id, currentPageNumber]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    const { data, error } = await addComment({
      issue_id:    issue.id,
      page_number: currentPageNumber,
      author_name: authorName.trim() || 'Admin',
      content:     trimmed,
      parent_id:   replyTo ? replyTo.id : null,
    });
    if (!error && data) {
      setComments(prev => [...prev, data]);
      setContent('');
      setReplyTo(null);
    }
    setSubmitting(false);
  };

  const handleResolve = async (id) => {
    const { error } = await resolveComment(id);
    if (!error) {
      setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c));
    }
  };

  const handleDelete = async (id) => {
    const { error } = await deleteComment(id);
    if (!error) {
      // Remove comment and any replies to it
      setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id));
    }
  };

  // Separate into top-level and replies
  const topLevel = comments.filter(c => !c.parent_id);
  const replies  = comments.filter(c => !!c.parent_id);

  // Sort: unresolved first, then resolved
  const sorted = [
    ...topLevel.filter(c => !c.resolved),
    ...topLevel.filter(c => c.resolved),
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 340,
      background: BG,
      borderLeft: `1px solid ${BORDER}`,
      zIndex: 350,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: NU,
    }}>
      {/* Header */}
      <div style={{
        height: 52,
        flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}>
        <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', flex: 1 }}>
          ✦ Page Notes — Page {currentPageNumber}
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}
        >
          ✕
        </button>
      </div>

      {/* Add Note form */}
      <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {replyTo && (
          <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Replying to {replyTo.author_name}</span>
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
          </div>
        )}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Add a note for this page…"
          rows={3}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER}`,
            borderRadius: 3,
            color: '#fff',
            fontFamily: NU,
            fontSize: 12,
            padding: '8px 10px',
            resize: 'vertical',
            outline: 'none',
            marginBottom: 8,
          }}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            placeholder="Author name"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${BORDER}`,
              borderRadius: 3,
              color: '#fff',
              fontFamily: NU,
              fontSize: 11,
              padding: '6px 8px',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            style={{
              fontFamily: NU,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: GOLD,
              border: 'none',
              borderRadius: 3,
              color: '#1a1806',
              padding: '7px 14px',
              cursor: !content.trim() || submitting ? 'default' : 'pointer',
              opacity: !content.trim() || submitting ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {submitting ? '…' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && (
          <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, textAlign: 'center', paddingTop: 24 }}>Loading…</div>
        )}
        {!loading && sorted.length === 0 && (
          <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, textAlign: 'center', paddingTop: 32 }}>
            No notes yet for this page.
          </div>
        )}
        {!loading && sorted.map(comment => (
          <div key={comment.id}>
            <CommentCard
              comment={comment}
              onResolve={handleResolve}
              onDelete={handleDelete}
              onReplyClick={setReplyTo}
              isReply={false}
            />
            {/* Replies */}
            {replies
              .filter(r => r.parent_id === comment.id)
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
              .map(reply => (
                <div key={reply.id} style={{ marginTop: 4 }}>
                  <CommentCard
                    comment={reply}
                    onResolve={handleResolve}
                    onDelete={handleDelete}
                    onReplyClick={() => {}}
                    isReply
                  />
                </div>
              ))
            }
          </div>
        ))}
      </div>
    </div>
  );
}
