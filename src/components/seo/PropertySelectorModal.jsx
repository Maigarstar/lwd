// ─── src/components/seo/PropertySelectorModal.jsx ────────────────────────────
// Shown after a successful Google OAuth connection when the user has multiple
// GA4 properties or Search Console sites to choose from.
// A single property is auto-selected if only one exists.

import { useState, useEffect } from 'react';
import { selectProperty }      from '../../services/googleConnectionService';

const NU = 'var(--font-body)';
const GD = 'var(--font-heading-primary)';
const G  = '#c9a84c';

export default function PropertySelectorModal({ service, properties, onComplete, onClose }) {
  const [selected, setSelected]   = useState('');
  const [saving,   setSaving]     = useState(false);
  const [error,    setError]      = useState(null);

  const serviceName = service === 'analytics' ? 'Google Analytics 4' : 'Google Search Console';
  const entityLabel = service === 'analytics' ? 'property' : 'site';

  // Auto-select the first property
  useEffect(() => {
    if (properties?.length > 0) setSelected(properties[0].id);
  }, [properties]);

  async function handleConfirm() {
    const prop = properties.find(p => p.id === selected);
    if (!prop) return;
    setSaving(true);
    setError(null);
    try {
      await selectProperty(service, prop.id, prop.displayName);
      onComplete(prop);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position:     'fixed',
        top:          '50%',
        left:         '50%',
        transform:    'translate(-50%, -50%)',
        zIndex:        601,
        width:         'min(520px, 94vw)',
        background:    '#1a1916',
        border:        '1px solid rgba(201,168,76,0.2)',
        borderRadius:   10,
        overflow:       'hidden',
        boxShadow:      '0 28px 80px rgba(0,0,0,0.75)',
        animation:      'propModalIn 0.22s cubic-bezier(0.22,1,0.36,1) forwards',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: G, marginBottom: 5 }}>
              Select {entityLabel}
            </div>
            <div style={{ fontFamily: GD, fontSize: 19, color: '#f5f2ec', fontWeight: 400 }}>
              {serviceName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '2px 4px', marginTop: 2 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 24px', maxHeight: 360, overflowY: 'auto' }}>
          <div style={{ fontFamily: NU, fontSize: 12, color: '#9ca3af', marginBottom: 16, lineHeight: 1.65 }}>
            {properties?.length === 1
              ? `One ${entityLabel} was found in your account. Confirm to begin pulling real data.`
              : `${properties?.length} ${entityLabel}s found. Select the one you want to use for this workspace.`}
          </div>

          {(properties || []).map(prop => (
            <label
              key={prop.id}
              style={{
                display:    'flex',
                alignItems: 'flex-start',
                gap:         12,
                padding:     '12px 14px',
                borderRadius: 6,
                marginBottom: 6,
                cursor:       'pointer',
                background:   selected === prop.id ? 'rgba(201,168,76,0.07)' : 'rgba(255,255,255,0.025)',
                border:       `1px solid ${selected === prop.id ? 'rgba(201,168,76,0.28)' : 'rgba(255,255,255,0.06)'}`,
                transition:   'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="property"
                value={prop.id}
                checked={selected === prop.id}
                onChange={() => setSelected(prop.id)}
                style={{ marginTop: 2, accentColor: G, flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: NU, fontSize: 12, color: '#f5f2ec', marginBottom: 3, fontWeight: 500 }}>
                  {prop.displayName}
                </div>
                <div style={{ fontFamily: NU, fontSize: 10, color: '#6b7280', wordBreak: 'break-all' }}>
                  {prop.id}
                </div>
              </div>
            </label>
          ))}

          {error && (
            <div style={{ fontFamily: NU, fontSize: 11, color: '#ef4444', marginTop: 10, lineHeight: 1.5 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', gap: 8,
        }}>
          <button
            onClick={handleConfirm}
            disabled={!selected || saving}
            style={{
              flex:       1,
              padding:    '9px 0',
              background:  G,
              border:      'none',
              color:       '#fff',
              borderRadius: 5,
              fontFamily:   NU,
              fontSize:     12,
              fontWeight:   600,
              cursor:       (!selected || saving) ? 'not-allowed' : 'pointer',
              opacity:      (!selected || saving) ? 0.7 : 1,
              transition:   'opacity 0.15s',
            }}
          >
            {saving ? 'Saving...' : 'Confirm Selection'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding:     '9px 18px',
              background:   'transparent',
              border:       '1px solid rgba(255,255,255,0.1)',
              color:        '#9ca3af',
              borderRadius:  5,
              fontFamily:    NU,
              fontSize:      12,
              cursor:        'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes propModalIn {
          from { opacity: 0; transform: translate(-50%, -47%) scale(0.96) }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1)    }
        }
      `}</style>
    </>
  );
}
