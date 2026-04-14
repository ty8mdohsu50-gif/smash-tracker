import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { load, cloudLoad } from "../utils/storage";
import { supabase } from "../lib/supabase";
import { today, getStreak } from "../utils/format";
import {
  OVERLAY_POLL_AUTH_S,
  OVERLAY_POLL_ANON_S,
  OVERLAY_TIMER_TICK_MS,
  OVERLAY_FLASH_MS,
} from "../constants/timings";

const clampNum = (v, min, max, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
};

const DEFAULT_ACCENT = "#8B5CF6";

const DEFAULT_MODULES = {
  pill: ["fighter", "score", "rate", "streak", "gsp"],
  card: ["fighter", "score", "rate", "streak", "gsp", "goal", "recent"],
  bar: ["fighter", "score", "rate", "streak", "gsp", "timer"],
};

export function parseOverlayParams(search) {
  const p = new URLSearchParams(search);
  const layout = ["pill", "card", "bar"].includes(p.get("layout")) ? p.get("layout") : "pill";
  const orientation = p.get("orientation") === "vertical" ? "vertical" : "horizontal";
  const positionRaw = p.get("position") || "none";
  const validPositions = ["none", "tl", "tr", "bl", "br", "top", "bottom"];
  const position = validPositions.includes(positionRaw) ? positionRaw : "none";
  const theme = p.get("theme") === "light" ? "light" : "dark";

  // Accept legacy `color` as alias of `accent`
  const accentRaw = p.get("accent") || p.get("color") || DEFAULT_ACCENT;
  const accent = /^#?[0-9a-fA-F]{6}$/.test(accentRaw.replace("#", ""))
    ? (accentRaw.startsWith("#") ? accentRaw : `#${accentRaw}`)
    : DEFAULT_ACCENT;

  const bg = clampNum(p.get("bg"), 0, 100, 70);
  // Scale kept for URL power users but no longer exposed in the UI —
  // OBS itself can resize the browser source.
  const scale = clampNum(p.get("scale"), 0.5, 2, 1);
  const flash = p.get("flash") !== "0";

  const modulesParam = p.get("modules");
  const modules = modulesParam
    ? new Set(modulesParam.split(",").map((s) => s.trim()).filter(Boolean))
    : new Set(DEFAULT_MODULES[layout]);

  const pollOverride = p.get("poll");
  const poll = pollOverride ? clampNum(pollOverride, 1, 120, null) : null;

  return { layout, orientation, position, accent, bg, scale, flash, modules, poll, theme };
}

export function useOverlayData() {
  const [data, setData] = useState(() => load());
  const prevCountRef = useRef(0);
  const [flashState, setFlashState] = useState(null);
  const [sessionStart] = useState(() => Date.now());
  const [tick, setTick] = useState(0);

  const params = useMemo(() => parseOverlayParams(window.location.search), []);
  const userId = useMemo(() => new URLSearchParams(window.location.search).get("user"), []);

  const fetchData = useCallback(async () => {
    if (userId) {
      const cloud = await cloudLoad(userId).catch(() => null);
      if (cloud) setData(cloud);
    } else {
      setData(load());
    }
  }, [userId]);

  // Initial fetch + polling
  useEffect(() => {
    fetchData();
    const pollSeconds = params.poll || (userId ? OVERLAY_POLL_AUTH_S : OVERLAY_POLL_ANON_S);
    const interval = setInterval(fetchData, pollSeconds * 1000);
    return () => clearInterval(interval);
  }, [fetchData, userId, params.poll]);

  // Supabase realtime subscription (best-effort) — complements polling,
  // delivers updates within a few hundred ms of cloud save.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`overlay_user_${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_data", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new?.data) {
            setData((prev) => ({ ...prev, ...payload.new.data }));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Session timer tick (1 Hz) — only when timer module is active
  useEffect(() => {
    if (!params.modules.has("timer")) return;
    const id = setInterval(() => setTick((t) => t + 1), OVERLAY_TIMER_TICK_MS);
    return () => clearInterval(id);
  }, [params.modules]);

  const myChar = data.settings?.myChar || "";
  const allMatches = data.matches || [];
  const todayStr = today();
  const todayMatches = useMemo(
    () => allMatches.filter((m) => m.date === todayStr),
    [allMatches, todayStr],
  );
  const tW = todayMatches.filter((m) => m.result === "win").length;
  const tL = todayMatches.length - tW;
  const total = tW + tL;

  const streak = useMemo(() => getStreak(allMatches), [allMatches]);

  const todayDaily = data.daily?.[todayStr] || {};
  const charPower = todayDaily.chars?.[myChar] || {};
  const dayStart = charPower.start || todayDaily.start || null;
  const dayEnd = charPower.end || todayDaily.end || null;
  const pwrDelta = dayStart && dayEnd ? dayEnd - dayStart : null;
  const currentPower = dayEnd || dayStart || null;

  // Recent result dots (last 8)
  const recent = useMemo(
    () => allMatches.slice(-8).map((m) => m.result),
    [allMatches],
  );

  // Goal progress — todays goal
  const goals = data.goals || {};
  const goalGames = Number(goals.games) || 0;
  const goalWinRate = Number(goals.winRate) || 0;
  const gamesProgress = goalGames > 0 ? Math.min(1, total / goalGames) : 0;
  const winRateProgress = goalWinRate > 0 && total > 0
    ? Math.min(1, (tW / total * 100) / goalWinRate)
    : 0;

  // Win flash detection: fire when match count increments and last was a win
  useEffect(() => {
    const count = allMatches.length;
    if (prevCountRef.current === 0) {
      prevCountRef.current = count;
      return;
    }
    if (count > prevCountRef.current) {
      const last = allMatches[count - 1];
      if (params.flash && last?.result) {
        setFlashState({ result: last.result, at: Date.now() });
        setTimeout(() => setFlashState(null), OVERLAY_FLASH_MS);
      }
    }
    prevCountRef.current = count;
  }, [allMatches, params.flash]);

  // Session timer: elapsed seconds since overlay mount
  const sessionElapsedSec = Math.floor((Date.now() - sessionStart) / 1000);
  // Use `tick` just to trigger rerenders every second (referenced to avoid lint)
  void tick;

  return {
    params,
    myChar,
    tW,
    tL,
    total,
    streak,
    pwrDelta,
    currentPower,
    recent,
    goal: {
      games: goalGames,
      winRate: goalWinRate,
      gamesProgress,
      winRateProgress,
      totalToday: total,
    },
    flashState,
    sessionElapsedSec,
    hasData: !!myChar && total > 0,
    rawData: data,
  };
}

export function formatSessionTimer(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
