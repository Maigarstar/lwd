// ─── src/pages/PublicationStudio/MonetizationTab.jsx ─────────────────────────
// Tier 4 monetization panel rendered inside IssueWorkspace.
// Section A: Paywall settings (toggle + free page count)
// Section B: Advertising placements (summary bar + CRUD table)

import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchAdPlacements,
  upsertAdPlacement,
  deleteAdPlacement,
  updatePaywallSettings,
  getIssueRevenueSummary,
} from '../../services/magazineMonetizationService';

// ── Design tokens (mirror PublicationStudio) ──────────────────────────────────
const GOLD    = '#C9A96E';
const GOLD_DK = '#b8954d';
const NU      = "var(--font-body, 'Nunito Sans', sans-serif)";
const GD      = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const BG      = '#1A1814';
const SURF    = '#2A2520';
const BORDER  = 'rgba(255,255,255,0.08)';
const MUTED   = 'rgba(255,255,255,0.38)';
const CRIMSON = '#C0392B';
const INPUT_S = {
  width: '100%', boxSizing: 'border-box',
  background: '#2A2520',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4, color: '#fff',
  fontFamily: NU, fontSize: 13,
  padding: '8px 10px', outline: 'none',
};

const AD_TYPES = [
  { value: 'full-page',   label: 'Full Page' },
  { value: 'half-page',   label: 'Half Page' },
  { value: 'advertorial', label: 'Advertorial' },
];

// ── Primitive helpers ─────────────────────────────────────────────────────────

function SectionHead({ children }) {
  return (
    <div style={{
      fontFamily: NU, fontSize: 9, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: GOLD, marginBottom: 14, marginTop: 4,
    }}>
      {children}
    </div>
  );
}

function Hr() {
  return <div style={{ borderTop: `1px solid ${BORDER}`, margin: '24px 0' }} />;
}

function Lbl({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
      <span style={{
        fontFamily: NU, fontSize: 11, fontWeight: 700,
        color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>{children}</span>
      {hint && <span style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>{hint}</span>}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl hint={hint}>{label}</Lbl>
      {children}
    </div>
  );
}

function Btn({ children, onClick, gold, danger, disabled, small }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: NU, fontSize: small ? 9 : 10, fontWeight: 700,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        border: 'none', borderRadius: 3,
        padding: small ? '5px 10px' : '7px 14px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'all 0.15s',
        background: gold
          ? hov ? GOLD_DK : GOLD
          : danger
            ? hov ? 'rgba(192,57,43,0.3)' : 'rgba(192,57,43,0.15)'
            : hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
        color: gold ? '#1a1806' : danger ? '#e74c3c' : 'rgba(255,255,255,0.7)',
      }}
    >{children}</button>
  );
}

// Gold toggle switch
function Toggle({ value, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: value ? GOLD : 'rgba(255,255,255,0.15)',
          position: 'relative', transition: 'background 0.2s',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 4,
          left: value ? 21 : 3,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }} />
      </div>
      {label && (
        <span style={{ fontFamily: NU, fontSize: 13, color: value ? '#fff' : MUTED }}>
          {label}
        </span>
      )}
    </label>
  );
}

// Summary metric tile
function MetricTile({ label, value, sub }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${BORDER}`, borderRadius: 6,
      padding: '14px 16px', minWidth: 100,
    }}>
      <div style={{
        fontFamily: NU, fontSize: 8, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: GOLD, marginBottom: 6,
      }}>{label}</div>
      <div style={{ fontFamily: GD, fontSize: 26, fontWeight: 300, color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Placement inline form ─────────────────────────────────────────────────────

const EMPTY_FORM = {
  page_number: '',
  ad_type: 'full-page',
  advertiser_name: '',
  advertiser_logo: '',
  campaign_name: '',
  campaign_url: '',
  rate_card_gbp: '',
  notes: '',
  is_active: true,
};

function PlacementForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(initial || {}) });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = () => {
    if (!form.page_number || !form.advertiser_name.trim()) return;
    onSave({
      ...form,
      page_number:   parseInt(form.page_number, 10),
      rate_card_gbp: form.rate_card_gbp !== '' ? parseFloat(form.rate_card_gbp) : null,
    });
  };

  return (
    <div style={{
      background: 'rgba(201,169,110,0.05)',
      border: `1px solid rgba(201,169,110,0.2)`,
      borderRadius: 6, padding: '20px 22px', marginBottom: 16,
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
        {initial?.id ? 'Edit Placement' : 'New Placement'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Page No." hint="required">
          <input
            type="number" min="1"
            value={form.page_number}
            onChange={e => set('page_number', e.target.value)}
            style={INPUT_S}
            placeholder="e.g. 4"
          />
        </Field>
        <Field label="Ad Type">
          <select
            value={form.ad_type}
            onChange={e => set('ad_type', e.target.value)}
            style={{ ...INPUT_S, cursor: 'pointer' }}
          >
            {AD_TYPES.map(t => (
              <option key={t.value} value={t.value} style={{ background: '#1a1814' }}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Rate (£)">
          <input
            type="number" min="0" step="0.01"
            value={form.rate_card_gbp}
            onChange={e => set('rate_card_gbp', e.target.value)}
            style={INPUT_S}
            placeholder="e.g. 1500.00"
          />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Advertiser Name" hint="required">
          <input
            value={form.advertiser_name}
            onChange={e => set('advertiser_name', e.target.value)}
            style={INPUT_S}
            placeholder="e.g. Villa Borghese Roses"
          />
        </Field>
        <Field label="Campaign Name">
          <input
            value={form.campaign_name}
            onChange={e => set('campaign_name', e.target.value)}
            style={INPUT_S}
            placeholder="e.g. Spring 2026 Campaign"
          />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Click-Through URL">
          <input
            value={form.campaign_url}
            onChange={e => set('campaign_url', e.target.value)}
            style={INPUT_S}
            placeholder="https://…"
          />
        </Field>
        <Field label="Advertiser Logo URL">
          <input
            value={form.advertiser_logo}
            onChange={e => set('advertiser_logo', e.target.value)}
            style={INPUT_S}
            placeholder="https://…"
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          style={{ ...INPUT_S, resize: 'vertical' }}
          placeholder="Internal notes about this placement…"
        />
      </Field>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
        <Toggle
          value={form.is_active}
          onChange={v => set('is_active', v)}
          label="Active"
        />
        <div style={{ flex: 1 }} />
        <Btn onClick={onCancel} disabled={saving}>Cancel</Btn>
        <Btn gold onClick={handleSubmit} disabled={saving || !form.page_number || !form.advertiser_name.trim()}>
          {saving ? 'Saving…' : initial?.id ? 'Update' : 'Add Placement'}
        </Btn>
      </div>
    </div>
  );
}

// ── Main MonetizationTab component ────────────────────────────────────────────

export default function MonetizationTab({ issue, onIssueUpdate }) {
  // ── Paywall state ──────────────────────────────────────────────────────────
  const [paywallEnabled,  setPaywallEnabled]  = useState(issue?.paywall_enabled  ?? false);
  const [freePageCount,   setFreePageCount]   = useState(issue?.free_page_count  ?? 3);
  const [paywallSaving,   setPaywallSaving]   = useState(false);
  const [paywallMsg,      setPaywallMsg]      = useState('');

  // ── Placement state ────────────────────────────────────────────────────────
  const [placements,      setPlacements]      = useState([]);
  const [loadingPlacements, setLoadingPlacements] = useState(true);
  const [summary,         setSummary]         = useState(null);
  const [showForm,        setShowForm]        = useState(false);
  const [editingPlacement, setEditingPlacement] = useState(null); // placement object being edited
  const [formSaving,      setFormSaving]      = useState(false);
  const [deleteConfirm,   setDeleteConfirm]   = useState(null);  // id pending delete

  const issueId = issue?.id;

  // Sync paywall state if issue prop updates
  useEffect(() => {
    setPaywallEnabled(issue?.paywall_enabled ?? false);
    setFreePageCount(issue?.free_page_count  ?? 3);
  }, [issue?.paywall_enabled, issue?.free_page_count]);

  // Load placements + summary
  const loadPlacements = useCallback(async () => {
    if (!issueId) return;
    setLoadingPlacements(true);
    const [{ data }, sumData] = await Promise.all([
      fetchAdPlacements(issueId),
      getIssueRevenueSummary(issueId),
    ]);
    setPlacements(data || []);
    setSummary(sumData);
    setLoadingPlacements(false);
  }, [issueId]);

  useEffect(() => { loadPlacements(); }, [loadPlacements]);

  // ── Paywall handlers ───────────────────────────────────────────────────────
  const handleSavePaywall = async () => {
    if (!issueId) return;
    setPaywallSaving(true); setPaywallMsg('');
    const { data, error } = await updatePaywallSettings(issueId, {
      paywallEnabled,
      freePageCount: Math.max(1, Math.min(10, parseInt(freePageCount, 10) || 3)),
    });
    if (!error && data) {
      onIssueUpdate?.({ paywall_enabled: data.paywall_enabled, free_page_count: data.free_page_count });
      setPaywallMsg('Saved');
    } else {
      setPaywallMsg('Save failed');
    }
    setPaywallSaving(false);
    setTimeout(() => setPaywallMsg(''), 2500);
  };

  // ── Placement handlers ─────────────────────────────────────────────────────
  const handleSavePlacement = async (formData) => {
    setFormSaving(true);
    const payload = {
      ...formData,
      issue_id: issueId,
      ...(editingPlacement?.id ? { id: editingPlacement.id } : {}),
    };
    const { data, error } = await upsertAdPlacement(payload);
    if (!error && data) {
      await loadPlacements();
      setShowForm(false);
      setEditingPlacement(null);
    }
    setFormSaving(false);
  };

  const handleDeleteConfirmed = async (id) => {
    await deleteAdPlacement(id);
    setDeleteConfirm(null);
    await loadPlacements();
  };

  const startEdit = (placement) => {
    setEditingPlacement(placement);
    setShowForm(false); // close "add new" if open
  };

  const openAddForm = () => {
    setEditingPlacement(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPlacement(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '28px 32px', maxWidth: 860 }}>

      {/* ── Section A: Paywall ── */}
      <SectionHead>Subscriber Paywall</SectionHead>

      <div style={{ marginBottom: 20 }}>
        <Toggle
          value={paywallEnabled}
          onChange={setPaywallEnabled}
          label="Enable Subscriber Paywall"
        />
      </div>

      {paywallEnabled && (
        <Field label="Free pages before paywall" hint="1–10">
          <input
            type="number" min="1" max="10"
            value={freePageCount}
            onChange={e => setFreePageCount(e.target.value)}
            style={{ ...INPUT_S, width: 100 }}
          />
        </Field>
      )}

      {/* Info callout */}
      <div style={{
        background: 'rgba(201,169,110,0.06)',
        border: `1px solid rgba(201,169,110,0.18)`,
        borderRadius: 5, padding: '12px 16px',
        marginBottom: 20,
      }}>
        <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
          {paywallEnabled
            ? `Readers can preview the first ${freePageCount || 3} page${(freePageCount || 3) !== 1 ? 's' : ''} for free. A beautiful unlock screen invites them to subscribe.`
            : 'Paywall is disabled — all pages are freely accessible to every reader.'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Btn gold onClick={handleSavePaywall} disabled={paywallSaving}>
          {paywallSaving ? 'Saving…' : 'Save Paywall Settings'}
        </Btn>
        {paywallMsg && (
          <span style={{ fontFamily: NU, fontSize: 10, color: paywallMsg === 'Saved' ? '#34d399' : '#f87171' }}>
            {paywallMsg === 'Saved' ? '✓ Saved' : '✕ Failed'}
          </span>
        )}
      </div>

      <Hr />

      {/* ── Section B: Advertising ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionHead>Advertising Placements</SectionHead>
        <Btn gold small onClick={openAddForm}>+ Add Placement</Btn>
      </div>

      {/* Revenue summary bar */}
      {summary && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
          <MetricTile
            label="Total Revenue"
            value={`£${summary.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
            sub="agreed rate cards"
          />
          <MetricTile
            label="Placements"
            value={summary.placementCount}
            sub="this issue"
          />
          <MetricTile
            label="Impressions"
            value={summary.totalImpressions.toLocaleString()}
          />
          <MetricTile
            label="Avg CTR"
            value={`${summary.avgCtr}%`}
            sub={`${summary.totalClicks} clicks`}
          />
        </div>
      )}

      {/* Add new form */}
      {showForm && !editingPlacement && (
        <PlacementForm
          onSave={handleSavePlacement}
          onCancel={closeForm}
          saving={formSaving}
        />
      )}

      {/* Placements table */}
      {loadingPlacements ? (
        <div style={{ fontFamily: NU, fontSize: 12, color: MUTED, padding: '16px 0' }}>Loading placements…</div>
      ) : placements.length === 0 && !showForm ? (
        <div style={{
          textAlign: 'center', padding: '40px 0',
          fontFamily: NU, fontSize: 12, color: MUTED,
        }}>
          <div style={{ fontSize: 28, opacity: 0.15, marginBottom: 12 }}>◈</div>
          No ad placements yet. Add the first one above.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: NU }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Page', 'Ad Type', 'Advertiser', 'Campaign', 'Rate (£)', 'Impr.', 'Clicks', 'CTR', 'Active', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '8px 10px', textAlign: 'left',
                    fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: MUTED, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {placements.map(p => {
                const ctr = p.impressions > 0
                  ? ((p.clicks / p.impressions) * 100).toFixed(1) + '%'
                  : '—';
                const isEditing = editingPlacement?.id === p.id;

                return (
                  <React.Fragment key={p.id}>
                    <tr style={{
                      borderBottom: `1px solid ${BORDER}`,
                      background: isEditing ? 'rgba(201,169,110,0.04)' : 'transparent',
                      transition: 'background 0.12s',
                    }}>
                      <td style={{ padding: '10px 10px', fontSize: 12, color: '#fff', fontWeight: 600 }}>
                        p.{p.page_number}
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 11, color: MUTED }}>
                        {AD_TYPES.find(t => t.value === p.ad_type)?.label || p.ad_type}
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 12, color: '#fff', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.advertiser_name || '—'}
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 11, color: MUTED, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.campaign_name || '—'}
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 12, color: p.rate_card_gbp ? GOLD : MUTED }}>
                        {p.rate_card_gbp != null ? `£${parseFloat(p.rate_card_gbp).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 11, color: MUTED }}>{p.impressions.toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', fontSize: 11, color: MUTED }}>{p.clicks.toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', fontSize: 11, color: MUTED }}>{ctr}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          fontFamily: NU, fontSize: 9, fontWeight: 700,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          color: p.is_active ? '#34d399' : MUTED,
                          background: p.is_active ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
                          borderRadius: 8, padding: '2px 8px',
                        }}>
                          {p.is_active ? 'Live' : 'Off'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn small onClick={() => startEdit(p)}>Edit</Btn>
                          {deleteConfirm === p.id ? (
                            <>
                              <Btn small danger onClick={() => handleDeleteConfirmed(p.id)}>Confirm</Btn>
                              <Btn small onClick={() => setDeleteConfirm(null)}>Cancel</Btn>
                            </>
                          ) : (
                            <Btn small danger onClick={() => setDeleteConfirm(p.id)}>Delete</Btn>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit form */}
                    {isEditing && (
                      <tr>
                        <td colSpan={10} style={{ padding: '0 0 4px', background: 'rgba(201,169,110,0.02)' }}>
                          <div style={{ padding: '0 8px 8px' }}>
                            <PlacementForm
                              initial={editingPlacement}
                              onSave={handleSavePlacement}
                              onCancel={closeForm}
                              saving={formSaving}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
