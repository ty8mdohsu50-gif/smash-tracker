import { useEffect } from "react";
import { useI18n } from "../../i18n/index.jsx";
import { useOverlayData } from "../../hooks/useOverlayData";
import { OVERLAY_ANIMATIONS, positionStyle, OVERLAY_FONT, paletteFor, bgColor } from "./overlayStyles";
import PillOverlay from "./layouts/PillOverlay";
import CardOverlay from "./layouts/CardOverlay";
import BarOverlay from "./layouts/BarOverlay";
import { fighterName } from "../../constants/fighters";

export default function OverlayPage() {
  const { lang } = useI18n();
  const data = useOverlayData();
  const { params, myChar, total, hasData } = data;

  // Ensure the root is always transparent for OBS browser source compositing.
  useEffect(() => {
    document.body.style.background = "transparent";
    document.body.style.margin = "0";
    const root = document.getElementById("root");
    if (root) {
      root.style.background = "transparent";
    }
  }, []);

  // Inject keyframes once — they aren't in index.css so the overlay
  // route stays self-contained.
  useEffect(() => {
    const id = "overlay-keyframes";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = OVERLAY_ANIMATIONS;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  const wrapperStyle = positionStyle(params.position);

  // Waiting state — no match today yet.
  if (!hasData) {
    const pal = paletteFor(params.theme);
    const waitingLabel = lang === "ja" ? "待機中..." : "Waiting...";
    const title = myChar ? fighterName(myChar, lang) : "SMASH TRACKER";
    return (
      <div style={wrapperStyle}>
        <div
          style={{
            fontFamily: OVERLAY_FONT,
            color: pal.text,
            fontSize: 13,
            padding: "10px 16px",
            background: bgColor(Math.max(params.bg, 50), params.theme),
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${params.accent}33`,
            animation: "overlayFadeIn 0.3s ease",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: params.accent,
              animation: "overlayLivePulse 2s infinite",
            }}
          />
          <span style={{ fontWeight: 700 }}>{title}</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <span style={{ fontWeight: 600, color: pal.muted }}>{waitingLabel}</span>
        </div>
      </div>
    );
  }

  const Layout =
    params.layout === "card" ? CardOverlay
    : params.layout === "bar" ? BarOverlay
    : PillOverlay;

  // Bar layout naturally spans full width if position is top/bottom;
  // otherwise it still sits in its corner wrapper.
  return (
    <div style={wrapperStyle}>
      <Layout data={data} lang={lang} />
      {/* Invisible tap-to-count element — helps OBS developers notice the
          overlay is live even when stats are all zero. */}
      <span style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>
        {total}
      </span>
    </div>
  );
}
