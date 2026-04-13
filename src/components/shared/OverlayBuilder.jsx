import { useState, useMemo, useEffect } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { useI18n } from "../../i18n/index.jsx";
import PillOverlay from "../overlay/layouts/PillOverlay";
import CardOverlay from "../overlay/layouts/CardOverlay";
import BarOverlay from "../overlay/layouts/BarOverlay";
import { OVERLAY_ANIMATIONS } from "../overlay/overlayStyles";

const PRESETS = ["pill", "card", "bar"];
const ORIENTATIONS = ["horizontal", "vertical"];
const POSITIONS = [
  { id: "tl", labelJa: "左上", labelEn: "Top Left" },
  { id: "tr", labelJa: "右上", labelEn: "Top Right" },
  { id: "bl", labelJa: "左下", labelEn: "Bottom Left" },
  { id: "br", labelJa: "右下", labelEn: "Bottom Right" },
  { id: "top", labelJa: "上フル幅", labelEn: "Full Top" },
  { id: "bottom", labelJa: "下フル幅", labelEn: "Full Bottom" },
  { id: "none", labelJa: "自由配置", labelEn: "Manual" },
];
const ALL_MODULES = ["fighter", "score", "rate", "streak", "gsp", "goal", "recent", "timer"];
const DEFAULT_MODULES = {
  pill: ["fighter", "score", "rate", "streak", "gsp"],
  card: ["fighter", "score", "rate", "streak", "gsp", "goal", "recent"],
  bar: ["fighter", "score", "rate", "streak", "gsp", "timer"],
};

// Mock data for the preview — representative numbers so every module
// has something to show even if the streamer hasn't played today yet.
function mockPreviewData(config) {
  const moduleSet = new Set(config.modules);
  return {
    params: {
      layout: config.layout,
      orientation: config.orientation,
      position: "none",
      accent: config.accent,
      bg: config.bg,
      scale: config.scale,
      flash: true,
      modules: moduleSet,
    },
    myChar: "マリオ",
    tW: 7,
    tL: 3,
    total: 10,
    streak: { type: "win", count: 3 },
    pwrDelta: 24500,
    currentPower: 9_821_000,
    recent: ["win", "win", "lose", "win", "win", "lose", "win", "win"],
    goal: {
      games: 15,
      winRate: 60,
      gamesProgress: 10 / 15,
      winRateProgress: 1,
      totalToday: 10,
    },
    flashState: null,
    sessionElapsedSec: 2 * 3600 + 23 * 60 + 17,
    hasData: true,
    rawData: {},
  };
}

function buildUrl(origin, userId, config) {
  const p = new URLSearchParams();
  if (userId) p.set("user", userId);
  p.set("layout", config.layout);
  if (config.layout === "pill") p.set("orientation", config.orientation);
  if (config.position !== "none") p.set("position", config.position);
  if (config.accent && config.accent !== "#8B5CF6") p.set("accent", config.accent.replace("#", ""));
  if (config.bg !== 70) p.set("bg", String(config.bg));
  if (config.scale !== 1) p.set("scale", String(config.scale));
  const defaultModules = DEFAULT_MODULES[config.layout] || [];
  const sameAsDefault =
    config.modules.length === defaultModules.length &&
    config.modules.every((m) => defaultModules.includes(m));
  if (!sameAsDefault) p.set("modules", config.modules.join(","));
  return `${origin}/overlay?${p.toString()}`;
}

export default function OverlayBuilder({ T, user, initialAccent }) {
  const { lang, t } = useI18n();

  const [config, setConfig] = useState({
    layout: "pill",
    orientation: "horizontal",
    position: "tr",
    accent: initialAccent || "#8B5CF6",
    bg: 70,
    scale: 1,
    modules: [...DEFAULT_MODULES.pill],
  });
  const [copied, setCopied] = useState(false);

  // Inject overlay keyframes so the inline preview animates correctly.
  useEffect(() => {
    const id = "overlay-builder-keyframes";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = OVERLAY_ANIMATIONS;
    document.head.appendChild(el);
  }, []);

  const setLayout = (layout) => {
    setConfig((c) => ({
      ...c,
      layout,
      modules: [...DEFAULT_MODULES[layout]],
    }));
  };
  const toggleModule = (m) => {
    setConfig((c) => ({
      ...c,
      modules: c.modules.includes(m) ? c.modules.filter((x) => x !== m) : [...c.modules, m],
    }));
  };

  const url = useMemo(
    () => buildUrl(window.location.origin, user?.id, config),
    [user, config],
  );

  const preview = useMemo(() => mockPreviewData(config), [config]);
  const Layout =
    config.layout === "card" ? CardOverlay
    : config.layout === "bar" ? BarOverlay
    : PillOverlay;

  const row = { display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" };
  const label = { fontSize: 11, fontWeight: 700, color: T.dim, minWidth: 72, letterSpacing: 0.5 };
  const chip = (active) => ({
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 8,
    border: `1px solid ${active ? T.accentBorder : T.brd}`,
    background: active ? T.accentSoft : T.inp,
    color: active ? T.accent : T.sub,
    cursor: "pointer",
    lineHeight: 1,
  });

  const layoutLabels = {
    pill: lang === "ja" ? "ピル (コンパクト)" : "Pill (compact)",
    card: lang === "ja" ? "カード (詳細)" : "Card (detailed)",
    bar: lang === "ja" ? "バー (全幅)" : "Bar (full width)",
  };
  const moduleLabels = {
    fighter: lang === "ja" ? "キャラ" : "Fighter",
    score: lang === "ja" ? "勝敗" : "Score",
    rate: lang === "ja" ? "勝率" : "Win Rate",
    streak: lang === "ja" ? "連勝/連敗" : "Streak",
    gsp: lang === "ja" ? "戦闘力" : "GSP",
    goal: lang === "ja" ? "目標進捗" : "Goal",
    recent: lang === "ja" ? "直近の勝敗" : "Recent",
    timer: lang === "ja" ? "タイマー" : "Timer",
  };
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignored */
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Preview panel */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          border: `1px solid ${T.brd}`,
          minHeight: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: `scale(${config.layout === "bar" ? 0.78 : 1})`,
            transformOrigin: "center",
            width: config.layout === "bar" ? "100%" : "auto",
          }}
        >
          <Layout data={preview} lang={lang} />
        </div>
      </div>

      {/* Preset row */}
      <div style={row}>
        <span style={label}>{t("broadcast.builder.preset")}</span>
        {PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => setLayout(p)} style={chip(config.layout === p)}>
            {layoutLabels[p]}
          </button>
        ))}
      </div>

      {/* Orientation (pill only) */}
      {config.layout === "pill" && (
        <div style={row}>
          <span style={label}>{t("broadcast.builder.orientation")}</span>
          {ORIENTATIONS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setConfig((c) => ({ ...c, orientation: o }))}
              style={chip(config.orientation === o)}
            >
              {o === "horizontal" ? (lang === "ja" ? "横" : "Horizontal") : (lang === "ja" ? "縦" : "Vertical")}
            </button>
          ))}
        </div>
      )}

      {/* Position */}
      <div style={row}>
        <span style={label}>{t("broadcast.builder.position")}</span>
        {POSITIONS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setConfig((c) => ({ ...c, position: p.id }))}
            style={chip(config.position === p.id)}
          >
            {lang === "ja" ? p.labelJa : p.labelEn}
          </button>
        ))}
      </div>

      {/* Modules */}
      <div style={row}>
        <span style={label}>{t("broadcast.builder.modules")}</span>
        {ALL_MODULES.map((m) => (
          <button key={m} type="button" onClick={() => toggleModule(m)} style={chip(config.modules.includes(m))}>
            {moduleLabels[m]}
          </button>
        ))}
      </div>

      {/* Background opacity slider */}
      <div style={row}>
        <span style={label}>{t("broadcast.builder.bg")}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={config.bg}
          onChange={(e) => setConfig((c) => ({ ...c, bg: Number(e.target.value) }))}
          style={{ flex: 1, maxWidth: 180 }}
        />
        <span style={{ fontSize: 11, color: T.sub, fontFamily: "'Chakra Petch', monospace", minWidth: 32 }}>
          {config.bg}%
        </span>
      </div>

      {/* Scale slider */}
      <div style={row}>
        <span style={label}>{t("broadcast.builder.scale")}</span>
        <input
          type="range"
          min="0.6"
          max="1.8"
          step="0.1"
          value={config.scale}
          onChange={(e) => setConfig((c) => ({ ...c, scale: Number(e.target.value) }))}
          style={{ flex: 1, maxWidth: 180 }}
        />
        <span style={{ fontSize: 11, color: T.sub, fontFamily: "'Chakra Petch', monospace", minWidth: 32 }}>
          {config.scale.toFixed(1)}x
        </span>
      </div>

      {/* Accent color */}
      <div style={row}>
        <span style={label}>{t("broadcast.builder.accent")}</span>
        <input
          type="color"
          value={config.accent}
          onChange={(e) => setConfig((c) => ({ ...c, accent: e.target.value }))}
          style={{ width: 36, height: 28, padding: 0, border: `1px solid ${T.brd}`, background: "transparent", borderRadius: 6 }}
        />
        <code style={{ fontSize: 11, color: T.sub }}>{config.accent}</code>
      </div>

      {/* Generated URL */}
      <div style={{ marginTop: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, marginBottom: 6, letterSpacing: 0.5 }}>
          {t("broadcast.builder.url")}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            readOnly
            value={url}
            onClick={(e) => e.target.select()}
            style={{
              flex: 1,
              padding: "8px 10px",
              background: T.inp,
              border: `1px solid ${T.brd}`,
              borderRadius: 8,
              color: T.text,
              fontSize: 11,
              outline: "none",
              fontFamily: "'Chakra Petch', monospace",
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={copyUrl}
            style={{
              padding: "0 12px",
              border: `1px solid ${T.brd}`,
              borderRadius: 8,
              background: T.card,
              color: copied ? T.accent : T.sub,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Copy size={12} />
            {copied ? t("broadcast.builder.copied") : t("broadcast.builder.copy")}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "0 12px",
              border: `1px solid ${T.brd}`,
              borderRadius: 8,
              background: T.card,
              color: T.sub,
              fontSize: 11,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
            }}
          >
            <ExternalLink size={12} />
            {t("broadcast.builder.open")}
          </a>
        </div>
      </div>
    </div>
  );
}
