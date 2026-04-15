import { Share2 } from "lucide-react";
import FighterIcon from "../../shared/FighterIcon";
import ResultBadge from "../../shared/ResultBadge";
import MatchupNotesEditor from "../../shared/MatchupNotesEditor";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { fighterName } from "../../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../../constants/stages";
import { formatDate, formatTime, percentStr, barColor } from "../../../utils/format";
import { Z_MATCHUP_OVERLAY } from "../../../constants/zIndex";

const stageGridFluid = "repeat(auto-fill, minmax(76px, 1fr))";

export default function MatchupPopupModal({
  matchupPopup, setMatchupPopup,
  data, onSave,
  editingStageIdx, setEditingStageIdx, updateMatchStage,
  doShare,
  T, isPC, t, lang,
}) {
  useEscapeKey(() => setMatchupPopup(null), !!matchupPopup);
  if (!matchupPopup) return null;

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
                      <div key={`${m.date}-${m.time}-${i}`} style={{ padding: "5px 0", borderBottom: `1px solid ${T.inp}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: T.dim, flexShrink: 0, minWidth: isPC ? 68 : 56 }}>{formatDate(m.date)}</span>
                          <ResultBadge result={m.result} size="chip" T={T} style={{ width: 30, fontSize: 10 }} />
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
}
