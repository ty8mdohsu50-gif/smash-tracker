import { useState, useEffect, useCallback, useRef } from "react";
import { LT, DT } from "./styles/theme";
import { load, save } from "./utils/storage";
import Settings from "./components/Settings";
import BattleTab from "./components/BattleTab";
import HistoryTab from "./components/HistoryTab";
import AnalysisTab from "./components/AnalysisTab";

const TABS = ["対戦", "履歴", "分析"];
const TAB_ICONS = ["⚔️", "📋", "📊"];
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
      ?.setAttribute("content", data.dark ? "#1c1c1e" : "#ffffff");
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

  // Mobile layout
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
          fontFamily: "-apple-system,'Hiragino Sans','Noto Sans JP',sans-serif",
          color: T.text,
        }}
      >
        {settingsModal}
        <div
          style={{
            background: T.hdr,
            paddingTop: "env(safe-area-inset-top, 8px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
            boxShadow: "0 1px 0 rgba(0,0,0,.06)",
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>⚔️</span>
              <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: 1, color: "#FF3B30" }}>
                SMASH TRACKER
              </span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                width: 36, height: 36, border: "none", background: T.inp,
                borderRadius: 10, cursor: "pointer", fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ⚙️
            </button>
          </div>
          <div style={{ display: "flex", position: "relative", marginTop: 10 }}>
            {TABS.map((t, i) => (
              <button
                key={i}
                onClick={() => setTabIdx(i)}
                style={{
                  flex: 1, padding: "12px 0", background: "transparent", border: "none",
                  fontSize: 14, fontWeight: tabIdx === i ? 700 : 500,
                  color: tabIdx === i ? T.text : T.dim, cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
            <div
              style={{
                position: "absolute", bottom: 0,
                left: `${(tabIdx * 100) / 3}%`, width: `${100 / 3}%`,
                height: 3, background: "#FF3B30", borderRadius: "3px 3px 0 0",
                transition: "left .25s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
        </div>
        <div style={{ padding: "14px 16px 40px" }}>
          <div key={tabIdx} style={{ animation: "fadeUp .2s ease" }}>
            {tabIdx === 0 && <BattleTab data={data} onSave={sv} T={T} />}
            {tabIdx === 1 && <HistoryTab data={data} onSave={sv} T={T} />}
            {tabIdx === 2 && <AnalysisTab data={data} T={T} />}
          </div>
        </div>
      </div>
    );
  }

  // PC layout - full dashboard
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: T.bg,
        fontFamily: "-apple-system,'Hiragino Sans','Noto Sans JP',sans-serif",
        color: T.text,
      }}
    >
      {settingsModal}

      {/* Sidebar */}
      <nav
        style={{
          width: 240,
          height: "100vh",
          background: T.card,
          borderRight: `1px solid ${T.brd !== "transparent" ? T.brd : T.inp}`,
          padding: "28px 0",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          boxShadow: "2px 0 12px rgba(0,0,0,.04)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 24px", marginBottom: 40 }}>
          <span style={{ fontSize: 28 }}>⚔️</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1, color: "#FF3B30", lineHeight: 1 }}>
              SMASH
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: T.dim, marginTop: 2 }}>
              TRACKER
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 12px" }}>
          {TABS.map((t, i) => {
            const active = tabIdx === i;
            return (
              <button
                key={i}
                onClick={() => setTabIdx(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px",
                  background: active
                    ? "linear-gradient(135deg, rgba(255,59,48,.12), rgba(255,59,48,.06))"
                    : "transparent",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#FF3B30" : T.sub,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all .15s ease",
                  borderLeft: active ? "3px solid #FF3B30" : "3px solid transparent",
                }}
              >
                <span style={{ fontSize: 20, width: 24, textAlign: "center" }}>{TAB_ICONS[i]}</span>
                {t}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Settings */}
        <div style={{ padding: "0 12px", borderTop: `1px solid ${T.inp}`, paddingTop: 16 }}>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px", background: "transparent", border: "none",
              borderRadius: 14, fontSize: 15, fontWeight: 500, color: T.sub,
              cursor: "pointer", width: "100%", textAlign: "left",
              transition: "all .15s ease",
            }}
          >
            <span style={{ fontSize: 20, width: 24, textAlign: "center" }}>⚙️</span>
            設定
          </button>
        </div>
      </nav>

      {/* Main content - fills remaining space */}
      <main style={{ flex: 1, height: "100vh", overflowY: "auto", overflowX: "hidden" }}>
        {/* Top header bar */}
        <div
          style={{
            padding: "20px 40px",
            borderBottom: `1px solid ${T.brd !== "transparent" ? T.brd : T.inp}`,
            background: T.card,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: T.text, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{TAB_ICONS[tabIdx]}</span>
            {TABS[tabIdx]}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {TABS.map((t, i) => (
              <button
                key={i}
                onClick={() => setTabIdx(i)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: tabIdx === i ? "2px solid #FF3B30" : `1px solid ${T.dimmer}`,
                  background: tabIdx === i ? "rgba(255,59,48,.08)" : T.card,
                  color: tabIdx === i ? "#FF3B30" : T.sub,
                  fontSize: 13,
                  fontWeight: tabIdx === i ? 700 : 500,
                  cursor: "pointer",
                  transition: "all .15s ease",
                }}
              >
                {TAB_ICONS[i]} {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: "32px 40px 48px" }}>
          <div key={tabIdx} style={{ animation: "fadeUp .2s ease" }}>
            {tabIdx === 0 && <BattleTab data={data} onSave={sv} T={T} isPC />}
            {tabIdx === 1 && <HistoryTab data={data} onSave={sv} T={T} isPC />}
            {tabIdx === 2 && <AnalysisTab data={data} T={T} isPC />}
          </div>
        </div>
      </main>
    </div>
  );
}
