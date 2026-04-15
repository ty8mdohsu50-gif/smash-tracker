import { useEffect } from "react";

// Minimal "pressing Escape closes me" hook for modals. We use
// capture-phase so this handler runs before anything deeper in the
// tree (e.g. a CharPicker's internal Escape binding) and then
// stopImmediatePropagation so the outer listener doesn't also fire
// unrelated goBack logic for the same keypress.
//
// When `active` is false the listener isn't attached at all, so
// inactive modals don't compete for the key.
export function useEscapeKey(onEscape, active = true) {
  useEffect(() => {
    if (!active || typeof onEscape !== "function") return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onEscape();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onEscape, active]);
}
