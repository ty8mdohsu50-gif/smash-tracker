import { Zap, Flame } from "lucide-react";
import FighterIcon from "../../shared/FighterIcon";
import { fighterName } from "../../../constants/fighters";
import { percentStr, numFormat } from "../../../utils/format";
import {
  WIN_COLOR,
  LOSE_COLOR,
  MUTED_TEXT,
  DIM_TEXT,
  panelStyle,
} from "../overlayStyles";
import { formatSessionTimer } from "../../../hooks/useOverlayData";

// Detailed card layout — richer info for streamers who want viewers
// to see the full session context. Designed to sit in a corner and
// take roughly 260-320px wide.
export default function CardOverlay({ data, lang }) {
  const {
    params, myChar, tW, tL, streak, pwrDelta, currentPower,
    recent, goal, flashState, sessionElapsedSec,
  } = data;
  const { accent, bg, scale, modules } = params;
  const total = tW + tL;
  const s = scale;
  const show = (id) => modules.has(id);

  const winRate = total > 0 ? Math.round((tW / total) * 100) : null;

  return (
    <div
      style={{
        ...panelStyle({ bg, accent, flashState, borderRadius: 16 * s }),
        padding: `${16 * s}px ${18 * s}px`,
        width: 320 * s,
        display: "flex",
        flexDirection: "column",
        gap: 12 * s,
      }}
    >
      {/* Header: fighter + LIVE indicator */}
      {show("fighter") && myChar && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10 * s,
            paddingBottom: 10 * s,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FighterIcon name={myChar} size={Math.round(40 * s)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16 * s,
                fontWeight: 800,
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fighterName(myChar, lang)}
            </div>
            <div
              style={{
                fontSize: 10 * s,
                color: DIM_TEXT,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              TODAY · {total} GAMES
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 * s }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4 * s,
                fontSize: 9 * s,
                fontWeight: 800,
                color: "#EF4444",
                letterSpacing: 1,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 6 * s,
                  height: 6 * s,
                  borderRadius: "50%",
                  background: "#EF4444",
                  animation: "overlayLivePulse 2s infinite",
                }}
              />
              LIVE
            </div>
          </div>
        </div>
      )}

      {/* Main stats row */}
      <div style={{ display: "flex", gap: 14 * s, alignItems: "stretch" }}>
        {show("score") && (
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9 * s, color: DIM_TEXT, fontWeight: 700, letterSpacing: 1 }}>W / L</div>
            <div
              style={{
                fontSize: 30 * s,
                fontWeight: 900,
                letterSpacing: -1,
                lineHeight: 1,
                marginTop: 3 * s,
                fontFamily: "'Chakra Petch', monospace",
              }}
            >
              <span style={{ color: WIN_COLOR }}>{tW}</span>
              <span style={{ opacity: 0.35, fontSize: 18 * s, margin: `0 ${4 * s}px` }}>:</span>
              <span style={{ color: LOSE_COLOR }}>{tL}</span>
            </div>
          </div>
        )}

        {show("rate") && winRate !== null && (
          <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 9 * s, color: DIM_TEXT, fontWeight: 700, letterSpacing: 1 }}>WIN%</div>
            <div
              style={{
                fontSize: 30 * s,
                fontWeight: 900,
                color: accent,
                lineHeight: 1,
                marginTop: 3 * s,
                fontFamily: "'Chakra Petch', monospace",
              }}
            >
              {winRate}
              <span style={{ fontSize: 16 * s, marginLeft: 2 }}>%</span>
            </div>
          </div>
        )}
      </div>

      {/* Streak + GSP row */}
      {((show("streak") && streak && streak.count >= 2) || (show("gsp") && (pwrDelta !== null || currentPower))) && (
        <div
          style={{
            display: "flex",
            gap: 10 * s,
            alignItems: "center",
            fontSize: 12 * s,
            color: MUTED_TEXT,
          }}
        >
          {show("streak") && streak && streak.count >= 2 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4 * s,
                padding: `${4 * s}px ${10 * s}px`,
                borderRadius: 999,
                background: streak.type === "win" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                animation: "overlayStreakPulse 1.8s infinite",
              }}
            >
              {streak.type === "win" ? (
                <Flame size={Math.round(14 * s)} color={WIN_COLOR} fill={WIN_COLOR} />
              ) : (
                <Zap size={Math.round(14 * s)} color={LOSE_COLOR} fill={LOSE_COLOR} />
              )}
              <span
                style={{
                  fontSize: 13 * s,
                  fontWeight: 900,
                  color: streak.type === "win" ? WIN_COLOR : LOSE_COLOR,
                }}
              >
                {streak.count} {streak.type === "win" ? "WIN" : "LOSE"}
              </span>
            </div>
          )}
          {show("gsp") && (pwrDelta !== null || currentPower) && (
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "baseline",
                gap: 6 * s,
              }}
            >
              {currentPower && (
                <span style={{ fontSize: 14 * s, fontWeight: 800, color: "#fff" }}>
                  {numFormat(currentPower)}
                </span>
              )}
              {pwrDelta !== null && (
                <span
                  style={{
                    fontSize: 12 * s,
                    fontWeight: 800,
                    color: pwrDelta >= 0 ? WIN_COLOR : LOSE_COLOR,
                  }}
                >
                  ({pwrDelta >= 0 ? "+" : ""}
                  {numFormat(pwrDelta)})
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Goal progress */}
      {show("goal") && goal.games > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10 * s,
              color: DIM_TEXT,
              fontWeight: 700,
              letterSpacing: 0.5,
              marginBottom: 4 * s,
            }}
          >
            <span>TODAY GOAL</span>
            <span style={{ color: "#fff" }}>
              {goal.totalToday} / {goal.games}
            </span>
          </div>
          <div
            style={{
              height: 6 * s,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 3,
              overflow: "hidden",
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
      )}

      {/* Recent result dots */}
      {show("recent") && recent.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 * s }}>
          <div style={{ fontSize: 9 * s, color: DIM_TEXT, fontWeight: 700, letterSpacing: 1 }}>
            RECENT
          </div>
          <div style={{ display: "flex", gap: 4 * s }}>
            {recent.map((r, i) => (
              <div
                key={i}
                style={{
                  width: 10 * s,
                  height: 10 * s,
                  borderRadius: "50%",
                  background: r === "win" ? WIN_COLOR : LOSE_COLOR,
                  opacity: 0.35 + (0.65 * (i + 1)) / recent.length,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Session timer */}
      {show("timer") && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 11 * s,
            color: DIM_TEXT,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 8 * s,
            fontFamily: "'Chakra Petch', monospace",
          }}
        >
          <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>SESSION</span>
          <span style={{ color: "#fff", fontWeight: 800 }}>
            {formatSessionTimer(sessionElapsedSec)}
          </span>
        </div>
      )}
    </div>
  );
}
