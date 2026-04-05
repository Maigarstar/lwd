/**
 * InternalLinksSection.jsx
 *
 * Displays detected venue/planner mentions and approved links in article editor.
 * Part of Phase 3: Internal Linking Engine.
 *
 * Props:
 *   - formData: current article form data
 *   - approvedLinks: array of approved { name, type, entityId, context }
 *   - onAddLink: (mention) => void
 *   - onRemoveLink: (entityId, type) => void
 *   - loading: boolean
 */

import { useState, useEffect } from 'react';
import { extractMentionsFromPost } from '../../services/magazineService';

const GOLD = '#C9A84C';

export default function InternalLinksSection({
  formData,
  approvedLinks = [],
  onAddLink,
  onRemoveLink,
  loading = false,
}) {
  const [detectedMentions, setDetectedMentions] = useState([]);
  const [extracting, setExtracting] = useState(false);

  // Extract mentions when article content changes
  useEffect(() => {
    if (!formData) return;

    setExtracting(true);
    extractMentionsFromPost(formData)
      .then(mentions => {
        // Filter out already approved mentions
        const approvedIds = new Set(approvedLinks.map(l => `${l.type}:${l.entityId}`));
        const unapprovd = mentions.filter(
          m => !approvedIds.has(`${m.type}:${m.entityId}`)
        );
        setDetectedMentions(unapprovd);
      })
      .catch(err => {
        console.error('[InternalLinksSection] extractMentionsFromPost failed:', err);
        setDetectedMentions([]);
      })
      .finally(() => setExtracting(false));
  }, [formData, approvedLinks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Detected Mentions */}
      <div>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 12,
        }}>
          🔍 Detected Mentions {extracting && '(scanning...)'}
        </div>

        {detectedMentions.length === 0 ? (
          <div style={{
            fontSize: 13,
            color: '#999',
            fontStyle: 'italic',
            padding: '12px 0',
          }}>
            {extracting ? 'Scanning article for venue and planner mentions...' : 'No new mentions found'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {detectedMentions.map((mention, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'rgba(201, 168, 76, 0.08)',
                  border: '1px solid rgba(201, 168, 76, 0.2)',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#1a1208', marginBottom: 3 }}>
                    {mention.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>
                    {mention.type === 'venue' ? '📍 Venue' : '👤 Planner'} • Confidence: {Math.round(mention.confidence * 100)}%
                  </div>
                </div>
                <button
                  onClick={() => onAddLink?.(mention)}
                  style={{
                    padding: '6px 12px',
                    background: GOLD,
                    border: 'none',
                    borderRadius: 4,
                    color: '#1a1208',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    marginLeft: 8,
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Link
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Links */}
      {approvedLinks.length > 0 && (
        <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 12,
          }}>
            ✓ Approved Links ({approvedLinks.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approvedLinks.map((link, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: 'rgba(76, 175, 80, 0.08)',
                  border: '1px solid rgba(76, 175, 80, 0.2)',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#1a1208', marginBottom: 3 }}>
                    {link.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>
                    {link.type === 'venue' ? '📍 Venue' : '👤 Planner'}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveLink?.(link.entityId, link.type)}
                  style={{
                    padding: '6px 12px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    color: '#666',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    marginLeft: 8,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eeeeee'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f5f5f5'}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{
        fontSize: 11,
        color: '#999',
        padding: '12px 0',
        borderTop: '1px solid #eee',
      }}>
        ℹ️ Internal links help readers discover related venues and planners mentioned in your article.
        Approved links will appear in the published article.
      </div>
    </div>
  );
}
