import { useState, useMemo, useRef, useEffect } from "react";
import ConfirmDialog from "../shared/ConfirmDialog";
import { useI18n } from "../../i18n/index.jsx";
import { useToast } from "../../contexts/ToastContext";
import { today, percentStr, recentChars } from "../../utils/format";
import OpponentList from "./OpponentList";
import OpponentDetail from "./OpponentDetail";

export default function FreeMatchTab({ data, onSave, T, isPC, onBack, tabIdx, modalsOpen }) {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [selectedOpponent, setSelectedOpponentRaw] = useState(null);
  const setSelectedOpponent = (v) => {
    if (v && !isPC) window.history.pushState({ type: "freeOpp", v }, "");
    setSelectedOpponentRaw(v);
  };

  useEffect(() => {
    if (isPC) return;
    const onPop = () => {
      if (selectedOpponent) { setSelectedOpponentRaw(null); return; }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isPC, selectedOpponent]);
  const [myChar, setMyChar] = useState(data.settings?.myChar || "");
  const [oppChar, setOppChar] = useState("");
  const [showMyPicker, setShowMyPicker] = useState(false);
  const [showOppPicker, setShowOppPicker] = useState(false);
  const [newOpponentName, setNewOpponentName] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [postRecord, setPostRecord] = useState(false);
  const [freeMemo, setFreeMemo] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [expandedMatchup, setExpandedMatchup] = useState(null);
  const [editingStageMatch, setEditingStageMatch] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [calDate, setCalDate] = useState(null);

  const dataRef = useRef(data);
  dataRef.current = data;

  const freeMatches = useMemo(() => data.freeMatches || [], [data.freeMatches]);
  const freeOpponents = useMemo(() => data.freeOpponents || [], [data.freeOpponents]);
  const recMy = useMemo(() => recentChars(freeMatches, "myChar"), [freeMatches]);
  const recOpp = useMemo(() => recentChars(freeMatches, "oppChar"), [freeMatches]);

  // Actions
  const getOpponentStats = (opp) => {
    const ms = freeMatches.filter((m) => m.opponent === opp);
    const w = ms.filter((m) => m.result === "win").length;
    return { total: ms.length, w, l: ms.length - w };
  };

  const addOpponent = () => {
    const name = newOpponentName.trim();
    if (!name || freeOpponents.includes(name)) return;
    onSave({ ...data, freeOpponents: [...freeOpponents, name] });
    setNewOpponentName(""); setShowAddInput(false);
  };

  const deleteOpponent = (opp) => {
    onSave({ ...data, freeOpponents: freeOpponents.filter((o) => o !== opp), freeMatches: freeMatches.filter((m) => m.opponent !== opp) });
  };

  const deleteFreeMatch = (match) => {
    setConfirmAction({
      message: t("common.deleteConfirm"),
      onConfirm: () => {
        const cur = dataRef.current;
        const fm = cur.freeMatches || [];
        const idx = fm.findIndex((m) => m.date === match.date && m.time === match.time && m.myChar === match.myChar && m.oppChar === match.oppChar && m.result === match.result);
        if (idx === -1) { setConfirmAction(null); return; }
        const nf = [...fm];
        nf.splice(idx, 1);
        onSave({ ...cur, freeMatches: nf });
        setConfirmAction(null);
      },
    });
  };

  const saveFreeMemo = () => {
    const cur = dataRef.current;
    const fm = cur.freeMatches || [];
    if (fm.length === 0) return;
    const text = freeMemo.trim();
    const nf = [...fm];
    const last = nf[nf.length - 1];
    nf[nf.length - 1] = { ...last, memo: text || undefined };
    onSave({ ...cur, freeMatches: nf });
  };

  const recordMatch = (result) => {
    if (!myChar || !oppChar || !selectedOpponent) return;
    const entry = { date: today(), time: new Date().toISOString(), opponent: selectedOpponent, myChar, oppChar, result, memo: "" };
    if (selectedStage) entry.stage = selectedStage;
    onSave({ ...data, freeMatches: [...freeMatches, entry] });
    setFreeMemo("");
    setLastResult(result); setPostRecord(true); toast.success(t("battle.toastRecorded"));
  };

  const updateFreeMatchStage = (match, newStage) => {
    const cur = dataRef.current;
    const fm = cur.freeMatches || [];
    const idx = fm.findIndex((m) => m.date === match.date && m.time === match.time && m.myChar === match.myChar && m.oppChar === match.oppChar && m.result === match.result);
    if (idx === -1) return;
    const nf = [...fm];
    nf[idx] = { ...nf[idx], stage: newStage || undefined };
    onSave({ ...cur, freeMatches: nf });
    setEditingStageMatch(null);
  };

  // UI helpers
  const cd = { background: T.card, borderRadius: 16, border: `1px solid ${T.brd}`, boxShadow: T.sh, padding: "16px 18px", marginBottom: 12, transition: "box-shadow .2s ease" };
  const btnBase = { border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all .15s ease", fontFamily: "inherit" };

  const overlays = (
    <>
      {confirmAction && <ConfirmDialog message={confirmAction.message} confirmLabel={t("history.delete")} cancelLabel={t("settings.cancel")} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} T={T} />}
    </>
  );

  if (!selectedOpponent) {
    return (
      <OpponentList
        freeOpponents={freeOpponents}
        showAddInput={showAddInput}
        setShowAddInput={setShowAddInput}
        newOpponentName={newOpponentName}
        setNewOpponentName={setNewOpponentName}
        addOpponent={addOpponent}
        deleteOpponent={(opp) => {
          setConfirmAction({ message: `${opp} ${t("free.deleteOpponent")}?`, onConfirm: () => { deleteOpponent(opp); setConfirmAction(null); } });
        }}
        getOpponentStats={getOpponentStats}
        onSelectOpponent={(opp) => { setSelectedOpponent(opp); setPostRecord(false); setExpandedMatchup(null); setCalDate(null); }}
        isPC={isPC}
        T={T}
        cd={cd}
        btnBase={btnBase}
        overlays={overlays}
      />
    );
  }

  return (
    <OpponentDetail
      data={data}
      onSave={onSave}
      selectedOpponent={selectedOpponent}
      setSelectedOpponent={(v) => { if (v === null) setSelectedOpponentRaw(null); else setSelectedOpponent(v); }}
      myChar={myChar}
      setMyChar={setMyChar}
      oppChar={oppChar}
      setOppChar={setOppChar}
      showMyPicker={showMyPicker}
      setShowMyPicker={setShowMyPicker}
      showOppPicker={showOppPicker}
      setShowOppPicker={setShowOppPicker}
      recMy={recMy}
      recOpp={recOpp}
      freeMatches={freeMatches}
      postRecord={postRecord}
      setPostRecord={setPostRecord}
      lastResult={lastResult}
      freeMemo={freeMemo}
      setFreeMemo={setFreeMemo}
      selectedStage={selectedStage}
      setSelectedStage={setSelectedStage}
      expandedMatchup={expandedMatchup}
      setExpandedMatchup={setExpandedMatchup}
      editingStageMatch={editingStageMatch}
      setEditingStageMatch={setEditingStageMatch}
      calMonth={calMonth}
      setCalMonth={setCalMonth}
      calDate={calDate}
      setCalDate={setCalDate}
      recordMatch={recordMatch}
      deleteFreeMatch={deleteFreeMatch}
      saveFreeMemo={saveFreeMemo}
      updateFreeMatchStage={updateFreeMatchStage}
      isPC={isPC}
      tabIdx={tabIdx}
      modalsOpen={modalsOpen}
      confirmAction={confirmAction}
      setConfirmAction={setConfirmAction}
      T={T}
      cd={cd}
      btnBase={btnBase}
      overlays={overlays}
    />
  );
}
