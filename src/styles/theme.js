const ACCENT_COLORS = {
  purple: { name: { ja: "パープル", en: "Purple" }, light: "#7C3AED", dark: "#A78BFA", hue: 263 },
  blue: { name: { ja: "ブルー", en: "Blue" }, light: "#2563EB", dark: "#60A5FA", hue: 217 },
  cyan: { name: { ja: "シアン", en: "Cyan" }, light: "#0891B2", dark: "#22D3EE", hue: 188 },
  emerald: { name: { ja: "エメラルド", en: "Emerald" }, light: "#059669", dark: "#34D399", hue: 160 },
  orange: { name: { ja: "オレンジ", en: "Orange" }, light: "#EA580C", dark: "#FB923C", hue: 21 },
  rose: { name: { ja: "ローズ", en: "Rose" }, light: "#E11D48", dark: "#FB7185", hue: 347 },
  amber: { name: { ja: "アンバー", en: "Amber" }, light: "#D97706", dark: "#FBBF24", hue: 38 },
  red: { name: { ja: "レッド", en: "Red" }, light: "#DC2626", dark: "#F87171", hue: 0 },
  white: { name: { ja: "ホワイト", en: "White" }, light: "#6B7280", dark: "#9CA3AF", hue: 220 },
  black: { name: { ja: "ブラック", en: "Black" }, light: "#374151", dark: "#D1D5DB", hue: 220 },
};

export const THEME_KEYS = Object.keys(ACCENT_COLORS);
export const getThemeLabel = (key, lang) => ACCENT_COLORS[key]?.name?.[lang || "ja"] || key;

function hsl(h, s, l) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function buildLight(accent) {
  const c = accent.light;
  const h = accent.hue;
  const isNeutral = accent === ACCENT_COLORS.white || accent === ACCENT_COLORS.black;

  return {
    bg: isNeutral ? "#F9FAFB" : hsl(h, 30, 97),
    card: "#FFFFFF",
    brd: isNeutral ? "#E5E7EB" : hsl(h, 25, 90),
    text: "#1E293B",
    sub: "#64748B",
    dim: "#94A3B8",
    dimmer: "#A0AEC0",
    inp: isNeutral ? "#F3F4F6" : hsl(h, 40, 95),
    hdr: "rgba(255,255,255,0.85)",
    tBg: isNeutral
      ? "linear-gradient(135deg, #374151, #1F2937, #111827)"
      : `linear-gradient(135deg, ${c}, ${hsl(h, 75, 40)}, ${hsl(h, 80, 32)})`,
    tC: isNeutral ? "#1F2937" : hsl(h, 80, 32),
    sh: isNeutral
      ? "0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)"
      : `0 1px 3px ${c}10, 0 4px 12px ${c}08`,
    accent: c,
    accentSoft: isNeutral ? "rgba(107,114,128,.08)" : `${c}14`,
    accentBorder: isNeutral ? "rgba(107,114,128,.2)" : `${c}33`,
    win: "#16A34A",
    winBg: "rgba(22,163,74,.1)",
    lose: "#E11D48",
    loseBg: "rgba(225,29,72,.1)",
    mid: "#FF9F0A",
    midBg: "rgba(255,159,10,.12)",
    midBorder: "rgba(255,159,10,.33)",
    winBright: "#4ADE80",
    loseBright: "#F87171",
    winGrad: "linear-gradient(135deg, #16A34A, #22C55E)",
    loseGrad: "linear-gradient(135deg, #E11D48, #F43F5E)",
    winGlow: "0 4px 16px rgba(34,197,94,.3)",
    loseGlow: "0 4px 16px rgba(244,63,94,.3)",
    glow: "none",
    cardHover: isNeutral ? "#F3F4F6" : hsl(h, 30, 98),
    accentGrad: isNeutral
      ? "linear-gradient(135deg, #374151, #1F2937)"
      : `linear-gradient(135deg, ${c}, ${hsl(h, 75, 38)})`,
    accentGlow: isNeutral
      ? "0 4px 16px rgba(55,65,81,.35)"
      : `0 4px 16px ${c}55`,
    // Scrim used by modal backdrops. Light-theme modals sit over a
    // lighter page, so we dim less than the dark theme variant.
    modalScrim: "rgba(15, 23, 42, 0.55)",
    modalScrimStrong: "rgba(15, 23, 42, 0.7)",
  };
}

function buildDark(accent) {
  const c = accent.dark;
  const h = accent.hue;
  const isBlack = accent === ACCENT_COLORS.black;
  const isWhite = accent === ACCENT_COLORS.white;
  const isNeutral = isBlack || isWhite;

  return {
    bg: isBlack ? "#000000" : "#0F0F23",
    card: isBlack ? "#111111" : "#1E1C35",
    brd: isBlack ? "#222222" : "#2D2B4E",
    text: "#E2E8F0",
    sub: "#94A3B8",
    dim: "#64748B",
    dimmer: "#475569",
    inp: isBlack ? "#1A1A1A" : "#27273B",
    hdr: isBlack ? "rgba(17,17,17,0.9)" : "rgba(30,28,53,0.9)",
    tBg: isNeutral
      ? "linear-gradient(135deg, #374151, #1F2937, #111827)"
      : `linear-gradient(135deg, ${accent.light}, ${hsl(h, 75, 40)}, ${hsl(h, 80, 32)})`,
    tC: isBlack ? "#111111" : "#1E1C35",
    sh: "0 1px 3px rgba(0,0,0,.2), 0 4px 12px rgba(0,0,0,.15)",
    accent: c,
    accentSoft: isNeutral ? "rgba(156,163,175,.12)" : `${c}1F`,
    accentBorder: isNeutral ? "rgba(156,163,175,.25)" : `${c}40`,
    win: "#22C55E",
    winBg: "rgba(34,197,94,.15)",
    lose: "#F43F5E",
    loseBg: "rgba(244,63,94,.15)",
    mid: "#FF9F0A",
    midBg: "rgba(255,159,10,.15)",
    midBorder: "rgba(255,159,10,.33)",
    winBright: "#4ADE80",
    loseBright: "#F87171",
    winGrad: "linear-gradient(135deg, #16A34A, #22C55E)",
    loseGrad: "linear-gradient(135deg, #E11D48, #F43F5E)",
    winGlow: "0 4px 16px rgba(34,197,94,.3)",
    loseGlow: "0 4px 16px rgba(244,63,94,.3)",
    glow: isNeutral ? "none" : `0 0 20px ${accent.light}26`,
    cardHover: isBlack ? "#1A1A1A" : "#252342",
    accentGrad: isNeutral
      ? "linear-gradient(135deg, #6B7280, #4B5563)"
      : `linear-gradient(135deg, ${c}, ${accent.light})`,
    accentGlow: isNeutral
      ? "0 4px 16px rgba(107,114,128,.3)"
      : `0 4px 16px ${accent.light}55`,
    // Scrim used by modal backdrops. Dark theme needs a heavier
    // dim to separate the modal from the already-dark page.
    modalScrim: "rgba(0, 0, 0, 0.6)",
    modalScrimStrong: "rgba(0, 0, 0, 0.75)",
  };
}

export function getTheme(dark, colorKey) {
  const accent = ACCENT_COLORS[colorKey] || ACCENT_COLORS.purple;
  return dark ? buildDark(accent) : buildLight(accent);
}

