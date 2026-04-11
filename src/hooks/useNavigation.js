import { useState, useCallback, useRef, useEffect } from "react";

export function useNavigation({ showSettings, setShowSettings, aboutPage, setAboutPage, legalPage, setLegalPage, isPC }) {
  const [tabIdx, setTabIdxRaw] = useState(0);
  const [battleMode, setBattleModeRaw] = useState("ranked");
  const [analysisMode, setAnalysisModeRaw] = useState("myChar");

  const navRef = useRef({ tabIdx: 0, battleMode: "ranked", analysisMode: "myChar" });
  const touchRef = useRef({ x: 0, y: 0, t: 0, sw: false });
  const wheelRef = useRef({ acc: 0, cooldown: false });
  const mainRef = useRef(null);

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

  const onWheel = useCallback((e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.5) return;
    e.preventDefault();
    if (wheelRef.current.cooldown) return;
    wheelRef.current.acc += e.deltaX;
    if (Math.abs(wheelRef.current.acc) > 120) {
      const dir = wheelRef.current.acc > 0 ? 1 : -1;
      wheelRef.current.acc = 0;
      wheelRef.current.cooldown = true;
      setTimeout(() => { wheelRef.current.cooldown = false; }, 500);

      const tab = navRef.current.tabIdx;
      const bm = navRef.current.battleMode;
      const am = navRef.current.analysisMode;

      if (tab === 0) {
        if (bm === "ranked" && dir > 0) { setBattleMode("free"); }
        else if (bm === "free" && dir > 0) { setTabIdx(1); setAnalysisMode("myChar"); }
        else if (bm === "free" && dir < 0) { setBattleMode("ranked"); }
      } else if (tab === 1) {
        const idx = ANALYSIS_MODES.indexOf(am);
        if (dir > 0 && idx < ANALYSIS_MODES.length - 1) { setAnalysisMode(ANALYSIS_MODES[idx + 1]); }
        else if (dir < 0 && idx > 0) { setAnalysisMode(ANALYSIS_MODES[idx - 1]); }
        else if (dir < 0 && idx === 0) { setTabIdx(0); setBattleMode("free"); }
      }
    }
  }, [setBattleMode, setTabIdx, setAnalysisMode]);

  useEffect(() => {
    if (!isPC) return;
    const el = mainRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
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
        if (navRef.current.battleMode === "ranked" && dx < 0) {
          setBattleMode("free");
        } else if (navRef.current.battleMode === "free" && dx < 0) {
          setTabIdx(1);
          setAnalysisMode("myChar");
        } else if (navRef.current.battleMode === "free" && dx > 0) {
          setBattleMode("ranked");
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
          setBattleMode("free");
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
