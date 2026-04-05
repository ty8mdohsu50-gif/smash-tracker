const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

export const today = () => new Date().toISOString().split("T")[0];

export const formatDate = (d) => {
  const p = d.split("-");
  return `${p[0]}/${Number(p[1])}/${Number(p[2])}`;
};

export const formatDateShort = (d) => {
  const p = d.split("-");
  return `${Number(p[1])}/${Number(p[2])}`;
};

export const formatDateWithDay = (d) =>
  `${formatDateShort(d)}(${DAY_NAMES[new Date(d).getDay()]})`;

export const formatDateLong = (d) => {
  const p = d.split("-");
  return `${p[0]}年${Number(p[1])}月${Number(p[2])}日(${DAY_NAMES[new Date(d).getDay()]})`;
};

export const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const formatHour = (iso) => {
  try {
    return new Date(iso).getHours();
  } catch {
    return -1;
  }
};

export const percentStr = (w, t) =>
  t === 0 ? "\u2014" : `${Math.round((w / t) * 100)}%`;

export const barColor = (r) =>
  r >= 0.6 ? "#34C759" : r >= 0.4 ? "#FF9F0A" : "#FF3B30";

export const numFormat = (n) => (n ? Number(n).toLocaleString() : "\u2014");

export const toHiragana = (s) =>
  s.replace(/[\u30A1-\u30F6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60),
  );

export const formatPower = (v) => {
  if (!v && v !== 0) return "";
  const s = String(v).replace(/[^0-9]/g, "");
  return s ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
};

export const rawPower = (v) => String(v).replace(/[^0-9]/g, "");

export const blurOnEnter = (e) => {
  if (e.key === "Enter") e.target.blur();
};

export const getStreak = (ms) => {
  if (!ms.length) return { type: null, count: 0 };
  const last = ms[ms.length - 1].result;
  let c = 0;
  for (let i = ms.length - 1; i >= 0; i--) {
    if (ms[i].result === last) c++;
    else break;
  }
  return { type: last, count: c };
};

export const recentChars = (ms, field) => {
  const seen = {};
  const out = [];
  for (let i = ms.length - 1; i >= 0; i--) {
    const c = ms[i][field];
    if (!seen[c]) {
      seen[c] = true;
      out.push(c);
    }
  }
  return out;
};

export const lastEndPower = (dl, charName) => {
  const ds = Object.keys(dl).sort();
  for (let i = ds.length - 1; i >= 0; i--) {
    const day = dl[ds[i]];
    if (day?.chars && charName) {
      const cd = day.chars[charName];
      if (cd?.end) return cd.end;
      if (cd?.start) return cd.start;
    }
    if (day?.end) return day.end;
    if (day?.start) return day.start;
  }
  return "";
};

export const getDayPowerSummary = (day) => {
  if (!day) return { start: null, end: null };
  if (day.chars) {
    const chars = Object.values(day.chars);
    const starts = chars.map((c) => c.start).filter(Boolean);
    const ends = chars.map((c) => c.end).filter(Boolean);
    return {
      start: starts.length ? Math.min(...starts) : null,
      end: ends.length ? Math.max(...ends) : null,
    };
  }
  return { start: day.start || null, end: day.end || null };
};
