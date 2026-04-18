import { useRef, useMemo, useEffect } from "react";
import FreeMatchTab from "../free/FreeMatchTab";
import MobileBattle from "./MobileBattle";
import PCBattle from "./PCBattle";
import BroadcastBar from "../shared/BroadcastBar";
import { useBattleState } from "../../hooks/useBattleState";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useI18n } from "../../i18n/index.jsx";
import { Monitor } from "lucide-react";

export default function BattleTab({ data, onSave, T, isPC, battleMode, setBattleMode, tabIdx, modalsOpen, broadcastMode, setBroadcastMode, onOpenOverlayBuilder }) {
  const { t } = useI18n();

  const mode = battleMode || "ranked";
  const setMode = setBattleMode || (() => {});

  const state = useBattleState({ data, onSave, isPC });
  const memoRef = useRef(null);
  const stageRef = useRef(null);
  const powerRef = useRef(null);

  // When the user leaves ranked mode we clear any transient overlays
  // and unfinished picks so they don't flash back into view if/when
  // they switch to ranked again later.
  useEffect(() => {
    if (mode !== "ranked") {
      state.setShowMyPicker(false);
      state.setShowOppPicker(false);
      state.setSharePopupText(null);
      state.setSharePopupImage(null);
      state.setConfirmAction(null);
      state.setResult(null);
      state.setEditingStageIdx(null);
      if (state.phase === "postMatch") {
        state.setPhase("battle");
        state.setSelectedStage(null);
      }
    }
  // Only the mode switch should trigger this — state setters are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Shortcuts fire only when: on the battle tab, no modal is open, and ranked mode.
  // Free mode shares state.phase internally but its UI is different, so ranked shortcuts
  // must never leak into the free flow.
  const isActive = tabIdx === 0 && !modalsOpen && mode === "ranked";

  // Note: state changes on every render, so this useMemo doesn't
  // actually skip recomputation — but it expresses intent and keeps
  // the action object's identity stable within a single render.
  // The downstream useKeyboardShortcuts hook reads this through a
  // ref (actionsRef) so stale closures aren't a concern.
  const actions = useMemo(() => ({
    selectRes: state.selectRes,
    startBattle: state.startBattle,
    continueSame: state.continueSame,
    changeOpp: state.changeOpp,
    changeChar: state.changeChar,
    endSession: state.endSession,
    goBack: () => {
      if (state.phase === "battle") {
        state.setPhase("setup");
        state.setShowOppPicker(false);
        state.setShowMyPicker(false);
        state.setResult(null);
      } else if (state.phase === "postMatch") {
        state.saveMemo();
        state.setSelectedStage(null);
        state.setPhase("battle");
        state.setShowOppPicker(false);
        state.setResult(null);
      } else if (state.phase === "end") {
        state.setPhase("battle");
      }
    },
    focusStage: () => { stageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); },
    focusMemo: () => { memoRef.current?.focus(); },
    focusPower: () => { powerRef.current?.focus(); },
    selectRecentOpp: (c) => { state.setOppChar(c); },
    openOppPicker: () => { state.setShowMyPicker(false); state.setShowOppPicker(true); },
    openMyPicker: () => { state.setShowOppPicker(false); state.setShowMyPicker(true); },
    selectStage: (stageId) => {
      if (state.phase === "postMatch") {
        state.saveStage(state.selectedStage === stageId ? null : stageId);
      } else {
        state.setSelectedStage(state.selectedStage === stageId ? null : stageId);
      }
    },
    saveAndEnd: () => { state.saveEndSession(false); },
    shareAndEnd: () => { state.saveEndSession(true); },
    closeConfirm: () => { state.setConfirmAction(null); },
    closeMyPicker: () => { state.setShowMyPicker(false); },
    closeOppPicker: () => { state.setShowOppPicker(false); state.setResult(null); },
    closeShare: () => { state.setSharePopupText(null); state.setSharePopupImage(null); },
  }), [state]);

  useKeyboardShortcuts({
    phase: state.phase,
    isPC,
    isActive,
    result: state.result,
    oppChar: state.oppChar,
    recOpp: state.recOpp,
    showMyPicker: state.showMyPicker,
    showOppPicker: state.showOppPicker,
    sharePopupText: state.sharePopupText,
    confirmAction: state.confirmAction,
    actions,
  });

  // Mode toggle + broadcast toggle
  const modeToggle = (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      {[["ranked", t("battle.ranked")], ["free", t("free.freeMatch")]].map(([k, l]) => (
        <button key={k} type="button" onClick={() => setMode(k)} aria-pressed={mode === k} style={{
          flex: 1, minHeight: 40, padding: isPC ? "10px 0" : "9px 0", borderRadius: 10, border: "none",
          fontSize: isPC ? 13 : 12, fontWeight: mode === k ? 700 : 500, cursor: "pointer", textAlign: "center",
          background: mode === k ? T.accentGrad : T.inp, color: mode === k ? "#fff" : T.sub, transition: "all .15s ease",
          fontFamily: "inherit",
        }}>{l}</button>
      ))}
      <button
        type="button"
        onClick={() => setBroadcastMode(!broadcastMode)}
        aria-pressed={broadcastMode}
        aria-label={t("broadcast.toggle")}
        style={{
          minHeight: 40, padding: isPC ? "10px 14px" : "9px 12px", borderRadius: 10,
          border: broadcastMode ? `2px solid ${T.accent}` : "none",
          fontSize: isPC ? 12 : 11, fontWeight: broadcastMode ? 700 : 500, cursor: "pointer",
          background: broadcastMode ? T.accentSoft : T.inp,
          color: broadcastMode ? T.accent : T.sub,
          display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
          transition: "all .15s ease",
          fontFamily: "inherit",
        }}
      >
        <Monitor size={14} />
        {t("broadcast.toggle")}
      </button>
    </div>
  );

  const broadcastBar = broadcastMode && (
    <BroadcastBar
      myChar={state.myChar}
      tW={state.tW}
      tL={state.tL}
      winRate={state.winRate}
      streak={state.streak}
      pwrDelta={state.pwrDelta}
      T={T}
      isPC={isPC}
      lang={state.lang}
      onOpenBuilder={onOpenOverlayBuilder}
    />
  );

  const pcRootStyle = { display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0, height: "100%" };

  if (mode === "free") {
    return (
      <div style={isPC ? pcRootStyle : undefined}>
        <div style={isPC ? { flexShrink: 0 } : undefined}>
          {modeToggle}
          {broadcastBar}
        </div>
        <FreeMatchTab data={data} onSave={onSave} T={T} isPC={isPC} onBack={() => setMode("ranked")} tabIdx={tabIdx} modalsOpen={modalsOpen} />
      </div>
    );
  }

  if (!isPC) {
    return (
      <div>
        {modeToggle}
        {broadcastBar}
        <MobileBattle state={state} data={data} onSave={onSave} T={T} />
      </div>
    );
  }

  return (
    <div style={pcRootStyle}>
      <div style={{ flexShrink: 0 }}>
        {modeToggle}
        {broadcastBar}
      </div>
      <PCBattle state={state} data={data} onSave={onSave} T={T} memoRef={memoRef} stageRef={stageRef} powerRef={powerRef} />
    </div>
  );
}
