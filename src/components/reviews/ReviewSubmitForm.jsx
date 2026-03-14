import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { submitReview } from '../../services/reviewService';
import { SUB_RATING_KEYS, EVENT_TYPES } from '../../config/reviewConfig';

/**
 * ReviewSubmitForm - public review submission form
 * Multi-step flow: reviewer details -> event details -> ratings -> review text
 */
const ReviewSubmitForm = ({ entityType, entityId, onSubmitSuccess, onCancel }) => {
  const C = useTheme();
  const FD = 'Cardo, serif';
  const FB = 'Inter, sans-serif';

  const [step, setStep] = useState(1); // 1=details, 2=event, 3=ratings, 4=text
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

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
  });

  const subRatingKeys = SUB_RATING_KEYS[entityType] || [];

  const LABEL = {
    display: 'block',
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: C.textMid,
    fontFamily: FB,
    letterSpacing: '0.5px',
  };

  const INPUT = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    fontFamily: FB,
    border: `1px solid ${C.border}`,
    borderRadius: 2,
    boxSizing: 'border-box',
    color: C.textDark,
    background: C.surface,
  };

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateSubRating = (key, value) => {
    setFormData(prev => ({
      ...prev,
      sub_ratings: { ...prev.sub_ratings, [key]: value },
    }));
  };

  const canProceedStep = () => {
    switch (step) {
      case 1:
        return formData.reviewer_name.trim() && formData.reviewer_email.trim();
      case 2:
        return formData.event_type;
      case 3:
        return formData.overall_rating && subRatingKeys.every(k => formData.sub_ratings[k]);
      case 4:
        return formData.review_title.trim() && formData.review_text.trim();
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceedStep()) {
      setError('Please complete all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await submitReview(entityType, entityId, formData);

      setSubmitted(true);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 48, color: C.gold, marginBottom: 16 }}>✓</div>
          <h3
            style={{
              fontFamily: FD,
              fontSize: 24,
              color: C.textDark,
              marginBottom: 12,
            }}
          >
            Thank You
          </h3>
        </div>
        <p
          style={{
            fontFamily: FB,
            fontSize: 14,
            color: C.textMuted,
            lineHeight: 1.6,
            maxWidth: 400,
            margin: '0 auto',
            marginBottom: 32,
          }}
        >
          Your review has been submitted and is under review. We appreciate your feedback and will publish it once verified.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setSubmitted(false);
              setStep(1);
              setFormData({
                reviewer_name: '',
                reviewer_email: '',
                reviewer_location: '',
                event_type: '',
                event_date: '',
                overall_rating: null,
                sub_ratings: {},
                review_title: '',
                review_text: '',
              });
              setError(null);
            }}
            style={{
              fontFamily: FB,
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#fff',
              background: C.gold,
              border: 'none',
              padding: '10px 24px',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => (e.target.style.opacity = '0.9')}
            onMouseOut={e => (e.target.style.opacity = '1')}
          >
            Submit Another Review
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                fontFamily: FB,
                fontSize: 13,
                color: C.textMid,
                background: 'transparent',
                border: `1px solid ${C.border}`,
                padding: '10px 24px',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => (e.target.style.background = C.surface)}
              onMouseOut={e => (e.target.style.background = 'transparent')}
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, paddingBottom: 60 }}>
      {/* Progress indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: s <= step ? C.gold : C.border,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FB,
              fontSize: 11,
              fontWeight: 700,
              color: s <= step ? '#fff' : C.textMuted,
            }}
          >
            {s}
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: '#ffebee',
            border: '1px solid #ef5350',
            color: '#c62828',
            padding: 12,
            borderRadius: 2,
            marginBottom: 20,
            fontFamily: FB,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Step 1: Reviewer details */}
      {step === 1 && (
        <div>
          <h3 style={{ fontFamily: FD, fontSize: 20, marginBottom: 20 }}>
            Your Details
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={LABEL}>Name *</label>
            <input
              type="text"
              value={formData.reviewer_name}
              onChange={e => updateForm('reviewer_name', e.target.value)}
              placeholder="Your name"
              style={INPUT}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={LABEL}>Email *</label>
            <input
              type="email"
              value={formData.reviewer_email}
              onChange={e => updateForm('reviewer_email', e.target.value)}
              placeholder="your@email.com"
              style={INPUT}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={LABEL}>Location</label>
            <input
              type="text"
              value={formData.reviewer_location}
              onChange={e => updateForm('reviewer_location', e.target.value)}
              placeholder="City, Country"
              style={INPUT}
            />
          </div>
        </div>
      )}

      {/* Step 2: Event details */}
      {step === 2 && (
        <div>
          <h3 style={{ fontFamily: FD, fontSize: 20, marginBottom: 20 }}>
            Your Event
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={LABEL}>Event Type *</label>
            <select
              value={formData.event_type}
              onChange={e => updateForm('event_type', e.target.value)}
              style={INPUT}
            >
              <option value="">Select event type</option>
              {EVENT_TYPES.map(et => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={LABEL}>Event Date</label>
            <input
              type="date"
              value={formData.event_date}
              onChange={e => updateForm('event_date', e.target.value)}
              style={INPUT}
            />
          </div>
        </div>
      )}

      {/* Step 3: Ratings */}
      {step === 3 && (
        <div>
          <h3 style={{ fontFamily: FD, fontSize: 20, marginBottom: 20 }}>
            Your Ratings
          </h3>

          {/* Overall rating */}
          <div style={{ marginBottom: 24 }}>
            <label style={LABEL}>Overall Rating *</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[1, 2, 3, 4, 5].map(r => (
                <button
                  key={r}
                  onClick={() => updateForm('overall_rating', r)}
                  style={{
                    width: 44,
                    height: 44,
                    border: `2px solid ${formData.overall_rating === r ? C.gold : C.border}`,
                    background: formData.overall_rating === r ? C.goldBg : 'transparent',
                    borderRadius: 2,
                    fontSize: 24,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Sub-ratings */}
          {subRatingKeys.map(key => (
            <div key={key} style={{ marginBottom: 16 }}>
              <label style={{ ...LABEL, textTransform: 'capitalize' }}>
                {key}
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    onClick={() => updateSubRating(key, r)}
                    style={{
                      width: 36,
                      height: 36,
                      border: `1px solid ${formData.sub_ratings[key] === r ? C.gold : C.border}`,
                      background: formData.sub_ratings[key] === r ? C.gold : 'transparent',
                      color: formData.sub_ratings[key] === r ? '#fff' : C.textMuted,
                      borderRadius: 3,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: FB,
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 4: Review text */}
      {step === 4 && (
        <div>
          <h3 style={{ fontFamily: FD, fontSize: 20, marginBottom: 20 }}>
            Your Review
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={LABEL}>Review Title *</label>
            <input
              type="text"
              value={formData.review_title}
              onChange={e => updateForm('review_title', e.target.value)}
              placeholder="e.g., 'A magical celebration'"
              style={INPUT}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={LABEL}>Your Review *</label>
            <textarea
              value={formData.review_text}
              onChange={e => updateForm('review_text', e.target.value)}
              placeholder="Share your experience..."
              style={{
                ...INPUT,
                minHeight: 150,
                fontFamily: FB,
                resize: 'vertical',
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: C.textMuted,
                marginTop: 6,
                fontFamily: FB,
              }}
            >
              {formData.review_text.length}/1000 characters
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'space-between',
          marginTop: 32,
        }}
      >
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              fontFamily: FB,
              fontSize: 13,
              fontWeight: 600,
              color: C.textMid,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              padding: '10px 24px',
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => (e.target.style.background = C.surface)}
            onMouseOut={e => (e.target.style.background = 'transparent')}
          >
            Back
          </button>
        )}

        {step < 4 ? (
          <button
            onClick={() => {
              if (canProceedStep()) {
                setStep(step + 1);
              } else {
                setError('Please complete all required fields');
              }
            }}
            style={{
              fontFamily: FB,
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#fff',
              background: canProceedStep() ? C.gold : C.border,
              border: 'none',
              padding: '10px 24px',
              borderRadius: 2,
              cursor: canProceedStep() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => canProceedStep() && (e.target.style.opacity = '0.9')}
            onMouseOut={e => (e.target.style.opacity = '1')}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !canProceedStep()}
            style={{
              fontFamily: FB,
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#fff',
              background: canProceedStep() && !loading ? C.gold : C.border,
              border: 'none',
              padding: '10px 24px',
              borderRadius: 2,
              cursor: canProceedStep() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={e => canProceedStep() && !loading && (e.target.style.opacity = '0.9')}
            onMouseOut={e => (e.target.style.opacity = '1')}
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              fontFamily: FB,
              fontSize: 13,
              color: C.textMid,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '10px 0',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewSubmitForm;
