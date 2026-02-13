'use client';

import { useEffect } from 'react';

/**
 * Hides the Clerk keyless-mode banner using CSS instead of DOM removal.
 * DOM removal (el.remove / removeChild) causes React hydration errors
 * because React loses track of nodes it didn't create.
 */
export function HideClerkBanner() {
  useEffect(() => {
    // Use CSS to hide rather than removing DOM nodes
    const style = document.createElement('style');
    style.setAttribute('data-hide-clerk', '');
    style.textContent = `
      body > div[style*="position: fixed"][style*="bottom"],
      body > div[style*="z-index: 2147483647"],
      body > div[data-clerk] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        pointer-events: none !important;
      }
    `;

    // Only add if not already present
    if (!document.querySelector('style[data-hide-clerk]')) {
      document.head.appendChild(style);
    }

    return () => {
      style.remove();
    };
  }, []);

  return null;
}
