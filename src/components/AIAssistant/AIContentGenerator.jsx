import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

/**
 * AIContentGenerator Component
 *
 * Reusable AI content generation UI for ListingStudio
 * Handles: Generate button, loading state, preview, insert/reject actions
 *
 * Props:
 *   - feature: string - Type of content ('about_description', 'seo_title', etc.)
 *   - systemPrompt: string - System context for AI
 *   - userPrompt: string - User request for content
 *   - venueId: string (optional) - Venue being edited
 *   - onInsert: function - Callback when user clicks Insert
 *   - label: string - Display label for the button
 *   - disabled: boolean - Disable generation
 *   - C: object - Color tokens
 */

export default function AIContentGenerator({
  feature,
  systemPrompt,
  userPrompt,
  venueId,
  onInsert,
  label = 'Generate',
  disabled = false,
  C = {},
}) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      // Call Supabase Edge Function (ai-generate)
      // Uses same pattern as vendorAccountsService.js and emailService.js
      const { data, error: invokeError } = await supabase.functions.invoke('ai-generate', {
        body: JSON.stringify({
          feature,
          systemPrompt,
          userPrompt,
          venue_id: venueId,
        }),
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to generate content');
      }

      if (!data) {
        throw new Error('No response from AI service');
      }

      // Display suggestion for user approval
      setSuggestion({
        text: data.text,
        provider: data.provider,
        model: data.model,
        tokens: data.tokens_used,
        cost: data.estimated_cost,
      });
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (suggestion && onInsert) {
      onInsert(suggestion.text);
      setSuggestion(null);
      setError(null);
    }
  };

  const handleReject = () => {
    setSuggestion(null);
  };

  // Default colors if not provided
  const colors = {
    gold: C.gold || '#8a6d1b',
    black: C.black || '#1f1f1f',
    border: C.border || '#ddd',
    borderLight: C.border2 || '#eee',
    textLight: C.textLight || '#666',
    textMuted: C.textMuted || '#999',
    success: '#28a745',
    error: '#dc3545',
    ...C,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || disabled}
        style={{
          padding: '10px 16px',
          backgroundColor: loading || disabled ? '#ccc' : colors.gold,
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: loading || disabled ? 'not-allowed' : 'pointer',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s',
        }}
      >
        <span>✨</span>
        {loading ? 'Generating...' : label}
      </button>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#f8d7da',
            border: `1px solid #f5c6cb`,
            borderRadius: 4,
            fontSize: 12,
            color: '#721c24',
            lineHeight: 1.5,
          }}
        >
          <strong>⚠ Error:</strong> {error}
        </div>
      )}

      {/* Suggestion Preview */}
      {suggestion && (
        <div
          style={{
            padding: 16,
            backgroundColor: '#f0f7ff',
            border: `1px solid ${colors.borderLight}`,
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Metadata */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              fontSize: 11,
              color: colors.textMuted,
              borderBottom: `1px solid ${colors.borderLight}`,
              paddingBottom: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {suggestion.provider && (
              <span>
                <strong>Provider:</strong> {suggestion.provider}
              </span>
            )}
            {suggestion.model && (
              <span>
                <strong>Model:</strong> {suggestion.model}
              </span>
            )}
            {suggestion.tokens !== undefined && (
              <span>
                <strong>Tokens:</strong> {suggestion.tokens}
              </span>
            )}
            <span>
              <strong>Cost:</strong> ${Number(suggestion.cost || 0).toFixed(4)}
            </span>
          </div>

          {/* Generated Content Preview */}
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              padding: '12px 0',
              fontSize: 13,
              color: colors.black,
              lineHeight: 1.6,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {suggestion.text}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              paddingTop: 8,
              borderTop: `1px solid ${colors.borderLight}`,
            }}
          >
            <button
              onClick={handleInsert}
              style={{
                flex: 1,
                padding: '10px 12px',
                backgroundColor: colors.success,
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              ✓ Insert
            </button>
            <button
              onClick={handleReject}
              style={{
                flex: 1,
                padding: '10px 12px',
                backgroundColor: '#f0f0f0',
                color: colors.black,
                border: `1px solid ${colors.border}`,
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              ✗ Reject
            </button>
          </div>
        </div>
      )}

      {/* Info Text */}
      {!suggestion && !error && (
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: colors.textMuted,
            fontStyle: 'italic',
          }}
        >
          Click "Generate with AI" to create luxury editorial content for this field.
          Preview it before inserting.
        </p>
      )}
    </div>
  );
}
