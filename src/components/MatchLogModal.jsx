import { useMemo, useState } from "react";
import { Z_MATCH_LOG_MODAL } from "../constants/zIndex";
import FighterIcon from "./FighterIcon";
import { shortName } from "../constants/fighters";
import { stageName } from "../constants/stages";
import { formatDate, formatTime } from "../utils/format";

const MAX_ROWS = 200;

export default function MatchLogModal({ open, onClose, title, matches, T, t, lang, isPC }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("dateDesc");

  const rows = useMemo(() => {
    let m = matches.map((row, i) => (typeof row.idx === "number" ? row : { ...row, idx: i }));
    if (filter === "win") m = m.filter((x) => x.result === "win");
    if (filter === "lose") m = m.filter((x) => x.result === "lose");
    const mul = sort === "dateDesc" ? -1 : 1;
    m.sort((a, b) => mul * (new Date(a.time).getTime() - new Date(b.time).getTime()));
    return m.slice(0, MAX_ROWS);
  }, [matches, filter, sort]);

  if (!open) return null;

  const sel = { padding: "8px 10px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.inp, color: T.text, fontSize: 12, fontFamily: "inherit", cursor: "pointer" };
  const panelW = isPC ? Math.min(720, typeof window !== "undefined" ? window.innerWidth - 48 : 720) : "100%";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: Z_MATCH_LOG_MODAL, display: "flex", alignItems: isPC ? "center" : "flex-end", justifyContent: "center", animation: "fadeUp .15s ease" }}>
      <div role="dialog" aria-modal="true" aria-labelledby="match-log-modal-title" onClick={(e) => e.stopPropagation()} style={{
        background: T.card, borderRadius: isPC ? 20 : "20px 20px 0 0", width: panelW, maxWidth: "100%",
        maxHeight: isPC ? "85vh" : "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)", border: `1px solid ${T.brd}`,
      }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.inp}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 10, flexWrap: "wrap" }}>
          <div id="match-log-modal-title" style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{title}</div>
          <button type="button" aria-label={t("common.close")} onClick={onClose} style={{ border: "none", background: T.inp, borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, fontSize: 20 }}>×</button>
        </div>

        <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.inp}`, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.dim }}>{t("analysis.logFilter")}</span>
          {[["all", t("analysis.logAll")], ["win", t("analysis.logWins")], ["lose", t("analysis.logLosses")]].map(([k, lab]) => (
            <button key={k} type="button" onClick={() => setFilter(k)} style={{ ...sel, fontWeight: filter === k ? 700 : 500, background: filter === k ? T.accentSoft : T.inp, borderColor: filter === k ? T.accentBorder : T.brd, color: filter === k ? T.accent : T.sub }}>
              {lab}
            </button>
          ))}
          <span style={{ fontSize: 11, fontWeight: 600, color: T.dim, marginLeft: isPC ? 8 : 0 }}>{t("analysis.logSort")}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...sel, flex: isPC ? "none" : 1, minWidth: 0 }}>
            <option value="dateDesc">{t("analysis.logSortNew")}</option>
            <option value="dateAsc">{t("analysis.logSortOld")}</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px 20px", WebkitOverflowScrolling: "touch" }}>
          {rows.length === 0 ? (
            <div style={{ textAlign: "center", color: T.dim, fontSize: 14, padding: 32 }}>{t("analysis.logEmpty")}</div>
          ) : (
            rows.map((m, i) => (
              <div key={`${m.time}-${m.date}-${i}`} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < rows.length - 1 ? `1px solid ${T.inp}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: T.dim }}>{formatDate(m.date)}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: m.result === "win" ? T.winBg : T.loseBg, color: m.result === "win" ? T.win : T.lose }}>{m.result === "win" ? "WIN" : "LOSE"}</span>
                  <FighterIcon name={m.myChar} size={22} />
                  <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{shortName(m.myChar, lang)}</span>
                  <span style={{ fontSize: 11, color: T.dim }}>vs</span>
                  <FighterIcon name={m.oppChar} size={22} />
                  <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{shortName(m.oppChar, lang)}</span>
                  {m.stage && <span style={{ fontSize: 10, color: T.dim, background: T.inp, padding: "2px 6px", borderRadius: 4 }}>{stageName(m.stage, lang)}</span>}
                  <span style={{ fontSize: 11, color: T.dim, marginLeft: "auto" }}>{formatTime(m.time)}</span>
                </div>
                {m.memo && String(m.memo).trim() ? (
                  <div style={{ fontSize: 14, color: T.text, lineHeight: 1.55, background: T.inp, padding: "10px 12px", borderRadius: 10, whiteSpace: "pre-wrap" }}>{m.memo}</div>
                ) : (
                  <div style={{ fontSize: 12, color: T.dim, fontStyle: "italic" }}>{t("analysis.logNoMemo")}</div>
                )}
              </div>
            ))
          )}
          {matches.length > MAX_ROWS && (
            <div style={{ fontSize: 11, color: T.dim, textAlign: "center", marginTop: 8 }}>{t("analysis.logTruncated", { n: MAX_ROWS })}</div>
          )}
        </div>
      </div>
    </div>
  );
}
