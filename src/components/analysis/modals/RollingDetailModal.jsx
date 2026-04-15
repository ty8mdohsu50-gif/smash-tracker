import FighterIcon from "../../shared/FighterIcon";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { fighterName } from "../../../constants/fighters";
import {
  formatDate,
  percentStr,
  barColor,
} from "../../../utils/format";
import {
  computeRollingGraphSeries,
  streakStatsInMatches,
  topOpponentStats,
} from "../../../utils/analysis";
import { analysisMatchLogTable } from "../analysisHelpers";

export default function RollingDetailModal({
  expandedRolling, setExpandedRolling,
  data, totalW, T, isPC, t, lang,
  analysisModalBackdrop, analysisModalPanel,
}) {
  useEscapeKey(() => setExpandedRolling(null), expandedRolling !== null);
  if (expandedRolling === null) return null;

  const n = expandedRolling;
  const recentMs = data.matches.slice(-n);
  const rW = recentMs.filter((m) => m.result === "win").length;
  const rR = recentMs.length > 0 ? rW / recentMs.length : 0;
  const overallR = data.matches.length ? totalW / data.matches.length : 0;
  const diffPt = Math.round((rR - overallR) * 100);
  const dateFirst = recentMs[0]?.date;
  const dateLast = recentMs[recentMs.length - 1]?.date;
  const graphPoints = computeRollingGraphSeries(data.matches, n);
  const showGraph = graphPoints.length >= 2;
  const streak = streakStatsInMatches(recentMs);
  const topOpp = topOpponentStats(recentMs, 6);

  const leftPad = 46;
  const rightPad = 20;
  const topPad = 32;
  const botPad = 56;
  const vbW = 720;
  const plotH = 220;
  const vbH = topPad + plotH + botPad;
  const xAt = (i, len) => leftPad + (len <= 1 ? 0 : (i / (len - 1)) * (vbW - leftPad - rightPad));
  const yAt = (rate) => topPad + plotH * (1 - rate);
  const labelStep = Math.max(1, Math.ceil(graphPoints.length / 7));

  let areaD = `M ${xAt(0, graphPoints.length)} ${topPad + plotH}`;
  graphPoints.forEach((p, i) => { areaD += ` L ${xAt(i, graphPoints.length)} ${yAt(p.rate)}`; });
  areaD += ` L ${xAt(graphPoints.length - 1, graphPoints.length)} ${topPad + plotH} Z`;

  const closeFs = { border: "none", background: T.inp, borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, fontSize: 20, fontWeight: 700, flexShrink: 0 };

  return (
    <div role="presentation" style={analysisModalBackdrop} onClick={() => setExpandedRolling(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-fs-rolling-title"
        style={analysisModalPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ flexShrink: 0, padding: "14px 18px", borderBottom: `1px solid ${T.brd}`, display: "flex", alignItems: "center", gap: 12, background: T.card }}>
          <button type="button" aria-label={t("common.close")} onClick={() => setExpandedRolling(null)} style={closeFs}>{"\u00D7"}</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div id="analysis-fs-rolling-title" style={{ fontSize: isPC ? 18 : 16, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>{t("battle.recentLabel")} {n}{t("analysis.battles")}</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 4, lineHeight: 1.45 }}>{t("analysis.rollingDetailSubtitle", { n })}</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: isPC ? "18px 20px 24px" : "14px 14px 20px", background: T.bg }}>
          <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(4, 1fr)" : "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.winRate")}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: barColor(rR), fontFamily: "'Chakra Petch', sans-serif", marginTop: 4 }}>{percentStr(rW, recentMs.length)}</div>
            </div>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.winLoss")}</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>
                <span style={{ color: T.win }}>{rW}</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: T.lose }}>{recentMs.length - rW}</span>
              </div>
            </div>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.vsOverallWr")}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: diffPt >= 0 ? T.win : T.lose, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>
                {diffPt >= 0 ? "+" : ""}{diffPt}pt
              </div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{t("analysis.career")} {percentStr(totalW, data.matches.length)}</div>
            </div>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.periodRange")}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginTop: 6, lineHeight: 1.35 }}>
                {dateFirst && dateLast ? `${formatDate(dateFirst)} \u2192 ${formatDate(dateLast)}` : "\u2014"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isPC ? "minmax(0,1fr) minmax(0,1.4fr)" : "1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 16px", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, marginBottom: 6 }}>{t("analysis.streakInWindow")}</div>
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.55 }}>
                <div><span style={{ color: T.win, fontWeight: 800 }}>{t("analysis.streakMaxWin", { n: streak.maxWin })}</span></div>
                <div><span style={{ color: T.lose, fontWeight: 800 }}>{t("analysis.streakMaxLose", { n: streak.maxLose })}</span></div>
              </div>
            </div>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 16px", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, marginBottom: 8 }}>{t("analysis.topOpponents")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 10 }}>
                {topOpp.length === 0 ? <span style={{ fontSize: 13, color: T.dim }}>{"\u2014"}</span> : topOpp.map((o) => (
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
          </div>

          {showGraph && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("analysis.winRateTransition")}</div>
              <div style={{ fontSize: 11, color: T.dim, marginBottom: 10 }}>{t("analysis.rollingGraphCaption", { n })}</div>
              <div style={{ background: T.inp, borderRadius: 16, padding: "12px 8px 8px", width: "100%", maxWidth: "100%", margin: "0 auto", border: `1px solid ${T.brd}` }}>
                <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: "100%", height: "auto", display: "block", minHeight: 260 }}>
                  {[0, 0.25, 0.5, 0.75, 1].map((lev) => (
                    <line key={lev} x1={leftPad} y1={yAt(lev)} x2={vbW - rightPad} y2={yAt(lev)} stroke={T.brd} strokeWidth="1" opacity={0.85} />
                  ))}
                  <line x1={leftPad} y1={yAt(0.5)} x2={vbW - rightPad} y2={yAt(0.5)} stroke={T.dimmer} strokeWidth="1.5" strokeDasharray="8 6" />
                  <text x={leftPad - 6} y={yAt(1) + 4} fill={T.dim} fontSize="11" textAnchor="end">100%</text>
                  <text x={leftPad - 6} y={yAt(0.75) + 4} fill={T.dim} fontSize="11" textAnchor="end">75%</text>
                  <text x={leftPad - 6} y={yAt(0.5) + 4} fill={T.dim} fontSize="11" textAnchor="end">50%</text>
                  <text x={leftPad - 6} y={yAt(0.25) + 4} fill={T.dim} fontSize="11" textAnchor="end">25%</text>
                  <text x={leftPad - 6} y={yAt(0) + 4} fill={T.dim} fontSize="11" textAnchor="end">0%</text>
                  <path d={areaD} fill={T.accent} fillOpacity="0.14" />
                  <polyline fill="none" stroke={T.accent} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" points={graphPoints.map((p, i) => `${xAt(i, graphPoints.length)},${yAt(p.rate)}`).join(" ")} />
                  {graphPoints.map((p, i) => {
                    const showLab = i % labelStep === 0 || i === graphPoints.length - 1;
                    const cx = xAt(i, graphPoints.length);
                    const cy = yAt(p.rate);
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r={5} fill={barColor(p.rate)} stroke={T.card} strokeWidth="1.5" />
                        {showLab && (
                          <>
                            <text x={cx} y={cy - 12} fill={T.text} fontSize="11" textAnchor="middle" fontWeight="800">{Math.round(p.rate * 100)}%</text>
                            <text x={cx} y={vbH - 12} fill={T.dim} fontSize="10" textAnchor="middle">#{p.end}</text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 800, color: T.sub, marginBottom: 10, letterSpacing: "0.02em" }}>{t("analysis.matchHistory")}</div>
          {analysisMatchLogTable({ matchesRev: recentMs.slice().reverse(), T, isPC, lang, t })}
        </div>
      </div>
    </div>
  );
}
