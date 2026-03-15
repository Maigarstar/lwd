// AuraDiscoveryDemoPage.jsx
// Demo page showcasing the Aura AI knowledge layer in action
// Shows how editorial content + approval status + review analysis powers discovery
//
// This page demonstrates:
// - Aura venue cards with editorial summaries
// - Content quality scoring (0-100)
// - Approval workflow signals (fact-checked, approved)
// - Guest theme analysis from reviews
// - Smart filtering by editorial quality
//
// Route: /discovery/aura (or customize as needed)

import { useNavigate } from 'react-router-dom';
import AuraDiscoveryGrid from '../components/discovery/AuraDiscoveryGrid';

export default function AuraDiscoveryDemoPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fbf7f4',
      padding: '64px 24px',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        {/* Hero section */}
        <div style={{
          marginBottom: 64,
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: '#f5f2ec',
            border: '1px solid #e4e0d8',
            borderRadius: 6,
            marginBottom: 24,
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: '#8f7420',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              ✨ Powered by Aura AI
            </span>
          </div>

          <h1 style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 48,
            fontWeight: 400,
            color: '#171717',
            lineHeight: 1.2,
          }}>
            Discover Venues Curated by Intelligence
          </h1>

          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 18,
            color: '#6b6560',
            lineHeight: 1.6,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Every venue is ranked by editorial quality, approval status, and guest experiences.
            Only the most vetted, complete properties. No weak content. No filler.
          </p>
        </div>

        {/* Education section - what makes this different */}
        <div style={{
          marginBottom: 64,
          padding: 32,
          background: '#ffffff',
          border: '1px solid #e4e0d8',
          borderRadius: 8,
        }}>
          <h2 style={{
            margin: '0 0 24px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 24,
            fontWeight: 400,
            color: '#171717',
          }}>
            How Editorial Intelligence Works
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
          }}>
            {[
              {
                title: 'Content Quality Score',
                description: 'Each venue is scored 0-100 based on editorial completeness, fact-checking, and approval status. Only high-quality content gets featured.',
                icon: '📊',
              },
              {
                title: 'Approved Editorial',
                description: 'Section intros and descriptions are written by our editorial team, fact-checked against verified sources, and approved before display.',
                icon: '✓',
              },
              {
                title: 'Guest Intelligence',
                description: 'We analyze thousands of reviews to extract common themes, sentiment patterns, and what couples truly love about each venue.',
                icon: '⭐',
              },
              {
                title: 'Intentional Curation',
                description: 'Weak or missing sections are hidden. No filler content. Every section shown is genuinely complete and strong.',
                icon: '👑',
              },
            ].map((feature, idx) => (
              <div key={idx}>
                <div style={{
                  fontSize: 32,
                  marginBottom: 12,
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  margin: '0 0 8px',
                  fontFamily: 'var(--font-heading-primary)',
                  fontSize: 16,
                  fontWeight: 400,
                  color: '#171717',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: '#6b6560',
                  lineHeight: 1.6,
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content score explanation */}
        <div style={{
          marginBottom: 64,
          padding: 32,
          background: '#faf9f6',
          border: '1px solid #f0ede5',
          borderRadius: 8,
        }}>
          <h2 style={{
            margin: '0 0 24px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 24,
            fontWeight: 400,
            color: '#171717',
          }}>
            Understanding Content Scores
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {[
              {
                score: '90-100',
                label: 'Premium',
                color: '#15803d',
                description: 'All sections complete, fact-checked, and approved',
              },
              {
                score: '70-89',
                label: 'High Quality',
                color: '#8f7420',
                description: 'Most sections complete, undergoing approval',
              },
              {
                score: '40-69',
                label: 'In Progress',
                color: '#a88338',
                description: 'Some sections filled, needs completion',
              },
              {
                score: '0-39',
                label: 'Needs Work',
                color: '#8a8078',
                description: 'Minimal content, early stage',
              },
            ].map((tier, idx) => (
              <div key={idx} style={{
                padding: 16,
                background: '#ffffff',
                border: `2px solid ${tier.color}`,
                borderRadius: 6,
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: tier.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 12,
                }}>
                  {tier.score.split('-')[0]}+
                </div>
                <h3 style={{
                  margin: '0 0 4px',
                  fontFamily: 'var(--font-heading-primary)',
                  fontSize: 14,
                  fontWeight: 400,
                  color: '#171717',
                }}>
                  {tier.label}
                </h3>
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: '#6b6560',
                  lineHeight: 1.5,
                }}>
                  {tier.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main discovery grid */}
        <AuraDiscoveryGrid
          minContentScore={0}
          onVenueClick={(slug) => navigate(`/showcase/${slug}`)}
          limit={20}
        />

        {/* Footer explanation */}
        <div style={{
          marginTop: 64,
          padding: 32,
          background: '#ffffff',
          border: '1px solid #e4e0d8',
          borderRadius: 8,
          textAlign: 'center',
        }}>
          <h2 style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 20,
            fontWeight: 400,
            color: '#171717',
          }}>
            What Makes This Different
          </h2>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: '#6b6560',
            lineHeight: 1.8,
            maxWidth: 700,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Most wedding directories show everything. We show only our best work.
            Every venue displayed has been carefully edited, verified against sources,
            and approved by our editorial team. Section intros are written with care.
            Weak sections are hidden. Guest reviews are analyzed for patterns.
            Couples see intelligent curation, not volume.
            This is luxury discovery powered by both human editorial
            and artificial intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}
