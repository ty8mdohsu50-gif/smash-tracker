import FighterIcon from "../../shared/FighterIcon";
import { fighterName } from "../../../constants/fighters";
import { percentStr, barColor } from "../../../utils/format";
import { topOpponentStats } from "../../../utils/analysis";
import { analysisMatchLogTable } from "../analysisHelpers";

export default function HourDetailModal({
  hourDetailModal, setHourDetailModal,
  hourlyStats, data, totalW, matchesWithIdx, formatHourFn,
  T, isPC, t, lang,
  analysisModalBackdrop, analysisModalPanel,
}) {
  if (hourDetailModal === null || !hourlyStats[hourDetailModal]) return null;

  const hr = hourDetailModal;
  const d = hourlyStats[hr];
  const tH = d.w + d.l;
  const rH = tH ? d.w / tH : 0;
  const careerR = data.matches.length ? totalW / data.matches.length : 0;
  const diffPt = Math.round((rH - careerR) * 100);
  const pctOfAll = data.matches.length ? Math.round((tH / data.matches.length) * 100) : 0;
  const hourMs = matchesWithIdx.filter((m) => formatHourFn(m.time) === hr).slice().reverse();
  const adj = [-1, 0, 1].map((delta) => {
    const h = (hr + delta + 24) % 24;
    const stat = hourlyStats[h];
    if (!stat) return { h, t: 0, r: null };
    const tt = stat.w + stat.l;
    return { h, t: tt, r: tt ? stat.w / tt : null };
  });
  const topO = topOpponentStats(hourMs, 6);
  const lowSample = tH < 5;
  const closeFs = { border: "none", background: T.inp, borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, fontSize: 20, fontWeight: 700, flexShrink: 0 };

  return (
    <div role="presentation" style={analysisModalBackdrop} onClick={() => setHourDetailModal(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-fs-hour-title"
        style={analysisModalPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ flexShrink: 0, padding: "14px 18px", borderBottom: `1px solid ${T.brd}`, display: "flex", alignItems: "center", gap: 12, background: T.card }}>
          <button type="button" aria-label={t("common.close")} onClick={() => setHourDetailModal(null)} style={closeFs}>{"\u00D7"}</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div id="analysis-fs-hour-title" style={{ fontSize: isPC ? 18 : 16, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>{t("analysis.hourDetailTitle", { h: hr })}</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 4, lineHeight: 1.45 }}>{t("analysis.hourDetailSubtitle")}</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: isPC ? "18px 20px 24px" : "14px 14px 20px", background: T.bg }}>
          {lowSample && (
            <div style={{ background: T.midBg, border: `1px solid ${T.midBorder}`, borderRadius: 12, padding: "12px 14px", fontSize: 13, color: T.text, marginBottom: 14, lineHeight: 1.5 }}>{t("analysis.lowSample")}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(4, 1fr)" : "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.winRate")}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: barColor(rH), fontFamily: "'Chakra Petch', sans-serif", marginTop: 4 }}>{percentStr(d.w, tH)}</div>
            </div>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.winLoss")}</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>
                <span style={{ color: T.win }}>{d.w}</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: T.lose }}>{d.l}</span>
              </div>
            </div>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.vsOverallWr")}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: diffPt >= 0 ? T.win : T.lose, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>{diffPt >= 0 ? "+" : ""}{diffPt}pt</div>
            </div>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.hourShareOfAll")}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: T.text, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>{pctOfAll}%</div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{tH}{t("common.matches")}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("analysis.adjacentHours")}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {adj.map(({ h: hh, t: tt, r: rr }) => (
              <div key={hh} style={{ flex: "1 1 100px", background: T.inp, borderRadius: 12, padding: "10px 8px", textAlign: "center", opacity: tt ? 1 : 0.45, border: `1px solid ${T.brd}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: hh === hr ? T.accent : T.text }}>{hh}{t("analysis.hour")}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: rr == null ? T.dim : barColor(rr), marginTop: 4 }}>{rr == null ? "\u2014" : `${Math.round(rr * 100)}%`}</div>
                <div style={{ fontSize: 10, color: T.dim }}>{tt}{t("analysis.battles")}</div>
              </div>
            ))}
          </div>

          <div style={{ background: T.inp, borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: `1px solid ${T.brd}` }}>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, marginBottom: 8 }}>{t("analysis.topOpponents")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 10 }}>
              {topO.length === 0 ? <span style={{ fontSize: 13, color: T.dim }}>{"\u2014"}</span> : topO.map((o) => (
                <div key={o.c} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, padding: "6px 8px", borderRadius: 10, background: T.card, border: `1px solid ${T.brd}` }}>
                  <FighterIcon name={o.c} size={28} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fighterName(o.c, lang)}>{fighterName(o.c, lang)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, marginTop: 2 }}>{o.w}W {o.l}L</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, color: T.sub, marginBottom: 10, letterSpacing: "0.02em" }}>{t("analysis.matchHistory")}</div>
          {analysisMatchLogTable({ matchesRev: hourMs, T, isPC, lang, t })}
        </div>
      </div>
    </div>
  );
}
