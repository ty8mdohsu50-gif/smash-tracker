import { today, formatTime } from "./format";

const STORAGE_KEY = "smash-tracker-v4";

const DEFAULT_DATA = {
  matches: [],
  settings: { myChar: "" },
  daily: {},
  goals: {},
};

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    const old = localStorage.getItem("smash-tracker-v3");
    if (old) {
      const o = JSON.parse(old);
      return {
        matches: o.matches || [],
        settings: { myChar: o.settings?.myChar || "" },
        daily: {},
        goals: {},
      };
    }

    return { ...DEFAULT_DATA };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function save(d) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // storage full - silently fail
  }
}

export function csvDownload(data) {
  const hdr = "\uFEFF日付,時刻,使用キャラ,相手キャラ,結果,メモ\n";
  const rows = data.matches
    .map(
      (m) =>
        [
          m.date,
          formatTime(m.time),
          `"${m.myChar}"`,
          `"${m.oppChar}"`,
          m.result === "win" ? "勝ち" : "負け",
          `"${(m.memo || "").replace(/"/g, '""')}"`,
        ].join(","),
    )
    .join("\n");

  const hdr2 = "\n\n日付,開始戦闘力,終了戦闘力\n";
  const rows2 = Object.entries(data.daily || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map((e) => [e[0], e[1].start || "", e[1].end || ""].join(","))
    .join("\n");

  const blob = new Blob([hdr + rows + hdr2 + rows2], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `smash_${today()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
