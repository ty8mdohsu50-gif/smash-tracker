import { useState, useEffect, useMemo, useRef } from "react";
import FighterIcon from "../shared/FighterIcon";
import ResultBadge from "../shared/ResultBadge";
import SectionTitle from "../shared/SectionTitle";
import { shortName } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { useI18n } from "../../i18n/index.jsx";
import { formatDate, formatTime, percentStr, barColor } from "../../utils/format";

const FILTERS = ["all", "wins", "losses", "memo"];

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
  const [drillFilter, setDrillFilter] = useState("all");
  const expandedRef = useRef(null);

  // Reset the drilldown filter whenever the user opens a different
  // matchup so they always start from "all" instead of inheriting a
  // stale "memo only" filter from the previous matchup.
  useEffect(() => {
    setDrillFilter("all");
  }, [expandedMatchup]);

  // Bring the drilldown into view when it opens so the user doesn't
  // have to hunt for it below the fold on mobile.
  useEffect(() => {
    if (expandedMatchup && expandedRef.current) {
      expandedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [expandedMatchup]);

  if (matchups.length === 0) return null;

  return (
    <div>
      <SectionTitle T={T}>{t("free.matchupStats")}</SectionTitle>
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
        const filtered = mu.matches.filter((m) => {
          if (drillFilter === "wins") return m.result === "win";
          if (drillFilter === "losses") return m.result === "lose";
          if (drillFilter === "memo") return String(m.memo || "").trim().length > 0;
          return true;
        });
        const filterLabel = (k) => t(`free.drilldown${k.charAt(0).toUpperCase() + k.slice(1)}`);
        return (
          <div ref={expandedRef} style={{ marginTop: 10, borderTop: `1px solid ${T.inp}`, paddingTop: 10 }}>
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
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {FILTERS.map((k) => {
                const active = drillFilter === k;
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={(e) => { e.stopPropagation(); setDrillFilter(k); }}
                    style={{
                      minHeight: 32,
                      border: active ? `1.5px solid ${T.accentBorder}` : `1px solid ${T.brd}`,
                      background: active ? T.accentSoft : T.inp,
                      color: active ? T.accent : T.sub,
                      fontSize: 11, fontWeight: 700,
                      padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                    }}
                  >
                    {filterLabel(k)}
                  </button>
                );
              })}
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "16px 0", fontSize: 11, color: T.dim }}>
                  —
                </div>
              )}
              {filtered.slice().reverse().map((m, i) => {
                const isEditing = editingStageMatch && editingStageMatch.time === m.time && editingStageMatch.date === m.date;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 0", borderBottom: `1px solid ${T.inp}`, flexWrap: isEditing ? "wrap" : "nowrap" }}>
                    <ResultBadge result={m.result} size="inline" T={T} style={{ minWidth: 30 }} />
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
