import { FIGHTERS } from "../constants/fighters";
import { Z_ANALYSIS_FULLSCREEN } from "../constants/zIndex";

export const ANALYSIS_PREFS_KEY = "st_analysis_prefs_v1";

export function defaultAnalysisPrefs() {
  return {
    topMySort: "officialAsc",
    topMyHide: false,
    myMuSort: "officialAsc",
    myMuHide: false,
    topOppSort: "officialAsc",
    topOppHide: false,
    oppMySort: "gamesDesc",
    oppMyHide: false,
  };
}

export function loadAnalysisPrefs() {
  try {
    const raw = localStorage.getItem(ANALYSIS_PREFS_KEY);
    if (!raw) return defaultAnalysisPrefs();
    return { ...defaultAnalysisPrefs(), ...JSON.parse(raw) };
  } catch {
    return defaultAnalysisPrefs();
  }
}

export function sortCharStatsRows(rows, mode, hideUnfought) {
  const idx = (c) => FIGHTERS.indexOf(c);
  let r = hideUnfought ? rows.filter((x) => x.t > 0) : [...rows];
  const tieBreakT = (a, b) => (b.t !== a.t ? b.t - a.t : idx(a.c) - idx(b.c));
  switch (mode) {
    case "officialAsc":
      r.sort((a, b) => idx(a.c) - idx(b.c));
      break;
    case "officialDesc":
      r.sort((a, b) => idx(b.c) - idx(a.c));
      break;
    case "wrDesc":
      r.sort((a, b) => {
        if (a.t === 0 && b.t === 0) return idx(a.c) - idx(b.c);
        if (a.t === 0) return 1;
        if (b.t === 0) return -1;
        const ra = a.w / a.t;
        const rb = b.w / b.t;
        if (rb !== ra) return rb - ra;
        return tieBreakT(a, b);
      });
      break;
    case "wrAsc":
      r.sort((a, b) => {
        if (a.t === 0 && b.t === 0) return idx(a.c) - idx(b.c);
        if (a.t === 0) return 1;
        if (b.t === 0) return -1;
        const ra = a.w / a.t;
        const rb = b.w / b.t;
        if (ra !== rb) return ra - rb;
        return tieBreakT(a, b);
      });
      break;
    case "gamesDesc":
      r.sort((a, b) => b.t - a.t || idx(a.c) - idx(b.c));
      break;
    case "gamesAsc":
      r.sort((a, b) => a.t - b.t || idx(a.c) - idx(b.c));
      break;
    default:
      r.sort((a, b) => idx(a.c) - idx(b.c));
  }
  return r;
}

export function computeRollingGraphSeries(allMatches, windowSize) {
  const len = allMatches.length;
  if (len < windowSize) return [];
  const maxPts = 36;
  const inner = len - windowSize;
  const step = inner <= maxPts ? 1 : Math.ceil(inner / maxPts);
  const pts = [];
  for (let end = windowSize; end <= len; end += step) {
    const sl = allMatches.slice(end - windowSize, end);
    pts.push({ end, rate: sl.filter((m) => m.result === "win").length / windowSize });
  }
  if (pts.length === 0 || pts[pts.length - 1].end !== len) {
    const sl = allMatches.slice(-windowSize);
    pts.push({ end: len, rate: sl.filter((m) => m.result === "win").length / windowSize });
  }
  return pts;
}

export function streakStatsInMatches(msChrono) {
  let maxW = 0;
  let maxL = 0;
  let curW = 0;
  let curL = 0;
  msChrono.forEach((m) => {
    if (m.result === "win") {
      curW += 1;
      curL = 0;
      maxW = Math.max(maxW, curW);
    } else {
      curL += 1;
      curW = 0;
      maxL = Math.max(maxL, curL);
    }
  });
  return { maxWin: maxW, maxLose: maxL };
}

/** Build per-day aggregates for the calendar (matches include original index). */
export function buildDailyMap(dataMatches, filterFn) {
  const dailyMap = {};
  dataMatches.forEach((m, idx) => {
    if (!filterFn(m)) return;
    const dateStr = m.date;
    if (!dailyMap[dateStr]) dailyMap[dateStr] = { w: 0, l: 0, matches: [] };
    if (m.result === "win") dailyMap[dateStr].w++;
    else dailyMap[dateStr].l++;
    dailyMap[dateStr].matches.push({ ...m, idx });
  });
  return dailyMap;
}

export function dailyScopesEqual(a, b) {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (a.type === "overall") return true;
  return a.c === b.c;
}

export function analysisModalShellStyles(isPC, T) {
  return {
    backdrop: {
      position: "fixed", inset: 0, zIndex: Z_ANALYSIS_FULLSCREEN,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: isPC ? "center" : "flex-end", justifyContent: "center",
      padding: isPC ? 20 : 10,
      animation: "fadeUp .14s ease",
    },
    panel: {
      width: "100%", maxWidth: isPC ? 700 : "100%",
      maxHeight: isPC ? "min(90vh, 880px)" : "96dvh",
      background: T.card,
      borderRadius: isPC ? 20 : "18px 18px 0 0",
      boxShadow: isPC ? "0 24px 72px rgba(0,0,0,0.3)" : "0 -8px 40px rgba(0,0,0,0.18)",
      display: "flex", flexDirection: "column", overflow: "hidden",
    },
  };
}

export function topOpponentStats(ms, limit) {
  const map = {};
  ms.forEach((m) => {
    if (!map[m.oppChar]) map[m.oppChar] = { w: 0, l: 0 };
    m.result === "win" ? map[m.oppChar].w++ : map[m.oppChar].l++;
  });
  return Object.entries(map)
    .map(([c, v]) => ({ c, w: v.w, l: v.l, t: v.w + v.l }))
    .sort((a, b) => b.t - a.t)
    .slice(0, limit);
}
