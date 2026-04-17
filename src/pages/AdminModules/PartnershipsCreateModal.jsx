// ─── src/pages/AdminModules/PartnershipsCreateModal.jsx ───────────────────
// Modal form to create a new partnership.
// Fields: Venue, Partner Name, Destination, Tier, Status, dates, manager, notes
// Tier options: Signature, Institutional, Curated
// Status options: Active, Pending, Founding, Suspended, Expired
// ──────────────────────────────────────────────────────────────────────────

import { useState } from 'react';

const NU = 'var(--font-body)';

export default function PartnershipsCreateModal({ C, onClose, onSave }) {
  const [form, setForm] = useState({
    venue: '',
    partner_name: '',
    destination: '',
    tier: '',
    status: '',
    renewal_date: '',
    contract_start: '',
    contract_end: '',
    account_manager: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const tiers = ['Signature', 'Institutional', 'Curated'];
  const statuses = ['Active', 'Pending', 'Founding', 'Suspended', 'Expired'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!form.venue.trim()) {
      setError('Venue is required');
      return;
    }
    if (!form.partner_name.trim()) {
      setError('Partner Name is required');
      return;
    }
    if (!form.tier) {
      setError('Tier is required');
      return;
    }
    if (!form.status) {
      setError('Status is required');
      return;
    }

    setSaving(true);
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { error: insertError } = await supabase
        .from('partnerships')
        .insert([
          {
            partner_name: form.partner_name.trim(),
            destination: form.destination.trim() || null,
            tier: form.tier,
            status: form.status,
            renewal_date: form.renewal_date || null,
            contract_start: form.contract_start || null,
            contract_end: form.contract_end || null,
            account_manager: form.account_manager.trim() || null,
            notes: form.notes.trim() || null,
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create partnership');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        padding: '32px 28px',
        maxWidth: 500,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{
          fontFamily: NU,
          fontSize: 18,
          color: C.off,
          margin: '0 0 24px',
          fontWeight: 500,
        }}>
          Add Partnership
        </h2>

        {success ? (
          <div style={{
            textAlign: 'center',
            padding: '24px 0',
          }}>
            <p style={{
              fontFamily: NU,
              fontSize: 14,
              color: '#10b981',
              margin: 0,
            }}>
              ✓ Partnership created successfully
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Venue */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.grey2,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                Venue *
              </label>
              <input
                type="text"
                name="venue"
                value={form.venue}
                onChange={handleChange}
                placeholder="e.g., Villa Balbiano"
                style={{
                  width: '100%',
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.off,
                  background: C.bg || '#0a0906',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Partner Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.grey2,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                Partner Name *
              </label>
              <input
                type="text"
                name="partner_name"
                value={form.partner_name}
                onChange={handleChange}
                placeholder="e.g., Villa Balbiano"
                style={{
                  width: '100%',
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.off,
                  background: C.bg || '#0a0906',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Destination */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.grey2,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                Destination
              </label>
              <input
                type="text"
                name="destination"
                value={form.destination}
                onChange={handleChange}
                placeholder="e.g., Lake Como"
                style={{
                  width: '100%',
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.off,
                  background: C.bg || '#0a0906',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Tier */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.grey2,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                Tier *
              </label>
              <select
                name="tier"
                value={form.tier}
                onChange={handleChange}
                style={{
                  width: '100%',
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.off,
                  background: C.bg || '#0a0906',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select Tier</option>
                {tiers.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.grey2,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                Status *
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={{
                  width: '100%',
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.off,
                  background: C.bg || '#0a0906',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select Status</option>
                {statuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Renewal Date */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.grey2,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                Renewal Date
              </label>
              <input
                type="date"
                name="renewal_date"
                value={form.renewal_date}
                onChange={handleChange}
                style={{
                  width: '100%',
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.off,
                  background: C.bg || '#0a0906',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Contract Start */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.grey2,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                Contract Start
              </label>
              <input
                type="date"
                name="contract_start"
                value={form.contract_start}
                onChange={handleChange}
                style={{
                  width: '100%',
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.off,
                  background: C.bg || '#0a0906',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Contract End */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.grey2,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                Contract End
              </label>
              <input
                type="date"
                name="contract_end"
                value={form.contract_end}
                onChange={handleChange}
                style={{
                  width: '100%',
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.off,
                  background: C.bg || '#0a0906',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Account Manager */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.grey2,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                Account Manager
              </label>
              <input
                type="text"
                name="account_manager"
                value={form.account_manager}
                onChange={handleChange}
                placeholder="Name"
                style={{
                  width: '100%',
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.off,
                  background: C.bg || '#0a0906',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: C.grey2,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes"
                style={{
                  width: '100%',
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.off,
                  background: C.bg || '#0a0906',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '8px 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  minHeight: 80,
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                fontFamily: NU,
                fontSize: 11,
                color: '#f87171',
                marginBottom: 16,
                padding: '8px 12px',
                background: 'rgba(248, 113, 113, 0.1)',
                borderRadius: 3,
              }}>
                {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  fontFamily: NU,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  color: C.grey,
                  borderRadius: 3,
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  fontFamily: NU,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '8px 16px',
                  background: C.gold,
                  border: 'none',
                  color: '#0a0906',
                  borderRadius: 3,
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save Partnership'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
