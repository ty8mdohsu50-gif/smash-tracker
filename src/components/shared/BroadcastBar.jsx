import { Zap } from "lucide-react";
import FighterIcon from "./FighterIcon";
import { fighterName } from "../../constants/fighters";
import { percentStr, numFormat } from "../../utils/format";

export default function BroadcastBar({ myChar, tW, tL, winRate, streak, pwrDelta, T, isPC, lang }) {
  const total = tW + tL;
  const winColor = T.winBright;
  const loseColor = T.loseBright;

  return (
    <div style={{
      background: "rgba(15,15,35,0.85)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderRadius: 12,
      padding: isPC ? "8px 20px" : "6px 14px",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: isPC ? 18 : 10,
      fontFamily: "'Chakra Petch', sans-serif",
      color: "#fff",
      border: `1px solid ${T.accent}33`,
      boxShadow: `0 2px 12px ${T.accent}15`,
      overflow: "hidden",
    }}>
      {/* Character */}
      {myChar && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <FighterIcon name={myChar} size={isPC ? 26 : 22} />
          <span style={{ fontSize: isPC ? 13 : 11, fontWeight: 700, whiteSpace: "nowrap" }}>
            {fighterName(myChar, lang)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />

      {/* W-L */}
      <div style={{ fontSize: isPC ? 22 : 18, fontWeight: 900, letterSpacing: -1, flexShrink: 0 }}>
        <span style={{ color: winColor }}>{tW}</span>
        <span style={{ opacity: 0.4, fontSize: isPC ? 14 : 11, margin: "0 3px" }}>:</span>
        <span style={{ color: loseColor }}>{tL}</span>
      </div>

      {/* Win rate */}
      {total > 0 && (
        <div style={{ fontSize: isPC ? 18 : 15, fontWeight: 800, color: T.accent, flexShrink: 0 }}>
          {percentStr(tW, total)}
        </div>
      )}

      {/* Streak */}
      {streak && streak.count >= 2 && (
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          <Zap size={isPC ? 14 : 12} fill={streak.type === "win" ? winColor : loseColor} color={streak.type === "win" ? winColor : loseColor} />
          <span style={{ fontSize: isPC ? 16 : 14, fontWeight: 800, color: streak.type === "win" ? winColor : loseColor }}>
            {streak.count}
          </span>
        </div>
      )}

      {/* GSP delta */}
      {pwrDelta !== null && (
        <div style={{ fontSize: isPC ? 14 : 12, fontWeight: 700, color: pwrDelta >= 0 ? winColor : loseColor, flexShrink: 0 }}>
          {pwrDelta >= 0 ? "+" : ""}{numFormat(pwrDelta)}
        </div>
      )}

      {/* Live indicator */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>LIVE</span>
      </div>
    </div>
  );
}
