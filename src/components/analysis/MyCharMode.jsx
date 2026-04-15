import { useState } from "react";
import { ChevronDown, Share2 } from "lucide-react";
import FighterIcon from "../shared/FighterIcon";
import Chart from "../shared/Chart";
import { shortName, fighterName, FIGHTERS } from "../../constants/fighters";
import {
  today,
  formatDate,
  percentStr,
  barColor,
  numFormat,
} from "../../utils/format";
import { useI18n } from "../../i18n/index.jsx";
import { sortCharStatsRows } from "../../utils/analysis";
import { cardStyle, pill, matchupCell, charSortToolbar } from "./analysisHelpers";
import DailyCalendar from "./DailyCalendar";

export default function MyCharMode({
  data, onSave, T, isPC,
  charDetail, setCharDetail,
  mCS, charMatchups, matchesWithIdx,
  analysisPrefs, setAnalysisPrefs,
  setMatchupPopup, setOppDetail, setOppSubTab,
  setExpandedItem, setDateDetailModal, dateDetailModal,
  setMatchLogModal,
  editingStageIdx, setEditingStageIdx,
  setConfirmAction, updateMatchStage, doShare,
  dailyMonth, setDailyMonth,
}) {
  const { t, lang } = useI18n();
  const cd = cardStyle(T);

  const [charSubTab, setCharSubTab] = useState("matchup");
  const [charMemoOpen, setCharMemoOpen] = useState(true);
  const [period, setPeriod] = useState("all");
  const chartRef = { current: null };

  // Trend data for charDetail
  const trendData = (() => {
    const empty = { points: [], cur: 0, chg: 0, mx: 0, mn: 0 };
    if (!charDetail) return empty;
    const dl = data.daily || {};
    const entries = Object.entries(dl)
      .map(([d, day]) => {
        const cp = day.chars?.[charDetail];
        if (!cp) return null;
        return [d, { start: cp.start || null, end: cp.end || null }];
      })
      .filter((e) => e && (e[1].start || e[1].end))
      .sort((a, b) => a[0].localeCompare(b[0]));
    if (!entries.length) return empty;

    const now = new Date();
    if (period === "day") {
      const todayMatches = data.matches
        .filter((m) => m.date === today() && m.power && m.myChar === charDetail)
        .sort((a, b) => a.time.localeCompare(b.time));
      const todayEntry = entries.find((e) => e[0] === today());
      const pts = [];
      if (todayEntry && todayEntry[1].start) pts.push({ date: today(), value: todayEntry[1].start, time: null });
      todayMatches.forEach((m) => pts.push({ date: today(), value: m.power, time: m.time }));
      if (!pts.length) return empty;
      const vals = pts.map((p) => p.value);
      const allSame = vals.every((v) => v === vals[0]);
      if (allSame && pts.length > 1) return { points: [], cur: vals[0], chg: 0, mx: vals[0], mn: vals[0], isToday: true };
      const cur = pts[pts.length - 1].value;
      return { points: pts, cur, chg: cur - pts[0].value, mx: Math.max(...vals), mn: Math.min(...vals), isToday: true };
    }

    let filtered;
    if (period === "week") {
      const w = new Date(now); w.setDate(w.getDate() - 7);
      filtered = entries.filter((e) => e[0] >= w.toISOString().split("T")[0]);
    } else if (period === "month") {
      const mo = new Date(now); mo.setDate(mo.getDate() - 30);
      filtered = entries.filter((e) => e[0] >= mo.toISOString().split("T")[0]);
    } else {
      filtered = entries;
    }
    if (!filtered.length) return empty;
    const pts = [];
    filtered.forEach((e) => {
      if (e[1].start) pts.push({ date: e[0], value: e[1].start });
      if (e[1].end) pts.push({ date: e[0], value: e[1].end });
    });
    if (!pts.length) return empty;
    const vals = pts.map((p) => p.value);
    const cur = pts[pts.length - 1].value;
    return { points: pts, cur, chg: cur - pts[0].value, mx: Math.max(...vals), mn: Math.min(...vals), dateFrom: pts[0].date, dateTo: pts[pts.length - 1].date };
  })();

  const periodLabels = { day: t("analysis.today"), week: t("analysis.week"), month: t("analysis.month"), all: t("analysis.all") };

  const shareTrend = async () => {
    const el = chartRef.current;
    if (!el) return;
    const svg = el.querySelector("svg");
    if (!svg) return;
    const charLabel = charDetail ? fighterName(charDetail, lang) : "";
    const label = `${charLabel} ${periodLabels[period] || t("analysis.all")}`;
    const dateRange = trendData.dateFrom && trendData.dateTo ? `${formatDate(trendData.dateFrom)} - ${formatDate(trendData.dateTo)}` : "";
    const shareText = `\u3010SMASH TRACKER\u3011${t("analysis.trend")}\uFF08${label}\uFF09${dateRange ? "\n" + dateRange : ""}\n\n#\u30B9\u30DE\u30D6\u30E9 #SmashTracker\nhttps://smash-tracker.pages.dev/`;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2; const headerH = 80; const footerH = 40;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale; canvas.height = img.height * scale + headerH + footerH;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#111827"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "bold 28px 'Chakra Petch', sans-serif";
      ctx.fillText(`SMASH TRACKER - ${t("analysis.trend")}\uFF08${label}\uFF09`, 20, 35);
      ctx.fillStyle = "#9ca3af"; ctx.font = "16px sans-serif"; ctx.fillText(dateRange, 20, 60);
      ctx.drawImage(img, 0, headerH, img.width * scale, img.height * scale);
      ctx.fillStyle = "#4b5563"; ctx.font = "14px sans-serif";
      ctx.fillText("smash-tracker.pages.dev  #\u30B9\u30DE\u30D6\u30E9 #SmashTracker", 20, canvas.height - 14);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(svgUrl);
        if (!blob) return;
        doShare(shareText, blob);
      }, "image/png");
    };
    img.src = svgUrl;
  };

  const trendSection = () => {
    return (
      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {pill("day", t("analysis.today"), period, setPeriod, T, isPC)}
          {pill("week", t("analysis.week"), period, setPeriod, T, isPC)}
          {pill("month", t("analysis.month"), period, setPeriod, T, isPC)}
          {pill("all", t("analysis.all"), period, setPeriod, T, isPC)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(4, 1fr)" : "1fr 1fr", gap: 6, marginBottom: 6 }}>
          {[
            { label: t("analysis.current"), value: trendData.cur ? numFormat(trendData.cur) : "\u2014", color: T.text },
            { label: t("analysis.change"), value: trendData.chg ? (trendData.chg > 0 ? "+" : "") + numFormat(trendData.chg) : "\u2014", color: trendData.chg > 0 ? T.win : trendData.chg < 0 ? T.lose : T.dim },
            { label: t("analysis.highest"), value: trendData.mx ? numFormat(trendData.mx) : "\u2014", color: trendData.mx ? T.win : T.dim },
            { label: t("analysis.lowest"), value: trendData.mn ? numFormat(trendData.mn) : "\u2014", color: trendData.mn ? T.lose : T.dim },
          ].map((s) => (
            <div key={s.label} style={{ ...cd, marginBottom: 0, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: T.dim, fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "'Chakra Petch', sans-serif" }}>{s.value}</div>
            </div>
          ))}
        </div>
        {trendData.points.length > 1 ? (
          <div ref={(el) => { chartRef.current = el; }} style={{ ...cd, padding: "12px 10px 8px" }}>
            <Chart points={trendData.points} T={T} isToday={trendData.isToday} />
          </div>
        ) : (
          <div style={{ ...cd, textAlign: "center", padding: 30 }}>
            <div style={{ fontSize: 13, color: T.dim }}>{t("analysis.enterPowerToSee")}</div>
          </div>
        )}
        {trendData.points.length > 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => shareTrend()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.inp, color: T.sub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Share2 size={14} /> {t("analysis.share")}
            </button>
          </div>
        )}
      </div>
    );
  };

  const cellProps = { setOppDetail, setOppSubTab, setExpandedItem, setDateDetailModal, setMatchupPopup, T, isPC, lang };

  // Grid view (no charDetail)
  if (!charDetail) {
    if (mCS.length === 0) {
      return <div style={{ ...cd, textAlign: "center", padding: 20, color: T.dim, fontSize: 13 }}>{t("analysis.noCharData")}</div>;
    }
    const allMyChars = FIGHTERS.map((c) => {
      const found = mCS.find((s) => s.c === c);
      return found || { c, w: 0, l: 0, t: 0 };
    });
    const sortedMy = sortCharStatsRows(allMyChars, analysisPrefs.topMySort, analysisPrefs.topMyHide);
    return (
      <div>
        {charSortToolbar({ sortKey: "topMySort", hideKey: "topMyHide", analysisPrefs, setAnalysisPrefs, T, isPC, t })}
        <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(auto-fill, minmax(110px, 1fr))" : "repeat(auto-fill, minmax(82px, 1fr))", gap: isPC ? 8 : 6 }}>
          {sortedMy.map((s) => {
            const r = s.t ? s.w / s.t : 0;
            const used = s.t > 0;
            const iconSize = isPC ? 36 : 28;
            const bgColor = !used ? "transparent" : r >= 0.6 ? (T.winBg || "rgba(52,199,89,.1)") : r <= 0.4 ? (T.loseBg || "rgba(255,69,58,.1)") : "rgba(255,159,10,.08)";
            return (
              <div
                key={s.c}
                onClick={used ? () => { setCharDetail(s.c); setCharSubTab("matchup"); setExpandedItem(null); setDateDetailModal(null); setPeriod("all"); } : undefined}
                role={used ? "button" : undefined}
                tabIndex={used ? 0 : -1}
                aria-disabled={used ? undefined : true}
                onKeyDown={used ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCharDetail(s.c); setCharSubTab("matchup"); setExpandedItem(null); setDateDetailModal(null); setPeriod("all"); } } : undefined}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: isPC ? "8px 4px" : "6px 2px", borderRadius: 10,
                  background: bgColor, border: `1px solid ${used ? T.brd : "transparent"}`,
                  cursor: used ? "pointer" : "default",
                  pointerEvents: used ? "auto" : "none",
                  opacity: used ? 1 : 0.45,
                  transition: "opacity .15s",
                }}>
                <FighterIcon name={s.c} size={iconSize} />
                <div style={{ fontSize: isPC ? 9 : 8, fontWeight: 600, color: T.sub, textAlign: "center", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                  {shortName(s.c, lang)}
                </div>
                <div style={{ fontSize: isPC ? 12 : 10, fontWeight: 800, color: used ? barColor(r) : T.dim, fontFamily: "'Chakra Petch', sans-serif" }}>
                  {used ? percentStr(s.w, s.t) : "---"}
                </div>
                {used && (
                  <div style={{ fontSize: isPC ? 9 : 8, color: T.dim, fontWeight: 500 }}>{s.w}W {s.l}L</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Detail view
  const stats = charMatchups.reduce((a, s) => ({ w: a.w + s.w, l: a.l + s.l }), { w: 0, l: 0 });
  const sortedMu = sortCharStatsRows(charMatchups, analysisPrefs.myMuSort, analysisPrefs.myMuHide);

  return (
    <div>
      {/* Header */}
      <div style={{ ...cd, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
        <button onClick={() => { setCharDetail(null); setExpandedItem(null); setDateDetailModal(null); }} style={{ border: "none", background: T.inp, borderRadius: 10, padding: "8px 14px", color: T.sub, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
          {t("analysis.backToList")}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FighterIcon name={charDetail} size={36} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{fighterName(charDetail, lang)}</div>
            <div style={{ fontSize: 12, color: T.dim }}>{stats.w + stats.l}{t("analysis.battles")} {stats.w}W {stats.l}L ({percentStr(stats.w, stats.w + stats.l)})</div>
          </div>
        </div>
      </div>

      {/* Char memo (collapsible) */}
      <div key={`memo-${charDetail}`} style={{ ...cd, padding: "12px 16px" }}>
        <div onClick={() => setCharMemoOpen(!charMemoOpen)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <span style={{ fontSize: 12, color: T.dim, fontWeight: 600 }}>{fighterName(charDetail, lang)} {t("battle.charMemo")}</span>
          <ChevronDown size={16} style={{ color: T.dim, transition: "transform .2s", transform: charMemoOpen ? "rotate(180deg)" : "rotate(0)" }} />
        </div>
        {charMemoOpen && (
          <textarea
            defaultValue={data.charMemos?.[charDetail] || ""}
            onBlur={(e) => {
              if (e.target.value !== (data.charMemos?.[charDetail] || "")) {
                onSave({ ...data, charMemos: { ...(data.charMemos || {}), [charDetail]: e.target.value } });
              }
            }}
            ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.max(40, el.scrollHeight) + "px"; } }}
            onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.max(40, e.target.scrollHeight) + "px"; }}
            placeholder={t("battle.charMemoPlaceholder")}
            maxLength={500}
            style={{ width: "100%", padding: "8px 10px", background: T.inp, border: "none", borderRadius: 8, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", lineHeight: 1.5, overflow: "hidden", minHeight: 40, marginTop: 8 }}
          />
        )}
      </div>

      {/* Sub-tabs: matchup / trend / daily */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[["matchup", t("analysis.matchup")], ["trend", t("analysis.trend")], ["daily", t("analysis.dailyRecord")]].map(([k, l]) => (
          <button key={k} onClick={() => { setCharSubTab(k); setExpandedItem(null); setDateDetailModal(null); }} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 13,
            fontWeight: charSubTab === k ? 700 : 500, textAlign: "center",
            background: charSubTab === k ? T.accentGrad : T.inp, color: charSubTab === k ? "#fff" : T.sub, transition: "all .15s ease",
          }}>{l}</button>
        ))}
      </div>

      {/* Matchup sub-tab */}
      {charSubTab === "matchup" && (
        <div>
          {charSortToolbar({ sortKey: "myMuSort", hideKey: "myMuHide", analysisPrefs, setAnalysisPrefs, T, isPC, t })}
          <button
            type="button"
            onClick={() => setMatchLogModal({
              title: `${fighterName(charDetail, lang)} \u2014 ${t("analysis.openMatchLog")}`,
              matches: matchesWithIdx.filter((m) => m.myChar === charDetail),
            })}
            style={{
              width: "100%", marginBottom: 12, padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.accentBorder}`,
              background: T.accentSoft, color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t("analysis.openMatchLog")}
          </button>
          <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(auto-fill, minmax(110px, 1fr))" : "repeat(auto-fill, minmax(82px, 1fr))", gap: isPC ? 8 : 6 }}>
            {sortedMu.map((s) => matchupCell({ s, parentChar: charDetail, popupOverride: null, ...cellProps }))}
          </div>
        </div>
      )}

      {/* Trend sub-tab */}
      {charSubTab === "trend" && trendSection()}

      {/* Daily sub-tab */}
      {charSubTab === "daily" && (
        <div>
          <button
            type="button"
            onClick={() => setMatchLogModal({
              title: `${fighterName(charDetail, lang)} \u2014 ${t("analysis.openMatchLog")}`,
              matches: matchesWithIdx.filter((m) => m.myChar === charDetail),
            })}
            style={{
              width: "100%", marginBottom: 12, padding: "10px 14px", borderRadius: 12, border: `1px solid ${T.accentBorder}`,
              background: T.accentSoft, color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t("analysis.openMatchLog")}
          </button>
          <DailyCalendar
            data={data} filterFn={(m) => m.myChar === charDetail} scope={{ type: "myChar", c: charDetail }}
            dailyMonth={dailyMonth} setDailyMonth={setDailyMonth}
            dateDetailModal={dateDetailModal} setDateDetailModal={setDateDetailModal}
            editingStageIdx={editingStageIdx} setEditingStageIdx={setEditingStageIdx}
            setConfirmAction={setConfirmAction} updateMatchStage={updateMatchStage}
            doShare={doShare} T={T} isPC={isPC} lang={lang} t={t}
          />
        </div>
      )}
    </div>
  );
}
