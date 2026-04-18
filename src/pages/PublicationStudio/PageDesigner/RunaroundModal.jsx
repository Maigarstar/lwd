import { useState } from 'react';
import { GOLD, DARK, BORDER, MUTED, NU } from './designerConstants';

/**
 * Simple modal for managing text runaround obstacles.
 * Shows list of obstacles, lets user add/remove them.
 */
export default function RunaroundModal({
  open,
  onClose,
  textbox,
  canvas,
  onAddObstacle,
  onRemoveObstacle,
  onSetGap,
}) {
  if (!open || !textbox) return null;

  const obstacles = textbox.runaroundTargetIds || [];
  const gap = textbox.runaroundGap ?? 12;

  // Get names of obstacles for display
  const getObstacleName = (id) => {
    const obj = canvas?.getObjects().find(o => o.id === id);
    if (!obj) return `Unknown (${id.slice(0, 8)})`;
    if (obj.isImagePlaceholder) return `Image: ${obj.name || 'Untitled'}`;
    if (obj.type === 'rect') return `Rectangle: ${obj.name || 'Shape'}`;
    if (obj.type === 'circle') return `Circle: ${obj.name || 'Shape'}`;
    return obj.name || obj.type || 'Object';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        background: DARK,
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <h2 style={{
            fontFamily: NU,
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            margin: 0,
          }}>
            Text Wrap Around Images
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: MUTED,
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Instructions */}
        <p style={{
          fontFamily: NU,
          fontSize: 12,
          color: MUTED,
          lineHeight: 1.6,
          marginBottom: 20,
        }}>
          Select images and shapes on the canvas to wrap text around them. Text will flow around all obstacles.
        </p>

        {/* Gap Control */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            fontFamily: NU,
            fontSize: 12,
            color: MUTED,
            display: 'block',
            marginBottom: 8,
          }}>
            Space between text and obstacles: <strong>{gap}px</strong>
          </label>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={gap}
            onChange={(e) => onSetGap?.(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: GOLD,
            }}
          />
        </div>

        {/* Obstacles List */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            fontFamily: NU,
            fontSize: 12,
            color: MUTED,
            display: 'block',
            marginBottom: 12,
          }}>
            Selected obstacles:
          </label>

          {obstacles.length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
              padding: '12px',
              color: MUTED,
              fontFamily: NU,
              fontSize: 12,
              textAlign: 'center',
            }}>
              Click "Add Obstacle" below to select images or shapes
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {obstacles.map((id) => (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(201,168,76,0.1)',
                    border: `1px solid ${GOLD}`,
                    borderRadius: 4,
                    padding: '10px 12px',
                  }}
                >
                  <span style={{
                    fontFamily: NU,
                    fontSize: 12,
                    color: '#fff',
                  }}>
                    ⊙ {getObstacleName(id)}
                  </span>
                  <button
                    onClick={() => onRemoveObstacle?.(id)}
                    style={{
                      background: 'rgba(255,80,80,0.2)',
                      border: '1px solid rgba(255,80,80,0.4)',
                      borderRadius: 3,
                      color: '#FF6060',
                      fontFamily: NU,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
        }}>
          <button
            onClick={() => onAddObstacle?.()}
            style={{
              flex: 1,
              background: GOLD,
              color: '#000',
              border: 'none',
              borderRadius: 4,
              fontFamily: NU,
              fontSize: 12,
              fontWeight: 700,
              padding: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.8'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            + Add Obstacle
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
              fontFamily: NU,
              fontSize: 12,
              fontWeight: 700,
              padding: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
