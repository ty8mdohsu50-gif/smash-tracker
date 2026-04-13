// Shared tokens for every OBS overlay layout. Keep values here so the
// in-app preview and the actual /overlay route render identically.
// Win / lose colours are intentionally bright in both themes so they
// read cleanly on any OBS scene background.

export const WIN_COLOR = "#4ADE80";
export const LOSE_COLOR = "#F87171";

export const OVERLAY_FONT = "'Chakra Petch', 'Noto Sans JP', sans-serif";

const DARK_PALETTE = {
  text: "#ffffff",
  muted: "rgba(255,255,255,0.78)",
  dim: "rgba(255,255,255,0.55)",
  dimmer: "rgba(255,255,255,0.35)",
  divider: "rgba(255,255,255,0.12)",
  innerBg: "rgba(0,0,0,0.35)",
  innerBorder: "rgba(255,255,255,0.08)",
  shadow: "0 4px 24px rgba(0,0,0,.35)",
  // rgb base used by bgColor() to mix with the opacity slider
  panelRgb: "12, 12, 24",
};

const LIGHT_PALETTE = {
  text: "#101629",
  muted: "rgba(16,22,41,0.78)",
  dim: "rgba(16,22,41,0.55)",
  dimmer: "rgba(16,22,41,0.35)",
  divider: "rgba(16,22,41,0.12)",
  innerBg: "rgba(16,22,41,0.06)",
  innerBorder: "rgba(16,22,41,0.1)",
  shadow: "0 4px 24px rgba(16,22,41,.18)",
  panelRgb: "255, 255, 255",
};

export const paletteFor = (theme) => (theme === "light" ? LIGHT_PALETTE : DARK_PALETTE);

export const bgColor = (bgOpacity, theme = "dark") => {
  const rgb = paletteFor(theme).panelRgb;
  const alpha = Math.max(0, Math.min(100, bgOpacity)) / 100;
  return `rgba(${rgb}, ${alpha})`;
};

export const positionStyle = (position) => {
  const base = { position: "fixed", margin: 16 };
  switch (position) {
    case "tl": return { ...base, top: 0, left: 0 };
    case "tr": return { ...base, top: 0, right: 0 };
    case "bl": return { ...base, bottom: 0, left: 0 };
    case "br": return { ...base, bottom: 0, right: 0 };
    case "top": return { position: "fixed", top: 0, left: 0, right: 0, padding: 16 };
    case "bottom": return { position: "fixed", bottom: 0, left: 0, right: 0, padding: 16 };
    default: return {};
  }
};

export const OVERLAY_ANIMATIONS = `
@keyframes overlayFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes overlayWinFlash {
  0% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
  20% { box-shadow: 0 0 0 8px rgba(74,222,128,.45), 0 0 30px rgba(74,222,128,.6); }
  100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
}
@keyframes overlayLoseFlash {
  0% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
  20% { box-shadow: 0 0 0 8px rgba(248,113,113,.45), 0 0 30px rgba(248,113,113,.6); }
  100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
}
@keyframes overlayStreakPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.08); opacity: .9; }
}
@keyframes overlayLivePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .35; }
}
`;

export const flashAnimation = (flashState) => {
  if (!flashState) return undefined;
  const name = flashState.result === "win" ? "overlayWinFlash" : "overlayLoseFlash";
  return `${name} 1.2s ease-out`;
};

export const panelStyle = ({ bg, accent, flashState, borderRadius = 14, theme = "dark" }) => {
  const p = paletteFor(theme);
  return {
    fontFamily: OVERLAY_FONT,
    color: p.text,
    background: bgColor(bg, theme),
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius,
    border: `1px solid ${accent}55`,
    boxShadow: p.shadow,
    animation: [
      "overlayFadeIn 0.25s ease",
      flashAnimation(flashState),
    ].filter(Boolean).join(", "),
    overflow: "hidden",
  };
};

export const liveDotStyle = (size = 6) => ({
  display: "inline-block",
  width: size,
  height: size,
  borderRadius: "50%",
  background: "#EF4444",
  animation: "overlayLivePulse 2s infinite",
  marginRight: 4,
  verticalAlign: "middle",
});
