import { useEffect } from "react";
import { useI18n } from "../../i18n/index.jsx";
import { Z_APP_MODAL } from "../../constants/zIndex";
import CloseButton from "./CloseButton";

const SECTIONS = (t, lang) => {
  const ja = lang === "ja";
  return [
    {
      title: ja ? "セットアップ" : "Setup",
      keys: [
        { key: "Space", desc: ja ? "対戦開始" : "Start battle" },
        { key: "9", desc: ja ? "自キャラ変更" : "Change my fighter" },
        { key: "P", desc: ja ? "戦闘力にフォーカス" : "Focus GSP input" },
      ],
    },
    {
      title: ja ? "バトル" : "Battle",
      keys: [
        { key: "W", desc: ja ? "勝ち記録" : "Record win" },
        { key: "L", desc: ja ? "負け記録" : "Record lose" },
        { key: "1-5", desc: ja ? "最近の相手キャラ選択" : "Select recent opponent" },
        { key: "0", desc: ja ? "相手キャラ変更" : "Change opponent" },
        { key: "9", desc: ja ? "自キャラ変更" : "Change my fighter" },
        { key: "S", desc: ja ? "ステージ選択へスクロール" : "Scroll to stages" },
        { key: "Shift + 1-8", desc: ja ? "ステージ直接選択" : "Select stage directly" },
        { key: "E", desc: ja ? "セッション終了" : "End session" },
      ],
    },
    {
      title: ja ? "記録後" : "Post Match",
      keys: [
        { key: "N", desc: ja ? "同じ相手で続行" : "Continue same opponent" },
        { key: "C", desc: ja ? "相手キャラ変更" : "Change opponent" },
        { key: "M", desc: ja ? "メモにフォーカス" : "Focus memo" },
        { key: "Shift + 1-8", desc: ja ? "ステージ直接選択" : "Select stage directly" },
        { key: "E", desc: ja ? "セッション終了" : "End session" },
      ],
    },
    {
      title: ja ? "セッション終了" : "End Session",
      keys: [
        { key: "Enter", desc: ja ? "保存して終了" : "Save and end" },
        { key: "S", desc: ja ? "シェアして終了" : "Share and end" },
      ],
    },
    {
      title: ja ? "共通" : "Common",
      keys: [
        { key: "Esc", desc: ja ? "モーダル閉じ / 前の画面に戻る" : "Close modal / go back" },
      ],
    },
    {
      title: ja ? "フリー対戦" : "Free Battle",
      keys: [
        { key: "W", desc: ja ? "勝ち記録" : "Record win" },
        { key: "L", desc: ja ? "負け記録" : "Record lose" },
        { key: "1-5", desc: ja ? "最近の相手キャラ選択" : "Select recent opponent" },
        { key: "0", desc: ja ? "相手キャラ変更" : "Change opponent" },
        { key: "9", desc: ja ? "自キャラ変更" : "Change my fighter" },
        { key: "Shift + 1-8", desc: ja ? "ステージ直接選択" : "Select stage directly" },
        { key: "N", desc: ja ? "記録後：連戦" : "After record: rematch" },
        { key: "C", desc: ja ? "記録後：相手キャラ変更" : "After record: change opponent" },
        { key: "M", desc: ja ? "記録後：メモにフォーカス" : "After record: focus memo" },
        { key: "Esc", desc: ja ? "ピッカーを閉じる / 相手リストに戻る" : "Close picker / back to opponent list" },
      ],
    },
  ];
};

export default function ShortcutsModal({ onClose, T }) {
  const { t, lang } = useI18n();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const sections = SECTIONS(t, lang);

  const keyCap = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
    height: 24,
    padding: "0 8px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Chakra Petch', monospace",
    color: T.text,
    background: T.inp,
    border: `1px solid ${T.brd}`,
    boxShadow: `0 1px 0 ${T.brd}`,
    flexShrink: 0,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: Z_APP_MODAL,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeIn .15s ease",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card, borderRadius: 16, width: "100%", maxWidth: 520,
          maxHeight: "85vh", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)", overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${T.brd}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div id="shortcuts-modal-title" style={{ fontSize: 16, fontWeight: 800, color: T.text }}>
            {t("app.shortcutsTitle")}
          </div>
          <CloseButton onClick={onClose} T={T} ariaLabel={t("common.close")} />
        </div>

        <div style={{ padding: "16px 22px 24px", overflowY: "auto", flex: 1 }}>
          {sections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: 0.5, marginBottom: 8 }}>{sec.title}</div>
              {sec.keys.map((item) => (
                <div key={item.key + item.desc} style={{ display: "flex", alignItems: "center", gap: 12, padding: "5px 0" }}>
                  <span style={keyCap}>{item.key}</span>
                  <span style={{ fontSize: 13, color: T.sub }}>{item.desc}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ fontSize: 11, color: T.dimmer, marginTop: 8 }}>
            {t("app.shortcutsFooterNote")}
          </div>
        </div>
      </div>
    </div>
  );
}
