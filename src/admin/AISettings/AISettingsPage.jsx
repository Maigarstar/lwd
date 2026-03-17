import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

// ── Toggle switch (replaces native checkbox) ──────────────────────────────────
function Toggle({ checked, onChange, C }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: 40, height: 22,
        borderRadius: 11,
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
        backgroundColor: checked ? C.gold : 'rgba(255,255,255,0.1)',
        transition: 'background-color 0.2s ease',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: checked ? 21 : 3,
        width: 16, height: 16,
        borderRadius: '50%',
        backgroundColor: '#fff',
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        display: 'block',
      }} />
    </button>
  );
}

// ── Styled select ─────────────────────────────────────────────────────────────
function Select({ value, onChange, options, C }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '9px 32px 9px 12px',
          fontFamily: NU,
          fontSize: 13,
          backgroundColor: C.dark,
          border: `1px solid ${C.border2}`,
          borderRadius: 6,
          color: C.white,
          cursor: 'pointer',
          appearance: 'none',
          outline: 'none',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ backgroundColor: '#1a1a1a' }}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        width="10" height="6" viewBox="0 0 10 6" fill="none"
      >
        <path d="M1 1l4 4 4-4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function AISettingsPage({ C = {} }) {
  // Fallback palette if C not passed
  const palette = {
    black:   C.black   || '#0a0a0a',
    card:    C.card    || '#141414',
    dark:    C.dark    || '#111111',
    border:  C.border  || 'rgba(255,255,255,0.07)',
    border2: C.border2 || 'rgba(255,255,255,0.12)',
    white:   C.white   || '#ffffff',
    off:     C.off     || '#e8e4dc',
    grey:    C.grey    || 'rgba(255,255,255,0.45)',
    grey2:   C.grey2   || 'rgba(255,255,255,0.28)',
    gold:    C.gold    || '#c9a84c',
  };
  const P = palette;

  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    provider: 'openai',
    api_key: '',
    model: 'gpt-4.1',
    active: false,
  });
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState(null);

  const providers = [
    { value: 'openai',  label: 'ChatGPT (OpenAI)',  models: ['gpt-4.1', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { value: 'gemini',  label: 'Gemini (Google)',   models: ['gemini-pro'] },
    { value: 'claude',  label: 'Claude (Anthropic)', models: ['claude-3-opus', 'claude-3-sonnet'] },
  ];

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-settings');
      if (error) { console.log('No active AI provider configured yet:', error.message); return; }
      if (data) {
        setSettings(data);
        setFormData({ provider: data.provider, api_key: '', model: data.model, active: data.active });
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_usage_log')
        .select('provider, status, total_tokens, estimated_cost, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      if (!error && data) {
        const successCount  = data.filter(d => d.status === 'success').length;
        const errorCount    = data.filter(d => d.status === 'error').length;
        const totalCost     = data.reduce((sum, d) => sum + (d.estimated_cost || 0), 0);
        const totalTokens   = data.reduce((sum, d) => sum + (d.total_tokens || 0), 0);
        setStats({ totalRequests: data.length, successCount, errorCount, totalCost: totalCost.toFixed(4), totalTokens });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.api_key.trim()) { setMessage({ type: 'error', text: 'API key is required' }); return; }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const { data: updated, error: invokeError } = await supabase.functions.invoke('ai-settings', {
        body: { provider: formData.provider, api_key: formData.api_key, model: formData.model, active: formData.active },
      });
      if (invokeError) { setMessage({ type: 'error', text: invokeError.message || 'Failed to save settings' }); setLoading(false); return; }
      if (updated) {
        setSettings(updated);
        setFormData(prev => ({ ...prev, api_key: '', model: updated.model, provider: updated.provider, active: updated.active }));
        setMessage({ type: 'success', text: `Settings saved. Masked key: ${updated.api_key_masked}` });
        setTimeout(fetchStats, 1000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const selectedProvider = providers.find(p => p.value === formData.provider);

  return (
    <div style={{ maxWidth: 760, padding: '32px 28px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: GD, fontSize: 26, fontWeight: 400, color: P.white, margin: '0 0 6px', lineHeight: 1.2 }}>
          AI Settings
        </h1>
        <p style={{ fontFamily: NU, fontSize: 12, color: P.grey, margin: 0, lineHeight: 1.7 }}>
          Configure the AI provider used for listing content generation and assistant features.
        </p>
      </div>

      {/* Alert message */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 20,
          borderRadius: 6,
          backgroundColor: message.type === 'success' ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
          color:           message.type === 'success' ? '#86efac' : '#f87171',
          border:          `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          fontFamily: NU, fontSize: 12, lineHeight: 1.5,
        }}>
          {message.text}
        </div>
      )}

      {/* Current status card */}
      {settings && (
        <div style={{
          backgroundColor: P.card,
          border: `1px solid ${P.border}`,
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px 20px',
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: P.grey2, marginBottom: 4 }}>Provider</div>
            <div style={{ fontFamily: NU, fontSize: 13, color: P.off }}>{settings.provider_display_name}</div>
          </div>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: P.grey2, marginBottom: 4 }}>Model</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: P.off }}>{settings.model}</div>
          </div>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: P.grey2, marginBottom: 4 }}>Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: settings.active ? '#22c55e' : '#ef4444' }} />
              <span style={{ fontFamily: NU, fontSize: 12, color: settings.active ? '#86efac' : '#f87171' }}>
                {settings.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: P.grey2, marginBottom: 4 }}>Masked Key</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: P.grey }}>{settings.api_key_masked}</div>
          </div>
        </div>
      )}

      {/* Config form */}
      <div style={{
        backgroundColor: P.card,
        border: `1px solid ${P.border}`,
        borderRadius: 10,
        padding: '24px 24px 20px',
        marginBottom: 20,
      }}>
        <div style={{ fontFamily: GD, fontSize: 16, fontWeight: 400, color: P.off, marginBottom: 20 }}>
          Provider Configuration
        </div>

        {/* Provider */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: P.grey2, marginBottom: 8 }}>
            Provider
          </label>
          <Select
            value={formData.provider}
            onChange={val => setFormData({ ...formData, provider: val })}
            options={providers.map(p => ({ value: p.value, label: p.label }))}
            C={P}
          />
        </div>

        {/* API Key */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: P.grey2, marginBottom: 8 }}>
            API Key
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={formData.api_key}
              onChange={e => setFormData({ ...formData, api_key: e.target.value })}
              style={{
                flex: 1,
                padding: '9px 12px',
                fontFamily: 'monospace', fontSize: 13,
                backgroundColor: P.dark,
                border: `1px solid ${P.border2}`,
                borderRadius: 6,
                color: P.white,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                padding: '9px 14px',
                backgroundColor: 'transparent',
                border: `1px solid ${P.border2}`,
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: NU, fontSize: 11, color: P.grey,
                flexShrink: 0,
                transition: 'all 0.13s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = P.grey; e.currentTarget.style.color = P.white; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = P.border2; e.currentTarget.style.color = P.grey; }}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <div style={{ fontFamily: NU, fontSize: 10, color: P.grey2, marginTop: 6 }}>
            {selectedProvider?.label} API key. Never shared or logged.
          </div>
        </div>

        {/* Model */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: P.grey2, marginBottom: 8 }}>
            Model
          </label>
          <Select
            value={formData.model}
            onChange={val => setFormData({ ...formData, model: val })}
            options={(selectedProvider?.models || []).map(m => ({ value: m, label: m }))}
            C={P}
          />
        </div>

        {/* Active toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: `1px solid ${P.border}`,
          borderRadius: 6,
          marginBottom: 20,
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 600, color: P.off, marginBottom: 3 }}>
              Activate this provider
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: P.grey, lineHeight: 1.5 }}>
              Only one provider can be active at a time.
            </div>
          </div>
          <Toggle checked={formData.active} onChange={val => setFormData({ ...formData, active: val })} C={P} />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '10px 24px',
            backgroundColor: loading ? 'rgba(201,168,76,0.4)' : P.gold,
            color: loading ? 'rgba(255,255,255,0.6)' : '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: NU, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.04em',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Usage stats */}
      {stats && (
        <div style={{
          backgroundColor: P.card,
          border: `1px solid ${P.border}`,
          borderRadius: 10,
          padding: '20px 24px',
          marginBottom: 20,
        }}>
          <div style={{ fontFamily: GD, fontSize: 16, fontWeight: 400, color: P.off, marginBottom: 16 }}>
            AI Usage (Last 7 Days)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px 16px' }}>
            {[
              { label: 'Total Requests',  value: stats.totalRequests,          color: P.white },
              { label: 'Successful',      value: stats.successCount,           color: '#86efac' },
              { label: 'Errors',          value: stats.errorCount,             color: '#f87171' },
              { label: 'Total Cost',      value: `$${stats.totalCost}`,        color: P.off },
              { label: 'Total Tokens',    value: stats.totalTokens.toLocaleString(), color: P.off },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: `1px solid ${P.border}`,
                borderRadius: 6,
                padding: '12px 14px',
              }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: P.grey2, marginBottom: 6 }}>
                  {label}
                </div>
                <div style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, color, lineHeight: 1 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security notice */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'rgba(201,168,76,0.04)',
        border: '1px solid rgba(201,168,76,0.15)',
        borderRadius: 6,
      }}>
        <div style={{ fontFamily: NU, fontSize: 11, color: P.grey, lineHeight: 1.6 }}>
          <span style={{ color: P.gold, fontWeight: 600 }}>Security: </span>
          Your API key is stored securely on the server. It is never exposed to the browser, logged, or visible in network traffic. All AI calls happen server-side only.
        </div>
      </div>
    </div>
  );
}
