import { useState, useMemo, useRef, useCallback } from "react";
import { BarChart3, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import Chart from "./Chart";
import FighterIcon from "./FighterIcon";
import SharePopup from "./SharePopup";
import ConfirmDialog from "./ConfirmDialog";
import { shortName, fighterName, FIGHTERS } from "../constants/fighters";
import { useI18n } from "../i18n/index.jsx";
import {
  today,
  formatDate,
  formatDateLong,
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
  const [charDetail, setCharDetail] = useState(null);
  const [oppDetail, setOppDetail] = useState(null);
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

  // Editing state
  const [counterMemoText, setCounterMemoText] = useState("");
  const [sharePopupText, setSharePopupText] = useState(null);
  const [shareImageUrl, setShareImageUrl] = useState(null);
  const [editingPower, setEditingPower] = useState(false);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

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
    return Object.entries(s)
      .map(([c, v]) => ({ c, w: v.w, l: v.l, t: v.w + v.l }))
      .sort((a, b) => {
        const ra = a.t ? a.w / a.t : 0;
        const rb = b.t ? b.w / b.t : 0;
        return ra - rb;
      });
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

  const doShare = async (text) => {
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch (_) { /* cancelled */ }
    }
    setSharePopupText(text);
  };

  const deleteMatch = (idx) => {
    const nm = [...data.matches];
    nm.splice(idx, 1);
    onSave({ ...data, matches: nm });
  };

  const saveDayPower = (date, start, end) => {
    const d = JSON.parse(JSON.stringify(data));
    if (!d.daily) d.daily = {};
    if (!d.daily[date]) d.daily[date] = {};
    const day = d.daily[date];
    if (!day.chars) day.chars = {};
    if (start !== "") { day.start = Number(start); }
    if (end !== "") { day.end = Number(end); }
    onSave(d);
    setEditingPower(false);
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
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = async () => {
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
      ctx.fillText("smash-tracker.pages.dev  #スマブラ #SmashTracker #スマトラ", 20, canvas.height - 14);
      canvas.toBlob(async (blob) => {
        URL.revokeObjectURL(svgUrl);
        if (!blob) return;
        const file = new File([blob], "smash-tracker-trend.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], text: `【SMASH TRACKER】${t("analysis.trend")}（${label}）${dateRange ? "\n" + dateRange : ""}\n\n#スマブラ #SmashTracker #スマトラ\nhttps://smash-tracker.pages.dev/` });
            return;
          } catch (_) { /* cancelled */ }
        }
        setShareImageUrl(URL.createObjectURL(blob));
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

  const charRow = (s, onClick) => {
    const r = s.t ? s.w / s.t : 0;
    return (
      <button key={s.c} onClick={onClick} style={{
        ...cd, marginBottom: isPC ? 0 : 8, padding: "14px 18px", width: "100%", cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
            <FighterIcon name={s.c} size={28} />{fighterName(s.c, lang)}
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

  const matchupRow = (s, matchesGetter) => {
    const r = s.t ? s.w / s.t : 0;
    const isExp = expandedItem === s.c;
    const matches = isExp ? matchesGetter() : [];
    return (
      <div key={s.c} style={{ ...cd, marginBottom: 8, padding: "12px 16px" }}>
        <div onClick={() => setExpandedItem(isExp ? null : s.c)} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FighterIcon name={s.c} size={32} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{fighterName(s.c, lang)}</div>
                <div style={{ fontSize: 11, color: T.dim }}>{s.w}W {s.l}L ({s.t}{t("analysis.battles")})</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 10, color: T.dim }}>{t("analysis.winRate")}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(s.w, s.t)}</span>
              </div>
              {renderLabel(r)}
            </div>
          </div>
          {renderBar(r)}
        </div>
        {isExp && (
          <div style={{ marginTop: 10, borderTop: `1px solid ${T.inp}`, paddingTop: 10, maxHeight: 300, overflowY: "auto" }}>
            {matches.slice(0, 20).map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.dim, flexShrink: 0 }}>{formatDate(m.date)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, flexShrink: 0, background: m.result === "win" ? T.winBg : T.loseBg, color: m.result === "win" ? T.win : T.lose }}>
                  {m.result === "win" ? "WIN" : "LOSE"}
                </span>
                {m.time && <span style={{ fontSize: 12, color: T.dim, flexShrink: 0 }}>{formatTime(m.time)}</span>}
                {m.memo && <span style={{ fontSize: 11, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.memo}</span>}
              </div>
            ))}
            {matches.length > 20 && <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>{t("analysis.others").replace("{n}", matches.length - 20)}</div>}
          </div>
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

    const matchDetail = (matches) => matches.slice().reverse().map((m, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: m.result === "win" ? T.win : T.lose, minWidth: 36 }}>
          {m.result === "win" ? "WIN" : "LOSE"}
        </span>
        <FighterIcon name={m.myChar} size={20} />
        <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{shortName(m.myChar, lang)}</span>
        <span style={{ fontSize: 11, color: T.dim }}>vs</span>
        <FighterIcon name={m.oppChar} size={20} />
        <span style={{ fontSize: 12, color: T.sub, fontWeight: 600, flex: 1 }}>{shortName(m.oppChar, lang)}</span>
        {m.time && <span style={{ fontSize: 11, color: T.dim }}>{formatTime(m.time)}</span>}
        <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ idx: m.idx }); }}
          style={{ border: "none", background: "transparent", color: T.dimmer, fontSize: 16, cursor: "pointer", padding: "4px 6px", flexShrink: 0 }}>×</button>
      </div>
    ));

    const selectedDayData = expandedDate ? dailyMap[expandedDate] : null;

    const detailPanel = selectedDayData ? (() => {
      const total = selectedDayData.w + selectedDayData.l;
      const r = total ? selectedDayData.w / total : 0;
      return (
        <div style={{ ...cd, padding: "16px 18px" }}>
          {/* Day header with prominent stats */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 10 }}>{formatDate(expandedDate)}</div>
            <div style={{ display: "flex", gap: 8 }}>
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
          </div>
          {/* Match list */}
          <div style={{ maxHeight: isPC ? 380 : 280, overflowY: "auto" }}>
            {matchDetail(selectedDayData.matches)}
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
          ) : (
            <div style={isPC ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 } : undefined}>
              {mCS.map((s) => charRow(s, () => { setCharDetail(s.c); setCharSubTab("matchup"); setExpandedItem(null); setExpandedDate(null); setPeriod("all"); }))}
            </div>
          )}
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

            {/* Char memo */}
            <div style={{ ...cd, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, color: T.dim, fontWeight: 600, marginBottom: 6 }}>{fighterName(charDetail, lang)} {t("battle.charMemo")}</div>
              <textarea
                value={data.charMemos?.[charDetail] || ""}
                onChange={(e) => onSave({ ...data, charMemos: { ...(data.charMemos || {}), [charDetail]: e.target.value } })}
                placeholder={t("battle.charMemoPlaceholder")}
                rows={2}
                style={{ width: "100%", padding: "8px 10px", background: T.inp, border: "none", borderRadius: 8, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
              />
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
            {charSubTab === "matchup" && charMatchups.map((s) =>
              matchupRow(s, () => data.matches.filter((m) => m.myChar === charDetail && m.oppChar === s.c).slice().reverse())
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
          ) : (
            <div>
              {oCS.map((s) => charRow(s, () => { setOppDetail(s.c); setOppSubTab("myChars"); setExpandedItem(null); setExpandedDate(null); setCounterMemoText(data.counterMemos?.[s.c] || ""); }))}

              {/* Not fought chars */}
              {(() => {
                const foughtSet = new Set(oCS.map((s) => s.c));
                const notFought = FIGHTERS.filter((f) => !foughtSet.has(f));
                if (!notFought.length) return null;
                return (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, marginBottom: 8 }}>{t("analysis.noMatchupData")}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                      {notFought.map((opp) => (
                        <div key={opp} onClick={() => { setOppDetail(opp); setOppSubTab("myChars"); setCounterMemoText(data.counterMemos?.[opp] || ""); }}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 6px", borderRadius: 10, background: T.inp, cursor: "pointer", opacity: 0.5 }}>
                          <FighterIcon name={opp} size={28} />
                          <div style={{ fontSize: 10, color: T.dim, marginTop: 4, textAlign: "center", lineHeight: 1.2 }}>{fighterName(opp, lang)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
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

            {/* Counter memo */}
            <div style={{ ...cd, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, color: T.dim, fontWeight: 600, marginBottom: 6 }}>{t("analysis.counterMemo")}</div>
              <textarea
                value={counterMemoText}
                onChange={(e) => setCounterMemoText(e.target.value)}
                placeholder={t("battle.counterMemoPlaceholder")}
                rows={3}
                style={{ width: "100%", padding: "10px 12px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", lineHeight: 1.6 }}
              />
              <button
                onClick={() => onSave({ ...data, counterMemos: { ...(data.counterMemos || {}), [oppDetail]: counterMemoText } })}
                style={{ width: "100%", padding: "10px 0", marginTop: 8, border: "none", borderRadius: 10, background: T.accentGrad, color: "#fff", fontSize: 13, fontWeight: 700 }}
              >{t("battle.saveCounterMemo")}</button>
            </div>

            {oppMatches.length > 0 && (
              <>
                {/* Sub-tabs: myChars / history */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {[["myChars", t("analysis.myCharUsed")], ["history", t("analysis.matchHistory")]].map(([k, l]) => (
                    <button key={k} onClick={() => { setOppSubTab(k); setExpandedItem(null); setExpandedDate(null); }} style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 13,
                      fontWeight: oppSubTab === k ? 700 : 500, textAlign: "center",
                      background: oppSubTab === k ? T.accentGrad : T.inp, color: oppSubTab === k ? "#fff" : T.sub, transition: "all .15s ease",
                    }}>{l}</button>
                  ))}
                </div>

                {/* My chars used against this opponent */}
                {oppSubTab === "myChars" && oppMyChars.map((s) =>
                  matchupRow(s, () => data.matches.filter((m) => m.oppChar === oppDetail && m.myChar === s.c).slice().reverse())
                )}

                {/* Match history */}
                {oppSubTab === "history" && dailyList((m) => m.oppChar === oppDetail)}
              </>
            )}
          </div>
        );
      })()}

      {/* ═══════════════ MODE: OVERALL ═══════════════ */}
      {aMode === "overall" && (
        <div>
          {/* Summary */}
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
              const isExp = expandedRolling === n;
              return (
                <div key={n} onClick={() => setExpandedRolling(isExp ? null : n)} style={{
                  ...cd, flex: 1, marginBottom: 0, padding: "14px 16px", textAlign: "center", cursor: "pointer",
                  outline: isExp ? `2px solid ${T.accent}` : "none",
                }}>
                  <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>{t("battle.recentLabel")} {d.t}{t("analysis.battles")}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: d.t ? barColor(r) : T.dim, marginTop: 4 }}>{d.t ? percentStr(d.w, d.t) : "\u2014"}</div>
                  {d.t > 0 && <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{d.w}W {d.t - d.w}L</div>}
                </div>
              );
            })}
          </div>
          {expandedRolling !== null && (
            <div style={{ ...cd, marginBottom: isPC ? 20 : 14, padding: "10px 14px", maxHeight: 320, overflowY: "auto" }}>
              {data.matches.slice(-expandedRolling).reverse().map((m, i, arr) => matchLogRow(m, i, arr.length))}
            </div>
          )}

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

          {/* All daily records (integrated from HistoryTab) */}
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}>{t("analysis.allDailyRecord")}</div>
          {dailyList(() => true)}
        </div>
      )}

      {/* Shared overlays */}
      {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
      {shareImageUrl && (
        <div onClick={() => { URL.revokeObjectURL(shareImageUrl); setShareImageUrl(null); }} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.7)", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn .15s ease" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
            <img src={shareImageUrl} alt="trend" style={{ width: "100%", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,.4)" }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
              <a href={shareImageUrl} download="smash-tracker-trend.png" style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                {t("battle.copyText")}
              </a>
              <button onClick={() => { URL.revokeObjectURL(shareImageUrl); setShareImageUrl(null); }} style={{ padding: "10px 24px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 14, fontWeight: 600 }}>
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
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
    </div>
  );
}
