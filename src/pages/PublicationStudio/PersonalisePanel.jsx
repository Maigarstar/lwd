// ─── PersonalisePanel.jsx ─────────────────────────────────────────────────────
// 420px slide-in panel to personalise a published issue for a couple.
// Generates a unique shareable URL with their names on the cover.

import { useState, useEffect, useCallback } from 'react';
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

function buildCoupleEmail({ partner1, partner2, issueName, url }) {
  const names = partner1 && partner2 ? `${partner1} & ${partner2}` : partner1 || partner2 || 'you';
  const displayIssue = issueName || 'your wedding editorial';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0908;font-family:sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="border-top:3px solid #C9A84C;padding-top:32px;margin-bottom:32px;">
      <p style="font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;color:#C9A84C;text-transform:uppercase;margin:0 0 12px;">
        Luxury Wedding Directory — Personal Edition
      </p>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-style:italic;font-weight:400;color:#F0EBE0;margin:0 0 8px;line-height:1.25;">
        Your wedding editorial is ready.
      </h1>
    </div>

    <p style="font-size:24px;font-family:Georgia,serif;font-style:italic;color:#C9A84C;text-align:center;margin:0 0 28px;line-height:1.3;">
      ${names}
    </p>

    <p style="font-size:15px;color:rgba(240,235,224,0.8);line-height:1.7;margin:0 0 24px;text-align:center;">
      We've created a personal edition of <em>${displayIssue}</em> just for you. Your names are on the cover.
    </p>

    <div style="text-align:center;margin-bottom:36px;">
      <a href="${url}" style="display:inline-block;padding:14px 36px;background:#C9A84C;color:#0A0908;font-family:sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;border-radius:2px;">
        Open Your Edition ✦
      </a>
    </div>

    <p style="font-size:12px;color:rgba(240,235,224,0.35);line-height:1.7;margin:0;text-align:center;">
      You can share this link freely — it's yours to keep.
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

export default function PersonalisePanel({ issueId, issueSlug, issueName, onClose }) {
  // Form state
  const [partner1,    setPartner1]    = useState('');
  const [partner2,    setPartner2]    = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [venueName,   setVenueName]   = useState('');
  const [coupleEmail, setCoupleEmail] = useState('');

  const [creating,  setCreating]  = useState(false);
  const [createErr, setCreateErr] = useState('');

  // Created result
  const [createdSlug, setCreatedSlug] = useState('');
  const [createdUrl,  setCreatedUrl]  = useState('');
  const [copied,      setCopied]      = useState(false);
  const [emailSent,   setEmailSent]   = useState(false);
  const [emailErr,    setEmailErr]    = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Previous personalisations
  const [previous, setPrevious] = useState([]);
  const [loadingPrev, setLoadingPrev] = useState(true);

  // Bulk import tab
  const [activeTab,     setActiveTab]     = useState('single'); // 'single' | 'bulk'
  const [csvRows,       setCsvRows]       = useState([]);
  const [csvError,      setCsvError]      = useState('');
  const [bulkProgress,  setBulkProgress]  = useState(null); // { done, total } | null
  const [bulkResults,   setBulkResults]   = useState([]);
  const [bulkSendAll,   setBulkSendAll]   = useState(false);

  useEffect(() => {
    if (!issueId) return;
    supabase
      .from('magazine_personalised_issues')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setPrevious(data);
        setLoadingPrev(false);
      });
  }, [issueId]);

  function buildSlug() {
    const base  = issueSlug || 'issue';
    const p1    = (partner1 || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const p2    = (partner2 || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const parts = [p1, p2].filter(Boolean);
    if (parts.length === 0) return `${base}-for-couple-${Date.now()}`;
    return `${base}-for-${parts.join('-and-')}`;
  }

  function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,'').toLowerCase());
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''));
      return Object.fromEntries(headers.map((h,i) => [h, vals[i]||'']));
    }).filter(r => r.partner1_name || r.partner2_name);
  }

  function handleCsvFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(''); setCsvRows([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result || '');
        if (rows.length === 0) { setCsvError('No valid rows found. Expected headers: partner1_name, partner2_name, wedding_date, venue_name, email'); return; }
        setCsvRows(rows);
      } catch(err) {
        setCsvError('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  async function handleBulkCreate() {
    if (csvRows.length === 0) return;
    setBulkProgress({ done: 0, total: csvRows.length });
    setBulkResults([]);
    const results = [];
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      try {
        const p1 = row.partner1_name || '';
        const p2 = row.partner2_name || '';
        const base = issueSlug || 'issue';
        const s1 = p1.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
        const s2 = p2.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
        const parts = [s1,s2].filter(Boolean);
        const slug = parts.length > 0 ? `${base}-for-${parts.join('-and-')}-${Date.now()}` : `${base}-for-couple-${Date.now()}`;
        const url = `https://luxuryweddingdirectory.com/magazine/read/${slug}?personalised=true`;

        const { data: record, error } = await supabase
          .from('magazine_personalised_issues')
          .insert({
            issue_id:      issueId,
            slug,
            partner1_name: p1 || null,
            partner2_name: p2 || null,
            wedding_date:  row.wedding_date || null,
            venue_name:    row.venue_name || null,
          })
          .select()
          .single();
        if (error) throw error;
        results.push({ row, url, id: record.id, success: true });
        setPrevious(prev => [record, ...prev]);
      } catch (err) {
        results.push({ row, url: '', success: false, error: err.message });
      }
      setBulkProgress({ done: i + 1, total: csvRows.length });
    }
    setBulkResults(results);
    setBulkProgress(null);
  }

  async function handleBulkSendEmails() {
    setBulkSendAll(true);
    for (const result of bulkResults) {
      if (!result.success || !result.row.email) continue;
      try {
        const html = buildCoupleEmail({
          partner1: result.row.partner1_name || '',
          partner2: result.row.partner2_name || '',
          issueName,
          url: result.url,
        });
        await sendEmail({
          subject: 'Your personal wedding edition is ready — LWD',
          fromName: 'Luxury Wedding Directory',
          fromEmail: 'editorial@luxuryweddingdirectory.com',
          html,
          recipients: [{ email: result.row.email }],
          type: 'campaign',
        });
      } catch {}
    }
    setBulkSendAll(false);
  }

  async function generatePersonalisedCover(issueIdParam, personalisedId, p1, p2) {
    try {
      // Fetch page 1 canvasJSON
      const { data: pageRow } = await supabase.from('magazine_issue_pages')
        .select('template_data').eq('issue_id', issueIdParam).eq('page_number', 1).single();
      if (!pageRow?.template_data?.canvasJSON) return null;

      const { Canvas: FC, FabricObject } = await import('fabric');
      FabricObject.ownDefaults.originX = 'left';
      FabricObject.ownDefaults.originY = 'top';
      const el = document.createElement('canvas');
      el.width = 794; el.height = 1123;
      const fc = new FC(el, { width: 794, height: 1123, enableRetinaScaling: false });
      await fc.loadFromJSON(pageRow.template_data.canvasJSON);
      fc.renderAll();

      // Find headline (largest textbox) and inject couple names
      const textObjs = fc.getObjects().filter(o => o.type === 'textbox').sort((a, b) => b.fontSize - a.fontSize);
      if (textObjs[0]) textObjs[0].set('text', p1 + ' & ' + p2);

      await new Promise(r => setTimeout(r, 80));
      fc.renderAll();

      const blob = await new Promise((res, rej) => {
        el.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/jpeg', 0.9);
      });
      fc.dispose();

      const path = `${issueIdParam}/personalised/${personalisedId}-cover.jpg`;
      const { error } = await supabase.storage.from('magazine-pages').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) return null;
      const { data: { publicUrl } } = supabase.storage.from('magazine-pages').getPublicUrl(path);

      // Update the record with cover_url
      await supabase.from('magazine_personalised_issues').update({ cover_url: publicUrl }).eq('id', personalisedId);
      return publicUrl;
    } catch(e) { console.warn('[PersonalisePanel] Cover re-render failed:', e); return null; }
  }

  async function handleCreate() {
    if (!partner1.trim() && !partner2.trim()) {
      setCreateErr('Please enter at least one partner name.');
      return;
    }
    setCreating(true); setCreateErr('');
    try {
      const slug = buildSlug();
      const url  = `https://luxuryweddingdirectory.com/magazine/read/${slug}?personalised=true`;

      const { data: row, error } = await supabase
        .from('magazine_personalised_issues')
        .insert({
          issue_id:     issueId,
          slug,
          partner1_name: partner1.trim() || null,
          partner2_name: partner2.trim() || null,
          wedding_date:  weddingDate || null,
          venue_name:    venueName.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;

      setCreatedSlug(slug);
      setCreatedUrl(url);
      setPrevious(prev => [row, ...prev]);

      // Generate personalised cover in background (fire-and-forget)
      if (partner1.trim() || partner2.trim()) {
        generatePersonalisedCover(issueId, row.id, partner1.trim() || '', partner2.trim() || '')
          .then(coverUrl => {
            if (coverUrl) {
              setPrevious(prev => prev.map(p => p.id === row.id ? { ...p, cover_url: coverUrl } : p));
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      console.error('[PersonalisePanel] Create failed:', err);
      setCreateErr(err.message || 'Failed to create personalised issue');
    }
    setCreating(false);
  }

  async function handleCopy(url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleSendToCouple() {
    if (!coupleEmail.trim() || !createdUrl) return;
    setSendingEmail(true); setEmailErr('');
    try {
      const html = buildCoupleEmail({ partner1: partner1.trim(), partner2: partner2.trim(), issueName, url: createdUrl });
      await sendEmail({
        subject:    `Your personal wedding edition is ready — LWD`,
        fromName:   'Luxury Wedding Directory',
        fromEmail:  'editorial@luxuryweddingdirectory.com',
        html,
        recipients: [{ email: coupleEmail.trim() }],
        type:       'campaign',
      });
      setEmailSent(true);
    } catch (err) {
      console.error('[PersonalisePanel] Email failed:', err);
      setEmailErr(err.message || 'Failed to send email');
    }
    setSendingEmail(false);
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
      <style>{`@keyframes ppSlideIn { from { transform: translateX(40px); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>

      <div
        style={{
          width: 420,
          background: '#141210',
          borderLeft: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column',
          height: '100%',
          animation: 'ppSlideIn 0.22s ease',
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
              ◆ Personalisation
            </div>
            <div style={{ fontFamily: GD, fontSize: 16, fontStyle: 'italic', color: '#fff' }}>
              Personalise for a Couple
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}>
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          {[['single', '✦ Single'], ['bulk', '◈ Bulk Import']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, padding: '10px 0', cursor: 'pointer',
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === key ? GOLD : 'transparent'}`,
                color: activeTab === key ? GOLD : MUTED,
                fontFamily: NU, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                transition: 'all 0.15s', marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '0 18px 24px', overflowY: 'auto' }}>

          {/* ── Bulk Import tab ── */}
          {activeTab === 'bulk' && (
            <div style={{ paddingTop: 18 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                ◈ Upload CSV
              </div>
              <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, lineHeight: 1.6, marginBottom: 12 }}>
                CSV must have headers: <code style={{ color: 'rgba(255,255,255,0.6)' }}>partner1_name, partner2_name, wedding_date, venue_name, email</code>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFile}
                style={{ fontFamily: NU, fontSize: 11, color: MUTED, marginBottom: 12, display: 'block' }}
              />
              {csvError && (
                <div style={{ fontFamily: NU, fontSize: 11, color: '#f87171', marginBottom: 10 }}>✕ {csvError}</div>
              )}

              {csvRows.length > 0 && (
                <div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginBottom: 8 }}>
                    {csvRows.length} row{csvRows.length !== 1 ? 's' : ''} parsed
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', border: `1px solid ${BORDER}`, borderRadius: 4, marginBottom: 12 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: NU, fontSize: 10 }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                          {['Partner 1', 'Partner 2', 'Date', 'Email'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: MUTED, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 8, borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.map((r, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                            <td style={{ padding: '5px 10px', color: '#fff' }}>{r.partner1_name || '—'}</td>
                            <td style={{ padding: '5px 10px', color: '#fff' }}>{r.partner2_name || '—'}</td>
                            <td style={{ padding: '5px 10px', color: MUTED }}>{r.wedding_date || '—'}</td>
                            <td style={{ padding: '5px 10px', color: MUTED }}>{r.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {bulkProgress !== null && (
                    <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, marginBottom: 10 }}>
                      Creating {bulkProgress.done}/{bulkProgress.total}…
                    </div>
                  )}

                  {bulkResults.length === 0 && bulkProgress === null && (
                    <button
                      onClick={handleBulkCreate}
                      style={{
                        width: '100%', padding: '10px 0', borderRadius: 3, cursor: 'pointer',
                        background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.4)`,
                        color: GOLD, fontFamily: NU, fontSize: 10, fontWeight: 700,
                        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
                      }}
                    >
                      ◈ Create All ({csvRows.length})
                    </button>
                  )}

                  {bulkResults.length > 0 && (
                    <div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: '#34d399', marginBottom: 10, fontWeight: 700 }}>
                        ✓ {bulkResults.filter(r => r.success).length} created · {bulkResults.filter(r => !r.success).length} failed
                      </div>
                      <div style={{ maxHeight: 140, overflowY: 'auto', border: `1px solid ${BORDER}`, borderRadius: 4, marginBottom: 12 }}>
                        {bulkResults.map((r, i) => (
                          <div key={i} style={{
                            padding: '6px 10px', borderBottom: `1px solid rgba(255,255,255,0.04)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                          }}>
                            <div style={{ fontFamily: NU, fontSize: 10, color: r.success ? '#fff' : '#f87171', flex: 1 }}>
                              {[r.row.partner1_name, r.row.partner2_name].filter(Boolean).join(' & ') || 'Unnamed'}
                            </div>
                            {r.success && r.url && (
                              <button
                                onClick={() => navigator.clipboard?.writeText(r.url).catch(()=>{})}
                                style={{
                                  fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                                  padding: '2px 6px', borderRadius: 2, cursor: 'pointer',
                                  background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.25)`, color: GOLD,
                                }}
                              >
                                ⎘ Copy
                              </button>
                            )}
                            {!r.success && <span style={{ fontFamily: NU, fontSize: 9, color: '#f87171' }}>✕</span>}
                          </div>
                        ))}
                      </div>
                      {bulkResults.some(r => r.success && r.row.email) && (
                        <button
                          onClick={handleBulkSendEmails}
                          disabled={bulkSendAll}
                          style={{
                            width: '100%', padding: '10px 0', borderRadius: 3, cursor: bulkSendAll ? 'not-allowed' : 'pointer',
                            background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.12)`,
                            color: 'rgba(255,255,255,0.6)', fontFamily: NU, fontSize: 10, fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase', opacity: bulkSendAll ? 0.5 : 1,
                          }}
                        >
                          {bulkSendAll ? '⋯ Sending…' : '✉ Send All Emails'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Create form (single) ── */}
          {activeTab === 'single' && !createdUrl ? (
            <div style={{ paddingTop: 18 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                ✦ Create Personalised Edition
              </div>

              <label style={labelStyle}>Partner 1 Name</label>
              <input type="text" value={partner1} onChange={e => setPartner1(e.target.value)} placeholder="e.g. Isabelle" style={inputStyle} />

              <label style={labelStyle}>Partner 2 Name</label>
              <input type="text" value={partner2} onChange={e => setPartner2(e.target.value)} placeholder="e.g. Olivier" style={inputStyle} />

              <label style={labelStyle}>Wedding Date</label>
              <input type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />

              <label style={labelStyle}>Venue Name (optional)</label>
              <input type="text" value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="e.g. Villa di Ulignano" style={inputStyle} />

              {createErr && (
                <div style={{ marginTop: 8, fontFamily: NU, fontSize: 10, color: '#f87171' }}>
                  ✕ {createErr}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  marginTop: 16, width: '100%', padding: '10px 0', borderRadius: 3,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.08))',
                  border: `1px solid rgba(201,168,76,0.45)`,
                  color: GOLD, fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  opacity: creating ? 0.55 : 1, transition: 'all 0.15s',
                }}
              >
                {creating ? '⋯ Creating…' : '◈ Create Personalised Issue'}
              </button>
            </div>
          ) : (
            /* ── Success state ── */
            <div style={{ paddingTop: 18 }}>
              <div style={{ marginBottom: 20, padding: '16px 14px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4 }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  ✓ Personalised edition created
                </div>
                <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 10, wordBreak: 'break-all', lineHeight: 1.5 }}>
                  {createdUrl}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleCopy(createdUrl)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 3, cursor: 'pointer',
                      background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(201,168,76,0.1)',
                      border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(201,168,76,0.3)'}`,
                      color: copied ? '#34d399' : GOLD,
                      fontFamily: NU, fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}
                  >
                    {copied ? '✓ Copied' : '⎘ Copy Link'}
                  </button>
                  <a
                    href={createdUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '8px 14px', borderRadius: 3, textDecoration: 'none',
                      background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.12)`,
                      color: 'rgba(255,255,255,0.6)',
                      fontFamily: NU, fontSize: 9, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}
                  >
                    Preview ↗
                  </a>
                </div>
              </div>

              {/* Send to couple */}
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                ✉ Send to Couple
              </div>
              <input
                type="email"
                value={coupleEmail}
                onChange={e => setCoupleEmail(e.target.value)}
                placeholder="couple@email.com"
                style={inputStyle}
              />
              {emailErr && <div style={{ marginTop: 6, fontFamily: NU, fontSize: 10, color: '#f87171' }}>✕ {emailErr}</div>}
              {emailSent && <div style={{ marginTop: 6, fontFamily: NU, fontSize: 10, color: '#34d399', fontWeight: 700 }}>✓ Email sent to couple</div>}
              <button
                onClick={handleSendToCouple}
                disabled={sendingEmail || !coupleEmail.trim() || emailSent}
                style={{
                  marginTop: 10, width: '100%', padding: '10px 0', borderRadius: 3,
                  cursor: sendingEmail || !coupleEmail.trim() || emailSent ? 'not-allowed' : 'pointer',
                  background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.12)`,
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  opacity: sendingEmail || emailSent ? 0.55 : 1, transition: 'all 0.15s',
                }}
              >
                {sendingEmail ? '⋯ Sending…' : emailSent ? '✓ Sent' : 'Send to Couple'}
              </button>

              <button
                onClick={() => { setCreatedUrl(''); setCreatedSlug(''); setPartner1(''); setPartner2(''); setWeddingDate(''); setVenueName(''); setCoupleEmail(''); setEmailSent(false); setEmailErr(''); }}
                style={{
                  marginTop: 10, width: '100%', padding: '8px 0', borderRadius: 3, cursor: 'pointer',
                  background: 'none', border: `1px solid rgba(255,255,255,0.08)`,
                  color: MUTED, fontFamily: NU, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}
              >
                + Create Another
              </button>
            </div>
          )}

          {/* ── Previous personalisations ── */}
          <div style={{ marginTop: 28, borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              ◇ Previous Personalisations
            </div>
            {loadingPrev ? (
              <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>Loading…</div>
            ) : previous.length === 0 ? (
              <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>None yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {previous.map(p => {
                  const names = [p.partner1_name, p.partner2_name].filter(Boolean).join(' & ');
                  const url   = `https://luxuryweddingdirectory.com/magazine/read/${p.slug}?personalised=true`;
                  return (
                    <div key={p.id} style={{
                      padding: '10px 12px', borderRadius: 4,
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}>
                      {p.cover_url && (
                        <img
                          src={p.cover_url}
                          alt={names || 'cover'}
                          style={{
                            width: 40, height: 57, objectFit: 'cover', borderRadius: 2, flexShrink: 0,
                            border: `1px solid rgba(201,168,76,0.2)`,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: GD, fontSize: 13, fontStyle: 'italic', color: '#fff', marginBottom: 2 }}>
                        {names || 'Unnamed couple'}
                      </div>
                      {p.wedding_date && (
                        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 2 }}>
                          {new Date(p.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      )}
                      {p.venue_name && (
                        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 6 }}>
                          {p.venue_name}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleCopy(url)}
                          style={{
                            fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                            padding: '3px 8px', borderRadius: 2, cursor: 'pointer',
                            background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.25)`,
                            color: GOLD,
                          }}
                        >
                          ⎘ Copy Link
                        </button>
                        <a
                          href={url} target="_blank" rel="noopener noreferrer"
                          style={{
                            fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                            padding: '3px 8px', borderRadius: 2, textDecoration: 'none',
                            background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`,
                            color: MUTED,
                          }}
                        >
                          Preview ↗
                        </a>
                      </div>
                      </div>{/* end inner flex div */}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
