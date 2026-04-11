import { useState, useEffect } from "react";

export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = useState(
    () => window.innerWidth > window.innerHeight && window.innerHeight < 500,
  );
  useEffect(() => {
    const handler = () =>
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerHeight < 500);
    window.addEventListener("resize", handler);
    window.addEventListener("orientationchange", handler);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("orientationchange", handler);
    };
  }, []);
  return isLandscape;
}
