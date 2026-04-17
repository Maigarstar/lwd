// ─── CollaboratorPanel.jsx ────────────────────────────────────────────────────
// 420px slide-in panel for inviting editors/copywriters to an issue.
// Handles invite emails, collaborator list, and page comments.

import { useState, useEffect } from 'react';
import { GOLD, DARK, CARD, BORDER, MUTED, NU, GD } from './PageDesigner/designerConstants';
import { sendEmail } from '../../services/emailSendService';
import { supabase }  from '../../lib/supabaseClient';

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${BORDER}`,
  borderRadius: 4,
  color: '#fff',
  fontFamily: NU,
  fontSize: 12,
  padding: '8px 10px',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontFamily: NU,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: MUTED,
  marginBottom: 6,
  marginTop: 14,
};

const ROLES = [
  { key: 'editor', label: 'Editor — can view and comment' },
  { key: 'viewer', label: 'Viewer — read-only access' },
];

const STATUS_CFG = {
  invited: { label: 'Invited',  color: GOLD,              bg: 'rgba(201,168,76,0.1)',  border: 'rgba(201,168,76,0.3)' },
  active:  { label: 'Active',   color: '#34d399',         bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)' },
  revoked: { label: 'Revoked',  color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
};

function StatusPill({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.invited;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 10,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
    }}>{c.label}</span>
  );
}

function RolePill({ role }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 10,
      background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.12)`,
      color: 'rgba(255,255,255,0.55)',
      fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
    }}>{role}</span>
  );
}

function buildInviteEmail({ name, issueName, role, token }) {
  const displayName  = name      || 'there';
  const displayIssue = issueName || 'a magazine issue';
  const roleDesc     = role === 'editor'
    ? 'You have been invited as an <strong>Editor</strong> — you can view the issue and leave page comments.'
    : 'You have been invited as a <strong>Viewer</strong> — you can read the full issue.';
  const link = `https://luxuryweddingdirectory.com/magazine/collaborate/${token}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0908;font-family:sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="border-top:3px solid #C9A84C;padding-top:32px;margin-bottom:32px;">
      <p style="font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#C9A84C;text-transform:uppercase;margin:0 0 12px;">
        Luxury Wedding Directory — Collaboration Invite
      </p>
      <h1 style="font-family:Georgia,serif;font-size:26px;font-style:italic;font-weight:400;color:#F0EBE0;margin:0 0 8px;line-height:1.3;">
        You've been invited to collaborate.
      </h1>
    </div>

    <p style="font-size:15px;color:rgba(240,235,224,0.8);line-height:1.7;margin:0 0 20px;">
      Dear ${displayName},
    </p>
    <p style="font-size:15px;color:rgba(240,235,224,0.8);line-height:1.7;margin:0 0 20px;">
      You've been invited to collaborate on <em>${displayIssue}</em>.
    </p>
    <p style="font-size:14px;color:rgba(240,235,224,0.65);line-height:1.7;margin:0 0 28px;">
      ${roleDesc}
    </p>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="${link}" style="display:inline-block;padding:13px 32px;background:#C9A84C;color:#0A0908;font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;border-radius:2px;">
        Open Issue ✦
      </a>
    </div>

    <p style="font-size:11px;color:rgba(240,235,224,0.35);line-height:1.6;margin:0;">
      If you weren't expecting this invitation, you can safely ignore this email.
    </p>

    <div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:40px;padding-top:20px;text-align:center;">
      <span style="font-size:10px;color:rgba(255,255,255,0.3);font-family:sans-serif;">
        © ${new Date().getFullYear()} Luxury Wedding Directory
      </span>
    </div>
  </div>
</body>
</html>`;
}

export default function CollaboratorPanel({ issueId, issueName, onClose }) {
  // Invite form state
  const [email,   setEmail]   = useState('');
  const [name,    setName]    = useState('');
  const [role,    setRole]    = useState('editor');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const [sendOk,  setSendOk]  = useState(false);

  // Data state
  const [collaborators, setCollaborators] = useState([]);
  const [comments,      setComments]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [revoking,      setRevoking]      = useState(null);

  // Fetch collaborators + comments on mount
  useEffect(() => {
    if (!issueId) return;
    async function load() {
      setLoading(true);
      const [collabRes, commentRes] = await Promise.all([
        supabase.from('magazine_collaborators').select('*').eq('issue_id', issueId).order('invited_at', { ascending: false }),
        supabase.from('magazine_page_comments').select('*').eq('issue_id', issueId).order('created_at', { ascending: false }),
      ]);
      if (collabRes.data)  setCollaborators(collabRes.data);
      if (commentRes.data) setComments(commentRes.data);
      setLoading(false);
    }
    load();
  }, [issueId]);

  async function handleSendInvite() {
    if (!email.trim()) return;
    setSending(true); setSendErr(''); setSendOk(false);
    try {
      // Insert collaborator row
      const { data: row, error: dbErr } = await supabase
        .from('magazine_collaborators')
        .insert({
          issue_id: issueId,
          email: email.trim(),
          name: name.trim() || null,
          role,
          message: message.trim() || null,
          status: 'invited',
        })
        .select()
        .single();
      if (dbErr) throw dbErr;

      // Send invite email
      const html = buildInviteEmail({
        name: name.trim(),
        issueName,
        role,
        token: row.token,
      });
      await sendEmail({
        subject:    `You've been invited to collaborate on ${issueName || 'a magazine issue'} — LWD`,
        fromName:   'Luxury Wedding Directory',
        fromEmail:  'editorial@luxuryweddingdirectory.com',
        html,
        recipients: [{ email: email.trim(), name: name.trim() || undefined }],
        type:       'campaign',
      });

      setCollaborators(prev => [row, ...prev]);
      setEmail(''); setName(''); setRole('editor'); setMessage('');
      setSendOk(true);
      setTimeout(() => setSendOk(false), 3000);
    } catch (err) {
      console.error('[CollaboratorPanel] Invite failed:', err);
      setSendErr(err.message || 'Failed to send invite');
    }
    setSending(false);
  }

  async function handleRevoke(collabId) {
    setRevoking(collabId);
    try {
      await supabase.from('magazine_collaborators').update({ status: 'revoked' }).eq('id', collabId);
      setCollaborators(prev => prev.map(c => c.id === collabId ? { ...c, status: 'revoked' } : c));
    } catch (err) {
      console.error('[CollaboratorPanel] Revoke failed:', err);
    }
    setRevoking(null);
  }

  async function handleToggleResolved(commentId, current) {
    try {
      await supabase.from('magazine_page_comments').update({ resolved: !current }).eq('id', commentId);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: !current } : c));
    } catch (err) {
      console.error('[CollaboratorPanel] Toggle resolved failed:', err);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <style>{`@keyframes cpSlideIn { from { transform: translateX(40px); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>

      <div
        style={{
          width: 420,
          background: '#141210',
          borderLeft: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column',
          height: '100%',
          animation: 'cpSlideIn 0.22s ease',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 18px 14px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
              ◆ Collaboration
            </div>
            <div style={{ fontFamily: GD, fontSize: 16, fontStyle: 'italic', color: '#fff' }}>
              Collaborate
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '0 18px 24px', overflowY: 'auto' }}>

          {/* ── Invite Form ── */}
          <div style={{ paddingTop: 18 }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              ✦ Invite Collaborator
            </div>

            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="editor@example.com"
              style={inputStyle}
            />

            <label style={labelStyle}>Name (optional)</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Sarah Mitchell"
              style={inputStyle}
            />

            <label style={labelStyle}>Role</label>
            <select
              value={role} onChange={e => setRole(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {ROLES.map(r => (
                <option key={r.key} value={r.key} style={{ background: '#1a1a18' }}>{r.label}</option>
              ))}
            </select>

            <label style={labelStyle}>Personal Message (optional)</label>
            <textarea
              value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Add a personal note to the invitation…"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 56, lineHeight: 1.5 }}
            />

            {sendErr && (
              <div style={{ marginTop: 8, fontFamily: NU, fontSize: 10, color: '#f87171' }}>
                ✕ {sendErr}
              </div>
            )}
            {sendOk && (
              <div style={{ marginTop: 8, fontFamily: NU, fontSize: 10, color: '#34d399', fontWeight: 700 }}>
                ✓ Invitation sent
              </div>
            )}

            <button
              onClick={handleSendInvite}
              disabled={sending || !email.trim()}
              style={{
                marginTop: 14, width: '100%', padding: '10px 0', borderRadius: 3,
                cursor: sending || !email.trim() ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.08))',
                border: `1px solid rgba(201,168,76,0.45)`,
                color: GOLD, fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                opacity: sending || !email.trim() ? 0.55 : 1,
                transition: 'all 0.15s',
              }}
            >
              {sending ? '⋯ Sending…' : '✉ Send Invite'}
            </button>
          </div>

          {/* ── Collaborator List ── */}
          <div style={{ marginTop: 28, borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              ◈ Collaborators
            </div>

            {loading ? (
              <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>Loading…</div>
            ) : collaborators.length === 0 ? (
              <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>No collaborators yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {collaborators.map(c => (
                  <div key={c.id} style={{
                    padding: '10px 12px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${c.status === 'revoked' ? 'rgba(255,255,255,0.06)' : BORDER}`,
                    opacity: c.status === 'revoked' ? 0.5 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div>
                        {c.name && (
                          <div style={{ fontFamily: NU, fontSize: 11, color: '#fff', marginBottom: 2 }}>{c.name}</div>
                        )}
                        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>{c.email}</div>
                      </div>
                      {c.status !== 'revoked' && (
                        <button
                          onClick={() => handleRevoke(c.id)}
                          disabled={revoking === c.id}
                          style={{
                            fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                            padding: '3px 8px', borderRadius: 2, cursor: 'pointer',
                            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
                            color: '#f87171', opacity: revoking === c.id ? 0.5 : 1,
                          }}
                        >
                          {revoking === c.id ? '…' : 'Revoke'}
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <RolePill role={c.role} />
                      <StatusPill status={c.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Page Comments ── */}
          <div style={{ marginTop: 28, borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              ✎ Page Comments
            </div>

            {loading ? (
              <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>Loading…</div>
            ) : comments.length === 0 ? (
              <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>No comments yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {comments.map(cm => (
                  <div key={cm.id} style={{
                    padding: '10px 12px', borderRadius: 4,
                    background: cm.resolved ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${cm.resolved ? 'rgba(255,255,255,0.06)' : BORDER}`,
                    opacity: cm.resolved ? 0.55 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {/* Page badge */}
                      <span style={{
                        fontFamily: NU, fontSize: 8, fontWeight: 700,
                        background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.25)`,
                        color: GOLD, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.06em',
                      }}>
                        P{cm.page_number}
                      </span>
                      <span style={{ fontFamily: NU, fontSize: 10, color: cm.resolved ? MUTED : '#fff', flex: 1 }}>
                        {cm.author_name || cm.author_email}
                      </span>
                      {/* Resolved toggle */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!cm.resolved}
                          onChange={() => handleToggleResolved(cm.id, cm.resolved)}
                          style={{ accentColor: GOLD, cursor: 'pointer' }}
                        />
                        <span style={{ fontFamily: NU, fontSize: 8, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          {cm.resolved ? 'Resolved' : 'Resolve'}
                        </span>
                      </label>
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 11, color: cm.resolved ? MUTED : 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                      {cm.content}
                    </div>
                    {cm.created_at && (
                      <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 6 }}>
                        {new Date(cm.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
