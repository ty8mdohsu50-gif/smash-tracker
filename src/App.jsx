import { useState, useEffect, useCallback, useRef } from "react";
import { LT, DT } from "./styles/theme";
import { load, save } from "./utils/storage";
import Settings from "./components/Settings";
import BattleTab from "./components/BattleTab";
import HistoryTab from "./components/HistoryTab";
import AnalysisTab from "./components/AnalysisTab";

const TABS = ["対戦", "履歴", "分析"];

export default function App() {
  const [data, setData] = useState(() => load());
  const T = data.dark ? DT : LT;
  const [tabIdx, setTabIdx] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const touchRef = useRef({ x: 0, y: 0, t: 0, sw: false });

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
        fontFamily:
          "-apple-system,'Hiragino Sans','Noto Sans JP',sans-serif",
        color: T.text,
      }}
    >
      {showSettings && (
        <Settings
          data={data}
          onSave={sv}
          onClose={() => setShowSettings(false)}
          T={T}
        />
      )}

      {/* Header */}
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
            <span
              style={{
                fontSize: 17,
                fontWeight: 900,
                letterSpacing: 1,
                color: "#FF3B30",
              }}
            >
              SMASH TRACKER
            </span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            style={{
              width: 36,
              height: 36,
              border: "none",
              background: T.inp,
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ⚙️
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", position: "relative", marginTop: 10 }}>
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTabIdx(i)}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "transparent",
                border: "none",
                fontSize: 14,
                fontWeight: tabIdx === i ? 700 : 500,
                color: tabIdx === i ? T.text : T.dim,
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: `${(tabIdx * 100) / 3}%`,
              width: `${100 / 3}%`,
              height: 3,
              background: "#FF3B30",
              borderRadius: "3px 3px 0 0",
              transition: "left .25s cubic-bezier(.4,0,.2,1)",
            }}
          />
        </div>
      </div>

      {/* Content */}
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
