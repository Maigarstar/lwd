// ═══════════════════════════════════════════════════════════════════════════
// PartnerEnquiryPage
// Public-facing page for venues and vendors wanting to get listed on LWD
// Route: /partner-enquiry
// ═══════════════════════════════════════════════════════════════════════════

import PartnerEnquiryForm from '../components/enquiry/PartnerEnquiryForm';

export default function PartnerEnquiryPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#faf9f6',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Minimal header */}
      <header style={{
        borderBottom: '1px solid rgba(168,132,38,0.15)',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
      }}>
        <a href="/" style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#171717',
          textDecoration: 'none',
        }}>
          Luxury Wedding Directory
        </a>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: '#8f7420',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          Partner with Us
        </span>
      </header>

      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '64px 24px 80px',
      }}>
        {/* Page heading */}
        <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 560 }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#8f7420',
            marginBottom: 14,
          }}>
            Join the Directory
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 40,
            fontWeight: 600,
            color: '#171717',
            margin: '0 0 16px',
            lineHeight: 1.15,
            letterSpacing: '0.01em',
          }}>
            List Your Venue or Business
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            color: '#666',
            lineHeight: 1.7,
            margin: 0,
          }}>
            Reach thousands of couples planning luxury weddings. Tell us about your business and we will be in touch.
          </p>
        </div>

        {/* Form */}
        <PartnerEnquiryForm />

        {/* Trust signals */}
        <div style={{
          marginTop: 56,
          display: 'flex',
          gap: 40,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 600,
        }}>
          {[
            { stat: '500+', label: 'Luxury Venues' },
            { stat: '50k+', label: 'Monthly Visitors' },
            { stat: '98%', label: 'Partner Satisfaction' },
          ].map(({ stat, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 28,
                fontWeight: 600,
                color: '#8f7420',
                lineHeight: 1,
              }}>{stat}</div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                color: '#999',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginTop: 4,
              }}>{label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Minimal footer */}
      <footer style={{
        borderTop: '1px solid rgba(168,132,38,0.12)',
        padding: '20px 40px',
        textAlign: 'center',
        background: '#fff',
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: '#bbb',
          margin: 0,
        }}>
          &copy; {new Date().getFullYear()} Luxury Wedding Directory. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
