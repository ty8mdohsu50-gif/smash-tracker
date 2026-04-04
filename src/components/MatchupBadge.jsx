import { useMemo } from "react";
import FighterIcon from "./FighterIcon";

export default function MatchupBadge({ myChar, oppChar, matches, T }) {
  const stats = useMemo(() => {
    const ms = matches.filter(
      (m) => m.myChar === myChar && m.oppChar === oppChar,
    );
    const w = ms.filter((m) => m.result === "win").length;
    const l = ms.length - w;
    const recent = ms.slice(-5).map((m) => m.result);
    return { w, l, t: ms.length, recent };
  }, [matches, myChar, oppChar]);

  if (stats.t === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: T.inp,
          borderRadius: 12,
          marginTop: 8,
        }}
      >
        <FighterIcon name={oppChar} size={32} />
        <div style={{ fontSize: 12, color: T.dim }}>
          vs {oppChar} -- 初対戦
        </div>
      </div>
    );
  }

  const rate = stats.w / stats.t;
  const rateColor = rate >= 0.6 ? "#16a34a" : rate >= 0.4 ? "#a16207" : "#dc2626";
  const rateBg = rate >= 0.6 ? "rgba(52,199,89,.12)" : rate >= 0.4 ? "rgba(255,159,10,.12)" : "rgba(255,59,48,.12)";
  const pct = Math.round(rate * 100) + "%";

  return (
    <div
      style={{
        padding: "12px 14px",
        background: T.card,
        borderRadius: 12,
        border: `1px solid ${T.brd}`,
        marginTop: 8,
        boxShadow: T.sh,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FighterIcon name={oppChar} size={32} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>vs {oppChar}</div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 1 }}>
              {stats.t}戦 {stats.w}W {stats.l}L
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "4px 12px",
            borderRadius: 8,
            background: rateBg,
            color: rateColor,
            fontSize: 16,
            fontWeight: 800,
            fontFamily: "'Chakra Petch', sans-serif",
          }}
        >
          {pct}
        </div>
      </div>

      {/* Win rate bar */}
      <div
        style={{
          height: 4,
          background: T.inp,
          borderRadius: 2,
          overflow: "hidden",
          marginTop: 10,
        }}
      >
        <div
          style={{
            width: `${rate * 100}%`,
            height: "100%",
            borderRadius: 2,
            background: rateColor,
            transition: "width .3s ease",
          }}
        />
      </div>

      {/* Recent results */}
      {stats.recent.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          <span style={{ fontSize: 10, color: T.dim, marginRight: 4 }}>直近</span>
          {stats.recent.map((r, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: r === "win" ? "rgba(52,199,89,.15)" : "rgba(255,59,48,.15)",
                color: r === "win" ? "#16a34a" : "#dc2626",
                fontSize: 8,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {r === "win" ? "W" : "L"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
