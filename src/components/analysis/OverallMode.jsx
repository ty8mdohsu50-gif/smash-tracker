import { Share2 } from "lucide-react";
import { fighterName } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { percentStr, barColor, formatHour } from "../../utils/format";
import { useI18n } from "../../i18n/index.jsx";
import { cardStyle } from "./analysisHelpers";
import DailyCalendar from "./DailyCalendar";

export default function OverallMode({
  data, T, isPC,
  totalW, totalL, rolling, hourlyStats,
  matchesWithIdx,
  setExpandedRolling, setHourDetailModal, hourDetailModal,
  setStageDetailId,
  setMatchLogModal,
  doShare,
  dateDetailModal, setDateDetailModal,
  editingStageIdx, setEditingStageIdx,
  setConfirmAction, updateMatchStage,
  dailyMonth, setDailyMonth,
}) {
  const { t, lang } = useI18n();
  const cd = cardStyle(T);
  const stageGridFluid = "repeat(auto-fill, minmax(76px, 1fr))";
  const hourlyGridFluid = "repeat(auto-fill, minmax(62px, 1fr))";

  return (
    <div style={isPC ? { display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0 } : undefined}>
      <button
        type="button"
        onClick={() => setMatchLogModal({ title: t("analysis.matchLogTitleOverall"), matches: matchesWithIdx })}
        style={{
          width: "100%", marginBottom: isPC ? 6 : 10, padding: isPC ? "8px 12px" : "10px 14px", borderRadius: 12, border: `1px solid ${T.accentBorder}`,
          background: T.accentSoft, color: T.accent, fontSize: isPC ? 12 : 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        {t("analysis.openMatchLog")}
      </button>
      {/* Summary + Share */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isPC ? 6 : 8, flexShrink: 0 }}>
        <span style={{ fontSize: isPC ? 12 : 13, fontWeight: 700, color: T.sub }}>{t("share.overallStats")}</span>
        <button onClick={() => {
          const tw = data.matches.filter((m) => m.result === "win").length;
          const tl = data.matches.length - tw;
          const topChars = {};
          data.matches.forEach((m) => { topChars[m.myChar] = (topChars[m.myChar] || 0) + 1; });
          const charRank = Object.entries(topChars).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${fighterName(c, lang)} \u00D7${n}`).join(", ");
          const sLines = [`\u3010SMASH TRACKER\u3011${t("share.overallStats")}`, `${data.matches.length}${t("analysis.battles")} ${tw}W ${tl}L\uFF08${t("analysis.winRate")} ${percentStr(tw, data.matches.length)}\uFF09`];
          if (charRank) sLines.push(charRank);
          sLines.push("", "#\u30B9\u30DE\u30D6\u30E9 #SmashTracker", "https://smash-tracker.pages.dev/");
          doShare(sLines.join("\n"));
        }} style={{ border: "none", background: T.inp, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}><Share2 size={12} /> {t("analysis.share")}</button>
      </div>
      {isPC ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr)", gap: 8, marginBottom: 10, flexShrink: 0 }}>
            <div style={{ ...cd, display: "flex", padding: "8px 10px", marginBottom: 0, textAlign: "center", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.totalMatches")}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginTop: 2 }}>{data.matches.length}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.winRate")}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginTop: 2 }}>{percentStr(totalW, data.matches.length)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.winLoss")}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                  <span style={{ color: T.win }}>{totalW}</span>
                  <span style={{ color: T.dimmer }}> : </span>
                  <span style={{ color: T.lose }}>{totalL}</span>
                </div>
              </div>
            </div>
            {[20, 50].filter((n) => n !== 50 || data.matches.length > 20).map((n) => {
              const d = rolling[n];
              const r = d.t ? d.w / d.t : 0;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setExpandedRolling(n)}
                  style={{
                    ...cd, marginBottom: 0, padding: "8px 8px", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center",
                    border: `1px solid ${T.brd}`, fontFamily: "inherit", color: T.text,
                  }}
                >
                  <div style={{ fontSize: 9, color: T.dim, fontWeight: 600 }}>{t("battle.recentLabel")} {d.t}{t("analysis.battles")}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: d.t ? barColor(r) : T.dim, marginTop: 2 }}>{d.t ? percentStr(d.w, d.t) : "\u2014"}</div>
                  {d.t > 0 && <div style={{ fontSize: 9, color: T.dim, marginTop: 2 }}>{d.w}W {d.t - d.w}L</div>}
                </button>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 12, alignItems: "stretch", flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0, minHeight: 0, overflow: "auto" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 3 }}>{t("stages.winRateByStage")}</div>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>{t("analysis.tapForDetail")}</div>
                <div style={{ ...cd, padding: "10px 10px", marginBottom: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {STAGES.map((stage) => {
                      const ms = data.matches.filter((m) => m.stage === stage.id);
                      const w = ms.filter((m) => m.result === "win").length;
                      const l = ms.length - w;
                      const has = ms.length > 0;
                      const rr = has ? w / ms.length : 0;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={has ? () => setStageDetailId(stage.id) : undefined}
                          disabled={!has}
                          aria-disabled={!has}
                          style={{
                            textAlign: "center", border: "none", padding: "4px 4px", borderRadius: 10, background: "transparent",
                            cursor: has ? "pointer" : "default",
                            pointerEvents: has ? "auto" : "none",
                            fontFamily: "inherit", width: "100%", minWidth: 0, opacity: has ? 1 : 0.42,
                          }}
                        >
                          <img src={stageImg(stage.id)} alt="" style={{ width: "100%", height: 48, objectFit: "cover", borderRadius: 6 }} />
                          <div style={{ fontSize: 9, fontWeight: 600, color: T.text, marginTop: 4, lineHeight: 1.2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{stageName(stage.id, lang)}</div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: has ? barColor(rr) : T.dim, fontFamily: "'Chakra Petch', sans-serif", marginTop: 2 }}>{has ? `${Math.round(rr * 100)}%` : "\u2014"}</div>
                          <div style={{ fontSize: 8, color: T.dim }}>{has ? `${w}W ${l}L` : "\u2014"}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 3 }}>{t("analysis.timeOfDay")}</div>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>{t("analysis.tapForDetail")}</div>
                <div style={{ ...cd, padding: "8px 8px", marginBottom: 0 }}>
                  {Object.keys(hourlyStats).length === 0 ? (
                    <div style={{ textAlign: "center", color: T.dim, fontSize: 12, padding: 12 }}>{t("analysis.noData")}</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
                      {Array.from({ length: 24 }, (_, hr) => {
                        const d = hourlyStats[hr];
                        const has = d && (d.w + d.l) > 0;
                        const r = has ? d.w / (d.w + d.l) : 0;
                        const active = hourDetailModal === hr;
                        return (
                          <button
                            key={hr}
                            type="button"
                            onClick={() => has && setHourDetailModal(hr)}
                            style={{
                              textAlign: "center", padding: "4px 2px", borderRadius: 8, minWidth: 0,
                              background: !has ? T.inp : active ? T.accentSoft : T.inp,
                              cursor: has ? "pointer" : "default",
                              border: active && has ? `2px solid ${T.accentBorder}` : `1px solid ${T.brd}`,
                              fontFamily: "inherit", opacity: has ? 1 : 0.35,
                            }}
                          >
                            <div style={{ fontSize: 9, fontWeight: 700, color: active && has ? T.accent : T.text, lineHeight: 1.1 }}>{hr}{t("analysis.hour")}</div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: has ? barColor(r) : T.dim, marginTop: 2, lineHeight: 1 }}>{has ? percentStr(d.w, d.w + d.l) : "\u2014"}</div>
                            <div style={{ fontSize: 8, color: T.dim, marginTop: 1 }}>{has ? `${d.w + d.l}` : ""}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "auto" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6, flexShrink: 0 }}>{t("analysis.allDailyRecord")}</div>
              <DailyCalendar
                data={data} filterFn={() => true} scope={{ type: "overall" }} dailyOpts={{ pcOverallRightColumn: true }}
                dailyMonth={dailyMonth} setDailyMonth={setDailyMonth}
                dateDetailModal={dateDetailModal} setDateDetailModal={setDateDetailModal}
                editingStageIdx={editingStageIdx} setEditingStageIdx={setEditingStageIdx}
                setConfirmAction={setConfirmAction} updateMatchStage={updateMatchStage}
                doShare={doShare} T={T} isPC={isPC} lang={lang} t={t}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 8,
            marginBottom: 0,
          }}
          >
            <div style={{ ...cd, display: "flex", padding: "18px 12px", marginBottom: 12, textAlign: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.totalMatches")}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 2 }}>{data.matches.length}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.winRate")}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 2 }}>{percentStr(totalW, data.matches.length)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.winLoss")}</div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>
                  <span style={{ color: T.win }}>{totalW}</span>
                  <span style={{ color: T.dimmer }}> : </span>
                  <span style={{ color: T.lose }}>{totalL}</span>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 6 }}>{t("analysis.recentWinRate")}</div>
              <div style={{ display: "flex", gap: 8, flexDirection: "row" }}>
                {[20, 50].filter((n) => n !== 50 || data.matches.length > 20).map((n) => {
                  const d = rolling[n];
                  const r = d.t ? d.w / d.t : 0;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setExpandedRolling(n)}
                      style={{
                        ...cd, flex: 1, marginBottom: 0, padding: "14px 16px", textAlign: "center", cursor: "pointer",
                        border: `1px solid ${T.brd}`, fontFamily: "inherit", color: T.text,
                      }}
                    >
                      <div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("battle.recentLabel")} {d.t}{t("analysis.battles")}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: d.t ? barColor(r) : T.dim, marginTop: 2 }}>{d.t ? percentStr(d.w, d.t) : "\u2014"}</div>
                      {d.t > 0 && <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{d.w}W {d.t - d.w}L</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 2 }}>{t("analysis.timeOfDay")}</div>
            <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>{t("analysis.tapForDetail")}</div>
            <div style={{ ...cd, padding: "14px 12px", marginBottom: 12 }}>
              {Object.keys(hourlyStats).length === 0 ? (
                <div style={{ textAlign: "center", color: T.dim, fontSize: 12, padding: 12 }}>{t("analysis.noData")}</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: hourlyGridFluid, gap: 6 }}>
                  {Object.entries(hourlyStats).sort((a, b) => Number(a[0]) - Number(b[0])).map(([hr, d]) => {
                    const r = d.w / (d.w + d.l);
                    const hrNum = Number(hr);
                    const active = hourDetailModal === hrNum;
                    return (
                      <button key={hr} type="button" onClick={() => setHourDetailModal(hrNum)} style={{
                        textAlign: "center", padding: "6px 4px", borderRadius: 10, minWidth: 0,
                        background: active ? T.accentSoft : T.inp, cursor: "pointer",
                        border: active ? `2px solid ${T.accentBorder}` : `1px solid ${T.brd}`,
                        fontFamily: "inherit",
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: active ? T.accent : T.text, lineHeight: 1.2 }}>{hr}{t("analysis.hour")}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: barColor(r), marginTop: 2, lineHeight: 1.1 }}>{percentStr(d.w, d.w + d.l)}</div>
                        <div style={{ fontSize: 9, color: T.dim, marginTop: 2 }}>{d.w + d.l}{t("analysis.battles")}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          {data.matches.some((m) => m.stage) && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 2 }}>{t("stages.winRateByStage")}</div>
              <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>{t("analysis.tapForDetail")}</div>
              <div style={{ ...cd, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: stageGridFluid, gap: 8 }}>
                  {STAGES.map((stage) => {
                    const ms = data.matches.filter((m) => m.stage === stage.id);
                    if (ms.length === 0) return null;
                    const w = ms.filter((m) => m.result === "win").length;
                    const l = ms.length - w;
                    const rr = w / ms.length;
                    return (
                      <button key={stage.id} type="button" onClick={() => setStageDetailId(stage.id)} style={{
                        textAlign: "center", border: "none", padding: "4px 2px", borderRadius: 10, background: "transparent",
                        cursor: "pointer", fontFamily: "inherit", width: "100%", minWidth: 0,
                      }}>
                        <img src={stageImg(stage.id)} alt="" style={{ width: "100%", aspectRatio: "16 / 9", height: "auto", maxHeight: 48, objectFit: "cover", borderRadius: 6 }} />
                        <div style={{ fontSize: 9, fontWeight: 600, color: T.text, marginTop: 4, lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{stageName(stage.id, lang)}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: barColor(rr), fontFamily: "'Chakra Petch', sans-serif", marginTop: 2 }}>{Math.round(rr * 100)}%</div>
                        <div style={{ fontSize: 8, color: T.dim }}>{w}W {l}L</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("analysis.allDailyRecord")}</div>
          <DailyCalendar
            data={data} filterFn={() => true} scope={{ type: "overall" }}
            dailyMonth={dailyMonth} setDailyMonth={setDailyMonth}
            dateDetailModal={dateDetailModal} setDateDetailModal={setDateDetailModal}
            editingStageIdx={editingStageIdx} setEditingStageIdx={setEditingStageIdx}
            setConfirmAction={setConfirmAction} updateMatchStage={updateMatchStage}
            doShare={doShare} T={T} isPC={isPC} lang={lang} t={t}
          />
        </>
      )}
    </div>
  );
}
