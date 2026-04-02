// ─── src/pages/EditorialShowcase.jsx ─────────────────────────────────────────
// Visual test page for the editorial card system.
// Route: /editorial-showcase
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  StandardCard,
  EditorialProductCard,
  ImageOverlayCard,
  FeatureCard,
  MosaicCard,
  QuoteCard,
  CategoryTileCard,
  CarouselCard,
  CarouselRow,
  EditorialFeatureCard,
  VenueStatsCard,
  AmenitiesCard,
  TwoColumnEditorialCard,
  ParallaxBannerCard,
} from '../components/cards/editorial';
import { GD, NU, S, GOLD } from '../components/cards/editorial';
import { useBreakpoint } from '../hooks/useWindowWidth';

// ── Grand Tirolia photos ──────────────────────────────────────────────────────
const GT = {
  aerial1:    '/grand-tirolia/20250819_GTK_DJI_0314.jpg',      // summer aerial, golf + mountains
  aerial2:    '/grand-tirolia/20250820_GTK_DJI_0382-HDR.jpg',  // misty morning aerial
  cocktails:  '/grand-tirolia/20250819_GTK_A9_01073.jpg',       // negroni + white cocktail
  restaurant: '/grand-tirolia/20250821_GTK_A7_08271.jpg',       // restaurant interior
  atrium:     '/grand-tirolia/Atrium_2024.jpg',                  // curved LED ballroom
  food1:      '/grand-tirolia/GT_Juli_2023_Restaurant_Food_17.jpg', // carrot/herb dish
  food2:      '/grand-tirolia/GT_Juli_2023_Restaurant_Food_3.jpg',  // lamb rack
  jazzclub:   '/grand-tirolia/GT_Jazzclub_high_169.jpg',        // jazzclub whisky bar
  cooperBar:  '/grand-tirolia/Grand_Tirolia_Cooper_Bar.jpg',    // cooper bar arches
  terrace:    '/grand-tirolia/GrandTirolia_DeluxeZimmer_Balkon_Terrasse.jpg', // winter terrace
  food3:      '/grand-tirolia/GrandTirolia_Juni2024_199.jpg',   // burrata + marble table
  food4:      '/grand-tirolia/GrandTirolia_Juni2024_200.jpg',   // fish on marble table
  food5:      '/grand-tirolia/GrandTirolia_Juni2024_204.jpg',   // ribs on marble table
};

// ── Sample images, Paris by Giuseppe Suma ────────────────────────────────────
const IMG = {
  // Portrait (couple & street, vertical)
  portrait1:  '/paris/_SMU0856.jpg',  // couple at the Louvre (colour)
  portrait2:  '/paris/_SMU0511.jpg',  // couple on bench, B&W
  portrait3:  '/paris/_SMU0725.jpg',  // woman at café, B&W
  portrait4:  '/paris/_SMU0683.jpg',  // couple at café (colour)
  portrait5:  '/paris/_SMU0573.jpg',  // couple hands close-up, B&W
  // Landscape / architecture
  landscape1: '/paris/_SMU0398.jpg',  // Palais Royal courtyard
  landscape2: '/paris/_SMU0490.jpg',  // tree-lined autumn avenue
  landscape3: '/paris/_SMU0619.jpg',  // Parisian street scene
  // Wide
  wide1:      '/paris/_SMU0398.jpg',  // Palais Royal (wider)
  wide2:      '/paris/_SMU1097.jpg',  // B&W street, Saint André café
  // Product (Unsplash, fashion/bridal shots)
  product1:   'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80',
  product2:   'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
  product3:   'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
};

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 80 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 32, paddingBottom: 16,
        borderBottom: '1px solid rgba(122,95,16,0.25)',
      }}>
        <h2 style={{
          fontFamily: GD, fontSize: 22, fontWeight: 400,
          color: '#7a5f10', margin: 0, letterSpacing: '0.02em',
        }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

// ── Grid helper ───────────────────────────────────────────────────────────────
function Grid({ cols = 3, gap = 24, children }) {
  const { isMobile, isTablet } = useBreakpoint();
  const effectiveCols = isMobile ? 1 : (isTablet ? Math.min(cols, 2) : cols);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${effectiveCols}, 1fr)`,
      gap,
    }}>
      {children}
    </div>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────
function Label({ text }) {
  return (
    <p style={{
      fontFamily: NU,
      fontSize: 10,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#888',
      margin: '0 0 10px',
    }}>
      {text}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function EditorialShowcase() {
  const [saved, setSaved] = useState({});
  const toggle = key => setSaved(p => ({ ...p, [key]: !p[key] }));

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: NU }}>
    <div style={{
      maxWidth: 1300,
      margin: '0 auto',
      padding: '60px 40px',
    }}>

      {/* Page header */}
      <div style={{ textAlign: 'center', marginBottom: 72 }}>
        <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7a5f10', margin: '0 0 12px' }}>
          Internal
        </p>
        <h1 style={{ fontFamily: GD, fontSize: 48, fontWeight: 400, color: '#0a0a0a', margin: '0 0 12px', lineHeight: 1.1 }}>
          Editorial Card System
        </h1>
        <p style={{ fontFamily: NU, fontSize: 14, color: '#555', fontWeight: 300, margin: 0 }}>
          13 card types · all variants · light & dark mode · Grand Tirolia showcase
        </p>
      </div>

      {/* ── 1. Standard Card ─────────────────────────────────────────────── */}
      <Section title="1 · Standard Card">
        <Grid cols={3}>
          <div>
            <Label text="Default (portrait)" />
            <StandardCard data={{
              image: IMG.portrait1,
              title: 'The New Rules of Bridal Dressing',
              category: 'Fashion',
              date: '12 March 2026',
              saved: !!saved.s1, onSave: () => toggle('s1'),
              onClick: () => {},
            }} />
          </div>
          <div>
            <Label text="Landscape variant" />
            <StandardCard data={{
              image: IMG.landscape1,
              title: 'Why Italy Remains the Most Romantic Wedding Destination',
              category: 'Travel',
              date: '10 March 2026',
              variant: 'landscape',
              onClick: () => {},
            }} />
          </div>
          <div>
            <Label text="Minimal variant" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { title: 'The Bridal Beauty Trends Dominating 2026', category: 'Beauty' },
                { title: 'How to Choose Your Wedding Florist', category: 'Planning' },
                { title: 'The Best Honeymoon Hotels in Europe', category: 'Travel' },
              ].map((d, i) => (
                <StandardCard key={i} data={{
                  image: [IMG.portrait2, IMG.portrait3, IMG.portrait4][i],
                  ...d, variant: 'minimal',
                  date: `${10 - i} Mar 2026`,
                  onClick: () => {},
                }} />
              ))}
            </div>
          </div>
        </Grid>
      </Section>

      {/* ── 2. Editorial Product Card ─────────────────────────────────────── */}
      <Section title="2 · Editorial Product Card">
        <Grid cols={3}>
          <div>
            <Label text="Default (portrait)" />
            <EditorialProductCard data={{
              image: IMG.product1,
              brand: 'Jenny Packham',
              title: 'Celestine Beaded Gown',
              editorialNote: 'Our editors\' top pick for the modern bride seeking understated glamour.',
              price: '£3,200',
              href: '#',
              saved: !!saved.p1, onSave: () => toggle('p1'),
              onClick: () => {},
            }} />
          </div>
          <div>
            <Label text="Compact (landscape)" />
            <EditorialProductCard data={{
              image: IMG.landscape2,
              brand: 'Temperley London',
              title: 'Moonflower Silk Midi Dress',
              editorialNote: 'A dream for the guest who wants to be remembered.',
              price: '£895',
              href: '#',
              variant: 'compact',
              onClick: () => {},
            }} />
          </div>
          <div>
            <Label text="Light theme forced" />
            <EditorialProductCard data={{
              image: IMG.product2,
              brand: 'Halfpenny London',
              title: 'Wren Floral Bridal Separates',
              price: '£1,450',
              href: '#',
              theme: 'light',
              onClick: () => {},
            }} />
          </div>
        </Grid>
      </Section>

      {/* ── 3. Image Overlay Card ─────────────────────────────────────────── */}
      <Section title="3 · Image Overlay Card">
        <Grid cols={2}>
          <div>
            <Label text="Default (gradient + text bottom)" />
            <ImageOverlayCard data={{
              image: IMG.landscape3,
              title: 'Amalfi Coast: The Ultimate Wedding Planning Guide',
              category: 'Destinations',
              date: '8 March 2026',
              saved: !!saved.io1, onSave: () => toggle('io1'),
              onClick: () => {},
              height: '420px',
            }} />
          </div>
          <div>
            <Label text="Floating box variant" />
            <ImageOverlayCard data={{
              image: IMG.wide1,
              title: 'Honeymoon Hotels That Redefine Romance',
              category: 'Travel',
              excerpt: 'From overwater bungalows to private cliff-top retreats, the very best addresses.',
              variant: 'floating-box',
              onClick: () => {},
              height: '420px',
            }} />
          </div>
        </Grid>
      </Section>

      {/* ── 4. Feature Card ───────────────────────────────────────────────── */}
      <Section title="4 · Feature Card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <Label text="Image left (default)" />
            <FeatureCard data={{
              image: IMG.landscape2,
              title: 'The Dress That Changed Everything',
              excerpt: 'How one couture house redefined what it means to be a modern bride, and why the world is still talking.',
              category: 'Fashion',
              date: '5 March 2026',
              accentBg: '#3d3a35',
              saved: !!saved.f1, onSave: () => toggle('f1'),
              onClick: () => {},
              height: '480px',
            }} />
          </div>
          <div>
            <Label text="Image right + olive panel" />
            <FeatureCard data={{
              image: IMG.landscape3,
              title: 'Why Lake Como Is Still the World\'s Most Romantic Address',
              excerpt: 'Ancient villas, crystalline waters, and wedding celebrations that last three days.',
              category: 'Destinations',
              accentBg: '#5c5f4a',
              variant: 'image-right',
              onClick: () => {},
              height: '400px',
            }} />
          </div>
        </div>
      </Section>

      {/* ── 5. Mosaic Card ────────────────────────────────────────────────── */}
      <Section title="5 · Mosaic Card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <Label text="Default (4 panels + floating text)" />
            <MosaicCard data={{
              images: [IMG.portrait1, IMG.portrait2, IMG.portrait3, IMG.portrait4],
              title: 'The Spring Bridal Edit',
              excerpt: 'From gossamer silks to structured lace, the pieces our editors can\'t stop talking about.',
              category: 'Fashion',
              date: 'March 2026',
              saved: !!saved.m1, onSave: () => toggle('m1'),
              onClick: () => {},
              height: '520px',
            }} />
          </div>
          <div>
            <Label text="Offset variant" />
            <MosaicCard data={{
              images: [IMG.landscape1, IMG.portrait5],
              title: 'The Gold Edit: Jewellery Worth Saving For',
              excerpt: 'Pieces that earn a permanent place on your jewellery stand.',
              category: 'Shopping',
              accentBg: '#7a6a3d',
              variant: 'offset',
              onClick: () => {},
              height: '420px',
            }} />
          </div>
        </div>
      </Section>

      {/* ── 6. Quote Card ─────────────────────────────────────────────────── */}
      <Section title="6 · Quote Card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <Label text="Centered (default)" />
            <QuoteCard data={{
              quote: 'A wedding is not a day, it is the beginning of a life. Plan it with the same care you\'ll give to everything that follows.',
              attribution: 'Vera Wang',
              attributionRole: 'Designer',
              accentBg: '#2a2825',
            }} />
          </div>
          <div>
            <Label text="With portrait image" />
            <QuoteCard data={{
              quote: 'The details are not the details. They make the design, and in bridal, they make the memory.',
              attribution: 'Sophie Pham',
              attributionRole: 'Senior Bridal Editor',
              image: IMG.portrait3,
              variant: 'with-portrait',
              accentBg: '#1e2220',
            }} />
          </div>
          <div>
            <Label text="Light theme" />
            <QuoteCard data={{
              quote: 'Every bride deserves to feel extraordinary. That\'s not a luxury, it\'s the standard we hold ourselves to.',
              attribution: 'Eliza Morton',
              attributionRole: 'Editor-in-Chief',
              theme: 'light',
            }} />
          </div>
        </div>
      </Section>

      {/* ── 7. Category Tile Card ─────────────────────────────────────────── */}
      <Section title="7 · Category Tile Card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <Label text="Banner (default), olive" />
            <CategoryTileCard data={{
              title: 'The Gold Edit',
              eyebrow: 'Curated for you',
              accentBg: '#5c5f4a',
              onClick: () => {},
            }} />
          </div>
          <div>
            <Label text="Banner, charcoal" />
            <CategoryTileCard data={{
              title: 'Honeymoon & Travel',
              eyebrow: 'Destinations',
              accentBg: '#2c2c2c',
              onClick: () => {},
            }} />
          </div>
          <Grid cols={2}>
            <div>
              <Label text="Tile (square), dark rose" />
              <CategoryTileCard data={{
                title: 'Bridal Fashion',
                eyebrow: 'Spring 2026',
                accentBg: '#4a2d2d',
                variant: 'tile',
                onClick: () => {},
              }} />
            </div>
            <div>
              <Label text="With image overlay" />
              <CategoryTileCard data={{
                title: 'Real Weddings',
                eyebrow: 'Inspiration',
                image: IMG.landscape1,
                variant: 'with-image',
                onClick: () => {},
              }} />
            </div>
          </Grid>
        </div>
      </Section>

      {/* ── 8. Carousel Card + CarouselRow ────────────────────────────────── */}
      <Section title="8 · Carousel Card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <Label text="Product carousel (default), full bleed" />
          </div>
        </div>
      </Section>

      {/* Full-bleed breakout for carousels */}
      <div style={{
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        marginBottom: 80,
      }}>
        <CarouselRow label="The Dress Edit" items={[
            { image: IMG.portrait1, brand: 'Jenny Packham', title: 'Celestine Gown', price: '£3,200' },
            { image: IMG.portrait2, brand: 'Amsale', title: 'Willow Column Dress', price: '£2,800' },
            { image: IMG.portrait3, brand: 'Halfpenny London', title: 'Wren Separates', price: '£1,450' },
            { image: IMG.portrait4, brand: 'Temperley London', title: 'Luna Silk Midi', price: '£895' },
            { image: IMG.portrait5, brand: 'Suzanne Neville', title: 'Opulence Ballgown', price: '£4,500' },
            { image: IMG.product1,  brand: 'Vera Wang', title: 'Gabriella Lace Gown', price: '£5,200' },
          ]} />
        <CarouselRow label="Latest Stories" variant="editorial" accentBg="#0f0f0f" items={[
            { image: IMG.landscape1, title: 'Amalfi in April', category: 'Travel', date: '8 March 2026' },
            { image: IMG.landscape2, title: 'The Silk Revival', category: 'Fashion', date: '9 March 2026' },
            { image: IMG.landscape3, title: 'Lake Como Villas', category: 'Destinations', date: '10 March 2026' },
            { image: IMG.landscape1, title: 'Bridal Beauty 2026', category: 'Beauty', date: '11 March 2026' },
          ]} />
      </div>

      {/* ── 9. Editorial Feature Card (hero) ──────────────────────────────── */}
      <Section title="9 · Editorial Feature Card (Hero)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div>
            <Label text="Mosaic, 5 panels (default)" />
            <EditorialFeatureCard data={{
              images: [IMG.portrait1, IMG.portrait2, IMG.portrait3, IMG.portrait4, IMG.portrait5],
              title: 'The Spring Bridal Collections',
              excerpt: 'Every look, every silhouette, every detail from the season\'s most anticipated shows.',
              category: 'Fashion',
              date: 'March 2026',
              saved: !!saved.ef1, onSave: () => toggle('ef1'),
              onClick: () => {},
              height: '72vh',
            }} />
          </div>
          <div>
            <Label text="Split, 70/30" />
            <EditorialFeatureCard data={{
              image: IMG.wide2,
              title: 'The Most Beautiful Wedding Venues in the World',
              excerpt: 'From ancient Italian villas to cliffside châteaux, the addresses every bride should know.',
              category: 'Destinations',
              date: 'March 2026',
              variant: 'split',
              saved: !!saved.ef2, onSave: () => toggle('ef2'),
              onClick: () => {},
              height: '60vh',
            }} />
          </div>
          <div>
            <Label text="Cinematic, single full-bleed" />
            <EditorialFeatureCard data={{
              image: IMG.wide1,
              title: 'A Wedding in Positano',
              excerpt: 'Sun-drenched terraces, hand-painted ceramics, and a ceremony by the sea.',
              category: 'Real Weddings',
              date: 'March 2026',
              variant: 'cinematic',
              onClick: () => {},
              height: '65vh',
            }} />
          </div>
        </div>
      </Section>

      {/* ── New Cards ─────────────────────────────────────────────────────── */}
      <Section title="10 · Venue Stats Card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div>
            <Label text="Strip (default), cream" />
            <VenueStatsCard data={{
              eyebrow: 'By the numbers',
              stats: [
                { value: '450',    label: 'Maximum Guests' },
                { value: '1,070m', label: 'Altitude', sublabel: 'Kitzbühel, Austria' },
                { value: '18',     label: 'Holes of Golf', sublabel: 'Championship course' },
                { value: '5',      label: 'Bars & Restaurants' },
              ],
              theme: 'light',
            }} />
          </div>
          <div>
            <Label text="Strip, dark" />
            <VenueStatsCard data={{
              eyebrow: 'Grand Tirolia · Kitzbühel',
              stats: [
                { value: '130+', label: 'Guest Rooms & Suites' },
                { value: '5★',   label: 'Rating' },
                { value: '2,500m²', label: 'Spa & Wellness' },
                { value: '1895', label: 'Est.' },
              ],
              accentBg: '#1a1a1a',
            }} />
          </div>
          <div>
            <Label text="Over image" />
            <VenueStatsCard data={{
              eyebrow: 'Grand Tirolia, Kitzbühel',
              stats: [
                { value: '450',    label: 'Maximum Guests' },
                { value: '1,070m', label: 'Altitude' },
                { value: '18',     label: 'Golf Holes' },
                { value: '5',      label: 'Restaurants' },
              ],
              image: GT.aerial2,
              variant: 'over-image',
            }} />
          </div>
        </div>
      </Section>

      <Section title="11 · Amenities Card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div>
            <Label text="Light theme, 3 cols" />
            <AmenitiesCard data={{
              title: 'Everything You Need',
              description: 'Grand Tirolia is equipped for the most discerning celebration, from helipad arrivals to post-reception jazz.',
              amenities: [
                { icon: 'golf',       label: '18-Hole Golf Course',   sublabel: 'Championship' },
                { icon: 'spa',        label: 'Spa & Wellness',        sublabel: '2,500m²' },
                { icon: 'pool',       label: 'Outdoor Pool',          sublabel: 'Alpine panorama' },
                { icon: 'restaurant', label: '5 Restaurants',         sublabel: 'Fine dining & brasserie' },
                { icon: 'bar',        label: 'Cooper Bar',            sublabel: 'Signature cocktails' },
                { icon: 'ballroom',   label: 'Grand Ballroom',        sublabel: 'Up to 450 guests' },
                { icon: 'ski',        label: 'Ski-In / Ski-Out',      sublabel: 'Winter access' },
                { icon: 'music',      label: 'Jazzclub',              sublabel: 'Live entertainment' },
                { icon: 'helipad',    label: 'Helipad',               sublabel: 'Private arrivals' },
              ],
              cols: 3,
              theme: 'light',
            }} />
          </div>
          <div>
            <Label text="Dark theme, 4 cols" />
            <AmenitiesCard data={{
              amenities: [
                { icon: 'golf',     label: 'Golf Course'   },
                { icon: 'spa',      label: 'Spa'           },
                { icon: 'pool',     label: 'Pool'          },
                { icon: 'mountain', label: 'Alpine Views'  },
                { icon: 'wine',     label: 'Wine Cellar'   },
                { icon: 'fireplace',label: 'Fireplace Bar' },
                { icon: 'terrace',  label: 'Terraces'      },
                { icon: 'suite',    label: 'Suites'        },
              ],
              cols: 4,
              accentBg: '#2a2117',
            }} />
          </div>
        </div>
      </Section>

      <Section title="12 · Two-Column Editorial Card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div>
            <Label text="Default (two-column), light" />
            <TwoColumnEditorialCard data={{
              eyebrow: 'Grand Tirolia · Kitzbühel',
              title: 'Where the Alps Become the Setting',
              body: [
                'Set on a private ridge above Kitzbühel at 1,070 metres, Grand Tirolia occupies one of the most spectacular positions in the Eastern Alps. The hotel commands uninterrupted views across the Kitzbüheler Horn, the Hahnenkamm race mountain, and the rolling pastures of the Tyrol.',
                'For weddings, the property offers an unmatched range of spaces, from the intimate Cooper Bar to the Grand Ballroom which seats 450 guests. Every celebration is supported by a dedicated events team with decades of experience in Austrian luxury hospitality.',
              ],
              cta: { label: 'View the venue', href: '#' },
              theme: 'light',
            }} />
          </div>
          <div>
            <Label text="With pull-stat, dark" />
            <TwoColumnEditorialCard data={{
              eyebrow: 'By the numbers',
              title: 'An Estate Designed for Celebration',
              pullStat: { value: '1,070m', label: 'Above sea level' },
              body: [
                'Grand Tirolia is not merely a hotel, it is an estate, a private mountain, a stage for the most important days of your life. From the curved LED installation in the Atrium to the hand-picked Austrian pine of the Jazzclub, every space has been designed with the deliberate intention of making guests feel extraordinary.',
              ],
              cta: { label: 'Enquire now', href: '#' },
              accentBg: '#1c1a15',
            }} />
          </div>
          <div>
            <Label text="Centered variant" />
            <TwoColumnEditorialCard data={{
              eyebrow: 'The Grand Tirolia Promise',
              title: 'Perfection Is Not an Accident',
              body: 'For over a century, Grand Tirolia has been the benchmark for Alpine luxury. The same exacting standards that define every room, every plate, and every view apply equally to every wedding, every celebration, and every moment in between.',
              cta: { label: 'Begin planning your day', href: '#' },
              variant: 'centered',
              theme: 'light',
            }} />
          </div>
        </div>
      </Section>

      <Section title="13 · Parallax Banner Card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div>
            <Label text="Centered, misty aerial" />
            <ParallaxBannerCard data={{
              image: GT.aerial2,
              eyebrow: 'Grand Tirolia · Kitzbühel · Austria',
              title: 'Above Everything',
              subtitle: 'A wedding at 1,070 metres, where the clouds arrive before your guests.',
              cta: { label: 'Enquire about availability', href: '#' },
              height: '72vh',
              overlay: 'medium',
            }} />
          </div>
          <div style={{ marginTop: 40 }}>
            <Label text="Bottom-text, summer aerial" />
            <ParallaxBannerCard data={{
              image: GT.aerial1,
              title: 'Eighteen Holes, One Mountain, Endless Views',
              eyebrow: 'Golf & Events',
              height: '55vh',
              variant: 'bottom-text',
              overlay: 'medium',
            }} />
          </div>
          <div style={{ marginTop: 40 }}>
            <Label text="Minimal, no text" />
            <ParallaxBannerCard data={{
              image: GT.atrium,
              height: '40vh',
              variant: 'minimal',
            }} />
          </div>
        </div>
      </Section>

    </div>{/* end constrained wrapper */}

      {/* ══════════════════════════════════════════════════════════════════════
           GRAND TIROLIA · KITZBÜHEL, Full Venue Editorial
           A complete real-world example using all card types together
          ══════════════════════════════════════════════════════════════════ */}

      {/* Section divider */}
      <div style={{ background: '#f3ede6', padding: '48px 40px', textAlign: 'center', margin: '0' }}>
        <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7a5f10', margin: '0 0 8px' }}>
          Full venue editorial · live example
        </p>
        <h2 style={{ fontFamily: GD, fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 400, color: '#1a1209', margin: 0 }}>
          Grand Tirolia · Kitzbühel
        </h2>
      </div>

      {/* 1. Cinematic hero with parallax */}
      <ParallaxBannerCard data={{
        image: GT.aerial2,
        eyebrow: 'Austria · 1,070m · Kitzbühel',
        title: 'Where the Alps Become Your Backdrop',
        subtitle: 'A five-star estate above Kitzbühel, the most spectacular wedding address in the Eastern Alps.',
        cta: { label: 'Enquire about your date', href: '#' },
        height: '80vh',
        overlay: 'medium',
      }} />

      {/* 2. Venue stats */}
      <VenueStatsCard data={{
        stats: [
          { value: '450',    label: 'Maximum Guests' },
          { value: '1,070m', label: 'Altitude', sublabel: 'Kitzbühel, Austria' },
          { value: '18',     label: 'Golf Holes', sublabel: 'Championship course' },
          { value: '5',      label: 'Bars & Restaurants' },
          { value: '130+',   label: 'Rooms & Suites' },
        ],
        accentBg: '#f3ede6',
      }} />

      {/* 3. Two-col editorial, about GT */}
      <TwoColumnEditorialCard data={{
        eyebrow: 'Grand Tirolia · Kitzbühel',
        title: 'The Alps at Their Most Refined',
        pullStat: { value: '1895', label: 'Founded' },
        body: [
          'Set on a private ridge above Kitzbühel, Grand Tirolia commands views across the Kitzbüheler Horn and the rolling pastures of the Tyrol. The estate spans an 18-hole championship golf course, a 2,500m² spa, five restaurants, three bars, and a Grand Ballroom that seats 450.',
          'Every detail is considered. From the curved LED installation in the Atrium to the hand-selected pine beams of the Jazzclub, each space is designed to make a profound impression. Your wedding here will not be forgotten.',
        ],
        cta: { label: 'View all spaces', href: '#' },
        variant: 'with-pullstat',
        accentBg: '#ffffff',
        theme: 'light',
      }} />

      {/* 4. Feature card, Cooper Bar */}
      <FeatureCard data={{
        image: GT.cooperBar,
        title: 'The Cooper Bar',
        category: 'Bars & Nightlife',
        excerpt: 'Stone walls, arched mirrors, green leather, the Cooper Bar is Grand Tirolia\'s most arresting room. Signature cocktails, natural wines, and the best whisky list in Kitzbühel.',
        accentBg: '#2c2820',
        variant: 'image-left',
      }} />

      {/* 5. Feature card, Jazzclub reversed */}
      <FeatureCard data={{
        image: GT.jazzclub,
        title: 'The Jazzclub',
        category: 'Entertainment',
        excerpt: 'Tufted velvet sofas, shelves of rare single malts, Edison bulbs over a curved bar, the Jazzclub is the most intimate setting for a late-night reception. Live acts every weekend.',
        accentBg: '#3a2e1e',
        variant: 'image-right',
      }} />

      {/* 6. Amenities grid */}
      <AmenitiesCard data={{
        title: 'Every Amenity. Every Occasion.',
        description: 'Grand Tirolia provides a complete ecosystem of luxury, from helicopter arrivals to post-ceremony skiing.',
        amenities: [
          { icon: 'golf',       label: '18-Hole Golf Course',   sublabel: 'Championship' },
          { icon: 'spa',        label: 'Spa & Wellness',        sublabel: '2,500m²' },
          { icon: 'pool',       label: 'Alpine Pool',           sublabel: 'Year-round heated' },
          { icon: 'restaurant', label: '5 Restaurants',         sublabel: 'Austrian & international' },
          { icon: 'bar',        label: 'Cooper Bar',            sublabel: 'Signature cocktails' },
          { icon: 'ballroom',   label: 'Grand Ballroom',        sublabel: 'Up to 450 guests' },
          { icon: 'ski',        label: 'Ski-In / Ski-Out',      sublabel: 'Winter access' },
          { icon: 'music',      label: 'Live Jazzclub',         sublabel: 'Weekend performances' },
          { icon: 'helipad',    label: 'Private Helipad',       sublabel: 'Bespoke arrivals' },
        ],
        cols: 3,
        accentBg: '#f9f6f0',
      }} />

      {/* 7. Food mosaic */}
      <MosaicCard data={{
        images: [GT.food3, GT.food2, GT.food4, GT.food5],
        title: 'Five-Star Dining, Alpine Character',
        excerpt: 'From refined tasting menus to casual Tyrolean classics, every plate tells the story of the region.',
        category: 'Dining',
        date: 'Grand Tirolia',
        height: 480,
      }} />

      {/* 8. Quote card */}
      <QuoteCard data={{
        quote: 'There is no more spectacular setting for a wedding in the Austrian Alps. Grand Tirolia is not a venue, it is an experience that begins the moment you arrive.',
        attribution: 'Luxury Wedding Directory',
        attributionRole: 'Editor\'s Choice 2026',
        accentBg: '#1c1a15',
        variant: 'centered',
      }} />

      {/* 9. Image overlay, Atrium */}
      <ImageOverlayCard data={{
        image: GT.atrium,
        title: 'The Grand Ballroom & Atrium',
        category: 'Venues',
        excerpt: 'A curved LED ceiling installation, custom carpet, and a stage for up to 450 guests. The most technically advanced event space in Kitzbühel.',
        variant: 'floating-box',
        ratio: '16 / 5',
      }} />

      {/* 10. Category tile CTA */}
      <CategoryTileCard data={{
        title: 'Begin Planning',
        eyebrow: 'Grand Tirolia · Kitzbühel',
        accentBg: '#5c5f4a',
        variant: 'banner',
        align: 'center',
        onClick: () => {},
      }} />

      {/* 11. Interior carousel */}
      <div style={{
        position: 'relative', left: '50%', right: '50%',
        marginLeft: '-50vw', marginRight: '-50vw',
        width: '100vw',
      }}>
        <CarouselRow
          label="Inside Grand Tirolia"
          variant="editorial"
          accentBg="#1c1a15"
          cardWidth={260}
          items={[
            { image: GT.jazzclub,   title: 'The Jazzclub',           category: 'Bar & Lounge',   imagePosition: 'center center' },
            { image: GT.cooperBar,  title: 'The Cooper Bar',         category: 'Signature Bar',  imagePosition: 'center center' },
            { image: GT.restaurant, title: 'The Restaurant',         category: 'Fine Dining',    imagePosition: 'center center' },
            { image: GT.atrium,     title: 'The Grand Ballroom',     category: 'Events',         imagePosition: 'center center' },
            { image: GT.terrace,    title: 'Deluxe Suite Terrace',   category: 'Accommodation',  imagePosition: 'center center' },
            { image: GT.cocktails,  title: 'Cocktail Hour',          category: 'Cooper Bar',     imagePosition: 'center top'    },
          ]}
        />
      </div>

  </div>
  );
}
