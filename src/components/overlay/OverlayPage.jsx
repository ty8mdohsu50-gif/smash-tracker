import { useState, useEffect, useMemo } from "react";
import { Zap } from "lucide-react";
import FighterIcon from "../shared/FighterIcon";
import { fighterName } from "../../constants/fighters";
import { load } from "../../utils/storage";
import { useI18n } from "../../i18n/index.jsx";
import {
  today,
  percentStr,
  getStreak,
  numFormat,
} from "../../utils/format";

export default function OverlayPage() {
  const { lang } = useI18n();
  const [data, setData] = useState(() => load());

  useEffect(() => {
    const interval = setInterval(() => {
      setData(load());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.body.style.background = "transparent";
    document.getElementById("root").style.background = "transparent";
  }, []);

  const myChar = data.settings?.myChar || "";
  const tM = useMemo(
    () => (data.matches || []).filter((m) => m.date === today()),
    [data],
  );
  const tW = tM.filter((m) => m.result === "win").length;
  const tL = tM.length - tW;
  const streak = useMemo(() => getStreak(data.matches || []), [data]);
  const todayDaily = data.daily?.[today()] || {};
  const charPower = todayDaily.chars?.[myChar] || {};
  const dayStart = charPower.start || todayDaily.start || null;
  const dayEnd = charPower.end || todayDaily.end || null;
  const pwrDelta = dayStart && dayEnd ? dayEnd - dayStart : null;

  const params = new URLSearchParams(window.location.search);
  const layout = params.get("layout") || "horizontal";
  const accent = params.get("color") || "#8B5CF6";

  const winColor = "#22C55E";
  const loseColor = "#F43F5E";

  if (!myChar || tM.length === 0) {
    return (
      <div style={{
        fontFamily: "'Chakra Petch', sans-serif",
        color: "#fff",
        fontSize: 14,
        padding: 12,
        background: "rgba(0,0,0,0.6)",
        borderRadius: 12,
        display: "inline-block",
      }}>
        {myChar ? fighterName(myChar, lang) : "SMASH TRACKER"} - {lang === "ja" ? "待機中..." : "Waiting..."}
      </div>
    );
  }

  if (layout === "vertical") {
    return (
      <div style={{
        fontFamily: "'Chakra Petch', sans-serif",
        color: "#fff",
        background: "rgba(0,0,0,0.7)",
        borderRadius: 16,
        padding: "16px 20px",
        display: "inline-flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        backdropFilter: "blur(8px)",
        border: `1px solid ${accent}44`,
        minWidth: 140,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FighterIcon name={myChar} size={28} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>{fighterName(myChar, lang)}</span>
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>
          <span style={{ color: winColor }}>{tW}</span>
          <span style={{ opacity: 0.5, fontSize: 18, margin: "0 4px" }}>:</span>
          <span style={{ color: loseColor }}>{tL}</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: accent }}>
          {percentStr(tW, tM.length)}
        </div>
        {streak.count >= 2 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={14} fill={streak.type === "win" ? winColor : loseColor} color={streak.type === "win" ? winColor : loseColor} />
            <span style={{ fontSize: 16, fontWeight: 800, color: streak.type === "win" ? winColor : loseColor }}>{streak.count}</span>
          </div>
        )}
        {pwrDelta !== null && (
          <div style={{ fontSize: 14, fontWeight: 700, color: pwrDelta >= 0 ? winColor : loseColor }}>
            {pwrDelta >= 0 ? "+" : ""}{numFormat(pwrDelta)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Chakra Petch', sans-serif",
      color: "#fff",
      background: "rgba(0,0,0,0.7)",
      borderRadius: 14,
      padding: "10px 20px",
      display: "inline-flex",
      alignItems: "center",
      gap: 16,
      backdropFilter: "blur(8px)",
      border: `1px solid ${accent}44`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <FighterIcon name={myChar} size={28} />
        <span style={{ fontSize: 14, fontWeight: 700 }}>{fighterName(myChar, lang)}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>
        <span style={{ color: winColor }}>{tW}</span>
        <span style={{ opacity: 0.5, fontSize: 14, margin: "0 3px" }}>:</span>
        <span style={{ color: loseColor }}>{tL}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: accent }}>
        {percentStr(tW, tM.length)}
      </div>
      {streak.count >= 2 && (
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Zap size={14} fill={streak.type === "win" ? winColor : loseColor} color={streak.type === "win" ? winColor : loseColor} />
          <span style={{ fontSize: 18, fontWeight: 800, color: streak.type === "win" ? winColor : loseColor }}>{streak.count}</span>
        </div>
      )}
      {pwrDelta !== null && (
        <div style={{ fontSize: 15, fontWeight: 700, color: pwrDelta >= 0 ? winColor : loseColor }}>
          {pwrDelta >= 0 ? "+" : ""}{numFormat(pwrDelta)}
        </div>
      )}
    </div>
  );
}
