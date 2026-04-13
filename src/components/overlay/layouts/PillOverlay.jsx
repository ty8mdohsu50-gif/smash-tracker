import { Zap } from "lucide-react";
import FighterIcon from "../../shared/FighterIcon";
import { fighterName } from "../../../constants/fighters";
import { percentStr, numFormat } from "../../../utils/format";
import {
  WIN_COLOR,
  LOSE_COLOR,
  panelStyle,
  paletteFor,
} from "../overlayStyles";

// Compact corner pill — the smallest overlay. Fits either
// horizontally (top bar along a stream frame) or vertically
// (narrow side column for mobile 9:16 streams).
export default function PillOverlay({ data, lang }) {
  const { params, myChar, tW, tL, streak, pwrDelta, flashState } = data;
  const { accent, bg, scale, orientation, modules, theme } = params;
  const total = tW + tL;
  const isV = orientation === "vertical";
  const s = scale;
  const pal = paletteFor(theme);

  const show = (id) => modules.has(id);

  const label = (text, fontSize) => (
    <span
      style={{
        fontSize: fontSize * s,
        color: pal.muted,
        fontWeight: 600,
        letterSpacing: 0.4,
      }}
    >
      {text}
    </span>
  );

  const divider = (
    <div
      style={{
        width: isV ? "70%" : 1,
        height: isV ? 1 : 20 * s,
        background: pal.divider,
        flexShrink: 0,
      }}
    />
  );

  const fighterBlock = show("fighter") && myChar && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6 * s,
        flexShrink: 0,
      }}
    >
      <FighterIcon name={myChar} size={Math.round((isV ? 28 : 26) * s)} />
      <span
        style={{
          fontSize: (isV ? 13 : 13) * s,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {fighterName(myChar, lang)}
      </span>
    </div>
  );

  const scoreBlock = show("score") && (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      {label("W - L", 9)}
      <div
        style={{
          fontSize: (isV ? 30 : 26) * s,
          fontWeight: 900,
          letterSpacing: -1,
          lineHeight: 1,
          marginTop: 2 * s,
        }}
      >
        <span style={{ color: WIN_COLOR }}>{tW}</span>
        <span style={{ opacity: 0.4, fontSize: (isV ? 16 : 14) * s, margin: `0 ${3 * s}px` }}>:</span>
        <span style={{ color: LOSE_COLOR }}>{tL}</span>
      </div>
    </div>
  );

  const rateBlock = show("rate") && total > 0 && (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      {label("WIN%", 9)}
      <div
        style={{
          fontSize: (isV ? 22 : 20) * s,
          fontWeight: 800,
          color: accent,
          lineHeight: 1,
          marginTop: 2 * s,
        }}
      >
        {percentStr(tW, total)}
      </div>
    </div>
  );

  const streakBlock = show("streak") && streak && streak.count >= 2 && (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3 * s,
        flexShrink: 0,
        animation: "overlayStreakPulse 1.8s infinite",
      }}
    >
      <Zap
        size={Math.round(14 * s)}
        fill={streak.type === "win" ? WIN_COLOR : LOSE_COLOR}
        color={streak.type === "win" ? WIN_COLOR : LOSE_COLOR}
      />
      <span
        style={{
          fontSize: (isV ? 18 : 18) * s,
          fontWeight: 900,
          color: streak.type === "win" ? WIN_COLOR : LOSE_COLOR,
        }}
      >
        {streak.count}
      </span>
    </div>
  );

  const gspBlock = show("gsp") && pwrDelta !== null && (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      {label("GSP", 9)}
      <div
        style={{
          fontSize: (isV ? 14 : 14) * s,
          fontWeight: 800,
          color: pwrDelta >= 0 ? WIN_COLOR : LOSE_COLOR,
          marginTop: 2 * s,
        }}
      >
        {pwrDelta >= 0 ? "+" : ""}
        {numFormat(pwrDelta)}
      </div>
    </div>
  );

  const blocks = [
    fighterBlock,
    fighterBlock && (scoreBlock || rateBlock || streakBlock || gspBlock) && divider,
    scoreBlock,
    rateBlock,
    streakBlock,
    gspBlock,
  ].filter(Boolean);

  return (
    <div
      style={{
        ...panelStyle({ bg, accent, flashState, borderRadius: 14 * s, theme }),
        padding: isV ? `${14 * s}px ${16 * s}px` : `${10 * s}px ${18 * s}px`,
        display: "inline-flex",
        flexDirection: isV ? "column" : "row",
        alignItems: "center",
        gap: (isV ? 10 : 14) * s,
      }}
    >
      {blocks.map((b, i) => (
        // Using index key is fine here — block order is static per render
        <div key={i} style={{ display: "contents" }}>
          {b}
        </div>
      ))}
    </div>
  );
}
