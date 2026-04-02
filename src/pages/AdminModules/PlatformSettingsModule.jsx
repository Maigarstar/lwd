import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CATEGORY_LABELS = {
  email:    'Email Service',
  webhook:  'Webhooks',
  pipeline: 'Pipeline Defaults',
  general:  'General',
};

export default function PlatformSettingsModule({ C }) {
  const [settings, setSettings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState({});
  const [revealed, setRevealed] = useState({});
  const [edited,   setEdited]   = useState({});
  const [toast,    setToast]    = useState(null);
  const [copied,   setCopied]   = useState({});

  const G = C?.gold || '#8f7420';

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
  const SUPABASE_REF = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '').split('.')[0] || 'your-project-ref';

  const WEBHOOK_ENDPOINTS = [
    {
      label:       'Reply Webhook (Resend inbound)',
      description: 'Paste into Resend Dashboard under Webhooks - email.replied',
      url:         `${SUPABASE_URL}/functions/v1/handle-reply-webhook`,
    },
    {
      label:       'Bounce Webhook (Resend)',
      description: 'Paste into Resend Dashboard under Webhooks - email.bounced + email.complained',
      url:         `${SUPABASE_URL}/functions/v1/handle-bounce-webhook`,
    },
    {
      label:       'Unsubscribe Endpoint',
      description: 'Appended automatically to campaign footers - no action needed',
      url:         `${SUPABASE_URL}/functions/v1/handle-unsubscribe?e=<base64(email)>`,
    },
    {
      label:       'Open Tracking Pixel',
      description: 'Injected automatically into campaign emails - no action needed',
      url:         `${SUPABASE_URL}/functions/v1/track-email-open?id=<email_id>`,
    },
  ];

  const copyToClipboard = useCallback((url, key) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 1800);
    });
  }, []);

  // Keep localStorage in sync so pipeline email send can read fromEmail/fromName
  function syncEmailLocals(vals) {
    if (vals.from_email) localStorage.setItem('emailFromAddress', vals.from_email);
    if (vals.from_name)  localStorage.setItem('emailFromName',    vals.from_name);
  }

  useEffect(() => {
    setLoading(true);
    supabase.from('platform_settings').select('*').order('category').order('key')
      .then(({ data }) => {
        setSettings(data || []);
        const vals = {};
        (data || []).forEach(s => { vals[s.key] = s.value; });
        setEdited(vals);
        syncEmailLocals(vals);
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveSetting(key) {
    setSaving(p => ({ ...p, [key]: true }));
    try {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: edited[key] || '', updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value: edited[key] || '' } : s));
      // Keep localStorage in sync for pipeline email sends
      syncEmailLocals({ [key]: edited[key] || '' });
      setToast({ msg: 'Saved', type: 'success' });
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setToast({ msg: 'Save failed: ' + e.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(p => ({ ...p, [key]: false }));
    }
  }

  const grouped = settings.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  if (loading) return <div style={{ padding: 32, color: C?.grey || '#888', fontSize: 14 }}>Loading settings...</div>;

  return (
    <div style={{ padding: 28, maxWidth: 720, fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, padding: '10px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500, zIndex: 9999, background: toast.type === 'success' ? '#dcfce7' : '#fee2e2', color: toast.type === 'success' ? '#166534' : '#991b1b', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
          {toast.msg}
        </div>
      )}

      <h2 style={{ fontSize: 20, fontWeight: 600, fontFamily: 'Cormorant Garamond, Georgia, serif', color: C?.white || '#171717', marginBottom: 6 }}>Platform Settings</h2>
      <p style={{ fontSize: 13, color: C?.grey || '#888', marginBottom: 28 }}>Configure third-party integrations and pipeline defaults. Secret values are masked.</p>

      {Object.entries(CATEGORY_LABELS).map(([cat, catLabel]) => {
        const rows = grouped[cat] || [];
        if (!rows.length) return null;
        return (
          <div key={cat} style={{ background: C?.card || '#fff', border: `1px solid ${C?.border || '#ede8de'}`, borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: C?.dark || '#fafaf8', borderBottom: `1px solid ${C?.border || '#ede8de'}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: G }}>{catLabel}</span>
            </div>
            {rows.map((s, i) => {
              const isSecret = s.is_secret;
              const show = revealed[s.key];
              const val = edited[s.key] ?? s.value;
              const changed = val !== s.value;
              return (
                <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 12, alignItems: 'center', padding: '14px 18px', borderBottom: i < rows.length - 1 ? `1px solid ${C?.border || '#ede8de'}` : 'none' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C?.white || '#171717' }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: C?.grey2 || '#aaa', marginTop: 2, fontFamily: 'monospace' }}>{s.key}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type={isSecret && !show ? 'password' : 'text'}
                      value={val}
                      onChange={e => setEdited(p => ({ ...p, [s.key]: e.target.value }))}
                      placeholder={isSecret ? 'Enter secret value...' : 'Enter value...'}
                      style={{ flex: 1, padding: '8px 10px', border: `1px solid ${changed ? G : (C?.border || '#ddd')}`, borderRadius: 5, fontSize: 12, background: C?.dark || '#fafaf8', color: C?.white || '#171717', outline: 'none', fontFamily: isSecret && !show ? 'monospace' : 'Inter, sans-serif' }}
                    />
                    {isSecret && (
                      <button onClick={() => setRevealed(p => ({ ...p, [s.key]: !p[s.key] }))} style={{ padding: '6px 10px', background: 'transparent', border: `1px solid ${C?.border || '#ddd'}`, borderRadius: 5, fontSize: 11, cursor: 'pointer', color: C?.grey || '#888', whiteSpace: 'nowrap' }}>
                        {show ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => saveSetting(s.key)}
                    disabled={saving[s.key] || !changed}
                    style={{ padding: '7px 16px', background: changed ? G : 'transparent', color: changed ? '#fff' : (C?.grey2 || '#aaa'), border: `1px solid ${changed ? G : (C?.border || '#ddd')}`, borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: changed ? 'pointer' : 'default', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                  >
                    {saving[s.key] ? 'Saving...' : 'Save'}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ── Email Suppression List ── */}
      <SuppressionPanel C={C} G={G} supabase={supabase} />

      {/* ── Webhook Endpoints (read-only reference) ── */}
      <div style={{ background: C?.card || '#fff', border: `1px solid ${C?.border || '#ede8de'}`, borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', background: C?.dark || '#fafaf8', borderBottom: `1px solid ${C?.border || '#ede8de'}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: G }}>Webhook Endpoints</span>
        </div>
        <div style={{ padding: '8px 0' }}>
          {WEBHOOK_ENDPOINTS.map((ep, i) => (
            <div key={ep.label} style={{ padding: '12px 18px', borderBottom: i < WEBHOOK_ENDPOINTS.length - 1 ? `1px solid ${C?.border || '#ede8de'}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C?.white || '#171717' }}>{ep.label}</div>
                <button
                  onClick={() => copyToClipboard(ep.url, ep.label)}
                  style={{ padding: '4px 12px', background: copied[ep.label] ? '#dcfce7' : 'transparent', color: copied[ep.label] ? '#166534' : G, border: `1px solid ${copied[ep.label] ? '#86efac' : G}`, borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.15s', flexShrink: 0 }}
                >
                  {copied[ep.label] ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{ fontSize: 10, color: C?.grey2 || '#aaa', marginBottom: 6 }}>{ep.description}</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: C?.grey || '#666', background: C?.dark || '#fafaf8', padding: '6px 10px', borderRadius: 4, border: `1px solid ${C?.border || '#ede8de'}`, wordBreak: 'break-all', lineHeight: 1.5 }}>
                {ep.url}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 18px', borderTop: `1px solid ${C?.border || '#ede8de'}`, background: C?.dark || '#fafaf8' }}>
          <div style={{ fontSize: 11, color: C?.grey2 || '#aaa' }}>
            Supabase project ref: <span style={{ fontFamily: 'monospace', color: C?.grey || '#666' }}>{SUPABASE_REF}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Suppression Panel ──────────────────────────────────────────────────────────

function SuppressionPanel({ C, G, supabase }) {
  const [list,        setList]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [addEmail,    setAddEmail]    = useState('');
  const [addReason,   setAddReason]   = useState('manual');
  const [adding,      setAdding]      = useState(false);
  const [removing,    setRemoving]    = useState({});
  const [search,      setSearch]      = useState('');
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('email_suppressions')
      .select('id, email, reason, source, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    setList(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    const email = addEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    setAdding(true);
    const { error } = await supabase
      .from('email_suppressions')
      .upsert({ email, reason: addReason, source: 'admin_manual' }, { onConflict: 'email' });
    setAdding(false);
    if (error) { showToast('Failed: ' + error.message, 'error'); return; }
    setAddEmail('');
    showToast(`${email} suppressed`);
    load();
  }

  async function handleRemove(id, email) {
    setRemoving(p => ({ ...p, [id]: true }));
    const { error } = await supabase.from('email_suppressions').delete().eq('id', id);
    setRemoving(p => ({ ...p, [id]: false }));
    if (error) { showToast('Remove failed', 'error'); return; }
    setList(prev => prev.filter(r => r.id !== id));
    showToast(`${email} removed from suppression list`);
  }

  const filtered = list.filter(r =>
    !search || r.email.includes(search.toLowerCase()) || (r.reason || '').includes(search.toLowerCase())
  );

  const REASON_LABELS = { bounce: 'Bounce', complaint: 'Complaint', unsubscribe: 'Unsubscribed', manual: 'Manual', admin_manual: 'Manual' };
  const REASON_COLORS = { bounce: '#ef4444', complaint: '#f97316', unsubscribe: '#6366f1', manual: '#888', admin_manual: '#888' };

  const inS = { padding: '8px 10px', border: `1px solid ${C?.border || '#ddd'}`, borderRadius: 5, fontSize: 12, background: C?.dark || '#fafaf8', color: C?.white || '#171717', outline: 'none', fontFamily: 'Inter, sans-serif' };

  return (
    <div style={{ background: C?.card || '#fff', border: `1px solid ${C?.border || '#ede8de'}`, borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, padding: '10px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500, zIndex: 9999, background: toast.type === 'success' ? '#dcfce7' : '#fee2e2', color: toast.type === 'success' ? '#166534' : '#991b1b', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '12px 18px', background: C?.dark || '#fafaf8', borderBottom: `1px solid ${C?.border || '#ede8de'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: G }}>Email Suppression</span>
          <span style={{ marginLeft: 10, fontSize: 11, color: C?.grey2 || '#aaa' }}>{list.length} suppressed</span>
        </div>
        <button onClick={load} style={{ padding: '4px 12px', background: 'transparent', border: `1px solid ${C?.border || '#ddd'}`, borderRadius: 4, fontSize: 11, color: C?.grey || '#888', cursor: 'pointer' }}>Refresh</button>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, padding: '12px 18px', borderBottom: `1px solid ${C?.border || '#ede8de'}`, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={addEmail}
          onChange={e => setAddEmail(e.target.value)}
          placeholder="email@example.com"
          type="email"
          style={{ ...inS, flex: '1 1 200px', minWidth: 180 }}
        />
        <select value={addReason} onChange={e => setAddReason(e.target.value)} style={{ ...inS, flexShrink: 0 }}>
          <option value="manual">Manual</option>
          <option value="bounce">Bounce</option>
          <option value="complaint">Complaint</option>
          <option value="unsubscribe">Unsubscribed</option>
        </select>
        <button type="submit" disabled={adding || !addEmail.trim()} style={{ padding: '8px 16px', background: addEmail.trim() ? G : 'transparent', color: addEmail.trim() ? '#fff' : (C?.grey2 || '#aaa'), border: `1px solid ${addEmail.trim() ? G : (C?.border || '#ddd')}`, borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: addEmail.trim() ? 'pointer' : 'default', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
          {adding ? 'Adding...' : '+ Suppress'}
        </button>
      </form>

      {/* Search */}
      {list.length > 5 && (
        <div style={{ padding: '8px 18px', borderBottom: `1px solid ${C?.border || '#ede8de'}` }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search emails..." style={{ ...inS, width: '100%', boxSizing: 'border-box' }} />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ padding: '24px 18px', color: C?.grey || '#888', fontSize: 13 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '24px 18px', color: C?.grey2 || '#aaa', fontSize: 13 }}>{search ? 'No matches.' : 'No suppressed emails.'}</div>
      ) : (
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.map((row, i) => {
            const reasonColor = REASON_COLORS[row.reason] || '#888';
            const reasonLabel = REASON_LABELS[row.reason] || row.reason || '—';
            return (
              <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderBottom: i < filtered.length - 1 ? `1px solid ${C?.border || '#ede8de'}` : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C?.white || '#171717', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.email}</div>
                  <div style={{ fontSize: 10, color: C?.grey2 || '#aaa', marginTop: 1 }}>
                    {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {row.source && row.source !== 'admin_manual' && <span style={{ marginLeft: 6 }}>via {row.source}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: reasonColor + '18', color: reasonColor, border: `1px solid ${reasonColor}30`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {reasonLabel}
                </span>
                <button
                  onClick={() => handleRemove(row.id, row.email)}
                  disabled={removing[row.id]}
                  style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${C?.border || '#ddd'}`, borderRadius: 4, fontSize: 11, color: C?.grey || '#888', cursor: 'pointer', flexShrink: 0 }}
                >
                  {removing[row.id] ? '...' : 'Remove'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
