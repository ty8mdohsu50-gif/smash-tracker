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
  const t = iso.split("T")[1];
  return t ? t.split(".")[0].substring(0, 5) : "";
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

export const lastEndPower = (dl) => {
  const ds = Object.keys(dl).sort();
  for (let i = ds.length - 1; i >= 0; i--) {
    if (dl[ds[i]]?.end) return dl[ds[i]].end;
    if (dl[ds[i]]?.start) return dl[ds[i]].start;
  }
  return "";
};
