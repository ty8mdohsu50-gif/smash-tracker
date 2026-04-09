import { useState, useCallback, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { STAGES, stageName, stageImg } from "../constants/stages";

const SECTIONS = ["flash", "gameplan", "stage"];
const EMPTY_NOTE = { flash: "", gameplan: "", stage: "" };

export function needsReview(note, matches, charKey) {
  if (!note) return false;
  const hasContent = SECTIONS.some((s) => (note[s] || "").trim());
  if (!hasContent) return false;
  const reviewed = note._lastReviewed;
  if (!reviewed) return true;
  const daysSince = (Date.now() - reviewed) / 86400000;
  const recentCount = matches?.filter((m) => m.oppChar === charKey).filter((m) => {
    const d = new Date(m.time || m.date);
    return (Date.now() - d.getTime()) / 86400000 < 30;
  }).length || 0;
  return recentCount <= 2 && daysSince > 14;
}

export default function MatchupNotesEditor({ noteKey, data, onSave, T, compact }) {
  const { t, lang } = useI18n();
  const [openSections, setOpenSections] = useState({ flash: true });
  const [savedKey, setSavedKey] = useState(null);

  const notes = data.matchupNotes?.[noteKey] || EMPTY_NOTE;

  // Derive oppChar from noteKey for stage stats (supports "myChar|oppChar" and "oppChar")
  const oppCharKey = noteKey.includes("|") ? noteKey.split("|")[1] : noteKey;
  const stageStats = useMemo(() => {
    if (!data.matches || oppCharKey.startsWith("free:")) return {};
    const ms = data.matches.filter((m) => m.oppChar === oppCharKey && m.stage);
    const stats = {};
    for (const m of ms) {
      if (!stats[m.stage]) stats[m.stage] = { w: 0, l: 0 };
      m.result === "win" ? stats[m.stage].w++ : stats[m.stage].l++;
    }
    return stats;
  }, [data.matches, oppCharKey]);

  useEffect(() => {
    const current = data.matchupNotes?.[noteKey];
    if (current && !current._lastReviewed) {
      onSave({ ...data, matchupNotes: { ...(data.matchupNotes || {}), [noteKey]: { ...current, _lastReviewed: Date.now() } } });
    }
  }, [noteKey]);

  const updateSection = useCallback((section, value) => {
    const current = data.matchupNotes?.[noteKey] || { ...EMPTY_NOTE };
    const updated = { ...current, [section]: value, _lastReviewed: Date.now() };
    onSave({ ...data, matchupNotes: { ...(data.matchupNotes || {}), [noteKey]: updated } });
    setSavedKey(section);
    setTimeout(() => setSavedKey(null), 1200);
  }, [noteKey, data, onSave]);

  const toggle = (s) => setOpenSections((p) => ({ ...p, [s]: !p[s] }));

  const sectionIcon = (s) => {
    if (s === "flash") return "⚡";
    if (s === "gameplan") return "📋";
    if (s === "stage") return "🗺️";
    return "";
  };

  const sectionColor = (s) => {
    if (s === "flash") return T.accent;
    return T.sub;
  };

  return (
    <div>
      {SECTIONS.map((s) => {
        const isFlash = s === "flash";
        const isOpen = isFlash || openSections[s];
        const hasContent = (notes[s] || "").trim().length > 0;

        return (
          <div key={s} style={{
            background: T.card, borderRadius: 12, border: `1px solid ${isFlash ? T.accentBorder : T.brd}`,
            marginBottom: compact ? 6 : 8, overflow: "hidden",
            boxShadow: isFlash ? T.accentGlow?.replace(/\.3\)/, ".08)") : "none",
          }}>
            <div
              onClick={() => !isFlash && toggle(s)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: compact ? "8px 12px" : "10px 14px",
                cursor: isFlash ? "default" : "pointer", userSelect: "none",
                background: isFlash ? T.accentSoft : "transparent",
              }}
            >
              <span style={{ fontSize: 13 }}>{sectionIcon(s)}</span>
              <span style={{ flex: 1, fontSize: compact ? 12 : 13, fontWeight: 700, color: sectionColor(s) }}>
                {t(`matchupNotes.${s}`)}
              </span>
              {savedKey === s && <span style={{ fontSize: 10, color: T.win, fontWeight: 600 }}>{t("matchupNotes.autoSaved")}</span>}
              {!isFlash && (
                hasContent
                  ? <span style={{ fontSize: 10, color: T.dim, marginRight: 4 }}>●</span>
                  : null
              )}
              {!isFlash && (isOpen ? <ChevronDown size={14} style={{ color: T.dim }} /> : <ChevronRight size={14} style={{ color: T.dim }} />)}
            </div>
            {isOpen && (
              <div style={{ padding: compact ? "0 12px 8px" : "0 14px 10px" }}>
                {isFlash && <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>{t("matchupNotes.flashDesc")}</div>}
                {s === "stage" && Object.keys(stageStats).length > 0 && (
                  <div style={{ marginBottom: 8, padding: "6px 8px", background: T.inp, borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("stages.stageWinRate")}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
                      {STAGES.filter((st) => stageStats[st.id]).map((st) => {
                        const { w, l } = stageStats[st.id];
                        const total = w + l;
                        const r = w / total;
                        const color = r >= 0.6 ? T.win : r <= 0.4 ? T.lose : "#FF9F0A";
                        return (
                          <span key={st.id} style={{ fontSize: 10, color: T.sub }}>
                            <span style={{ color: T.text, fontWeight: 600 }}>{stageName(st.id, lang)}</span>
                            {" "}<span style={{ color, fontWeight: 700 }}>{Math.round(r * 100)}%</span>
                            {" "}<span style={{ color: T.dim }}>({w}W{l}L)</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <textarea
                  defaultValue={notes[s] || ""}
                  onBlur={(e) => { if (e.target.value !== (notes[s] || "")) updateSection(s, e.target.value); }}
                  placeholder={t(`matchupNotes.${s}Placeholder`)}
                  rows={Math.max(isFlash ? 3 : s === "gameplan" ? 4 : 2, ((notes[s] || "").split("\n").length))}
                  style={{
                    width: "100%", padding: "8px 10px", background: T.inp, border: "none", borderRadius: 8,
                    color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "vertical",
                    fontFamily: "inherit", lineHeight: 1.6,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FlashDashboard({ noteKey, data, T, onEdit }) {
  const { t } = useI18n();
  const notes = data.matchupNotes?.[noteKey];
  const flash = notes?.flash;
  if (!flash || !flash.trim()) return null;

  return (
    <div style={{
      background: T.accentSoft, borderRadius: 12, border: `1px solid ${T.accentBorder}`,
      padding: "10px 14px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={13} style={{ color: T.accent }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>{t("matchupNotes.flashPreMatch")}</span>
        </div>
        {onEdit && (
          <button onClick={onEdit} style={{ border: "none", background: "none", color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>
            {t("matchupNotes.edit")}
          </button>
        )}
      </div>
      <div style={{ fontSize: 12, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{flash}</div>
    </div>
  );
}

export function BattleNotes({ noteKey, data, T }) {
  const { t, lang } = useI18n();
  const [openSections, setOpenSections] = useState({});
  const notes = data.matchupNotes?.[noteKey];
  if (!notes) return null;

  const hasAny = ["flash", "gameplan", "stage"].some((s) => (notes[s] || "").trim());
  if (!hasAny) return null;

  const oppCharKey = noteKey.includes("|") ? noteKey.split("|")[1] : noteKey;
  const stageStats = useMemo(() => {
    if (!data.matches) return {};
    const ms = data.matches.filter((m) => m.oppChar === oppCharKey && m.stage);
    const stats = {};
    for (const m of ms) {
      if (!stats[m.stage]) stats[m.stage] = { w: 0, l: 0 };
      m.result === "win" ? stats[m.stage].w++ : stats[m.stage].l++;
    }
    return stats;
  }, [data.matches, oppCharKey]);

  const toggle = (s) => setOpenSections((p) => ({ ...p, [s]: !p[s] }));

  const sections = [
    { key: "flash", icon: "⚡", color: T.accent, alwaysOpen: true },
    { key: "gameplan", icon: "📋", color: T.sub, alwaysOpen: false },
    { key: "stage", icon: "🗺️", color: T.sub, alwaysOpen: false },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
      {sections.map(({ key, icon, color, alwaysOpen }) => {
        const content = (notes[key] || "").trim();
        const isStage = key === "stage";
        const hasStageData = isStage && Object.keys(stageStats).length > 0;
        if (!content && !hasStageData) return null;

        const isOpen = alwaysOpen || openSections[key];
        const preview = !alwaysOpen && !isOpen && content ? content.split("\n")[0].slice(0, 40) + (content.length > 40 ? "..." : "") : null;

        return (
          <div key={key} style={{
            background: alwaysOpen ? T.accentSoft : T.card,
            borderRadius: 10,
            border: `1px solid ${alwaysOpen ? T.accentBorder : T.brd}`,
            overflow: "hidden",
          }}>
            <div
              onClick={() => !alwaysOpen && toggle(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 12px",
                cursor: alwaysOpen ? "default" : "pointer",
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: 12 }}>{icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color }}>{t(`matchupNotes.${key}`)}</span>
              {preview && <span style={{ flex: 1, fontSize: 10, color: T.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</span>}
              {!alwaysOpen && (
                isOpen
                  ? <ChevronDown size={12} style={{ color: T.dim, marginLeft: "auto", flexShrink: 0 }} />
                  : <ChevronRight size={12} style={{ color: T.dim, marginLeft: preview ? 0 : "auto", flexShrink: 0 }} />
              )}
            </div>
            {isOpen && (
              <div style={{ padding: "0 12px 8px" }}>
                {content && <div style={{ fontSize: 11, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{content}</div>}
                {isStage && hasStageData && (
                  <div style={{ marginTop: content ? 6 : 0, display: "flex", flexWrap: "wrap", gap: "3px 8px" }}>
                    {STAGES.filter((st) => stageStats[st.id]).map((st) => {
                      const { w, l } = stageStats[st.id];
                      const r = w / (w + l);
                      const clr = r >= 0.6 ? T.win : r <= 0.4 ? T.lose : "#FF9F0A";
                      return (
                        <span key={st.id} style={{ fontSize: 10 }}>
                          <span style={{ color: T.text, fontWeight: 600 }}>{stageName(st.id, lang)}</span>
                          {" "}<span style={{ color: clr, fontWeight: 700 }}>{Math.round(r * 100)}%</span>
                          <span style={{ color: T.dim }}> ({w}W{l}L)</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
