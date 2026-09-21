// src/hooks/useContentsquarePageview.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    _uxa?: unknown[];
  }
}

export function useContentsquarePageview() {
  const location = useLocation();

  useEffect(() => {
    window._uxa = window._uxa || [];
    window._uxa.push(['trackPageview', location.pathname]);
  }, [location.pathname]);
}