import { forwardRef } from "react";
import FighterIcon from "./FighterIcon";
import { fighterName } from "../../constants/fighters";
import {
  formatDateLong,
  percentStr,
  numFormat,
} from "../../utils/format";

const WIN = "#4ADE80";
const LOSE = "#F87171";
const AMBER = "#FBBF24";

// 1200x630 Open-Graph / Twitter card. Rendered off-screen then
// captured with html2canvas. The visual language matches the
// in-app end-of-session gradient card (T.tBg + bold stats + icon-
// forward opponent strip) rather than the previous flat layout.
const SessionCard = forwardRef(function SessionCard(
  { myChar, tW, tL, tM, oppStats, dayStart, dayEnd, streak, date, playerTag, T, lang },
  ref,
) {
  const total = tW + tL;
  const pwrDelta = dayStart && dayEnd ? dayEnd - dayStart : null;
  const winRate = total > 0 ? Math.round((tW / total) * 100) : 0;

  // Circular progress ring math for the win-rate badge.
  const ringR = 56;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC * (1 - winRate / 100);
  const ringColor = winRate >= 60 ? WIN : winRate >= 40 ? AMBER : LOSE;

  // Last up to 10 results for the dot strip
  const recentResults = (tM || []).slice(-10).map((m) => m.result);

  // Top matchups (up to 6 to fit the strip cleanly)
  const topOpps = oppStats
    ? Object.entries(oppStats)
        .sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))
        .slice(0, 6)
    : [];

  const accent = T.accent;
  const bg = T.tBg || "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)";

  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        height: 630,
        background: bg,
        padding: 0,
        boxSizing: "border-box",
        fontFamily: "'Chakra Petch', 'Noto Sans JP', sans-serif",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow orbs for visual depth */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: accent,
          opacity: 0.18,
          filter: "blur(100px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -160,
          left: -100,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "#000",
          opacity: 0.35,
          filter: "blur(120px)",
        }}
      />

      {/* Top strip: date + brand */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "22px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 3,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            SESSION SUMMARY
          </div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.92)", fontWeight: 600 }}>
            {formatDateLong(date)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/icon.png"
            alt=""
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }}
          />
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, color: "#fff" }}>
            SMASH TRACKER
          </div>
        </div>
      </div>

      {/* Hero: fighter portrait + win rate ring + W-L + GSP */}
      <div
        style={{
          position: "absolute",
          top: 110,
          left: 48,
          right: 48,
          display: "flex",
          alignItems: "center",
          gap: 36,
        }}
      >
        {/* Fighter portrait with glow ring */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              position: "absolute",
              inset: -10,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
              opacity: 0.6,
              filter: "blur(18px)",
            }}
          />
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.45)",
              border: `3px solid ${accent}`,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              boxShadow: `0 0 40px ${accent}66`,
            }}
          >
            {myChar && <FighterIcon name={myChar} size={150} />}
          </div>
        </div>

        {/* Fighter name + player tag + W-L big */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {myChar && (
            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                lineHeight: 1,
                marginBottom: 6,
                color: "#fff",
                textShadow: "0 2px 18px rgba(0,0,0,0.5)",
              }}
            >
              {fighterName(myChar, lang)}
            </div>
          )}
          {playerTag && (
            <div
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 16,
                fontWeight: 600,
              }}
            >
              {playerTag}
            </div>
          )}
          <div
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 12,
              padding: "16px 26px",
              background: "rgba(0,0,0,0.38)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 900,
                  color: WIN,
                  lineHeight: 1,
                  letterSpacing: -2,
                  fontFamily: "'Chakra Petch', monospace",
                }}
              >
                {tW}
              </span>
              <span
                style={{
                  fontSize: 36,
                  color: "rgba(255,255,255,0.4)",
                  margin: "0 10px",
                  fontWeight: 700,
                }}
              >
                :
              </span>
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 900,
                  color: LOSE,
                  lineHeight: 1,
                  letterSpacing: -2,
                  fontFamily: "'Chakra Petch', monospace",
                }}
              >
                {tL}
              </span>
            </div>
            <div
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.55)",
                fontWeight: 600,
                marginLeft: 4,
              }}
            >
              {total} {lang === "ja" ? "戦" : "games"}
            </div>
          </div>
        </div>

        {/* Win rate ring */}
        <div style={{ flexShrink: 0, position: "relative", width: 160, height: 160 }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={ringR}
              fill="rgba(0,0,0,0.4)"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
            />
            <circle
              cx="80"
              cy="80"
              r={ringR}
              fill="none"
              stroke={ringColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={ringC}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 80 80)"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: ringColor,
                lineHeight: 1,
                fontFamily: "'Chakra Petch', monospace",
              }}
            >
              {total > 0 ? winRate : "—"}
              {total > 0 && <span style={{ fontSize: 22, marginLeft: 2 }}>%</span>}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: 2,
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              WIN RATE
            </div>
          </div>
        </div>
      </div>

      {/* Secondary stats row: GSP delta + streak + recent dots */}
      <div
        style={{
          position: "absolute",
          top: 320,
          left: 48,
          right: 48,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* GSP */}
        {(dayStart || dayEnd) && (
          <div
            style={{
              padding: "12px 20px",
              background: "rgba(0,0,0,0.35)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.5,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              GSP
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                fontFamily: "'Chakra Petch', monospace",
                color: "#fff",
              }}
            >
              {numFormat(dayEnd || dayStart || 0)}
            </div>
            {pwrDelta !== null && (
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: pwrDelta >= 0 ? WIN : LOSE,
                }}
              >
                {pwrDelta >= 0 ? "+" : ""}
                {numFormat(pwrDelta)}
              </div>
            )}
          </div>
        )}

        {/* Streak */}
        {streak && streak.count >= 2 && (
          <div
            style={{
              padding: "12px 20px",
              background:
                streak.type === "win"
                  ? "rgba(74,222,128,0.14)"
                  : "rgba(248,113,113,0.14)",
              borderRadius: 12,
              border: `1px solid ${streak.type === "win" ? "rgba(74,222,128,0.35)" : "rgba(248,113,113,0.35)"}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.5,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              {streak.type === "win"
                ? lang === "ja" ? "連勝" : "STREAK"
                : lang === "ja" ? "連敗" : "LOSING"}
            </div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: streak.type === "win" ? WIN : LOSE,
                lineHeight: 1,
                fontFamily: "'Chakra Petch', monospace",
              }}
            >
              {streak.count}
            </div>
          </div>
        )}

        {/* Recent result dots */}
        {recentResults.length > 0 && (
          <div
            style={{
              marginLeft: "auto",
              padding: "12px 18px",
              background: "rgba(0,0,0,0.35)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.5,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              RECENT
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {recentResults.map((r, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: r === "win" ? WIN : LOSE,
                    opacity: 0.4 + (0.6 * (i + 1)) / recentResults.length,
                    boxShadow: `0 0 8px ${r === "win" ? WIN : LOSE}88`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Opponents breakdown */}
      {topOpps.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 48,
            right: 48,
            bottom: 64,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2,
              color: "rgba(255,255,255,0.55)",
              marginBottom: 10,
            }}
          >
            MATCHUPS
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {topOpps.map(([opp, s]) => {
              const oppTotal = s.w + s.l;
              const oppRate = oppTotal > 0 ? s.w / oppTotal : 0;
              const barColor = oppRate >= 0.6 ? WIN : oppRate >= 0.4 ? AMBER : LOSE;
              return (
                <div
                  key={opp}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "rgba(0,0,0,0.4)",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <FighterIcon name={opp} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#fff",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fighterName(opp, lang)}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 900,
                        fontFamily: "'Chakra Petch', monospace",
                        marginTop: 2,
                      }}
                    >
                      <span style={{ color: WIN }}>{s.w}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>:</span>
                      <span style={{ color: LOSE }}>{s.l}</span>
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: barColor,
                          fontWeight: 800,
                        }}
                      >
                        {Math.round(oppRate * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 48,
          right: 48,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "rgba(255,255,255,0.35)",
          fontWeight: 600,
        }}
      >
        <div>#SmashTracker #スマブラ</div>
        <div>smash-tracker.pages.dev</div>
      </div>
    </div>
  );
});

export default SessionCard;
