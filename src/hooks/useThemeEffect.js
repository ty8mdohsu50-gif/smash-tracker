import { useEffect } from "react";

export function useThemeEffect(T) {
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", T.bg);
    const root = document.documentElement;
    root.style.setProperty("--accent", T.accent);
    root.style.setProperty("--accent-scroll", `${T.accent}33`);
    root.style.setProperty("--accent-scroll-hover", `${T.accent}59`);
  }, [T]);
}
