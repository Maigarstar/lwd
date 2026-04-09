// DisplayStyleRenderer.jsx
// Renders magazine content in different layouts based on section display_style
// Styles: grid, editorial, mixed, featured
// ─────────────────────────────────────────────────────────────────────────────

const SANS = "'Inter', 'Helvetica Neue', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const GOLD = '#c9a84c';

// ── Grid Style: 3-column card grid ────────────────────────────────────────
export function GridStyle({ posts = [] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: 28,
      marginBottom: 48,
    }}>
      {posts.map(post => (
        <a
          key={post.id}
          href={`/magazine/${post.slug}`}
          style={{
            textDecoration: 'none',
            borderRadius: 8,
            overflow: 'hidden',
            border: `1px solid rgba(201,169,110,0.15)`,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Image */}
          {post.coverImage && (
            <div style={{
              width: '100%',
              aspectRatio: '16/9',
              background: '#e8e4dc',
              overflow: 'hidden',
            }}>
              <img
                src={post.coverImage}
                alt={post.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
            </div>
          )}

          {/* Content */}
          <div style={{ padding: 24 }}>
            <div style={{
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 12,
            }}>
              {post.category}
            </div>

            <h3 style={{
              fontFamily: SERIF,
              fontSize: 18,
              fontWeight: 500,
              color: '#0b0906',
              marginBottom: 12,
              lineHeight: 1.35,
            }}>
              {post.title}
            </h3>

            <p style={{
              fontFamily: SANS,
              fontSize: 13,
              color: '#5a5045',
              lineHeight: 1.6,
              marginBottom: 16,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {post.excerpt}
            </p>

            <div style={{
              fontFamily: SANS,
              fontSize: 11,
              color: '#8a7d6a',
            }}>
              {post.readingTime} min read
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Editorial Style: Text-first, left image, full width ───────────────────
export function EditorialStyle({ posts = [] }) {
  return (
    <div style={{ marginBottom: 48 }}>
      {posts.map((post, idx) => (
        <a
          key={post.id}
          href={`/magazine/${post.slug}`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: 48,
            alignItems: 'center',
            marginBottom: idx < posts.length - 1 ? 56 : 0,
            paddingBottom: idx < posts.length - 1 ? 56 : 0,
            borderBottom: idx < posts.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Left: Content */}
          <div>
            <div style={{
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: GOLD,
              marginBottom: 12,
            }}>
              {post.category}
            </div>

            <h2 style={{
              fontFamily: SERIF,
              fontSize: 32,
              fontWeight: 500,
              color: '#0b0906',
              marginBottom: 20,
              lineHeight: 1.2,
            }}>
              {post.title}
            </h2>

            <p style={{
              fontFamily: SANS,
              fontSize: 16,
              color: '#5a5045',
              lineHeight: 1.7,
              marginBottom: 24,
            }}>
              {post.excerpt}
            </p>

            <div style={{
              fontFamily: SANS,
              fontSize: 12,
              color: '#8a7d6a',
            }}>
              {post.readingTime} min read
            </div>
          </div>

          {/* Right: Image */}
          {post.coverImage && (
            <div style={{
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#e8e4dc',
            }}>
              <img
                src={post.coverImage}
                alt={post.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              />
            </div>
          )}
        </a>
      ))}
    </div>
  );
}

// ── Mixed Style: Alternating image left/right ────────────────────────────
export function MixedStyle({ posts = [] }) {
  return (
    <div style={{ marginBottom: 48 }}>
      {posts.map((post, idx) => (
        <a
          key={post.id}
          href={`/magazine/${post.slug}`}
          style={{
            display: 'grid',
            gridTemplateColumns: idx % 2 === 0 ? '1fr 1fr' : '1fr 1fr',
            gap: 40,
            alignItems: 'center',
            marginBottom: idx < posts.length - 1 ? 56 : 0,
            paddingBottom: idx < posts.length - 1 ? 56 : 0,
            borderBottom: idx < posts.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
            textDecoration: 'none',
          }}
        >
          {/* Conditional order based on index */}
          {idx % 2 === 0 ? (
            <>
              {/* Text first */}
              <div>
                <div style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: GOLD,
                  marginBottom: 12,
                }}>
                  {post.category}
                </div>

                <h3 style={{
                  fontFamily: SERIF,
                  fontSize: 24,
                  fontWeight: 500,
                  color: '#0b0906',
                  marginBottom: 16,
                  lineHeight: 1.3,
                }}>
                  {post.title}
                </h3>

                <p style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  color: '#5a5045',
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}>
                  {post.excerpt}
                </p>

                <div style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: '#8a7d6a',
                }}>
                  {post.readingTime} min read
                </div>
              </div>

              {/* Image second */}
              {post.coverImage && (
                <div style={{
                  width: '100%',
                  aspectRatio: '4/3',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#e8e4dc',
                }}>
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Image first */}
              {post.coverImage && (
                <div style={{
                  width: '100%',
                  aspectRatio: '4/3',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#e8e4dc',
                }}>
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                    }}
                  />
                </div>
              )}

              {/* Text second */}
              <div>
                <div style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: GOLD,
                  marginBottom: 12,
                }}>
                  {post.category}
                </div>

                <h3 style={{
                  fontFamily: SERIF,
                  fontSize: 24,
                  fontWeight: 500,
                  color: '#0b0906',
                  marginBottom: 16,
                  lineHeight: 1.3,
                }}>
                  {post.title}
                </h3>

                <p style={{
                  fontFamily: SANS,
                  fontSize: 14,
                  color: '#5a5045',
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}>
                  {post.excerpt}
                </p>

                <div style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: '#8a7d6a',
                }}>
                  {post.readingTime} min read
                </div>
              </div>
            </>
          )}
        </a>
      ))}
    </div>
  );
}

// ── Featured Style: Hero dominant, large image ────────────────────────────
export function FeaturedStyle({ posts = [] }) {
  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div style={{ marginBottom: 48 }}>
      {featured && (
        <a
          href={`/magazine/${featured.slug}`}
          style={{
            display: 'block',
            marginBottom: 48,
            borderRadius: 12,
            overflow: 'hidden',
            textDecoration: 'none',
          }}
        >
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
            {featured.coverImage && (
              <img
                src={featured.coverImage}
                alt={featured.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}

            {/* Overlay content */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: 40,
              color: 'white',
            }}>
              <div style={{
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: GOLD,
                marginBottom: 12,
              }}>
                Featured
              </div>

              <h2 style={{
                fontFamily: SERIF,
                fontSize: 42,
                fontWeight: 500,
                marginBottom: 12,
                lineHeight: 1.2,
              }}>
                {featured.title}
              </h2>

              <p style={{
                fontFamily: SANS,
                fontSize: 15,
                lineHeight: 1.6,
                opacity: 0.9,
                maxWidth: '80%',
              }}>
                {featured.excerpt}
              </p>
            </div>
          </div>
        </a>
      )}

      {/* Supporting posts in grid */}
      {rest.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {rest.map(post => (
            <a
              key={post.id}
              href={`/magazine/${post.slug}`}
              style={{
                textDecoration: 'none',
                borderRadius: 8,
                overflow: 'hidden',
                border: `1px solid rgba(201,169,110,0.15)`,
                transition: 'all 0.3s ease',
              }}
            >
              {post.coverImage && (
                <div style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  background: '#e8e4dc',
                  overflow: 'hidden',
                }}>
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}

              <div style={{ padding: 16 }}>
                <div style={{
                  fontFamily: SANS,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: GOLD,
                  marginBottom: 8,
                }}>
                  {post.category}
                </div>

                <h4 style={{
                  fontFamily: SERIF,
                  fontSize: 16,
                  fontWeight: 500,
                  color: '#0b0906',
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}>
                  {post.title}
                </h4>

                <div style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: '#8a7d6a',
                }}>
                  {post.readingTime} min
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Renderer: Choose style and render ───────────────────────────────
export default function DisplayStyleRenderer({ displayStyle = 'grid', posts = [] }) {
  switch (displayStyle) {
    case 'editorial':
      return <EditorialStyle posts={posts} />;
    case 'mixed':
      return <MixedStyle posts={posts} />;
    case 'featured':
      return <FeaturedStyle posts={posts} />;
    case 'grid':
    default:
      return <GridStyle posts={posts} />;
  }
}
