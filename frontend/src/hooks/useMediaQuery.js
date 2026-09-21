import { useState, useEffect } from 'react';

/**
 * Custom hook to listen to CSS media query changes.
 * @param {string} query - CSS media query string (e.g., '(min-width: 1024px)')
 * @returns {boolean} - true if media query matches, false otherwise
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    const listener = (event) => {
      setMatches(event.matches);
    };

    setMatches(mediaQueryList.matches);

    // Modern event listener with fallback
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      mediaQueryList.addListener(listener);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

export default useMediaQuery;
