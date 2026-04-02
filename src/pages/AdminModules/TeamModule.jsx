import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ROLES    = ['admin', 'outreach', 'viewer'];
const STATUSES = ['active', 'invited', 'removed'];
const ROLE_COLORS   = { admin: '#8f7420', outreach: '#3b82f6', viewer: '#6b7280' };
const STATUS_COLORS = { active: '#22c55e', invited: '#f59e0b', removed: '#ef4444' };

function badge(label, color) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 100, background: color + '22', color, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em' }}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}

export default function TeamModule({ C }) {
  const [members,    setMembers]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [showModal,  setShowModal] = useState(false);
  const [editMember, setEditMember]= useState(null);
  const [toast,      setToast]     = useState(null);

  const G = C?.gold || '#8f7420';

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('team_members').select('*').order('created_at', { ascending: true });
    setMembers(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(form) {
    try {
      if (form.id) {
        const { error } = await supabase.from('team_members').update({ name: form.name, email: form.email, role: form.role, status: form.status, notes: form.notes, updated_at: new Date().toISOString() }).eq('id', form.id);
        if (error) throw error;
        showToast('Member updated');
      } else {
        const { error } = await supabase.from('team_members').insert([{ name: form.name, email: form.email, role: form.role, status: form.status, notes: form.notes }]);
        if (error) throw error;
        showToast('Member added');
      }
      setShowModal(false);
      setEditMember(null);
      load();
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  }

  async function handleRemove(id) {
    await supabase.from('team_members').update({ status: 'removed', updated_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  const th = { padding: '10px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: C?.grey || '#888', textAlign: 'left', borderBottom: `2px solid ${C?.border || '#ede8de'}`, textTransform: 'uppercase', background: C?.dark || '#fafaf8' };
  const td = { padding: '12px 14px', fontSize: 13, borderBottom: `1px solid ${C?.border || '#f3f0ea'}`, verticalAlign: 'middle', color: C?.white || '#333' };

  return (
    <div style={{ padding: 28, fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, padding: '10px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500, zIndex: 9999, background: toast.type === 'success' ? '#dcfce7' : '#fee2e2', color: toast.type === 'success' ? '#166534' : '#991b1b', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, fontFamily: 'Cormorant Garamond, Georgia, serif', color: C?.white || '#171717', margin: 0, marginBottom: 4 }}>Team Seats</h2>
          <p style={{ fontSize: 13, color: C?.grey || '#888', margin: 0 }}>{members.filter(m => m.status !== 'removed').length} active seats</p>
        </div>
        <button style={{ marginLeft: 'auto', padding: '8px 20px', background: G, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' }} onClick={() => { setEditMember(null); setShowModal(true); }}>
          + Add Member
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, color: C?.grey || '#888', fontSize: 14 }}>Loading...</div>
      ) : (
        <div style={{ background: C?.card || '#fff', border: `1px solid ${C?.border || '#ede8de'}`, borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Status</th>
                <th style={th}>Invited</th>
                <th style={th}>Last Seen</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} style={{ opacity: m.status === 'removed' ? 0.5 : 1 }}>
                  <td style={td}><strong>{m.name}</strong>{m.notes ? <div style={{ fontSize: 11, color: C?.grey || '#888', marginTop: 2 }}>{m.notes}</div> : null}</td>
                  <td style={td}>{m.email}</td>
                  <td style={td}>{badge(m.role, ROLE_COLORS[m.role] || '#888')}</td>
                  <td style={td}>{badge(m.status, STATUS_COLORS[m.status] || '#888')}</td>
                  <td style={{ ...td, fontSize: 12, color: C?.grey || '#888' }}>{m.invited_at ? new Date(m.invited_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '--'}</td>
                  <td style={{ ...td, fontSize: 12, color: C?.grey || '#888' }}>{m.last_seen_at ? new Date(m.last_seen_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : 'Never'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${C?.border || '#ddd'}`, borderRadius: 4, fontSize: 11, cursor: 'pointer', color: C?.grey || '#666' }} onClick={() => { setEditMember(m); setShowModal(true); }}>Edit</button>
                      {m.status !== 'removed' && <button style={{ padding: '4px 10px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 4, fontSize: 11, cursor: 'pointer', color: '#dc2626' }} onClick={() => handleRemove(m.id)}>Remove</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: C?.grey || '#aaa', padding: '32px 0' }}>No team members yet. Add your first member above.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <MemberModal member={editMember} C={C} G={G} onSave={handleSave} onClose={() => { setShowModal(false); setEditMember(null); }} />}
    </div>
  );
}

function MemberModal({ member, C, G, onSave, onClose }) {
  const [form, setForm] = useState({
    id: member?.id || null,
    name: member?.name || '',
    email: member?.email || '',
    role: member?.role || 'outreach',
    status: member?.status || 'invited',
    notes: member?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  function f(k, v) { setForm(p => ({ ...p, [k]: v })); }
  async function submit() {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }
  const inp = { padding: '9px 12px', border: `1px solid ${C?.border || '#ddd'}`, borderRadius: 6, fontSize: 13, color: C?.white || '#171717', background: C?.dark || '#fafaf8', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: C?.grey || '#888', textTransform: 'uppercase', marginBottom: 5, display: 'block' };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C?.card || '#fff', borderRadius: 10, padding: 28, width: '90vw', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: `1px solid ${C?.border || '#ede8de'}` }}>
        <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'Cormorant Garamond, Georgia, serif', color: C?.white || '#171717', marginBottom: 20 }}>{form.id ? 'Edit Member' : 'Add Team Member'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={lbl}>Name</label><input style={inp} value={form.name} onChange={e => f('name', e.target.value)} placeholder="Full name" /></div>
          <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="email@example.com" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Role</label>
            <select style={inp} value={form.role} onChange={e => f('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select style={inp} value={form.status} onChange={e => f('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Notes</label>
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical', fontFamily: 'Inter, sans-serif' }} value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Optional notes..." />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={{ padding: '8px 18px', background: 'transparent', border: `1px solid ${C?.border || '#ddd'}`, borderRadius: 6, fontSize: 13, cursor: 'pointer', color: C?.grey || '#666' }} onClick={onClose}>Cancel</button>
          <button style={{ padding: '8px 20px', background: G, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }} onClick={submit} disabled={saving}>{saving ? 'Saving...' : (form.id ? 'Update' : 'Add Member')}</button>
        </div>
      </div>
    </div>
  );
}
