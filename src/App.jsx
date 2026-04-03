import { useState, useEffect, useCallback, useRef } from "react";
import { Swords, ClipboardList, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { LT, DT } from "./styles/theme";
import { load, save } from "./utils/storage";
import Settings from "./components/Settings";
import BattleTab from "./components/BattleTab";
import HistoryTab from "./components/HistoryTab";
import AnalysisTab from "./components/AnalysisTab";

const TABS = ["対戦", "履歴", "分析"];
const TAB_ICONS = [Swords, ClipboardList, BarChart3];
const PC_BREAKPOINT = 768;

function useIsPC() {
  const [isPC, setIsPC] = useState(
    () => window.innerWidth >= PC_BREAKPOINT,
  );
  useEffect(() => {
    const onResize = () => setIsPC(window.innerWidth >= PC_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isPC;
}

export default function App() {
  const [data, setData] = useState(() => load());
  const T = data.dark ? DT : LT;
  const [tabIdx, setTabIdx] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const touchRef = useRef({ x: 0, y: 0, t: 0, sw: false });
  const isPC = useIsPC();

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", data.dark ? "#0F0F23" : "#F1F0FB");
  }, [data.dark]);

  const sv = useCallback((d) => {
    setData(d);
    save(d);
  }, []);

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
      T={T}
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
          maxWidth: 480,
          margin: "0 auto",
          overflow: "hidden",
          touchAction: "pan-y",
          fontFamily,
          color: T.text,
        }}
      >
        {settingsModal}
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(124,58,237,.3)",
                }}
              >
                <Swords size={18} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 1.5, color: T.accent, fontFamily: "'Chakra Petch', sans-serif" }}>
                SMASH TRACKER
              </span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="設定を開く"
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
                background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
                borderRadius: "3px 3px 0 0",
                transition: "left .25s cubic-bezier(.4,0,.2,1)",
                boxShadow: "0 0 8px rgba(124,58,237,.4)",
              }}
            />
          </div>
        </div>
        <div style={{ padding: "14px 16px 40px" }}>
          <div key={tabIdx} style={{ animation: "fadeUp .25s ease" }}>
            {tabIdx === 0 && <BattleTab data={data} onSave={sv} T={T} />}
            {tabIdx === 1 && <HistoryTab data={data} onSave={sv} T={T} />}
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 24px", marginBottom: 40 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(124,58,237,.35)",
            }}
          >
            <Swords size={20} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: T.accent, lineHeight: 1, fontFamily: "'Chakra Petch', sans-serif" }}>
              SMASH
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 3, color: T.dim, marginTop: 3, fontFamily: "'Chakra Petch', sans-serif" }}>
              TRACKER
            </div>
          </div>
        </div>

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
            設定
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
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

        <div style={{ padding: "32px 40px 48px" }}>
          <div key={tabIdx} style={{ animation: "fadeUp .25s ease" }}>
            {tabIdx === 0 && <BattleTab data={data} onSave={sv} T={T} isPC />}
            {tabIdx === 1 && <HistoryTab data={data} onSave={sv} T={T} isPC />}
            {tabIdx === 2 && <AnalysisTab data={data} T={T} isPC />}
          </div>
        </div>
      </main>
    </div>
  );
}
