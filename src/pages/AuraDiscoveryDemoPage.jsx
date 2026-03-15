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

import { useState, useEffect } from 'react';
import AuraDiscoveryGrid from '../components/discovery/AuraDiscoveryGrid';
import { useChat } from '../chat/ChatContext';
import HomeNav from '../components/nav/HomeNav';

export default function AuraDiscoveryDemoPage({ onViewVenue }) {
  const { openMiniBar } = useChat();
  const [isLight, setIsLight] = useState(() => {
    const saved = localStorage.getItem('aura-discovery-light-mode');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('aura-discovery-light-mode', JSON.stringify(isLight));
  }, [isLight]);

  const bgColor = isLight ? '#fbf7f4' : '#1a1a1a';
  const textColor = isLight ? '#171717' : '#f5f2ec';
  const cardBg = isLight ? '#ffffff' : '#2a2a2a';
  const borderColor = isLight ? '#e4e0d8' : '#3a3a3a';
  const subtextColor = isLight ? '#6b6560' : '#a89f98';

  return (
    <>
      <HomeNav
        darkMode={!isLight}
        onToggleDark={() => setIsLight(!isLight)}
        onVendorLogin={() => window.location.href = '/admin'}
        onNavigateStandard={() => window.location.href = '/'}
        onNavigateAbout={() => window.location.href = '/'}
      />
      <div style={{
        minHeight: '100vh',
        background: bgColor,
        padding: '64px 24px',
        transition: 'background 0.3s ease, color 0.3s ease',
      }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        {/* Dark mode toggle */}
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 1000,
        }}>
          <button
            onClick={() => setIsLight(!isLight)}
            style={{
              padding: '8px 12px',
              background: isLight ? '#ffffff' : '#2a2a2a',
              border: `1px solid ${borderColor}`,
              borderRadius: 6,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: textColor,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isLight ? '#f5f2ec' : '#3a3a3a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isLight ? '#ffffff' : '#2a2a2a';
            }}
          >
            {isLight ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        {/* Hero section */}
        <div style={{
          marginBottom: 64,
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            background: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(42, 42, 42, 0.5)',
            border: `2px solid #8f7420`,
            borderRadius: 8,
            marginBottom: 24,
            boxShadow: isLight
              ? '0 0 30px rgba(143, 116, 32, 0.2), inset 0 0 20px rgba(143, 116, 32, 0.05)'
              : '0 0 40px rgba(143, 116, 32, 0.4), 0 0 80px rgba(143, 116, 32, 0.15), inset 0 0 20px rgba(143, 116, 32, 0.15)',
            backdropFilter: 'blur(12px)',
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: '#8f7420',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Aura Certified Discovery
            </span>
          </div>

          <h1 style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 48,
            fontWeight: 400,
            color: textColor,
            lineHeight: 1.3,
          }}>
            Discover Extraordinary Wedding Venues<br />Curated by Editorial Intelligence
          </h1>

          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 18,
            color: subtextColor,
            lineHeight: 1.6,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Every venue is evaluated by editorial quality, approval status, and real guest experience. Only the most complete and trusted venues appear.
          </p>
        </div>

        {/* Education section - what makes this different */}
        <div style={{
          marginBottom: 64,
          padding: 32,
          background: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(42, 42, 42, 0.4)',
          border: `1px solid ${isLight ? 'rgba(228, 224, 216, 0.8)' : 'rgba(58, 58, 58, 0.6)'}`,
          borderRadius: 8,
          backdropFilter: 'blur(10px)',
          boxShadow: isLight ? '0 8px 32px rgba(0, 0, 0, 0.05)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          <h2 style={{
            margin: '0 0 24px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 24,
            fontWeight: 400,
            color: textColor,
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
                title: 'Editorial Content Intelligence',
                description: 'Each venue is scored 0-100 based on editorial completeness, fact-checking, and approval status. Only high-quality content gets featured.',
              },
              {
                title: 'Editorial Approval',
                description: 'Section intros and descriptions are written by our editorial team, fact-checked against verified sources, and approved before display.',
              },
              {
                title: 'Guest Insight',
                description: 'We analyze thousands of reviews to extract common themes, sentiment patterns, and what couples truly love about each venue.',
              },
              {
                title: 'Curated Selection',
                description: 'Weak or missing sections are hidden. No filler content. Every section shown is genuinely complete and strong.',
              },
            ].map((feature, idx) => (
              <div key={idx}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(143, 116, 32, 0.1)',
                  border: '1.5px solid #8f7420',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-body)',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#8f7420',
                  marginBottom: 16,
                  boxShadow: '0 0 20px rgba(143, 116, 32, 0.25)',
                }}>
                  {idx + 1}
                </div>
                <h3 style={{
                  margin: '0 0 8px',
                  fontFamily: 'var(--font-heading-primary)',
                  fontSize: 16,
                  fontWeight: 400,
                  color: textColor,
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: subtextColor,
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
          background: isLight ? 'rgba(250, 249, 246, 0.6)' : 'rgba(36, 36, 36, 0.4)',
          border: `1px solid ${isLight ? 'rgba(228, 224, 216, 0.8)' : 'rgba(58, 58, 58, 0.6)'}`,
          borderRadius: 8,
          backdropFilter: 'blur(10px)',
          boxShadow: isLight ? '0 8px 32px rgba(0, 0, 0, 0.05)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          <h2 style={{
            margin: '0 0 24px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 24,
            fontWeight: 400,
            color: textColor,
          }}>
            Editorial Quality Scores
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
                background: cardBg,
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
                  color: textColor,
                }}>
                  {tier.label}
                </h3>
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: subtextColor,
                  lineHeight: 1.5,
                }}>
                  {tier.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Discovery intro line */}
        <div style={{
          marginBottom: 32,
          textAlign: 'center',
        }}>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: subtextColor,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontWeight: 600,
          }}>
            Showing venues ranked by editorial quality and guest experience
          </p>
        </div>

        {/* Main discovery grid */}
        <AuraDiscoveryGrid
          minContentScore={0}
          isLight={isLight}
          onVenueClick={(slug) => {
            if (onViewVenue) {
              onViewVenue({ slug });
            } else {
              // Fallback: navigate directly
              window.location.href = `/showcase/${slug}`;
            }
          }}
          limit={20}
        />

        {/* Why Venues Join */}
        <div style={{
          marginBottom: 64,
          marginTop: 64,
          padding: 32,
          background: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(42, 42, 42, 0.4)',
          border: `1px solid ${isLight ? 'rgba(228, 224, 216, 0.8)' : 'rgba(58, 58, 58, 0.6)'}`,
          borderRadius: 8,
          backdropFilter: 'blur(10px)',
          boxShadow: isLight ? '0 8px 32px rgba(0, 0, 0, 0.05)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          <h2 style={{
            margin: '0 0 32px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 24,
            fontWeight: 400,
            color: textColor,
            textAlign: 'center',
          }}>
            Why Luxury Venues Join the Platform
          </h2>

          <p style={{
            margin: '0 0 32px',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: subtextColor,
            textAlign: 'center',
            lineHeight: 1.8,
            maxWidth: 700,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            This is not an open directory. Only venues with strong editorial quality, verified information, and complete listings are featured. That creates value for everyone.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
            marginBottom: 40,
          }}>
            {[
              {
                title: 'Curated Visibility',
                description: 'Your venue appears in a platform designed specifically for luxury destination weddings, not in a general database.',
              },
              {
                title: 'Editorial Positioning',
                description: 'Every listing includes refined narratives and structured venue intelligence that positions your venue as a premium choice.',
              },
              {
                title: 'Aura Powered Discovery',
                description: 'Your venue becomes discoverable through intelligent search and guided recommendations powered by AI.',
              },
              {
                title: 'Guest Insight Signals',
                description: 'Reviews and feedback are analyzed to highlight your strongest experiences and what guests genuinely value.',
              },
              {
                title: 'Quality Visibility',
                description: 'Higher editorial quality scores receive stronger visibility across discovery pages and featured positions.',
              },
            ].map((benefit, idx) => (
              <div key={idx} style={{
                padding: 20,
                background: isLight ? 'rgba(255, 255, 255, 0.3)' : 'rgba(26, 26, 26, 0.4)',
                border: `1px solid ${isLight ? 'rgba(228, 224, 216, 0.5)' : 'rgba(58, 58, 58, 0.4)'}`,
                borderRadius: 6,
                backdropFilter: 'blur(4px)',
              }}>
                <h3 style={{
                  margin: '0 0 8px',
                  fontFamily: 'var(--font-heading-primary)',
                  fontSize: 14,
                  fontWeight: 400,
                  color: textColor,
                }}>
                  {benefit.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: subtextColor,
                  lineHeight: 1.6,
                }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            textAlign: 'center',
            paddingTop: 32,
            borderTop: `1px solid ${isLight ? 'rgba(228, 224, 216, 0.5)' : 'rgba(58, 58, 58, 0.4)'}`,
          }}>
            <h3 style={{
              margin: '0 0 12px',
              fontFamily: 'var(--font-heading-primary)',
              fontSize: 16,
              fontWeight: 400,
              color: textColor,
            }}>
              A Platform That Rewards Quality
            </h3>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: subtextColor,
              lineHeight: 1.7,
              maxWidth: 600,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              The platform encourages venues to improve listings continuously to maintain and increase visibility.
            </p>
          </div>
        </div>

        {/* What Aura Does - Knowledge Layer Section */}
        <div style={{
          marginTop: 64,
          marginBottom: 64,
          padding: 32,
          background: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(42, 42, 42, 0.4)',
          border: `1px solid ${isLight ? 'rgba(228, 224, 216, 0.8)' : 'rgba(58, 58, 58, 0.6)'}`,
          borderRadius: 8,
          backdropFilter: 'blur(10px)',
          boxShadow: isLight ? '0 8px 32px rgba(0, 0, 0, 0.05)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          <h2 style={{
            margin: '0 0 32px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 24,
            fontWeight: 400,
            color: textColor,
            textAlign: 'center',
          }}>
            How Aura Understands Each Venue
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
            marginBottom: 40,
          }}>
            {[
              {
                title: 'Editorial Content',
                description: 'Verified venue narratives, descriptions, and approved section intros written by our editorial team.',
              },
              {
                title: 'Guest Experience',
                description: 'Thousands of guest insights and review patterns analyzed for common themes and sentiment.',
              },
              {
                title: 'Venue Intelligence',
                description: 'Structured venue capabilities, location context, pricing, capacity, and event potential.',
              },
            ].map((layer, idx) => (
              <div key={idx} style={{
                padding: 24,
                background: isLight ? '#faf9f6' : '#242424',
                border: `1px solid ${borderColor}`,
                borderRadius: 6,
              }}>
                <h3 style={{
                  margin: '0 0 12px',
                  fontFamily: 'var(--font-heading-primary)',
                  fontSize: 16,
                  fontWeight: 400,
                  color: textColor,
                }}>
                  {layer.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: subtextColor,
                  lineHeight: 1.6,
                }}>
                  {layer.description}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            borderTop: `1px solid ${borderColor}`,
            paddingTop: 32,
            marginTop: 32,
          }}>
            <p style={{
              margin: '0 0 20px',
              fontFamily: 'var(--font-heading-primary)',
              fontSize: 16,
              fontWeight: 400,
              color: textColor,
              textAlign: 'center',
            }}>
              This enables Aura to answer questions like:
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}>
              {[
                'Which venues are best for a 120-guest wedding in Tuscany?',
                'Which venues are known for exceptional food and wine?',
                'Which venues are best suited for multi-day celebrations?',
                'Which venues feel most intimate and romantic?',
              ].map((question, idx) => (
                <div key={idx} style={{
                  padding: 16,
                  background: isLight ? 'rgba(143, 116, 32, 0.05)' : 'rgba(143, 116, 32, 0.1)',
                  border: `1px solid rgba(143, 116, 32, 0.2)`,
                  borderRadius: 6,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: textColor,
                  lineHeight: 1.6,
                }}>
                  {question}
                </div>
              ))}
            </div>
          </div>

          <p style={{
            margin: '32px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: subtextColor,
            textAlign: 'center',
            lineHeight: 1.8,
            maxWidth: 700,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Aura turns venue discovery from a search experience into a guided conversation. Ask questions. Get intelligent answers backed by data.
          </p>
        </div>

        {/* Ask Aura CTA Section */}
        <div style={{
          marginBottom: 64,
          padding: 48,
          background: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(42, 42, 42, 0.4)',
          border: `1px solid ${isLight ? 'rgba(228, 224, 216, 0.8)' : 'rgba(58, 58, 58, 0.6)'}`,
          borderRadius: 8,
          backdropFilter: 'blur(10px)',
          boxShadow: isLight ? '0 8px 32px rgba(0, 0, 0, 0.05)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
        }}>
          <h2 style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 28,
            fontWeight: 400,
            color: textColor,
          }}>
            Ready to Discover?
          </h2>
          <p style={{
            margin: '0 0 32px',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: subtextColor,
            lineHeight: 1.8,
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Start by telling Aura what you're looking for. It will guide you to the right venue.
          </p>

          <button
            onClick={openMiniBar}
            style={{
              padding: '14px 32px',
              background: '#8f7420',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontFamily: 'var(--font-heading-primary)',
              fontSize: 16,
              fontWeight: 400,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 24px rgba(143, 116, 32, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(143, 116, 32, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(143, 116, 32, 0.25)';
            }}
          >
            Ask Aura
          </button>

          <div style={{
            marginTop: 40,
            paddingTop: 48,
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: subtextColor,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontWeight: 600,
            }}>
              Try asking about
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 16,
            }}>
              {[
                'Lake Como weddings',
                'Venues with gardens',
                'Multi-day celebrations',
                'Intimate settings',
              ].map((prompt, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    background: isLight ? 'rgba(143, 116, 32, 0.08)' : 'rgba(143, 116, 32, 0.12)',
                    border: `1px solid rgba(143, 116, 32, 0.2)`,
                    borderRadius: 6,
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: textColor,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isLight ? 'rgba(143, 116, 32, 0.12)' : 'rgba(143, 116, 32, 0.18)';
                    e.currentTarget.style.borderColor = 'rgba(143, 116, 32, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isLight ? 'rgba(143, 116, 32, 0.08)' : 'rgba(143, 116, 32, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(143, 116, 32, 0.2)';
                  }}
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer explanation */}
        <div style={{
          marginBottom: 0,
          padding: 32,
          background: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(42, 42, 42, 0.4)',
          border: `1px solid ${isLight ? 'rgba(228, 224, 216, 0.8)' : 'rgba(58, 58, 58, 0.6)'}`,
          borderRadius: 8,
          backdropFilter: 'blur(10px)',
          boxShadow: isLight ? '0 8px 32px rgba(0, 0, 0, 0.05)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
        }}>
          <h2 style={{
            margin: '0 0 24px',
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 20,
            fontWeight: 400,
            color: textColor,
          }}>
            Why This Platform Exists
          </h2>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: subtextColor,
            lineHeight: 2,
            maxWidth: 700,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Most wedding directories show everything. We show only our best work.
            <br /><br />
            Every venue displayed has been carefully reviewed, verified against sources,
            and approved by our editorial team. Weak sections are hidden. Incomplete listings
            are improved before being shown.
            <br /><br />
            Couples discover intelligent curation, not volume.
            <br /><br />
            This is luxury discovery powered by both human editorial judgement and Aura intelligence.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
