import FighterIcon from "../shared/FighterIcon";
import { shortName } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { useI18n } from "../../i18n/index.jsx";
import { formatDate, formatTime, percentStr, barColor } from "../../utils/format";

export default function MatchupGrid({
  matchups,
  expandedMatchup,
  setExpandedMatchup,
  editingStageMatch,
  setEditingStageMatch,
  deleteFreeMatch,
  updateFreeMatchStage,
  T,
}) {
  const { t, lang } = useI18n();

  if (matchups.length === 0) return null;

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 10 }}>{t("free.matchupStats")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {matchups.map((mu) => {
          const r = mu.w / (mu.w + mu.l);
          const k = `${mu.myChar}|${mu.oppChar}`;
          return (
            <div
              key={k}
              onClick={() => setExpandedMatchup(expandedMatchup === k ? null : k)}
              style={{
                textAlign: "center",
                cursor: "pointer",
                padding: "6px 2px",
                borderRadius: 10,
                background: expandedMatchup === k ? T.accentSoft : "transparent",
                border: expandedMatchup === k ? `1.5px solid ${T.accentBorder}` : "1.5px solid transparent",
                transition: "all .15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 2 }}>
                <FighterIcon name={mu.myChar} size={20} />
                <FighterIcon name={mu.oppChar} size={20} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>
                {percentStr(mu.w, mu.w + mu.l)}
              </div>
              <div style={{ fontSize: 9, color: T.dim }}>{mu.w}W {mu.l}L</div>
            </div>
          );
        })}
      </div>

      {expandedMatchup && (() => {
        const mu = matchups.find((m) => `${m.myChar}|${m.oppChar}` === expandedMatchup);
        if (!mu) return null;
        return (
          <div style={{ marginTop: 10, borderTop: `1px solid ${T.inp}`, paddingTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <FighterIcon name={mu.myChar} size={22} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{shortName(mu.myChar, lang)}</span>
              <span style={{ fontSize: 10, color: T.dim }}>vs</span>
              <FighterIcon name={mu.oppChar} size={22} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{shortName(mu.oppChar, lang)}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: barColor(mu.w / (mu.w + mu.l)), fontFamily: "'Chakra Petch', sans-serif" }}>
                {percentStr(mu.w, mu.w + mu.l)}
              </span>
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {mu.matches.slice().reverse().map((m, i) => {
                const isEditing = editingStageMatch && editingStageMatch.time === m.time && editingStageMatch.date === m.date;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0", borderBottom: `1px solid ${T.inp}`, flexWrap: isEditing ? "wrap" : "nowrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.result === "win" ? T.win : T.lose, minWidth: 30 }}>
                      {m.result === "win" ? "WIN" : "LOSE"}
                    </span>
                    <span style={{ fontSize: 10, color: T.dim }}>{formatDate(m.date)}</span>
                    {m.stage && !isEditing && (
                      <span style={{ fontSize: 9, color: T.dim, background: T.inp, padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>{stageName(m.stage, lang)}</span>
                    )}
                    <span style={{ fontSize: 10, color: T.dim, marginLeft: "auto" }}>{formatTime(m.time)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingStageMatch(isEditing ? null : m); }}
                      style={{ border: "none", background: T.inp, color: T.sub, fontSize: 9, padding: "2px 5px", borderRadius: 4, cursor: "pointer", flexShrink: 0 }}
                    >
                      {isEditing ? "\u2713" : "\uD83D\uDDFA"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFreeMatch(m); }}
                      style={{ border: "none", background: "transparent", color: T.dimmer, fontSize: 13, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}
                    >
                      ×
                    </button>
                    {isEditing && (
                      <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 4, marginBottom: 4 }}>
                        {STAGES.map((st) => (
                          <div
                            key={st.id}
                            onClick={(e) => { e.stopPropagation(); updateFreeMatchStage(m, m.stage === st.id ? null : st.id); }}
                            style={{
                              textAlign: "center",
                              cursor: "pointer",
                              borderRadius: 6,
                              border: m.stage === st.id ? `2px solid ${T.accent}` : `1px solid ${T.brd}`,
                              padding: 2,
                              opacity: m.stage === st.id ? 1 : 0.6,
                            }}
                          >
                            <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 24, objectFit: "cover", borderRadius: 4 }} />
                            <div style={{ fontSize: 8, color: T.text, marginTop: 1 }}>{stageName(st.id, lang)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
