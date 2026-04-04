import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { csvDownload } from "../utils/storage";
import { THEME_KEYS, getThemeLabel } from "../styles/theme";

const SWATCH_COLORS = {
  purple: "#7C3AED",
  blue: "#2563EB",
  cyan: "#0891B2",
  emerald: "#059669",
  orange: "#EA580C",
  rose: "#E11D48",
  amber: "#D97706",
  red: "#DC2626",
  white: "#E5E7EB",
  black: "#1F2937",
};

export default function Settings({ data, onSave, onClose, onOpenLegal, onLogout, user, T }) {
  const [step, setStep] = useState(0);
  const [showTheme, setShowTheme] = useState(false);
  const [gGames, setGG] = useState(String(data.goals?.games || ""));
  const [gWR, setGWR] = useState(String(data.goals?.winRate || ""));

  const currentColor = data.themeColor || "purple";

  const saveGoals = () =>
    onSave({
      ...data,
      goals: { games: parseInt(gGames) || 0, winRate: parseInt(gWR) || 0 },
    });

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  const setThemeColor = (key) => {
    onSave({ ...data, themeColor: key });
  };

  const section = (children) => ({
    padding: "16px 0",
    borderBottom: `1px solid ${T.inp}`,
    ...children,
  });

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card,
          borderRadius: 20,
          width: "100%",
          maxWidth: 400,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          animation: "fadeUp .2s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: `1px solid ${T.brd}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>設定</div>
          <button
            onClick={handleClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: `1px solid ${T.brd}`, background: T.inp,
              color: T.sub, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: "0 22px 22px", overflowY: "auto", flex: 1 }}>

          {/* Goals - first section */}
          <div style={{ padding: "18px 0", borderBottom: `1px solid ${T.inp}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 14 }}>
              今日の目標
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: T.sub, fontWeight: 600, minWidth: 52 }}>対戦数</span>
              <input
                type="number"
                value={gGames}
                onChange={(e) => setGG(e.target.value)}
                onBlur={saveGoals}
                placeholder="10"
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  background: T.inp,
                  border: "none",
                  borderRadius: 12,
                  color: T.text,
                  fontSize: 18,
                  fontWeight: 700,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Chakra Petch', sans-serif",
                }}
              />
              <span style={{ fontSize: 14, color: T.sub, fontWeight: 600 }}>戦</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 14, color: T.sub, fontWeight: 600, minWidth: 52 }}>勝率</span>
              <input
                type="number"
                value={gWR}
                onChange={(e) => setGWR(e.target.value)}
                onBlur={saveGoals}
                placeholder="60"
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  background: T.inp,
                  border: "none",
                  borderRadius: 12,
                  color: T.text,
                  fontSize: 18,
                  fontWeight: 700,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Chakra Petch', sans-serif",
                }}
              />
              <span style={{ fontSize: 14, color: T.sub, fontWeight: 600 }}>%</span>
            </div>
          </div>

          {/* Dark mode */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0",
              borderBottom: `1px solid ${T.inp}`,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>ダークモード</span>
            <button
              onClick={() => onSave({ ...data, dark: !data.dark })}
              style={{
                width: 54, height: 30, borderRadius: 15, border: "none",
                background: data.dark ? T.accent : "#E5E5EA",
                position: "relative", flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 26, height: 26, borderRadius: 13, background: "#fff",
                  position: "absolute", top: 2, left: data.dark ? 26 : 2,
                  transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                }}
              />
            </button>
          </div>

          {/* Theme color - collapsible */}
          <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
            <button
              onClick={() => setShowTheme(!showTheme)}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "transparent", border: "none", color: T.text, padding: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>テーマカラー</span>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: SWATCH_COLORS[currentColor],
                  border: currentColor === "white" ? `2px solid ${T.dimmer}` : "none",
                }} />
                <span style={{ fontSize: 12, color: T.dim }}>{getThemeLabel(currentColor)}</span>
              </div>
              {showTheme ? <ChevronUp size={18} color={T.dim} /> : <ChevronDown size={18} color={T.dim} />}
            </button>
            {showTheme && (
              <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, animation: "fadeUp .15s ease" }}>
                {THEME_KEYS.map((key) => {
                  const active = currentColor === key;
                  const swatchColor = SWATCH_COLORS[key];
                  const isLight = key === "white";
                  return (
                    <button
                      key={key}
                      onClick={() => setThemeColor(key)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                        padding: "10px 4px", borderRadius: 12,
                        border: active ? `2px solid ${T.accent}` : `1px solid ${T.inp}`,
                        background: active ? T.accentSoft : "transparent",
                        transition: "all .15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: "50%", background: swatchColor,
                          border: isLight ? `2px solid ${T.dimmer}` : "none",
                          boxShadow: active ? `0 0 0 2px ${T.card}, 0 0 0 4px ${swatchColor}` : "none",
                        }}
                      />
                      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? T.accent : T.dim }}>
                        {getThemeLabel(key)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* CSV / Reset */}
          <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
            <button
              onClick={() => csvDownload(data)}
              style={{
                width: "100%", padding: 16, border: "none", borderRadius: 12,
                background: T.inp, color: T.text, fontSize: 15, fontWeight: 600,
                textAlign: "left", marginBottom: 6,
              }}
            >
              CSVダウンロード
            </button>
            <div style={{ fontSize: 12, color: T.dim, paddingLeft: 4, marginBottom: 12 }}>
              {data.matches.length ? `戦績${data.matches.length}件` : "データなし"}
            </div>

            {step === 0 && (
              <button
                onClick={() => setStep(1)}
                style={{
                  width: "100%", padding: 16, border: "none", borderRadius: 12,
                  background: "rgba(220,38,38,.08)", color: "#dc2626",
                  fontSize: 15, fontWeight: 600, textAlign: "left",
                }}
              >
                全データリセット
              </button>
            )}

            {step === 1 && (
              <div style={{ background: "rgba(220,38,38,.08)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>
                  全データを削除しますか？
                </div>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 14 }}>
                  CSVダウンロードを先にどうぞ
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setStep(0)}
                    style={{
                      flex: 1, padding: 14, border: `1px solid ${T.dimmer}`, borderRadius: 12,
                      background: T.card, color: T.text, fontSize: 14, fontWeight: 600,
                    }}
                  >
                    やめる
                  </button>
                  <button
                    onClick={() => {
                      onSave({
                        matches: [], settings: data.settings, daily: {},
                        goals: data.goals || {}, dark: data.dark, themeColor: data.themeColor,
                      });
                      setStep(0);
                      onClose();
                    }}
                    style={{
                      flex: 1, padding: 14, border: "none", borderRadius: 12,
                      background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 600,
                    }}
                  >
                    削除する
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account */}
          {user && (
            <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>アカウント</div>
              <div style={{ fontSize: 13, color: T.dim, marginBottom: 12, wordBreak: "break-all" }}>{user.email}</div>
              <button
                onClick={() => { handleClose(); onLogout(); }}
                style={{
                  width: "100%", padding: 14, border: `1px solid ${T.dimmer}`, borderRadius: 12,
                  background: "transparent", color: T.sub, fontSize: 14, fontWeight: 600, textAlign: "left",
                }}
              >
                ログアウト
              </button>
            </div>
          )}
          {!user && (
            <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
              <div style={{ fontSize: 13, color: T.dim, marginBottom: 10 }}>
                ログインするとデータがクラウドに保存され、他の端末でも利用できます
              </div>
              <button
                onClick={() => { handleClose(); localStorage.removeItem("smash-skipped-auth"); window.location.reload(); }}
                style={{
                  width: "100%", padding: 14, border: "none", borderRadius: 12,
                  background: T.inp, color: T.text, fontSize: 14, fontWeight: 600, textAlign: "left",
                }}
              >
                ログイン / アカウント作成
              </button>
            </div>
          )}

          {/* Legal links */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "16px 0" }}>
            <button
              onClick={() => { handleClose(); onOpenLegal("terms"); }}
              style={{ background: "transparent", border: "none", color: T.dim, fontSize: 12, textDecoration: "underline" }}
            >
              利用規約
            </button>
            <button
              onClick={() => { handleClose(); onOpenLegal("privacy"); }}
              style={{ background: "transparent", border: "none", color: T.dim, fontSize: 12, textDecoration: "underline" }}
            >
              プライバシーポリシー
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
