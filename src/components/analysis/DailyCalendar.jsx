import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import FighterIcon from "../shared/FighterIcon";
import ResultBadge from "../shared/ResultBadge";
import { shortName, fighterName } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import {
  today,
  formatDate,
  formatTime,
  percentStr,
  barColor,
  numFormat,
} from "../../utils/format";
import { buildDailyMap, dailyScopesEqual, analysisModalShellStyles } from "../../utils/analysis";
import { cardStyle } from "./analysisHelpers";

export default function DailyCalendar({
  data, filterFn, scope, dailyOpts = {},
  dailyMonth, setDailyMonth,
  dateDetailModal, setDateDetailModal,
  editingStageIdx, setEditingStageIdx,
  setConfirmAction, updateMatchStage,
  doShare,
  T, isPC, lang, t,
}) {
  const { pcOverallRightColumn = false } = dailyOpts;
  const cd = cardStyle(T);
  const dailyMap = buildDailyMap(data.matches, filterFn);
  if (!Object.keys(dailyMap).length) return <div style={{ ...cd, textAlign: "center", padding: 20, color: T.dim, fontSize: 13 }}>{t("analysis.noData")}</div>;

  const [yStr, mStr] = dailyMonth.split("-");
  const year = Number(yStr);
  const month = parseInt(mStr) - 1;
  const monthLabel = lang === "ja"
    ? `${year}\u5E74${month + 1}\u6708`
    : `${new Date(year, month).toLocaleString("en", { month: "long" })} ${year}`;

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // Monday start
  const todayStr = today();
  const weekDays = t("heatmap.weekDays");

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setDailyMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setDateDetailModal(null);
  };
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    setDailyMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setDateDetailModal(null);
  };
  const goCurrentMonth = () => {
    const now = new Date();
    setDailyMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    setDateDetailModal(null);
  };
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = dailyMonth === currentMonth;

  // Month summary
  const monthDays = Object.entries(dailyMap).filter(([d]) => d.startsWith(dailyMonth));
  const monthW = monthDays.reduce((a, [, d]) => a + d.w, 0);
  const monthL = monthDays.reduce((a, [, d]) => a + d.l, 0);
  const monthTotal = monthW + monthL;
  const monthR = monthTotal ? monthW / monthTotal : 0;

  const dotColor = (r) => r >= 0.6 ? T.win : r <= 0.4 ? T.lose : T.mid;

  const calTight = pcOverallRightColumn && isPC;
  const calendarGrid = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: calTight ? 0 : 1, textAlign: "center" }}>
      {weekDays.map((d, i) => (
        <div key={`h${i}`} style={{ fontSize: calTight ? 9 : 10, fontWeight: 600, color: T.dim, padding: calTight ? "1px 0" : "2px 0" }}>{d}</div>
      ))}
      {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const dateStr = `${yStr}-${mStr}-${String(day).padStart(2, "0")}`;
        const dayData = dailyMap[dateStr];
        const isFuture = dateStr > todayStr;
        const isSelected = dateDetailModal?.date === dateStr && dailyScopesEqual(dateDetailModal?.scope, scope);
        const isToday = dateStr === todayStr;
        const hasData = !!dayData;
        const r = hasData ? dayData.w / (dayData.w + dayData.l) : 0;

        return (
          <div
            key={day}
            onClick={() => {
              if (!hasData) return;
              if (isSelected) setDateDetailModal(null);
              else setDateDetailModal({ date: dateStr, scope });
            }}
            style={{
              padding: calTight ? "3px 0" : isPC ? "5px 0" : "4px 0",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              borderRadius: 8, cursor: hasData ? "pointer" : "default",
              background: isSelected ? T.accentSoft : "transparent",
              border: isSelected ? `2px solid ${T.accent}` : isToday ? `1px solid ${T.dimmer}` : "1px solid transparent",
              opacity: isFuture ? 0.3 : 1, transition: "all .1s ease",
            }}
          >
            <span style={{ fontSize: calTight ? 10 : isPC ? 12 : 11, fontWeight: isToday ? 800 : 500, color: isSelected ? T.accent : isToday ? T.text : T.sub, lineHeight: 1 }}>
              {day}
            </span>
            {hasData && (
              <div style={{ width: 5, height: 5, borderRadius: 3, background: dotColor(r), marginTop: 2 }} />
            )}
          </div>
        );
      })}
    </div>
  );

  const navMb = pcOverallRightColumn && isPC ? 4 : 10;
  const monthNav = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: navMb }}>
      <button onClick={prevMonth} style={{ border: "none", background: "transparent", color: T.text, padding: 6, cursor: "pointer" }}>
        <ChevronLeft size={20} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{monthLabel}</span>
        {!isCurrentMonth && (
          <button onClick={goCurrentMonth} style={{ border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, cursor: "pointer" }}>
            {t("analysis.thisMonth")}
          </button>
        )}
      </div>
      <button onClick={nextMonth} style={{ border: "none", background: "transparent", color: T.text, padding: 6, cursor: "pointer" }}>
        <ChevronRight size={20} />
      </button>
    </div>
  );

  const monthSummary = monthTotal > 0 && (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px", marginBottom: 6, fontSize: 12, color: T.dim }}>
      <span>{monthTotal}{t("analysis.battles")}</span>
      <span style={{ fontWeight: 800, fontSize: 14 }}>
        <span style={{ color: T.win }}>{monthW}</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: T.lose }}>{monthL}</span>
      </span>
      <span style={{ fontWeight: 700, fontSize: 13, color: barColor(monthR) }}>{percentStr(monthW, monthTotal)}</span>
    </div>
  );

  const stageGridFluid = "repeat(auto-fill, minmax(76px, 1fr))";

  const matchDetail = (matches) => matches.slice().reverse().map((m, i) => {
    const isEditing = editingStageIdx === m.idx;
    return (
      <div key={i} style={{ paddingBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ResultBadge result={m.result} size="inline" T={T} style={{ minWidth: 36, fontSize: 12 }} />
          <FighterIcon name={m.myChar} size={20} />
          <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{shortName(m.myChar, lang)}</span>
          <span style={{ fontSize: 11, color: T.dim }}>vs</span>
          <FighterIcon name={m.oppChar} size={20} />
          <span style={{ fontSize: 12, color: T.sub, fontWeight: 600, flex: 1 }}>{shortName(m.oppChar, lang)}</span>
          {m.stage && !isEditing && <span style={{ fontSize: 9, color: T.dim, background: T.inp, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{stageName(m.stage, lang)}</span>}
          {m.time && <span style={{ fontSize: 11, color: T.dim }}>{formatTime(m.time)}</span>}
          <button onClick={(e) => { e.stopPropagation(); setEditingStageIdx(isEditing ? null : m.idx); }}
            style={{ border: "none", background: T.inp, color: T.sub, fontSize: 9, padding: "2px 5px", borderRadius: 4, cursor: "pointer", flexShrink: 0 }}>{isEditing ? "\u2713" : "\uD83D\uDDFA"}</button>
          <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ idx: m.idx }); }}
            style={{ border: "none", background: "transparent", color: T.dimmer, fontSize: 16, cursor: "pointer", padding: "4px 6px", flexShrink: 0 }}>×</button>
        </div>
        {isEditing && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 4, marginBottom: 2, marginLeft: 36 }}>
            {STAGES.map((st) => (
              <div key={st.id} onClick={(e) => { e.stopPropagation(); updateMatchStage(m.idx, m.stage === st.id ? null : st.id); }}
                style={{ textAlign: "center", cursor: "pointer", borderRadius: 6, border: m.stage === st.id ? `2px solid ${T.accent}` : `1px solid ${T.brd}`, padding: 2, opacity: m.stage === st.id ? 1 : 0.6 }}>
                <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 24, objectFit: "cover", borderRadius: 4 }} />
                <div style={{ fontSize: 8, color: T.text, marginTop: 1 }}>{stageName(st.id, lang)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  });

  const detailDate = dateDetailModal && dailyScopesEqual(dateDetailModal.scope, scope) ? dateDetailModal.date : null;
  const selectedDayData = detailDate ? dailyMap[detailDate] : null;

  const closeDailyFs = { border: "none", background: T.inp, borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, fontSize: 20, fontWeight: 700, flexShrink: 0 };
  const dailyModalShell = analysisModalShellStyles(isPC, T);

  const dayDetailModalContent = selectedDayData ? (() => {
    const ms = selectedDayData.matches;
    const total = selectedDayData.w + selectedDayData.l;
    const r = total ? selectedDayData.w / total : 0;

    // Streak calculation
    let maxWin = 0, maxLose = 0, curWin = 0, curLose = 0;
    ms.forEach((m) => {
      if (m.result === "win") { curWin++; curLose = 0; maxWin = Math.max(maxWin, curWin); }
      else { curLose++; curWin = 0; maxLose = Math.max(maxLose, curLose); }
    });

    // GSP change
    const dayPowers = ms.filter((m) => m.power).map((m) => m.power);
    const dailyEntry = data.daily?.[detailDate];
    const charPowers = dailyEntry?.chars || {};
    let gspStart = null, gspEnd = null;
    for (const cp of Object.values(charPowers)) {
      if (cp.start && (!gspStart || cp.start < gspStart)) gspStart = cp.start;
      if (cp.end && (!gspEnd || cp.end > gspEnd)) gspEnd = cp.end;
    }
    if (!gspStart && dayPowers.length) gspStart = dayPowers[0];
    if (!gspEnd && dayPowers.length) gspEnd = dayPowers[dayPowers.length - 1];
    const gspDiff = gspStart && gspEnd ? gspEnd - gspStart : null;

    // Opponent character distribution
    const oppDist = {};
    ms.forEach((m) => {
      if (!oppDist[m.oppChar]) oppDist[m.oppChar] = { w: 0, l: 0 };
      m.result === "win" ? oppDist[m.oppChar].w++ : oppDist[m.oppChar].l++;
    });
    const oppRanked = Object.entries(oppDist).sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l));

    // Stage win rate
    const stageDist = {};
    ms.filter((m) => m.stage).forEach((m) => {
      if (!stageDist[m.stage]) stageDist[m.stage] = { w: 0, l: 0 };
      m.result === "win" ? stageDist[m.stage].w++ : stageDist[m.stage].l++;
    });

    // Session time range
    const times = ms.filter((m) => m.time).map((m) => m.time).sort();
    const sessionStart = times.length > 0 ? formatTime(times[0]) : null;
    const sessionEnd = times.length > 1 ? formatTime(times[times.length - 1]) : null;

    return (
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: isPC ? "14px 18px 20px" : "12px 14px 18px", background: T.bg }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 10 }}>
            <button type="button" onClick={() => {
              const lines = [`\u3010SMASH TRACKER\u3011${formatDate(detailDate)}`, `${selectedDayData.w}W ${selectedDayData.l}L\uFF08${t("analysis.winRate")} ${percentStr(selectedDayData.w, total)}\uFF09`,
                "", "#\u30B9\u30DE\u30D6\u30E9 #SmashTracker", "https://smash-tracker.pages.dev/"];
              doShare(lines.join("\n"));
            }} style={{ border: "none", background: T.inp, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <Share2 size={12} /> {t("analysis.share")}
            </button>
          </div>
          {/* Main stats */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <div style={{ flex: 1, background: T.inp, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 3 }}>{t("analysis.winLoss")}</div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>
                <span style={{ color: T.win }}>{selectedDayData.w}</span>
                <span style={{ color: T.dimmer, fontSize: 14, margin: "0 3px" }}>:</span>
                <span style={{ color: T.lose }}>{selectedDayData.l}</span>
              </div>
            </div>
            <div style={{ flex: 1, background: T.inp, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 3 }}>{t("analysis.winRate")}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>{percentStr(selectedDayData.w, total)}</div>
            </div>
            <div style={{ flex: 1, background: T.inp, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 3 }}>{t("analysis.totalMatches")}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: T.text, fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>{total}</div>
            </div>
          </div>
          {/* Secondary stats row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <div style={{ flex: 1, background: T.inp, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: T.dim, fontWeight: 600, marginBottom: 2 }}>{t("analysis.maxWinStreak")}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.win, fontFamily: "'Chakra Petch', sans-serif" }}>{maxWin}</div>
            </div>
            <div style={{ flex: 1, background: T.inp, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: T.dim, fontWeight: 600, marginBottom: 2 }}>{t("analysis.maxLoseStreak")}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.lose, fontFamily: "'Chakra Petch', sans-serif" }}>{maxLose}</div>
            </div>
            {gspDiff !== null && (
              <div style={{ flex: 1, background: T.inp, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: T.dim, fontWeight: 600, marginBottom: 2 }}>{t("analysis.gspChange")}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: gspDiff > 0 ? T.win : gspDiff < 0 ? T.lose : T.dim, fontFamily: "'Chakra Petch', sans-serif" }}>
                  {gspDiff > 0 ? "+" : ""}{numFormat(gspDiff)}
                </div>
              </div>
            )}
            {sessionStart && (
              <div style={{ flex: 1, background: T.inp, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: T.dim, fontWeight: 600, marginBottom: 2 }}>{t("analysis.sessionTime")}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{sessionStart}{sessionEnd ? ` - ${sessionEnd}` : ""}</div>
              </div>
            )}
          </div>
        </div>

        {/* Opponent distribution */}
        {oppRanked.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, marginBottom: 6 }}>{t("analysis.oppDistribution")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {oppRanked.slice(0, 8).map(([opp, d]) => {
                const or = (d.w + d.l) > 0 ? d.w / (d.w + d.l) : 0;
                return (
                  <div key={opp} style={{ display: "flex", alignItems: "center", gap: 4, background: T.inp, borderRadius: 8, padding: "4px 8px" }}>
                    <FighterIcon name={opp} size={18} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: barColor(or) }}>{d.w}W{d.l}L</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage win rate */}
        {Object.keys(stageDist).length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, marginBottom: 6 }}>{t("stages.winRateByStage")}</div>
            <div style={{ display: "grid", gridTemplateColumns: stageGridFluid, gap: 6 }}>
              {STAGES.filter((st) => stageDist[st.id]).map((st) => {
                const sd = stageDist[st.id];
                const sr = sd.w / (sd.w + sd.l);
                return (
                  <div key={st.id} style={{ textAlign: "center" }}>
                    <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 28, objectFit: "cover", borderRadius: 4 }} />
                    <div style={{ fontSize: 12, fontWeight: 800, color: barColor(sr), fontFamily: "'Chakra Petch', sans-serif", marginTop: 2 }}>{Math.round(sr * 100)}%</div>
                    <div style={{ fontSize: 8, color: T.dim }}>{sd.w}W{sd.l}L</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Match list */}
        <div style={{ maxHeight: "min(52vh, 480px)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {matchDetail(ms)}
        </div>
      </div>
    );
  })() : null;

  const calCard = (
    <div
      style={{
        ...cd,
        padding: pcOverallRightColumn && isPC ? "8px 8px" : isPC ? "8px 10px 10px" : "12px 14px",
        marginBottom: pcOverallRightColumn && isPC ? 0 : isPC ? 6 : 12,
        ...(pcOverallRightColumn && isPC
          ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "auto" }
          : {}),
      }}
    >
      {monthNav}
      {monthSummary}
      <div style={{ flex: pcOverallRightColumn && isPC ? 1 : undefined, minHeight: 0 }}>{calendarGrid}</div>
      <div style={{ fontSize: 9, color: T.dim, marginTop: 6, lineHeight: 1.35 }}>{t("history.selectDateDesc")}</div>
    </div>
  );

  const modal = selectedDayData && dateDetailModal && dailyScopesEqual(dateDetailModal.scope, scope) && (
    <div role="presentation" style={dailyModalShell.backdrop} onClick={() => setDateDetailModal(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-daily-detail-title"
        style={dailyModalShell.panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ flexShrink: 0, padding: "12px 16px", borderBottom: `1px solid ${T.brd}`, display: "flex", alignItems: "center", gap: 12, background: T.card }}>
          <button type="button" aria-label={t("common.close")} onClick={() => setDateDetailModal(null)} style={closeDailyFs}>×</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div id="analysis-daily-detail-title" style={{ fontSize: isPC ? 17 : 16, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>{formatDate(detailDate)}</div>
          </div>
        </div>
        {dayDetailModalContent}
      </div>
    </div>
  );

  if (pcOverallRightColumn && isPC) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0 }}>
        {calCard}
        {modal}
      </div>
    );
  }

  return (
    <>
      {calCard}
      {modal}
    </>
  );
}
