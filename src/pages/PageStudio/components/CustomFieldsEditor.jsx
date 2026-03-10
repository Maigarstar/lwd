/**
 * CustomFieldsEditor — Editor for custom section fields
 *
 * Features:
 * - Multiple field types (text, textarea, richtext, url, number, toggle, image, video)
 * - Create new fields with key validation (no duplicates, safe format)
 * - Enable/disable toggle for each field (controls visibility in preview)
 * - Delete field with confirmation
 * - Real-time form binding
 */

import { useState } from 'react';

const FIELD_TYPES = ['text', 'textarea', 'richtext', 'url', 'number', 'toggle', 'image', 'video'];

export default function CustomFieldsEditor({ section, onSectionChange, C, NU }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ key: '', type: 'text', label: '' });
  const [errors, setErrors] = useState({});

  // Validate field key: alphanumeric, underscore, hyphen, no duplicates
  const validateKey = (key) => {
    const newErrors = {};

    if (!key.trim()) {
      newErrors.key = 'Key is required';
    } else if (!/^[a-z0-9_-]+$/.test(key)) {
      newErrors.key = 'Only lowercase letters, numbers, hyphens, underscores allowed';
    } else if (section.customFields?.some(f => f.id === key)) {
      newErrors.key = 'This key already exists';
    }

    return newErrors;
  };

  const handleCreateField = () => {
    const keyErrors = validateKey(formData.key);
    const newErrors = { ...keyErrors };

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const newField = {
      id: formData.key,
      type: formData.type,
      label: formData.label,
      enabled: true,
      value: '',
      placeholder: '',
    };

    const updatedFields = [...(section.customFields || []), newField];
    onSectionChange(section.id, 'customFields', updatedFields);

    setFormData({ key: '', type: 'text', label: '' });
    setErrors({});
    setShowCreateForm(false);
  };

  const hasFields = section?.customFields?.length > 0;

  const handleFieldChange = (fieldId, value) => {
    const updatedFields = section.customFields.map(f =>
      f.id === fieldId ? { ...f, value } : f
    );
    onSectionChange(section.id, 'customFields', updatedFields);
  };

  const handleToggleField = (fieldId) => {
    const updatedFields = section.customFields.map(f =>
      f.id === fieldId ? { ...f, enabled: !f.enabled } : f
    );
    onSectionChange(section.id, 'customFields', updatedFields);
  };

  const handleDeleteField = (fieldId) => {
    if (confirm('Delete this custom field permanently? This cannot be undone.')) {
      const updatedFields = section.customFields.filter(f => f.id !== fieldId);
      onSectionChange(section.id, 'customFields', updatedFields);
    }
  };

  return (
    <div
      style={{
        backgroundColor: C.card,
        borderRadius: 4,
        padding: 12,
        marginTop: 12,
        borderLeft: `3px solid ${C.gold || '#FFD700'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p
          style={{
            fontFamily: NU,
            fontSize: 9,
            fontWeight: 600,
            color: C.grey,
            textTransform: 'uppercase',
            margin: 0,
            letterSpacing: 0.5,
          }}
        >
          ✨ Custom Fields
        </p>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          title="Create a new custom field"
          style={{
            padding: '4px 8px',
            backgroundColor: C.gold || '#FFD700',
            color: C.black,
            border: 'none',
            borderRadius: 3,
            fontFamily: NU,
            fontSize: 9,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s ease',
          }}
          onMouseOver={(e) => (e.target.style.opacity = '0.8')}
          onMouseOut={(e) => (e.target.style.opacity = '1')}
        >
          + Add Field
        </button>
      </div>

      {/* CREATE FIELD FORM */}
      {showCreateForm && (
        <div style={{ backgroundColor: `${C.gold || '#FFD700'}15`, padding: 10, borderRadius: 3, marginBottom: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontFamily: NU, fontSize: 9, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Field Key
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              placeholder="e.g., hero_tagline"
              style={{
                width: '100%',
                padding: '6px 8px',
                fontFamily: NU,
                fontSize: 11,
                border: `1px solid ${errors.key ? '#FF6B6B' : C.border}`,
                borderRadius: 2,
                backgroundColor: C.black,
                color: C.white,
                boxSizing: 'border-box',
              }}
            />
            {errors.key && <p style={{ fontFamily: NU, fontSize: 8, color: '#FF6B6B', margin: '3px 0 0 0' }}>{errors.key}</p>}
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontFamily: NU, fontSize: 9, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontFamily: NU,
                fontSize: 11,
                border: `1px solid ${C.border}`,
                borderRadius: 2,
                backgroundColor: C.black,
                color: C.white,
                boxSizing: 'border-box',
              }}
            >
              {FIELD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontFamily: NU, fontSize: 9, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Label
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Hero Tagline"
              style={{
                width: '100%',
                padding: '6px 8px',
                fontFamily: NU,
                fontSize: 11,
                border: `1px solid ${errors.label ? '#FF6B6B' : C.border}`,
                borderRadius: 2,
                backgroundColor: C.black,
                color: C.white,
                boxSizing: 'border-box',
              }}
            />
            {errors.label && <p style={{ fontFamily: NU, fontSize: 8, color: '#FF6B6B', margin: '3px 0 0 0' }}>{errors.label}</p>}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleCreateField}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: C.gold || '#FFD700',
                color: C.black,
                border: 'none',
                borderRadius: 2,
                fontFamily: NU,
                fontSize: 9,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: C.grey,
                color: C.grey2,
                border: 'none',
                borderRadius: 2,
                fontFamily: NU,
                fontSize: 9,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* EXISTING FIELDS */}
      {!hasFields && !showCreateForm && (
        <p style={{ fontFamily: NU, fontSize: 10, color: C.grey2, margin: 0, fontStyle: 'italic' }}>
          No custom fields yet. Click "Add Field" to create one.
        </p>
      )}

      {section.customFields?.map((field) => (
        <div key={field.id} style={{ marginBottom: 14 }}>
          {/* Field Header with Toggle & Delete */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flex: 1,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={field.enabled}
                onChange={() => handleToggleField(field.id)}
                style={{
                  cursor: 'pointer',
                  width: 14,
                  height: 14,
                }}
              />
              <span
                style={{
                  fontFamily: NU,
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.white,
                }}
              >
                {field.label}
              </span>
              <span
                style={{
                  fontSize: 8,
                  color: C.grey2,
                  fontFamily: 'monospace',
                  marginLeft: 4,
                }}
              >
                ({field.type})
              </span>
            </label>
            <button
              onClick={() => handleDeleteField(field.id)}
              title="Delete this custom field"
              style={{
                padding: '3px 6px',
                backgroundColor: '#FF6B6B',
                color: 'white',
                border: 'none',
                borderRadius: 2,
                fontFamily: NU,
                fontSize: 9,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                opacity: 1,
              }}
              onMouseOver={(e) => (e.target.style.opacity = '0.8')}
              onMouseOut={(e) => (e.target.style.opacity = '1')}
            >
              ✕
            </button>
          </div>

          {/* Conditional Field Input Based on Type */}
          {field.enabled && (
            <>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={field.value || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: NU,
                    fontSize: 12,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    backgroundColor: C.black,
                    color: C.white,
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={field.value || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: NU,
                    fontSize: 12,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    backgroundColor: C.black,
                    color: C.white,
                    boxSizing: 'border-box',
                    minHeight: 60,
                    resize: 'vertical',
                  }}
                />
              )}

              {field.type === 'url' && (
                <input
                  type="url"
                  value={field.value || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || 'https://...'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: NU,
                    fontSize: 12,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    backgroundColor: C.black,
                    color: C.white,
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={field.value || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || '0'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: NU,
                    fontSize: 12,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    backgroundColor: C.black,
                    color: C.white,
                    boxSizing: 'border-box',
                  }}
                />
              )}

              {field.type === 'toggle' && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={field.value === true}
                    onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                    style={{
                      cursor: 'pointer',
                      width: 16,
                      height: 16,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: NU,
                      fontSize: 11,
                      color: C.grey2,
                      fontWeight: 500,
                    }}
                  >
                    {field.value ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </label>
              )}

              {field.type === 'richtext' && (
                <textarea
                  value={field.value || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder || 'Enter rich text...'}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: NU,
                    fontSize: 12,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    backgroundColor: C.black,
                    color: C.white,
                    boxSizing: 'border-box',
                    minHeight: 80,
                    resize: 'vertical',
                  }}
                />
              )}
            </>
          )}

          {!field.enabled && (
            <p
              style={{
                fontFamily: NU,
                fontSize: 10,
                color: C.grey2,
                fontStyle: 'italic',
                margin: '6px 0 0 0',
              }}
            >
              (This field is hidden in the preview)
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
