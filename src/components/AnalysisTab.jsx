import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { BarChart3, Share2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import MatchupNotesEditor, { needsReview } from "./MatchupNotesEditor";
import Chart from "./Chart";
import FighterIcon from "./FighterIcon";
import SharePopup from "./SharePopup";
import ConfirmDialog from "./ConfirmDialog";
import { shortName, fighterName, FIGHTERS } from "../constants/fighters";
import { STAGES, stageName, stageImg } from "../constants/stages";
import { useI18n } from "../i18n/index.jsx";
import {
  today,
  formatDate,
  formatDateWithDay,
  formatTime,
  formatPower,
  rawPower,
  percentStr,
  barColor,
  numFormat,
  formatHour,
  blurOnEnter,
} from "../utils/format";

export default function AnalysisTab({ data, onSave, T, isPC, aMode, setAMode }) {
  const { t, lang } = useI18n();

  // Navigation state
  const [charDetail, setCharDetailRaw] = useState(null);
  const [oppDetail, setOppDetailRaw] = useState(null);

  const setCharDetail = useCallback((v) => {
    if (v && !isPC) window.history.pushState({ type: "charDetail", v }, "");
    setCharDetailRaw(v);
  }, [isPC]);
  const setOppDetail = useCallback((v) => {
    if (v && !isPC) window.history.pushState({ type: "oppDetail", v }, "");
    setOppDetailRaw(v);
  }, [isPC]);

  useEffect(() => {
    if (isPC) return;
    const onPop = (e) => {
      if (oppDetail) { setOppDetailRaw(null); return; }
      if (charDetail) { setCharDetailRaw(null); return; }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isPC, charDetail, oppDetail]);
  const [charSubTab, setCharSubTab] = useState("matchup");
  const [oppSubTab, setOppSubTab] = useState("myChars");

  // Trend state
  const [period, setPeriod] = useState("all");
  const chartRef = useRef(null);

  // Expansion state
  const [expandedItem, setExpandedItem] = useState(null);
  const [expandedDate, setExpandedDate] = useState(null);
  const [expandedRolling, setExpandedRolling] = useState(null);
  const [expandedHour, setExpandedHour] = useState(null);

  // PC matchup popup
  const [matchupPopup, setMatchupPopup] = useState(null);
  const [charMemoOpen, setCharMemoOpen] = useState(true);

  // Editing state
  const [sharePopup, setSharePopup] = useState(null); // { text, imageBlob? }
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingStageIdx, setEditingStageIdx] = useState(null);

  // Month navigation for daily list
  const [dailyMonth, setDailyMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // ── Computed data ──

  const mCS = useMemo(() => {
    const s = {};
    data.matches.forEach((m) => {
      if (!s[m.myChar]) s[m.myChar] = { w: 0, l: 0 };
      m.result === "win" ? s[m.myChar].w++ : s[m.myChar].l++;
    });
    return Object.entries(s)
      .map(([c, v]) => ({ c, w: v.w, l: v.l, t: v.w + v.l }))
      .sort((a, b) => b.t - a.t);
  }, [data]);

  const oCS = useMemo(() => {
    const s = {};
    data.matches.forEach((m) => {
      if (!s[m.oppChar]) s[m.oppChar] = { w: 0, l: 0 };
      m.result === "win" ? s[m.oppChar].w++ : s[m.oppChar].l++;
    });
    return Object.entries(s)
      .map(([c, v]) => ({ c, w: v.w, l: v.l, t: v.w + v.l }))
      .sort((a, b) => FIGHTERS.indexOf(a.c) - FIGHTERS.indexOf(b.c));
  }, [data]);

  const totalW = useMemo(() => data.matches.filter((m) => m.result === "win").length, [data]);
  const totalL = data.matches.length - totalW;

  // Char detail matchups
  const charMatchups = useMemo(() => {
    if (!charDetail) return [];
    const s = {};
    data.matches.filter((m) => m.myChar === charDetail).forEach((m) => {
      if (!s[m.oppChar]) s[m.oppChar] = { w: 0, l: 0 };
      m.result === "win" ? s[m.oppChar].w++ : s[m.oppChar].l++;
    });
    return FIGHTERS.map((c) => ({
      c, w: s[c]?.w || 0, l: s[c]?.l || 0, t: (s[c]?.w || 0) + (s[c]?.l || 0),
    }));
  }, [data, charDetail]);

  // Opp detail: my chars used against this opponent
  const oppMyChars = useMemo(() => {
    if (!oppDetail) return [];
    const s = {};
    data.matches.filter((m) => m.oppChar === oppDetail).forEach((m) => {
      if (!s[m.myChar]) s[m.myChar] = { w: 0, l: 0 };
      m.result === "win" ? s[m.myChar].w++ : s[m.myChar].l++;
    });
    return Object.entries(s)
      .map(([c, v]) => ({ c, w: v.w, l: v.l, t: v.w + v.l }))
      .sort((a, b) => b.t - a.t);
  }, [data, oppDetail]);

  // Trend data for charDetail
  const trendData = useMemo(() => {
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
  }, [data, period, charDetail]);

  // Hourly stats
  const hourlyStats = useMemo(() => {
    const h = {};
    data.matches.forEach((m) => {
      const hr = formatHour(m.time);
      if (hr < 0) return;
      if (!h[hr]) h[hr] = { w: 0, l: 0 };
      m.result === "win" ? h[hr].w++ : h[hr].l++;
    });
    return h;
  }, [data]);

  // Rolling win rate
  const rolling = useMemo(() => {
    const r = {};
    [20, 50].forEach((n) => {
      const recent = data.matches.slice(-n);
      const w = recent.filter((m) => m.result === "win").length;
      r[n] = { w, t: recent.length };
    });
    return r;
  }, [data]);

  // Daily grouped (all)
  const dailyGroups = useMemo(() => {
    const groups = {};
    data.matches.forEach((m, idx) => {
      if (!groups[m.date]) groups[m.date] = { w: 0, l: 0, matches: [] };
      m.result === "win" ? groups[m.date].w++ : groups[m.date].l++;
      groups[m.date].matches.push({ ...m, idx });
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [data]);

  // ── Helpers ──

  const doShare = (text, imageBlob) => {
    setSharePopup({ text, imageBlob: imageBlob || null });
  };

  const deleteMatch = (idx) => {
    const nm = [...data.matches];
    nm.splice(idx, 1);
    onSave({ ...data, matches: nm });
  };

  const updateMatchStage = (idx, newStage) => {
    const nm = [...data.matches];
    nm[idx] = { ...nm[idx], stage: newStage || undefined };
    onSave({ ...data, matches: nm });
    setEditingStageIdx(null);
  };

  const periodLabels = { day: t("analysis.today"), week: t("analysis.week"), month: t("analysis.month"), all: t("analysis.all") };

  const shareTrend = useCallback(async () => {
    const el = chartRef.current;
    if (!el) return;
    const svg = el.querySelector("svg");
    if (!svg) return;
    const charLabel = charDetail ? fighterName(charDetail, lang) : "";
    const label = `${charLabel} ${periodLabels[period] || t("analysis.all")}`;
    const dateRange = trendData.dateFrom && trendData.dateTo ? `${formatDate(trendData.dateFrom)} - ${formatDate(trendData.dateTo)}` : "";
    const shareText = `【SMASH TRACKER】${t("analysis.trend")}（${label}）${dateRange ? "\n" + dateRange : ""}\n\n#スマブラ #SmashTracker\nhttps://smash-tracker.pages.dev/`;
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
      ctx.fillText(`SMASH TRACKER - ${t("analysis.trend")}（${label}）`, 20, 35);
      ctx.fillStyle = "#9ca3af"; ctx.font = "16px sans-serif"; ctx.fillText(dateRange, 20, 60);
      ctx.drawImage(img, 0, headerH, img.width * scale, img.height * scale);
      ctx.fillStyle = "#4b5563"; ctx.font = "14px sans-serif";
      ctx.fillText("smash-tracker.pages.dev  #スマブラ #SmashTracker", 20, canvas.height - 14);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(svgUrl);
        if (!blob) return;
        doShare(shareText, blob);
      }, "image/png");
    };
    img.src = svgUrl;
  }, [period, trendData, charDetail, lang, t]);

  // ── UI Helpers ──

  const cd = {
    background: T.card, borderRadius: 16, padding: "16px 18px", marginBottom: 12,
    boxShadow: T.sh, border: T.brd !== "transparent" ? `1px solid ${T.brd}` : "none",
  };

  const pill = (k, l, cur, fn) => (
    <button key={k} onClick={() => fn(k)} style={{
      flex: 1, padding: isPC ? "10px 0" : "9px 0", borderRadius: 10, border: "none",
      fontSize: isPC ? 13 : 12, fontWeight: cur === k ? 700 : 500, cursor: "pointer", textAlign: "center",
      background: cur === k ? T.accentGrad : T.inp, color: cur === k ? "#fff" : T.sub, transition: "all .15s ease",
    }}>{l}</button>
  );

  const renderBar = (r) => (
    <div style={{ height: 6, background: T.inp, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
      <div style={{ width: `${r * 100}%`, height: "100%", borderRadius: 3, background: barColor(r) }} />
    </div>
  );

  const renderLabel = (r) => {
    const label = r >= 0.6 ? t("analysis.winning") : r >= 0.4 ? t("analysis.even") : t("analysis.losing");
    const bg = r >= 0.6 ? T.winBg : r >= 0.4 ? "rgba(255,159,10,.15)" : T.loseBg;
    const color = r >= 0.6 ? T.win : r >= 0.4 ? "#a16207" : T.lose;
    return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: bg, color }}>{label}</span>;
  };

  const charRow = (s, onClick, showReviewBadge) => {
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
        {renderBar(r)}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: T.dim }}>{s.w}W {s.l}L · {s.t}{t("analysis.battles")}</span>
          <span style={{ fontSize: 12, color: T.accent }}>{t("analysis.detail")}</span>
        </div>
      </button>
    );
  };

  const matchupCell = (s, parentChar, popupOverride) => {
    const r = s.t ? s.w / s.t : 0;
    const fought = s.t > 0;
    const iconSize = isPC ? 36 : 28;
    const bgColor = !fought ? "transparent" : r >= 0.6 ? (T.winBg || "rgba(52,199,89,.1)") : r <= 0.4 ? (T.loseBg || "rgba(255,69,58,.1)") : "rgba(255,159,10,.08)";
    const handleClick = () => {
      if (popupOverride?.isOppMode) {
        setOppDetail(s.c); setOppSubTab("myChars"); setExpandedItem(null); setExpandedDate(null);
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
  };

  const dailyList = (filterFn) => {
    const dailyMap = {};
    data.matches.filter(filterFn).forEach((m) => {
      const idx = data.matches.indexOf(m);
      if (!dailyMap[m.date]) dailyMap[m.date] = { w: 0, l: 0, matches: [] };
      m.result === "win" ? dailyMap[m.date].w++ : dailyMap[m.date].l++;
      dailyMap[m.date].matches.push({ ...m, idx });
    });
    if (!Object.keys(dailyMap).length) return <div style={{ ...cd, textAlign: "center", padding: 20, color: T.dim, fontSize: 13 }}>{t("analysis.noData")}</div>;

    const [yStr, mStr] = dailyMonth.split("-");
    const year = Number(yStr);
    const month = parseInt(mStr) - 1;
    const monthLabel = lang === "ja"
      ? `${year}年${month + 1}月`
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
      setExpandedDate(null);
    };
    const nextMonth = () => {
      const d = new Date(year, month + 1, 1);
      setDailyMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      setExpandedDate(null);
    };
    const goCurrentMonth = () => {
      const now = new Date();
      setDailyMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
      setExpandedDate(null);
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

    const dotColor = (r) => r >= 0.6 ? T.win : r <= 0.4 ? T.lose : "#FF9F0A";

    const calendarGrid = (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, textAlign: "center" }}>
        {weekDays.map((d, i) => (
          <div key={`h${i}`} style={{ fontSize: 10, fontWeight: 600, color: T.dim, padding: "2px 0" }}>{d}</div>
        ))}
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${yStr}-${mStr}-${String(day).padStart(2, "0")}`;
          const dayData = dailyMap[dateStr];
          const isFuture = dateStr > todayStr;
          const isSelected = expandedDate === dateStr;
          const isToday = dateStr === todayStr;
          const hasData = !!dayData;
          const r = hasData ? dayData.w / (dayData.w + dayData.l) : 0;

          return (
            <div
              key={day}
              onClick={() => { if (hasData) setExpandedDate(isSelected ? null : dateStr); }}
              style={{
                padding: isPC ? "5px 0" : "4px 0",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                borderRadius: 8, cursor: hasData ? "pointer" : "default",
                background: isSelected ? T.accentSoft : "transparent",
                border: isSelected ? `2px solid ${T.accent}` : isToday ? `1px solid ${T.dimmer}` : "1px solid transparent",
                opacity: isFuture ? 0.3 : 1, transition: "all .1s ease",
              }}
            >
              <span style={{ fontSize: isPC ? 12 : 11, fontWeight: isToday ? 800 : 500, color: isSelected ? T.accent : isToday ? T.text : T.sub, lineHeight: 1 }}>
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

    const monthNav = (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
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

    const matchDetail = (matches) => matches.slice().reverse().map((m, i) => {
      const isEditing = editingStageIdx === m.idx;
      return (
        <div key={i} style={{ paddingBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: m.result === "win" ? T.win : T.lose, minWidth: 36 }}>
              {m.result === "win" ? "WIN" : "LOSE"}
            </span>
            <FighterIcon name={m.myChar} size={20} />
            <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{shortName(m.myChar, lang)}</span>
            <span style={{ fontSize: 11, color: T.dim }}>vs</span>
            <FighterIcon name={m.oppChar} size={20} />
            <span style={{ fontSize: 12, color: T.sub, fontWeight: 600, flex: 1 }}>{shortName(m.oppChar, lang)}</span>
            {m.stage && !isEditing && <span style={{ fontSize: 9, color: T.dim, background: T.inp, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{stageName(m.stage, lang)}</span>}
            {m.time && <span style={{ fontSize: 11, color: T.dim }}>{formatTime(m.time)}</span>}
            <button onClick={(e) => { e.stopPropagation(); setEditingStageIdx(isEditing ? null : m.idx); }}
              style={{ border: "none", background: T.inp, color: T.sub, fontSize: 9, padding: "2px 5px", borderRadius: 4, cursor: "pointer", flexShrink: 0 }}>{isEditing ? "✓" : "🗺"}</button>
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

    const selectedDayData = expandedDate ? dailyMap[expandedDate] : null;

    const detailPanel = selectedDayData ? (() => {
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
      const dailyEntry = data.daily?.[expandedDate];
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
        <div style={{ ...cd, padding: "16px 18px" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{formatDate(expandedDate)}</span>
              <button onClick={() => {
                const lines = [`【SMASH TRACKER】${formatDate(expandedDate)}`, `${selectedDayData.w}W ${selectedDayData.l}L（${t("analysis.winRate")} ${percentStr(selectedDayData.w, total)}）`, "",
                  ...ms.map((m) => `${m.result === "win" ? "WIN" : "LOSE"} ${fighterName(m.myChar, lang)} vs ${fighterName(m.oppChar, lang)}`),
                  "", "#スマブラ #SmashTracker", "https://smash-tracker.pages.dev/"];
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
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
          <div style={{ maxHeight: isPC ? 380 : 280, overflowY: "auto" }}>
            {matchDetail(ms)}
          </div>
        </div>
      );
    })() : (
      <div style={{ ...cd, textAlign: "center", padding: isPC ? "48px 20px" : "24px 16px", color: T.dim, fontSize: 13 }}>
        {t("history.selectDateDesc")}
      </div>
    );

    // ── PC: calendar left (50%) + detail right (50%) ──
    if (isPC) {
      return (
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...cd, padding: "14px 18px" }}>
              {monthNav}
              {monthSummary}
              {calendarGrid}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {detailPanel}
          </div>
        </div>
      );
    }

    // ── Mobile: calendar on top + detail below ──
    return (
      <div>
        <div style={{ ...cd, padding: "12px 14px" }}>
          {monthNav}
          {monthSummary}
          {calendarGrid}
        </div>
        {expandedDate && detailPanel}
      </div>
    );
  };

  const trendSection = () => {
    const hasTrend = trendData.points.length > 0;
    return (
      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {pill("day", t("analysis.today"), period, setPeriod)}
          {pill("week", t("analysis.week"), period, setPeriod)}
          {pill("month", t("analysis.month"), period, setPeriod)}
          {pill("all", t("analysis.all"), period, setPeriod)}
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
          <div ref={chartRef} style={{ ...cd, padding: "12px 10px 8px" }}>
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

  const matchLogRow = (m, i, total) => (
    <div key={i} style={{ borderBottom: i < total - 1 ? `1px solid ${T.inp}` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
        <span style={{ fontSize: 13, color: T.dim, flexShrink: 0, minWidth: 80 }}>{formatDate(m.date)}</span>
        <FighterIcon name={m.myChar} size={24} />
        <span style={{ fontSize: 12, color: T.sub, flexShrink: 0 }}>{shortName(m.myChar, lang)}</span>
        <span style={{ fontSize: 12, color: T.dim, flexShrink: 0 }}>vs</span>
        <FighterIcon name={m.oppChar} size={24} />
        <span style={{ fontSize: 12, color: T.sub, flexShrink: 0 }}>{shortName(m.oppChar, lang)}</span>
        {m.stage && <span style={{ fontSize: 9, color: T.dim, background: T.inp, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>{stageName(m.stage, lang)}</span>}
        <span style={{ fontSize: 12, fontWeight: 800, width: 40, textAlign: "center", flexShrink: 0, marginLeft: "auto", padding: "2px 0", borderRadius: 6, background: m.result === "win" ? T.winBg : T.loseBg, color: m.result === "win" ? T.win : T.lose }}>
          {m.result === "win" ? "WIN" : "LOSE"}
        </span>
      </div>
      {m.memo && <div style={{ fontSize: 12, color: T.sub, paddingBottom: 6, paddingLeft: 2 }}>{m.memo}</div>}
    </div>
  );

  // ── Empty state ──

  if (data.matches.length === 0) {
    return (
      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {pill("myChar", t("analysis.myChar"), aMode, setAMode)}
          {pill("oppChar", t("analysis.oppChar"), aMode, setAMode)}
          {pill("overall", t("analysis.overall"), aMode, setAMode)}
        </div>
        <div style={{ background: T.card, borderRadius: 16, padding: "48px 24px", boxShadow: T.sh, border: T.brd !== "transparent" ? `1px solid ${T.brd}` : "none", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ background: T.accentSoft, borderRadius: "50%", width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={30} color={T.accent} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{t("analysis.emptyTitle")}</div>
          <div style={{ fontSize: 13, color: T.dim }}>{t("analysis.emptyDesc")}</div>
        </div>
      </div>
    );
  }

  // ── Main render ──

  return (
    <div>
      {/* Top-level tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {pill("myChar", t("analysis.myChar"), aMode, (k) => { setAMode(k); setCharDetail(null); setOppDetail(null); setExpandedDate(null); })}
        {pill("oppChar", t("analysis.oppChar"), aMode, (k) => { setAMode(k); setCharDetail(null); setOppDetail(null); setExpandedDate(null); })}
        {pill("overall", t("analysis.overall"), aMode, (k) => { setAMode(k); setCharDetail(null); setOppDetail(null); setExpandedDate(null); })}
      </div>

      {/* ═══════════════ MODE: MY CHAR ═══════════════ */}
      {aMode === "myChar" && !charDetail && (
        <div>
          {mCS.length === 0 ? (
            <div style={{ ...cd, textAlign: "center", padding: 20, color: T.dim, fontSize: 13 }}>{t("analysis.noCharData")}</div>
          ) : (() => {
            const usedSet = new Set(mCS.map((s) => s.c));
            const allMyChars = FIGHTERS.map((c) => {
              const found = mCS.find((s) => s.c === c);
              return found || { c, w: 0, l: 0, t: 0 };
            });
            return (
              <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(6, 1fr)" : "repeat(4, 1fr)", gap: isPC ? 8 : 6 }}>
                {allMyChars.map((s) => {
                  const r = s.t ? s.w / s.t : 0;
                  const used = s.t > 0;
                  const iconSize = isPC ? 36 : 28;
                  const bgColor = !used ? "transparent" : r >= 0.6 ? (T.winBg || "rgba(52,199,89,.1)") : r <= 0.4 ? (T.loseBg || "rgba(255,69,58,.1)") : "rgba(255,159,10,.08)";
                  return (
                    <div key={s.c} onClick={() => { if (used) { setCharDetail(s.c); setCharSubTab("matchup"); setExpandedItem(null); setExpandedDate(null); setPeriod("all"); } }}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                        padding: isPC ? "8px 4px" : "6px 2px", borderRadius: 10,
                        background: bgColor, border: `1px solid ${used ? T.brd : "transparent"}`,
                        cursor: used ? "pointer" : "default", opacity: used ? 1 : 0.45,
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
            );
          })()}
        </div>
      )}

      {aMode === "myChar" && charDetail && (() => {
        const stats = charMatchups.reduce((a, s) => ({ w: a.w + s.w, l: a.l + s.l }), { w: 0, l: 0 });
        return (
          <div>
            {/* Header */}
            <div style={{ ...cd, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              <button onClick={() => { setCharDetail(null); setExpandedItem(null); setExpandedDate(null); }} style={{ border: "none", background: T.inp, borderRadius: 10, padding: "8px 14px", color: T.sub, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
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
                  style={{ width: "100%", padding: "8px 10px", background: T.inp, border: "none", borderRadius: 8, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", lineHeight: 1.5, overflow: "hidden", minHeight: 40, marginTop: 8 }}
                />
              )}
            </div>

            {/* Sub-tabs: matchup / trend / daily */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[["matchup", t("analysis.matchup")], ["trend", t("analysis.trend")], ["daily", t("analysis.dailyRecord")]].map(([k, l]) => (
                <button key={k} onClick={() => { setCharSubTab(k); setExpandedItem(null); setExpandedDate(null); }} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 13,
                  fontWeight: charSubTab === k ? 700 : 500, textAlign: "center",
                  background: charSubTab === k ? T.accentGrad : T.inp, color: charSubTab === k ? "#fff" : T.sub, transition: "all .15s ease",
                }}>{l}</button>
              ))}
            </div>

            {/* Matchup sub-tab */}
            {charSubTab === "matchup" && (
              <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(6, 1fr)" : "repeat(4, 1fr)", gap: isPC ? 8 : 6 }}>
                {charMatchups.map((s) => matchupCell(s, charDetail))}
              </div>
            )}

            {/* Trend sub-tab */}
            {charSubTab === "trend" && trendSection()}

            {/* Daily sub-tab */}
            {charSubTab === "daily" && dailyList((m) => m.myChar === charDetail)}
          </div>
        );
      })()}

      {/* ═══════════════ MODE: OPP CHAR ═══════════════ */}
      {aMode === "oppChar" && !oppDetail && (
        <div>
          {oCS.length === 0 ? (
            <div style={{ ...cd, textAlign: "center", padding: 20, color: T.dim, fontSize: 13 }}>{t("analysis.noCharData")}</div>
          ) : (() => {
            const foughtSet = new Set(oCS.map((s) => s.c));
            const allOpps = FIGHTERS.map((c) => {
              const found = oCS.find((s) => s.c === c);
              return found || { c, w: 0, l: 0, t: 0 };
            });
            return (
              <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(6, 1fr)" : "repeat(4, 1fr)", gap: isPC ? 8 : 6 }}>
                {allOpps.map((s) => matchupCell(s, null, { myChar: null, oppChar: s.c, isOppMode: true }))}
              </div>
            );
          })()}
        </div>
      )}

      {aMode === "oppChar" && oppDetail && (() => {
        const oppMatches = data.matches.filter((m) => m.oppChar === oppDetail);
        const oppW = oppMatches.filter((m) => m.result === "win").length;
        const oppL = oppMatches.length - oppW;
        return (
          <div>
            {/* Header */}
            <div style={{ ...cd, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              <button onClick={() => { setOppDetail(null); setExpandedItem(null); setExpandedDate(null); }} style={{ border: "none", background: T.inp, borderRadius: 10, padding: "8px 14px", color: T.sub, fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                {t("analysis.backToList")}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FighterIcon name={oppDetail} size={36} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{fighterName(oppDetail, lang)}</div>
                  {oppMatches.length > 0 && <div style={{ fontSize: 12, color: T.dim }}>{oppMatches.length}{t("analysis.battles")} {oppW}W {oppL}L ({percentStr(oppW, oppMatches.length)})</div>}
                </div>
              </div>
            </div>

            {/* Matchup Notes */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t("matchupNotes.title")}</div>
              </div>
              <MatchupNotesEditor
                key={oppDetail}
                noteKey={oppDetail}
                data={data} onSave={onSave} T={T}
              />
            </div>

            {oppMatches.length > 0 && (
              <>
                {/* Sub-tabs: myChars / history / stages */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {[["myChars", t("analysis.myCharUsed")], ["history", t("analysis.matchHistory")], ["stages", t("stages.winRateByStage")]].map(([k, l]) => (
                    <button key={k} onClick={() => { setOppSubTab(k); setExpandedItem(null); setExpandedDate(null); }} style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 12,
                      fontWeight: oppSubTab === k ? 700 : 500, textAlign: "center",
                      background: oppSubTab === k ? T.accentGrad : T.inp, color: oppSubTab === k ? "#fff" : T.sub, transition: "all .15s ease",
                    }}>{l}</button>
                  ))}
                </div>

                {/* My chars used against this opponent */}
                {oppSubTab === "myChars" && (
                  <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(6, 1fr)" : "repeat(4, 1fr)", gap: isPC ? 8 : 6 }}>
                    {oppMyChars.map((s) =>
                      matchupCell(s, null, { myChar: s.c, oppChar: oppDetail })
                    )}
                  </div>
                )}

                {/* Match history */}
                {oppSubTab === "history" && dailyList((m) => m.oppChar === oppDetail)}

                {/* Stage win rate */}
                {oppSubTab === "stages" && (() => {
                  const stageMatches = oppMatches.filter((m) => m.stage);
                  return (
                    <div>
                      {stageMatches.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "24px 0", color: T.dim, fontSize: 13 }}>{t("stages.noData")}</div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                          {STAGES.map((stage) => {
                            const ms = stageMatches.filter((m) => m.stage === stage.id);
                            const w = ms.filter((m) => m.result === "win").length;
                            const l = ms.length - w;
                            const r = ms.length > 0 ? w / ms.length : 0;
                            return (
                              <div key={stage.id} style={{ textAlign: "center", opacity: ms.length === 0 ? 0.35 : 1 }}>
                                <img src={stageImg(stage.id)} alt={stage.jp} style={{ width: "100%", height: 40, objectFit: "cover", borderRadius: 6 }} />
                                <div style={{ fontSize: 10, fontWeight: 600, color: T.text, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stageName(stage.id, lang)}</div>
                                {ms.length > 0 ? (
                                  <>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>{Math.round(r * 100)}%</div>
                                    <div style={{ fontSize: 9, color: T.dim }}>{w}W {l}L</div>
                                  </>
                                ) : (
                                  <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>—</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        );
      })()}

      {/* ═══════════════ MODE: OVERALL ═══════════════ */}
      {aMode === "overall" && (
        <div>
          {/* Summary + Share */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>{t("share.overallStats")}</span>
            <button onClick={() => {
              const tw = data.matches.filter((m) => m.result === "win").length;
              const tl = data.matches.length - tw;
              const topChars = {};
              data.matches.forEach((m) => { topChars[m.myChar] = (topChars[m.myChar] || 0) + 1; });
              const charRank = Object.entries(topChars).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${fighterName(c, lang)} ×${n}`).join(", ");
              const sLines = [`【SMASH TRACKER】${t("share.overallStats")}`, `${data.matches.length}${t("analysis.battles")} ${tw}W ${tl}L（${t("analysis.winRate")} ${percentStr(tw, data.matches.length)}）`];
              if (charRank) sLines.push(charRank);
              sLines.push("", "#スマブラ #SmashTracker", "https://smash-tracker.pages.dev/");
              doShare(sLines.join("\n"));
            }} style={{ border: "none", background: T.inp, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}><Share2 size={12} /> {t("analysis.share")}</button>
          </div>
          <div style={{ ...cd, display: "flex", padding: isPC ? "24px 20px" : "18px 12px", textAlign: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>{t("analysis.totalMatches")}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 4 }}>{data.matches.length}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>{t("analysis.winRate")}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 4 }}>{percentStr(totalW, data.matches.length)}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>{t("analysis.winLoss")}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                <span style={{ color: T.win }}>{totalW}</span>
                <span style={{ color: T.dimmer }}> : </span>
                <span style={{ color: T.lose }}>{totalL}</span>
              </div>
            </div>
          </div>

          {/* Recent win rate */}
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}>{t("analysis.recentWinRate")}</div>
          <div style={{ display: "flex", gap: isPC ? 16 : 8, marginBottom: isPC ? 12 : 8 }}>
            {[20, 50].filter((n) => n !== 50 || data.matches.length > 20).map((n) => {
              const d = rolling[n];
              const r = d.t ? d.w / d.t : 0;
              return (
                <div key={n} onClick={() => setExpandedRolling(n)} style={{
                  ...cd, flex: 1, marginBottom: 0, padding: "14px 16px", textAlign: "center", cursor: "pointer",
                }}>
                  <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>{t("battle.recentLabel")} {d.t}{t("analysis.battles")}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: d.t ? barColor(r) : T.dim, marginTop: 4 }}>{d.t ? percentStr(d.w, d.t) : "\u2014"}</div>
                  {d.t > 0 && <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{d.w}W {d.t - d.w}L</div>}
                </div>
              );
            })}
          </div>
          {expandedRolling !== null && (() => {
            const n = expandedRolling;
            const recentMs = data.matches.slice(-n);
            const rW = recentMs.filter((m) => m.result === "win").length;
            const rR = recentMs.length > 0 ? rW / recentMs.length : 0;

            // Rolling win rate graph: compute win rate at each chunk boundary
            const chunkSize = n === 20 ? 20 : 20;
            const graphPoints = [];
            for (let i = chunkSize; i <= data.matches.length; i += chunkSize) {
              const chunk = data.matches.slice(i - chunkSize, i);
              const cW = chunk.filter((m) => m.result === "win").length;
              graphPoints.push({ idx: i, rate: cW / chunk.length });
            }
            const remainder = data.matches.length % chunkSize;
            if (remainder > 0 && data.matches.length > chunkSize) {
              const chunk = data.matches.slice(-remainder);
              const cW = chunk.filter((m) => m.result === "win").length;
              graphPoints.push({ idx: data.matches.length, rate: cW / chunk.length });
            }

            const graphH = 120;
            const graphW = 280;
            const showGraph = graphPoints.length >= 2;
            const padding = 20;
            const plotW = graphW - padding * 2;
            const plotH = graphH - 30;

            return (
              <div onClick={() => setExpandedRolling(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: isPC ? "center" : "flex-end", justifyContent: "center", animation: "fadeUp .15s ease" }}>
                <div onClick={(e) => e.stopPropagation()} style={{
                  background: T.card, borderRadius: isPC ? 20 : "20px 20px 0 0", width: isPC ? 520 : "100%",
                  maxHeight: isPC ? "80vh" : "85vh", overflow: "hidden", display: "flex", flexDirection: "column",
                  boxShadow: "0 20px 60px rgba(0,0,0,.3)", border: `1px solid ${T.brd}`,
                }}>
                  {/* Header */}
                  <div style={{ padding: "18px 20px", borderBottom: `1px solid ${T.inp}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{t("battle.recentLabel")} {n}{t("analysis.battles")}</div>
                    <button onClick={() => setExpandedRolling(null)} style={{ border: "none", background: T.inp, borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, fontSize: 18 }}>×</button>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", WebkitOverflowScrolling: "touch" }}>
                    {/* Summary */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      <div style={{ flex: 1, background: T.inp, borderRadius: 12, padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("analysis.winRate")}</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: barColor(rR), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(rW, recentMs.length)}</div>
                      </div>
                      <div style={{ flex: 1, background: T.inp, borderRadius: 12, padding: "12px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("analysis.winLoss")}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif" }}>
                          <span style={{ color: T.win }}>{rW}</span>
                          <span style={{ color: T.dimmer, fontSize: 14, margin: "0 4px" }}>:</span>
                          <span style={{ color: T.lose }}>{recentMs.length - rW}</span>
                        </div>
                      </div>
                    </div>

                    {/* Win rate transition graph */}
                    {showGraph && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("analysis.winRateTransition")}</div>
                        <div style={{ background: T.inp, borderRadius: 12, padding: "14px 10px 8px" }}>
                          <svg viewBox={`0 0 ${graphW} ${graphH}`} style={{ width: "100%", height: "auto" }}>
                            {/* 50% line */}
                            <line x1={padding} y1={plotH / 2 + 10} x2={graphW - padding} y2={plotH / 2 + 10} stroke={T.dimmer || "#666"} strokeWidth="1" strokeDasharray="4 4" />
                            <text x={padding - 2} y={plotH / 2 + 14} fill={T.dim} fontSize="8" textAnchor="end">50%</text>
                            {/* Graph line */}
                            <polyline
                              fill="none"
                              stroke={T.accent}
                              strokeWidth="2.5"
                              strokeLinejoin="round"
                              points={graphPoints.map((p, i) => {
                                const x = padding + (i / (graphPoints.length - 1)) * plotW;
                                const y = 10 + plotH * (1 - p.rate);
                                return `${x},${y}`;
                              }).join(" ")}
                            />
                            {/* Data points */}
                            {graphPoints.map((p, i) => {
                              const x = padding + (i / (graphPoints.length - 1)) * plotW;
                              const y = 10 + plotH * (1 - p.rate);
                              return (
                                <g key={i}>
                                  <circle cx={x} cy={y} r="4" fill={barColor(p.rate)} />
                                  <text x={x} y={y - 8} fill={T.text} fontSize="9" textAnchor="middle" fontWeight="700">{Math.round(p.rate * 100)}%</text>
                                  <text x={x} y={graphH - 2} fill={T.dim} fontSize="7" textAnchor="middle">#{p.idx}</text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Match history */}
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("analysis.matchHistory")}</div>
                    <div style={{ maxHeight: isPC ? 300 : 240, overflowY: "auto" }}>
                      {recentMs.slice().reverse().map((m, i, arr) => matchLogRow(m, i, arr.length))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Hourly stats */}
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}>{t("analysis.timeOfDay")}</div>
          <div style={{ ...cd, padding: "14px 12px" }}>
            {Object.keys(hourlyStats).length === 0 ? (
              <div style={{ textAlign: "center", color: T.dim, fontSize: 13, padding: 16 }}>{t("analysis.noData")}</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(8, 1fr)" : "repeat(4, 1fr)", gap: 6 }}>
                  {Object.entries(hourlyStats).sort((a, b) => Number(a[0]) - Number(b[0])).map(([hr, d]) => {
                    const r = d.w / (d.w + d.l);
                    const hrNum = Number(hr);
                    const isExp = expandedHour === hrNum;
                    return (
                      <div key={hr} onClick={() => setExpandedHour(isExp ? null : hrNum)} style={{
                        textAlign: "center", padding: "8px 4px", borderRadius: 10,
                        background: isExp ? T.accentSoft : T.inp, cursor: "pointer",
                        outline: isExp ? `2px solid ${T.accentBorder}` : "none",
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isExp ? T.accent : T.text }}>{hr}{t("analysis.hour")}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: barColor(r), marginTop: 2 }}>{percentStr(d.w, d.w + d.l)}</div>
                        <div style={{ fontSize: 10, color: T.dim }}>{d.w + d.l}{t("analysis.battles")}</div>
                      </div>
                    );
                  })}
                </div>
                {expandedHour !== null && (
                  <div style={{ marginTop: 10, borderTop: `1px solid ${T.brd}`, paddingTop: 10, maxHeight: 320, overflowY: "auto" }}>
                    {data.matches.filter((m) => formatHour(m.time) === expandedHour).slice().reverse().map((m, i, arr) => matchLogRow(m, i, arr.length))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Stage win rate (overall) */}
          {data.matches.some((m) => m.stage) && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}>{t("stages.winRateByStage")}</div>
              <div style={{ ...cd, padding: "12px 14px", marginBottom: isPC ? 20 : 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {STAGES.map((stage) => {
                    const ms = data.matches.filter((m) => m.stage === stage.id);
                    if (ms.length === 0) return null;
                    const w = ms.filter((m) => m.result === "win").length;
                    const l = ms.length - w;
                    const r = w / ms.length;
                    return (
                      <div key={stage.id} style={{ textAlign: "center" }}>
                        <img src={stageImg(stage.id)} alt={stage.jp} style={{ width: "100%", height: 40, objectFit: "cover", borderRadius: 6 }} />
                        <div style={{ fontSize: 10, fontWeight: 600, color: T.text, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stageName(stage.id, lang)}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>{Math.round(r * 100)}%</div>
                        <div style={{ fontSize: 9, color: T.dim }}>{w}W {l}L</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* All daily records (integrated from HistoryTab) */}
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}>{t("analysis.allDailyRecord")}</div>
          {dailyList(() => true)}
        </div>
      )}

      {/* Shared overlays */}
      {sharePopup && <SharePopup text={sharePopup.text} imageBlob={sharePopup.imageBlob} onClose={() => setSharePopup(null)} T={T} />}
      {confirmAction && (
        <ConfirmDialog
          message={t("common.deleteConfirm")}
          confirmLabel={t("history.delete")}
          cancelLabel={t("settings.cancel")}
          onConfirm={() => { deleteMatch(confirmAction.idx); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
          T={T}
        />
      )}

      {/* PC Matchup Detail Popup */}
      {matchupPopup && (() => {
        const { myChar, oppChar } = matchupPopup;
        const ms = data.matches.map((m, idx) => ({ ...m, idx })).filter((m) => m.myChar === myChar && m.oppChar === oppChar);
        const w = ms.filter((m) => m.result === "win").length;
        const l = ms.length - w;
        const r = ms.length > 0 ? w / ms.length : 0;

        const stageMs = ms.filter((m) => m.stage);
        const stageData = {};
        stageMs.forEach((m) => {
          if (!stageData[m.stage]) stageData[m.stage] = { w: 0, l: 0 };
          m.result === "win" ? stageData[m.stage].w++ : stageData[m.stage].l++;
        });

        const recent10 = ms.slice().reverse().slice(0, 10);
        const recentR = recent10.length > 0 ? recent10.filter((m) => m.result === "win").length / recent10.length : 0;

        const popupStyle = isPC
          ? { background: T.card, borderRadius: 20, border: `1px solid ${T.brd}`, boxShadow: T.sh, width: 560, maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }
          : { background: T.bg, width: "100%", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" };
        const headerPad = isPC ? "20px 24px" : "16px 18px";
        const contentPad = isPC ? "20px 24px" : "16px 18px";
        const iconSz = isPC ? 36 : 28;
        const titleSz = isPC ? 16 : 14;
        const statFontSz = isPC ? 28 : 22;
        const statPad = isPC ? "14px 16px" : "10px 12px";

        return (
          <div onClick={() => setMatchupPopup(null)} style={{ position: "fixed", inset: 0, background: isPC ? "rgba(0,0,0,.55)" : "rgba(0,0,0,.3)", zIndex: 1000, display: "flex", alignItems: isPC ? "center" : "flex-end", justifyContent: "center", animation: "fadeUp .15s ease" }}>
            <div onClick={(e) => e.stopPropagation()} style={popupStyle}>
              {/* Header */}
              <div style={{ padding: headerPad, borderBottom: `1px solid ${T.inp}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: isPC ? "transparent" : T.card }}>
                <div style={{ display: "flex", alignItems: "center", gap: isPC ? 12 : 8, flex: 1, minWidth: 0 }}>
                  <FighterIcon name={myChar} size={iconSz} />
                  <span style={{ fontSize: 12, color: T.dim, fontWeight: 700 }}>vs</span>
                  <FighterIcon name={oppChar} size={iconSz} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: titleSz, fontWeight: 800, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fighterName(myChar, lang)} vs {fighterName(oppChar, lang)}</div>
                    <div style={{ fontSize: 11, color: T.dim }}>{ms.length}{t("analysis.battles")}</div>
                  </div>
                </div>
                <button onClick={() => {
                  const sLines = [`【SMASH TRACKER】${t("share.matchupShare")}`, `${fighterName(myChar, lang)} vs ${fighterName(oppChar, lang)}`, `${w}W ${l}L（${t("analysis.winRate")} ${percentStr(w, ms.length)}）`];
                  const stageEntries = STAGES.filter((st) => stageData[st.id]).map((st) => { const sd = stageData[st.id]; return `${stageName(st.id, lang)} ${sd.w}W${sd.l}L`; });
                  if (stageEntries.length > 0) sLines.push(stageEntries.join(" / "));
                  sLines.push("", "#スマブラ #SmashTracker", "https://smash-tracker.pages.dev/");
                  doShare(sLines.join("\n"));
                }} style={{ border: "none", background: T.inp, borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, flexShrink: 0 }}><Share2 size={14} /></button>
                <button onClick={() => setMatchupPopup(null)} style={{ border: "none", background: T.inp, borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, fontSize: 18, flexShrink: 0, marginLeft: 6 }}>×</button>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: contentPad, WebkitOverflowScrolling: "touch" }}>
                {ms.length === 0 ? (
                  <div style={{ textAlign: "center", color: T.dim, padding: "40px 0", fontSize: 14 }}>{t("stages.noData")}</div>
                ) : (
                  <>
                    {/* Overall stats */}
                    <div style={{ display: "flex", gap: isPC ? 12 : 8, marginBottom: 16 }}>
                      <div style={{ flex: 1, background: T.inp, borderRadius: 12, padding: statPad, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("analysis.winRate")}</div>
                        <div style={{ fontSize: statFontSz, fontWeight: 900, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(w, ms.length)}</div>
                      </div>
                      <div style={{ flex: 1, background: T.inp, borderRadius: 12, padding: statPad, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("analysis.winLoss")}</div>
                        <div style={{ fontSize: statFontSz - 4, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif" }}>
                          <span style={{ color: T.win }}>{w}</span>
                          <span style={{ color: T.dimmer, fontSize: 14, margin: "0 4px" }}>:</span>
                          <span style={{ color: T.lose }}>{l}</span>
                        </div>
                      </div>
                      {recent10.length >= 3 && (
                        <div style={{ flex: 1, background: T.inp, borderRadius: 12, padding: statPad, textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 4 }}>{t("battle.recentLabel")} {recent10.length}</div>
                          <div style={{ fontSize: statFontSz, fontWeight: 900, color: barColor(recentR), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(recent10.filter((m) => m.result === "win").length, recent10.length)}</div>
                        </div>
                      )}
                    </div>

                    {/* Win rate bar */}
                    <div style={{ height: 8, borderRadius: 4, background: T.inp, overflow: "hidden", marginBottom: 20 }}>
                      <div style={{ height: "100%", width: `${r * 100}%`, background: barColor(r), borderRadius: 4 }} />
                    </div>

                    {/* Matchup Notes (flash + gameplan + stage ban) */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("matchupNotes.title")}</div>
                      <MatchupNotesEditor noteKey={data.matchupNotes?.[`${myChar}|${oppChar}`] ? `${myChar}|${oppChar}` : oppChar} data={data} onSave={onSave} T={T} compact />
                    </div>

                    {/* Stage win rates */}
                    {Object.keys(stageData).length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("stages.winRateByStage")}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                          {STAGES.filter((st) => stageData[st.id]).map((st) => {
                            const sd = stageData[st.id];
                            const sr = sd.w / (sd.w + sd.l);
                            return (
                              <div key={st.id} style={{ textAlign: "center" }}>
                                <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 36, objectFit: "cover", borderRadius: 4 }} />
                                <div style={{ fontSize: 9, fontWeight: 600, color: T.text, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stageName(st.id, lang)}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: barColor(sr), fontFamily: "'Chakra Petch', sans-serif" }}>{Math.round(sr * 100)}%</div>
                                <div style={{ fontSize: 9, color: T.dim }}>{sd.w}W {sd.l}L</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Match history */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("analysis.matchHistory")}</div>
                      <div style={{ maxHeight: isPC ? 240 : 200, overflowY: "auto" }}>
                        {ms.slice().reverse().slice(0, 30).map((m, i) => {
                          const isEditing = editingStageIdx === m.idx;
                          return (
                            <div key={i} style={{ padding: "5px 0", borderBottom: `1px solid ${T.inp}` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, color: T.dim, flexShrink: 0, minWidth: isPC ? 68 : 56 }}>{formatDate(m.date)}</span>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: m.result === "win" ? T.winBg : T.loseBg, color: m.result === "win" ? T.win : T.lose, flexShrink: 0 }}>
                                  {m.result === "win" ? "WIN" : "LOSE"}
                                </span>
                                {m.stage && !isEditing && <span style={{ fontSize: 9, color: T.dim, background: T.inp, padding: "1px 5px", borderRadius: 3, flexShrink: 0 }}>{stageName(m.stage, lang)}</span>}
                                {m.time && <span style={{ fontSize: 10, color: T.dim, marginLeft: "auto" }}>{formatTime(m.time)}</span>}
                                <button onClick={(e) => { e.stopPropagation(); setEditingStageIdx(isEditing ? null : m.idx); }}
                                  style={{ border: "none", background: T.inp, color: T.sub, fontSize: 9, padding: "2px 5px", borderRadius: 4, cursor: "pointer", flexShrink: 0 }}>{isEditing ? "✓" : "🗺"}</button>
                              </div>
                              {isEditing && (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 4, marginBottom: 2 }}>
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
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
