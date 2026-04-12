import { useRef, useCallback } from "react";
import FreeMatchTab from "../free/FreeMatchTab";
import MobileBattle from "./MobileBattle";
import PCBattle from "./PCBattle";
import BroadcastBar from "../shared/BroadcastBar";
import { useBattleState } from "../../hooks/useBattleState";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useI18n } from "../../i18n/index.jsx";
import { Monitor } from "lucide-react";

export default function BattleTab({ data, onSave, T, isPC, battleMode, setBattleMode, tabIdx, showSettings, broadcastMode, setBroadcastMode }) {
  const { t } = useI18n();

  const mode = battleMode || "ranked";
  const setMode = setBattleMode || (() => {});

  const state = useBattleState({ data, onSave, T, isPC });
  const memoRef = useRef(null);
  const stageRef = useRef(null);

  const isActive = tabIdx === 0 && !showSettings;

  const actions = useCallback(() => ({
    selectRes: state.selectRes,
    startBattle: state.startBattle,
    continueSame: () => {
      state.saveMemo();
      state.setSelectedStage(null);
      state.setPhase("battle");
      state.setShowOppPicker(false);
      state.setResult(null);
    },
    changeOpp: () => {
      state.saveMemo();
      state.setSelectedStage(null);
      state.setOppChar("");
      state.setShowOppPicker(true);
      state.setPhase("battle");
      state.setResult(null);
    },
    endSession: () => {
      if (state.phase === "postMatch") state.saveMemo();
      state.setPhase("end");
    },
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
    closeShare: () => { state.setSharePopupText(null); },
  }), [state])();

  useKeyboardShortcuts({
    phase: state.phase,
    isPC,
    isActive,
    result: state.result,
    oppChar: state.oppChar,
    myChar: state.myChar,
    pStart: state.pStart,
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
        <button key={k} onClick={() => setMode(k)} style={{
          flex: 1, padding: isPC ? "10px 0" : "9px 0", borderRadius: 10, border: "none",
          fontSize: isPC ? 13 : 12, fontWeight: mode === k ? 700 : 500, cursor: "pointer", textAlign: "center",
          background: mode === k ? T.accentGrad : T.inp, color: mode === k ? "#fff" : T.sub, transition: "all .15s ease",
        }}>{l}</button>
      ))}
      <button onClick={() => setBroadcastMode(!broadcastMode)} style={{
        padding: isPC ? "10px 14px" : "9px 12px", borderRadius: 10,
        border: broadcastMode ? `2px solid ${T.accent}` : "none",
        fontSize: isPC ? 12 : 11, fontWeight: broadcastMode ? 700 : 500, cursor: "pointer",
        background: broadcastMode ? T.accentSoft : T.inp,
        color: broadcastMode ? T.accent : T.sub,
        display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
        transition: "all .15s ease",
      }}>
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
    />
  );

  if (mode === "free") {
    return (
      <div>
        {modeToggle}
        {broadcastBar}
        <FreeMatchTab data={data} onSave={onSave} T={T} isPC={isPC} onBack={() => setMode("ranked")} />
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
    <div>
      {modeToggle}
      {broadcastBar}
      <PCBattle state={state} data={data} onSave={onSave} T={T} memoRef={memoRef} stageRef={stageRef} />
    </div>
  );
}
