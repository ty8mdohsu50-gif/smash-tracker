import { useState, useMemo, useRef, useEffect } from "react";
import { fighterName } from "../constants/fighters";
import { STAGES, stageName } from "../constants/stages";
import { useI18n } from "../i18n/index.jsx";
import { useToast } from "../contexts/ToastContext";
import {
  today,
  formatDateLong,
  numFormat,
  percentStr,
  getStreak,
  recentChars,
  lastEndPower,
} from "../utils/format";

export function useBattleState({ data, onSave, isPC }) {
  const { t, lang } = useI18n();
  const toast = useToast();

  // Phase: setup -> battle -> postMatch -> end
  const [phase, setPhase] = useState("setup");
  const [myChar, setMyChar] = useState(data.settings.myChar || "");
  const [oppChar, setOppChar] = useState("");
  const [result, setResult] = useState(null);
  const [lastRes, setLastRes] = useState(null);
  const [memo, setMemo] = useState("");
  const [showMyPicker, setShowMyPicker] = useState(false);
  const [showOppPicker, setShowOppPicker] = useState(false);
  const [sharePopupText, setSharePopupText] = useState(null);
  const [sharePopupImage, setSharePopupImage] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingStageIdx, setEditingStageIdx] = useState(null);

  // Goals
  const [gGames, setGG] = useState(String(data.goals?.games || ""));
  const [gWR, setGWR] = useState(String(data.goals?.winRate || ""));

  // Memos
  const [reviewText, setReviewText] = useState(data.daily?.[today()]?.review || "");
  const [charMemoText, setCharMemoText] = useState(data.charMemos?.[data.settings.myChar || ""] || "");
  const [selectedStage, setSelectedStage] = useState(null);

  // Derived data
  const todayDaily = data.daily?.[today()] || {};
  const charPower = todayDaily.chars?.[myChar] || {};
  const prevEnd = lastEndPower(data.daily || {}, myChar);

  const [pStart, setPStart] = useState(charPower.end || charPower.start || prevEnd || (myChar ? 0 : ""));
  const [pEnd, setPEnd] = useState(charPower.end || todayDaily.end || "");

  const recMy = useMemo(() => recentChars(data.matches, "myChar"), [data]);
  const recOpp = useMemo(() => recentChars(data.matches, "oppChar"), [data]);

  const matchupNotesKey = useMemo(() => {
    if (!oppChar || !myChar) return null;
    const full = `${myChar}|${oppChar}`;
    return data.matchupNotes?.[full] != null ? full : oppChar;
  }, [oppChar, myChar, data.matchupNotes]);

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

  // Phase change effects
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
    }
    prevPhase.current = phase;
  }

  const phaseScrollRef = useRef(phase);
  useEffect(() => {
    if (isPC) return;
    const prev = phaseScrollRef.current;
    phaseScrollRef.current = phase;
    if (prev === "setup" && phase === "battle") window.scrollTo({ top: 0, behavior: "smooth" });
    else if (prev === "battle" && phase === "postMatch") window.scrollTo({ top: 0, behavior: "smooth" });
    else if (prev === "end" && phase === "setup") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase, isPC]);

  const prevOppRef = useRef(oppChar);
  if (prevOppRef.current !== oppChar) {
    prevOppRef.current = oppChar;
  }

  const prevMyCharRef = useRef(myChar);
  if (prevMyCharRef.current !== myChar) {
    setCharMemoText(data.charMemos?.[myChar] || "");
    prevMyCharRef.current = myChar;
  }

  // Actions

  // Open the share popup. The popup itself handles whether to attach
  // the image via the user-facing toggle, so we don't route through
  // navigator.share here anymore — the popup offers it as one of the
  // share options once the user has decided on image/no-image.
  const doShare = (text, imageBlob = null) => {
    setSharePopupText(text);
    setSharePopupImage(imageBlob || null);
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

  const suppressPointerFocus = (e) => {
    e.preventDefault();
  };

  const restoreScrollAfter = (y) => {
    if (y <= 0) return;
    const run = () => {
      if (window.scrollY < y - 12) window.scrollTo(0, y);
    };
    queueMicrotask(run);
    requestAnimationFrame(() => requestAnimationFrame(run));
    setTimeout(run, 80);
  };

  const saveCharMemoBlur = () => {
    const y = typeof window !== "undefined" ? window.scrollY : 0;
    onSave({ ...data, charMemos: { ...(data.charMemos || {}), [myChar]: charMemoText } });
    if (!isPC) restoreScrollAfter(y);
  };

  const saveMemoBlur = () => {
    const y = typeof window !== "undefined" ? window.scrollY : 0;
    saveMemo();
    if (!isPC && memo) restoreScrollAfter(y);
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
      stage: selectedStage || null,
    };
    const newMatches = [...data.matches, m];
    onSave({ ...data, matches: newMatches });

    setLastRes(r);
    setMemo("");
    toast.success(t("battle.toastRecorded"));
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
    setConfirmAction({
      message: t("common.deleteConfirm"),
      onConfirm: () => {
        const nm = [...data.matches];
        nm.splice(idx, 1);
        onSave({ ...data, matches: nm });
        setConfirmAction(null);
      },
    });
  };

  const updateMatchStage = (idx, newStage) => {
    const nm = [...data.matches];
    nm[idx] = { ...nm[idx], stage: newStage || undefined };
    onSave({ ...data, matches: nm });
    setEditingStageIdx(null);
  };

  const saveStage = (stageId) => {
    const y = typeof window !== "undefined" ? window.scrollY : 0;
    const nm = [...data.matches];
    const last = nm[nm.length - 1];
    if (!last) return;
    nm[nm.length - 1] = { ...last, stage: stageId };
    onSave({ ...data, matches: nm });
    setSelectedStage(stageId);
    if (!isPC) restoreScrollAfter(y);
  };

  // Phase transitions invoked from button handlers and from the
  // shortcut listener. Centralized so PCBattle, MobileBattle, and
  // the keyboard hook all execute the exact same sequence.
  const continueSame = () => {
    saveMemo();
    setSelectedStage(null);
    setPhase("battle");
    setShowOppPicker(false);
    setResult(null);
  };

  const changeOpp = () => {
    saveMemo();
    setSelectedStage(null);
    setOppChar("");
    setShowOppPicker(true);
    setPhase("battle");
    setResult(null);
  };

  const changeChar = () => {
    saveMemo();
    setOppChar("");
    setShowOppPicker(false);
    setShowMyPicker(false);
    setPhase("setup");
    setResult(null);
  };

  const endSession = () => {
    if (phase === "postMatch") saveMemo();
    setPhase("end");
  };

  const saveEndSession = (andShare, imageBlob = null) => {
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
    onSave(d);
    if (andShare) buildAndShare(imageBlob);
    else { setPhase("setup"); setShowOppPicker(false); }
  };

  const buildShareText = () => {
    const dayStart = todayDaily.chars?.[myChar]?.start || Number(pStart);
    const dayEnd = pEnd ? Number(pEnd) : (todayDaily.chars?.[myChar]?.end || null);
    const shareDelta = dayStart && dayEnd ? dayEnd - dayStart : null;
    const ss = { showChar: true, showMatchups: true, showPower: true, showRecord: true, showStages: true, ...(data.shareSettings || {}) };
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
    if (ss.showStages) {
      const stageMap = {};
      tM.filter((m) => m.stage).forEach((m) => {
        if (!stageMap[m.stage]) stageMap[m.stage] = { w: 0, l: 0 };
        m.result === "win" ? stageMap[m.stage].w++ : stageMap[m.stage].l++;
      });
      const stageEntries = STAGES.filter((s) => stageMap[s.id]).map((s) => {
        const d = stageMap[s.id];
        return `${stageName(s.id, lang)} ${d.w}W${d.l}L`;
      });
      if (stageEntries.length > 0) lines.push(stageEntries.join(" / "));
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

  const buildAndShare = (imageBlob) => doShare(buildShareText(), imageBlob);

  return {
    t, lang,
    // State
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
    // Derived
    todayDaily, charPower, prevEnd,
    recMy, recOpp,
    matchupNotesKey,
    tM, tW, tL,
    streak, goals, winRate, pwrDelta,
    // Actions
    doShare, savePower, saveMemo, suppressPointerFocus,
    saveCharMemoBlur, saveMemoBlur, saveGoals,
    switchCharPower, startBattle, recordMatch,
    selectRes, confirmOppAndRecord,
    deleteMatch, updateMatchStage, saveStage,
    continueSame, changeOpp, changeChar, endSession,
    saveEndSession, buildShareText, buildAndShare,
  };
}
