import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const DEV_SKIP_AUTH = true;

const ADMIN_PAGES = new Set([
  'admin', 'admin-login', 'admin-oauth-callback',
  'vendor', 'vendor-login', 'vendor-signup', 'vendor-activate',
  'vendor-confirm-email', 'vendor-forgot-password', 'vendor-reset-password',
  'portal', 'getting-married', 'magazine-studio',
  'couple-signup', 'couple-login', 'couple-confirm-email',
  'couple-forgot-password', 'couple-reset-password',
  'event-review', 'join',
]);

const STATIC_SHOWCASE_SLUGS = {
  'dde-showcase':           'domaine-des-etangs',
  'ritz-showcase':          'the-ritz-london',
  'ic-park-lane-showcase':  'intercontinental-london-park-lane',
  'gt-showcase':            'grand-tirolia-kitzbuehel',
  'sskrabey-showcase':      'six-senses-krabey-island',
};

function getEditContext(page, { showcaseSlug, venueSlug, magazineSlug, eventSlug }) {
  if (STATIC_SHOWCASE_SLUGS[page]) {
    return {
      type:     'showcase-static',
      label:    'Edit Showcase',
      slug:     STATIC_SHOWCASE_SLUGS[page],
      disabled: true,
    };
  }
  switch (page) {
    case 'showcase':
      return { type: 'showcase', label: 'Edit Showcase', slug: showcaseSlug, disabled: false };
    case 'venue-profile':
    case 'listing-profile':
      return { type: 'listing', label: 'Edit Listing', slug: venueSlug, disabled: false };
    case 'magazine-article':
      return { type: 'article', label: 'Edit Article', slug: magazineSlug, disabled: false };
    case 'event-detail':
      return { type: 'event', label: 'Edit Event', slug: eventSlug, disabled: false };
    default:
      return null;
  }
}

export default function GlobalAdminBar({ page, slugs = {}, onOpenAdmin }) {
  const { isAuthenticated } = useAdminAuth();
  const [hovered,     setHovered]     = useState(false);
  const [tipVisible,  setTipVisible]  = useState(false);

  if (!isAuthenticated && !DEV_SKIP_AUTH) return null;
  if (ADMIN_PAGES.has(page)) return null;

  const ctx = getEditContext(page, slugs);
  if (!ctx) return null;

  function handleClick() {
    const returnPath = window.location.pathname;

    if (ctx.disabled) {
      try {
        sessionStorage.setItem('lwd_admin_edit_intent', JSON.stringify({
          type:       'showcase-static',
          slug:       ctx.slug,
          returnPath,
        }));
      } catch {}
      onOpenAdmin?.();
      return;
    }

    try {
      sessionStorage.setItem('lwd_admin_edit_intent', JSON.stringify({
        type:       ctx.type,
        slug:       ctx.slug,
        returnPath,
      }));
    } catch {}
    onOpenAdmin?.();
  }

  const pill = (
    <div
      style={{
        position:   'fixed',
        bottom:     90,
        right:      28,
        zIndex:     9000,
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap:        6,
        pointerEvents: 'none',
      }}
    >
      {ctx.disabled && tipVisible && (
        <div style={{
          pointerEvents:  'none',
          background:     'rgba(20,16,12,0.96)',
          color:          'rgba(245,240,232,0.75)',
          fontFamily:     'var(--font-body)',
          fontSize:       11,
          lineHeight:     1.5,
          padding:        '8px 12px',
          borderRadius:   6,
          maxWidth:       220,
          textAlign:      'right',
          border:         '1px solid rgba(201,168,76,0.18)',
        }}>
          Static template — not yet connected to Studio.
          Clicking opens the Showcase list so you can link a record.
        </div>
      )}

      <button
        onClick={handleClick}
        onMouseEnter={() => { setHovered(true); if (ctx.disabled) setTipVisible(true); }}
        onMouseLeave={() => { setHovered(false); setTipVisible(false); }}
        style={{
          pointerEvents:   'auto',
          display:         'flex',
          alignItems:      'center',
          gap:             6,
          padding:         '8px 14px',
          borderRadius:    100,
          border:          ctx.disabled
            ? '1px solid rgba(201,168,76,0.25)'
            : '1px solid rgba(201,168,76,0.4)',
          background:      hovered && !ctx.disabled
            ? 'rgba(40,32,20,0.97)'
            : 'rgba(20,16,12,0.93)',
          color:           ctx.disabled ? 'rgba(201,168,76,0.45)' : '#C9A84C',
          fontFamily:      'var(--font-body)',
          fontSize:        11,
          fontWeight:      700,
          letterSpacing:   '0.08em',
          textTransform:   'uppercase',
          cursor:          ctx.disabled ? 'default' : 'pointer',
          opacity:         ctx.disabled ? 0.72 : 1,
          boxShadow:       '0 2px 12px rgba(0,0,0,0.35)',
          transition:      'background 0.18s, opacity 0.18s',
          userSelect:      'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ fontSize: 12, lineHeight: 1 }}>✦</span>
        {ctx.label}
      </button>
    </div>
  );

  return createPortal(pill, document.body);
}
