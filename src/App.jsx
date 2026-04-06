import { useState, useEffect, useCallback, useRef } from "react";
import { Swords, ClipboardList, BarChart3, Settings as SettingsIcon, LogOut } from "lucide-react";
import { getTheme } from "./styles/theme";
import { load, save, cloudLoad, cloudSave, migrateLocalToCloud } from "./utils/storage";
import { supabase } from "./lib/supabase";
import AuthPage from "./components/AuthPage";
import Settings from "./components/Settings";
import LegalPage from "./components/LegalPage";
import AboutPage from "./components/AboutPage";
import BattleTab from "./components/BattleTab";
import HistoryTab from "./components/HistoryTab";
import AnalysisTab from "./components/AnalysisTab";
import { useI18n } from "./i18n/index.jsx";

const TAB_ICONS = [Swords, ClipboardList, BarChart3];
const PC_BREAKPOINT = 1024;

function useIsPC() {
  const query = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
  const [isPC, setIsPC] = useState(() => {
    if (typeof window.matchMedia === "function") {
      return window.matchMedia(query).matches;
    }
    return window.innerWidth >= PC_BREAKPOINT;
  });
  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      const onResize = () => setIsPC(window.innerWidth >= PC_BREAKPOINT);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsPC(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isPC;
}

export default function App() {
  const { t } = useI18n();
  const TABS = [t("app.tabs.battle"), t("app.tabs.history"), t("app.tabs.analysis")];
  const [user, setUser] = useState(undefined);
  const [skippedAuth, setSkippedAuth] = useState(
    () => localStorage.getItem("smash-skipped-auth") === "1",
  );
  const [data, setData] = useState(() => load());
  const [loading, setLoading] = useState(true);
  const T = getTheme(data.dark !== undefined ? data.dark : true, data.themeColor || "black");
  const [tabIdx, setTabIdx] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [legalPage, setLegalPage] = useState(null);
  const [aboutPage, setAboutPage] = useState(false);
  const touchRef = useRef({ x: 0, y: 0, t: 0, sw: false });
  const wheelRef = useRef({ acc: 0, cooldown: false });
  const mainRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;
  const isPC = useIsPC();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const init = async () => {
      await migrateLocalToCloud(user.id);
      const cloud = await cloudLoad(user.id);
      if (cancelled) return;

      const local = load();
      const localCount = local.matches?.length || 0;
      const cloudCount = cloud?.matches?.length || 0;

      if (cloudCount > localCount) {
        setData(cloud);
        save(cloud);
      } else if (localCount > cloudCount) {
        setData(local);
        cloudSave(user.id, local);
      } else if (cloud) {
        setData(cloud);
        save(cloud);
      }
    };
    init();

    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", T.bg);
    const root = document.documentElement;
    root.style.setProperty("--accent", T.accent);
    root.style.setProperty("--accent-scroll", `${T.accent}33`);
    root.style.setProperty("--accent-scroll-hover", `${T.accent}59`);
  }, [T]);

  const sv = useCallback((d) => {
    setData(d);
    save(d);

    if (userRef.current) {
      cloudSave(userRef.current.id, d);
    }
  }, []);

  const onWheel = useCallback((e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.5) return;
    e.preventDefault();
    if (wheelRef.current.cooldown) return;
    wheelRef.current.acc += e.deltaX;
    if (Math.abs(wheelRef.current.acc) > 120) {
      const dir = wheelRef.current.acc > 0 ? 1 : -1;
      setTabIdx((prev) => Math.max(0, Math.min(2, prev + dir)));
      wheelRef.current.acc = 0;
      wheelRef.current.cooldown = true;
      setTimeout(() => { wheelRef.current.cooldown = false; }, 500);
    }
  }, []);

  useEffect(() => {
    if (!isPC) return;
    const el = mainRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isPC, onWheel]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSkippedAuth(false);
    localStorage.removeItem("smash-skipped-auth");
  };

  const handleSkip = () => {
    setSkippedAuth(true);
    localStorage.setItem("smash-skipped-auth", "1");
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f23",
        color: "#D1D5DB",
        fontFamily: "'Chakra Petch', sans-serif",
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 2,
      }}>
        SMASH TRACKER
      </div>
    );
  }

  if (!user && !skippedAuth) {
    return <AuthPage onSkip={handleSkip} />;
  }

  const onTS = (e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now(), sw: false };
  };
  const onTM = (e) => {
    const dx = e.touches[0].clientX - touchRef.current.x;
    const dy = e.touches[0].clientY - touchRef.current.y;
    if (!touchRef.current.sw && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10)
      touchRef.current.sw = true;
  };
  const onTE = (e) => {
    if (!touchRef.current.sw) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    if (Math.abs(dx) > 50 && Date.now() - touchRef.current.t < 400) {
      if (dx < 0 && tabIdx < 2) setTabIdx(tabIdx + 1);
      if (dx > 0 && tabIdx > 0) setTabIdx(tabIdx - 1);
    }
  };

  const settingsModal = showSettings && (
    <Settings
      data={data}
      onSave={sv}
      onClose={() => setShowSettings(false)}
      onOpenLegal={(page) => setLegalPage(page)}
      onOpenAbout={() => setAboutPage(true)}
      onLogout={handleLogout}
      user={user}
      T={T}
    />
  );

  const legalModal = legalPage && (
    <LegalPage
      T={T}
      page={legalPage}
      onClose={() => setLegalPage(null)}
    />
  );

  const aboutModal = aboutPage && (
    <AboutPage
      T={T}
      onClose={() => setAboutPage(false)}
    />
  );

  const fontFamily = "'Chakra Petch', 'Noto Sans JP', -apple-system, 'Hiragino Sans', sans-serif";

  if (!isPC) {
    return (
      <div
        onTouchStart={onTS}
        onTouchMove={onTM}
        onTouchEnd={onTE}
        style={{
          minHeight: "100vh",
          background: T.bg,
          margin: "0 auto",
          touchAction: "pan-y",
          fontFamily,
          color: T.text,
        }}
      >
        {settingsModal}
        {legalModal}
        {aboutModal}
        <div
          style={{
            background: T.hdr,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            paddingTop: "env(safe-area-inset-top, 8px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            borderBottom: `1px solid ${T.brd}`,
          }}
        >
          <div
            style={{
              padding: "12px 20px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => setTabIdx(0)}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <img src="/icon.png" alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 1.5, color: T.accent, fontFamily: "'Chakra Petch', sans-serif" }}>
                SMASH TRACKER
              </span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label={t("app.settings")}
              style={{
                width: 36, height: 36, border: "none", background: T.inp,
                borderRadius: 10, fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .15s ease",
                color: T.sub,
              }}
            >
              <SettingsIcon size={18} strokeWidth={2} />
            </button>
          </div>
          <div style={{ display: "flex", position: "relative", marginTop: 10 }}>
            {TABS.map((t, i) => {
              const Icon = TAB_ICONS[i];
              return (
                <button
                  key={i}
                  onClick={() => setTabIdx(i)}
                  style={{
                    flex: 1, padding: "12px 0", background: "transparent", border: "none",
                    fontSize: 13, fontWeight: tabIdx === i ? 700 : 500,
                    color: tabIdx === i ? T.accent : T.dim,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "color .15s ease",
                  }}
                >
                  <Icon size={15} strokeWidth={tabIdx === i ? 2.5 : 2} />
                  {t}
                </button>
              );
            })}
            <div
              style={{
                position: "absolute", bottom: 0,
                left: `${(tabIdx * 100) / 3}%`, width: `${100 / 3}%`,
                height: 3,
                background: T.accentGrad,
                borderRadius: "3px 3px 0 0",
                transition: "left .25s cubic-bezier(.4,0,.2,1)",
                boxShadow: T.accentGlow,
              }}
            />
          </div>
        </div>
        <div style={{ padding: "14px 16px 40px" }}>
          <div key={tabIdx} style={{ animation: "fadeUp .25s ease" }}>
            {tabIdx === 0 && <BattleTab data={data} onSave={sv} T={T} onOpenSettings={() => setShowSettings(true)} />}
            {tabIdx === 1 && <HistoryTab data={data} onSave={sv} T={T} onGoBattle={() => setTabIdx(0)} />}
            {tabIdx === 2 && <AnalysisTab data={data} T={T} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: T.bg,
        fontFamily,
        color: T.text,
      }}
    >
      {settingsModal}
      {legalModal}
      {aboutModal}

      <nav
        style={{
          width: 240,
          height: "100vh",
          background: T.card,
          borderRight: `1px solid ${T.brd}`,
          padding: "28px 0",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          boxShadow: T.glow,
        }}
      >
        <button
          onClick={() => setTabIdx(0)}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 24px", marginBottom: 40, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <img src="/icon.png" alt="" style={{ width: 40, height: 40, objectFit: "contain" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: T.accent, lineHeight: 1, fontFamily: "'Chakra Petch', sans-serif" }}>
              SMASH
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, color: T.dim, marginTop: 3, fontFamily: "'Chakra Petch', sans-serif" }}>
              TRACKER
            </div>
          </div>
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 12px" }}>
          {TABS.map((t, i) => {
            const active = tabIdx === i;
            const Icon = TAB_ICONS[i];
            return (
              <button
                key={i}
                onClick={() => setTabIdx(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px",
                  background: active ? T.accentSoft : "transparent",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? T.accent : T.sub,
                  textAlign: "left",
                  transition: "all .2s ease",
                  borderLeft: active ? `3px solid ${T.accent}` : "3px solid transparent",
                }}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {t}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "0 12px", borderTop: `1px solid ${T.brd}`, paddingTop: 16 }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px", background: "transparent", border: "none",
              borderRadius: 12, fontSize: 14, fontWeight: 500, color: T.sub,
              width: "100%", textAlign: "left",
              transition: "all .15s ease",
            }}
          >
            <SettingsIcon size={20} strokeWidth={2} />
            {t("app.settings")}
          </button>
        </div>
      </nav>

      <main ref={mainRef} style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            padding: "20px 40px",
            borderBottom: `1px solid ${T.brd}`,
            background: T.hdr,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, display: "flex", alignItems: "center", gap: 12 }}>
            {(() => { const Icon = TAB_ICONS[tabIdx]; return <Icon size={24} strokeWidth={2.5} color={T.accent} />; })()}
            {TABS[tabIdx]}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {TABS.map((t, i) => {
              const Icon = TAB_ICONS[i];
              return (
                <button
                  key={i}
                  onClick={() => setTabIdx(i)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 10,
                    border: tabIdx === i ? `2px solid ${T.accent}` : `1px solid ${T.brd}`,
                    background: tabIdx === i ? T.accentSoft : T.card,
                    color: tabIdx === i ? T.accent : T.sub,
                    fontSize: 13,
                    fontWeight: tabIdx === i ? 700 : 500,
                    transition: "all .2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Icon size={14} strokeWidth={2} />
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "20px 32px 20px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div key={tabIdx} style={{ animation: "fadeUp .25s ease", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" }}>
            {tabIdx === 0 && <BattleTab data={data} onSave={sv} T={T} isPC onOpenSettings={() => setShowSettings(true)} />}
            {tabIdx === 1 && <HistoryTab data={data} onSave={sv} T={T} isPC onGoBattle={() => setTabIdx(0)} />}
            {tabIdx === 2 && <AnalysisTab data={data} T={T} isPC />}
          </div>
        </div>
      </main>
    </div>
  );
}
