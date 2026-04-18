import { supabase } from "../lib/supabase";
import { today, formatTime } from "./format";
import { migrateCounterMemos } from "./migrations";

const STORAGE_KEY = "smash-tracker-v4";

const DEFAULT_DATA = {
  matches: [],
  settings: { myChar: "" },
  daily: {},
  goals: {},
};

/* ── localStorage (offline / anonymous) ── */

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateCounterMemos(JSON.parse(raw));

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

/* ── Supabase (cloud) ── */

export async function cloudLoad(userId) {
  const { data, error } = await supabase
    .from("user_data")
    .select("data")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    return null;
  }

  if (data?.data) {
    return migrateCounterMemos({
      ...DEFAULT_DATA,
      ...data.data,
    });
  }

  return null;
}

export async function cloudSave(userId, d) {
  const payload = {
    matches: d.matches,
    settings: d.settings,
    daily: d.daily,
    goals: d.goals,
    dark: d.dark,
    themeColor: d.themeColor,
    shareSettings: d.shareSettings,
    charMemos: d.charMemos,
    matchupNotes: d.matchupNotes,
    freeMatches: d.freeMatches,
    freeOpponents: d.freeOpponents,
    freeStageBans: d.freeStageBans,
    _notesV2: d._notesV2,
    _updatedAt: d._updatedAt || Date.now(),
  };

  const { error } = await supabase
    .from("user_data")
    .upsert(
      { user_id: userId, data: payload, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  return !error;
}

export async function migrateLocalToCloud(userId) {
  const local = load();
  if (!local.matches.length && !Object.keys(local.daily || {}).length) {
    return false;
  }

  const cloud = await cloudLoad(userId);
  if (cloud && cloud.matches.length > 0) {
    return false;
  }

  await cloudSave(userId, local);
  return true;
}

/* ── CSV ── */

export function csvDownload(data) {
  const hdr = "\uFEFF日付,時刻,使用キャラ,相手キャラ,結果,ステージ,メモ,戦闘力\n";
  const rows = data.matches
    .map(
      (m) =>
        [
          m.date,
          formatTime(m.time),
          `"${m.myChar}"`,
          `"${m.oppChar}"`,
          m.result === "win" ? "勝ち" : "負け",
          `"${m.stage || ""}"`,
          `"${(m.memo || "").replace(/"/g, '""')}"`,
          m.power || "",
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
