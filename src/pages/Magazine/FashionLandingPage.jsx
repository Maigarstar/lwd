import { useState } from 'react';
import { POSTS, getPostsByCategory } from './data/posts';
import { CATEGORIES } from './data/categories';
import { getProductsByCollection } from './data/products';
import ProductCard from './components/ProductCard';
import MagazineNav from './components/MagazineNav';
import PostCard, { CardLargeEditorial, CardOverlay } from './components/PostCards';
import NewsletterCapture from './components/NewsletterCapture';
import {
  ShoppableProductRow,
  BeautyShelf,
  AccessoriesEdit,
  DesignerSpotlight,
  TrendReport,
  FashionQuote,
  ThreeItemLuxuryEdit,
  GiftGuideRow,
  AffiliateBreak,
  MoodBoard,
  StyleAdvice,
} from './components/FashionModules';

const FU = "'Nunito', 'Inter', 'Helvetica Neue', sans-serif";
const FD = "'Gilda Display', 'Playfair Display', Georgia, serif";
const GOLD = '#c9a96e';
const CREAM = '#f5f0e8';

// ─── Sub-nav for Fashion section ────────────────────────────────────────────────
const FASHION_CATEGORIES = [
  { id: 'all',            label: 'All Fashion' },
  { id: 'bridal-gowns',  label: 'Bridal Gowns' },
  { id: 'shoes',         label: 'Shoes' },
  { id: 'jewellery',     label: 'Jewellery & Accessories' },
  { id: 'beauty',        label: 'Beauty' },
  { id: 'guest-dresses', label: 'Guest Dresses' },
  { id: 'honeymoon',     label: 'Honeymoon Style' },
  { id: 'designers',     label: 'Designers' },
];

function FashionSubNav({ active, onChange, isLight }) {
  const BG     = isLight ? 'rgba(250,250,248,0.97)' : 'rgba(10,10,10,0.96)';
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)';
  const OFF    = isLight ? 'rgba(30,28,22,0.4)' : 'rgba(245,240,232,0.4)';
  return (
    <div style={{
      position: 'sticky', top: 92, zIndex: 100,
      background: BG, borderBottom: `1px solid ${BORDER}`,
      backdropFilter: 'blur(14px)',
    }}>
      <style>{`
        .fsn { display:flex; overflow-x:auto; scrollbar-width:none; padding:0 clamp(20px,4vw,60px); }
        .fsn::-webkit-scrollbar { display:none; }
        .fsn-btn { font-family:${FU}; font-size:10px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; background:none; border:none; padding:12px 16px; cursor:pointer; white-space:nowrap; border-bottom:2px solid transparent; transition:color 0.2s,border-color 0.2s; color:${OFF}; }
        .fsn-btn:hover { color:${isLight ? 'rgba(30,28,22,0.8)' : 'rgba(245,240,232,0.8)'} !important; }
        .fsn-btn.active { color:${GOLD} !important; border-bottom-color:${GOLD} !important; }
      `}</style>
      <div className="fsn">
        {FASHION_CATEGORIES.map(c => (
          <button
            key={c.id}
            className={`fsn-btn${active === c.id ? ' active' : ''}`}
            onClick={() => onChange(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function FashionSectionHeader({ eyebrow, title, isLight, onViewAll, viewAllLabel }) {
  const TEXT = isLight ? '#1a1806' : CREAM;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD }}>
            {eyebrow}
          </span>
        </div>
        {title && (
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 400, color: TEXT, margin: 0, lineHeight: 1.1 }}>
            {title}
          </h2>
        )}
      </div>
      {onViewAll && (
        <button onClick={onViewAll} style={{
          fontFamily: FU, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: GOLD, background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 0', borderBottom: `1px solid ${GOLD}40`, whiteSpace: 'nowrap', flexShrink: 0,
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderBottomColor = GOLD}
          onMouseLeave={e => e.currentTarget.style.borderBottomColor = `${GOLD}40`}
        >
          {viewAllLabel || 'View All'} →
        </button>
      )}
    </div>
  );
}

// ─── Fashion Hero ──────────────────────────────────────────────────────────────
function FashionHero({ post, isLight, onRead }) {
  const [hov, setHov] = useState(false);
  if (!post) return null;
  return (
    <section
      style={{ position: 'relative', overflow: 'hidden', minHeight: 'clamp(520px,72svh,760px)', display: 'flex', alignItems: 'flex-end', cursor: 'pointer' }}
      onClick={() => onRead && onRead(post)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${post.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center 30%',
        transform: hov ? 'scale(1.03)' : 'scale(1)',
        transition: 'transform 0.8s ease',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.05) 100%)' }} />
      <div style={{ position: 'relative', padding: 'clamp(40px,6vw,80px) clamp(24px,6vw,80px)', maxWidth: 720 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD }}>
            Fashion Cover Story
          </span>
        </div>
        <h1 style={{ fontFamily: FD, fontSize: 'clamp(36px,5.5vw,72px)', fontWeight: 400, color: CREAM, margin: '0 0 18px', lineHeight: 1.05 }}>
          {post.title}
        </h1>
        <p style={{ fontFamily: FU, fontSize: 'clamp(13px,1.4vw,16px)', fontWeight: 300, color: 'rgba(245,240,232,0.7)', margin: '0 0 32px', lineHeight: 1.65, maxWidth: 520 }}>
          {post.standfirst || post.excerpt}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button style={{
            fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#0a0a0a', background: GOLD, border: 'none',
            padding: '13px 28px', borderRadius: 1, cursor: 'pointer', transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.88}
            onMouseLeave={e => e.currentTarget.style.opacity = 1}
          >
            Read the Story
          </button>
          <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.55)' }}>
            By {post.author?.name} · {post.readingTime} min read
          </span>
        </div>
      </div>
    </section>
  );
}

// ─── Editorial Grid, 3 fashion stories ────────────────────────────────────────
function FashionEditorialGrid({ posts, isLight, onRead }) {
  const BG    = isLight ? '#fafaf8' : '#0a0a0a';
  const TEXT  = isLight ? '#1a1806' : CREAM;
  return (
    <section style={{ background: BG, padding: 'clamp(56px,8vw,100px) clamp(24px,5vw,80px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <FashionSectionHeader eyebrow="Sofia's Picks" title="The Fashion Edit" isLight={isLight} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 'clamp(32px,4vw,52px)' }}>
          {posts.map(p => (
            <CardLargeEditorial key={p.id} post={p} onClick={onRead} light={isLight} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Fashion + Commerce Two-Column ─────────────────────────────────────────────
function FashionPlusShop({ post, products, isLight, onRead }) {
  const BG    = isLight ? '#f5f3ef' : '#080806';
  const TEXT  = isLight ? '#1a1806' : CREAM;
  const MUTED = isLight ? 'rgba(30,28,22,0.5)' : 'rgba(245,240,232,0.5)';
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.1)';
  if (!post) return null;
  return (
    <section style={{ background: BG }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(56px,8vw,100px) clamp(24px,5vw,80px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,72px)', alignItems: 'start' }}>
          {/* Editorial side */}
          <div>
            <FashionSectionHeader eyebrow="Trend Report" title="Right Now" isLight={isLight} />
            <article onClick={() => onRead && onRead(post)} style={{ cursor: 'pointer' }}>
              <div style={{ overflow: 'hidden', borderRadius: 2, marginBottom: 20 }}>
                <img src={post.coverImage} alt={post.title} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>
              <div style={{ fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
                {post.categoryLabel}
              </div>
              <h3 style={{ fontFamily: FD, fontSize: 'clamp(20px,2.5vw,32px)', fontWeight: 400, color: TEXT, margin: '0 0 12px', lineHeight: 1.15 }}>
                {post.title}
              </h3>
              <p style={{ fontFamily: FU, fontSize: 13, fontWeight: 300, color: MUTED, lineHeight: 1.65, margin: 0 }}>
                {post.excerpt}
              </p>
            </article>
          </div>
          {/* Commerce side */}
          <div>
            <FashionSectionHeader eyebrow="Shop the Edit" title="Gowns & Accessories" isLight={isLight} />
            {products.map(p => (
              <PostCard key={p.id} post={p} style="horizontal" onClick={onRead} light={isLight} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Style Edit Cards, shoppable story cards ───────────────────────────────────
function StyleEditCards({ items, isLight, onRead }) {
  // items: posts with shopping edit page type
  const BG   = isLight ? '#fafaf8' : '#0a0a0a';
  const TEXT = isLight ? '#1a1806' : CREAM;
  return (
    <section style={{ background: BG, padding: 'clamp(56px,8vw,100px) clamp(24px,5vw,80px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <FashionSectionHeader eyebrow="Shopping Edits" title="Style Edits" isLight={isLight} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 'clamp(16px,2.5vw,28px)' }}>
          {items.map(p => (
            <CardOverlay key={p.id} post={p} onClick={onRead} tall />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main FashionLandingPage ────────────────────────────────────────────────────
export default function FashionLandingPage({
  onNavigateArticle,
  onNavigateCategory,
  onNavigateHome,
  isLight = true,
  onToggleLight,
  footerNav = {},
}) {
  const [activeFashionCat, setActiveFashionCat] = useState('all');

  const fashionPosts   = getPostsByCategory('fashion');
  const trendPosts     = getPostsByCategory('trends').slice(0, 2);
  const heroPost       = fashionPosts.find(p => p.featured) || fashionPosts[0];
  const editPosts      = fashionPosts.filter(p => p.id !== heroPost?.id).slice(0, 3);
  const moreEditorial  = fashionPosts.slice(0, 4);

  const goArticle = post => onNavigateArticle && onNavigateArticle(post.slug);

  // Products
  const bridalGowns    = getProductsByCollection('bridal-gowns');
  const bridalShoes    = getProductsByCollection('bridal-shoes');
  const jewellery      = getProductsByCollection('bridal-jewellery');
  const beauty         = getProductsByCollection('bridal-beauty');
  const accessories    = getProductsByCollection('accessories-edit');
  const guestDresses   = getProductsByCollection('guest-dresses');

  // Theme tokens
  const BG  = isLight ? '#fafaf8' : '#0a0a0a';
  const BG2 = isLight ? '#f0ece3' : '#080806';
  const TEXT = isLight ? '#1a1806' : '#f5f0e8';
  const BORDER = isLight ? 'rgba(30,28,22,0.08)' : 'rgba(201,169,110,0.08)';

  return (
    <div style={{ background: BG, minHeight: '100vh', transition: 'background 0.35s' }}>
      <MagazineNav
        activeCategoryId="fashion"
        onNavigateHome={onNavigateHome}
        onNavigateCategory={onNavigateCategory}
        onNavigateArticle={goArticle}
        isLight={isLight}
        onToggleLight={onToggleLight}
      />

      {/* Fashion Sub-Nav */}
      <FashionSubNav active={activeFashionCat} onChange={setActiveFashionCat} isLight={isLight} />

      {/* ── Hero Fashion Story ─────────────────────────────────────────────── */}
      <FashionHero post={heroPost} isLight={isLight} onRead={goArticle} />

      {/* ── The Fashion Edit (editorial cards) ────────────────────────────── */}
      {editPosts.length > 0 && (
        <FashionEditorialGrid posts={editPosts} isLight={isLight} onRead={goArticle} />
      )}

      {/* ── Shop the Bridal Edit, Gowns ──────────────────────────────────── */}
      <ShoppableProductRow
        subline="Bridal 2026"
        headline="Gowns Worth Every Fitting"
        products={bridalGowns}
        isLight={isLight}
        ctaLabel="View All Gowns"
        onCtaClick={() => onNavigateCategory && onNavigateCategory('fashion')}
      />

      {/* ── Fashion Quote ─────────────────────────────────────────────────── */}
      <div style={{ background: BG2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <FashionQuote
          quote="The most beautiful wedding dress is the one you will still want to look at in thirty years."
          attribution="Sofia Esposito, Fashion & Beauty Editor"
          isLight={isLight}
        />
      </div>

      {/* ── Trend Report ──────────────────────────────────────────────────── */}
      {trendPosts[0] && (
        <section style={{ background: BG, padding: 'clamp(56px,8vw,100px) clamp(24px,5vw,80px)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <FashionSectionHeader eyebrow="The Season's Stories" title="Trend Reports" isLight={isLight} onViewAll={() => onNavigateCategory && onNavigateCategory('trends')} />
            <TrendReport
              trend={{ ...trendPosts[0], image: trendPosts[0].coverImage, label: 'Trend Report' }}
              isLight={isLight}
              onRead={() => goArticle(trendPosts[0])}
            />
          </div>
        </section>
      )}

      {/* ── Shop Shoes ────────────────────────────────────────────────────── */}
      <ShoppableProductRow
        subline="The Walk"
        headline="Bridal Shoes"
        products={bridalShoes}
        isLight={isLight}
        ctaLabel="View All Shoes"
      />

      {/* ── Style Advice ──────────────────────────────────────────────────── */}
      <section style={{ background: BG, padding: 'clamp(56px,8vw,100px) clamp(24px,5vw,80px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <StyleAdvice
            heading="How to Choose Your Wedding Dress"
            body="The single most important piece of advice we give every bride: do not go to fittings with a visual mood board. Go with an open mind. The dress that will make you look extraordinary is almost never the dress you pinned. Your body knows what it wants. Let it tell you."
            tip="Wear the dress that makes you feel like the most beautiful version of yourself, not the most beautiful version of someone else."
            author="Sofia Esposito, Fashion & Beauty Editor"
            isLight={isLight}
          />
        </div>
      </section>

      {/* ── Designer Spotlight ────────────────────────────────────────────── */}
      <section style={{ padding: '0 clamp(24px,5vw,80px) clamp(56px,8vw,100px)', background: BG }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <DesignerSpotlight
            designer={{
              name: 'Valentino Haute Couture',
              country: 'Rome, Italy · Est. 1960',
              heroImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4883?auto=format&fit=crop&w=1200&q=80',
              story: 'For sixty years, the house of Valentino has understood something that other designers are still learning: that true luxury is not about excess. Their bridal work, always made in the Roman atelier by artisans who have spent decades perfecting the craft, achieves that rare quality of feeling inevitable. Not a detail added, not a detail missing.',
              signature: 'The most elegant dress is always the one with fewer choices to make.',
              ctaLabel: 'Explore Valentino Bridal →',
            }}
            isLight={isLight}
            onRead={() => {}}
          />
        </div>
      </section>

      {/* ── Beauty Edit ───────────────────────────────────────────────────── */}
      <BeautyShelf
        headline="The Bridal Beauty Edit"
        products={beauty}
        isLight={isLight}
      />

      {/* ── Affiliate Break ───────────────────────────────────────────────── */}
      <AffiliateBreak
        brand="Jimmy Choo Bridal"
        tagline="The Perfect Sole"
        description="Since 1996, Jimmy Choo has been the first choice for brides who understand that the right shoe does not end a look, it begins it. The 2026 Bridal Collection is the finest they have produced."
        image="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1920&q=80"
        ctaLabel="Shop the Bridal Collection"
        ctaUrl="#"
        isLight={isLight}
      />

      {/* ── Accessories Edit ──────────────────────────────────────────────── */}
      <AccessoriesEdit
        headline="The Accessories Edit"
        products={accessories}
        isLight={isLight}
      />

      {/* ── Jewellery ─────────────────────────────────────────────────────── */}
      <ShoppableProductRow
        subline="Wear Forever"
        headline="Bridal Jewellery"
        products={jewellery}
        isLight={isLight}
        ctaLabel="View All Jewellery"
      />

      {/* ── Guest Dresses ─────────────────────────────────────────────────── */}
      <section style={{ background: BG2, padding: 'clamp(56px,8vw,100px) clamp(24px,5vw,80px)', borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <FashionSectionHeader eyebrow="For Your Guests" title="Wedding Guest Dresses" isLight={isLight} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 'clamp(16px,2vw,28px)' }}>
            {guestDresses.map(p => (
              <div key={p.id} style={{ display: 'grid' }}>
                {/* Inline import to avoid circular dep */}
                <GuestDressCard product={p} isLight={isLight} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Three-Item Luxury Intro ────────────────────────────────────────── */}
      <section style={{ background: BG, padding: 'clamp(56px,8vw,100px) clamp(24px,5vw,80px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <ThreeItemLuxuryEdit
            headline="Three Things Worth Knowing About This Season"
            products={[bridalGowns[0], bridalShoes[0], jewellery[0]].filter(Boolean)}
            isLight={isLight}
          />
        </div>
      </section>

      <NewsletterCapture />
    </div>
  );
}

// ─── Guest Dress Card (thin wrapper) ──────────────────────────────────────────
function GuestDressCard({ product, isLight }) {
  return <ProductCard product={product} variant="portrait" isLight={isLight} />;
}
