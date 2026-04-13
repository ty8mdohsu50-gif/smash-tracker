import { useState, useCallback, useRef, useEffect } from "react";

// Wheel/swipe tuning — keep responsive without accidental fires.
const WHEEL_THRESHOLD = 60;       // px of accumulated deltaX required to switch
const WHEEL_COOLDOWN_MS = 350;    // min gap between switches
const WHEEL_DECAY_MS = 180;       // reset accumulator if no wheel event in this window
const WHEEL_DOMINANCE = 1.2;      // |dx| must exceed |dy| * this ratio to count as horizontal

export function useNavigation({ showSettings, setShowSettings, aboutPage, setAboutPage, legalPage, setLegalPage, isPC, modalsBlocking }) {
  const [tabIdx, setTabIdxRaw] = useState(0);
  const [battleMode, setBattleModeRaw] = useState("ranked");
  const [analysisMode, setAnalysisModeRaw] = useState("myChar");

  const navRef = useRef({ tabIdx: 0, battleMode: "ranked", analysisMode: "myChar" });
  const touchRef = useRef({ x: 0, y: 0, t: 0, sw: false });
  const wheelRef = useRef({ acc: 0, cooldown: false, lastAt: 0 });
  const mainRef = useRef(null);
  const blockingRef = useRef(false);
  blockingRef.current = !!modalsBlocking;

  const setTabIdx = useCallback((v) => {
    const val = typeof v === "function" ? v(navRef.current.tabIdx) : v;
    navRef.current.tabIdx = val;
    setTabIdxRaw(val);
  }, []);
  const setBattleMode = useCallback((v) => { navRef.current.battleMode = v; setBattleModeRaw(v); }, []);
  const setAnalysisMode = useCallback((v) => { navRef.current.analysisMode = v; setAnalysisModeRaw(v); }, []);

  useEffect(() => {
    const pushNav = () => {
      const s = { tab: navRef.current.tabIdx, bm: navRef.current.battleMode, am: navRef.current.analysisMode };
      window.history.pushState(s, "");
    };
    pushNav();
    const onPop = (e) => {
      if (showSettings) { setShowSettings(false); window.history.pushState(null, ""); return; }
      if (aboutPage) { setAboutPage(false); window.history.pushState(null, ""); return; }
      if (legalPage) { setLegalPage(null); window.history.pushState(null, ""); return; }
      if (e.state) {
        navRef.current = { tabIdx: e.state.tab, battleMode: e.state.bm, analysisMode: e.state.am };
        setTabIdxRaw(e.state.tab);
        setBattleModeRaw(e.state.bm);
        setAnalysisModeRaw(e.state.am);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [showSettings, aboutPage, legalPage, setShowSettings, setAboutPage, setLegalPage]);

  const ANALYSIS_MODES = ["myChar", "oppChar", "overall"];
  const BATTLE_MODES = ["ranked", "free"];

  const onWheel = useCallback((e) => {
    if (blockingRef.current) return;
    const ax = Math.abs(e.deltaX);
    const ay = Math.abs(e.deltaY);
    // Not a horizontal gesture: let the browser do its normal scroll.
    if (ax < ay * WHEEL_DOMINANCE || ax < 1) return;
    e.preventDefault();
    if (wheelRef.current.cooldown) return;

    // Time-based decay: reset accumulator on stale residue from earlier gestures.
    const now = Date.now();
    if (now - wheelRef.current.lastAt > WHEEL_DECAY_MS) {
      wheelRef.current.acc = 0;
    }
    wheelRef.current.lastAt = now;
    wheelRef.current.acc += e.deltaX;

    if (Math.abs(wheelRef.current.acc) > WHEEL_THRESHOLD) {
      const dir = wheelRef.current.acc > 0 ? 1 : -1;
      wheelRef.current.acc = 0;
      wheelRef.current.cooldown = true;
      setTimeout(() => { wheelRef.current.cooldown = false; }, WHEEL_COOLDOWN_MS);

      const tab = navRef.current.tabIdx;
      const bm = navRef.current.battleMode;
      const am = navRef.current.analysisMode;

      if (tab === 0) {
        const bmIdx = BATTLE_MODES.indexOf(bm);
        if (dir > 0 && bmIdx < BATTLE_MODES.length - 1) { setBattleMode(BATTLE_MODES[bmIdx + 1]); }
        else if (dir > 0 && bmIdx === BATTLE_MODES.length - 1) { setTabIdx(1); setAnalysisMode("myChar"); }
        else if (dir < 0 && bmIdx > 0) { setBattleMode(BATTLE_MODES[bmIdx - 1]); }
      } else if (tab === 1) {
        const idx = ANALYSIS_MODES.indexOf(am);
        if (dir > 0 && idx < ANALYSIS_MODES.length - 1) { setAnalysisMode(ANALYSIS_MODES[idx + 1]); }
        else if (dir < 0 && idx > 0) { setAnalysisMode(ANALYSIS_MODES[idx - 1]); }
        else if (dir < 0 && idx === 0) { setTabIdx(0); setBattleMode(BATTLE_MODES[BATTLE_MODES.length - 1]); }
      }
    }
  }, [setBattleMode, setTabIdx, setAnalysisMode]);

  useEffect(() => {
    if (!isPC) return;
    // Listen on window so horizontal wheel gestures are caught regardless of the
    // pointer target (sidebar, content scroll container, fixed header, etc.).
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [isPC, onWheel]);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now(), sw: false };
  };
  const onTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchRef.current.x;
    const dy = e.touches[0].clientY - touchRef.current.y;
    if (!touchRef.current.sw && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10)
      touchRef.current.sw = true;
  };
  const onTouchEnd = (e) => {
    if (!touchRef.current.sw) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    if (Math.abs(dx) > 50 && Date.now() - touchRef.current.t < 400) {
      if (navRef.current.tabIdx === 0) {
        const bmIdx = BATTLE_MODES.indexOf(navRef.current.battleMode);
        if (dx < 0 && bmIdx < BATTLE_MODES.length - 1) {
          setBattleMode(BATTLE_MODES[bmIdx + 1]);
        } else if (dx < 0 && bmIdx === BATTLE_MODES.length - 1) {
          setTabIdx(1);
          setAnalysisMode("myChar");
        } else if (dx > 0 && bmIdx > 0) {
          setBattleMode(BATTLE_MODES[bmIdx - 1]);
        }
        return;
      }
      if (navRef.current.tabIdx === 1) {
        const idx = ANALYSIS_MODES.indexOf(navRef.current.analysisMode);
        if (dx < 0 && idx < ANALYSIS_MODES.length - 1) {
          setAnalysisMode(ANALYSIS_MODES[idx + 1]);
        } else if (dx > 0 && idx > 0) {
          setAnalysisMode(ANALYSIS_MODES[idx - 1]);
        } else if (dx > 0 && idx === 0) {
          setTabIdx(0);
          setBattleMode(BATTLE_MODES[BATTLE_MODES.length - 1]);
        }
        return;
      }
    }
  };

  return {
    tabIdx, setTabIdx,
    battleMode, setBattleMode,
    analysisMode, setAnalysisMode,
    mainRef,
    onTouchStart, onTouchMove, onTouchEnd,
  };
}
