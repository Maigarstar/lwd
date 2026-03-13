import { useState, useEffect } from 'react';

export function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  useEffect(() => {
    let raf;
    const handler = () => { raf = requestAnimationFrame(() => setWidth(window.innerWidth)); };
    window.addEventListener('resize', handler, { passive: true });
    return () => { window.removeEventListener('resize', handler); cancelAnimationFrame(raf); };
  }, []);
  return width;
}

// Convenience breakpoint booleans
export function useBreakpoint() {
  const w = useWindowWidth();
  return {
    isMobile:  w < 640,
    isTablet:  w >= 640 && w < 1024,
    isDesktop: w >= 1024,
    width: w,
  };
}
