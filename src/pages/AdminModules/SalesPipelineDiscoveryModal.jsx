/**
 * SalesPipelineDiscoveryModal.jsx
 * Prospect discovery engine modal, extracted from SalesPipelineModule.jsx.
 *
 * IMPORTANT: S and G are passed as props so this component picks up the
 * themed values that SalesPipelineModule sets before rendering.
 */

import React, { useState } from 'react';
import {
  discoverByKeywords,
  discoverFromUrl,
  importDiscoveredProspects,
} from '../../services/prospectDiscoveryService';
import {
  calculateLeadScore,
  scoreColor,
  scoreLabel,
} from '../../services/leadScoringService';

// ── Small display helper ──────────────────────────────────────────────────────

function ScorePill({ score, S }) {
  if (score == null) return null;
  const color = scoreColor(score);
  return <span style={S.scorePill(color)} title={`Lead score: ${score}/100 (${scoreLabel(score)})`}>{score}</span>;
}

// ── DiscoveryModal ────────────────────────────────────────────────────────────

export default function DiscoveryModal({ pipelines, allStages, assignRules, assignSettings, onImported, onClose, S, G, C }) {
  const resolvedG = G || '#8f7420';

  const [tab,           setTab]           = useState('keyword'); // 'keyword' | 'url'
  const [query,         setQuery]         = useState('');
  const [location,      setLocation]      = useState('United Kingdom');
  const [venueType,     setVenueType]     = useState('Venue');
  const [count,         setCount]         = useState(8);
  const [url,           setUrl]           = useState('');
  const [results,       setResults]       = useState([]);
  const [selected,      setSelected]      = useState(new Set());
  const [urlDraft,      setUrlDraft]      = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [importing,     setImporting]     = useState(false);
  const [error,         setError]         = useState(null);

  const TYPES = ['Venue', 'Photographer', 'Florist', 'Caterer', 'Planner', 'Musician', 'Hair and Makeup', 'Cake Designer', 'Transport', 'Vendor'];

  async function handleDiscover() {
    if (!query.trim() || !location.trim()) return;
    setLoading(true); setError(null); setResults([]); setSelected(new Set());
    try {
      const res = await discoverByKeywords({ query, location, venueType, count });
      setResults(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleExtract() {
    if (!url.trim()) return;
    setLoading(true); setError(null); setUrlDraft(null);
    try {
      const res = await discoverFromUrl(url);
      setUrlDraft(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleImportKeyword() {
    const toImport = results.filter(r => selected.has(r.company_name));
    if (!toImport.length) return;
    setImporting(true);
    try {
      const created = await importDiscoveredProspects(toImport, { pipelines, rules: assignRules, settings: assignSettings, allStages });
      onImported(created);
    } catch (e) { setError(e.message); }
    finally { setImporting(false); }
  }

  async function handleImportUrl() {
    if (!urlDraft) return;
    setImporting(true);
    try {
      const created = await importDiscoveredProspects([urlDraft], { pipelines, rules: assignRules, settings: assignSettings, allStages });
      onImported(created);
    } catch (e) { setError(e.message); }
    finally { setImporting(false); }
  }

  function toggleSelect(name) {
    setSelected(s => {
      const ns = new Set(s);
      ns.has(name) ? ns.delete(name) : ns.add(name);
      return ns;
    });
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modal, maxWidth: 640, width: '95vw' }}>
        <div style={S.modalHead}>Prospect Discovery Engine</div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0ece4', marginBottom: 20 }}>
          {[['keyword', 'Keyword Search'], ['url', 'URL Extract']].map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setError(null); setResults([]); setUrlDraft(null); }} style={{ padding: '8px 18px', background: 'none', border: 'none', borderBottom: tab === key ? `2px solid ${resolvedG}` : '2px solid transparent', color: tab === key ? resolvedG : '#888', fontSize: 13, fontWeight: tab === key ? 600 : 400, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>

        {tab === 'keyword' && (
          <div>
            <div style={S.formRow}>
              <div style={S.formCol}>
                <div style={S.formLabel}>Search Query</div>
                <input style={{ ...S.formInput, marginTop: 4 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. luxury barn venues" onKeyDown={e => e.key === 'Enter' && handleDiscover()} />
              </div>
              <div style={S.formCol}>
                <div style={S.formLabel}>Location</div>
                <input style={{ ...S.formInput, marginTop: 4 }} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Cotswolds, UK" />
              </div>
            </div>
            <div style={S.formRow}>
              <div style={S.formCol}>
                <div style={S.formLabel}>Business Type</div>
                <select style={{ ...S.formSelect, marginTop: 4 }} value={venueType} onChange={e => setVenueType(e.target.value)}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.formCol}>
                <div style={S.formLabel}>Count</div>
                <select style={{ ...S.formSelect, marginTop: 4 }} value={count} onChange={e => setCount(Number(e.target.value))}>
                  {[5, 8, 10, 15].map(n => <option key={n} value={n}>{n} suggestions</option>)}
                </select>
              </div>
            </div>
            <button style={{ ...S.goldBtn, marginBottom: 20, opacity: loading ? 0.6 : 1 }} onClick={handleDiscover} disabled={loading || !query || !location}>{loading ? 'Discovering...' : 'Discover Prospects'}</button>

            {results.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{results.length} suggestions</div>
                  <button style={{ fontSize: 11, color: resolvedG, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setSelected(selected.size === results.length ? new Set() : new Set(results.map(r => r.company_name)))}>{selected.size === results.length ? 'Deselect all' : 'Select all'}</button>
                </div>
                {results.map(r => (
                  <div key={r.company_name} onClick={() => toggleSelect(r.company_name)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 7, marginBottom: 8, background: selected.has(r.company_name) ? resolvedG + '08' : '#fafaf8', border: `1px solid ${selected.has(r.company_name) ? resolvedG + '40' : '#ede8de'}`, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selected.has(r.company_name)} onChange={() => {}} style={{ marginTop: 3, accentColor: resolvedG }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{r.company_name}</div>
                      {r.website && <div style={{ fontSize: 11, color: resolvedG }}>{r.website}</div>}
                      {r.notes && <div style={{ fontSize: 12, color: '#666', marginTop: 3, lineHeight: 1.5 }}>{r.notes}</div>}
                    </div>
                    <span style={{ fontSize: 10, color: '#888', background: '#f3f0ea', padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap' }}>{r.venue_type}</span>
                  </div>
                ))}
                <button style={{ ...S.goldBtn, width: '100%', marginTop: 10, opacity: selected.size === 0 || importing ? 0.6 : 1 }} onClick={handleImportKeyword} disabled={selected.size === 0 || importing}>{importing ? 'Importing...' : `Import ${selected.size} Selected Prospect${selected.size !== 1 ? 's' : ''}`}</button>
              </div>
            )}
          </div>
        )}

        {tab === 'url' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={S.formLabel}>Website URL</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <input style={{ ...S.formInput, flex: 1 }} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.venuename.co.uk" onKeyDown={e => e.key === 'Enter' && handleExtract()} />
                <button style={{ ...S.goldBtn, opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap' }} onClick={handleExtract} disabled={loading || !url}>{loading ? 'Extracting...' : 'Extract Details'}</button>
              </div>
            </div>

            {urlDraft && (
              <div>
                <div style={{ marginBottom: 14 }}>
                  {[['company_name', 'Company Name'], ['contact_name', 'Contact Name'], ['email', 'Email'], ['venue_type', 'Type'], ['website', 'Website'], ['country', 'Country']].map(([k, label]) => (
                    <div key={k} style={S.formRow}>
                      <div style={S.formCol}>
                        <div style={S.formLabel}>{label}</div>
                        <input style={{ ...S.formInput, marginTop: 4 }} value={urlDraft[k] || ''} onChange={e => setUrlDraft(d => ({ ...d, [k]: e.target.value }))} />
                      </div>
                    </div>
                  ))}
                  <div style={S.formLabel}>Notes</div>
                  <textarea style={{ ...S.formTextarea, width: '100%', boxSizing: 'border-box', marginTop: 4 }} value={urlDraft.notes || ''} onChange={e => setUrlDraft(d => ({ ...d, notes: e.target.value }))} rows={3} />
                </div>
                <button style={{ ...S.goldBtn, width: '100%', opacity: importing ? 0.6 : 1 }} onClick={handleImportUrl} disabled={importing || !urlDraft.company_name}>{importing ? 'Saving...' : 'Save as Prospect'}</button>
              </div>
            )}
          </div>
        )}

        {error && <div style={{ marginTop: 14, fontSize: 12, color: '#dc2626', background: '#fee2e2', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button style={S.outlineBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
