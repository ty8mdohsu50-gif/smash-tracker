import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Zap } from "lucide-react";
import CharPicker from "../shared/CharPicker";
import FighterIcon from "../shared/FighterIcon";
import Toast from "../shared/Toast";
import { fighterName } from "../../constants/fighters";
import { useI18n } from "../../i18n/index.jsx";
import {
  today,
  percentStr,
  barColor,
  formatTime,
  getStreak,
  recentChars,
} from "../../utils/format";

export default function QuickRecord({ data, onSave, T, isPC }) {
  const { t, lang } = useI18n();
  const [toast, setToast] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);
  const toastTimer = useRef(null);

  const myChar = data.settings?.myChar || "";

  const tM = useMemo(
    () => data.matches.filter((m) => m.date === today()),
    [data],
  );
  const tW = tM.filter((m) => m.result === "win").length;
  const tL = tM.length - tW;
  const streak = useMemo(() => getStreak(data.matches), [data]);
  const winRate = tM.length > 0 ? Math.round((tW / tM.length) * 100) : 0;
  const recOpp = useMemo(() => recentChars(data.matches, "oppChar"), [data]);

  const recordQuick = useCallback(
    (result) => {
      if (!myChar) return;
      const m = {
        date: today(),
        time: new Date().toISOString(),
        myChar,
        oppChar: "",
        result,
        memo: "",
        power: null,
        startPower: null,
        stage: null,
      };
      onSave({ ...data, matches: [...data.matches, m] });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast(result === "win" ? "WIN" : "LOSE");
      toastTimer.current = setTimeout(() => setToast(null), 1200);
    },
    [myChar, data, onSave],
  );

  const updateOppChar = useCallback(
    (matchIdx, char) => {
      const nm = [...data.matches];
      nm[matchIdx] = { ...nm[matchIdx], oppChar: char };
      onSave({ ...data, matches: nm });
      setEditingIdx(null);
    },
    [data, onSave],
  );

  const deleteMatch = useCallback(
    (matchIdx) => {
      const nm = [...data.matches];
      nm.splice(matchIdx, 1);
      onSave({ ...data, matches: nm });
    },
    [data, onSave],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "w" || e.key === "W") recordQuick("win");
      if (e.key === "l" || e.key === "L") recordQuick("lose");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recordQuick]);

  if (!myChar) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: T.dim, fontSize: 14 }}>
        {t("quick.noChar")}
      </div>
    );
  }

  const cd = {
    background: T.card,
    borderRadius: 16,
    padding: "16px 18px",
    marginBottom: 12,
    boxShadow: T.sh,
    border: `1px solid ${T.brd}`,
  };

  return (
    <div style={{ animation: "fadeUp .2s ease", maxWidth: isPC ? 600 : undefined, margin: isPC ? "0 auto" : undefined }}>
      {/* Stats bar */}
      <div style={{ ...cd, display: "flex", alignItems: "center", gap: 12, padding: "12px 18px" }}>
        <FighterIcon name={myChar} size={28} />
        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{fighterName(myChar, lang)}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif" }}>
              <span style={{ color: T.win }}>{tW}</span>
              <span style={{ color: T.dimmer, fontSize: 12, margin: "0 2px" }}>:</span>
              <span style={{ color: T.lose }}>{tL}</span>
            </div>
          </div>
          {tM.length > 0 && (
            <div style={{ fontSize: 18, fontWeight: 900, color: barColor(tW / tM.length), fontFamily: "'Chakra Petch', sans-serif" }}>
              {winRate}%
            </div>
          )}
          {streak.count >= 2 && (
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Zap size={14} fill={streak.type === "win" ? T.win : T.lose} color={streak.type === "win" ? T.win : T.lose} />
              <span style={{ fontSize: 16, fontWeight: 900, color: streak.type === "win" ? T.win : T.lose, fontFamily: "'Chakra Petch', sans-serif" }}>{streak.count}</span>
            </div>
          )}
        </div>
      </div>

      {/* WIN / LOSE buttons */}
      <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => recordQuick("win")}
          style={{
            flex: 1,
            padding: isPC ? "48px 0" : "56px 0",
            border: "none",
            borderRadius: 20,
            background: "linear-gradient(135deg, #16A34A, #22C55E)",
            color: "#fff",
            fontSize: isPC ? 32 : 36,
            fontWeight: 900,
            fontFamily: "'Chakra Petch', sans-serif",
            letterSpacing: 4,
            boxShadow: "0 6px 24px rgba(34,197,94,.35)",
            cursor: "pointer",
            transition: "transform .1s ease",
          }}
        >
          WIN
        </button>
        <button
          type="button"
          onClick={() => recordQuick("lose")}
          style={{
            flex: 1,
            padding: isPC ? "48px 0" : "56px 0",
            border: "none",
            borderRadius: 20,
            background: "linear-gradient(135deg, #E11D48, #F43F5E)",
            color: "#fff",
            fontSize: isPC ? 32 : 36,
            fontWeight: 900,
            fontFamily: "'Chakra Petch', sans-serif",
            letterSpacing: 4,
            boxShadow: "0 6px 24px rgba(244,63,94,.35)",
            cursor: "pointer",
            transition: "transform .1s ease",
          }}
        >
          LOSE
        </button>
      </div>

      {/* Keyboard hint */}
      <div style={{ textAlign: "center", fontSize: 11, color: T.dimmer, marginBottom: 16 }}>
        {t("quick.desc")}
      </div>

      {/* Recent matches */}
      {tM.length > 0 && (
        <div style={cd}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, marginBottom: 8 }}>{t("battle.recent")}</div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {tM.slice().reverse().map((m, i) => {
              const matchIdx = data.matches.indexOf(m);
              const isEditing = editingIdx === matchIdx;
              return (
                <div key={matchIdx} style={{ padding: "6px 0", borderBottom: `1px solid ${T.inp}` }}>
                  {isEditing ? (
                    <div>
                      <CharPicker
                        value={m.oppChar}
                        onChange={(c) => updateOppChar(matchIdx, c)}
                        label={t("quick.setOpp")}
                        placeholder={t("charPicker.select")}
                        recent={recOpp}
                        autoOpen
                        T={T}
                      />
                      <button
                        onClick={() => setEditingIdx(null)}
                        style={{ marginTop: 6, border: "none", background: T.inp, color: T.sub, fontSize: 11, padding: "4px 12px", borderRadius: 6, cursor: "pointer" }}
                      >
                        {t("settings.cancel")}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 36,
                          textAlign: "center",
                          padding: "2px 0",
                          borderRadius: 5,
                          fontSize: 10,
                          fontWeight: 800,
                          background: m.result === "win" ? T.winBg : T.loseBg,
                          color: m.result === "win" ? T.win : T.lose,
                          flexShrink: 0,
                        }}
                      >
                        {m.result === "win" ? "WIN" : "LOSE"}
                      </span>
                      {m.oppChar ? (
                        <>
                          <FighterIcon name={m.oppChar} size={22} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1 }}>
                            {fighterName(m.oppChar, lang)}
                          </span>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditingIdx(matchIdx)}
                          style={{
                            border: `1px dashed ${T.dimmer}`,
                            background: "transparent",
                            color: T.dimmer,
                            fontSize: 11,
                            padding: "3px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            flex: 1,
                            textAlign: "left",
                          }}
                        >
                          {t("quick.tapToSetOpp")}
                        </button>
                      )}
                      <span style={{ fontSize: 11, color: T.dim, flexShrink: 0 }}>{formatTime(m.time)}</span>
                      <button
                        onClick={() => deleteMatch(matchIdx)}
                        style={{ border: "none", background: "transparent", color: T.dimmer, fontSize: 14, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}
                      >
                        x
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
