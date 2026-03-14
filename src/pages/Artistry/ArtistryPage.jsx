import { useState, useEffect, useRef } from 'react';
import { ARTISTS } from './data/artists';
import { getApprovedArtists } from '../../services/artistryService';
import ArtistryHero from './components/ArtistryHero';
import FeaturedArtist from './components/FeaturedArtist';
import EditorialQuote from './components/EditorialQuote';
import CategoryFilter from './components/CategoryFilter';
import CountryFilter from './components/CountryFilter';
import ArtistGrid from './components/ArtistGrid';
import ArtistLightbox from './components/ArtistLightbox';

const FONT_DISPLAY = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";
const FONT_UI      = "'Inter', 'Helvetica Neue', sans-serif";

const ROTATE_MS = 7000; // ms per featured artist

export default function ArtistryPage() {
  const [artists, setArtists] = useState(ARTISTS); // start with static, swap when DB loads
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCountry, setActiveCountry] = useState('All');
  const [lightbox, setLightbox] = useState(null);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const pausedRef = useRef(false);

  // Load approved submissions from DB; fall back to static data if none
  useEffect(() => {
    getApprovedArtists().then(({ data }) => {
      if (data && data.length > 0) {
        setArtists(data);
        const fi = data.findIndex(a => a.featured);
        setFeaturedIdx(fi >= 0 ? fi : 0);
      } else {
        const fi = ARTISTS.findIndex(a => a.featured);
        setFeaturedIdx(fi >= 0 ? fi : 0);
      }
    });
  }, []);

  // Auto-rotate featured artist, pauses on hover
  useEffect(() => {
    const t = setInterval(() => {
      if (!pausedRef.current) {
        setFeaturedIdx(i => (i + 1) % artists.length);
      }
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [artists.length]);

  // Filtered list for the grid (not the lightbox, lightbox navigates all)
  const filteredArtists = artists.filter(a => {
    const catOk = activeCategory === 'All' || a.category === activeCategory;
    const countryOk = !activeCountry || activeCountry === 'All' || a.country === activeCountry;
    return catOk && countryOk;
  });

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      {/* audioSrc: drop an MP3/OGG into /public/audio/ and set the path here */}
      <ArtistryHero fontDisplay={FONT_DISPLAY} fontUI={FONT_UI} audioSrc={null} />

      <FeaturedArtist
        artist={artists[featuredIdx] || artists[0]}
        fontDisplay={FONT_DISPLAY}
        fontUI={FONT_UI}
        onViewProfile={a => setLightbox(a.id)}
        onHoverStart={() => { pausedRef.current = true; }}
        onHoverEnd={() => { pausedRef.current = false; }}
      />

      <EditorialQuote
        quote="Every wedding is a collaboration between talent, trust, and timing. The artists who make it extraordinary rarely take a bow."
        attribution="The Wedding Artistry Awards"
        fontDisplay={FONT_DISPLAY}
        fontUI={FONT_UI}
      />

      {/* Filters */}
      <CountryFilter
        active={activeCountry}
        onChange={setActiveCountry}
        artists={artists}
        fontUI={FONT_UI}
      />
      <CategoryFilter
        active={activeCategory}
        onChange={setActiveCategory}
        fontUI={FONT_UI}
      />

      <ArtistGrid
        artists={artists}
        activeCategory={activeCategory}
        activeCountry={activeCountry}
        fontDisplay={FONT_DISPLAY}
        fontUI={FONT_UI}
        onCardClick={a => setLightbox(a.id)}
      />

      {lightbox && (
        <ArtistLightbox
          artists={filteredArtists.length > 0 ? filteredArtists : artists}
          initialId={lightbox}
          onClose={() => setLightbox(null)}
          fontDisplay={FONT_DISPLAY}
          fontUI={FONT_UI}
        />
      )}
    </div>
  );
}
