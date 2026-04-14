// Centralized timing constants. Keep all millisecond/second values
// here so we don't end up with the same magic number in five files.

// useCloudSync — debounce window before flushing to localStorage /
// Supabase. Tuned so rapid edits coalesce but the user never feels a
// lag on the next read.
export const DEBOUNCE_LOCAL_MS = 250;
export const DEBOUNCE_CLOUD_MS = 800;

// useOverlayData — polling fallback while the realtime subscription
// catches up. Anonymous overlays poll faster because they can't use
// the Supabase realtime channel at all.
export const OVERLAY_POLL_AUTH_S = 5;
export const OVERLAY_POLL_ANON_S = 3;

// Session timer tick rate while the timer module is mounted.
export const OVERLAY_TIMER_TICK_MS = 1000;

// Win/lose flash animation duration on the overlay.
export const OVERLAY_FLASH_MS = 1400;

// Misc time conversion. Used for "last reviewed N days ago" math.
export const DAY_MS = 86400000;
