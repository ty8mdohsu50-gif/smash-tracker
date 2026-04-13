import { Flame, Zap } from "lucide-react";
import FighterIcon from "../../shared/FighterIcon";
import { fighterName } from "../../../constants/fighters";
import { percentStr, numFormat } from "../../../utils/format";
import {
  WIN_COLOR,
  LOSE_COLOR,
  panelStyle,
  paletteFor,
} from "../overlayStyles";
import { formatSessionTimer } from "../../../hooks/useOverlayData";

// Full-width bar — modeled on the tournament broadcast frames in the
// reference screenshots. Sits along the top or bottom edge of the
// stream and spans the whole width. Designed for 16:9 output.
export default function BarOverlay({ data, lang }) {
  const {
    params, myChar, tW, tL, streak, pwrDelta, currentPower,
    goal, flashState, sessionElapsedSec,
  } = data;
  const { accent, bg, scale, modules, theme } = params;
  const total = tW + tL;
  const s = scale;
  const pal = paletteFor(theme);
  const show = (id) => modules.has(id);

  const cellLabel = (text) => (
    <div
      style={{
        fontSize: 9 * s,
        color: pal.dim,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );

  const divider = (
    <div style={{ width: 1, alignSelf: "stretch", background: pal.divider }} />
  );

  return (
    <div
      style={{
        ...panelStyle({ bg, accent, flashState, borderRadius: 14 * s, theme }),
        padding: `${10 * s}px ${22 * s}px`,
        display: "flex",
        alignItems: "center",
        gap: 22 * s,
        width: "100%",
        minHeight: 58 * s,
      }}
    >
      {/* Brand / LIVE tag */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6 * s,
          flexShrink: 0,
          borderRight: `1px solid ${pal.innerBorder}`,
          paddingRight: 22 * s,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8 * s,
            height: 8 * s,
            borderRadius: "50%",
            background: "#EF4444",
            animation: "overlayLivePulse 2s infinite",
          }}
        />
        <span
          style={{
            fontSize: 11 * s,
            fontWeight: 900,
            letterSpacing: 2,
            color: pal.text,
          }}
        >
          LIVE
        </span>
      </div>

      {/* Fighter */}
      {show("fighter") && myChar && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10 * s, flexShrink: 0 }}>
            <FighterIcon name={myChar} size={Math.round(36 * s)} />
            <div>
              {cellLabel("Fighter")}
              <div
                style={{
                  fontSize: 16 * s,
                  fontWeight: 800,
                  color: pal.text,
                  lineHeight: 1.1,
                }}
              >
                {fighterName(myChar, lang)}
              </div>
            </div>
          </div>
          {divider}
        </>
      )}

      {/* Score */}
      {show("score") && (
        <>
          <div style={{ flexShrink: 0 }}>
            {cellLabel("Today W-L")}
            <div
              style={{
                fontSize: 26 * s,
                fontWeight: 900,
                letterSpacing: -1,
                lineHeight: 1,
                fontFamily: "'Chakra Petch', monospace",
              }}
            >
              <span style={{ color: WIN_COLOR }}>{tW}</span>
              <span style={{ opacity: 0.35, fontSize: 16 * s, margin: `0 ${4 * s}px` }}>:</span>
              <span style={{ color: LOSE_COLOR }}>{tL}</span>
            </div>
          </div>
          {divider}
        </>
      )}

      {/* Win rate */}
      {show("rate") && total > 0 && (
        <>
          <div style={{ flexShrink: 0 }}>
            {cellLabel("Win Rate")}
            <div
              style={{
                fontSize: 26 * s,
                fontWeight: 900,
                color: accent,
                lineHeight: 1,
                fontFamily: "'Chakra Petch', monospace",
              }}
            >
              {percentStr(tW, total)}
            </div>
          </div>
          {divider}
        </>
      )}

      {/* Streak */}
      {show("streak") && streak && streak.count >= 2 && (
        <>
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 * s }}>
            {streak.type === "win" ? (
              <Flame size={Math.round(22 * s)} color={WIN_COLOR} fill={WIN_COLOR} />
            ) : (
              <Zap size={Math.round(22 * s)} color={LOSE_COLOR} fill={LOSE_COLOR} />
            )}
            <div>
              {cellLabel(streak.type === "win" ? "Win Streak" : "Lose Streak")}
              <div
                style={{
                  fontSize: 22 * s,
                  fontWeight: 900,
                  color: streak.type === "win" ? WIN_COLOR : LOSE_COLOR,
                  lineHeight: 1,
                }}
              >
                {streak.count}
              </div>
            </div>
          </div>
          {divider}
        </>
      )}

      {/* GSP */}
      {show("gsp") && (pwrDelta !== null || currentPower) && (
        <>
          <div style={{ flexShrink: 0 }}>
            {cellLabel("GSP")}
            <div
              style={{
                fontSize: 16 * s,
                fontWeight: 800,
                color: pal.text,
                lineHeight: 1.1,
                fontFamily: "'Chakra Petch', monospace",
              }}
            >
              {currentPower ? numFormat(currentPower) : "—"}
              {pwrDelta !== null && (
                <span
                  style={{
                    fontSize: 12 * s,
                    marginLeft: 6 * s,
                    color: pwrDelta >= 0 ? WIN_COLOR : LOSE_COLOR,
                  }}
                >
                  {pwrDelta >= 0 ? "+" : ""}
                  {numFormat(pwrDelta)}
                </span>
              )}
            </div>
          </div>
          {divider}
        </>
      )}

      {/* Goal progress */}
      {show("goal") && goal.games > 0 && (
        <>
          <div style={{ flexShrink: 0, minWidth: 140 * s }}>
            {cellLabel(`Goal ${goal.totalToday}/${goal.games}`)}
            <div
              style={{
                height: 6 * s,
                background: pal.innerBg,
                borderRadius: 3,
                overflow: "hidden",
                marginTop: 6 * s,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${goal.gamesProgress * 100}%`,
                  background: accent,
                  boxShadow: `0 0 8px ${accent}`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
          {divider}
        </>
      )}

      {/* Session timer (right-aligned) */}
      {show("timer") && (
        <div
          style={{
            marginLeft: "auto",
            flexShrink: 0,
            textAlign: "right",
          }}
        >
          {cellLabel("Session")}
          <div
            style={{
              fontSize: 20 * s,
              fontWeight: 800,
              color: MUTED_TEXT,
              fontFamily: "'Chakra Petch', monospace",
              lineHeight: 1,
            }}
          >
            {formatSessionTimer(sessionElapsedSec)}
          </div>
        </div>
      )}
    </div>
  );
}
