const ContentQualityStatusSection = ({ formData, onChange }) => {
  const sectionIntros = formData?.section_intros || {};
  const editorial_fact_checked = formData?.editorial_fact_checked || false;
  const editorial_approved = formData?.editorial_approved || false;
  const content_quality_score = formData?.content_quality_score || 0;
  const editorial_last_reviewed_at = formData?.editorial_last_reviewed_at;

  // Calculate filled sections
  const filledSections = Object.values(sectionIntros)
    .filter(intro => intro && typeof intro === 'string' && intro.trim().length > 0)
    .length;
  const maxSections = Object.keys(sectionIntros).length || 6;

  // Calculate days since last review
  const getDaysSinceReview = () => {
    if (!editorial_last_reviewed_at) return null;
    const now = new Date();
    const reviewed = new Date(editorial_last_reviewed_at);
    const diffMs = now - reviewed;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const daysSinceReview = getDaysSinceReview();

  const getFreshnessLabel = () => {
    if (!daysSinceReview && daysSinceReview !== 0) return 'Never reviewed';
    if (daysSinceReview <= 7) return 'Fresh';
    if (daysSinceReview <= 30) return 'Good';
    if (daysSinceReview <= 90) return 'Review soon';
    return 'Stale';
  };

  const getFreshnessColor = () => {
    if (!daysSinceReview && daysSinceReview !== 0) return '#9ca3af';
    if (daysSinceReview <= 7) return '#10b981';
    if (daysSinceReview <= 30) return '#C9A84C';
    if (daysSinceReview <= 90) return '#f59e0b';
    return '#dc2626';
  };

  // Build recommendations
  const recommendations = [];

  if (filledSections < maxSections) {
    const missing = maxSections - filledSections;
    recommendations.push({
      type: 'info',
      icon: '📝',
      text: `Add missing section intros (${missing} of ${maxSections} remaining)`,
      target: 'editorial'
    });
  }

  if (!editorial_fact_checked) {
    recommendations.push({
      type: 'warning',
      icon: '✓',
      text: 'Fact-check the content before approval',
      target: 'approval'
    });
  }

  if (!editorial_approved && editorial_fact_checked) {
    recommendations.push({
      type: 'info',
      icon: '★',
      text: 'Content is ready to approve',
      target: 'approval'
    });
  }

  if (daysSinceReview && daysSinceReview > 90) {
    recommendations.push({
      type: 'warning',
      icon: '⟳',
      text: `Content review recommended (last reviewed ${daysSinceReview} days ago)`,
      target: 'approval'
    });
  }

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* ── QUALITY SCORE GAUGE ────────────────────────────────────────── */}
      <div style={{
        marginBottom: 32,
        padding: 24,
        background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.04))',
        border: '1px solid rgba(201,168,76,0.2)',
        borderRadius: 8,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 24,
        }}>
          {/* Circular gauge */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              position: 'relative',
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: '#f9f7f3',
              border: `3px solid ${content_quality_score >= 70 ? '#C9A84C' : content_quality_score >= 40 ? '#f59e0b' : '#d1d5db'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 700,
              color: content_quality_score >= 70 ? '#C9A84C' : content_quality_score >= 40 ? '#f59e0b' : '#9ca3af',
            }}>
              {content_quality_score}
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#666',
              textAlign: 'center',
            }}>
              Content Quality<br />Score
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a1a1a', marginBottom: 14 }}>
              Score Breakdown
            </h3>

            {/* Section Intros Progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>Section Intros</span>
                <span style={{ fontSize: 11, color: '#999' }}>{filledSections}/{maxSections}</span>
              </div>
              <div style={{ height: 6, backgroundColor: '#e5e0da', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(filledSections / maxSections) * 100}%`,
                  backgroundColor: '#C9A84C',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 9, color: '#bbb', marginTop: 3, display: 'block' }}>
                Contributes up to 40 points
              </span>
            </div>

            {/* Fact-Checked Status */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>Fact-Checked</span>
                <span style={{ fontSize: 11, color: editorial_fact_checked ? '#10b981' : '#999' }}>
                  {editorial_fact_checked ? '✓ Yes' : 'No'}
                </span>
              </div>
              <div style={{ height: 6, backgroundColor: '#e5e0da', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: editorial_fact_checked ? '100%' : '0%',
                  backgroundColor: '#10b981',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 9, color: '#bbb', marginTop: 3, display: 'block' }}>
                {editorial_fact_checked ? '30 points' : '0 points'}
              </span>
            </div>

            {/* Approved Status */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>Approved</span>
                <span style={{ fontSize: 11, color: editorial_approved ? '#C9A84C' : '#999' }}>
                  {editorial_approved ? '★ Yes' : 'No'}
                </span>
              </div>
              <div style={{ height: 6, backgroundColor: '#e5e0da', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: editorial_approved ? '100%' : '0%',
                  backgroundColor: '#C9A84C',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 9, color: '#bbb', marginTop: 3, display: 'block' }}>
                {editorial_approved ? '30 points' : '0 points'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FRESHNESS INDICATOR ────────────────────────────────────────── */}
      <div style={{
        marginBottom: 28,
        padding: '16px',
        background: '#fafaf9',
        border: '1px solid #ebe7e0',
        borderRadius: 4,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a1a1a' }}>
            Content Freshness
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: getFreshnessColor(),
            }} />
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: getFreshnessColor(),
            }}>
              {getFreshnessLabel()}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
          {daysSinceReview === null || daysSinceReview === undefined
            ? 'Content has never been reviewed'
            : daysSinceReview === 0
            ? 'Reviewed today'
            : daysSinceReview === 1
            ? 'Reviewed 1 day ago'
            : `Reviewed ${daysSinceReview} days ago`
          }
        </div>

        {daysSinceReview && daysSinceReview > 90 && (
          <div style={{
            marginTop: 12,
            padding: '10px 12px',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 3,
            fontSize: 12,
            color: '#92400e',
            display: 'flex',
            gap: 8,
          }}>
            <span>⚠️</span>
            <div>Content is stale. Recommend reviewing and updating.</div>
          </div>
        )}
      </div>

      {/* ── RECOMMENDATIONS PANEL ──────────────────────────────────────── */}
      {recommendations.length > 0 && (
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1a1a1a', marginBottom: 12 }}>
            Recommendations
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  background: rec.type === 'warning' ? '#fef3c7' : '#dbeafe',
                  border: `1px solid ${rec.type === 'warning' ? '#fcd34d' : '#93c5fd'}`,
                  borderRadius: 4,
                  fontSize: 12,
                  color: rec.type === 'warning' ? '#92400e' : '#1e40af',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ flexShrink: 0, marginTop: 1 }}>{rec.icon}</span>
                <div style={{ flex: 1 }}>
                  {rec.text}
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 10, color: '#aaa', margin: '12px 0 0', fontStyle: 'italic' }}>
            Edit related sections above to improve your content quality score
          </p>
        </div>
      )}

      {recommendations.length === 0 && (
        <div style={{
          padding: '16px',
          background: 'rgba(16,185,129,0.05)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 4,
          textAlign: 'center',
          fontSize: 13,
          color: '#10b981',
          fontWeight: 500,
        }}>
          ✓ All quality checks passing. Content is ready for publication.
        </div>
      )}

    </section>
  );
};

export default ContentQualityStatusSection;
