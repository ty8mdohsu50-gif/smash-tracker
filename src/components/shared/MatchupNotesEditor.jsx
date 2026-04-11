import { useState, useCallback, useEffect, useMemo, Fragment } from "react";
import { useI18n } from "../../i18n/index.jsx";
import { STAGES, stageName, stageImg } from "../../constants/stages";

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
  const [savedKey, setSavedKey] = useState(null);

  const notes = data.matchupNotes?.[noteKey] || EMPTY_NOTE;

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

  const updateBans = useCallback((bans) => {
    const current = data.matchupNotes?.[noteKey] || { ...EMPTY_NOTE };
    const updated = { ...current, stageBans: bans, _lastReviewed: Date.now() };
    onSave({ ...data, matchupNotes: { ...(data.matchupNotes || {}), [noteKey]: updated } });
  }, [noteKey, data, onSave]);

  const sectionIcon = (s) => s === "flash" ? "⚡" : s === "gameplan" ? "📋" : "🗺️";
  const sectionColor = (s) => s === "flash" ? T.accent : T.sub;

  const bans = notes.stageBans || [];

  const DISPLAY_SECTIONS = ["flash", "gameplan"];

  return (
    <div>
      {DISPLAY_SECTIONS.map((s) => {
        const isFlash = s === "flash";
        return (
          <div key={s} style={{
            background: T.card, borderRadius: 12, border: `1px solid ${isFlash ? T.accentBorder : T.brd}`,
            marginBottom: compact ? 6 : 8, overflow: "hidden",
            boxShadow: isFlash ? T.accentGlow?.replace(/\.3\)/, ".08)") : "none",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: compact ? "8px 12px" : "10px 14px",
              background: isFlash ? T.accentSoft : "transparent",
            }}>
              <span style={{ fontSize: 13 }}>{sectionIcon(s)}</span>
              <span style={{ flex: 1, fontSize: compact ? 12 : 13, fontWeight: 700, color: sectionColor(s) }}>
                {t(`matchupNotes.${s}`)}
              </span>
              {savedKey === s && <span style={{ fontSize: 10, color: T.win, fontWeight: 600 }}>{t("matchupNotes.autoSaved")}</span>}
            </div>
            <div style={{ padding: compact ? "0 12px 8px" : "0 14px 10px" }}>
              {isFlash && <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>{t("matchupNotes.flashDesc")}</div>}
              <textarea
                defaultValue={notes[s] || ""}
                onFocus={(e) => {
                  if (s === "gameplan" && !e.target.value.trim()) {
                    const tpl = t("matchupNotes.gameplanPlaceholder");
                    e.target.value = tpl;
                    e.target.style.height = "auto";
                    e.target.style.height = Math.max(40, e.target.scrollHeight) + "px";
                  }
                }}
                onBlur={(e) => { if (e.target.value !== (notes[s] || "")) updateSection(s, e.target.value); }}
                placeholder={t(`matchupNotes.${s}Placeholder`)}
                ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.max(40, el.scrollHeight) + "px"; } }}
                onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.max(40, e.target.scrollHeight) + "px"; }}
                style={{
                  width: "100%", padding: "8px 10px", background: T.inp, border: "none", borderRadius: 8,
                  color: T.text, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "none", overflow: "hidden",
                  fontFamily: "inherit", lineHeight: 1.6, minHeight: 40,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Stage ban selection */}
      <div style={{
        background: T.card, borderRadius: 12, border: `1px solid ${T.brd}`,
        marginBottom: compact ? 6 : 8, overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: compact ? "8px 12px" : "10px 14px",
        }}>
          <span style={{ fontSize: 13 }}>🗺️</span>
          <span style={{ flex: 1, fontSize: compact ? 12 : 13, fontWeight: 700, color: T.sub }}>
            {t("matchupNotes.stageBan")}
          </span>
          {savedKey === "stageBans" && <span style={{ fontSize: 10, color: T.win, fontWeight: 600 }}>{t("matchupNotes.autoSaved")}</span>}
          <span style={{ fontSize: 10, color: T.dim }}>{bans.length}/3</span>
        </div>
        <div style={{ padding: compact ? "0 12px 8px" : "0 14px 10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {STAGES.map((st) => {
              const isBanned = bans.includes(st.id);
              const stats = stageStats[st.id];
              const r = stats ? stats.w / (stats.w + stats.l) : null;
              return (
                <div key={st.id}
                  onClick={() => {
                    let next;
                    if (isBanned) {
                      next = bans.filter((b) => b !== st.id);
                    } else if (bans.length < 3) {
                      next = [...bans, st.id];
                    } else {
                      return;
                    }
                    updateBans(next);
                    setSavedKey("stageBans");
                    setTimeout(() => setSavedKey(null), 1200);
                  }}
                  style={{
                    position: "relative", borderRadius: 8, overflow: "hidden", cursor: bans.length >= 3 && !isBanned ? "not-allowed" : "pointer",
                    border: isBanned ? `2px solid ${T.lose}` : `1px solid ${T.brd}`,
                    opacity: isBanned ? 0.45 : 1, transition: "all .15s ease",
                  }}
                >
                  <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 40, objectFit: "cover", display: "block" }} />
                  {isBanned && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,69,58,.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: T.lose }}>✕</span>
                    </div>
                  )}
                  <div style={{ padding: "3px 4px", textAlign: "center", background: T.inp }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>{stageName(st.id, lang)}</div>
                    {stats && <div style={{ fontSize: 8, fontWeight: 700, color: r >= 0.6 ? T.win : r <= 0.4 ? T.lose : "#FF9F0A" }}>{Math.round(r * 100)}% ({stats.w}W{stats.l}L)</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const BATTLE_NOTES_SECTION_ORDER = ["flash", "gameplan", "bans"];

export function BattleNotes({ noteKey, data, T, onSave, sections }) {
  const { t, lang } = useI18n();
  const [savedKey, setSavedKey] = useState(null);
  const notes = data.matchupNotes?.[noteKey] || EMPTY_NOTE;

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

  const saveSection = useCallback((section, value) => {
    if (!onSave) return;
    const current = data.matchupNotes?.[noteKey] || { ...EMPTY_NOTE };
    onSave({ ...data, matchupNotes: { ...(data.matchupNotes || {}), [noteKey]: { ...current, [section]: value, _lastReviewed: Date.now() } } });
    setSavedKey(section);
    setTimeout(() => setSavedKey(null), 1200);
  }, [noteKey, data, onSave]);

  const updateBans = useCallback((bans) => {
    if (!onSave) return;
    const current = data.matchupNotes?.[noteKey] || { ...EMPTY_NOTE };
    onSave({ ...data, matchupNotes: { ...(data.matchupNotes || {}), [noteKey]: { ...current, stageBans: bans, _lastReviewed: Date.now() } } });
    setSavedKey("stageBans");
    setTimeout(() => setSavedKey(null), 1200);
  }, [noteKey, data, onSave]);

  const bans = notes.stageBans || [];

  const TEXT_SECTIONS = [
    { key: "flash", icon: "⚡", color: T.accent, bg: T.accentSoft, border: T.accentBorder, inputBg: "rgba(255,255,255,.08)" },
    { key: "gameplan", icon: "📋", color: T.sub, bg: T.card, border: T.brd, inputBg: T.inp },
  ];

  const order = sections?.length ? sections : BATTLE_NOTES_SECTION_ORDER;

  const renderTextSection = (key) => {
    const meta = TEXT_SECTIONS.find((s) => s.key === key);
    if (!meta) return null;
    const { icon, color, bg, border, inputBg } = meta;
    return (
      <div key={key} style={{ background: bg, borderRadius: 10, border: `1px solid ${border}`, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}>
          <span style={{ fontSize: 12 }}>{icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{t(`matchupNotes.${key}`)}</span>
          {savedKey === key && <span style={{ fontSize: 10, color: T.win, fontWeight: 600, marginLeft: "auto" }}>{t("matchupNotes.autoSaved")}</span>}
        </div>
        <div style={{ padding: "0 12px 8px" }}>
          {key === "flash" && <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>{t("matchupNotes.flashDesc")}</div>}
          <textarea
            defaultValue={notes[key] || ""}
            onFocus={(e) => {
              if (key === "gameplan" && !e.target.value.trim()) {
                const tpl = t("matchupNotes.gameplanPlaceholder");
                e.target.value = tpl;
                e.target.style.height = "auto";
                e.target.style.height = Math.max(36, e.target.scrollHeight) + "px";
              }
            }}
            onBlur={(e) => { if (e.target.value !== (notes[key] || "")) saveSection(key, e.target.value); }}
            placeholder={t(`matchupNotes.${key}Placeholder`)}
            ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.max(36, el.scrollHeight) + "px"; } }}
            onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.max(36, e.target.scrollHeight) + "px"; }}
            style={{
              width: "100%", padding: "6px 8px", background: inputBg, border: "none", borderRadius: 6,
              color: T.text, fontSize: 11, outline: "none", boxSizing: "border-box", resize: "none", overflow: "hidden",
              fontFamily: "inherit", lineHeight: 1.6, minHeight: 36,
            }}
          />
        </div>
      </div>
    );
  };

  const renderBans = () => (
    <div key="bans" style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.brd}`, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px" }}>
        <span style={{ fontSize: 12 }}>🗺️</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>{t("matchupNotes.stageBan")}</span>
        {savedKey === "stageBans" && <span style={{ fontSize: 10, color: T.win, fontWeight: 600, marginLeft: "auto" }}>{t("matchupNotes.autoSaved")}</span>}
        <span style={{ fontSize: 10, color: T.dim, marginLeft: savedKey === "stageBans" ? 0 : "auto" }}>{bans.length}/3</span>
      </div>
      <div style={{ padding: "0 12px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
          {STAGES.map((st) => {
            const isBanned = bans.includes(st.id);
            const stats = stageStats[st.id];
            const r = stats ? stats.w / (stats.w + stats.l) : null;
            return (
              <div key={st.id}
                onClick={() => {
                  let next;
                  if (isBanned) { next = bans.filter((b) => b !== st.id); }
                  else if (bans.length < 3) { next = [...bans, st.id]; }
                  else { return; }
                  updateBans(next);
                }}
                style={{
                  position: "relative", borderRadius: 6, overflow: "hidden",
                  cursor: bans.length >= 3 && !isBanned ? "not-allowed" : "pointer",
                  border: isBanned ? `2px solid ${T.lose}` : `1px solid ${T.brd}`,
                  opacity: isBanned ? 0.4 : 1, transition: "all .15s ease",
                }}
              >
                <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 32, objectFit: "cover", display: "block" }} />
                {isBanned && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(255,69,58,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: T.lose }}>✕</span>
                  </div>
                )}
                <div style={{ padding: "2px 3px", textAlign: "center", background: T.inp }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>{stageName(st.id, lang)}</div>
                  {stats && <div style={{ fontSize: 7, fontWeight: 700, color: r >= 0.6 ? T.win : r <= 0.4 ? T.lose : "#FF9F0A" }}>{Math.round(r * 100)}%</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
      {order.map((k) => (
        <Fragment key={k}>
          {(k === "flash" || k === "gameplan") && renderTextSection(k)}
          {k === "bans" && renderBans()}
        </Fragment>
      ))}
    </div>
  );
}
