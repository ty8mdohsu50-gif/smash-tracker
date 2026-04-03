import { useState } from "react";
import { csvDownload } from "../utils/storage";
import { THEME_KEYS, getThemeLabel, getTheme } from "../styles/theme";

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

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        padding: "60px 12px 0 0",
        animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card,
          borderRadius: 16,
          padding: 20,
          width: 320,
          boxShadow: "0 16px 48px rgba(0,0,0,.3)",
          animation: "fadeUp .2s ease",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 16 }}
        >
          設定
        </div>

        {/* Dark mode toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: `1px solid ${T.inp}`,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
            ダークモード
          </span>
          <button
            onClick={() => onSave({ ...data, dark: !data.dark })}
            style={{
              width: 50,
              height: 28,
              borderRadius: 14,
              border: "none",
              background: data.dark ? T.accent : "#E5E5EA",
              position: "relative",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                background: "#fff",
                position: "absolute",
                top: 2,
                left: data.dark ? 24 : 2,
                transition: "left .2s",
                boxShadow: "0 1px 3px rgba(0,0,0,.2)",
              }}
            />
          </button>
        </div>

        {/* Theme color picker */}
        <div style={{ padding: "14px 0", borderBottom: `1px solid ${T.inp}` }}>
          <div
            style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 12 }}
          >
            テーマカラー
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 8,
            }}
          >
            {THEME_KEYS.map((key) => {
              const active = currentColor === key;
              const swatchColor = SWATCH_COLORS[key];
              const isLight = key === "white";
              return (
                <button
                  key={key}
                  onClick={() => setThemeColor(key)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 4px",
                    borderRadius: 12,
                    border: active
                      ? `2px solid ${T.accent}`
                      : `1px solid ${T.inp}`,
                    background: active ? T.accentSoft : "transparent",
                    transition: "all .15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: swatchColor,
                      border: isLight ? `2px solid ${T.dimmer}` : "none",
                      boxShadow: active
                        ? `0 0 0 2px ${T.card}, 0 0 0 4px ${swatchColor}`
                        : "none",
                      transition: "box-shadow .15s ease",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: active ? 700 : 500,
                      color: active ? T.accent : T.dim,
                      lineHeight: 1,
                    }}
                  >
                    {getThemeLabel(key)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Goals */}
        <div style={{ padding: "14px 0", borderBottom: `1px solid ${T.inp}` }}>
          <div
            style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 10 }}
          >
            今日の目標
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 13, color: T.sub }}>対戦数</span>
            <input
              type="number"
              value={gGames}
              onChange={(e) => setGG(e.target.value)}
              onBlur={saveGoals}
              placeholder="10"
              style={{
                flex: 1,
                padding: "8px 10px",
                background: T.inp,
                border: "none",
                borderRadius: 8,
                color: T.text,
                fontSize: 14,
                outline: "none",
              }}
            />
            <span style={{ fontSize: 13, color: T.sub }}>戦</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: T.sub }}>勝率</span>
            <input
              type="number"
              value={gWR}
              onChange={(e) => setGWR(e.target.value)}
              onBlur={saveGoals}
              placeholder="60"
              style={{
                flex: 1,
                padding: "8px 10px",
                background: T.inp,
                border: "none",
                borderRadius: 8,
                color: T.text,
                fontSize: 14,
                outline: "none",
              }}
            />
            <span style={{ fontSize: 13, color: T.sub }}>%</span>
          </div>
        </div>

        {/* CSV / Reset */}
        <div style={{ paddingTop: 14 }}>
          <button
            onClick={() => csvDownload(data)}
            style={{
              width: "100%",
              padding: 14,
              border: "none",
              borderRadius: 12,
              background: T.inp,
              color: T.text,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 8,
              textAlign: "left",
            }}
          >
            CSVダウンロード
          </button>
          <div
            style={{ fontSize: 11, color: T.dim, marginBottom: 14, paddingLeft: 4 }}
          >
            {data.matches.length
              ? `戦績${data.matches.length}件`
              : "データなし"}
          </div>

          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              style={{
                width: "100%",
                padding: 14,
                border: "none",
                borderRadius: 12,
                background: "rgba(220,38,38,.1)",
                color: "#dc2626",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left",
              }}
            >
              全データリセット
            </button>
          )}

          {step === 1 && (
            <div
              style={{
                background: "rgba(220,38,38,.1)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#dc2626",
                  marginBottom: 8,
                }}
              >
                全データを削除しますか？
              </div>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 12 }}>
                CSVダウンロードを先にどうぞ
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setStep(0)}
                  style={{
                    flex: 1,
                    padding: 10,
                    border: `1px solid ${T.dimmer}`,
                    borderRadius: 10,
                    background: T.card,
                    color: T.text,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  やめる
                </button>
                <button
                  onClick={() => {
                    onSave({
                      matches: [],
                      settings: data.settings,
                      daily: {},
                      goals: data.goals || {},
                      dark: data.dark,
                      themeColor: data.themeColor,
                    });
                    setStep(0);
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    padding: 10,
                    border: "none",
                    borderRadius: 10,
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
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
          <div style={{ padding: "14px 0", borderTop: `1px solid ${T.inp}` }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 8 }}>
              アカウント
            </div>
            <div style={{ fontSize: 12, color: T.dim, marginBottom: 10, wordBreak: "break-all" }}>
              {user.email}
            </div>
            <button
              onClick={() => { handleClose(); onLogout(); }}
              style={{
                width: "100%",
                padding: 12,
                border: `1px solid ${T.dimmer}`,
                borderRadius: 12,
                background: "transparent",
                color: T.sub,
                fontSize: 13,
                fontWeight: 600,
                textAlign: "left",
              }}
            >
              ログアウト
            </button>
          </div>
        )}
        {!user && (
          <div style={{ padding: "14px 0", borderTop: `1px solid ${T.inp}` }}>
            <div style={{ fontSize: 12, color: T.dim, marginBottom: 8 }}>
              ログインするとデータがクラウドに保存され、他の端末でも利用できます
            </div>
            <button
              onClick={() => {
                handleClose();
                localStorage.removeItem("smash-skipped-auth");
                window.location.reload();
              }}
              style={{
                width: "100%",
                padding: 12,
                border: "none",
                borderRadius: 12,
                background: T.inp,
                color: T.text,
                fontSize: 13,
                fontWeight: 600,
                textAlign: "left",
              }}
            >
              ログイン / アカウント作成
            </button>
          </div>
        )}

        {/* Legal links */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            padding: "14px 0 0",
            marginTop: 14,
            borderTop: `1px solid ${T.inp}`,
          }}
        >
          <button
            onClick={() => { handleClose(); onOpenLegal("terms"); }}
            style={{
              background: "transparent",
              border: "none",
              color: T.dim,
              fontSize: 11,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            利用規約
          </button>
          <button
            onClick={() => { handleClose(); onOpenLegal("privacy"); }}
            style={{
              background: "transparent",
              border: "none",
              color: T.dim,
              fontSize: 11,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            プライバシーポリシー
          </button>
        </div>

        <button
          onClick={handleClose}
          style={{
            width: "100%",
            padding: 12,
            border: "none",
            background: "transparent",
            color: T.dim,
            fontSize: 13,
            marginTop: 12,
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
