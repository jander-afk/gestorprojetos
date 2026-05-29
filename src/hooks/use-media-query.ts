"use client";

import { useEffect, useState } from "react";

// Hook simples de media query (SSR-safe). Usado para alternar entre
// layout de board completo (desktop) e coluna única (mobile).
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");
