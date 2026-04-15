import { useMemo } from "react";
import { X, Zap, Share2 } from "lucide-react";
import { BattleNotes } from "../shared/MatchupNotesEditor";
import CharPicker from "../shared/CharPicker";
import KeyHint from "../shared/KeyHint";
import SessionCard from "../shared/SessionCard";
import FighterIcon from "../shared/FighterIcon";
import RecentMatchList from "./RecentMatchList";
import BattleOverlays from "./BattleOverlays";
import StageSelector from "./StageSelector";
import ResultBadge from "../shared/ResultBadge";
import { fighterName, shortName } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { useSessionCard } from "../../hooks/useSessionCard";
import {
  today,
  formatDateLong,
  formatDateShort,
  numFormat,
  percentStr,
  barColor,
  formatTime,
} from "../../utils/format";
import { getCardStyle, getGoalInputStyle, getBtnR, getPrimaryBtn, PwrInput } from "./battleStyles";

export default function PCBattle({ state, data, onSave, T, memoRef, stageRef, powerRef }) {
  const {
    t, lang,
    phase, setPhase,
    myChar, setMyChar,
    oppChar, setOppChar,
    result, setResult,
    lastRes,
    memo, setMemo,
    showMyPicker, setShowMyPicker,
    showOppPicker, setShowOppPicker,
    sharePopupText, setSharePopupText,
    sharePopupImage, setSharePopupImage,
    confirmAction, setConfirmAction,
    editingStageIdx, setEditingStageIdx,
    gGames, setGG,
    gWR, setGWR,
    reviewText, setReviewText,
    charMemoText, setCharMemoText,
    selectedStage, setSelectedStage,
    pStart, setPStart,
    pEnd, setPEnd,
    todayDaily, prevEnd,
    recMy, recOpp,
    matchupNotesKey,
    tM, tW, tL,
    streak, goals, winRate, pwrDelta,
    doShare, savePower, saveMemo, suppressPointerFocus,
    saveCharMemoBlur, saveMemoBlur, saveGoals,
    switchCharPower, startBattle, recordMatch,
    selectRes,
    deleteMatch, updateMatchStage, saveStage,
    continueSame, changeOpp, changeChar, endSession,
    saveEndSession,
  } = state;

  const { cardRef, generating, imageBlob, generateCard, clearImage } = useSessionCard();

  const cd = getCardStyle(T);
  const goalInputStyle = getGoalInputStyle(T);
  const btnR = getBtnR();

  // Stage selector overlay context: adapts to what's currently
  // picked so the per-stage history shown always matches the user's
  // intent. Neither side picked → all ranked history; one side
  // picked → filter to that character; both picked → the exact
  // matchup. This keeps the grid useful even before the user has
  // committed to a matchup.
  const matchupMatches = useMemo(() => {
    if (!myChar && !oppChar) return data.matches;
    if (myChar && !oppChar) return data.matches.filter((m) => m.myChar === myChar);
    if (!myChar && oppChar) return data.matches.filter((m) => m.oppChar === oppChar);
    return data.matches.filter((m) => m.myChar === myChar && m.oppChar === oppChar);
  }, [data.matches, myChar, oppChar]);

  // Keep the "N matches" hint honest about what the grid is actually
  // aggregating — the default matchupHistoryHint only makes sense
  // once both sides are picked.
  const stageHistoryHint = useMemo(() => {
    const n = matchupMatches.length;
    if (n === 0) return null;
    if (myChar && oppChar) return t("stages.matchupHistoryHint", { n });
    if (myChar) return t("stages.myCharHistoryHint", { char: shortName(myChar, lang), n });
    if (oppChar) return t("stages.oppCharHistoryHint", { char: shortName(oppChar, lang), n });
    return t("stages.allHistoryHint", { n });
  }, [matchupMatches.length, myChar, oppChar, t, lang]);

  // Stat card helper
  const statCard = (label, value, color) => {
    const len = String(value).length;
    const fs = len > 10 ? 16 : len > 7 ? 20 : 28;
    return (
      <div style={{ ...cd, flex: 1, marginBottom: 0, padding: "16px 14px", minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: fs, fontWeight: 900, color: color || T.text, letterSpacing: -1, fontFamily: "'Chakra Petch', sans-serif", whiteSpace: "nowrap", marginTop: "auto" }}>{value}</div>
      </div>
    );
  };

  // Prep reference block
  const rankedPrepReferenceBlock = oppChar && myChar && !result && (() => {
    const oppMatches = data.matches.filter((m) => m.myChar === myChar && m.oppChar === oppChar);
    const oppW = oppMatches.filter((m) => m.result === "win").length;
    const oppL = oppMatches.length - oppW;
    const oppWinRate = oppMatches.length > 0 ? oppW / oppMatches.length : 0;
    const pastMemos = data.matches.filter((m) => m.myChar === myChar && m.oppChar === oppChar && String(m.memo || "").trim()).slice().reverse();
    return (
      <div style={{ ...cd, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, color: T.dim, fontWeight: 600, marginBottom: 6 }}>{t("battle.prepReference")}</div>
        {oppMatches.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: T.dim, fontWeight: 600 }}>{oppMatches.length}{t("common.matches")} {oppW}W {oppL}L</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: barColor(oppWinRate), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(oppW, oppMatches.length)}</span>
          </div>
        )}
        <div style={{ fontSize: 11, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("battle.memoMatchHistory")}</div>
        {pastMemos.length > 0 ? (
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {pastMemos.slice(0, 20).map((m, i, arr) => (
              <div key={`${m.date}-${m.time}-${i}`} style={{ fontSize: 12, color: T.sub, lineHeight: 1.5, padding: "6px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.inp}` : "none" }}>
                <span style={{ color: m.result === "win" ? T.win : T.lose, fontWeight: 800, fontSize: 10, marginRight: 6 }}>{m.result === "win" ? "W" : "L"}</span>
                <span style={{ color: T.dim, fontSize: 10 }}>{formatDateShort(m.date)}</span>
                <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{m.memo}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: T.dim }}>{t("battle.noMemoMatches")}</div>
        )}
      </div>
    );
  })();

  // Pending result banner
  const pendingResultBanner = result && (
    <div style={{ ...cd, textAlign: "center", background: result === "win" ? T.winBg : T.loseBg, padding: "12px 16px", marginBottom: 8 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: result === "win" ? T.win : T.lose }}>
        {result === "win" ? "WIN" : "LOSE"} - {t("battle.oppChar")}?
      </div>
    </div>
  );

  // PC sidebar content
  const pcSidebar = (
    <div style={{ flex: 1, minWidth: 0, background: T.card, borderRadius: 20, padding: 0, border: `1px solid ${T.brd}`, boxShadow: T.sh, position: "sticky", top: 90, display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "calc(100vh - 120px)" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {phase === "battle" && oppChar && matchupNotesKey && !result && (
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.inp}` }}>
            <BattleNotes noteKey={matchupNotesKey} data={data} T={T} onSave={onSave} sections={["flash"]} />
            {rankedPrepReferenceBlock}
            <BattleNotes noteKey={matchupNotesKey} data={data} T={T} onSave={onSave} sections={["gameplan"]} />
            <BattleNotes noteKey={matchupNotesKey} data={data} T={T} onSave={onSave} sections={["bans"]} />
          </div>
        )}

        {/* Today's goals */}
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.inp}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t("settings.todayGoal")}</span>
            {(goals.games || goals.winRate) && tM.length > 0 && (
              <button onClick={() => {
                const lines = [`【SMASH TRACKER】${t("share.todayGoal")}`];
                if (goals.games) lines.push(`${tM.length}/${goals.games}${t("settings.gamesUnit")} ${tM.length >= goals.games ? t("share.achieved") : ""}`);
                if (goals.winRate) lines.push(`${t("settings.winRate")} ${winRate}% / ${goals.winRate}% ${winRate >= goals.winRate ? t("share.achieved") : ""}`);
                lines.push("", "#\u30B9\u30DE\u30D6\u30E9 #SmashTracker", "https://smash-tracker.pages.dev/");
                doShare(lines.join("\n"));
              }} style={{ border: "none", background: T.inp, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}>
                <Share2 size={12} /> {t("battle.share")}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{t("settings.games")}</span>
              <input type="number" value={gGames} onChange={(e) => setGG(e.target.value)} onBlur={saveGoals} placeholder="10" style={{ ...goalInputStyle, padding: "6px 8px", fontSize: 13 }} />
              <span style={{ fontSize: 12, color: T.sub }}>{t("settings.gamesUnit")}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{t("settings.winRate")}</span>
              <input type="number" value={gWR} onChange={(e) => setGWR(e.target.value)} onBlur={saveGoals} placeholder="60" style={{ ...goalInputStyle, padding: "6px 8px", fontSize: 13 }} />
              <span style={{ fontSize: 12, color: T.sub }}>{t("settings.winRateUnit")}</span>
            </div>
          </div>
          {(goals.games || (goals.winRate && tM.length > 0)) && (
            <div style={{ display: "flex", gap: 12 }}>
              {goals.games ? (<div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.sub, marginBottom: 3 }}><span>{tM.length}/{goals.games}{t("settings.gamesUnit")}</span><span style={{ color: tM.length >= goals.games ? T.win : T.text, fontWeight: 700 }}>{tM.length >= goals.games ? `\u2713 ${t("share.achieved")}` : `${Math.round((tM.length / goals.games) * 100)}%`}</span></div><div style={{ height: 5, background: T.inp, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${Math.min(100, (tM.length / goals.games) * 100)}%`, height: "100%", background: T.win, borderRadius: 3 }} /></div></div>) : null}
              {goals.winRate && tM.length > 0 ? (<div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.sub, marginBottom: 3 }}><span>{t("settings.winRate")} {goals.winRate}%</span><span style={{ color: winRate >= goals.winRate ? T.win : T.lose, fontWeight: 700 }}>{winRate}%</span></div><div style={{ height: 5, background: T.inp, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${Math.min(100, (tW / tM.length) * 100)}%`, height: "100%", background: winRate >= goals.winRate ? T.win : T.lose, borderRadius: 3 }} /></div></div>) : null}
            </div>
          )}
        </div>

        {/* Recent matches */}
        {!(phase === "battle" && oppChar) && tM.length > 0 && (
          <div style={{ padding: "12px 24px 24px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, marginBottom: 8 }}>{t("battle.recent")}</div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              <RecentMatchList
                matches={tM}
                allMatches={data.matches}
                editingStageIdx={editingStageIdx}
                setEditingStageIdx={setEditingStageIdx}
                deleteMatch={deleteMatch}
                updateMatchStage={updateMatchStage}
                T={T}
                lang={lang}
                size="compact"
                showMemo
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // PC: setup phase
  if (phase === "setup") {
    return (
      <div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          {statCard(t("battle.winLoss"), tM.length > 0 ? `${tW}W - ${tL}L` : "\u2014")}
          {statCard(t("battle.winRate"), tM.length > 0 ? `${winRate}%` : "\u2014", tM.length > 0 ? (winRate >= 60 ? T.win : winRate >= 40 ? T.mid : T.lose) : T.dim)}
          {statCard(t("battle.matches"), `${tM.length}${t("battle.matches")}`)}
          {statCard(t("battle.powerDelta"), pwrDelta !== null ? `${pwrDelta >= 0 ? "+" : ""}${numFormat(pwrDelta)}` : todayDaily.start ? numFormat(todayDaily.start) : "\u2014", pwrDelta !== null ? (pwrDelta >= 0 ? T.win : T.lose) : T.dim)}
          {streak.count >= 2 && statCard(streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose"), `${streak.count}`, streak.type === "win" ? T.win : T.mid)}
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                {showMyPicker ? (
                  <CharPicker value={myChar} onChange={(c) => { setMyChar(c); switchCharPower(c); setShowMyPicker(false); }} label={t("battle.selectChar")} placeholder={t("charPicker.select")} recent={recMy} autoOpen T={T} />
                ) : (
                  <div>
                    <div style={{ fontSize: 13, color: T.sub, marginBottom: 8, fontWeight: 600 }}>{t("battle.selectChar")}</div>
                    {myChar ? <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 8 }}>{fighterName(myChar, lang)}</div> : <div style={{ fontSize: 15, color: T.dim, marginBottom: 8 }}>{t("battle.notSelected")}</div>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setShowMyPicker(true)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.change")}<KeyHint keyLabel="9" T={T} /></button>
                      {recMy.filter((c) => c !== myChar).slice(0, 3).map((c) => (
                        <button key={c} onClick={() => { setMyChar(c); switchCharPower(c); }} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: T.inp, color: T.text, fontSize: 13, fontWeight: 600 }}>{fighterName(c, lang)}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>{myChar ? `${fighterName(myChar, lang)}${t("battle.startPower")}` : t("battle.power")}</span>
                  <KeyHint keyLabel="P" T={T} />
                </div>
                {prevEnd && !todayDaily.start && <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>{t("battle.autoCarryOver")}</div>}
                <PwrInput ref={powerRef} value={pStart} onChange={setPStart} placeholder="14,000,000" big T={T} pStart={pStart} pEnd={pEnd} savePower={savePower} />
              </div>
            </div>
            <button onClick={startBattle} disabled={!pStart || !myChar} style={{ width: "100%", padding: 16, border: "none", borderRadius: 14, background: (!pStart || !myChar) ? T.inp : T.accentGrad, color: (!pStart || !myChar) ? T.dim : "#fff", fontSize: 17, fontWeight: 800, boxShadow: (!pStart || !myChar) ? "none" : T.accentGlow, transition: "all .2s ease", marginBottom: 12 }}>{t("battle.startBattle")}<KeyHint keyLabel="Space" T={T} /></button>
          </div>
          {pcSidebar}
        </div>
        <BattleOverlays state={state} T={T} />
      </div>
    );
  }

  // PC: battle / postMatch / end
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {statCard(t("battle.winLoss"), tM.length > 0 ? `${tW}W - ${tL}L` : "\u2014")}
        {statCard(t("battle.winRate"), tM.length > 0 ? `${winRate}%` : "\u2014", tM.length > 0 ? (winRate >= 60 ? T.win : winRate >= 40 ? T.mid : T.lose) : T.dim)}
        {statCard(t("battle.matches"), `${tM.length}${t("battle.matches")}`)}
        {statCard(t("battle.powerDelta"), pwrDelta !== null ? `${pwrDelta >= 0 ? "+" : ""}${numFormat(pwrDelta)}` : todayDaily.start ? numFormat(todayDaily.start) : "\u2014", pwrDelta !== null ? (pwrDelta >= 0 ? T.win : T.lose) : T.dim)}
        {streak.count >= 2 && statCard(streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose"), `${streak.count}`, streak.type === "win" ? T.win : T.mid)}
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* PC Battle */}
          {phase === "battle" && (
            <div>
              {result && pendingResultBanner}

              <div style={{ ...cd, padding: "14px 18px", marginBottom: 10 }}>
                {showMyPicker ? (
                  <CharPicker value={myChar} onChange={(c) => { setMyChar(c); switchCharPower(c); setShowMyPicker(false); }} label={t("battle.selectChar")} placeholder={t("charPicker.select")} recent={recMy} autoOpen T={T} />
                ) : showOppPicker || (result && !oppChar) ? (
                  <div>
                    <CharPicker value={oppChar} onChange={(c) => { setOppChar(c); setShowOppPicker(false); if (result) { setTimeout(() => { recordMatch(result, c); setResult(null); }, 0); } }} label={t("battle.oppChar")} placeholder={t("charPicker.select")} recent={recOpp} autoOpen T={T} />
                    {recOpp.length > 0 && !oppChar && (
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {recOpp.slice(0, 5).map((c) => (
                          <button key={c} type="button" onClick={() => { setOppChar(c); setShowOppPicker(false); if (result) { setTimeout(() => { recordMatch(result, c); setResult(null); }, 0); } }} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: T.inp, color: T.text, fontSize: 13, fontWeight: 600 }}>{fighterName(c, lang)}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{t("battle.selectChar")}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        {myChar && <FighterIcon name={myChar} size={28} />}
                        <span style={{ fontSize: 15, fontWeight: 700, color: myChar ? T.text : T.dim, lineHeight: 1.35, wordBreak: "break-word" }}>{myChar ? fighterName(myChar, lang) : t("battle.notSelected")}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <button type="button" onClick={() => { setShowOppPicker(false); setShowMyPicker(true); }} style={{ ...btnR, padding: "8px 14px", fontSize: 12, background: T.inp, color: T.sub, border: `1px solid ${T.brd}` }}>{t("battle.change")}<KeyHint keyLabel="9" T={T} /></button>
                        {recMy.filter((c) => c !== myChar).slice(0, 3).map((c) => (
                          <button type="button" key={c} onClick={() => { setMyChar(c); switchCharPower(c); }} style={{ ...btnR, padding: "8px 14px", fontSize: 12, background: T.inp, color: T.text }}>{fighterName(c, lang)}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ minWidth: 0, borderLeft: `1px solid ${T.inp}`, paddingLeft: 14, marginLeft: -1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{t("battle.oppChar")}</div>
                        {oppChar && (
                          <button type="button" onClick={() => { setOppChar(""); setResult(null); }} style={{ border: "none", background: T.loseBg, color: T.lose, fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}><X size={12} /> {t("battle.clear")}</button>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        {oppChar && <FighterIcon name={oppChar} size={28} />}
                        <span style={{ fontSize: 15, fontWeight: 700, color: oppChar ? T.text : T.dim, lineHeight: 1.35, wordBreak: "break-word" }}>{oppChar ? fighterName(oppChar, lang) : t("battle.notSelected")}</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <button type="button" onClick={() => { setShowMyPicker(false); setShowOppPicker(true); }} style={{ ...btnR, padding: "8px 14px", fontSize: 12, background: T.inp, color: T.sub, border: `1px solid ${T.brd}` }}>{t("battle.change")}<KeyHint keyLabel="0" T={T} /></button>
                        {recOpp.filter((c) => c !== oppChar).slice(0, 5).map((c, i) => (
                          <button type="button" key={c} onClick={() => setOppChar(c)} style={{ ...btnR, padding: "8px 14px", fontSize: 12, background: oppChar === c ? T.accentSoft : T.inp, color: oppChar === c ? T.accent : T.text, border: oppChar === c ? `1px solid ${T.accentBorder}` : "none" }}>{fighterName(c, lang)}<KeyHint keyLabel={String(i + 1)} T={T} /></button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!result && (
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <button type="button" onClick={() => selectRes("win")} style={{ ...getPrimaryBtn(T, { variant: "win" }), flex: 1, padding: "18px 0", fontSize: 18 }}>{t("battle.win")}<KeyHint keyLabel="W" T={T} /></button>
                  <button type="button" onClick={() => selectRes("lose")} style={{ ...getPrimaryBtn(T, { variant: "lose" }), flex: 1, padding: "18px 0", fontSize: 18 }}>{t("battle.lose")}<KeyHint keyLabel="L" T={T} /></button>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button type="button" onClick={() => setPhase("end")} style={{ flex: 1, padding: 10, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.sub, fontSize: 12, fontWeight: 600 }}>{t("battle.endSession")}<KeyHint keyLabel="E" T={T} /></button>
                <button type="button" onClick={() => { setPhase("setup"); setShowOppPicker(false); setShowMyPicker(false); setResult(null); }} style={{ flex: 1, padding: 10, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.dim, fontSize: 12, fontWeight: 600 }}>{t("battle.changeChar")}<KeyHint keyLabel="Esc" T={T} /></button>
              </div>

              <StageSelector
                ref={stageRef}
                selectedStage={selectedStage}
                onSelect={(id) => setSelectedStage(id)}
                showHints
                suppressPointerFocus={suppressPointerFocus}
                matchupMatches={matchupMatches}
                historyHint={stageHistoryHint}
                T={T}
              />

              {myChar && (
                <div style={{ ...cd, padding: "12px 18px", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 4 }}>{fighterName(myChar, lang)} {t("battle.charMemo")}</div>
                  <textarea ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                    value={charMemoText} onChange={(e) => { setCharMemoText(e.target.value); const el = e.target; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
                    onBlur={saveCharMemoBlur}
                    placeholder={t("battle.charMemoPlaceholder")}
                    maxLength={500}
                    style={{ width: "100%", padding: "8px 10px", background: T.inp, border: "none", borderRadius: 8, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", lineHeight: 1.5, overflow: "hidden", minHeight: 40 }} />
                </div>
              )}
            </div>
          )}

          {/* PC postMatch */}
          {phase === "postMatch" && (
            <div>
              <div style={{ ...cd, textAlign: "center", padding: "28px 24px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, letterSpacing: 1.5, fontFamily: "'Chakra Petch', sans-serif" }}>{t("battle.recorded")}</div>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 8 }}>
                  <FighterIcon name={myChar} size={32} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{fighterName(myChar, lang)}</span>
                  <span style={{ fontSize: 14, color: T.dim }}>vs</span>
                  <FighterIcon name={oppChar} size={32} />
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{fighterName(oppChar, lang)}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <ResultBadge result={lastRes} size="hero" T={T} style={{ animation: "popIn .3s ease" }} />
                </div>
                <textarea ref={memoRef} value={memo} onChange={(e) => { setMemo(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} onBlur={saveMemoBlur} placeholder={t("battle.memo")} rows={1}
                  maxLength={500}
                  style={{ width: "100%", marginTop: 16, padding: "12px 16px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box", textAlign: "center", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.5 }} />
              </div>
              {/* Power update */}
              <div style={{ ...cd, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{t("battle.powerCurrent")}</span>
                <div style={{ flex: 1 }}><PwrInput value={pEnd} onChange={setPEnd} placeholder={t("battle.powerPlaceholder")} big={false} T={T} pStart={pStart} pEnd={pEnd} savePower={savePower} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button onClick={continueSame} style={{ ...getPrimaryBtn(T), flex: 2, padding: "16px 12px", fontSize: 15, whiteSpace: "nowrap" }}>{t("battle.continueSame")}<KeyHint keyLabel="N" T={T} /></button>
                <button onClick={changeOpp} style={{ flex: 1.2, padding: "16px 12px", border: `2px solid ${T.accent}`, borderRadius: 14, background: T.card, color: T.accent, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{t("battle.changeOpp")}<KeyHint keyLabel="C" T={T} /></button>
                <button onClick={changeChar} style={{ flex: 1, padding: "16px 12px", border: `1px solid ${T.brd}`, borderRadius: 14, background: T.card, color: T.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{t("battle.changeChar")}<KeyHint keyLabel="9" T={T} /></button>
                <button onClick={endSession} style={{ flex: 1, padding: "16px 12px", border: `1px solid ${T.brd}`, borderRadius: 14, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{t("battle.endSession")}<KeyHint keyLabel="E" T={T} /></button>
              </div>
              {/* Stage selection (PC) — placed after primary actions so it doesn't push them below the fold */}
              <StageSelector
                selectedStage={selectedStage}
                onSelect={(id) => saveStage(id)}
                showHints
                suppressPointerFocus={suppressPointerFocus}
                matchupMatches={matchupMatches}
                historyHint={stageHistoryHint}
                T={T}
                marginBottom={12}
              />
            </div>
          )}

          {/* PC end */}
          {phase === "end" && (() => {
            const oppStats = {};
            tM.forEach((m) => { if (!oppStats[m.oppChar]) oppStats[m.oppChar] = { w: 0, l: 0 }; m.result === "win" ? oppStats[m.oppChar].w++ : oppStats[m.oppChar].l++; });
            const dayStart = todayDaily.chars?.[myChar]?.start || Number(pStart);
            const dayEnd = pEnd ? Number(pEnd) : (todayDaily.chars?.[myChar]?.end || null);
            const pDelta = dayStart && dayEnd ? dayEnd - dayStart : null;
            return (
              <div style={{ animation: "fadeUp .2s ease" }}>
                <div style={{ background: T.tBg, borderRadius: 20, padding: "32px 28px", marginBottom: 20, boxShadow: T.accentGlow }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 2, marginBottom: 6, fontFamily: "'Chakra Petch', sans-serif" }}>{t("battle.todaySummary")}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 24 }}>{formatDateLong(today())}</div>
                  <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>{t("battle.winLoss")}</div>
                      <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>{tW}<span style={{ fontSize: 24, opacity: 0.6, margin: "0 6px" }}>:</span>{tL}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>{tM.length}{t("battle.matches")}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>{t("battle.winRate")}</div>
                      <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>{percentStr(tW, tM.length)}</div>
                    </div>
                  </div>
                  {Object.keys(oppStats).length > 0 && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 12 }}>
                      {Object.entries(oppStats).sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l)).map(([opp, s]) => (
                        <div key={opp} style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
                          <FighterIcon name={opp} size={20} />
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{fighterName(opp, lang)}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginLeft: "auto" }}>{s.w}W:{s.l}L</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {dayStart && (
                    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{t("battle.power")}</span>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{numFormat(dayStart)}</span>
                        {dayEnd && (<><span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{"\u2192"}</span><span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{numFormat(dayEnd)}</span>{pDelta !== null && <span style={{ fontSize: 13, fontWeight: 800, color: pDelta >= 0 ? T.winBright : T.loseBright, marginLeft: 4 }}>({pDelta >= 0 ? "+" : ""}{numFormat(pDelta)})</span>}</>)}
                      </div>
                    </div>
                  )}
                  {streak.count >= 2 && (
                    <div style={{ marginTop: 12, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                      <Zap size={16} color={streak.type === "win" ? T.winBright : T.loseBright} fill={streak.type === "win" ? T.winBright : T.loseBright} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{streak.count}{streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose")}</span>
                    </div>
                  )}
                </div>
                <div style={{ ...cd, padding: "20px 24px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{t("battle.endPower")}</div>
                  <div style={{ fontSize: 12, color: T.dim, marginBottom: 10 }}>{t("battle.endPowerDesc")}</div>
                  <PwrInput value={pEnd} onChange={setPEnd} placeholder={t("battle.endPower")} big T={T} pStart={pStart} pEnd={pEnd} savePower={savePower} />
                </div>
                <div style={{ ...cd, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t("battle.vipReached")}</div>
                    <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{t("battle.vipShareDesc")}</div>
                  </div>
                  <button onClick={() => { const d = { ...data }; if (!d.daily) d.daily = {}; if (!d.daily[today()]) d.daily[today()] = {}; d.daily[today()] = { ...d.daily[today()], vip: !d.daily[today()]?.vip }; onSave(d); }}
                    style={{ width: 54, height: 30, borderRadius: 15, border: "none", background: todayDaily.vip ? T.accent : "#555", position: "relative", flexShrink: 0, cursor: "pointer" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 13, background: "#fff", position: "absolute", top: 2, left: todayDaily.vip ? 26 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                  </button>
                </div>
                <div style={{ ...cd, padding: "16px 24px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t("battle.review")}</div>
                  <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3}
                    maxLength={2000}
                    style={{ width: "100%", padding: "8px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button onClick={() => saveEndSession(false)} style={{ ...getPrimaryBtn(T), flex: 2, padding: 16, fontSize: 15 }}>{t("battle.saveAndEnd")}<KeyHint keyLabel="Enter" T={T} /></button>
                  <button
                    onClick={async () => {
                      const blob = await generateCard();
                      saveEndSession(true, blob);
                    }}
                    disabled={generating}
                    style={{ flex: 1.4, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.accent, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <Share2 size={14} /> {generating ? "..." : t("battle.share")}<KeyHint keyLabel="S" T={T} />
                  </button>
                  <button onClick={() => setPhase("battle")} style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.backToBattle")}<KeyHint keyLabel="Esc" T={T} /></button>
                </div>

                {/* Hidden session card for image generation */}
                <div style={{ position: "absolute", left: -9999, top: 0 }}>
                  <SessionCard
                    ref={cardRef}
                    myChar={myChar}
                    tW={tW}
                    tL={tL}
                    tM={tM}
                    oppStats={oppStats}
                    dayStart={dayStart}
                    dayEnd={dayEnd}
                    streak={streak}
                    date={today()}
                    playerTag={data.settings?.playerTag || ""}
                    T={T}
                    lang={lang}
                  />
                </div>
              </div>
            );
          })()}
        </div>
        {pcSidebar}
      </div>
      <BattleOverlays state={state} T={T} />
    </div>
  );
}
