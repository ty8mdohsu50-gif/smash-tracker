import { useRef, useMemo } from "react";
import { Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { BattleNotes } from "../shared/MatchupNotesEditor";
import CharPicker from "../shared/CharPicker";
import FighterIcon from "../shared/FighterIcon";
import Chart from "../shared/Chart";
import { fighterName, shortName, FIGHTERS } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { useI18n } from "../../i18n/index.jsx";
import { today, formatDate, formatTime, percentStr, barColor } from "../../utils/format";

export default function OpponentDetail({
  data,
  onSave,
  selectedOpponent,
  setSelectedOpponent,
  myChar,
  setMyChar,
  oppChar,
  setOppChar,
  showMyPicker,
  setShowMyPicker,
  showOppPicker,
  setShowOppPicker,
  recMy,
  recOpp,
  freeMatches,
  postRecord,
  setPostRecord,
  lastResult,
  freeMemo,
  setFreeMemo,
  selectedStage,
  setSelectedStage,
  expandedMatchup,
  setExpandedMatchup,
  editingStageMatch,
  setEditingStageMatch,
  calMonth,
  setCalMonth,
  calDate,
  setCalDate,
  recordMatch,
  deleteFreeMatch,
  saveFreeMemo,
  updateFreeMatchStage,
  buildShareText,
  doShare,
  isPC,
  T,
  cd,
  btnBase,
  overlays,
}) {
  const { t, lang } = useI18n();
  const analysisRef = useRef(null);

  const oppMs = useMemo(() => freeMatches.filter((m) => m.opponent === selectedOpponent), [freeMatches, selectedOpponent]);

  const matchups = useMemo(() => {
    const s = {};
    oppMs.forEach((m) => {
      const k = `${m.myChar}|${m.oppChar}`;
      if (!s[k]) s[k] = { myChar: m.myChar, oppChar: m.oppChar, w: 0, l: 0, matches: [] };
      m.result === "win" ? s[k].w++ : s[k].l++;
      s[k].matches.push(m);
    });
    return Object.values(s).sort((a, b) => {
      const ia = FIGHTERS.indexOf(a.myChar) * 100 + FIGHTERS.indexOf(a.oppChar);
      const ib = FIGHTERS.indexOf(b.myChar) * 100 + FIGHTERS.indexOf(b.oppChar);
      return ia - ib;
    });
  }, [oppMs]);

  const winRatePoints = useMemo(() => {
    if (oppMs.length < 2) return [];
    const pts = [];
    for (let i = 0; i < oppMs.length; i++) {
      const start = Math.max(0, i - 9);
      const slice = oppMs.slice(start, i + 1);
      const w = slice.filter((m) => m.result === "win").length;
      pts.push({ date: `#${i + 1}`, value: Math.round((w / slice.length) * 100) });
    }
    return pts;
  }, [oppMs]);

  const freeDailyMap = useMemo(() => {
    const map = {};
    oppMs.forEach((m) => {
      if (!map[m.date]) map[m.date] = { w: 0, l: 0, matches: [] };
      m.result === "win" ? map[m.date].w++ : map[m.date].l++;
      map[m.date].matches.push(m);
    });
    return map;
  }, [oppMs]);

  const todayMs = freeMatches.filter((m) => m.opponent === selectedOpponent && m.date === today());
  const todayW = todayMs.filter((m) => m.result === "win").length;
  const todayL = todayMs.length - todayW;
  const totalW = oppMs.filter((m) => m.result === "win").length;
  const totalL = oppMs.length - totalW;

  // Calendar
  const calendarView = (() => {
    const [yStr, mStr] = calMonth.split("-");
    const year = Number(yStr); const mo = parseInt(mStr) - 1;
    const monthLabel = lang === "ja" ? `${year}${mo + 1}` : `${new Date(year, mo).toLocaleString("en", { month: "long" })} ${year}`;
    const firstDay = new Date(year, mo, 1).getDay();
    const daysInMonth = new Date(year, mo + 1, 0).getDate();
    const startOffset = (firstDay + 6) % 7;
    const todayStr = today();
    const weekDays = t("heatmap.weekDays");
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const dotColor = (r) => r >= 0.6 ? T.win : r <= 0.4 ? T.lose : T.mid;

    const monthDays = Object.entries(freeDailyMap).filter(([d]) => d.startsWith(calMonth));
    const mW = monthDays.reduce((a, [, d]) => a + d.w, 0);
    const mL = monthDays.reduce((a, [, d]) => a + d.l, 0);
    const mT = mW + mL;

    const selData = calDate ? freeDailyMap[calDate] : null;

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <button onClick={() => { setCalMonth(`${new Date(year, mo - 1, 1).getFullYear()}-${String(new Date(year, mo - 1, 1).getMonth() + 1).padStart(2, "0")}`); setCalDate(null); }}
            style={{ border: "none", background: "transparent", color: T.text, padding: 4, cursor: "pointer" }}><ChevronLeft size={18} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{monthLabel}</span>
            {calMonth !== currentMonth && <button onClick={() => { setCalMonth(currentMonth); setCalDate(null); }} style={{ border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6, cursor: "pointer" }}>{t("analysis.thisMonth")}</button>}
          </div>
          <button onClick={() => { setCalMonth(`${new Date(year, mo + 1, 1).getFullYear()}-${String(new Date(year, mo + 1, 1).getMonth() + 1).padStart(2, "0")}`); setCalDate(null); }}
            style={{ border: "none", background: "transparent", color: T.text, padding: 4, cursor: "pointer" }}><ChevronRight size={18} /></button>
        </div>
        {mT > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 2px 4px", fontSize: 11, color: T.dim }}>
            <span>{mT}{t("analysis.battles")}</span>
            <span style={{ fontWeight: 800, fontSize: 12 }}><span style={{ color: T.win }}>{mW}</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: T.lose }}>{mL}</span></span>
            <span style={{ fontWeight: 700, fontSize: 11, color: barColor(mT ? mW / mT : 0) }}>{percentStr(mW, mT)}</span>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, textAlign: "center" }}>
          {weekDays.map((d, i) => <div key={`h${i}`} style={{ fontSize: 10, fontWeight: 600, color: T.dim, padding: "2px 0" }}>{d}</div>)}
          {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${yStr}-${mStr}-${String(day).padStart(2, "0")}`;
            const dd = freeDailyMap[dateStr]; const isFuture = dateStr > todayStr;
            const isSel = calDate === dateStr; const isToday = dateStr === todayStr;
            const r = dd ? dd.w / (dd.w + dd.l) : 0;
            return (
              <div key={day} onClick={() => { if (dd) setCalDate(isSel ? null : dateStr); }}
                style={{ padding: "4px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: dd ? "pointer" : "default",
                  background: isSel ? T.accentSoft : "transparent", border: isSel ? `2px solid ${T.accent}` : isToday ? `1px solid ${T.dimmer}` : "1px solid transparent", opacity: isFuture ? 0.3 : 1 }}>
                <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isSel ? T.accent : isToday ? T.text : T.sub, lineHeight: 1 }}>{day}</span>
                {dd && <div style={{ width: 5, height: 5, borderRadius: 3, background: dotColor(r), marginTop: 2 }} />}
              </div>
            );
          })}
        </div>
        {selData && (
          <div style={{ marginTop: 8, borderTop: `1px solid ${T.inp}`, paddingTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{formatDate(calDate)}</span>
              <span style={{ fontSize: 13, fontWeight: 800 }}><span style={{ color: T.win }}>{selData.w}W</span> <span style={{ color: T.lose }}>{selData.l}L</span> <span style={{ color: barColor(selData.w / (selData.w + selData.l)) }}>{percentStr(selData.w, selData.w + selData.l)}</span></span>
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {selData.matches.slice().reverse().map((m, i) => {
                const isEditing = editingStageMatch && editingStageMatch.time === m.time && editingStageMatch.date === m.date;
                return (
                  <div key={i} style={{ paddingBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: m.result === "win" ? T.win : T.lose, minWidth: 32 }}>{m.result === "win" ? "WIN" : "LOSE"}</span>
                      <FighterIcon name={m.myChar} size={18} /><span style={{ fontSize: 11, color: T.sub }}>{shortName(m.myChar, lang)}</span>
                      <span style={{ fontSize: 10, color: T.dim }}>vs</span>
                      <FighterIcon name={m.oppChar} size={18} /><span style={{ fontSize: 11, color: T.sub, flex: 1 }}>{shortName(m.oppChar, lang)}</span>
                      {m.stage && !isEditing && <span style={{ fontSize: 9, color: T.dim, background: T.inp, padding: "1px 4px", borderRadius: 3, flexShrink: 0 }}>{stageName(m.stage, lang)}</span>}
                      <span style={{ fontSize: 10, color: T.dim }}>{formatTime(m.time)}</span>
                      <button onClick={() => setEditingStageMatch(isEditing ? null : m)} style={{ border: "none", background: T.inp, color: T.sub, fontSize: 9, padding: "1px 4px", borderRadius: 3, cursor: "pointer", flexShrink: 0 }}>{isEditing ? "✓" : "🗺"}</button>
                      <button onClick={() => deleteFreeMatch(m)} style={{ border: "none", background: "transparent", color: T.dimmer, fontSize: 14, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>×</button>
                    </div>
                    {isEditing && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 3, marginBottom: 2 }}>
                        {STAGES.map((st) => (
                          <div key={st.id} onClick={() => updateFreeMatchStage(m, m.stage === st.id ? null : st.id)}
                            style={{ textAlign: "center", cursor: "pointer", borderRadius: 6, border: m.stage === st.id ? `2px solid ${T.accent}` : `1px solid ${T.brd}`, padding: 2, opacity: m.stage === st.id ? 1 : 0.6 }}>
                            <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 22, objectFit: "cover", borderRadius: 4 }} />
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
        )}
      </div>
    );
  })();

  const noteKey = myChar && oppChar ? `${myChar}|${oppChar}` : null;

  // Battle area (char selection + win/lose)
  const battleArea = (
    <div>
      {!postRecord ? (
        <>
          <div style={{ ...cd, padding: "12px 14px" }}>
            {showMyPicker ? (
              <CharPicker value={myChar} onChange={(c) => { setMyChar(c); setShowMyPicker(false); }} label={t("battle.selectChar")} placeholder={t("charPicker.select")} recent={recMy} autoOpen T={T} />
            ) : showOppPicker ? (
              <CharPicker value={oppChar} onChange={(c) => { setOppChar(c); setShowOppPicker(false); }} label={t("battle.oppChar")} placeholder={t("charPicker.select")} recent={recOpp} autoOpen T={T} />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isPC ? "1fr 1fr" : "1fr 1fr", gap: isPC ? 12 : 10, alignItems: "start" }}>
                <div style={{ minWidth: 0 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{t("battle.selectChar")}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      {myChar && <FighterIcon name={myChar} size={28} />}
                      <span style={{ fontSize: 14, fontWeight: 700, color: myChar ? T.text : T.dim, lineHeight: 1.35, wordBreak: "break-word" }}>{myChar ? fighterName(myChar, lang) : t("battle.notSelected")}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <button type="button" onClick={() => setShowMyPicker(true)} style={{ ...btnBase, padding: "6px 11px", background: T.inp, color: T.sub, fontSize: 11, border: `1px solid ${T.brd}` }}>{t("battle.change")}</button>
                      {recMy.filter((c) => c !== myChar).slice(0, 3).map((c) => (
                        <button type="button" key={c} onClick={() => setMyChar(c)} style={{ ...btnBase, padding: "6px 11px", background: T.inp, color: T.text, fontSize: 11 }}>{fighterName(c, lang)}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ minWidth: 0, borderLeft: `1px solid ${T.inp}`, paddingLeft: 12, marginLeft: -1 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{t("battle.oppChar")}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      {oppChar && <FighterIcon name={oppChar} size={28} />}
                      <span style={{ fontSize: 14, fontWeight: 700, color: oppChar ? T.text : T.dim, lineHeight: 1.35, wordBreak: "break-word" }}>{oppChar ? fighterName(oppChar, lang) : t("battle.notSelected")}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <button type="button" onClick={() => setShowOppPicker(true)} style={{ ...btnBase, padding: "6px 11px", background: T.inp, color: T.sub, fontSize: 11, border: `1px solid ${T.brd}` }}>{t("battle.change")}</button>
                      {recOpp.filter((c) => c !== oppChar).slice(0, 3).map((c) => (
                        <button type="button" key={c} onClick={() => setOppChar(c)} style={{ ...btnBase, padding: "6px 11px", background: T.inp, color: T.text, fontSize: 11 }}>{fighterName(c, lang)}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <button type="button" onClick={() => recordMatch("win")} disabled={!myChar || !oppChar} style={{ ...btnBase, flex: 1, padding: 16, fontSize: 18, background: myChar && oppChar ? T.winGrad : T.inp, color: myChar && oppChar ? "#fff" : T.dim, boxShadow: myChar && oppChar ? T.winGlow : "none" }}>{t("battle.win")}</button>
            <button type="button" onClick={() => recordMatch("lose")} disabled={!myChar || !oppChar} style={{ ...btnBase, flex: 1, padding: 16, fontSize: 18, background: myChar && oppChar ? T.loseGrad : T.inp, color: myChar && oppChar ? "#fff" : T.dim, boxShadow: myChar && oppChar ? T.loseGlow : "none" }}>{t("battle.lose")}</button>
          </div>
          <div style={{ ...cd, padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 8 }}>{t("stages.selectStage")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {STAGES.map((st) => (
                <div key={st.id} onClick={() => setSelectedStage(selectedStage === st.id ? null : st.id)}
                  style={{ textAlign: "center", cursor: "pointer", borderRadius: 8, border: selectedStage === st.id ? `2px solid ${T.accent}` : `1.5px solid ${T.brd}`, padding: 3, opacity: selectedStage === st.id ? 1 : 0.55, transition: "all .15s" }}>
                  <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 32, objectFit: "cover", borderRadius: 5 }} />
                  <div style={{ fontSize: 9, fontWeight: 600, color: T.text, marginTop: 2 }}>{stageName(st.id, lang)}</div>
                </div>
              ))}
            </div>
          </div>
          {noteKey && (
            <BattleNotes noteKey={noteKey} data={data} T={T} onSave={onSave} />
          )}
          {noteKey && (() => {
            const muPair = oppMs.filter((m) => m.myChar === myChar && m.oppChar === oppChar);
            const pw = muPair.filter((m) => m.result === "win").length;
            const pl = muPair.length - pw;
            const memoHist = muPair.filter((m) => String(m.memo || "").trim()).slice().reverse();
            return (
              <div style={{ ...cd, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: T.dim, fontWeight: 600, marginBottom: 6 }}>{t("battle.prepReference")}</div>
                {muPair.length > 0 ? (
                  <div style={{ fontSize: 14, fontWeight: 800, color: barColor(pw / muPair.length), fontFamily: "'Chakra Petch', sans-serif", marginBottom: 8 }}>
                    {pw}W {pl}L · {percentStr(pw, muPair.length)} <span style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>({muPair.length}{t("common.matches")})</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: T.dim, marginBottom: 8 }}>{t("battle.firstMatch")}</div>
                )}
                <div style={{ fontSize: 11, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("battle.memoMatchHistory")}</div>
                {memoHist.length > 0 ? (
                  <div style={{ maxHeight: 160, overflowY: "auto", marginBottom: 8 }}>
                    {memoHist.slice(0, 15).map((m, i, arr) => (
                      <div key={i} style={{ padding: "6px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.inp}` : "none" }}>
                        <span style={{ color: m.result === "win" ? T.win : T.lose, fontWeight: 800, fontSize: 10, marginRight: 6 }}>{m.result === "win" ? "W" : "L"}</span>
                        <span style={{ fontSize: 10, color: T.dim }}>{formatDate(m.date)}</span>
                        <div style={{ fontSize: 12, color: T.sub, marginTop: 4, whiteSpace: "pre-wrap" }}>{m.memo}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: T.dim, marginBottom: 8 }}>{t("battle.noMemoMatches")}</div>
                )}
              </div>
            );
          })()}
        </>
      ) : (
        <div style={{ ...cd, padding: "16px 18px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif", color: lastResult === "win" ? T.win : T.lose, marginBottom: 12 }}>{lastResult === "win" ? "WIN" : "LOSE"}</div>
          </div>
          <textarea
            value={freeMemo}
            onChange={(e) => { setFreeMemo(e.target.value); const el = e.target; el.style.height = "auto"; el.style.height = `${Math.max(44, el.scrollHeight)}px`; }}
            onBlur={saveFreeMemo}
            placeholder={t("battle.memo")}
            rows={1}
            maxLength={500}
            style={{ width: "100%", marginBottom: 12, padding: "10px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.5 }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { saveFreeMemo(); setPostRecord(false); }} style={{ ...btnBase, flex: 2, padding: 14, background: T.accentGrad, color: "#fff", fontSize: 15, fontWeight: 800, boxShadow: T.accentGlow }}>{t("free.rematch")}</button>
            <button onClick={() => { saveFreeMemo(); setOppChar(""); setShowOppPicker(true); setPostRecord(false); }} style={{ ...btnBase, flex: 1, padding: 14, background: T.card, color: T.text, fontSize: 13, fontWeight: 600, border: `1px solid ${T.brd}` }}>{t("free.changeChar")}</button>
          </div>
        </div>
      )}

      {/* Today's log */}
      {todayMs.length > 0 && (
        <div style={{ ...cd, padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{t("free.todayRecord")}</span>
            <button onClick={() => doShare(buildShareText(selectedOpponent, todayMs))} style={{ border: "none", background: T.inp, borderRadius: 8, padding: "3px 8px", fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}><Share2 size={11} />{t("free.share")}</button>
          </div>
          {todayMs.slice().reverse().map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: m.result === "win" ? T.win : T.lose, minWidth: 32 }}>{m.result === "win" ? "WIN" : "LOSE"}</span>
              <FighterIcon name={m.myChar} size={18} /><span style={{ fontSize: 11, color: T.sub }}>{shortName(m.myChar, lang)}</span>
              <span style={{ fontSize: 10, color: T.dim }}>vs</span>
              <FighterIcon name={m.oppChar} size={18} /><span style={{ fontSize: 11, color: T.sub, flex: 1 }}>{shortName(m.oppChar, lang)}</span>
              {m.stage && <span style={{ fontSize: 9, color: T.dim, background: T.inp, padding: "1px 4px", borderRadius: 3, flexShrink: 0 }}>{stageName(m.stage, lang)}</span>}
              <span style={{ fontSize: 10, color: T.dim }}>{formatTime(m.time)}</span>
              <button onClick={() => deleteFreeMatch(m)} style={{ border: "none", background: "transparent", color: T.dimmer, fontSize: 14, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Analysis area
  const analysisArea = (
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: T.text, padding: "12px 0 8px", borderTop: `1px solid ${T.brd}`, marginTop: 8 }}>
        {t("free.analysis")}
      </div>

      {/* Summary */}
      <div style={{ ...cd, display: "flex", padding: "12px 10px", textAlign: "center" }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.totalMatches")}</div><div style={{ fontSize: 20, fontWeight: 900, color: T.text, marginTop: 3, fontFamily: "'Chakra Petch', sans-serif" }}>{oppMs.length}</div></div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.winRate")}</div><div style={{ fontSize: 20, fontWeight: 900, color: oppMs.length > 0 ? barColor(totalW / oppMs.length) : T.dim, marginTop: 3, fontFamily: "'Chakra Petch', sans-serif" }}>{oppMs.length > 0 ? percentStr(totalW, oppMs.length) : "-"}</div></div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.winLoss")}</div><div style={{ fontSize: 20, fontWeight: 900, marginTop: 3, fontFamily: "'Chakra Petch', sans-serif" }}><span style={{ color: T.win }}>{totalW}</span><span style={{ color: T.dimmer, fontSize: 12, margin: "0 2px" }}>:</span><span style={{ color: T.lose }}>{totalL}</span></div></div>
      </div>
      {/* Win rate trend */}
      {winRatePoints.length > 1 && (
        <div style={{ ...cd, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("free.winRateTrend")}</div>
          <Chart points={winRatePoints} T={T} />
        </div>
      )}

      {/* Matchups */}
      {matchups.length > 0 && (
        <div style={{ ...cd, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 10 }}>{t("free.matchupStats")}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {matchups.map((mu) => {
              const r = mu.w / (mu.w + mu.l);
              const k = `${mu.myChar}|${mu.oppChar}`;
              return (
                <div key={k} onClick={() => setExpandedMatchup(expandedMatchup === k ? null : k)}
                  style={{ textAlign: "center", cursor: "pointer", padding: "6px 2px", borderRadius: 10, background: expandedMatchup === k ? T.accentSoft : "transparent", border: expandedMatchup === k ? `1.5px solid ${T.accentBorder}` : "1.5px solid transparent", transition: "all .15s" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 2 }}>
                    <FighterIcon name={mu.myChar} size={20} />
                    <FighterIcon name={mu.oppChar} size={20} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(mu.w, mu.w + mu.l)}</div>
                  <div style={{ fontSize: 9, color: T.dim }}>{mu.w}W {mu.l}L</div>
                </div>
              );
            })}
          </div>
          {/* Expanded matchup detail */}
          {expandedMatchup && (() => {
            const mu = matchups.find((m) => `${m.myChar}|${m.oppChar}` === expandedMatchup);
            if (!mu) return null;
            return (
              <div style={{ marginTop: 10, borderTop: `1px solid ${T.inp}`, paddingTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <FighterIcon name={mu.myChar} size={22} /><span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{shortName(mu.myChar, lang)}</span>
                  <span style={{ fontSize: 10, color: T.dim }}>vs</span>
                  <FighterIcon name={mu.oppChar} size={22} /><span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{shortName(mu.oppChar, lang)}</span>
                  <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: barColor(mu.w / (mu.w + mu.l)), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(mu.w, mu.w + mu.l)}</span>
                </div>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {mu.matches.slice().reverse().map((m, i) => {
                    const isEditing = editingStageMatch && editingStageMatch.time === m.time && editingStageMatch.date === m.date;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0", borderBottom: `1px solid ${T.inp}`, flexWrap: isEditing ? "wrap" : "nowrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: m.result === "win" ? T.win : T.lose, minWidth: 30 }}>{m.result === "win" ? "WIN" : "LOSE"}</span>
                        <span style={{ fontSize: 10, color: T.dim }}>{formatDate(m.date)}</span>
                        {m.stage && !isEditing && <span style={{ fontSize: 9, color: T.dim, background: T.inp, padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>{stageName(m.stage, lang)}</span>}
                        <span style={{ fontSize: 10, color: T.dim, marginLeft: "auto" }}>{formatTime(m.time)}</span>
                        <button onClick={(e) => { e.stopPropagation(); setEditingStageMatch(isEditing ? null : m); }} style={{ border: "none", background: T.inp, color: T.sub, fontSize: 9, padding: "2px 5px", borderRadius: 4, cursor: "pointer", flexShrink: 0 }}>{isEditing ? "✓" : "🗺"}</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteFreeMatch(m); }} style={{ border: "none", background: "transparent", color: T.dimmer, fontSize: 13, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>×</button>
                        {isEditing && (
                          <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 4, marginBottom: 4 }}>
                            {STAGES.map((st) => (
                              <div key={st.id} onClick={(e) => { e.stopPropagation(); updateFreeMatchStage(m, m.stage === st.id ? null : st.id); }}
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
            );
          })()}
        </div>
      )}

      {/* Calendar */}
      <div style={{ ...cd, padding: "12px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("analysis.dailyRecord")}</div>
        {calendarView}
      </div>
    </div>
  );

  // -- PC: 2-column layout --
  if (isPC) {
    return (
      <div style={{ animation: "fadeUp .2s ease" }}>
        {/* Header */}
        <div style={{ background: T.tBg, borderRadius: 16, padding: "14px 18px", marginBottom: 12, boxShadow: T.sh, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => { setSelectedOpponent(null); setPostRecord(false); }} style={{ ...btnBase, padding: "8px 14px", background: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.8)", fontSize: 13 }}>{t("free.back")}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff" }}>{selectedOpponent[0]}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{selectedOpponent}</div>
              {oppMs.length > 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>{oppMs.length}{t("analysis.battles")} {totalW}W {totalL}L ({percentStr(totalW, oppMs.length)})</div>}
            </div>
          </div>
          {oppMs.length > 0 && <button onClick={() => doShare(buildShareText(selectedOpponent, oppMs))} style={{ ...btnBase, padding: "6px 14px", background: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.8)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Share2 size={12} />{t("free.share")}</button>}
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>{battleArea}</div>
          <div style={{ flex: 1, minWidth: 0 }}>{analysisArea}</div>
        </div>
        {overlays}
      </div>
    );
  }

  // -- Mobile: single scroll --
  return (
    <div style={{ animation: "fadeUp .2s ease" }}>
      {/* Header */}
      <div style={{ background: T.tBg, borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: T.sh, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => { setSelectedOpponent(null); setPostRecord(false); }} style={{ ...btnBase, padding: "6px 12px", background: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.8)", fontSize: 12 }}>{t("free.back")}</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>{selectedOpponent[0]}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{selectedOpponent}</div>
            {oppMs.length > 0 && <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{oppMs.length}{t("analysis.battles")} {totalW}W {totalL}L ({percentStr(totalW, oppMs.length)})</div>}
          </div>
        </div>
        {oppMs.length > 0 && <button onClick={() => doShare(buildShareText(selectedOpponent, oppMs))} style={{ border: "none", background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "4px 8px", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.8)", display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}><Share2 size={10} />{t("free.share")}</button>}
      </div>

      {battleArea}
      {/* "View Analysis" link removed per user request */}
      <div ref={analysisRef}>{analysisArea}</div>
      {overlays}
    </div>
  );
}
