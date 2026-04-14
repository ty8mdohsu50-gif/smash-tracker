import { useMemo } from "react";
import { X, Zap, Share2 } from "lucide-react";
import { BattleNotes } from "../shared/MatchupNotesEditor";
import CharPicker from "../shared/CharPicker";
import SessionCard from "../shared/SessionCard";
import FighterIcon from "../shared/FighterIcon";
import RecentMatchList from "./RecentMatchList";
import BattleOverlays from "./BattleOverlays";
import StageSelector from "./StageSelector";
import ResultBadge from "../shared/ResultBadge";
import { fighterName } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { useSessionCard } from "../../hooks/useSessionCard";
import {
  today,
  formatDateWithDay,
  formatDateLong,
  numFormat,
  percentStr,
  barColor,
  formatDateShort,
  formatTime,
} from "../../utils/format";
import { getCardStyle, getActiveBtn, getBtnR, getPrimaryBtn, PwrInput } from "./battleStyles";

export default function MobileBattle({ state, data, onSave, T }) {
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
    todayDaily, prevEnd, charPower,
    recMy, recOpp,
    matchupNotesKey,
    tM, tW, tL,
    streak, goals, winRate, pwrDelta,
    doShare, savePower, saveMemo, suppressPointerFocus,
    saveCharMemoBlur, saveMemoBlur, saveGoals,
    switchCharPower, startBattle, recordMatch,
    selectRes, confirmOppAndRecord,
    deleteMatch, updateMatchStage, saveStage,
    continueSame, changeOpp, changeChar, endSession,
    saveEndSession,
  } = state;

  const { cardRef, generating, imageBlob, generateCard, clearImage } = useSessionCard();

  const cd = getCardStyle(T);
  const btnR = getBtnR();

  // Past matches with this exact myChar vs oppChar matchup, fed
  // into the StageSelector to overlay per-stage history.
  const matchupMatches = useMemo(
    () => (myChar && oppChar ? data.matches.filter((m) => m.myChar === myChar && m.oppChar === oppChar) : []),
    [data.matches, myChar, oppChar],
  );

  // Recent match list
  const recentMatchList = tM.length === 0
    ? <div style={{ textAlign: "center", padding: "32px 0", color: T.dim, fontSize: 13 }}>{t("battle.startMatching")}</div>
    : (
      <RecentMatchList
        matches={tM}
        allMatches={data.matches}
        editingStageIdx={editingStageIdx}
        setEditingStageIdx={setEditingStageIdx}
        deleteMatch={deleteMatch}
        updateMatchStage={updateMatchStage}
        T={T}
        lang={lang}
        size="comfortable"
        maxItems={10}
      />
    );

  // Today summary card
  const todaySummaryCard = tM.length > 0 && (
    <div style={{ ...cd, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, letterSpacing: 1, marginBottom: 8, fontFamily: "'Chakra Petch', sans-serif" }}>
        {t("battle.today")}  {formatDateWithDay(today())}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, fontFamily: "'Chakra Petch', sans-serif" }}>
            <span style={{ color: T.win }}>{tW}</span>
            <span style={{ color: T.dimmer, fontSize: 16, margin: "0 3px" }}>:</span>
            <span style={{ color: T.lose }}>{tL}</span>
          </div>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>{tM.length}{t("battle.matches")}</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: T.text, fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(tW, tM.length)}</div>
          <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>{t("battle.winRate")}</div>
        </div>
        {streak.count >= 2 && (
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Zap size={16} fill={streak.type === "win" ? T.win : T.lose} color={streak.type === "win" ? T.win : T.lose} />
              <span style={{ fontSize: 22, fontWeight: 900, color: streak.type === "win" ? T.win : T.lose, fontFamily: "'Chakra Petch', sans-serif" }}>{streak.count}</span>
            </div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>{streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose")}</div>
          </div>
        )}
        {pwrDelta !== null && (
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: pwrDelta >= 0 ? T.win : T.lose, fontFamily: "'Chakra Petch', sans-serif" }}>
              {pwrDelta >= 0 ? "+" : ""}{numFormat(pwrDelta)}
            </div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 4 }}>{t("battle.powerDelta")}</div>
          </div>
        )}
      </div>
    </div>
  );

  // Goals section
  const goalsSection = (
    <div style={{ ...cd, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t("settings.todayGoal")}</span>
        {(goals.games || goals.winRate) && tM.length > 0 && (
          <button
            onClick={() => {
              const lines = [`【SMASH TRACKER】${t("share.todayGoal")}`];
              if (goals.games) lines.push(`${tM.length}/${goals.games}${t("settings.gamesUnit")} ${tM.length >= goals.games ? t("share.achieved") : ""}`);
              if (goals.winRate) lines.push(`${t("settings.winRate")} ${winRate}% / ${goals.winRate}% ${winRate >= goals.winRate ? t("share.achieved") : ""}`);
              lines.push("", "#\u30B9\u30DE\u30D6\u30E9 #SmashTracker", "https://smash-tracker.pages.dev/");
              doShare(lines.join("\n"));
            }}
            style={{ border: "none", background: T.inp, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}
          >
            <Share2 size={12} /> {t("battle.share")}
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 11, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{t("settings.games")}</span>
          <input type="number" value={gGames} onChange={(e) => setGG(e.target.value)} onBlur={saveGoals} placeholder="10" style={{ width: "100%", flex: 1, padding: "6px 8px", background: T.inp, border: "none", borderRadius: 8, color: T.text, fontSize: 13, fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "'Chakra Petch', sans-serif", minWidth: 0 }} />
          <span style={{ fontSize: 11, color: T.sub, flexShrink: 0 }}>{t("settings.gamesUnit")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 11, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{t("settings.winRate")}</span>
          <input type="number" value={gWR} onChange={(e) => setGWR(e.target.value)} onBlur={saveGoals} placeholder="60" style={{ width: "100%", flex: 1, padding: "6px 8px", background: T.inp, border: "none", borderRadius: 8, color: T.text, fontSize: 13, fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "'Chakra Petch', sans-serif", minWidth: 0 }} />
          <span style={{ fontSize: 11, color: T.sub, flexShrink: 0 }}>{t("settings.winRateUnit")}</span>
        </div>
      </div>
      {goals.games ? (
        <div style={{ marginBottom: goals.winRate && tM.length > 0 ? 8 : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 4, fontWeight: 600 }}>
            <span>{tM.length}/{goals.games}{t("settings.gamesUnit")}</span>
            <span style={{ color: tM.length >= goals.games ? T.win : T.text, fontWeight: 700 }}>{tM.length >= goals.games ? `\u2713 ${t("share.achieved")}` : `${Math.round((tM.length / goals.games) * 100)}%`}</span>
          </div>
          <div style={{ height: 5, background: T.inp, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (tM.length / goals.games) * 100)}%`, height: "100%", background: T.win, borderRadius: 3, transition: "width .3s ease" }} />
          </div>
        </div>
      ) : null}
      {goals.winRate && tM.length > 0 ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 4, fontWeight: 600 }}>
            <span>{t("settings.winRate")} {goals.winRate}%</span>
            <span style={{ color: winRate >= goals.winRate ? T.win : T.lose, fontWeight: 700 }}>{winRate}%</span>
          </div>
          <div style={{ height: 5, background: T.inp, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (tW / tM.length) * 100)}%`, height: "100%", background: winRate >= goals.winRate ? T.win : T.lose, borderRadius: 3, transition: "width .3s ease" }} />
          </div>
        </div>
      ) : null}
    </div>
  );

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
              <div key={i} style={{ fontSize: 12, color: T.sub, lineHeight: 1.5, padding: "6px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.inp}` : "none" }}>
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

  return (
    <div>
      {/* SETUP */}
      {phase === "setup" && (
        <div style={{ animation: "fadeUp .2s ease" }}>
          {todaySummaryCard}

          {/* Char selection */}
          <div style={{ ...cd, paddingBottom: 18 }}>
            {showMyPicker ? (
              <CharPicker value={myChar} onChange={(c) => { setMyChar(c); switchCharPower(c); setShowMyPicker(false); }} label={t("battle.selectChar")} placeholder={t("charPicker.select")} recent={recMy} autoOpen T={T} />
            ) : (
              <div>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{t("battle.selectChar")}</div>
                {myChar ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <FighterIcon name={myChar} size={32} />
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{fighterName(myChar, lang)}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 15, color: T.dim, marginBottom: 4 }}>{t("battle.notSelected")}</div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => setShowMyPicker(true)} style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 600, transition: "all .15s ease" }}>{t("battle.change")}</button>
                  {recMy.filter((c) => c !== myChar).slice(0, 2).map((c) => (
                    <button key={c} onClick={() => { setMyChar(c); switchCharPower(c); }} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: T.inp, color: T.text, fontSize: 12, fontWeight: 600, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "all .15s ease" }}>{fighterName(c, lang)}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Power input */}
          {myChar && (
            <div style={cd}>
              <div style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{fighterName(myChar, lang)}{t("battle.startPower")}</div>
              {prevEnd && !charPower.start && <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>{t("battle.autoCarryOver")}</div>}
              <PwrInput value={pStart} onChange={setPStart} placeholder="14,000,000" big T={T} pStart={pStart} pEnd={pEnd} savePower={savePower} />
            </div>
          )}

          <button onClick={startBattle} disabled={!pStart || !myChar} style={getActiveBtn(T, !pStart || !myChar)}>{t("battle.startBattle")}</button>

          {goalsSection}

          {/* Recent matches */}
          {tM.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("battle.recent")}</div>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>{recentMatchList}</div>
            </div>
          )}
        </div>
      )}

      {/* BATTLE */}
      {phase === "battle" && (
        <div style={{ animation: "fadeUp .2s ease" }}>
          <div style={{ ...cd, padding: "10px 14px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "'Chakra Petch', sans-serif" }}>
                {tM.length > 0 ? (
                  <><span style={{ color: T.win }}>{tW}</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: T.lose }}>{tL}</span><span style={{ color: T.dim, fontSize: 12, fontWeight: 600, marginLeft: 6 }}>{tM.length}{t("battle.matches")} {percentStr(tW, tM.length)}</span></>
                ) : <span style={{ color: T.dim, fontSize: 12 }}>{t("battle.matches")} 0</span>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.dim }}>{numFormat(pStart)}{pEnd ? ` \u2192 ${numFormat(pEnd)}` : ""}</div>
            </div>
          </div>

          {result && pendingResultBanner}

          <div style={{ ...cd, padding: "12px 14px" }}>
            {showMyPicker ? (
              <CharPicker value={myChar} onChange={(c) => { setMyChar(c); switchCharPower(c); setShowMyPicker(false); }} label={t("battle.selectChar")} placeholder={t("charPicker.select")} recent={recMy} autoOpen T={T} />
            ) : showOppPicker || (result && !oppChar) ? (
              <div>
                <CharPicker value={oppChar} onChange={(c) => { setOppChar(c); setShowOppPicker(false); if (result) { setTimeout(() => confirmOppAndRecord(), 0); } }} label={t("battle.oppChar")} placeholder={t("charPicker.select")} recent={recOpp} autoOpen T={T} />
                {recOpp.length > 0 && !oppChar && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {recOpp.slice(0, 3).map((c) => (
                      <button key={c} type="button" onClick={() => { setOppChar(c); setShowOppPicker(false); if (result) { setTimeout(() => { recordMatch(result, c); setResult(null); }, 0); } }} style={{ ...btnR, background: T.inp, color: T.text }}>{fighterName(c, lang)}</button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{t("battle.selectChar")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {myChar && <FighterIcon name={myChar} size={28} />}
                    <span style={{ fontSize: 14, fontWeight: 700, color: myChar ? T.text : T.dim, lineHeight: 1.35, wordBreak: "break-word" }}>{myChar ? fighterName(myChar, lang) : t("battle.notSelected")}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <button type="button" onClick={() => { setShowOppPicker(false); setShowMyPicker(true); }} style={{ ...btnR, background: T.inp, color: T.sub, border: `1px solid ${T.brd}` }}>{t("battle.change")}</button>
                    {recMy.filter((c) => c !== myChar).slice(0, 3).map((c) => (
                      <button type="button" key={c} onClick={() => { setMyChar(c); switchCharPower(c); }} style={{ ...btnR, background: T.inp, color: T.text }}>{fighterName(c, lang)}</button>
                    ))}
                  </div>
                </div>
                <div style={{ minWidth: 0, borderLeft: `1px solid ${T.inp}`, paddingLeft: 12, marginLeft: -1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{t("battle.oppChar")}</div>
                    {oppChar && (
                      <button type="button" onClick={() => { setOppChar(""); setResult(null); }} style={{ border: "none", background: T.loseBg, color: T.lose, fontSize: 11, fontWeight: 600, padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}><X size={12} /> {t("battle.clear")}</button>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    {oppChar && <FighterIcon name={oppChar} size={28} />}
                    <span style={{ fontSize: 14, fontWeight: 700, color: oppChar ? T.text : T.dim, lineHeight: 1.35, wordBreak: "break-word" }}>{oppChar ? fighterName(oppChar, lang) : t("battle.notSelected")}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <button type="button" onClick={() => { setShowMyPicker(false); setShowOppPicker(true); }} style={{ ...btnR, background: T.inp, color: T.sub, border: `1px solid ${T.brd}` }}>{t("battle.change")}</button>
                    {recOpp.filter((c) => c !== oppChar).slice(0, 3).map((c) => (
                      <button type="button" key={c} onClick={() => setOppChar(c)} style={{ ...btnR, background: T.inp, color: T.text }}>{fighterName(c, lang)}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {!result && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => selectRes("win")} style={{ ...getPrimaryBtn(T, { variant: "win" }), flex: 1, padding: "26px 0", fontSize: 22, fontWeight: 900 }}>{t("battle.win")}</button>
                <button type="button" onClick={() => selectRes("lose")} style={{ ...getPrimaryBtn(T, { variant: "lose" }), flex: 1, padding: "26px 0", fontSize: 22, fontWeight: 900 }}>{t("battle.lose")}</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => setPhase("end")} style={{ flex: 1, padding: 14, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.endSession")}</button>
            <button type="button" onClick={() => { setPhase("setup"); setShowOppPicker(false); setShowMyPicker(false); setResult(null); }} style={{ flex: 1, padding: 14, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.dim, fontSize: 13, fontWeight: 600 }}>{t("battle.changeChar")}</button>
          </div>

          {/* Stage selection */}
          <StageSelector
            selectedStage={selectedStage}
            onSelect={(id) => setSelectedStage(id)}
            suppressPointerFocus={suppressPointerFocus}
            matchupMatches={matchupMatches}
            T={T}
            marginTop={10}
          />

          {/* Char memo */}
          {myChar && (
            <div style={{ ...cd, padding: "10px 14px", marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, marginBottom: 4 }}>{fighterName(myChar, lang)} {t("battle.charMemo")}</div>
              <textarea
                ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.max(36, el.scrollHeight) + "px"; } }}
                value={charMemoText} onChange={(e) => { setCharMemoText(e.target.value); const el = e.target; el.style.height = "auto"; el.style.height = Math.max(36, el.scrollHeight) + "px"; }}
                onBlur={saveCharMemoBlur}
                placeholder={t("battle.charMemoPlaceholder")}
                maxLength={500}
                style={{ width: "100%", padding: "6px 8px", background: T.inp, border: "none", borderRadius: 8, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", lineHeight: 1.5, overflow: "hidden", minHeight: 36 }}
              />
            </div>
          )}

          {/* Battle notes */}
          {matchupNotesKey && !result && (
            <>
              <BattleNotes noteKey={matchupNotesKey} data={data} T={T} onSave={onSave} sections={["flash"]} />
              {rankedPrepReferenceBlock}
              <BattleNotes noteKey={matchupNotesKey} data={data} T={T} onSave={onSave} sections={["gameplan"]} />
              <BattleNotes noteKey={matchupNotesKey} data={data} T={T} onSave={onSave} sections={["bans"]} />
            </>
          )}
        </div>
      )}

      {/* POST MATCH */}
      {phase === "postMatch" && (
        <div style={{ animation: "fadeUp .2s ease" }}>
          <div style={{ ...cd, textAlign: "center", padding: "20px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, letterSpacing: 1.5, fontFamily: "'Chakra Petch', sans-serif", marginBottom: 8 }}>{t("battle.recorded")}</div>
            <ResultBadge result={lastRes} size="hero" T={T} style={{ animation: "popIn .3s ease" }} />
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 12, animation: "slideUp .3s ease .1s both" }}>
              <FighterIcon name={myChar} size={32} />
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{fighterName(myChar, lang)}</span>
              <span style={{ fontSize: 12, color: T.dim }}>vs</span>
              <FighterIcon name={oppChar} size={32} />
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{fighterName(oppChar, lang)}</span>
            </div>
            <textarea value={memo} onChange={(e) => { setMemo(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} onBlur={saveMemoBlur} placeholder={t("battle.memo")} rows={1}
              maxLength={500}
              style={{ width: "100%", marginTop: 12, padding: "10px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", textAlign: "center", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.5 }} />
          </div>

          {/* Power update */}
          <div style={{ ...cd, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <span style={{ fontSize: 12, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{t("battle.powerCurrent")}</span>
            <PwrInput value={pEnd} onChange={setPEnd} placeholder={t("battle.powerPlaceholder")} big={false} T={T} pStart={pStart} pEnd={pEnd} savePower={savePower} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, animation: "slideUp .3s ease .3s both" }}>
            <button onClick={continueSame} style={{ ...getPrimaryBtn(T), width: "100%", padding: 20 }}>{t("battle.continueSame")}</button>
            <button onClick={changeOpp} style={{ width: "100%", padding: 16, border: `2px solid ${T.accent}`, borderRadius: 12, background: T.card, color: T.accent, fontSize: 15, fontWeight: 700, transition: "all .15s ease" }}>{t("battle.changeOpp")}</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={changeChar} style={{ flex: 1, padding: 14, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.text, fontSize: 13, fontWeight: 600, transition: "all .15s ease" }}>{t("battle.changeChar")}</button>
              <button onClick={endSession} style={{ flex: 1, padding: 14, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.endSession")}</button>
            </div>
          </div>

          {/* Stage selection (mobile) — placed after primary actions */}
          <StageSelector
            selectedStage={selectedStage}
            onSelect={(id) => saveStage(id)}
            suppressPointerFocus={suppressPointerFocus}
            matchupMatches={matchupMatches}
            T={T}
            marginTop={12}
          />
        </div>
      )}

      {/* END */}
      {phase === "end" && (() => {
        const oppStats = {};
        tM.forEach((m) => { if (!oppStats[m.oppChar]) oppStats[m.oppChar] = { w: 0, l: 0 }; m.result === "win" ? oppStats[m.oppChar].w++ : oppStats[m.oppChar].l++; });
        const dayStart = todayDaily.chars?.[myChar]?.start || Number(pStart);
        const dayEnd = pEnd ? Number(pEnd) : (todayDaily.chars?.[myChar]?.end || null);
        const pDelta = dayStart && dayEnd ? dayEnd - dayStart : null;
        return (
          <div style={{ animation: "fadeUp .2s ease" }}>
            {/* Summary card */}
            <div style={{ background: T.tBg, borderRadius: 20, padding: "28px 22px", marginBottom: 14, boxShadow: T.accentGlow }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 2, marginBottom: 6, fontFamily: "'Chakra Petch', sans-serif" }}>{t("battle.todaySummary")}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 20 }}>{formatDateLong(today())}</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>{t("battle.winLoss")}</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>{tW}<span style={{ fontSize: 20, opacity: 0.6, margin: "0 4px" }}>:</span>{tL}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{tM.length}{t("battle.matches")}</div>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>{t("battle.winRate")}</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>{percentStr(tW, tM.length)}</div>
                </div>
              </div>
              {Object.keys(oppStats).length > 0 && (
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
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
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{t("battle.power")}</div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{numFormat(dayStart)}</span>
                    {dayEnd && (<><span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{"\u2192"}</span><span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{numFormat(dayEnd)}</span>
                      {pDelta !== null && <span style={{ fontSize: 13, fontWeight: 800, color: pDelta >= 0 ? T.winBright : T.loseBright, marginLeft: 4 }}>({pDelta >= 0 ? "+" : ""}{numFormat(pDelta)})</span>}</>)}
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

            {/* End power input */}
            <div style={cd}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{t("battle.endPower")}</div>
              <div style={{ fontSize: 12, color: T.dim, marginBottom: 8 }}>{t("battle.endPowerDesc")}</div>
              <PwrInput value={pEnd} onChange={setPEnd} placeholder={t("battle.endPower")} big T={T} pStart={pStart} pEnd={pEnd} savePower={savePower} />
            </div>

            {/* VIP toggle */}
            <div style={{ ...cd, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t("battle.vipReached")}</div>
                <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{t("battle.vipShareDesc")}</div>
              </div>
              <button onClick={() => { const d = { ...data }; if (!d.daily) d.daily = {}; if (!d.daily[today()]) d.daily[today()] = {}; d.daily[today()] = { ...d.daily[today()], vip: !d.daily[today()]?.vip }; onSave(d); }}
                style={{ width: 54, height: 30, borderRadius: 15, border: "none", background: todayDaily.vip ? T.accent : "#555", position: "relative", flexShrink: 0, cursor: "pointer" }}>
                <div style={{ width: 26, height: 26, borderRadius: 13, background: "#fff", position: "absolute", top: 2, left: todayDaily.vip ? 26 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
              </button>
            </div>

            {/* Review */}
            <div style={cd}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t("battle.review")}</div>
              <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3}
                maxLength={2000}
                style={{ width: "100%", padding: "8px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
            </div>

            {/* Actions */}
            <button onClick={() => saveEndSession(false)} style={{ ...getPrimaryBtn(T), width: "100%", padding: 16, fontSize: 16 }}>{t("battle.saveAndEnd")}</button>
            <button
              onClick={async () => {
                const blob = await generateCard();
                saveEndSession(true, blob);
              }}
              disabled={generating}
              style={{ width: "100%", padding: 14, marginTop: 8, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.accent, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Share2 size={14} /> {generating ? "..." : t("battle.share")}
            </button>
            <button onClick={() => setPhase("battle")} style={{ width: "100%", padding: 12, marginTop: 8, border: "none", background: "transparent", color: T.dim, fontSize: 13 }}>{t("battle.backToBattle")}</button>

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

      <BattleOverlays state={state} T={T} />
    </div>
  );
}
