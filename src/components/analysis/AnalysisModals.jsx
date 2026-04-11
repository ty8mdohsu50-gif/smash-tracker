import { Share2 } from "lucide-react";
import FighterIcon from "../shared/FighterIcon";
import MatchupNotesEditor from "../shared/MatchupNotesEditor";
import MatchLogModal from "../shared/MatchLogModal";
import SharePopup from "../shared/SharePopup";
import ConfirmDialog from "../shared/ConfirmDialog";
import { fighterName } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import {
  formatDate,
  formatTime,
  percentStr,
  barColor,
} from "../../utils/format";
import { Z_MATCHUP_OVERLAY } from "../../constants/zIndex";
import { useI18n } from "../../i18n/index.jsx";
import {
  computeRollingGraphSeries,
  streakStatsInMatches,
  topOpponentStats,
  analysisModalShellStyles,
} from "../../utils/analysis";
import { analysisMatchLogTable } from "./analysisHelpers";

export default function AnalysisModals({
  data, onSave, T, isPC,
  totalW, hourlyStats, matchesWithIdx,
  expandedRolling, setExpandedRolling,
  hourDetailModal, setHourDetailModal,
  stageDetailId, setStageDetailId,
  matchupPopup, setMatchupPopup,
  matchLogModal, setMatchLogModal,
  sharePopup, setSharePopup,
  confirmAction, setConfirmAction,
  deleteMatch,
  editingStageIdx, setEditingStageIdx,
  updateMatchStage,
  doShare,
  formatHourFn,
}) {
  const { t, lang } = useI18n();
  const analysisShell = analysisModalShellStyles(isPC, T);
  const analysisModalBackdrop = analysisShell.backdrop;
  const analysisModalPanel = analysisShell.panel;
  const stageGridFluid = "repeat(auto-fill, minmax(76px, 1fr))";

  return (
    <>
      {/* Rolling detail modal */}
      {expandedRolling !== null && (() => {
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
      })()}

      {/* Hour detail modal */}
      {hourDetailModal !== null && hourlyStats[hourDetailModal] && (() => {
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
                <div style={{ background: "#FF9F0A22", border: "1px solid #FF9F0A55", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: T.text, marginBottom: 14, lineHeight: 1.5 }}>{t("analysis.lowSample")}</div>
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
      })()}

      {/* Stage detail modal */}
      {stageDetailId && (() => {
        const ms = data.matches.filter((m) => m.stage === stageDetailId);
        if (ms.length === 0) return null;
        const w = ms.filter((m) => m.result === "win").length;
        const l = ms.length - w;
        const rS = w / ms.length;
        const careerR = data.matches.length ? totalW / data.matches.length : 0;
        const diffPt = Math.round((rS - careerR) * 100);
        const staged = data.matches.filter((m) => m.stage);
        const stagedW = staged.filter((m) => m.result === "win").length;
        const rStaged = staged.length ? stagedW / staged.length : 0;
        const diffStaged = Math.round((rS - rStaged) * 100);
        const stageMsIdx = matchesWithIdx.filter((m) => m.stage === stageDetailId).slice().reverse();
        const topO = topOpponentStats(ms, 6);
        const stMeta = STAGES.find((s) => s.id === stageDetailId);
        const closeFs = { border: "none", background: T.inp, borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, fontSize: 20, fontWeight: 700, flexShrink: 0 };

        return (
          <div role="presentation" style={analysisModalBackdrop} onClick={() => setStageDetailId(null)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="analysis-fs-stage-title"
              style={analysisModalPanel}
              onClick={(e) => e.stopPropagation()}
            >
            <div style={{ flexShrink: 0, padding: "14px 18px", borderBottom: `1px solid ${T.brd}`, display: "flex", alignItems: "center", gap: 12, background: T.card }}>
              <button type="button" aria-label={t("common.close")} onClick={() => setStageDetailId(null)} style={closeFs}>{"\u00D7"}</button>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                {stMeta && <img src={stageImg(stageDetailId)} alt={stageName(stageDetailId, lang)} style={{ width: isPC ? 80 : 64, height: isPC ? 44 : 36, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: `1px solid ${T.brd}` }} />}
                <div style={{ minWidth: 0 }}>
                  <div id="analysis-fs-stage-title" style={{ fontSize: isPC ? 18 : 16, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", lineHeight: 1.25 }}>{stageName(stageDetailId, lang)}</div>
                  <div style={{ fontSize: 12, color: T.dim, marginTop: 4, lineHeight: 1.45 }}>{t("analysis.stageDetailSubtitle")}</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: isPC ? "18px 20px 24px" : "14px 14px 20px", background: T.bg }}>
              <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(3, 1fr)" : "1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
                  <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.winRate")}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: barColor(rS), fontFamily: "'Chakra Petch', sans-serif", marginTop: 4 }}>{percentStr(w, ms.length)}</div>
                </div>
                <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
                  <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.winLoss")}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>
                    <span style={{ color: T.win }}>{w}</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: T.lose }}>{l}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 4 }}>{ms.length}{t("common.matches")}</div>
                </div>
                <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
                  <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.vsCareerWr")}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: diffPt >= 0 ? T.win : T.lose, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>{diffPt >= 0 ? "+" : ""}{diffPt}pt</div>
                  <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{t("analysis.vsStagedOnly")} {diffStaged >= 0 ? "+" : ""}{diffStaged}pt</div>
                </div>
              </div>

              <div style={{ background: T.inp, borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: `1px solid ${T.brd}` }}>
                <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, marginBottom: 8 }}>{t("analysis.topOpponents")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 10 }}>
                  {topO.map((o) => (
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
              {analysisMatchLogTable({ matchesRev: stageMsIdx, T, isPC, lang, t })}
            </div>
            </div>
          </div>
        );
      })()}

      {/* Matchup popup */}
      {matchupPopup && (() => {
        const { myChar, oppChar } = matchupPopup;
        const ms = data.matches.map((m, idx) => ({ ...m, idx })).filter((m) => m.myChar === myChar && m.oppChar === oppChar);
        const w = ms.filter((m) => m.result === "win").length;
        const l = ms.length - w;
        const r = ms.length > 0 ? w / ms.length : 0;

        const stageMs = ms.filter((m) => m.stage);
        const stageData = {};
        stageMs.forEach((m) => {
          if (!stageData[m.stage]) stageData[m.stage] = { w: 0, l: 0 };
          m.result === "win" ? stageData[m.stage].w++ : stageData[m.stage].l++;
        });

        const recent10 = ms.slice().reverse().slice(0, 10);
        const recentR = recent10.length > 0 ? recent10.filter((m) => m.result === "win").length / recent10.length : 0;

        const popupStyle = isPC
          ? { background: T.card, borderRadius: 20, border: `1px solid ${T.brd}`, boxShadow: T.sh, width: 560, maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }
          : { background: T.bg, width: "100%", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" };
        const headerPad = isPC ? "20px 24px" : "16px 18px";
        const contentPad = isPC ? "20px 24px" : "16px 18px";
        const iconSz = isPC ? 36 : 28;
        const titleSz = isPC ? 16 : 14;
        const statFontSz = isPC ? 28 : 22;
        const statPad = isPC ? "14px 16px" : "10px 12px";

        return (
          <div onClick={() => setMatchupPopup(null)} style={{ position: "fixed", inset: 0, background: isPC ? "rgba(0,0,0,.55)" : "rgba(0,0,0,.3)", zIndex: Z_MATCHUP_OVERLAY, display: "flex", alignItems: isPC ? "center" : "flex-end", justifyContent: "center", animation: "fadeUp .15s ease" }}>
            <div role="dialog" aria-modal="true" aria-labelledby="analysis-matchup-popup-title" onClick={(e) => e.stopPropagation()} style={popupStyle}>
              {/* Header */}
              <div style={{ padding: headerPad, borderBottom: `1px solid ${T.inp}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: isPC ? "transparent" : T.card }}>
                <div style={{ display: "flex", alignItems: "center", gap: isPC ? 12 : 8, flex: 1, minWidth: 0 }}>
                  <FighterIcon name={myChar} size={iconSz} />
                  <span style={{ fontSize: 12, color: T.dim, fontWeight: 700 }}>vs</span>
                  <FighterIcon name={oppChar} size={iconSz} />
                  <div style={{ minWidth: 0 }}>
                    <div id="analysis-matchup-popup-title" style={{ fontSize: titleSz, fontWeight: 800, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fighterName(myChar, lang)} vs {fighterName(oppChar, lang)}</div>
                    <div style={{ fontSize: 11, color: T.dim }}>{ms.length}{t("analysis.battles")}</div>
                  </div>
                </div>
                <button type="button" aria-label={t("analysis.share")} onClick={() => {
                  const sLines = [`\u3010SMASH TRACKER\u3011${t("share.matchupShare")}`, `${fighterName(myChar, lang)} vs ${fighterName(oppChar, lang)}`, `${w}W ${l}L\uFF08${t("analysis.winRate")} ${percentStr(w, ms.length)}\uFF09`];
                  const stageEntries = STAGES.filter((st) => stageData[st.id]).map((st) => { const sd = stageData[st.id]; return `${stageName(st.id, lang)} ${sd.w}W${sd.l}L`; });
                  if (stageEntries.length > 0) sLines.push(stageEntries.join(" / "));
                  sLines.push("", "#\u30B9\u30DE\u30D6\u30E9 #SmashTracker", "https://smash-tracker.pages.dev/");
                  doShare(sLines.join("\n"));
                }} style={{ border: "none", background: T.inp, borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, flexShrink: 0 }}><Share2 size={14} /></button>
                <button type="button" aria-label={t("common.close")} onClick={() => setMatchupPopup(null)} style={{ border: "none", background: T.inp, borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, fontSize: 18, flexShrink: 0, marginLeft: 6 }}>{"\u00D7"}</button>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: contentPad, WebkitOverflowScrolling: "touch" }}>
                {ms.length === 0 ? (
                  <div style={{ textAlign: "center", color: T.dim, padding: "40px 0", fontSize: 14 }}>{t("stages.noData")}</div>
                ) : (
                  <>
                    {/* Overall stats */}
                    <div style={{ display: "flex", gap: isPC ? 12 : 8, marginBottom: 16 }}>
                      <div style={{ flex: 1, background: T.inp, borderRadius: 12, padding: statPad, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("analysis.winRate")}</div>
                        <div style={{ fontSize: statFontSz, fontWeight: 900, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(w, ms.length)}</div>
                      </div>
                      <div style={{ flex: 1, background: T.inp, borderRadius: 12, padding: statPad, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("analysis.winLoss")}</div>
                        <div style={{ fontSize: statFontSz - 4, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif" }}>
                          <span style={{ color: T.win }}>{w}</span>
                          <span style={{ color: T.dimmer, fontSize: 14, margin: "0 4px" }}>:</span>
                          <span style={{ color: T.lose }}>{l}</span>
                        </div>
                      </div>
                      {recent10.length >= 3 && (
                        <div style={{ flex: 1, background: T.inp, borderRadius: 12, padding: statPad, textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("battle.recentLabel")} {recent10.length}</div>
                          <div style={{ fontSize: statFontSz, fontWeight: 900, color: barColor(recentR), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(recent10.filter((m) => m.result === "win").length, recent10.length)}</div>
                        </div>
                      )}
                    </div>

                    {/* Win rate bar */}
                    <div style={{ height: 8, borderRadius: 4, background: T.inp, overflow: "hidden", marginBottom: 20 }}>
                      <div style={{ height: "100%", width: `${r * 100}%`, background: barColor(r), borderRadius: 4 }} />
                    </div>

                    {/* Matchup Notes */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("matchupNotes.title")}</div>
                      <MatchupNotesEditor noteKey={data.matchupNotes?.[`${myChar}|${oppChar}`] ? `${myChar}|${oppChar}` : oppChar} data={data} onSave={onSave} T={T} compact />
                    </div>

                    {/* Stage win rates */}
                    {Object.keys(stageData).length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("stages.winRateByStage")}</div>
                        <div style={{ display: "grid", gridTemplateColumns: stageGridFluid, gap: 8 }}>
                          {STAGES.filter((st) => stageData[st.id]).map((st) => {
                            const sd = stageData[st.id];
                            const sr = sd.w / (sd.w + sd.l);
                            return (
                              <div key={st.id} style={{ textAlign: "center" }}>
                                <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 36, objectFit: "cover", borderRadius: 4 }} />
                                <div style={{ fontSize: 9, fontWeight: 600, color: T.text, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stageName(st.id, lang)}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: barColor(sr), fontFamily: "'Chakra Petch', sans-serif" }}>{Math.round(sr * 100)}%</div>
                                <div style={{ fontSize: 9, color: T.dim }}>{sd.w}W {sd.l}L</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Match history */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("analysis.matchHistory")}</div>
                      <div style={{ maxHeight: isPC ? 240 : 200, overflowY: "auto" }}>
                        {ms.slice().reverse().slice(0, 30).map((m, i) => {
                          const isEditing = editingStageIdx === m.idx;
                          return (
                            <div key={i} style={{ padding: "5px 0", borderBottom: `1px solid ${T.inp}` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, color: T.dim, flexShrink: 0, minWidth: isPC ? 68 : 56 }}>{formatDate(m.date)}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: m.result === "win" ? T.winBg : T.loseBg, color: m.result === "win" ? T.win : T.lose, flexShrink: 0 }}>
                                  {m.result === "win" ? "WIN" : "LOSE"}
                                </span>
                                {m.stage && !isEditing && <span style={{ fontSize: 9, color: T.dim, background: T.inp, padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>{stageName(m.stage, lang)}</span>}
                                {m.time && <span style={{ fontSize: 10, color: T.dim, marginLeft: "auto" }}>{formatTime(m.time)}</span>}
                                <button onClick={(e) => { e.stopPropagation(); setEditingStageIdx(isEditing ? null : m.idx); }}
                                  style={{ border: "none", background: T.inp, color: T.sub, fontSize: 9, padding: "2px 5px", borderRadius: 4, cursor: "pointer", flexShrink: 0 }}>{isEditing ? "\u2713" : "\uD83D\uDDFA"}</button>
                              </div>
                              {isEditing && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 4, marginBottom: 2 }}>
                                  {STAGES.map((st) => (
                                    <div key={st.id} onClick={(e) => { e.stopPropagation(); updateMatchStage(m.idx, m.stage === st.id ? null : st.id); }}
                                      style={{ textAlign: "center", cursor: "pointer", borderRadius: 6, border: m.stage === st.id ? `2px solid ${T.accent}` : `1px solid ${T.brd}`, padding: 2, opacity: m.stage === st.id ? 1 : 0.6 }}>
                                      <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 24, objectFit: "cover", borderRadius: 4 }} />
                                      <div style={{ fontSize: 8, color: T.text, marginTop: 1 }}>{stageName(st.id, lang)}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {matchLogModal && (
        <MatchLogModal
          open
          onClose={() => setMatchLogModal(null)}
          title={matchLogModal.title}
          matches={matchLogModal.matches}
          T={T}
          t={t}
          lang={lang}
          isPC={isPC}
        />
      )}
      {sharePopup && <SharePopup text={sharePopup.text} imageBlob={sharePopup.imageBlob} onClose={() => setSharePopup(null)} T={T} />}
      {confirmAction && (
        <ConfirmDialog
          message={t("common.deleteConfirm")}
          confirmLabel={t("history.delete")}
          cancelLabel={t("settings.cancel")}
          onConfirm={() => { deleteMatch(confirmAction.idx); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
          T={T}
        />
      )}
    </>
  );
}
