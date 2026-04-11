import { useState, useEffect } from "react";

const PC_BREAKPOINT = 1024;

export function useIsPC() {
  const query = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
  const [isPC, setIsPC] = useState(() => {
    if (typeof window.matchMedia === "function") {
      return window.matchMedia(query).matches;
    }
    return window.innerWidth >= PC_BREAKPOINT;
  });
  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      const onResize = () => setIsPC(window.innerWidth >= PC_BREAKPOINT);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsPC(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isPC;
}
