import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AISettingsPage() {
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
    { value: 'openai', label: 'ChatGPT (OpenAI)', models: ['gpt-4.1', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { value: 'gemini', label: 'Gemini (Google)', models: ['gemini-pro'] },
    { value: 'claude', label: 'Claude (Anthropic)', models: ['claude-3-opus', 'claude-3-sonnet'] },
  ];

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      // Call Supabase Edge Function to get settings (with masked key)
      // No body = GET request
      const { data, error } = await supabase.functions.invoke('ai-settings');

      if (error) {
        console.log('No active AI provider configured yet:', error.message);
        return;
      }

      if (data) {
        setSettings(data);
        setFormData({
          provider: data.provider,
          api_key: '', // NEVER load real key into form
          model: data.model,
          active: data.active,
        });
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    }
  };

  const fetchStats = async () => {
    try {
      // Get usage statistics from database
      const { data, error } = await supabase
        .from('ai_usage_log')
        .select('provider, status, total_tokens, estimated_cost, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!error && data) {
        const successCount = data.filter(d => d.status === 'success').length;
        const errorCount = data.filter(d => d.status === 'error').length;
        const totalCost = data.reduce((sum, d) => sum + (d.estimated_cost || 0), 0);
        const totalTokens = data.reduce((sum, d) => sum + (d.total_tokens || 0), 0);

        setStats({
          totalRequests: data.length,
          successCount,
          errorCount,
          totalCost: totalCost.toFixed(4),
          totalTokens,
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSave = async () => {
    // Validate
    if (!formData.api_key.trim()) {
      setMessage({ type: 'error', text: 'API key is required' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Call Supabase Edge Function to update settings
      // Supabase client handles auth token automatically
      // Passing a body makes it a POST request automatically
      // Pass body as object (NOT JSON.stringify) — Supabase client auto-serializes
      // and sets Content-Type: application/json correctly
      const { data: updated, error: invokeError } = await supabase.functions.invoke('ai-settings', {
        body: {
          provider: formData.provider,
          api_key: formData.api_key, // Real key sent in POST, stored server-side
          model: formData.model,
          active: formData.active,
        },
      });

      if (invokeError) {
        setMessage({ type: 'error', text: invokeError.message || 'Failed to save settings' });
        setLoading(false);
        return;
      }

      if (updated) {
        setSettings(updated);
        // SECURITY: Clear api_key from frontend state immediately after successful save
        // This ensures the real key doesn't linger in memory longer than necessary
        // Only keep masked key from server response for verification display
        setFormData(prev => ({
          ...prev,
          api_key: '', // ← Clear the real key from frontend state
          model: updated.model,
          provider: updated.provider,
          active: updated.active,
        }));

        setMessage({
          type: 'success',
          text: `AI settings updated successfully. Masked key: ${updated.api_key_masked}`,
        });

        // Refresh stats
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 40 }}>
      <h1 style={{ marginBottom: 30 }}>AI Settings</h1>

      {/* Message Alert */}
      {message.text && (
        <div
          style={{
            padding: 15,
            marginBottom: 20,
            borderRadius: 4,
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Settings Form */}
      <div style={{ backgroundColor: '#f9f9f9', padding: 30, borderRadius: 4, marginBottom: 30 }}>
        <h2 style={{ fontSize: 16, marginBottom: 20, color: '#333' }}>AI Provider Configuration</h2>

        {/* Current Status */}
        {settings && (
          <div style={{ marginBottom: 30, padding: 15, backgroundColor: '#f0f7ff', borderRadius: 4 }}>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 14, color: '#666' }}>
              <strong>Current Provider:</strong> {settings.provider_display_name}
            </p>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 14, color: '#666' }}>
              <strong>Model:</strong> {settings.model}
            </p>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 14, color: '#666' }}>
              <strong>Status:</strong> <span style={{ color: settings.active ? '#28a745' : '#dc3545' }}>
                {settings.active ? '✓ Active' : '✗ Inactive'}
              </span>
            </p>
            <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
              <strong>Masked Key:</strong> {settings.api_key_masked}
            </p>
          </div>
        )}

        {/* Provider Selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
            Provider
          </label>
          <select
            value={formData.provider}
            onChange={e => setFormData({ ...formData, provider: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            {providers.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* API Key Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
            API Key
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={formData.api_key}
              onChange={e => setFormData({ ...formData, api_key: e.target.value })}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14,
              }}
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                padding: '10px 15px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#666' }}>
            {selectedProvider?.label} API key. Never shared or logged.
          </p>
        </div>

        {/* Model Selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
            Model
          </label>
          <select
            value={formData.model}
            onChange={e => setFormData({ ...formData, model: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            {selectedProvider?.models.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* Active Toggle */}
        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Activate this provider</span>
          </label>
          <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#666', marginLeft: 28 }}>
            Only one provider can be active at a time. Activating this will deactivate others.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#1f1f1f',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Usage Statistics */}
      {stats && (
        <div style={{ backgroundColor: '#fff', padding: 30, borderRadius: 4, border: '1px solid #ddd' }}>
          <h2 style={{ fontSize: 16, marginBottom: 20, color: '#333' }}>AI Usage (Last 7 Days)</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#666', marginBottom: 5 }}>Total Requests</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1f1f1f' }}>
                {stats.totalRequests}
              </p>
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#666', marginBottom: 5 }}>Successful</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#28a745' }}>
                {stats.successCount}
              </p>
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#666', marginBottom: 5 }}>Errors</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#dc3545' }}>
                {stats.errorCount}
              </p>
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#666', marginBottom: 5 }}>Total Cost</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1f1f1f' }}>
                ${stats.totalCost}
              </p>
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#666', marginBottom: 5 }}>Total Tokens</p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1f1f1f' }}>
                {stats.totalTokens.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div style={{ marginTop: 30, padding: 15, backgroundColor: '#fffbea', borderRadius: 4, border: '1px solid #ffeccc' }}>
        <p style={{ margin: 0, fontSize: 12, color: '#856404', lineHeight: 1.6 }}>
          <strong>🔒 Security:</strong> Your API key is stored securely on the server. It is never exposed to the browser,
          logged, or visible in network traffic. All AI calls happen server-side only.
        </p>
      </div>
    </div>
  );
}
