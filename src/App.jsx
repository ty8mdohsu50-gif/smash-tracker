import { useState, useCallback } from "react";
import { Swords, BarChart3, Settings as SettingsIcon, Keyboard, Radio } from "lucide-react";
import { useEscapeKey } from "./hooks/useEscapeKey";
import { getTheme } from "./styles/theme";
import { load } from "./utils/storage";
import AuthPage from "./components/AuthPage";
import Settings from "./components/Settings";
import LegalPage from "./components/LegalPage";
import AboutPage from "./components/AboutPage";
import ShortcutsModal from "./components/shared/ShortcutsModal";
import BroadcastHelpModal from "./components/shared/BroadcastHelpModal";
import OverlayBuilderModal from "./components/shared/OverlayBuilderModal";
import BattleTab from "./components/battle/BattleTab";
import AnalysisTab from "./components/analysis/AnalysisTab";
import { useI18n } from "./i18n/index.jsx";
import { useIsPC } from "./hooks/useIsPC";
import { useIsLandscape } from "./hooks/useIsLandscape";
import { useAuth } from "./hooks/useAuth";
import { useCloudSync } from "./hooks/useCloudSync";
import { useThemeEffect } from "./hooks/useThemeEffect";
import { useNavigation } from "./hooks/useNavigation";
import {
  Z_ONBOARDING,
  Z_MOBILE_STICKY_HEADER,
  Z_PC_STICKY_HEADER,
} from "./constants/zIndex";

const TAB_ICONS = [Swords, BarChart3];

export default function App() {
  const { t } = useI18n();
  const TABS = [t("app.tabs.battle"), t("app.tabs.analysis")];

  const { user, loading, skippedAuth, handleLogout, handleSkip } = useAuth();
  const { data, saveData } = useCloudSync(user);
  const T = getTheme(data.dark !== undefined ? data.dark : false, data.themeColor || "black");

  const [showSettings, setShowSettings] = useState(false);
  const [legalPage, setLegalPage] = useState(null);
  const [aboutPage, setAboutPage] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showBroadcastHelp, setShowBroadcastHelp] = useState(false);
  const [showOverlayBuilder, setShowOverlayBuilder] = useState(false);
  const [showOnboard, setShowOnboard] = useState(() => {
    if (localStorage.getItem("smash-onboard-done") === "1") return false;
    const d = load();
    return !d.matches || d.matches.length === 0;
  });

  const isPC = useIsPC();
  const isLandscape = useIsLandscape();
  useThemeEffect(T);

  const dismissOnboard = useCallback(() => {
    localStorage.setItem("smash-onboard-done", "1");
    setShowOnboard(false);
  }, []);
  useEscapeKey(dismissOnboard, showOnboard);

  const anyModalOpen = showSettings || !!legalPage || aboutPage || showShortcuts || showBroadcastHelp || showOverlayBuilder || showOnboard;

  const {
    tabIdx, setTabIdx,
    battleMode, setBattleMode,
    analysisMode, setAnalysisMode,
    mainRef,
    onTouchStart, onTouchMove, onTouchEnd,
  } = useNavigation({ showSettings, setShowSettings, aboutPage, setAboutPage, legalPage, setLegalPage, isPC, modalsBlocking: anyModalOpen });

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={t("app.loading")}
        style={{
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
        }}
      >
        SMASH TRACKER
      </div>
    );
  }

  if (!user && !skippedAuth) {
    return <AuthPage onSkip={handleSkip} />;
  }

  const settingsModal = showSettings && (
    <Settings
      data={data}
      onSave={saveData}
      onClose={() => setShowSettings(false)}
      onOpenLegal={(page) => setLegalPage(page)}
      onOpenAbout={() => setAboutPage(true)}
      onLogout={handleLogout}
      user={user}
      T={T}
    />
  );

  const legalModal = legalPage && (
    <LegalPage T={T} page={legalPage} onClose={() => setLegalPage(null)} />
  );

  const aboutModal = aboutPage && (
    <AboutPage T={T} onClose={() => setAboutPage(false)} onOpenLegal={(page) => { setAboutPage(false); setLegalPage(page); }} />
  );

  const shortcutsModal = showShortcuts && (
    <ShortcutsModal T={T} onClose={() => setShowShortcuts(false)} />
  );

  const broadcastHelpModal = showBroadcastHelp && (
    <BroadcastHelpModal T={T} onClose={() => setShowBroadcastHelp(false)} />
  );

  const overlayBuilderModal = showOverlayBuilder && (
    <OverlayBuilderModal
      T={T}
      user={user}
      onClose={() => setShowOverlayBuilder(false)}
      onOpenHelp={() => setShowBroadcastHelp(true)}
    />
  );

  const onboardModal = showOnboard && (
    <div style={{ position: "fixed", inset: 0, zIndex: Z_ONBOARDING, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 380, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ background: T.accent, padding: "28px 24px 22px", textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: 2, fontFamily: "'Chakra Petch', sans-serif" }}>SMASH TRACKER</div>
        </div>
        <div style={{ padding: "24px 24px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: "#333", whiteSpace: "pre-line", marginBottom: 24 }}>
            {t("battle.onboardDesc")}
          </div>
          <button
            onClick={() => { localStorage.setItem("smash-onboard-done", "1"); setShowOnboard(false); }}
            style={{ width: "100%", padding: "14px 0", background: T.accent, color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", letterSpacing: 1 }}
          >
            {t("battle.onboardOk")}
          </button>
        </div>
      </div>
    </div>
  );

  const fontFamily = "'Chakra Petch', 'Noto Sans JP', -apple-system, 'Hiragino Sans', sans-serif";

  if (!isPC) {
    return (
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          minHeight: "100vh",
          background: T.bg,
          margin: "0 auto",
          touchAction: "manipulation",
          fontFamily,
          color: T.text,
        }}
      >
        {settingsModal}
        {legalModal}
        {aboutModal}
        {broadcastHelpModal}
        {overlayBuilderModal}
        {onboardModal}
        <div
          style={{
            background: T.hdr,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            paddingTop: "env(safe-area-inset-top, 8px)",
            position: "sticky",
            top: 0,
            zIndex: Z_MOBILE_STICKY_HEADER,
            borderBottom: `1px solid ${T.brd}`,
          }}
        >
          <div
            style={{
              padding: isLandscape ? "6px 16px 0" : "12px 20px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              onClick={() => { setTabIdx(0); setBattleMode("ranked"); }}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
            >
              <div style={{ width: isLandscape ? 28 : 36, height: isLandscape ? 28 : 36, borderRadius: 10, overflow: "hidden" }}>
                <img src="/icon.png" alt="" style={{ width: isLandscape ? 28 : 36, height: isLandscape ? 28 : 36, objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: isLandscape ? 14 : 17, fontWeight: 700, letterSpacing: 1.5, color: T.accent, fontFamily: "'Chakra Petch', sans-serif" }}>
                SMASH TRACKER
              </span>
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setAboutPage(true)}
                style={{
                  border: "none", background: T.inp,
                  borderRadius: 10, fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: T.sub, padding: "6px 12px", height: isLandscape ? 28 : 36,
                }}
              >
                {t("about.siteAbout")}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                aria-label={t("app.settings")}
                style={{
                  width: isLandscape ? 28 : 36, height: isLandscape ? 28 : 36, border: "none", background: T.inp,
                  borderRadius: 10, fontSize: 18,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .15s ease",
                  color: T.sub,
                }}
              >
                <SettingsIcon size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
          <nav aria-label="Primary" role="tablist" style={{ display: "flex", position: "relative", marginTop: 10 }}>
            {TABS.map((t, i) => {
              const Icon = TAB_ICONS[i];
              const active = tabIdx === i;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={active}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setTabIdx(i)}
                  style={{
                    flex: 1, minHeight: 44, padding: isLandscape ? "8px 0" : "12px 0", background: "transparent", border: "none",
                    fontSize: 13, fontWeight: active ? 700 : 500,
                    color: active ? T.accent : T.dim,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "color .15s ease",
                  }}
                >
                  <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                  {t}
                </button>
              );
            })}
            <div
              style={{
                position: "absolute", bottom: 0,
                left: `${(tabIdx * 100) / TABS.length}%`, width: `${100 / TABS.length}%`,
                height: 3,
                background: T.accentGrad,
                borderRadius: "3px 3px 0 0",
                transition: "left .25s cubic-bezier(.4,0,.2,1)",
                boxShadow: T.accentGlow,
              }}
            />
          </nav>
        </div>
        <div style={{ padding: isLandscape ? "8px 12px 20px" : "14px 16px 40px" }}>
          <div key={tabIdx} style={{ animation: "fadeUp .25s ease" }}>
            {tabIdx === 0 && <BattleTab data={data} onSave={saveData} T={T} battleMode={battleMode} setBattleMode={setBattleMode} tabIdx={tabIdx} modalsOpen={anyModalOpen} broadcastMode={broadcastMode} setBroadcastMode={setBroadcastMode} onOpenOverlayBuilder={() => setShowOverlayBuilder(true)} />}
            {tabIdx === 1 && <AnalysisTab data={data} onSave={saveData} T={T} aMode={analysisMode} setAMode={setAnalysisMode} />}
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
      {shortcutsModal}
      {broadcastHelpModal}
      {overlayBuilderModal}
      {onboardModal}

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
          onClick={() => { setTabIdx(0); setBattleMode("ranked"); }}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 24px", marginBottom: 40, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, overflow: "hidden" }}>
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

        <nav aria-label="Primary" style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 12px" }}>
          {TABS.map((t, i) => {
            const active = tabIdx === i;
            const Icon = TAB_ICONS[i];
            return (
              <button
                key={i}
                onClick={() => setTabIdx(i)}
                aria-current={active ? "page" : undefined}
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
        </nav>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "0 12px", borderTop: `1px solid ${T.brd}`, paddingTop: 16 }}>
          <button
            onClick={() => setShowOverlayBuilder(true)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 18px", background: "transparent", border: "none",
              borderRadius: 12, fontSize: 14, fontWeight: 500, color: T.sub,
              width: "100%", textAlign: "left",
              transition: "all .15s ease",
            }}
          >
            <Radio size={20} strokeWidth={2} />
            {t("broadcast.builder.title")}
          </button>
          <button
            onClick={() => setShowShortcuts(true)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 18px", background: "transparent", border: "none",
              borderRadius: 12, fontSize: 14, fontWeight: 500, color: T.sub,
              width: "100%", textAlign: "left",
              transition: "all .15s ease",
            }}
          >
            <Keyboard size={20} strokeWidth={2} />
            {t("app.shortcuts")}
          </button>
          <button
            onClick={() => setAboutPage(true)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 18px", background: "transparent", border: "none",
              borderRadius: 12, fontSize: 14, fontWeight: 500, color: T.sub,
              width: "100%", textAlign: "left",
              transition: "all .15s ease",
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, width: 20, textAlign: "center" }}>?</span>
            {t("about.siteAbout")}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 18px", background: "transparent", border: "none",
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
            zIndex: Z_PC_STICKY_HEADER,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, display: "flex", alignItems: "center", gap: 12 }}>
            {(() => { const Icon = TAB_ICONS[tabIdx]; return <Icon size={24} strokeWidth={2.5} color={T.accent} />; })()}
            {TABS[tabIdx]}
          </div>
          <div role="tablist" aria-label="Primary" style={{ display: "flex", gap: 8 }}>
            {TABS.map((t, i) => {
              const Icon = TAB_ICONS[i];
              const active = tabIdx === i;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={active}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setTabIdx(i)}
                  style={{
                    minHeight: 44,
                    padding: "8px 18px",
                    borderRadius: 10,
                    border: active ? `2px solid ${T.accent}` : `1px solid ${T.brd}`,
                    background: active ? T.accentSoft : T.card,
                    color: active ? T.accent : T.sub,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    transition: "all .2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
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
            {tabIdx === 0 && <BattleTab data={data} onSave={saveData} T={T} isPC battleMode={battleMode} setBattleMode={setBattleMode} tabIdx={tabIdx} modalsOpen={anyModalOpen} broadcastMode={broadcastMode} setBroadcastMode={setBroadcastMode} onOpenOverlayBuilder={() => setShowOverlayBuilder(true)} />}
            {tabIdx === 1 && <AnalysisTab data={data} onSave={saveData} T={T} isPC aMode={analysisMode} setAMode={setAnalysisMode} />}
          </div>
        </div>
      </main>
    </div>
  );
}
