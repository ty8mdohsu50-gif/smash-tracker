import { useRef, useMemo, useCallback, useState } from "react";
import { BattleNotes } from "../shared/MatchupNotesEditor";
import CharPicker from "../shared/CharPicker";
import FighterIcon from "../shared/FighterIcon";
import KeyHint from "../shared/KeyHint";
import Chart from "../shared/Chart";
import OpponentCalendar from "./OpponentCalendar";
import MatchupGrid from "./MatchupGrid";
import { fighterName, shortName, FIGHTERS } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { useI18n } from "../../i18n/index.jsx";
import { today, formatDate, formatTime, percentStr, barColor } from "../../utils/format";
import { useFreeKeyboardShortcuts } from "../../hooks/useFreeKeyboardShortcuts";

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
  isPC,
  tabIdx,
  modalsOpen,
  confirmAction,
  setConfirmAction,
  T,
  cd,
  btnBase,
  overlays,
}) {
  const { t, lang } = useI18n();
  const analysisRef = useRef(null);
  const memoRef = useRef(null);

  const changeMyCharFromPost = useCallback(() => {
    saveFreeMemo();
    setShowOppPicker(false);
    setShowMyPicker(true);
    setPostRecord(false);
  }, [saveFreeMemo, setShowOppPicker, setShowMyPicker, setPostRecord]);

  const freeShortcutActions = useMemo(() => ({
    recordWin: () => recordMatch("win"),
    recordLose: () => recordMatch("lose"),
    openMyPicker: () => { setShowOppPicker(false); setShowMyPicker(true); },
    openOppPicker: () => { setShowMyPicker(false); setShowOppPicker(true); },
    closeMyPicker: () => setShowMyPicker(false),
    closeOppPicker: () => setShowOppPicker(false),
    closeConfirm: () => setConfirmAction && setConfirmAction(null),
    selectRecentOpp: (c) => setOppChar(c),
    selectStage: (id) => setSelectedStage(selectedStage === id ? null : id),
    rematch: () => { saveFreeMemo(); setPostRecord(false); },
    changeOpp: () => { saveFreeMemo(); setOppChar(""); setShowOppPicker(true); setPostRecord(false); },
    changeMyChar: changeMyCharFromPost,
    focusMemo: () => { memoRef.current?.focus(); },
    goBack: () => { setSelectedOpponent(null); setPostRecord(false); },
  }), [recordMatch, setShowMyPicker, setShowOppPicker, setOppChar, setSelectedStage, selectedStage, saveFreeMemo, setPostRecord, setSelectedOpponent, setConfirmAction, changeMyCharFromPost]);

  useFreeKeyboardShortcuts({
    isPC,
    isActive: isPC && !modalsOpen && tabIdx === 0,
    postRecord,
    myChar,
    oppChar,
    showMyPicker,
    showOppPicker,
    confirmAction,
    recOpp,
    actions: freeShortcutActions,
  });

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

  // Per-character trend filter. null = overall, otherwise a myChar
  // string. We list every fighter the user has ever brought to this
  // opponent — even ones with only a couple of matches — so they
  // can always see how each pick performs. The trend *line* itself
  // still needs a minimum sample, so low-volume picks fall back to
  // a static W/L card below.
  const [trendFilter, setTrendFilter] = useState(null);

  const trendCharStats = useMemo(() => {
    const map = {};
    for (const m of oppMs) {
      if (!map[m.myChar]) map[m.myChar] = { char: m.myChar, w: 0, l: 0 };
      m.result === "win" ? map[m.myChar].w++ : map[m.myChar].l++;
    }
    return Object.values(map).sort((a, b) => (b.w + b.l) - (a.w + a.l));
  }, [oppMs]);

  const trendChars = trendCharStats.map((s) => s.char);

  const trendFilterStat = trendFilter ? trendCharStats.find((s) => s.char === trendFilter) : null;

  // Drop the saved filter if the matches that made it eligible go
  // away (e.g. user deletes them).
  if (trendFilter && !trendChars.includes(trendFilter)) {
    setTrendFilter(null);
  }

  // Rolling 10-match win-rate trend. We deliberately skip the first
  // few matches: a window of 1 or 2 matches produces wild 0%/50%/100%
  // swings that look like dramatic crashes on the chart but are just
  // small-sample noise. Wait until we have at least 5 matches in the
  // window.
  const winRatePoints = useMemo(() => {
    const source = trendFilter ? oppMs.filter((m) => m.myChar === trendFilter) : oppMs;
    if (source.length < 5) return [];
    const pts = [];
    const WINDOW = 10;
    const MIN_SAMPLE = 5;
    for (let i = MIN_SAMPLE - 1; i < source.length; i++) {
      const start = Math.max(0, i - (WINDOW - 1));
      const slice = source.slice(start, i + 1);
      const w = slice.filter((m) => m.result === "win").length;
      pts.push({ date: `#${i + 1}`, value: Math.round((w / slice.length) * 100) });
    }
    return pts;
  }, [oppMs, trendFilter]);

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
                      <button type="button" onClick={() => setShowMyPicker(true)} style={{ ...btnBase, padding: "6px 11px", background: T.inp, color: T.sub, fontSize: 11, border: `1px solid ${T.brd}` }}>
                        {t("battle.change")}
                        {isPC && <KeyHint keyLabel="9" T={T} />}
                      </button>
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
                      <button type="button" onClick={() => setShowOppPicker(true)} style={{ ...btnBase, padding: "6px 11px", background: T.inp, color: T.sub, fontSize: 11, border: `1px solid ${T.brd}` }}>
                        {t("battle.change")}
                        {isPC && <KeyHint keyLabel="0" T={T} />}
                      </button>
                      {recOpp.filter((c) => c !== oppChar).slice(0, 5).map((c, i) => (
                        <button type="button" key={c} onClick={() => setOppChar(c)} style={{ ...btnBase, padding: "6px 11px", background: T.inp, color: T.text, fontSize: 11 }}>
                          {fighterName(c, lang)}
                          {isPC && !oppChar && <KeyHint keyLabel={String(i + 1)} T={T} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <button type="button" onClick={() => recordMatch("win")} disabled={!myChar || !oppChar} style={{ ...btnBase, flex: 1, padding: 16, fontSize: 18, background: myChar && oppChar ? T.winGrad : T.inp, color: myChar && oppChar ? "#fff" : T.dim, boxShadow: myChar && oppChar ? T.winGlow : "none" }}>
              {t("battle.win")}
              {isPC && <KeyHint keyLabel="W" T={T} />}
            </button>
            <button type="button" onClick={() => recordMatch("lose")} disabled={!myChar || !oppChar} style={{ ...btnBase, flex: 1, padding: 16, fontSize: 18, background: myChar && oppChar ? T.loseGrad : T.inp, color: myChar && oppChar ? "#fff" : T.dim, boxShadow: myChar && oppChar ? T.loseGlow : "none" }}>
              {t("battle.lose")}
              {isPC && <KeyHint keyLabel="L" T={T} />}
            </button>
          </div>
          <div style={{ ...cd, padding: "12px 16px" }}>
            <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 8 }}>{t("stages.selectStage")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {STAGES.map((st, stageIdx) => (
                <div key={st.id} onClick={() => setSelectedStage(selectedStage === st.id ? null : st.id)}
                  style={{ textAlign: "center", cursor: "pointer", borderRadius: 8, border: selectedStage === st.id ? `2px solid ${T.accent}` : `1.5px solid ${T.brd}`, padding: 3, opacity: selectedStage === st.id ? 1 : 0.55, transition: "all .15s", position: "relative" }}>
                  <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 32, objectFit: "cover", borderRadius: 5 }} />
                  <div style={{ fontSize: 9, fontWeight: 600, color: T.text, marginTop: 2 }}>{stageName(st.id, lang)}</div>
                  {isPC && <KeyHint keyLabel={"Shift+" + String(stageIdx + 1)} T={T} />}
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
          <div style={{ position: "relative" }}>
            <textarea
              ref={memoRef}
              value={freeMemo}
              onChange={(e) => { setFreeMemo(e.target.value); const el = e.target; el.style.height = "auto"; el.style.height = `${Math.max(44, el.scrollHeight)}px`; }}
              onBlur={saveFreeMemo}
              placeholder={t("battle.memo")}
              rows={1}
              maxLength={500}
              style={{ width: "100%", marginBottom: 12, padding: "10px 12px", paddingRight: isPC ? 36 : 12, background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.5 }}
            />
            {isPC && (
              <span style={{ position: "absolute", top: 8, right: 10 }}>
                <KeyHint keyLabel="M" T={T} />
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { saveFreeMemo(); setPostRecord(false); }} style={{ ...btnBase, padding: 14, background: T.accentGrad, color: "#fff", fontSize: 15, fontWeight: 800, boxShadow: T.accentGlow }}>
              {t("free.rematch")}
              {isPC && <KeyHint keyLabel="N" T={T} />}
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { saveFreeMemo(); setOppChar(""); setShowOppPicker(true); setPostRecord(false); }} style={{ ...btnBase, flex: 1, padding: 12, background: T.card, color: T.text, fontSize: 13, fontWeight: 600, border: `1px solid ${T.brd}` }}>
                {t("free.changeChar")}
                {isPC && <KeyHint keyLabel="C" T={T} />}
              </button>
              <button onClick={changeMyCharFromPost} style={{ ...btnBase, flex: 1, padding: 12, background: T.card, color: T.text, fontSize: 13, fontWeight: 600, border: `1px solid ${T.brd}` }}>
                {t("battle.changeChar")}
                {isPC && <KeyHint keyLabel="9" T={T} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's log */}
      {todayMs.length > 0 && (
        <div style={{ ...cd, padding: "12px 16px" }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{t("free.todayRecord")}</span>
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
      {(winRatePoints.length > 1 || trendChars.length > 0) && (
        <div style={{ ...cd, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 8 }}>
            {t("free.winRateTrend")}
          </div>
          {trendChars.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 10,
                overflowX: "auto",
                paddingBottom: 4,
                scrollbarWidth: "thin",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <button
                type="button"
                onClick={() => setTrendFilter(null)}
                style={{
                  flexShrink: 0,
                  border: trendFilter === null ? `1.5px solid ${T.accentBorder}` : `1px solid ${T.brd}`,
                  background: trendFilter === null ? T.accentSoft : T.inp,
                  color: trendFilter === null ? T.accent : T.sub,
                  fontSize: 10, fontWeight: 700,
                  padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {t("free.trendOverall")}
              </button>
              <div style={{ width: 1, height: 18, background: T.brd, flexShrink: 0, marginLeft: 2, marginRight: 2 }} />
              {trendChars.map((c) => {
                const active = trendFilter === c;
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setTrendFilter(c)}
                    style={{
                      flexShrink: 0,
                      border: active ? `1.5px solid ${T.accentBorder}` : `1px solid ${T.brd}`,
                      background: active ? T.accentSoft : T.inp,
                      color: active ? T.accent : T.sub,
                      fontSize: 10, fontWeight: 700,
                      padding: "3px 9px 3px 4px", borderRadius: 8, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <FighterIcon name={c} size={16} />
                    {shortName(c, lang)}
                  </button>
                );
              })}
            </div>
          )}
          {winRatePoints.length > 1 ? (
            <Chart
              points={winRatePoints}
              T={T}
              yMin={0}
              yMax={100}
              yStep={25}
              yFormat={(v) => `${Math.round(v)}%`}
            />
          ) : trendFilterStat ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "16px 0" }}>
              <FighterIcon name={trendFilterStat.char} size={28} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{shortName(trendFilterStat.char, lang)}</span>
                <span style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{t("free.trendNotEnough")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Chakra Petch', sans-serif" }}>
                  <span style={{ color: T.win }}>{trendFilterStat.w}</span>
                  <span style={{ color: T.dimmer, fontSize: 12, margin: "0 3px" }}>:</span>
                  <span style={{ color: T.lose }}>{trendFilterStat.l}</span>
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: barColor((trendFilterStat.w) / Math.max(1, trendFilterStat.w + trendFilterStat.l)), fontFamily: "'Chakra Petch', sans-serif" }}>
                  {percentStr(trendFilterStat.w, trendFilterStat.w + trendFilterStat.l)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", fontSize: 11, color: T.dim }}>
              {t("free.trendNotEnough")}
            </div>
          )}
        </div>
      )}

      {/* Matchups */}
      {matchups.length > 0 && (
        <div style={{ ...cd, padding: "14px 16px" }}>
          <MatchupGrid
            matchups={matchups}
            expandedMatchup={expandedMatchup}
            setExpandedMatchup={setExpandedMatchup}
            editingStageMatch={editingStageMatch}
            setEditingStageMatch={setEditingStageMatch}
            deleteFreeMatch={deleteFreeMatch}
            updateFreeMatchStage={updateFreeMatchStage}
            T={T}
          />
        </div>
      )}

      {/* Calendar */}
      <div style={{ ...cd, padding: "12px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("analysis.dailyRecord")}</div>
        <OpponentCalendar
          freeDailyMap={freeDailyMap}
          calMonth={calMonth}
          setCalMonth={setCalMonth}
          calDate={calDate}
          setCalDate={setCalDate}
          editingStageMatch={editingStageMatch}
          setEditingStageMatch={setEditingStageMatch}
          deleteFreeMatch={deleteFreeMatch}
          updateFreeMatchStage={updateFreeMatchStage}
          T={T}
        />
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
      </div>

      {battleArea}
      {/* "View Analysis" link removed per user request */}
      <div ref={analysisRef}>{analysisArea}</div>
      {overlays}
    </div>
  );
}
