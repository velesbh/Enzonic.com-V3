import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const faviconMap: Record<string, string> = {
  '/': '/search.png',
  '/search': '/search.png',
  '/chatbot': '/ai.png',
  '/boxes': '/boxes.png',
  '/translate': '/translate.png',
  '/emi': '/emi.png',
  '/shows': '/show.png',
  '/about': '/logo.png',
};

export function useFavicon() {
  const location = useLocation();

  useEffect(() => {
    const faviconPath = faviconMap[location.pathname] || '/logo.png';
    
    // Find or create favicon link
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      document.head.appendChild(link);
    }
    
    // Set the favicon href
    link.href = faviconPath;
  }, [location.pathname]);
}
