import { useState } from "react";
import FighterIcon from "../shared/FighterIcon";
import MatchupNotesEditor from "../shared/MatchupNotesEditor";
import { fighterName, FIGHTERS } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { percentStr, barColor } from "../../utils/format";
import { useI18n } from "../../i18n/index.jsx";
import { sortCharStatsRows } from "../../utils/analysis";
import { cardStyle, matchupCell, charSortToolbar } from "./analysisHelpers";
import DailyCalendar from "./DailyCalendar";

export default function OppCharMode({
  data, onSave, T, isPC,
  oppDetail, setOppDetail,
  oCS, oppMyChars, matchesWithIdx,
  analysisPrefs, setAnalysisPrefs,
  setMatchupPopup, setOppSubTab: setOppSubTabExternal,
  setExpandedItem, setDateDetailModal, dateDetailModal,
  setMatchLogModal,
  editingStageIdx, setEditingStageIdx,
  setConfirmAction, updateMatchStage, doShare,
  dailyMonth, setDailyMonth,
  oppSubTab: oppSubTabExternal, setOppSubTabProp,
}) {
  const { t, lang } = useI18n();
  const cd = cardStyle(T);
  const stageGridFluid = "repeat(auto-fill, minmax(76px, 1fr))";

  // Use external oppSubTab state passed from parent
  const oppSubTab = oppSubTabExternal;
  const setOppSubTab = setOppSubTabProp;

  const cellProps = { setOppDetail, setOppSubTab: setOppSubTabExternal, setExpandedItem, setDateDetailModal, setMatchupPopup, T, isPC, lang };

  // Grid view (no oppDetail)
  if (!oppDetail) {
    if (oCS.length === 0) {
      return <div style={{ ...cd, textAlign: "center", padding: 20, color: T.dim, fontSize: 13 }}>{t("analysis.noCharData")}</div>;
    }
    const allOpps = FIGHTERS.map((c) => {
      const found = oCS.find((s) => s.c === c);
      return found || { c, w: 0, l: 0, t: 0 };
    });
    const sortedOpps = sortCharStatsRows(allOpps, analysisPrefs.topOppSort, analysisPrefs.topOppHide);
    return (
      <div>
        {charSortToolbar({ sortKey: "topOppSort", hideKey: "topOppHide", analysisPrefs, setAnalysisPrefs, T, isPC, t })}
        <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(6, 1fr)" : "repeat(4, 1fr)", gap: isPC ? 8 : 6 }}>
          {sortedOpps.map((s) => matchupCell({ s, parentChar: null, popupOverride: { myChar: null, oppChar: s.c, isOppMode: true }, ...cellProps }))}
        </div>
      </div>
    );
  }

  // Detail view
  const oppMatches = data.matches.filter((m) => m.oppChar === oppDetail);
  const oppW = oppMatches.filter((m) => m.result === "win").length;
  const oppL = oppMatches.length - oppW;

  return (
    <div>
      {/* Header */}
      <div style={{ ...cd, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
        <button onClick={() => { setOppDetail(null); setExpandedItem(null); setDateDetailModal(null); }} style={{ border: "none", background: T.inp, borderRadius: 10, padding: "8px 14px", color: T.sub, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
          {t("analysis.backToList")}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FighterIcon name={oppDetail} size={36} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{fighterName(oppDetail, lang)}</div>
            {oppMatches.length > 0 && <div style={{ fontSize: 12, color: T.dim }}>{oppMatches.length}{t("analysis.battles")} {oppW}W {oppL}L ({percentStr(oppW, oppMatches.length)})</div>}
          </div>
        </div>
      </div>

      {/* Matchup Notes */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t("matchupNotes.title")}</div>
        </div>
        <MatchupNotesEditor
          key={oppDetail}
          noteKey={oppDetail}
          data={data} onSave={onSave} T={T}
        />
      </div>

      {oppMatches.length > 0 && (
        <>
          {/* Sub-tabs: myChars / history / stages */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[["myChars", t("analysis.myCharUsed")], ["history", t("analysis.matchHistory")], ["stages", t("stages.winRateByStage")]].map(([k, l]) => (
              <button key={k} onClick={() => { setOppSubTab(k); setExpandedItem(null); setDateDetailModal(null); }} style={{
                flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 12,
                fontWeight: oppSubTab === k ? 700 : 500, textAlign: "center",
                background: oppSubTab === k ? T.accentGrad : T.inp, color: oppSubTab === k ? "#fff" : T.sub, transition: "all .15s ease",
              }}>{l}</button>
            ))}
          </div>

          {/* My chars used against this opponent */}
          {oppSubTab === "myChars" && (() => {
            const sortedOmc = sortCharStatsRows(oppMyChars, analysisPrefs.oppMySort, analysisPrefs.oppMyHide);
            return (
              <div>
                {charSortToolbar({ sortKey: "oppMySort", hideKey: "oppMyHide", analysisPrefs, setAnalysisPrefs, T, isPC, t })}
                <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(6, 1fr)" : "repeat(4, 1fr)", gap: isPC ? 8 : 6 }}>
                  {sortedOmc.map((s) => matchupCell({ s, parentChar: null, popupOverride: { myChar: s.c, oppChar: oppDetail }, ...cellProps }))}
                </div>
              </div>
            );
          })()}

          {/* Match history */}
          {oppSubTab === "history" && (
            <div>
              <button
                type="button"
                onClick={() => setMatchLogModal({
                  title: `${fighterName(oppDetail, lang)} \u2014 ${t("analysis.openMatchLog")}`,
                  matches: matchesWithIdx.filter((m) => m.oppChar === oppDetail),
                })}
                style={{
                  width: "100%", marginBottom: 12, padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.accentBorder}`,
                  background: T.accentSoft, color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t("analysis.openMatchLog")}
              </button>
              <DailyCalendar
                data={data} filterFn={(m) => m.oppChar === oppDetail} scope={{ type: "oppChar", c: oppDetail }}
                dailyMonth={dailyMonth} setDailyMonth={setDailyMonth}
                dateDetailModal={dateDetailModal} setDateDetailModal={setDateDetailModal}
                editingStageIdx={editingStageIdx} setEditingStageIdx={setEditingStageIdx}
                setConfirmAction={setConfirmAction} updateMatchStage={updateMatchStage}
                doShare={doShare} T={T} isPC={isPC} lang={lang} t={t}
              />
            </div>
          )}

          {/* Stage win rate */}
          {oppSubTab === "stages" && (() => {
            const stageMatches = oppMatches.filter((m) => m.stage);
            return (
              <div>
                {stageMatches.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: T.dim, fontSize: 13 }}>{t("stages.noData")}</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: stageGridFluid, gap: 8 }}>
                    {STAGES.map((stage) => {
                      const ms = stageMatches.filter((m) => m.stage === stage.id);
                      const w = ms.filter((m) => m.result === "win").length;
                      const l = ms.length - w;
                      const r = ms.length > 0 ? w / ms.length : 0;
                      return (
                        <div key={stage.id} style={{ textAlign: "center", opacity: ms.length === 0 ? 0.35 : 1 }}>
                          <img src={stageImg(stage.id)} alt={stage.jp} style={{ width: "100%", height: 40, objectFit: "cover", borderRadius: 6 }} />
                          <div style={{ fontSize: 10, fontWeight: 600, color: T.text, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stageName(stage.id, lang)}</div>
                          {ms.length > 0 ? (
                            <>
                              <div style={{ fontSize: 14, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>{Math.round(r * 100)}%</div>
                              <div style={{ fontSize: 9, color: T.dim }}>{w}W {l}L</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>—</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
