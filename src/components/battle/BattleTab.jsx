import FreeMatchTab from "../free/FreeMatchTab";
import MobileBattle from "./MobileBattle";
import PCBattle from "./PCBattle";
import QuickRecord from "./QuickRecord";
import { useBattleState } from "../../hooks/useBattleState";
import { useI18n } from "../../i18n/index.jsx";

export default function BattleTab({ data, onSave, T, isPC, battleMode, setBattleMode }) {
  const { t } = useI18n();

  const mode = battleMode || "ranked";
  const setMode = setBattleMode || (() => {});

  const state = useBattleState({ data, onSave, T, isPC });

  // Mode toggle
  const modeToggle = (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      {[["ranked", t("battle.ranked")], ["free", t("free.freeMatch")], ["quick", t("quick.title")]].map(([k, l]) => (
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

  if (mode === "quick") {
    return (
      <div>
        {modeToggle}
        <QuickRecord data={data} onSave={onSave} T={T} isPC={isPC} />
      </div>
    );
  }

  if (!isPC) {
    return (
      <div>
        {modeToggle}
        <MobileBattle state={state} data={data} onSave={onSave} T={T} />
      </div>
    );
  }

  return (
    <div>
      {modeToggle}
      <PCBattle state={state} data={data} onSave={onSave} T={T} />
    </div>
  );
}
