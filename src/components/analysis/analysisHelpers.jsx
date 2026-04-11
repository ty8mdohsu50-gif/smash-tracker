import { Share2 } from "lucide-react";
import FighterIcon from "../shared/FighterIcon";
import { shortName, fighterName } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import {
  formatDate,
  formatTime,
  percentStr,
  barColor,
} from "../../utils/format";
import { needsReview } from "../shared/MatchupNotesEditor";

export function cardStyle(T) {
  return {
    background: T.card, borderRadius: 16, padding: "16px 18px", marginBottom: 12,
    boxShadow: T.sh, border: T.brd !== "transparent" ? `1px solid ${T.brd}` : "none",
  };
}

export function pill(k, l, cur, fn, T, isPC) {
  return (
    <button key={k} onClick={() => fn(k)} style={{
      flex: 1, padding: isPC ? "10px 0" : "9px 0", borderRadius: 10, border: "none",
      fontSize: isPC ? 13 : 12, fontWeight: cur === k ? 700 : 500, cursor: "pointer", textAlign: "center",
      background: cur === k ? T.accentGrad : T.inp, color: cur === k ? "#fff" : T.sub, transition: "all .15s ease",
    }}>{l}</button>
  );
}

export function renderBar(r, T) {
  return (
    <div style={{ height: 6, background: T.inp, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
      <div style={{ width: `${r * 100}%`, height: "100%", borderRadius: 3, background: barColor(r) }} />
    </div>
  );
}

export function renderLabel(r, T, t) {
  const label = r >= 0.6 ? t("analysis.winning") : r >= 0.4 ? t("analysis.even") : t("analysis.losing");
  const bg = r >= 0.6 ? T.winBg : r >= 0.4 ? "rgba(255,159,10,.15)" : T.loseBg;
  const color = r >= 0.6 ? T.win : r >= 0.4 ? "#a16207" : T.lose;
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: bg, color }}>{label}</span>;
}

export function charRow({ s, onClick, showReviewBadge, data, T, lang, t, isPC }) {
  const cd = cardStyle(T);
  const r = s.t ? s.w / s.t : 0;
  const review = showReviewBadge && needsReview(data.matchupNotes?.[s.c], data.matches, s.c);
  return (
    <button key={s.c} onClick={onClick} style={{
      ...cd, marginBottom: isPC ? 0 : 8, padding: "14px 18px", width: "100%", cursor: "pointer", textAlign: "left",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
          <FighterIcon name={s.c} size={28} />{fighterName(s.c, lang)}
          {review && <span style={{ fontSize: 9, fontWeight: 700, color: "#FF9F0A", background: "#FF9F0A18", padding: "2px 6px", borderRadius: 6 }}>{t("matchupNotes.reviewNeeded")}</span>}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>{t("analysis.winRate")}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: barColor(r) }}>{percentStr(s.w, s.t)}</span>
        </div>
      </div>
      {renderBar(r, T)}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: T.dim }}>{s.w}W {s.l}L · {s.t}{t("analysis.battles")}</span>
        <span style={{ fontSize: 12, color: T.accent }}>{t("analysis.detail")}</span>
      </div>
    </button>
  );
}

export function matchupCell({ s, parentChar, popupOverride, setOppDetail, setOppSubTab, setExpandedItem, setDateDetailModal, setMatchupPopup, T, isPC, lang }) {
  const r = s.t ? s.w / s.t : 0;
  const fought = s.t > 0;
  const iconSize = isPC ? 36 : 28;
  const bgColor = !fought ? "transparent" : r >= 0.6 ? (T.winBg || "rgba(52,199,89,.1)") : r <= 0.4 ? (T.loseBg || "rgba(255,69,58,.1)") : "rgba(255,159,10,.08)";
  const handleClick = () => {
    if (popupOverride?.isOppMode) {
      setOppDetail(s.c); setOppSubTab("myChars"); setExpandedItem(null); setDateDetailModal(null);
      return;
    }
    if (popupOverride) { setMatchupPopup(popupOverride); return; }
    if (parentChar) setMatchupPopup({ myChar: parentChar, oppChar: s.c });
  };
  return (
    <div key={s.c} onClick={handleClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        padding: isPC ? "8px 4px" : "6px 2px", borderRadius: 10,
        background: bgColor, border: `1px solid ${fought ? T.brd : "transparent"}`,
        cursor: "pointer", opacity: fought ? 1 : 0.45,
        transition: "opacity .15s",
      }}>
      <FighterIcon name={s.c} size={iconSize} />
      <div style={{ fontSize: isPC ? 9 : 8, fontWeight: 600, color: T.sub, textAlign: "center", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
        {shortName(s.c, lang)}
      </div>
      <div style={{ fontSize: isPC ? 12 : 10, fontWeight: 800, color: fought ? barColor(r) : T.dim, fontFamily: "'Chakra Petch', sans-serif" }}>
        {fought ? percentStr(s.w, s.t) : "---"}
      </div>
      {fought && (
        <div style={{ fontSize: isPC ? 9 : 8, color: T.dim, fontWeight: 500 }}>{s.w}W {s.l}L</div>
      )}
    </div>
  );
}

export function charSortToolbar({ sortKey, hideKey, analysisPrefs, setAnalysisPrefs, T, isPC, t }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.dim, fontWeight: 600, cursor: "pointer" }}>
        <input type="checkbox" checked={analysisPrefs[hideKey]} onChange={(e) => setAnalysisPrefs({ [hideKey]: e.target.checked })} style={{ accentColor: T.accent, cursor: "pointer" }} />
        {t("analysis.hideUnfought")}
      </label>
      <span style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>{t("analysis.sortBy")}</span>
      <select
        value={analysisPrefs[sortKey]}
        onChange={(e) => setAnalysisPrefs({ [sortKey]: e.target.value })}
        style={{
          padding: "8px 10px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.inp, color: T.text, fontSize: 12, fontFamily: "inherit",
          maxWidth: isPC ? 240 : "100%", flex: isPC ? "none" : 1, minWidth: 0, cursor: "pointer",
        }}
      >
        <option value="officialAsc">{t("analysis.sortOfficialAsc")}</option>
        <option value="officialDesc">{t("analysis.sortOfficialDesc")}</option>
        <option value="wrDesc">{t("analysis.sortWrHigh")}</option>
        <option value="wrAsc">{t("analysis.sortWrLow")}</option>
        <option value="gamesDesc">{t("analysis.sortGamesHigh")}</option>
        <option value="gamesAsc">{t("analysis.sortGamesLow")}</option>
      </select>
    </div>
  );
}

export function analysisMatchLogRow({ m, i, total, T, isPC, lang, t, matchLogGridCols }) {
  return (
    <div key={i} style={{ borderBottom: i < total - 1 ? `1px solid ${T.inp}` : "none" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: matchLogGridCols,
          alignItems: "center",
          columnGap: isPC ? 8 : 4,
          rowGap: 0,
          padding: isPC ? "10px 12px" : "8px 10px",
          minHeight: isPC ? 46 : 42,
        }}
      >
        <span style={{ fontSize: isPC ? 12 : 11, color: T.dim, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatDate(m.date)}</span>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <FighterIcon name={m.myChar} size={isPC ? 26 : 22} />
        </div>
        <span
          style={{ fontSize: isPC ? 12 : 11, fontWeight: 600, color: T.text, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}
          title={fighterName(m.myChar, lang)}
        >
          {fighterName(m.myChar, lang)}
        </span>
        <span style={{ fontSize: 10, color: T.dim, textAlign: "center", fontWeight: 700 }}>{t("common.vs")}</span>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <FighterIcon name={m.oppChar} size={isPC ? 26 : 22} />
        </div>
        <span
          style={{ fontSize: isPC ? 12 : 11, fontWeight: 600, color: T.text, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}
          title={fighterName(m.oppChar, lang)}
        >
          {fighterName(m.oppChar, lang)}
        </span>
        <span
          style={{ fontSize: isPC ? 11 : 10, color: m.stage ? T.sub : T.dim, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", fontWeight: 500 }}
          title={m.stage ? stageName(m.stage, lang) : ""}
        >
          {m.stage ? stageName(m.stage, lang) : "\u2014"}
        </span>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <span style={{
            fontSize: isPC ? 11 : 10, fontWeight: 800, letterSpacing: "0.02em", minWidth: 42, textAlign: "center", padding: "5px 8px", borderRadius: 8,
            background: m.result === "win" ? T.winBg : T.loseBg, color: m.result === "win" ? T.win : T.lose,
          }}
          >
            {m.result === "win" ? t("common.win") : t("common.lose")}
          </span>
        </div>
      </div>
      {m.memo && String(m.memo).trim() && (
        <div style={{
          margin: "2px 10px 10px",
          padding: "10px 12px",
          background: T.inp,
          borderRadius: 10,
          fontSize: isPC ? 13 : 12,
          color: T.text,
          lineHeight: 1.5,
          borderLeft: `3px solid ${T.accent}`,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        >
          {m.memo}
        </div>
      )}
    </div>
  );
}

export function analysisMatchLogTable({ matchesRev, T, isPC, lang, t }) {
  const matchLogGridCols = isPC
    ? "76px 28px minmax(0,1fr) 22px 28px minmax(0,1.1fr) minmax(68px, 104px) 56px"
    : "58px 22px minmax(0,1fr) 16px 22px minmax(0,1fr) minmax(0,56px) 44px";
  return (
    <div style={{ borderRadius: 14, border: `1px solid ${T.brd}`, overflow: "hidden", background: T.card }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: matchLogGridCols,
          alignItems: "center",
          columnGap: isPC ? 8 : 4,
          padding: isPC ? "10px 12px" : "8px 10px",
          borderBottom: `1px solid ${T.brd}`,
          background: T.inp,
          position: "sticky",
          top: 0,
          zIndex: 1,
          fontSize: isPC ? 10 : 9,
          fontWeight: 800,
          color: T.dim,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{t("analysis.logColDate")}</span>
        <span style={{ display: "flex", justifyContent: "center" }} aria-hidden="true" />
        <span>{t("analysis.logColYou")}</span>
        <span style={{ textAlign: "center", fontSize: 9, fontWeight: 800 }}>{t("common.vs")}</span>
        <span style={{ display: "flex", justifyContent: "center" }} aria-hidden="true" />
        <span>{t("analysis.logColOpp")}</span>
        <span style={{ textAlign: "center" }}>{t("analysis.logColStage")}</span>
        <span style={{ textAlign: "center" }}>{t("analysis.logColResult")}</span>
      </div>
      <div style={{ maxHeight: isPC ? "min(52vh, 480px)" : "min(46vh, 380px)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        {matchesRev.map((m, i, arr) => analysisMatchLogRow({ m, i, total: arr.length, T, isPC, lang, t, matchLogGridCols }))}
      </div>
    </div>
  );
}
