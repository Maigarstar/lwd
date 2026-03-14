import React, { useState, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { submitReview } from '../../services/reviewService';
import { SUB_RATING_KEYS, EVENT_TYPES } from '../../config/reviewConfig';

// Modal styles following luxury aesthetic
const reviewModalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 15, 15, 0.42)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    zIndex: 9999,
    animation: 'reviewOverlayFade 500ms ease forwards',
  },
  panel: {
    width: 'min(1100px, 94vw)',
    minHeight: '640px',
    background: '#f6f1e8',
    color: '#171717',
    border: '1px solid #8f7420',
    borderRadius: '0px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.18)',
    overflow: 'hidden',
    animation: 'reviewPanelReveal 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
    transformOrigin: 'center center',
    position: 'relative',
  },
  inner: {
    padding: '56px 64px 40px',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.6fr)',
    columnGap: '56px',
    rowGap: '32px',
    minHeight: '640px',
  },
  progressWrap: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '16px',
    paddingBottom: '8px',
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(23, 23, 23, 0.42)',
  },
  progressItemActive: {
    color: '#8f7420',
    fontWeight: 700,
    letterSpacing: '0.12em',
  },
  progressSlash: {
    color: 'rgba(23, 23, 23, 0.18)',
    fontSize: '11px',
  },
  progressLine: {
    position: 'relative',
    height: '1px',
    background: 'rgba(23, 23, 23, 0.10)',
    overflow: 'hidden',
  },
  progressFill: (step) => ({
    position: 'absolute',
    inset: 0,
    width: `${((step + 1) / 4) * 100}%`,
    background: '#8f7420',
    transition: 'width 280ms ease',
  }),
  formCol: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  headingBlock: {
    marginBottom: '28px',
  },
  heading: {
    margin: 0,
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '28px',
    lineHeight: 0.95,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    color: '#171717',
  },
  subheading: {
    marginTop: '10px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: 1.7,
    color: 'rgba(23, 23, 23, 0.62)',
    maxWidth: '560px',
  },
  fields: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '28px 34px',
    alignItems: 'start',
  },
  fieldFull: {
    gridColumn: '1 / -1',
  },
  fieldLabel: {
    display: 'block',
    marginBottom: '10px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'rgba(23, 23, 23, 0.78)',
  },
  fieldWrap: {
    position: 'relative',
    paddingTop: '2px',
  },
  input: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid rgba(23, 23, 23, 0.18)',
    background: 'transparent',
    outline: 'none',
    padding: '0 0 14px 0',
    height: '54px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '18px',
    lineHeight: 1.4,
    color: '#171717',
    borderRadius: 0,
    boxShadow: 'none',
    transition: 'border-color 180ms ease',
  },
  textarea: {
    width: '100%',
    minHeight: '130px',
    resize: 'vertical',
    border: 'none',
    borderBottom: '1px solid rgba(23, 23, 23, 0.18)',
    background: 'transparent',
    outline: 'none',
    padding: '8px 0 14px 0',
    fontFamily: 'Inter, sans-serif',
    fontSize: '18px',
    lineHeight: 1.7,
    color: '#171717',
    borderRadius: 0,
    boxShadow: 'none',
    transition: 'border-color 180ms ease',
  },
  aside: {
    display: 'flex',
    alignItems: 'stretch',
  },
  asideCard: {
    width: '100%',
    alignSelf: 'start',
    background: 'rgba(255,255,255,0.32)',
    border: '1px solid rgba(23, 23, 23, 0.10)',
    padding: '32px 28px',
    minHeight: '100%',
  },
  asideStep: {
    width: '42px',
    height: '42px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#8f7420',
    color: '#fff',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 700,
    fontSize: '20px',
    marginBottom: '24px',
  },
  asideTitle: {
    margin: 0,
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '28px',
    lineHeight: 1.05,
    fontWeight: 500,
    color: '#171717',
  },
  asideText: {
    marginTop: '18px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    lineHeight: 1.9,
    color: 'rgba(23, 23, 23, 0.68)',
  },
  footer: {
    marginTop: '32px',
    paddingTop: '18px',
    borderTop: '1px solid rgba(23, 23, 23, 0.10)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '16px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  primaryBtn: {
    minWidth: '180px',
    height: '56px',
    border: 'none',
    background: '#8f7420',
    color: '#f6f1e8',
    fontFamily: 'Inter, sans-serif',
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    padding: '0 28px',
    transition: 'all 280ms ease',
  },
  secondaryBtn: {
    border: 'none',
    background: 'transparent',
    color: '#171717',
    fontFamily: 'Inter, sans-serif',
    fontSize: '18px',
    lineHeight: 1,
    textDecoration: 'underline',
    textUnderlineOffset: '6px',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 180ms ease',
  },
  imageUploadWrap: {
    marginTop: '20px',
    padding: '20px',
    border: '2px dashed rgba(23, 23, 23, 0.2)',
    borderRadius: '4px',
    background: 'rgba(23, 23, 23, 0.02)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 180ms ease',
  },
  imageUploadInput: {
    display: 'none',
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginTop: '16px',
  },
  imageThumbnail: {
    position: 'relative',
    paddingBottom: '100%',
    background: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  imageThumbnailImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '28px',
    height: '28px',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 180ms ease',
  },
  successMessage: {
    textAlign: 'center',
    padding: '48px 32px',
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  },
  successTitle: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '32px',
    fontWeight: 500,
    color: '#171717',
    margin: '0 0 12px',
  },
  successText: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px',
    color: 'rgba(23, 23, 23, 0.68)',
    lineHeight: 1.8,
    maxWidth: '420px',
    margin: '0 auto 32px',
  },
  closeBtn: {
    position: 'absolute',
    top: '22px',
    right: '24px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(23, 23, 23, 0.6)',
    fontSize: '30px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
    transition: 'color 180ms ease',
  },
};

/**
 * ReviewSubmitForm - Premium review submission modal
 * Cinematic reveal, landscape layout, cream/gold/black aesthetic
 */
const ReviewSubmitForm = ({ entityType, entityId, onSubmitSuccess, onCancel }) => {
  const C = useTheme();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const [formData, setFormData] = useState({
    reviewer_name: '',
    reviewer_email: '',
    reviewer_location: '',
    event_type: '',
    event_date: '',
    overall_rating: null,
    sub_ratings: {},
    review_title: '',
    review_text: '',
    images: [],
  });

  const subRatingKeys = SUB_RATING_KEYS[entityType] || [];
  const steps = ['Details', 'Event', 'Ratings', 'Review'];

  // Step titles and subtitles
  const stepContent = {
    0: {
      title: 'Your Details',
      subtitle: 'Help us verify genuine reviews from real guests.',
    },
    1: {
      title: 'Your Event',
      subtitle: 'Tell us about the event you celebrated at this venue.',
    },
    2: {
      title: 'Your Ratings',
      subtitle: 'Rate different aspects of your experience.',
    },
    3: {
      title: 'Your Review',
      subtitle: 'Share what made your event memorable.',
    },
  };

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSubRating = (key, value) => {
    setFormData((prev) => {
      const updatedSubRatings = { ...prev.sub_ratings, [key]: value };

      // Calculate overall rating from sub-ratings
      const allSubRatings = subRatingKeys.map(k => updatedSubRatings[k]).filter(Boolean);
      const avgRating = allSubRatings.length > 0
        ? Math.round(allSubRatings.reduce((a, b) => a + b) / allSubRatings.length)
        : null;

      return {
        ...prev,
        sub_ratings: updatedSubRatings,
        overall_rating: avgRating,
      };
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = 4 - uploadedImages.length;
    const filesToAdd = files.slice(0, remainingSlots);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImages((prev) => [...prev, { name: file.name, data: event.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.reviewer_name.trim() && formData.reviewer_email.trim();
      case 1:
        return formData.event_type;
      case 2:
        return formData.overall_rating && subRatingKeys.every((k) => formData.sub_ratings[k]);
      case 3:
        return formData.review_title.trim() && formData.review_text.trim();
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      setError('Please complete all required fields');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      setError('Please complete all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const submissionData = {
        ...formData,
        images: uploadedImages.map((img) => img.data),
      };
      await submitReview(entityType, entityId, submissionData);
      setSubmitted(true);
      // Don't call onSubmitSuccess yet - let the user see the thank you message first
      // onSubmitSuccess will be called when they close the message
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Call onSubmitSuccess when closing the success message
  const handleCloseSuccessMessage = () => {
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
    onCancel();
  };

  // Render field based on step
  const renderFields = () => {
    switch (step) {
      case 0:
        return (
          <div style={reviewModalStyles.fields}>
            <div>
              <label style={reviewModalStyles.fieldLabel}>Name *</label>
              <div style={reviewModalStyles.fieldWrap}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.reviewer_name}
                  onChange={(e) => updateForm('reviewer_name', e.target.value)}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#8f7420')}
                  onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(23, 23, 23, 0.18)')}
                  style={reviewModalStyles.input}
                />
              </div>
            </div>

            <div>
              <label style={reviewModalStyles.fieldLabel}>Email *</label>
              <div style={reviewModalStyles.fieldWrap}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.reviewer_email}
                  onChange={(e) => updateForm('reviewer_email', e.target.value)}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#8f7420')}
                  onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(23, 23, 23, 0.18)')}
                  style={reviewModalStyles.input}
                />
              </div>
            </div>

            <div style={reviewModalStyles.fieldFull}>
              <label style={reviewModalStyles.fieldLabel}>Location</label>
              <div style={reviewModalStyles.fieldWrap}>
                <input
                  type="text"
                  placeholder="City, Country"
                  value={formData.reviewer_location}
                  onChange={(e) => updateForm('reviewer_location', e.target.value)}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#8f7420')}
                  onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(23, 23, 23, 0.18)')}
                  style={reviewModalStyles.input}
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div style={reviewModalStyles.fields}>
            <div style={reviewModalStyles.fieldFull}>
              <label style={reviewModalStyles.fieldLabel}>Event Type *</label>
              <div style={reviewModalStyles.fieldWrap}>
                <select
                  value={formData.event_type}
                  onChange={(e) => updateForm('event_type', e.target.value)}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#8f7420')}
                  onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(23, 23, 23, 0.18)')}
                  style={{
                    ...reviewModalStyles.input,
                    appearance: 'none',
                    backgroundImage:
                      'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath fill=%27%238f7420%27 d=%27M0 0l6 8 6-8z%27/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0 center',
                    backgroundSize: '12px 8px',
                    paddingRight: '28px',
                  }}
                >
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={reviewModalStyles.fieldFull}>
              <label style={reviewModalStyles.fieldLabel}>Event Date</label>
              <div style={reviewModalStyles.fieldWrap}>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => updateForm('event_date', e.target.value)}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#8f7420')}
                  onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(23, 23, 23, 0.18)')}
                  style={reviewModalStyles.input}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={reviewModalStyles.fields}>
            <div style={reviewModalStyles.fieldFull}>
              <label style={reviewModalStyles.fieldLabel}>Overall Rating</label>
              <div style={{ marginTop: '12px', paddingTop: '12px', paddingBottom: '12px', color: 'rgba(23, 23, 23, 0.68)', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                {formData.overall_rating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{'★'.repeat(formData.overall_rating)}</span>
                    <span>{formData.overall_rating} / 4</span>
                    <span style={{ fontSize: '12px', color: 'rgba(23, 23, 23, 0.48)' }}>(calculated from your sub-ratings)</span>
                  </div>
                ) : (
                  <span style={{ color: 'rgba(23, 23, 23, 0.48)', fontStyle: 'italic' }}>Rate the categories below to calculate your overall rating</span>
                )}
              </div>
            </div>

            {subRatingKeys.map((key) => (
              <div key={key} style={reviewModalStyles.fieldFull}>
                <label style={{ ...reviewModalStyles.fieldLabel, textTransform: 'capitalize' }}>
                  {key}
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => updateSubRating(key, r)}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: `1px solid ${formData.sub_ratings[key] === r ? '#8f7420' : 'rgba(23, 23, 23, 0.2)'}`,
                        background: formData.sub_ratings[key] === r ? '#8f7420' : 'transparent',
                        color: formData.sub_ratings[key] === r ? '#fff' : 'rgba(23, 23, 23, 0.3)',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 180ms ease',
                        borderRadius: 0,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 3:
        return (
          <div style={reviewModalStyles.fields}>
            <div style={reviewModalStyles.fieldFull}>
              <label style={reviewModalStyles.fieldLabel}>Review Title *</label>
              <div style={reviewModalStyles.fieldWrap}>
                <input
                  type="text"
                  placeholder="e.g., 'A magical celebration'"
                  value={formData.review_title}
                  onChange={(e) => updateForm('review_title', e.target.value)}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#8f7420')}
                  onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(23, 23, 23, 0.18)')}
                  style={reviewModalStyles.input}
                />
              </div>
            </div>

            <div style={reviewModalStyles.fieldFull}>
              <label style={reviewModalStyles.fieldLabel}>Your Review *</label>
              <div style={reviewModalStyles.fieldWrap}>
                <textarea
                  placeholder="Share your experience..."
                  value={formData.review_text}
                  onChange={(e) => updateForm('review_text', e.target.value)}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#8f7420')}
                  onBlur={(e) => (e.target.style.borderBottomColor = 'rgba(23, 23, 23, 0.18)')}
                  style={reviewModalStyles.textarea}
                />
              </div>
              <div
                style={{
                  marginTop: '8px',
                  fontSize: '13px',
                  color: 'rgba(23, 23, 23, 0.48)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {formData.review_text.length}/1000 characters
              </div>
            </div>

            <div style={reviewModalStyles.fieldFull}>
              <label style={reviewModalStyles.fieldLabel}>Add Photos (Optional)</label>
              <label
                style={{ ...reviewModalStyles.imageUploadWrap, display: uploadedImages.length >= 4 ? 'none' : 'block' }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#8f7420')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(23, 23, 23, 0.2)')}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
                <div style={{ fontSize: '14px', color: 'rgba(23, 23, 23, 0.68)', fontFamily: 'Inter, sans-serif' }}>
                  Drag and drop or click to upload (Max {4 - uploadedImages.length} images)
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={reviewModalStyles.imageUploadInput}
                />
              </label>

              {uploadedImages.length > 0 && (
                <div style={reviewModalStyles.imageGrid}>
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} style={reviewModalStyles.imageThumbnail}>
                      <img src={img.data} alt={`Upload ${idx + 1}`} style={reviewModalStyles.imageThumbnailImg} />
                      <button
                        type="button"
                        style={reviewModalStyles.imageRemoveBtn}
                        onClick={() => removeImage(idx)}
                        onMouseOver={(e) => (e.target.style.background = 'rgba(0,0,0,0.8)')}
                        onMouseOut={(e) => (e.target.style.background = 'rgba(0,0,0,0.6)')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // If submitted, show success message
  if (submitted) {
    return (
      <>
        <style>{`
          @keyframes reviewOverlayFade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes reviewPanelReveal {
            from {
              opacity: 0;
              transform: translateY(28px) scale(0.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>

        <div style={reviewModalStyles.overlay} onClick={handleCloseSuccessMessage}>
          <div style={reviewModalStyles.panel} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Close review form"
              style={reviewModalStyles.closeBtn}
              onClick={handleCloseSuccessMessage}
              onMouseOver={(e) => (e.target.style.color = '#171717')}
              onMouseOut={(e) => (e.target.style.color = 'rgba(23, 23, 23, 0.6)')}
            >
              ×
            </button>

            <div style={reviewModalStyles.successMessage}>
              <div style={reviewModalStyles.successIcon}>✓</div>
              <h2 style={reviewModalStyles.successTitle}>Thank You!</h2>
              <p style={reviewModalStyles.successText}>
                Your review has been submitted successfully. We appreciate your feedback and will carefully review your submission. It will be published shortly after moderation.
              </p>
              <button
                type="button"
                style={{
                  ...reviewModalStyles.primaryBtn,
                  minWidth: '200px',
                  marginTop: '12px',
                }}
                onClick={handleCloseSuccessMessage}
                onMouseOver={(e) => (e.target.style.opacity = '0.85')}
                onMouseOut={(e) => (e.target.style.opacity = '1')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes reviewOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes reviewPanelReveal {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div style={reviewModalStyles.overlay} onClick={onCancel}>
        <div style={reviewModalStyles.panel} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label="Close review form"
            style={reviewModalStyles.closeBtn}
            onClick={onCancel}
            onMouseOver={(e) => (e.target.style.color = '#171717')}
            onMouseOut={(e) => (e.target.style.color = 'rgba(23, 23, 23, 0.6)')}
          >
            ×
          </button>

          <div style={reviewModalStyles.inner}>
            {/* Progress Indicator */}
            <div style={reviewModalStyles.progressWrap}>
              <div style={reviewModalStyles.progressRow}>
                {steps.map((item, index) => (
                  <React.Fragment key={item}>
                    <span style={index === step ? reviewModalStyles.progressItemActive : undefined}>
                      {item}
                    </span>
                    {index < steps.length - 1 && (
                      <span style={reviewModalStyles.progressSlash}>/</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div style={reviewModalStyles.progressLine}>
                <div style={reviewModalStyles.progressFill(step)} />
              </div>
            </div>

            {/* Form Column */}
            <div style={reviewModalStyles.formCol}>
              <div>
                <div style={reviewModalStyles.headingBlock}>
                  <h2 style={reviewModalStyles.heading}>{stepContent[step].title}</h2>
                  <div style={reviewModalStyles.subheading}>{stepContent[step].subtitle}</div>
                </div>

                {error && (
                  <div
                    style={{
                      background: '#ffe4e6',
                      borderLeft: '3px solid #8f7420',
                      color: '#c62828',
                      padding: '12px 16px',
                      marginBottom: '24px',
                      fontSize: '14px',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {error}
                  </div>
                )}

                {renderFields()}
              </div>

              <div style={reviewModalStyles.footer}>
                <div />
                <div style={reviewModalStyles.actions}>
                  {step < 3 ? (
                    <button
                      type="button"
                      style={{
                        ...reviewModalStyles.primaryBtn,
                        opacity: canProceed() ? 1 : 0.5,
                        cursor: canProceed() ? 'pointer' : 'not-allowed',
                      }}
                      onClick={handleNext}
                      onMouseOver={(e) => {
                        if (canProceed()) e.target.style.opacity = '0.85';
                      }}
                      onMouseOut={(e) => {
                        if (canProceed()) e.target.style.opacity = '1';
                      }}
                      disabled={!canProceed()}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={{
                        ...reviewModalStyles.primaryBtn,
                        opacity: canProceed() && !loading ? 1 : 0.5,
                        cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
                      }}
                      onClick={handleSubmit}
                      disabled={!canProceed() || loading}
                      onMouseOver={(e) => {
                        if (canProceed() && !loading) e.target.style.opacity = '0.85';
                      }}
                      onMouseOut={(e) => {
                        if (canProceed() && !loading) e.target.style.opacity = '1';
                      }}
                    >
                      {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  )}

                  <button
                    type="button"
                    style={reviewModalStyles.secondaryBtn}
                    onClick={onCancel}
                    onMouseOver={(e) => (e.target.style.color = '#8f7420')}
                    onMouseOut={(e) => (e.target.style.color = '#171717')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Context Panel */}
            <aside style={reviewModalStyles.aside}>
              <div style={reviewModalStyles.asideCard}>
                <div style={reviewModalStyles.asideStep}>{step + 1}</div>
                <h3 style={reviewModalStyles.asideTitle}>Your Review Matters</h3>
                <div style={reviewModalStyles.asideText}>
                  Help future couples discover exceptional venues. We carefully moderate each submission
                  and never publish personal details publicly.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewSubmitForm;
