import { ChevronRight, Users } from "lucide-react";
import ConfirmDialog from "../shared/ConfirmDialog";
import { getTextInputStyle, getPrimaryBtn, getSecondaryBtn } from "../battle/battleStyles";
import { useI18n } from "../../i18n/index.jsx";

export default function OpponentList({
  freeOpponents,
  showAddInput,
  setShowAddInput,
  newOpponentName,
  setNewOpponentName,
  addOpponent,
  deleteOpponent,
  getOpponentStats,
  onSelectOpponent,
  isPC,
  T,
  cd,
  btnBase,
  overlays,
}) {
  const { t } = useI18n();

  return (
    <div style={{ animation: "fadeUp .2s ease" }}>
      {/* Add opponent */}
      <div style={cd}>
        {showAddInput ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" value={newOpponentName} onChange={(e) => setNewOpponentName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addOpponent(); if (e.key === "Escape") { setShowAddInput(false); setNewOpponentName(""); } }}
              placeholder={t("free.opponentName")} autoFocus maxLength={50}
              style={{ ...getTextInputStyle(T, { size: "lg" }), flex: 1, border: `1.5px solid ${T.accent}` }} />
            <button onClick={addOpponent} disabled={!newOpponentName.trim()} style={{ ...getPrimaryBtn(T, { disabled: !newOpponentName.trim() }), padding: "10px 18px", fontSize: 13 }}>{t("free.add")}</button>
            <button onClick={() => { setShowAddInput(false); setNewOpponentName(""); }} style={getSecondaryBtn(T, { size: "md" })}>×</button>
          </div>
        ) : (
          <button onClick={() => setShowAddInput(true)} style={{ ...btnBase, width: "100%", background: T.accentSoft, color: T.accent, border: `1.5px dashed ${T.accentBorder}`, fontSize: 14 }}>+ {t("free.addOpponent")}</button>
        )}
      </div>

      {freeOpponents.length === 0 ? (
        <div style={{ ...cd, textAlign: "center", padding: "40px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.accentSoft, border: `2px solid ${T.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} strokeWidth={2} color={T.accent} />
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>{t("free.noOpponents")}</div>
          <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.6, whiteSpace: "pre-line" }}>{t("free.noOpponentsHint")}</div>
        </div>
      ) : (
        <div style={isPC ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 } : undefined}>
          {freeOpponents.map((opp) => {
            const { total, w, l } = getOpponentStats(opp);
            const rate = total > 0 ? Math.round((w / total) * 100) : null;
            return (
              <div key={opp} style={{ ...cd, display: "flex", alignItems: "center", gap: 12, marginBottom: isPC ? 0 : 10 }}>
                <button onClick={() => onSelectOpponent(opp)}
                  style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", fontFamily: "inherit" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.accentSoft, border: `2px solid ${T.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: T.accent, flexShrink: 0 }}>{opp[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{opp}</div>
                    {total > 0 ? (
                      <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                        <span style={{ color: T.win, fontWeight: 700 }}>{w}{t("free.winLabel")}</span>{" : "}<span style={{ color: T.lose, fontWeight: 700 }}>{l}{t("free.loseLabel")}</span>{"  "}
                        <span style={{ color: rate >= 60 ? T.win : rate >= 40 ? T.mid : T.lose, fontWeight: 700 }}>{rate}%</span>
                      </div>
                    ) : <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>—</div>}
                  </div>
                  <ChevronRight size={16} style={{ color: T.dim, flexShrink: 0 }} />
                </button>
                <button
                  onClick={() => deleteOpponent(opp)}
                  aria-label={t("free.deleteOpponent")}
                  style={{
                    width: 44, height: 44, flexShrink: 0,
                    border: "none", borderRadius: 10,
                    background: T.loseBg, color: T.lose,
                    fontSize: 18, fontWeight: 700,
                    cursor: "pointer", transition: "all .15s ease",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >×</button>
              </div>
            );
          })}
        </div>
      )}
      {overlays}
    </div>
  );
}
