const ACCENT_COLORS = {
  purple: { name: "パープル", light: "#7C3AED", dark: "#A78BFA", hue: 263 },
  blue: { name: "ブルー", light: "#2563EB", dark: "#60A5FA", hue: 217 },
  cyan: { name: "シアン", light: "#0891B2", dark: "#22D3EE", hue: 188 },
  emerald: { name: "エメラルド", light: "#059669", dark: "#34D399", hue: 160 },
  orange: { name: "オレンジ", light: "#EA580C", dark: "#FB923C", hue: 21 },
  rose: { name: "ローズ", light: "#E11D48", dark: "#FB7185", hue: 347 },
  amber: { name: "アンバー", light: "#D97706", dark: "#FBBF24", hue: 38 },
  red: { name: "レッド", light: "#DC2626", dark: "#F87171", hue: 0 },
  white: { name: "ホワイト", light: "#6B7280", dark: "#9CA3AF", hue: 220 },
  black: { name: "ブラック", light: "#374151", dark: "#D1D5DB", hue: 220 },
};

export const THEME_KEYS = Object.keys(ACCENT_COLORS);
export const getThemeLabel = (key) => ACCENT_COLORS[key]?.name || key;

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
    dimmer: "#CBD5E1",
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
    glow: "none",
    cardHover: isNeutral ? "#F3F4F6" : hsl(h, 30, 98),
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
    glow: isNeutral ? "none" : `0 0 20px ${accent.light}26`,
    cardHover: isBlack ? "#1A1A1A" : "#252342",
  };
}

export function getTheme(dark, colorKey) {
  const accent = ACCENT_COLORS[colorKey] || ACCENT_COLORS.purple;
  return dark ? buildDark(accent) : buildLight(accent);
}

// Backwards compat
export const LT = buildLight(ACCENT_COLORS.purple);
export const DT = buildDark(ACCENT_COLORS.purple);
