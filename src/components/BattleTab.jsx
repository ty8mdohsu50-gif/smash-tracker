import { useState, useMemo, useRef, useEffect } from "react";
import { X, Zap, Share2 } from "lucide-react";
import { FlashDashboard } from "./MatchupNotesEditor";
import CharPicker from "./CharPicker";
import FreeMatchTab from "./FreeMatchTab";
import SharePopup from "./SharePopup";
import Toast from "./Toast";
import FighterIcon from "./FighterIcon";
import { fighterName } from "../constants/fighters";
import { STAGES, stageName, stageImg } from "../constants/stages";
import { useI18n } from "../i18n/index.jsx";
import {
  today,
  formatDateWithDay,
  formatDateLong,
  formatDateShort,
  formatPower,
  rawPower,
  numFormat,
  percentStr,
  barColor,
  formatTime,
  blurOnEnter,
  getStreak,
  recentChars,
  lastEndPower,
} from "../utils/format";

export default function BattleTab({ data, onSave, T, isPC, battleMode, setBattleMode }) {
  const { t, lang } = useI18n();

  const mode = battleMode || "ranked";
  const setMode = setBattleMode || (() => {});

  // Phase: setup → battle → postMatch → end
  const [phase, setPhase] = useState("setup");
  const [myChar, setMyChar] = useState(data.settings.myChar || "");
  const [oppChar, setOppChar] = useState("");
  const [result, setResult] = useState(null);
  const [lastRes, setLastRes] = useState(null);
  const [memo, setMemo] = useState("");
  const [showPowerEdit, setShowPowerEdit] = useState(false);
  const [showMyPicker, setShowMyPicker] = useState(false);
  const [showOppPicker, setShowOppPicker] = useState(false);
  const [sharePopupText, setSharePopupText] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);
  const [toast, setToast] = useState(null);

  // Goals
  const [gGames, setGG] = useState(String(data.goals?.games || ""));
  const [gWR, setGWR] = useState(String(data.goals?.winRate || ""));

  // Memos
  const [counterEditText, setCounterEditText] = useState("");
  const [reviewText, setReviewText] = useState(data.daily?.[today()]?.review || "");
  const [charMemoText, setCharMemoText] = useState(data.charMemos?.[data.settings.myChar || ""] || "");
  const [hypothesisText, setHypothesisText] = useState("");
  const [reviewInsights, setReviewInsights] = useState(data.daily?.[today()]?.reviewInsights || { whatWorked: "", whatFailed: "", nextHypothesis: "" });
  const [selectedStage, setSelectedStage] = useState(null);

  // ── Derived data ──

  const todayDaily = data.daily?.[today()] || {};
  const charPower = todayDaily.chars?.[myChar] || {};
  const prevEnd = lastEndPower(data.daily || {}, myChar);

  const [pStart, setPStart] = useState(charPower.end || charPower.start || prevEnd || (myChar ? 0 : ""));
  const [pEnd, setPEnd] = useState(charPower.end || todayDaily.end || "");

  const recMy = useMemo(() => recentChars(data.matches, "myChar"), [data]);
  const recOpp = useMemo(() => recentChars(data.matches, "oppChar"), [data]);

  const prevSessionHypothesis = useMemo(() => {
    const dailyDates = Object.keys(data.daily || {}).sort().reverse();
    for (const d of dailyDates) {
      const h = data.daily[d]?.reviewInsights?.nextHypothesis;
      if (h && h.trim()) return h;
    }
    return null;
  }, [data]);

  const tM = useMemo(() => data.matches.filter((m) => m.date === today()), [data]);
  const tW = tM.filter((m) => m.result === "win").length;
  const tL = tM.length - tW;
  const streak = useMemo(() => getStreak(data.matches), [data]);
  const goals = data.goals || {};
  const winRate = tM.length > 0 ? Math.round((tW / tM.length) * 100) : 0;
  const pwrDelta = (() => {
    const cp = todayDaily.chars?.[myChar];
    if (cp?.start && cp?.end) return cp.end - cp.start;
    if (todayDaily.start && todayDaily.end) return todayDaily.end - todayDaily.start;
    return null;
  })();

  // ── Phase change effects ──

  const prevPhase = useRef(phase);
  if (prevPhase.current !== phase) {
    if (phase === "setup" && myChar) {
      const daily = data.daily?.[today()] || {};
      const cp = daily.chars?.[myChar] || {};
      const pe = lastEndPower(data.daily || {}, myChar);
      const newStart = cp.end || cp.start || pe || 0;
      if (newStart !== pStart) setPStart(newStart);
      setPEnd("");
      setReviewText(data.daily?.[today()]?.review || "");
      setReviewInsights(data.daily?.[today()]?.reviewInsights || { whatWorked: "", whatFailed: "", nextHypothesis: "" });
    }
    if (phase === "postMatch") setHypothesisText("");
    prevPhase.current = phase;
  }

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [phase]);

  const prevOppRef = useRef(oppChar);
  if (prevOppRef.current !== oppChar) {
    setCounterEditText(data.counterMemos?.[oppChar] || "");
    prevOppRef.current = oppChar;
  }

  const prevMyCharRef = useRef(myChar);
  if (prevMyCharRef.current !== myChar) {
    setCharMemoText(data.charMemos?.[myChar] || "");
    prevMyCharRef.current = myChar;
  }

  // ── Actions ──

  const doShare = async (text) => {
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch (_) { /* cancelled */ }
    }
    setSharePopupText(text);
  };

  const savePower = (s, e) => {
    const d = { ...data };
    if (!d.daily) d.daily = {};
    if (!d.daily[today()]) d.daily[today()] = {};
    const day = d.daily[today()];
    if (!day.chars) day.chars = {};
    const existing = day.chars[myChar] || {};
    day.chars[myChar] = { start: existing.start || (s ? Number(s) : null), end: e ? Number(e) : existing.end };
    if (!day.start) day.start = s ? Number(s) : null;
    if (e) day.end = Number(e);
    onSave(d);
  };

  const saveMemo = () => {
    if (!memo) return;
    const nm = [...data.matches];
    nm[nm.length - 1] = { ...nm[nm.length - 1], memo };
    onSave({ ...data, matches: nm });
  };

  const saveCounterMemo = () => {
    if (!oppChar) return;
    onSave({ ...data, counterMemos: { ...(data.counterMemos || {}), [oppChar]: counterEditText } });
  };

  const saveHypothesis = (text, result) => {
    const nm = [...data.matches];
    const last = nm[nm.length - 1];
    if (!last) return;
    nm[nm.length - 1] = { ...last, hypothesis: text || last.hypothesis, hypothesisResult: result !== undefined ? result : last.hypothesisResult };
    onSave({ ...data, matches: nm });
  };

  const saveGoals = () => onSave({ ...data, goals: { games: parseInt(gGames) || 0, winRate: parseInt(gWR) || 0 } });

  const switchCharPower = (charName) => {
    const daily = data.daily?.[today()] || {};
    const cp = daily.chars?.[charName] || {};
    const prev = lastEndPower(data.daily || {}, charName);
    setPStart(cp.end || cp.start || prev || 0);
    setPEnd(cp.end || "");
  };

  const startBattle = () => {
    if (!pStart || !myChar) return;
    const d = { ...data };
    if (!d.daily) d.daily = {};
    if (!d.daily[today()]) d.daily[today()] = {};
    const day = d.daily[today()];
    if (!day.chars) day.chars = {};
    const existingChar = day.chars[myChar] || {};
    day.chars[myChar] = { start: existingChar.start || Number(pStart), end: pEnd ? Number(pEnd) : existingChar.end };
    if (!day.start) day.start = Number(pStart);
    d.settings = { myChar };
    onSave(d);
    setPhase("battle");
  };

  const recordMatch = (r, currentOppChar) => {
    const opp = currentOppChar || oppChar;
    if (!opp) return;
    const m = {
      date: today(), time: new Date().toISOString(), myChar, oppChar: opp, result: r, memo: "",
      power: pEnd ? Number(pEnd) : (pStart ? Number(pStart) : null),
      startPower: pStart ? Number(pStart) : null,
      stage: null,
    };
    const newMatches = [...data.matches, m];
    onSave({ ...data, matches: newMatches });

    setLastRes(r);
    setMemo("");
    setSelectedStage(null);
    setCounterEditText(data.counterMemos?.[opp] || "");
    setToast(t("battle.toastRecorded"));
    setPhase("postMatch");
  };

  const selectRes = (r) => {
    if (oppChar) {
      recordMatch(r);
    } else {
      setResult(r);
      setShowOppPicker(true);
    }
  };

  const confirmOppAndRecord = () => {
    if (!oppChar || !result) return;
    recordMatch(result, oppChar);
    setResult(null);
  };

  const deleteMatch = (idx) => {
    const nm = [...data.matches];
    nm.splice(idx, 1);
    onSave({ ...data, matches: nm });
  };

  const saveStage = (stageId) => {
    const nm = [...data.matches];
    const last = nm[nm.length - 1];
    if (!last) return;
    nm[nm.length - 1] = { ...last, stage: stageId };
    onSave({ ...data, matches: nm });
    setSelectedStage(stageId);
  };

  const saveEndSession = (andShare) => {
    const d = JSON.parse(JSON.stringify(data));
    if (!d.daily) d.daily = {};
    if (!d.daily[today()]) d.daily[today()] = {};
    const day = d.daily[today()];
    if (!day.chars) day.chars = {};
    const existing = day.chars[myChar] || {};
    day.chars[myChar] = { start: existing.start || (pStart ? Number(pStart) : null), end: pEnd ? Number(pEnd) : existing.end };
    if (!day.start) day.start = pStart ? Number(pStart) : null;
    if (pEnd) day.end = Number(pEnd);
    day.review = reviewText;
    day.reviewInsights = reviewInsights;
    onSave(d);
    if (andShare) buildAndShare();
    else { setPhase("setup"); setShowPowerEdit(false); setShowOppPicker(false); }
  };

  const buildShareText = () => {
    const dayStart = todayDaily.chars?.[myChar]?.start || Number(pStart);
    const dayEnd = pEnd ? Number(pEnd) : (todayDaily.chars?.[myChar]?.end || null);
    const shareDelta = dayStart && dayEnd ? dayEnd - dayStart : null;
    const ss = { showChar: true, showMatchups: true, showPower: true, showRecord: true, ...(data.shareSettings || {}) };
    const lines = [`【SMASH TRACKER】${formatDateLong(today())}`];
    if (ss.showChar && myChar) {
      lines.push(fighterName(myChar, lang));
    }
    if (ss.showRecord) {
      lines.push(`${tW}${lang === "ja" ? "勝" : "W"} ${tL}${lang === "ja" ? "敗" : "L"}（${t("battle.winRate")} ${percentStr(tW, tM.length)}）`);
    }
    if (ss.showMatchups) {
      const oppCount = {};
      tM.forEach((m) => { oppCount[m.oppChar] = (oppCount[m.oppChar] || 0) + 1; });
      const oppSummary = Object.entries(oppCount)
        .sort((a, b) => b[1] - a[1])
        .map(([c, n]) => `vs ${fighterName(c, lang)} ×${n}`)
        .join(" / ");
      if (oppSummary) lines.push(oppSummary);
    }
    if (ss.showPower && dayStart) {
      lines.push(`${t("battle.power")}: ${numFormat(dayStart)} → ${numFormat(dayEnd || dayStart)}${shareDelta !== null ? ` (${shareDelta >= 0 ? "+" : ""}${numFormat(shareDelta)})` : ""}`);
    }
    if (todayDaily.vip) lines.push(t("share.vip"));
    const rev = data.daily?.[today()]?.review || reviewText;
    if (rev) lines.push("", rev);
    lines.push("", "#スマブラ #SmashTracker", "https://smash-tracker.pages.dev/");
    return lines.join("\n");
  };

  const buildAndShare = () => doShare(buildShareText());

  // ── UI helpers ──

  const cd = { background: T.card, borderRadius: 16, padding: "16px 18px", marginBottom: 12, boxShadow: T.sh, border: `1px solid ${T.brd}`, transition: "box-shadow .2s ease" };
  const goalInputStyle = { flex: 1, padding: "12px 14px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 16, fontWeight: 700, outline: "none", boxSizing: "border-box", fontFamily: "'Chakra Petch', sans-serif" };
  const activeBtn = (disabled) => ({ width: "100%", padding: 16, border: "none", borderRadius: 14, background: disabled ? T.inp : T.accentGrad, color: disabled ? T.dim : "#fff", fontSize: 17, fontWeight: 800, boxShadow: disabled ? "none" : T.accentGlow, transition: "all .2s ease", marginBottom: 12 });

  const pwrInput = (val, set, ph, big) => (
    <input type="text" inputMode="numeric" autoComplete="off" autoCorrect="off" data-lpignore="true" data-1p-ignore="true" data-form-type="other"
      value={formatPower(val)} onChange={(e) => set(rawPower(e.target.value))} onKeyDown={blurOnEnter} placeholder={ph}
      style={{ width: "100%", padding: big ? "14px 0" : "10px 0", background: "transparent", border: "none", borderBottom: `2px solid ${T.dimmer}`, color: T.text, fontSize: big ? 28 : 18, fontWeight: 800, outline: "none", boxSizing: "border-box", letterSpacing: big ? -1 : 0, fontFamily: "'Chakra Petch', sans-serif", transition: "border-color .2s ease" }}
      onFocus={(e) => { e.target.style.borderBottomColor = T.accent; }}
      onBlur={(e) => { e.target.style.borderBottomColor = T.dimmer; if (!big) savePower(pStart, pEnd); }}
    />
  );

  const recentMatchList = tM.length === 0
    ? <div style={{ textAlign: "center", padding: "32px 0", color: T.dim, fontSize: 13 }}>{t("battle.startMatching")}</div>
    : tM.slice().reverse().slice(0, 10).map((m, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${T.inp}` }}>
        <span style={{ width: 36, textAlign: "center", padding: "2px 0", borderRadius: 5, fontSize: 10, fontWeight: 800, background: m.result === "win" ? T.winBg : T.loseBg, color: m.result === "win" ? T.win : T.lose, flexShrink: 0 }}>{m.result === "win" ? "WIN" : "LOSE"}</span>
        <FighterIcon name={m.oppChar} size={22} />
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1 }}>{fighterName(m.oppChar, lang)}</span>
        <span style={{ fontSize: 11, color: T.dim, flexShrink: 0 }}>{formatTime(m.time)}</span>
      </div>
    ));

  // ── Mode toggle ──

  const modeToggle = (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      {[["ranked", t("battle.ranked")], ["free", t("free.freeMatch")]].map(([k, l]) => (
        <button key={k} onClick={() => setMode(k)} style={{
          flex: 1, padding: isPC ? "10px 0" : "9px 0", borderRadius: 10, border: "none",
          fontSize: isPC ? 13 : 12, fontWeight: mode === k ? 700 : 500, cursor: "pointer", textAlign: "center",
          background: mode === k ? T.accentGrad : T.inp, color: mode === k ? "#fff" : T.sub, transition: "all .15s ease",
        }}>{l}</button>
      ))}
    </div>
  );

  if (mode === "free") {
    return (
      <div>
        {modeToggle}
        <FreeMatchTab data={data} onSave={onSave} T={T} isPC={isPC} onBack={() => setMode("ranked")} />
      </div>
    );
  }

  // ── Today summary card ──

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

  // ── Goals + Milestone section ──

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
              lines.push("", "#SmashTracker #スマブラ", "https://smash-tracker.pages.dev/");
              doShare(lines.join("\n"));
            }}
            style={{ border: "none", background: T.inp, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}
          >
            <Share2 size={12} /> {t("battle.share")}
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: isPC ? "row" : "column", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 12, color: T.sub, fontWeight: 600, minWidth: 42 }}>{t("settings.games")}</span>
          <input type="number" value={gGames} onChange={(e) => setGG(e.target.value)} onBlur={saveGoals} placeholder="10" style={{ ...goalInputStyle, padding: "8px 10px", fontSize: 14 }} />
          <span style={{ fontSize: 12, color: T.sub }}>{t("settings.gamesUnit")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 12, color: T.sub, fontWeight: 600, minWidth: 42 }}>{t("settings.winRate")}</span>
          <input type="number" value={gWR} onChange={(e) => setGWR(e.target.value)} onBlur={saveGoals} placeholder="60" style={{ ...goalInputStyle, padding: "8px 10px", fontSize: 14 }} />
          <span style={{ fontSize: 12, color: T.sub }}>{t("settings.winRateUnit")}</span>
        </div>
      </div>
      {goals.games ? (
        <div style={{ marginBottom: goals.winRate && tM.length > 0 ? 8 : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 4, fontWeight: 600 }}>
            <span>{tM.length}/{goals.games}{t("settings.gamesUnit")}</span>
            <span style={{ color: tM.length >= goals.games ? T.win : T.text, fontWeight: 700 }}>{tM.length >= goals.games ? `✓ ${t("share.achieved")}` : `${Math.round((tM.length / goals.games) * 100)}%`}</span>
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

  // ── Opp context info (shown in battle when opp selected) ──

  const oppContextInfo = oppChar && myChar && !result && (() => {
    const oppMatches = data.matches.filter((m) => m.myChar === myChar && m.oppChar === oppChar);
    const oppW = oppMatches.filter((m) => m.result === "win").length;
    const oppL = oppMatches.length - oppW;
    const oppWinRate = oppMatches.length > 0 ? oppW / oppMatches.length : 0;
    const pastMemos = data.matches.filter((m) => m.myChar === myChar && m.oppChar === oppChar && m.memo).slice().reverse();
    return (
      <div style={{ ...cd, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FighterIcon name={oppChar} size={28} />
            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{fighterName(oppChar, lang)}</span>
          </div>
          {oppMatches.length > 0 && (
            <span style={{ fontSize: 16, fontWeight: 800, color: barColor(oppWinRate), fontFamily: "'Chakra Petch', sans-serif" }}>
              {oppW}W:{oppL}L
            </span>
          )}
        </div>
        {data.matchupNotes?.[`${myChar}|${oppChar}`]?.flash?.trim()
          ? <FlashDashboard noteKey={`${myChar}|${oppChar}`} data={data} T={T} />
          : <FlashDashboard noteKey={oppChar} data={data} T={T} />
        }
        {pastMemos.length > 0 && (
          <div style={{ borderTop: `1px solid ${T.inp}`, paddingTop: 8, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("battle.memo")}</div>
            <div style={{ maxHeight: 100, overflowY: "auto" }}>
              {pastMemos.slice(0, 5).map((m, i) => (
                <div key={i} style={{ fontSize: 12, color: T.sub, lineHeight: 1.5, padding: "2px 0" }}>
                  <span style={{ color: T.dim, fontSize: 10 }}>{formatDateShort(m.date)}</span> {m.memo}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  })();

  // ── Pending result banner (when win/lose pressed without opp selected) ──

  const pendingResultBanner = result && (
    <div style={{ ...cd, textAlign: "center", background: result === "win" ? T.winBg : T.loseBg, padding: "12px 16px", marginBottom: 8 }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: result === "win" ? T.win : T.lose }}>
        {result === "win" ? "WIN" : "LOSE"} - {t("battle.oppChar")}?
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // MOBILE LAYOUT
  // ══════════════════════════════════════════

  if (!isPC) {
    return (
      <div>
        {modeToggle}

        {/* ── SETUP ── */}
        {phase === "setup" && (
          <div style={{ animation: "fadeUp .2s ease" }}>
            {todaySummaryCard}

            {data.matches.length === 0 && (
              <div style={{ background: T.accentSoft, borderRadius: 16, padding: "18px 20px", marginBottom: 12, border: `1px solid ${T.accent}33` }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.accent, marginBottom: 10 }}>{t("battle.welcome")}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[t("battle.step1"), t("battle.step2"), t("battle.step3")].map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.accent, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                {pwrInput(pStart, setPStart, "14,000,000", true)}
              </div>
            )}

            <button onClick={startBattle} disabled={!pStart || !myChar} style={activeBtn(!pStart || !myChar)}>{t("battle.startBattle")}</button>

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

        {/* ── BATTLE ── */}
        {phase === "battle" && (
          <div style={{ animation: "fadeUp .2s ease" }}>
            {/* Status bar */}
            <div style={{ ...cd, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FighterIcon name={myChar} size={36} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{fighterName(myChar, lang)}</div>
                    {tM.length > 0 && <div style={{ fontSize: 13, color: T.dim, marginTop: 2 }}>{tM.length}{t("battle.matches")} {percentStr(tW, tM.length)}</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {tM.length > 0 && (
                    <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif" }}>
                      <span style={{ color: T.win }}>{tW}</span>
                      <span style={{ color: T.dimmer, fontSize: 16, margin: "0 4px" }}>:</span>
                      <span style={{ color: T.lose }}>{tL}</span>
                    </div>
                  )}
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginTop: 4 }}>
                    {numFormat(pStart)}{pEnd ? " → " + numFormat(pEnd) : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Pending result + opp selection */}
            {result && pendingResultBanner}

            {/* Opponent selection */}
            <div style={{ ...cd, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 15, color: T.text, fontWeight: 700 }}>{t("battle.oppChar")}</div>
                {oppChar && <button onClick={() => { setOppChar(""); setResult(null); }} style={{ border: "none", background: T.loseBg, color: T.lose, fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }}><X size={14} /> {t("battle.clear")}</button>}
              </div>
              {showOppPicker || (result && !oppChar) ? (
                <div>
                  <CharPicker value={oppChar} onChange={(c) => { setOppChar(c); setShowOppPicker(false); if (result) { setTimeout(() => confirmOppAndRecord(), 0); } }} placeholder={t("charPicker.select")} recent={recOpp} autoOpen T={T} />
                  {recOpp.length > 0 && !oppChar && (
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {recOpp.slice(0, 3).map((c) => (
                        <button key={c} onClick={() => { setOppChar(c); setShowOppPicker(false); if (result) { setOppChar(c); setTimeout(() => { recordMatch(result, c); setResult(null); }, 0); } }} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: T.inp, color: T.text, fontSize: 13, fontWeight: 600, transition: "all .15s ease" }}>{fighterName(c, lang)}</button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {oppChar ? (
                    <button onClick={() => setShowOppPicker(true)} style={{ width: "100%", padding: "14px 16px", background: T.card, border: `2px solid ${T.accent}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 10, textAlign: "left", fontSize: 15, fontWeight: 600, color: T.text }}>
                      <FighterIcon name={oppChar} size={32} />{fighterName(oppChar, lang)}
                    </button>
                  ) : (
                    <button onClick={() => setShowOppPicker(true)} style={{ width: "100%", padding: "14px 16px", background: T.card, border: `2px solid ${T.dimmer}`, borderRadius: 12, color: T.dim, textAlign: "left", fontSize: 15 }}>{t("charPicker.select")}</button>
                  )}
                </div>
              )}
            </div>

            {/* Previous hypothesis reminder */}
            {prevSessionHypothesis && !oppChar && (
              <div style={{ background: `${T.accent}10`, borderRadius: 12, border: `1px solid ${T.accent}30`, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 3 }}>🔬 {t("matchupNotes.prevHypothesis")}</div>
                <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{prevSessionHypothesis}</div>
              </div>
            )}

            {/* Context info */}
            {oppContextInfo}

            {/* Win/Lose buttons */}
            {!result && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => selectRes("win")} style={{ flex: 1, padding: "26px 0", border: "none", borderRadius: 16, background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", fontSize: 22, fontWeight: 900, boxShadow: "0 4px 16px rgba(34,197,94,.3)" }}>{t("battle.win")}</button>
                  <button onClick={() => selectRes("lose")} style={{ flex: 1, padding: "26px 0", border: "none", borderRadius: 16, background: "linear-gradient(135deg, #E11D48, #F43F5E)", color: "#fff", fontSize: 22, fontWeight: 900, boxShadow: "0 4px 16px rgba(244,63,94,.3)" }}>{t("battle.lose")}</button>
                </div>
              </div>
            )}

            <button onClick={() => setPhase("end")} style={{ width: "100%", padding: 14, marginTop: 12, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.sub, fontSize: 14, fontWeight: 600 }}>{t("battle.endSession")}</button>

            {/* Char memo (collapsible) */}
            {myChar && (
              <div style={{ ...cd, padding: "14px 18px", marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>{fighterName(myChar, lang)} {t("battle.charMemo")}</div>
                <textarea value={charMemoText} onChange={(e) => setCharMemoText(e.target.value)} onBlur={() => { onSave({ ...data, charMemos: { ...(data.charMemos || {}), [myChar]: charMemoText } }); }} placeholder={t("battle.charMemoPlaceholder")} rows={2}
                  style={{ width: "100%", padding: "10px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
              </div>
            )}
          </div>
        )}

        {/* ── POST MATCH ── */}
        {phase === "postMatch" && (
          <div style={{ animation: "fadeUp .2s ease" }}>
            <div style={{ ...cd, textAlign: "center", padding: "20px 18px" }}>
              <div style={{ display: "inline-block", padding: "6px 24px", borderRadius: 10, fontSize: 18, fontWeight: 800, background: lastRes === "win" ? T.winBg : T.loseBg, color: lastRes === "win" ? T.win : T.lose, animation: "popIn .3s ease" }}>
                {lastRes === "win" ? "WIN" : "LOSE"}
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 12, animation: "slideUp .3s ease .1s both" }}>
                <FighterIcon name={myChar} size={32} />
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{fighterName(myChar, lang)}</span>
                <span style={{ fontSize: 12, color: T.dim }}>vs</span>
                <FighterIcon name={oppChar} size={32} />
                <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{fighterName(oppChar, lang)}</span>
              </div>
              <textarea value={memo} onChange={(e) => { setMemo(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} onBlur={saveMemo} placeholder={t("battle.memo")} rows={1}
                style={{ width: "100%", marginTop: 12, padding: "10px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", textAlign: "center", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.5 }} />
            </div>

            {/* Hypothesis */}
            <div style={{ ...cd, padding: "12px 16px", animation: "slideUp .2s ease .1s both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 13 }}>🔬</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{t("matchupNotes.hypothesis")}</span>
              </div>
              <textarea value={hypothesisText} onChange={(e) => setHypothesisText(e.target.value)} onBlur={() => saveHypothesis(hypothesisText)} placeholder={t("matchupNotes.hypothesisPlaceholder")} rows={1}
                style={{ width: "100%", padding: "8px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
              {hypothesisText.trim() && (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {[["confirmed", t("matchupNotes.confirmed"), T.win], ["denied", t("matchupNotes.denied"), T.lose]].map(([v, l, c]) => {
                    const last = data.matches[data.matches.length - 1];
                    const active = last?.hypothesisResult === v;
                    return (
                      <button key={v} onClick={() => saveHypothesis(hypothesisText, active ? null : v)} style={{
                        flex: 1, padding: "6px 0", borderRadius: 8, border: active ? `2px solid ${c}` : `1px solid ${T.brd}`,
                        background: active ? `${c}18` : T.card, color: active ? c : T.sub, fontSize: 11, fontWeight: 700,
                      }}>{active ? "✓ " : ""}{l}</button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stage selection (mobile) */}
            <div style={{ ...cd, padding: "12px 16px", animation: "slideUp .2s ease .15s both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 13 }}>🗺️</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>{t("stages.selectStage")}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {STAGES.map((s) => {
                  const active = selectedStage === s.id;
                  return (
                    <button key={s.id} onClick={() => saveStage(active ? null : s.id)} style={{
                      border: `2px solid ${active ? T.accent : T.brd}`, borderRadius: 8, padding: 0, background: "none",
                      overflow: "hidden", cursor: "pointer", opacity: active ? 1 : 0.7, transition: "all .15s ease",
                      boxShadow: active ? T.accentGlow : "none",
                    }}>
                      <img src={stageImg(s.id)} alt={s.jp} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                      <div style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? T.accent : T.sub, padding: "3px 4px", textAlign: "center", background: T.inp, lineHeight: 1.2 }}>
                        {lang === "ja" ? s.jp : s.en}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Power update */}
            <div style={{ ...cd, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{t("battle.powerCurrent")}</span>
              {pwrInput(pEnd, setPEnd, t("battle.powerPlaceholder"), false)}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, animation: "slideUp .3s ease .3s both" }}>
              <button onClick={() => { saveMemo(); setPhase("battle"); setShowOppPicker(false); setResult(null); }} style={{ width: "100%", padding: 20, border: "none", borderRadius: 14, background: T.accentGrad, color: "#fff", fontSize: 17, fontWeight: 800, boxShadow: T.accentGlow }}>{t("battle.continueSame")}</button>
              <button onClick={() => { saveMemo(); setOppChar(""); setShowOppPicker(true); setPhase("battle"); setResult(null); }} style={{ width: "100%", padding: 16, border: `2px solid ${T.accent}`, borderRadius: 12, background: T.card, color: T.accent, fontSize: 15, fontWeight: 700, transition: "all .15s ease" }}>{t("battle.changeOpp")}</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { saveMemo(); setOppChar(""); setShowOppPicker(false); setPhase("setup"); setResult(null); }} style={{ flex: 1, padding: 14, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.text, fontSize: 13, fontWeight: 600, transition: "all .15s ease" }}>{t("battle.changeChar")}</button>
                <button onClick={() => { saveMemo(); setPhase("end"); }} style={{ flex: 1, padding: 14, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.endSession")}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── END (endSession + summary merged) ── */}
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
                      {dayEnd && (<><span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>→</span><span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{numFormat(dayEnd)}</span>
                        {pDelta !== null && <span style={{ fontSize: 13, fontWeight: 800, color: pDelta >= 0 ? "#4ade80" : "#f87171", marginLeft: 4 }}>({pDelta >= 0 ? "+" : ""}{numFormat(pDelta)})</span>}</>)}
                    </div>
                  </div>
                )}
                {streak.count >= 2 && (
                  <div style={{ marginTop: 12, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap size={16} color={streak.type === "win" ? "#4ade80" : "#f87171"} fill={streak.type === "win" ? "#4ade80" : "#f87171"} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{streak.count}{streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose")}</span>
                  </div>
                )}
              </div>

              {/* End power input */}
              <div style={cd}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{t("battle.endPower")}</div>
                <div style={{ fontSize: 12, color: T.dim, marginBottom: 8 }}>{t("battle.endPowerDesc")}</div>
                {pwrInput(pEnd, setPEnd, t("battle.endPower"), true)}
              </div>

              {/* VIP toggle */}
              <div style={{ ...cd, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t("battle.vipReached")}</div>
                  <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{t("battle.vipShareDesc")}</div>
                </div>
                <button onClick={() => { const d = { ...data }; if (!d.daily) d.daily = {}; if (!d.daily[today()]) d.daily[today()] = {}; d.daily[today()] = { ...d.daily[today()], vip: !d.daily[today()]?.vip }; onSave(d); }}
                  style={{ width: 54, height: 30, borderRadius: 15, border: "none", background: todayDaily.vip ? T.accent : "#555", position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 13, background: "#fff", position: "absolute", top: 2, left: todayDaily.vip ? 26 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                </button>
              </div>

              {/* Structured Review */}
              <div style={cd}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t("battle.review")}</div>
                {[
                  ["whatWorked", t("matchupNotes.whatWorked"), t("matchupNotes.whatWorkedPlaceholder"), T.win],
                  ["whatFailed", t("matchupNotes.whatFailed"), t("matchupNotes.whatFailedPlaceholder"), T.lose],
                  ["nextHypothesis", t("matchupNotes.nextHypothesis"), t("matchupNotes.nextHypothesisPlaceholder"), T.accent],
                ].map(([key, label, ph, color]) => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                    <textarea value={reviewInsights[key] || ""} onChange={(e) => setReviewInsights((p) => ({ ...p, [key]: e.target.value }))} placeholder={ph} rows={2}
                      style={{ width: "100%", padding: "8px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
                  </div>
                ))}
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder={t("battle.reviewPlaceholder")} rows={2}
                  style={{ width: "100%", padding: "8px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
              </div>

              {/* Actions */}
              <button onClick={() => saveEndSession(false)} style={{ width: "100%", padding: 16, border: "none", borderRadius: 14, background: T.accentGrad, color: "#fff", fontSize: 16, fontWeight: 800, boxShadow: T.accentGlow }}>{t("battle.saveAndEnd")}</button>
              <button onClick={() => saveEndSession(true)} style={{ width: "100%", padding: 14, marginTop: 8, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.sub, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Share2 size={14} /> {t("battle.share")}
              </button>
              <button onClick={() => setPhase("battle")} style={{ width: "100%", padding: 12, marginTop: 8, border: "none", background: "transparent", color: T.dim, fontSize: 13 }}>{t("battle.backToBattle")}</button>
            </div>
          );
        })()}

        {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </div>
    );
  }

  // ══════════════════════════════════════════
  // PC LAYOUT
  // ══════════════════════════════════════════

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

  // PC sidebar content
  const pcSidebar = (
    <div style={{ flex: 2, minWidth: 300, background: T.card, borderRadius: 20, padding: 0, border: `1px solid ${T.brd}`, boxShadow: T.sh, position: "sticky", top: 90, display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "calc(100vh - 120px)" }}>
      {phase === "battle" && oppChar ? (
        <>
          <div style={{ padding: "20px 24px 12px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FighterIcon name={oppChar} size={32} />
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{fighterName(oppChar, lang)}</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
            {data.matchupNotes?.[`${myChar}|${oppChar}`]?.flash?.trim()
              ? <FlashDashboard noteKey={`${myChar}|${oppChar}`} data={data} T={T} />
              : <FlashDashboard noteKey={oppChar} data={data} T={T} />
            }
            {(() => {
              const pastMatches = data.matches.filter((m) => m.myChar === myChar && m.oppChar === oppChar).slice().reverse();
              if (!pastMatches.length) return null;
              const w = pastMatches.filter((m) => m.result === "win").length;
              const l = pastMatches.length - w;
              const rate = pastMatches.length ? w / pastMatches.length : 0;
              return (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: T.dim, fontWeight: 600 }}>{pastMatches.length}{t("common.matches")} {w}W {l}L</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: barColor(rate), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(w, pastMatches.length)}</span>
                  </div>
                  <div style={{ maxHeight: 240, overflowY: "auto" }}>
                    {pastMatches.map((m, i) => (
                      <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${T.inp}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 36, textAlign: "center", padding: "2px 0", borderRadius: 5, fontSize: 10, fontWeight: 800, background: m.result === "win" ? T.winBg : T.loseBg, color: m.result === "win" ? T.win : T.lose }}>{m.result === "win" ? "WIN" : "LOSE"}</span>
                          <span style={{ fontSize: 11, color: T.dim }}>{formatDateShort(m.date)}</span>
                          <span style={{ fontSize: 11, color: T.dim }}>{formatTime(m.time)}</span>
                        </div>
                        {m.memo && <div style={{ fontSize: 12, color: T.sub, marginTop: 2, paddingLeft: 42 }}>{m.memo}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      ) : (
        <>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.inp}`, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t("settings.todayGoal")}</span>
              {(goals.games || goals.winRate) && tM.length > 0 && (
                <button onClick={() => {
                  const lines = [`【SMASH TRACKER】${t("share.todayGoal")}`];
                  if (goals.games) lines.push(`${tM.length}/${goals.games}${t("settings.gamesUnit")} ${tM.length >= goals.games ? t("share.achieved") : ""}`);
                  if (goals.winRate) lines.push(`${t("settings.winRate")} ${winRate}% / ${goals.winRate}% ${winRate >= goals.winRate ? t("share.achieved") : ""}`);
                  lines.push("", "#SmashTracker #スマブラ", "https://smash-tracker.pages.dev/");
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
                {goals.games ? (<div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.sub, marginBottom: 3 }}><span>{tM.length}/{goals.games}{t("settings.gamesUnit")}</span><span style={{ color: tM.length >= goals.games ? T.win : T.text, fontWeight: 700 }}>{tM.length >= goals.games ? `✓ ${t("share.achieved")}` : `${Math.round((tM.length / goals.games) * 100)}%`}</span></div><div style={{ height: 5, background: T.inp, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${Math.min(100, (tM.length / goals.games) * 100)}%`, height: "100%", background: T.win, borderRadius: 3 }} /></div></div>) : null}
                {goals.winRate && tM.length > 0 ? (<div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.sub, marginBottom: 3 }}><span>{t("settings.winRate")} {goals.winRate}%</span><span style={{ color: winRate >= goals.winRate ? T.win : T.lose, fontWeight: 700 }}>{winRate}%</span></div><div style={{ height: 5, background: T.inp, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${Math.min(100, (tW / tM.length) * 100)}%`, height: "100%", background: winRate >= goals.winRate ? T.win : T.lose, borderRadius: 3 }} /></div></div>) : null}
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px 24px" }}>
            {tM.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, marginBottom: 8 }}>{t("battle.recent")}</div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {tM.slice().reverse().map((m, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: `1px solid ${T.inp}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 36, textAlign: "center", padding: "2px 0", borderRadius: 5, fontSize: 10, fontWeight: 800, background: m.result === "win" ? T.winBg : T.loseBg, color: m.result === "win" ? T.win : T.lose }}>{m.result === "win" ? "WIN" : "LOSE"}</span>
                        <FighterIcon name={m.oppChar} size={18} />
                        <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{fighterName(m.oppChar, lang)}</span>
                        <span style={{ fontSize: 10, color: T.dim, marginLeft: "auto" }}>{formatTime(m.time)}</span>
                      </div>
                      {m.memo && <div style={{ fontSize: 11, color: T.sub, marginTop: 2, paddingLeft: 42 }}>{m.memo}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // PC: setup phase
  if (phase === "setup") {
    return (
      <div>
        {modeToggle}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          {statCard(t("battle.winLoss"), tM.length > 0 ? `${tW}W - ${tL}L` : "\u2014")}
          {statCard(t("battle.winRate"), tM.length > 0 ? `${winRate}%` : "\u2014", tM.length > 0 ? (winRate >= 60 ? T.win : winRate >= 40 ? "#FF9F0A" : T.lose) : T.dim)}
          {statCard(t("battle.matches"), `${tM.length}${t("battle.matches")}`)}
          {statCard(t("battle.powerDelta"), pwrDelta !== null ? `${pwrDelta >= 0 ? "+" : ""}${numFormat(pwrDelta)}` : todayDaily.start ? numFormat(todayDaily.start) : "\u2014", pwrDelta !== null ? (pwrDelta >= 0 ? T.win : T.lose) : T.dim)}
          {streak.count >= 2 && statCard(streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose"), `${streak.count}`, streak.type === "win" ? T.win : "#FF9F0A")}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: 3, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {data.matches.length === 0 && (
              <div style={{ background: T.accentSoft, borderRadius: 16, padding: "20px 24px", border: `1px solid ${T.accent}33` }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.accent, marginBottom: 12 }}>{t("battle.welcome")}</div>
                <div style={{ display: "flex", gap: 24 }}>
                  {[t("battle.step1"), t("battle.step2"), t("battle.step3")].map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.accent, color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                {showMyPicker ? (
                  <CharPicker value={myChar} onChange={(c) => { setMyChar(c); switchCharPower(c); setShowMyPicker(false); }} label={t("battle.selectChar")} placeholder={t("charPicker.select")} recent={recMy} autoOpen T={T} />
                ) : (
                  <div>
                    <div style={{ fontSize: 13, color: T.sub, marginBottom: 8, fontWeight: 600 }}>{t("battle.selectChar")}</div>
                    {myChar ? <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 8 }}>{fighterName(myChar, lang)}</div> : <div style={{ fontSize: 15, color: T.dim, marginBottom: 8 }}>{t("battle.notSelected")}</div>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setShowMyPicker(true)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.change")}</button>
                      {recMy.filter((c) => c !== myChar).slice(0, 3).map((c) => (
                        <button key={c} onClick={() => { setMyChar(c); switchCharPower(c); }} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: T.inp, color: T.text, fontSize: 13, fontWeight: 600 }}>{fighterName(c, lang)}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 8, fontWeight: 600 }}>{myChar ? `${fighterName(myChar, lang)}${t("battle.startPower")}` : t("battle.power")}</div>
                {prevEnd && !todayDaily.start && <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>{t("battle.autoCarryOver")}</div>}
                {pwrInput(pStart, setPStart, "14,000,000", true)}
              </div>
            </div>
            <button onClick={startBattle} disabled={!pStart || !myChar} style={activeBtn(!pStart || !myChar)}>{t("battle.startBattle")}</button>
          </div>
          {pcSidebar}
        </div>
        {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
      </div>
    );
  }

  // PC: battle / postMatch / end
  return (
    <div>
      {modeToggle}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {statCard(t("battle.winLoss"), tM.length > 0 ? `${tW}W - ${tL}L` : "\u2014")}
        {statCard(t("battle.winRate"), tM.length > 0 ? `${winRate}%` : "\u2014", tM.length > 0 ? (winRate >= 60 ? T.win : winRate >= 40 ? "#FF9F0A" : T.lose) : T.dim)}
        {statCard(t("battle.matches"), `${tM.length}${t("battle.matches")}`)}
        {statCard(t("battle.powerDelta"), pwrDelta !== null ? `${pwrDelta >= 0 ? "+" : ""}${numFormat(pwrDelta)}` : todayDaily.start ? numFormat(todayDaily.start) : "\u2014", pwrDelta !== null ? (pwrDelta >= 0 ? T.win : T.lose) : T.dim)}
        {streak.count >= 2 && statCard(streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose"), `${streak.count}`, streak.type === "win" ? T.win : "#FF9F0A")}
      </div>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 3, minWidth: 0 }}>

          {/* PC Battle */}
          {phase === "battle" && (
            <div>
              {/* Previous hypothesis reminder (PC) */}
              {prevSessionHypothesis && !oppChar && (
                <div style={{ background: `${T.accent}10`, borderRadius: 12, border: `1px solid ${T.accent}30`, padding: "12px 16px", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 3 }}>🔬 {t("matchupNotes.prevHypothesis")}</div>
                  <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{prevSessionHypothesis}</div>
                </div>
              )}

              {result && pendingResultBanner}

              <div style={{ ...cd, padding: "20px 24px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>{t("battle.oppChar")}</div>
                  {oppChar && <button onClick={() => { setOppChar(""); setResult(null); }} style={{ border: "none", background: "transparent", color: T.lose, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}><X size={12} /> {t("battle.clear")}</button>}
                </div>
                {oppChar && !showOppPicker && <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8 }}>{fighterName(oppChar, lang)}</div>}
                {showOppPicker || (result && !oppChar) ? (
                  <CharPicker value={oppChar} onChange={(c) => { setOppChar(c); setShowOppPicker(false); if (result) { setTimeout(() => { recordMatch(result, c); setResult(null); }, 0); } }} placeholder={t("charPicker.select")} recent={recOpp} autoOpen T={T} />
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {recOpp.slice(0, 5).map((c) => (
                      <button key={c} onClick={() => setOppChar(c)} style={{ padding: "8px 16px", borderRadius: 10, border: oppChar === c ? `2px solid ${T.accent}` : "none", background: oppChar === c ? T.accentSoft : T.inp, color: oppChar === c ? T.accent : T.text, fontSize: 13, fontWeight: 600, transition: "all .15s ease" }}>{fighterName(c, lang)}</button>
                    ))}
                    <button onClick={() => setShowOppPicker(true)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px dashed ${T.dimmer}`, background: "transparent", color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.other")}</button>
                  </div>
                )}
              </div>

              {!result && (
                <div style={{ display: "flex", gap: 16 }}>
                  <button onClick={() => selectRes("win")} style={{ flex: 1, padding: "24px 0", border: "none", borderRadius: 16, background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", fontSize: 22, fontWeight: 800, boxShadow: "0 4px 16px rgba(34,197,94,.3)" }}>{t("battle.win")}</button>
                  <button onClick={() => selectRes("lose")} style={{ flex: 1, padding: "24px 0", border: "none", borderRadius: 16, background: "linear-gradient(135deg, #E11D48, #F43F5E)", color: "#fff", fontSize: 22, fontWeight: 800, boxShadow: "0 4px 16px rgba(244,63,94,.3)" }}>{t("battle.lose")}</button>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => setPhase("end")} style={{ flex: 1, padding: 12, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.endSession")}</button>
                <button onClick={() => { setPhase("setup"); setShowPowerEdit(false); setShowOppPicker(false); setResult(null); }} style={{ flex: 1, padding: 12, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.dim, fontSize: 13, fontWeight: 600 }}>{t("battle.changeChar")}</button>
              </div>

              {myChar && (
                <div style={{ ...cd, padding: "16px 20px", marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>{fighterName(myChar, lang)} {t("battle.charMemo")}</div>
                  <textarea value={charMemoText} onChange={(e) => setCharMemoText(e.target.value)} onBlur={() => { onSave({ ...data, charMemos: { ...(data.charMemos || {}), [myChar]: charMemoText } }); }} placeholder={t("battle.charMemoPlaceholder")} rows={2}
                    style={{ width: "100%", padding: "10px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
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
                  <span style={{ display: "inline-block", padding: "6px 24px", borderRadius: 10, fontSize: 16, fontWeight: 800, background: lastRes === "win" ? T.winBg : T.loseBg, color: lastRes === "win" ? T.win : T.lose, animation: "popIn .3s ease" }}>{lastRes === "win" ? "WIN" : "LOSE"}</span>
                </div>
                <textarea value={memo} onChange={(e) => { setMemo(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} onBlur={saveMemo} placeholder={t("battle.memo")} rows={1}
                  style={{ width: "100%", marginTop: 16, padding: "12px 16px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box", textAlign: "center", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.5 }} />
              </div>
              {/* Hypothesis (PC) */}
              <div style={{ ...cd, padding: "14px 20px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>🔬</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{t("matchupNotes.hypothesis")}</span>
                </div>
                <textarea value={hypothesisText} onChange={(e) => setHypothesisText(e.target.value)} onBlur={() => saveHypothesis(hypothesisText)} placeholder={t("matchupNotes.hypothesisPlaceholder")} rows={1}
                  style={{ width: "100%", padding: "8px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
                {hypothesisText.trim() && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {[["confirmed", t("matchupNotes.confirmed"), T.win], ["denied", t("matchupNotes.denied"), T.lose]].map(([v, l, c]) => {
                      const last = data.matches[data.matches.length - 1];
                      const active = last?.hypothesisResult === v;
                      return (
                        <button key={v} onClick={() => saveHypothesis(hypothesisText, active ? null : v)} style={{
                          flex: 1, padding: "6px 0", borderRadius: 8, border: active ? `2px solid ${c}` : `1px solid ${T.brd}`,
                          background: active ? `${c}18` : T.card, color: active ? c : T.sub, fontSize: 12, fontWeight: 700,
                        }}>{active ? "✓ " : ""}{l}</button>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Stage selection (PC) */}
              <div style={{ ...cd, padding: "14px 20px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>🗺️</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.sub }}>{t("stages.selectStage")}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                  {STAGES.map((s) => {
                    const active = selectedStage === s.id;
                    return (
                      <button key={s.id} onClick={() => saveStage(active ? null : s.id)} style={{
                        border: `2px solid ${active ? T.accent : T.brd}`, borderRadius: 8, padding: 0, background: "none",
                        overflow: "hidden", cursor: "pointer", opacity: active ? 1 : 0.7, transition: "all .15s ease",
                        boxShadow: active ? T.accentGlow : "none",
                      }}>
                        <img src={stageImg(s.id)} alt={s.jp} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                        <div style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? T.accent : T.sub, padding: "3px 4px", textAlign: "center", background: T.inp, lineHeight: 1.2 }}>
                          {lang === "ja" ? s.jp : s.en}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Power update */}
              <div style={{ ...cd, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{t("battle.powerCurrent")}</span>
                <div style={{ flex: 1 }}>{pwrInput(pEnd, setPEnd, t("battle.powerPlaceholder"), false)}</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { saveMemo(); setPhase("battle"); setShowOppPicker(false); setResult(null); }} style={{ flex: 2, padding: "16px 12px", border: "none", borderRadius: 14, background: T.accentGrad, color: "#fff", fontSize: 15, fontWeight: 800, boxShadow: T.accentGlow, whiteSpace: "nowrap" }}>{t("battle.continueSame")}</button>
                <button onClick={() => { saveMemo(); setOppChar(""); setShowOppPicker(true); setPhase("battle"); setResult(null); }} style={{ flex: 1.2, padding: "16px 12px", border: `2px solid ${T.accent}`, borderRadius: 14, background: T.card, color: T.accent, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{t("battle.changeOpp")}</button>
                <button onClick={() => { saveMemo(); setOppChar(""); setShowOppPicker(false); setPhase("setup"); setResult(null); }} style={{ flex: 1, padding: "16px 12px", border: `1px solid ${T.brd}`, borderRadius: 14, background: T.card, color: T.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{t("battle.changeChar")}</button>
                <button onClick={() => { saveMemo(); setPhase("end"); }} style={{ flex: 1, padding: "16px 12px", border: `1px solid ${T.brd}`, borderRadius: 14, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{t("battle.endSession")}</button>
              </div>
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
                        {dayEnd && (<><span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>→</span><span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{numFormat(dayEnd)}</span>{pDelta !== null && <span style={{ fontSize: 13, fontWeight: 800, color: pDelta >= 0 ? "#4ade80" : "#f87171", marginLeft: 4 }}>({pDelta >= 0 ? "+" : ""}{numFormat(pDelta)})</span>}</>)}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ ...cd, padding: "20px 24px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{t("battle.endPower")}</div>
                  <div style={{ fontSize: 12, color: T.dim, marginBottom: 10 }}>{t("battle.endPowerDesc")}</div>
                  {pwrInput(pEnd, setPEnd, t("battle.endPower"), true)}
                </div>
                <div style={{ ...cd, padding: "16px 24px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t("battle.review")}</div>
                  {[
                    ["whatWorked", t("matchupNotes.whatWorked"), t("matchupNotes.whatWorkedPlaceholder"), T.win],
                    ["whatFailed", t("matchupNotes.whatFailed"), t("matchupNotes.whatFailedPlaceholder"), T.lose],
                    ["nextHypothesis", t("matchupNotes.nextHypothesis"), t("matchupNotes.nextHypothesisPlaceholder"), T.accent],
                  ].map(([key, label, ph, color]) => (
                    <div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4 }}>{label}</div>
                      <textarea value={reviewInsights[key] || ""} onChange={(e) => setReviewInsights((p) => ({ ...p, [key]: e.target.value }))} placeholder={ph} rows={2}
                        style={{ width: "100%", padding: "8px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
                    </div>
                  ))}
                  <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder={t("battle.reviewPlaceholder")} rows={2}
                    style={{ width: "100%", padding: "8px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button onClick={() => saveEndSession(false)} style={{ flex: 2, padding: 16, border: "none", borderRadius: 12, background: T.accentGrad, color: "#fff", fontSize: 15, fontWeight: 800, boxShadow: T.accentGlow }}>{t("battle.saveAndEnd")}</button>
                  <button onClick={() => saveEndSession(true)} style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.sub, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Share2 size={14} /> {t("battle.share")}</button>
                  <button onClick={() => setPhase("battle")} style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.backToBattle")}</button>
                </div>
              </div>
            );
          })()}
        </div>
        {pcSidebar}
      </div>
      {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
