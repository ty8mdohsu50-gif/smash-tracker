import { forwardRef } from "react";
import FighterIcon from "./FighterIcon";
import { fighterName } from "../../constants/fighters";
import {
  formatDateLong,
  percentStr,
  numFormat,
} from "../../utils/format";

const SessionCard = forwardRef(function SessionCard(
  { myChar, tW, tL, tM, oppStats, dayStart, dayEnd, streak, date, playerTag, T, lang },
  ref,
) {
  const total = tW + tL;
  const pwrDelta = dayStart && dayEnd ? dayEnd - dayStart : null;

  const bg = "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)";
  const accent = T.accent;

  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        height: 630,
        background: bg,
        padding: "48px 56px",
        boxSizing: "border-box",
        fontFamily: "'Chakra Petch', 'Noto Sans JP', sans-serif",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent glow */}
      <div style={{
        position: "absolute", top: -80, right: -80, width: 300, height: 300,
        borderRadius: "50%", background: accent, opacity: 0.08, filter: "blur(80px)",
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 3, fontWeight: 600, marginBottom: 8 }}>
            SESSION SUMMARY
          </div>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.7)" }}>
            {formatDateLong(date)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/icon.png" alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain" }} />
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: accent }}>SMASH TRACKER</div>
        </div>
      </div>

      {/* Main stats */}
      <div style={{ display: "flex", alignItems: "center", gap: 48, flex: 1, paddingTop: 20 }}>
        {/* Character */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <FighterIcon name={myChar} size={72} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{fighterName(myChar, lang)}</div>
            {playerTag && (
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{playerTag}</div>
            )}
          </div>
        </div>

        {/* W-L */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1 }}>
            <span style={{ color: T.winBright }}>{tW}</span>
            <span style={{ fontSize: 32, opacity: 0.5, margin: "0 8px" }}>:</span>
            <span style={{ color: T.loseBright }}>{tL}</span>
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
            {total} {lang === "ja" ? "戦" : "games"}
          </div>
        </div>

        {/* Win rate */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: accent, lineHeight: 1 }}>
            {percentStr(tW, total)}
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
            {lang === "ja" ? "勝率" : "Win Rate"}
          </div>
        </div>

        {/* Power delta */}
        {pwrDelta !== null && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: pwrDelta >= 0 ? T.winBright : T.loseBright, lineHeight: 1 }}>
              {pwrDelta >= 0 ? "+" : ""}{numFormat(pwrDelta)}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
              {lang === "ja" ? "戦闘力" : "GSP"}
            </div>
          </div>
        )}

        {/* Streak */}
        {streak && streak.count >= 2 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: streak.type === "win" ? T.winBright : T.loseBright, lineHeight: 1 }}>
              {streak.count}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
              {streak.type === "win" ? (lang === "ja" ? "連勝" : "Win Streak") : (lang === "ja" ? "連敗" : "Lose Streak")}
            </div>
          </div>
        )}
      </div>

      {/* Opponent breakdown */}
      {oppStats && Object.keys(oppStats).length > 0 && (
        <div style={{
          display: "flex", gap: 12, flexWrap: "wrap",
          background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 18px",
        }}>
          {Object.entries(oppStats)
            .sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))
            .slice(0, 8)
            .map(([opp, s]) => (
              <div key={opp} style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
                <FighterIcon name={opp} size={24} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{fighterName(opp, lang)}</span>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{s.w}W:{s.l}L</span>
              </div>
            ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          #SmashTracker
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          smash-tracker.pages.dev
        </div>
      </div>
    </div>
  );
});

export default SessionCard;
