import { useState, useMemo, useEffect } from "react";
import { Copy, ExternalLink, RotateCcw, HelpCircle } from "lucide-react";
import { useI18n } from "../../i18n/index.jsx";
import PillOverlay from "../overlay/layouts/PillOverlay";
import CardOverlay from "../overlay/layouts/CardOverlay";
import BarOverlay from "../overlay/layouts/BarOverlay";
import { OVERLAY_ANIMATIONS } from "../overlay/overlayStyles";

const DEFAULT_MODULES = {
  pill: ["fighter", "score", "rate", "streak", "gsp"],
  card: ["fighter", "score", "rate", "streak", "gsp", "goal", "recent"],
  bar: ["fighter", "score", "rate", "streak", "gsp", "timer"],
};

const defaultConfig = (accent) => ({
  layout: "pill",
  orientation: "horizontal",
  theme: "dark",
  accent: accent || "#8B5CF6",
  bg: 70,
  modules: [...DEFAULT_MODULES.pill],
});

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
      scale: 1,
      flash: true,
      modules: moduleSet,
      theme: config.theme,
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
  if (config.theme !== "dark") p.set("theme", config.theme);
  if (config.accent && config.accent !== "#8B5CF6") p.set("accent", config.accent.replace("#", ""));
  if (config.bg !== 70) p.set("bg", String(config.bg));
  const defaultModules = DEFAULT_MODULES[config.layout] || [];
  const sameAsDefault =
    config.modules.length === defaultModules.length &&
    config.modules.every((m) => defaultModules.includes(m));
  if (!sameAsDefault) p.set("modules", config.modules.join(","));
  return `${origin}/overlay?${p.toString()}`;
}

export default function OverlayBuilder({ T, user, initialAccent, onOpenHelp }) {
  const { lang, t } = useI18n();

  const [config, setConfig] = useState(() => defaultConfig(initialAccent));
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
  const reset = () => setConfig(defaultConfig(initialAccent));

  const url = useMemo(
    () => buildUrl(window.location.origin, user?.id, config),
    [user, config],
  );

  const preview = useMemo(() => mockPreviewData(config), [config]);
  const Layout =
    config.layout === "card" ? CardOverlay
    : config.layout === "bar" ? BarOverlay
    : PillOverlay;

  // Preview scene background mirrors the selected theme so users see
  // exactly how the overlay would look on a matching OBS scene.
  const previewBg =
    config.theme === "light"
      ? "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)"
      : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";

  const row = { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" };
  const label = { fontSize: 11, fontWeight: 700, color: T.dim, minWidth: 88, letterSpacing: 0.5 };
  const chip = (active) => ({
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 10,
    border: `1px solid ${active ? T.accentBorder : T.brd}`,
    background: active ? T.accentSoft : T.inp,
    color: active ? T.accent : T.sub,
    cursor: "pointer",
    lineHeight: 1,
  });

  const layoutLabels = {
    pill: lang === "ja" ? "ピル (最小)" : "Pill (compact)",
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
  const ALL_MODULES = ["fighter", "score", "rate", "streak", "gsp", "goal", "recent", "timer"];

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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Preview panel — its background mirrors the chosen theme so the user
          sees immediately whether the overlay text contrasts cleanly. */}
      <div
        style={{
          padding: 20,
          borderRadius: 14,
          background: previewBg,
          border: `1px solid ${T.brd}`,
          minHeight: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            transform: config.layout === "bar" ? "scale(0.78)" : "scale(1)",
            transformOrigin: "center",
            width: config.layout === "bar" ? "100%" : "auto",
          }}
        >
          <Layout data={preview} lang={lang} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            fontSize: 9,
            color: config.theme === "light" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)",
            letterSpacing: 1,
            fontWeight: 700,
          }}
        >
          {config.theme === "light"
            ? (lang === "ja" ? "明るいシーン想定" : "LIGHT SCENE")
            : (lang === "ja" ? "暗いシーン想定" : "DARK SCENE")}
        </div>
      </div>

      {/* Header actions: reset + help */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: -6 }}>
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "5px 10px", borderRadius: 8,
              border: `1px solid ${T.brd}`, background: "transparent",
              color: T.accent, fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >
            <HelpCircle size={12} />
            {t("broadcast.help.openBtn")}
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 10px", borderRadius: 8,
            border: `1px solid ${T.brd}`, background: "transparent",
            color: T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}
        >
          <RotateCcw size={12} />
          {t("broadcast.builder.reset")}
        </button>
      </div>

      {/* Layout preset */}
      <div style={row}>
        <span style={label}>{t("broadcast.builder.preset")}</span>
        {["pill", "card", "bar"].map((p) => (
          <button key={p} type="button" onClick={() => setLayout(p)} style={chip(config.layout === p)}>
            {layoutLabels[p]}
          </button>
        ))}
      </div>

      {/* Orientation (pill only) */}
      {config.layout === "pill" && (
        <div style={row}>
          <span style={label}>{t("broadcast.builder.orientation")}</span>
          {["horizontal", "vertical"].map((o) => (
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

      {/* Theme (dark / light) — replaces position/scale which OBS handles */}
      <div style={row}>
        <span style={label}>{t("broadcast.builder.theme")}</span>
        {["dark", "light"].map((th) => (
          <button
            key={th}
            type="button"
            onClick={() => setConfig((c) => ({ ...c, theme: th }))}
            style={chip(config.theme === th)}
          >
            {th === "dark"
              ? (lang === "ja" ? "ダーク（文字が白）" : "Dark (white text)")
              : (lang === "ja" ? "ライト（文字が黒）" : "Light (black text)")}
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

      {/* Background opacity */}
      <div style={row}>
        <span style={label}>{t("broadcast.builder.bg")}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={config.bg}
          onChange={(e) => setConfig((c) => ({ ...c, bg: Number(e.target.value) }))}
          style={{ flex: 1, maxWidth: 240, accentColor: T.accent }}
        />
        <span style={{ fontSize: 11, color: T.sub, fontFamily: "'Chakra Petch', monospace", minWidth: 36, textAlign: "right" }}>
          {config.bg}%
        </span>
      </div>

      {/* Accent color */}
      <div style={row}>
        <span style={label}>{t("broadcast.builder.accent")}</span>
        <input
          type="color"
          value={config.accent}
          onChange={(e) => setConfig((c) => ({ ...c, accent: e.target.value }))}
          style={{ width: 40, height: 32, padding: 0, border: `1px solid ${T.brd}`, background: "transparent", borderRadius: 8, cursor: "pointer" }}
        />
        <code style={{ fontSize: 11, color: T.sub, fontFamily: "'Chakra Petch', monospace" }}>{config.accent}</code>
      </div>

      {/* Generated URL */}
      <div style={{ marginTop: 6 }}>
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
              padding: "10px 12px",
              background: T.inp,
              border: `1px solid ${T.brd}`,
              borderRadius: 10,
              color: T.text,
              fontSize: 12,
              outline: "none",
              fontFamily: "'Chakra Petch', monospace",
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={copyUrl}
            style={{
              padding: "0 14px",
              border: "none",
              borderRadius: 10,
              background: copied ? T.accentSoft : T.accent,
              color: copied ? T.accent : "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Copy size={13} />
            {copied ? t("broadcast.builder.copied") : t("broadcast.builder.copy")}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "0 14px",
              border: `1px solid ${T.brd}`,
              borderRadius: 10,
              background: T.card,
              color: T.sub,
              fontSize: 12,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
            }}
          >
            <ExternalLink size={13} />
            {t("broadcast.builder.open")}
          </a>
        </div>
        <div style={{ fontSize: 10, color: T.dimmer, marginTop: 8, lineHeight: 1.5 }}>
          {t("broadcast.builder.obsNote")}
        </div>
      </div>
    </div>
  );
}
