// VenueContentEditorSection.jsx
// Admin UI for managing venue content: section intros, visibility, and approval status
// Tracks editorial ownership via updated_by field for content accountability

import { useState, useEffect, useCallback } from 'react';
import { saveVenueContent } from '../../../services/venueContentService';
import { useBreakpoint } from '../../../hooks/useWindowWidth';
import { supabase } from '../../../lib/supabaseClient';

const SECTION_IDS = ['overview', 'spaces', 'dining', 'rooms', 'art', 'golf', 'weddings'];

const SECTION_LABELS = {
  overview: 'Overview',
  spaces: 'Event Spaces',
  dining: 'Dining & Culinary',
  rooms: 'Accommodation & Rooms',
  art: 'Art & Collections',
  golf: 'Golf',
  weddings: 'Weddings & Events',
};

const SECTION_DESCRIPTIONS = {
  overview: 'Brief introduction to the venue and its unique qualities',
  spaces: 'Description of event spaces and capacity',
  dining: 'Information about dining concepts and restaurants',
  rooms: 'Details about accommodation options',
  art: 'Art collection and cultural elements',
  golf: 'Golf facilities and experiences',
  weddings: 'Wedding services and offerings',
};

/**
 * VenueContentEditorSection
 * Manages section intros, visibility toggles, and approval status for a venue
 */
export default function VenueContentEditorSection({
  venueId,
  currentContent,
  onContentSaved,
}) {
  const { isMobile } = useBreakpoint();
  const [activeTab, setActiveTab] = useState('intros');
  const [formData, setFormData] = useState({
    sectionIntros: {},
    sectionVisibility: {
      overview: true,
      spaces: true,
      dining: true,
      rooms: true,
      art: true,
      golf: true,
      weddings: true,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [adminUserId, setAdminUserId] = useState(null);

  // Get current admin user on mount (for editorial accountability)
  useEffect(() => {
    const getAdminUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.warn('Failed to get admin user:', error.message);
          return;
        }
        if (user?.id) {
          setAdminUserId(user.id);
        }
      } catch (err) {
        console.warn('Error fetching admin user:', err.message);
      }
    };

    getAdminUser();
  }, []);

  // Initialize form with current content
  useEffect(() => {
    if (currentContent) {
      setFormData({
        sectionIntros: currentContent.sectionIntros || {},
        sectionVisibility: currentContent.sectionVisibility || {
          overview: true,
          spaces: true,
          dining: true,
          rooms: true,
          art: true,
          golf: true,
          weddings: true,
        },
      });
    }
  }, [currentContent]);

  // Debounced save on intro change
  const handleIntroChange = useCallback(
    (sectionId, value) => {
      setFormData(prev => ({
        ...prev,
        sectionIntros: {
          ...prev.sectionIntros,
          [sectionId]: value || null,
        },
      }));

      // Clear previous timeout
      if (saveTimeout) clearTimeout(saveTimeout);

      // Set new debounced save
      const timeout = setTimeout(async () => {
        await handleSave({
          sectionIntros: {
            ...formData.sectionIntros,
            [sectionId]: value || null,
          },
          sectionVisibility: formData.sectionVisibility,
        });
      }, 1500);

      setSaveTimeout(timeout);
    },
    [formData, saveTimeout]
  );

  // Immediate save on visibility toggle
  const handleVisibilityToggle = useCallback(
    async (sectionId) => {
      const newVisibility = {
        ...formData.sectionVisibility,
        [sectionId]: !formData.sectionVisibility[sectionId],
      };

      setFormData(prev => ({
        ...prev,
        sectionVisibility: newVisibility,
      }));

      // Immediate save
      await handleSave({
        sectionIntros: formData.sectionIntros,
        sectionVisibility: newVisibility,
      });
    },
    [formData]
  );

  // Save to database with admin user ID for editorial tracking
  const handleSave = async (data) => {
    if (!venueId) {
      setSaveStatus({ type: 'error', message: 'Venue ID is required' });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Pass adminUserId to track who made the changes
      const result = await saveVenueContent(venueId, data, adminUserId);

      if (result.error) {
        setSaveStatus({
          type: 'error',
          message: `Save failed: ${result.error}`,
        });
      } else {
        setSaveStatus({
          type: 'success',
          message: 'Content saved successfully',
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSaveStatus(null), 3000);

        if (onContentSaved) {
          onContentSaved(result);
        }
      }
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: `Save error: ${err.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // TAB STYLES
  const tabButtonStyle = (isActive) => ({
    padding: '10px 16px',
    background: isActive ? '#f5f2ec' : 'transparent',
    border: isActive ? '1px solid #e4e0d8' : '1px solid transparent',
    borderRadius: 4,
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#1a1a18' : '#6b6560',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  // SECTION INTRO EDITOR
  const renderIntroEditor = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {SECTION_IDS.map(sectionId => (
        <div
          key={sectionId}
          style={{
            padding: '20px',
            background: '#ffffff',
            border: '1px solid #e4e0d8',
            borderRadius: 6,
          }}
        >
          {/* Section title */}
          <div style={{ marginBottom: 12 }}>
            <h3 style={{
              margin: 0,
              fontFamily: 'var(--font-heading-primary)',
              fontSize: 16,
              fontWeight: 400,
              color: '#1a1a18',
            }}>
              {SECTION_LABELS[sectionId]}
            </h3>
            <p style={{
              margin: '6px 0 0',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: '#6b6560',
              lineHeight: 1.5,
            }}>
              {SECTION_DESCRIPTIONS[sectionId]}
            </p>
          </div>

          {/* Intro textarea */}
          <textarea
            value={formData.sectionIntros[sectionId] || ''}
            onChange={e => handleIntroChange(sectionId, e.target.value)}
            placeholder={`Enter section intro for ${SECTION_LABELS[sectionId]}`}
            style={{
              width: '100%',
              minHeight: 100,
              padding: '12px',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: '#1a1a18',
              border: '1px solid #e4e0d8',
              borderRadius: 4,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />

          {/* Character count */}
          <p style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: '#6b6560',
            textAlign: 'right',
          }}>
            {(formData.sectionIntros[sectionId] || '').length} characters
          </p>
        </div>
      ))}
    </div>
  );

  // VISIBILITY TOGGLE EDITOR
  const renderVisibilityEditor = () => (
    <div style={{
      padding: '24px',
      background: '#ffffff',
      border: '1px solid #e4e0d8',
      borderRadius: 6,
    }}>
      <h3 style={{
        margin: '0 0 24px',
        fontFamily: 'var(--font-heading-primary)',
        fontSize: 16,
        fontWeight: 400,
        color: '#1a1a18',
      }}>
        Section Visibility
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SECTION_IDS.map(sectionId => (
          <div
            key={sectionId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              background: '#faf9f6',
              borderRadius: 4,
              border: '1px solid #f0ede5',
            }}
          >
            <div>
              <p style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 500,
                color: '#1a1a18',
              }}>
                {SECTION_LABELS[sectionId]}
              </p>
              <p style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: '#6b6560',
              }}>
                {formData.sectionVisibility[sectionId] ? 'Visible' : 'Hidden'}
              </p>
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => handleVisibilityToggle(sectionId)}
              style={{
                position: 'relative',
                width: 48,
                height: 26,
                padding: 2,
                background: formData.sectionVisibility[sectionId]
                  ? '#C9A84C'
                  : '#e4e0d8',
                border: 'none',
                borderRadius: 13,
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (formData.sectionVisibility[sectionId]) {
                  e.currentTarget.style.background = '#d4b656';
                } else {
                  e.currentTarget.style.background = '#dbd6ce';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = formData.sectionVisibility[sectionId]
                  ? '#C9A84C'
                  : '#e4e0d8';
              }}
            >
              {/* Toggle dot */}
              <div
                style={{
                  position: 'absolute',
                  width: 22,
                  height: 22,
                  background: '#ffffff',
                  borderRadius: 11,
                  top: 2,
                  left: formData.sectionVisibility[sectionId] ? 24 : 2,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // APPROVAL STATUS DISPLAY
  const renderApprovalStatus = () => (
    <div style={{
      padding: '24px',
      background: '#ffffff',
      border: '1px solid #e4e0d8',
      borderRadius: 6,
    }}>
      <h3 style={{
        margin: '0 0 20px',
        fontFamily: 'var(--font-heading-primary)',
        fontSize: 16,
        fontWeight: 400,
        color: '#1a1a18',
      }}>
        Approval Status
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Fact Checked */}
        <div style={{
          padding: '12px',
          background: currentContent?.factChecked ? '#f0fdf4' : '#faf9f6',
          border: `1px solid ${currentContent?.factChecked ? '#d4edda' : '#e4e0d8'}`,
          borderRadius: 4,
        }}>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: currentContent?.factChecked ? '#155724' : '#6b6560',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {currentContent?.factChecked ? '✓ Fact Checked' : 'Not Fact Checked'}
          </p>
        </div>

        {/* Approved */}
        <div style={{
          padding: '12px',
          background: currentContent?.approved ? '#f0fdf4' : '#faf9f6',
          border: `1px solid ${currentContent?.approved ? '#d4edda' : '#e4e0d8'}`,
          borderRadius: 4,
        }}>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: currentContent?.approved ? '#155724' : '#6b6560',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {currentContent?.approved ? '✓ Approved' : 'Not Approved'}
          </p>
        </div>

        {/* Last Reviewed */}
        {currentContent?.lastReviewedAt && (
          <div style={{
            padding: '12px',
            background: '#faf9f6',
            border: '1px solid #e4e0d8',
            borderRadius: 4,
          }}>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: '#6b6560',
            }}>
              Last Reviewed:
              <br />
              <span style={{ fontWeight: 600, color: '#1a1a18' }}>
                {new Date(currentContent.lastReviewedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>
        )}
      </div>

      <p style={{
        margin: '16px 0 0',
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        color: '#6b6560',
        lineHeight: 1.6,
      }}>
        Approval status is managed by administrators only. Contact your manager to update these settings.
      </p>
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Section header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          margin: '0 0 8px',
          fontFamily: 'var(--font-heading-primary)',
          fontSize: isMobile ? 24 : 32,
          fontWeight: 400,
          color: '#1a1a18',
        }}>
          Venue Content Management
        </h2>
        <p style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: '#6b6560',
          lineHeight: 1.6,
        }}>
          Customize section introductions, control which sections are visible to visitors, and manage approval status.
        </p>
      </div>

      {/* Save status message */}
      {saveStatus && (
        <div style={{
          marginBottom: 20,
          padding: '12px 16px',
          background: saveStatus.type === 'error' ? '#fee' : '#efe',
          border: `1px solid ${saveStatus.type === 'error' ? '#fcc' : '#cfc'}`,
          borderRadius: 4,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: saveStatus.type === 'error' ? '#c33' : '#3a3',
        }}>
          {saveStatus.message}
        </div>
      )}

      {/* Tab buttons */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '1px solid #e4e0d8',
        paddingBottom: 0,
      }}>
        <button
          onClick={() => setActiveTab('intros')}
          style={tabButtonStyle(activeTab === 'intros')}
        >
          Section Intros
        </button>
        <button
          onClick={() => setActiveTab('visibility')}
          style={tabButtonStyle(activeTab === 'visibility')}
        >
          Visibility
        </button>
        <button
          onClick={() => setActiveTab('approval')}
          style={tabButtonStyle(activeTab === 'approval')}
        >
          Approval Status
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'intros' && renderIntroEditor()}
      {activeTab === 'visibility' && renderVisibilityEditor()}
      {activeTab === 'approval' && renderApprovalStatus()}

      {/* Save button (shown for intros tab) */}
      {activeTab === 'intros' && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() =>
              handleSave({
                sectionIntros: formData.sectionIntros,
                sectionVisibility: formData.sectionVisibility,
              })
            }
            disabled={isSaving}
            style={{
              padding: '12px 24px',
              background: '#C9A84C',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => {
              if (!isSaving) e.currentTarget.style.opacity = '0.85';
            }}
            onMouseLeave={e => {
              if (!isSaving) e.currentTarget.style.opacity = '1';
            }}
          >
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
