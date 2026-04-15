import { useState } from "react";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { useI18n } from "../../i18n/index.jsx";

// Compact ban picker grid. Stateless from a data perspective — the
// caller owns `value` and reacts to `onChange`. Kept presentation-only
// so Free対戦 and ranked matchup notes can both reuse it without
// agreeing on where the bans live.
export default function StageBansGrid({
  value,
  onChange,
  max = 3,
  title,
  T,
}) {
  const { t, lang } = useI18n();
  const [flash, setFlash] = useState(false);
  const bans = Array.isArray(value) ? value : [];

  const toggle = (id) => {
    const isBanned = bans.includes(id);
    let next;
    if (isBanned) {
      next = bans.filter((b) => b !== id);
    } else if (bans.length < max) {
      next = [...bans, id];
    } else {
      return;
    }
    onChange(next);
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  };

  return (
    <div style={{
      background: T.card, borderRadius: 10, border: `1px solid ${T.brd}`, overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
      }}>
        <span style={{ fontSize: 12 }}>🗺️</span>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: T.sub }}>
          {title ?? t("matchupNotes.stageBan")}
        </span>
        {flash && (
          <span style={{ fontSize: 10, color: T.win, fontWeight: 600 }}>
            {t("matchupNotes.autoSaved")}
          </span>
        )}
        <span style={{ fontSize: 10, color: T.dim }}>{bans.length}/{max}</span>
      </div>
      <div style={{ padding: "0 12px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
          {STAGES.map((st) => {
            const isBanned = bans.includes(st.id);
            const atCap = bans.length >= max && !isBanned;
            return (
              <div
                key={st.id}
                onClick={() => toggle(st.id)}
                style={{
                  position: "relative", borderRadius: 6, overflow: "hidden",
                  cursor: atCap ? "not-allowed" : "pointer",
                  border: isBanned ? `2px solid ${T.lose}` : `1px solid ${T.brd}`,
                  opacity: isBanned ? 0.4 : atCap ? 0.6 : 1,
                  transition: "all .15s ease",
                }}
              >
                <img
                  src={stageImg(st.id)}
                  alt=""
                  style={{ width: "100%", height: 32, objectFit: "cover", display: "block" }}
                />
                {isBanned && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(255,69,58,.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: T.lose }}>✕</span>
                  </div>
                )}
                <div style={{ padding: "2px 3px", textAlign: "center", background: T.inp }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>
                    {stageName(st.id, lang)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
