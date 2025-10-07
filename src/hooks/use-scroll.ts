import { useState, useEffect } from 'react';

interface ScrollState {
  scrollY: number;
  isScrolled: boolean;
  scrollDirection: 'up' | 'down' | null;
}

export const useScroll = () => {
  const [scrollState, setScrollState] = useState<ScrollState>({
    scrollY: 0,
    isScrolled: false,
    scrollDirection: null,
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateScrollState = () => {
      const scrollY = window.scrollY;
      const isScrolled = scrollY > 50; // Higher threshold for better UX
      const scrollDirection = scrollY > lastScrollY ? 'down' : scrollY < lastScrollY ? 'up' : null;

      setScrollState({
        scrollY,
        isScrolled,
        scrollDirection,
      });

      lastScrollY = scrollY;
    };

    window.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState(); // Initial call

    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return scrollState;
};