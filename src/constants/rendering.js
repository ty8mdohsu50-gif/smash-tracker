// Centralized rendering/dimension constants for canvas-style exports
// and overlay scaling. Everything here is unitless or pixels.

// html2canvas pixel ratio for the share-card screenshot. 2x keeps it
// crisp on retina without ballooning the PNG size beyond a few hundred
// kilobytes.
export const SHARE_CARD_SCALE = 2;

// Share card target dimensions (16:8.4 — close to Twitter's preview
// crop). Hard-coded into the html2canvas call.
export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;
