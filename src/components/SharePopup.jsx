import { getShareLinks } from "../utils/share";
import { useI18n } from "../i18n/index.jsx";

export default function SharePopup({ text, onClose, T }) {
  const { t } = useI18n();
  const links = getShareLinks(text);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,.5)", zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card, borderRadius: 16, padding: "24px 20px",
          width: "100%", maxWidth: 360,
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          animation: "fadeUp .2s ease",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 16, textAlign: "center" }}>
          {t("common.share") || "Share"}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <a
            href={links.x}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, padding: "14px 0", borderRadius: 12,
              background: "#000", color: "#fff",
              fontSize: 14, fontWeight: 700, textAlign: "center",
              textDecoration: "none", display: "block",
            }}
          >
            X (Twitter)
          </a>
          <a
            href={links.line}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, padding: "14px 0", borderRadius: 12,
              background: "#06C755", color: "#fff",
              fontSize: 14, fontWeight: 700, textAlign: "center",
              textDecoration: "none", display: "block",
            }}
          >
            LINE
          </a>
        </div>

        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              onClose();
            } catch (_) { /* */ }
          }}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 12,
            border: `1px solid ${T.brd}`, background: T.inp,
            color: T.text, fontSize: 13, fontWeight: 600,
            marginBottom: 10,
          }}
        >
          {t("battle.copyText") || "Copy text"}
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%", padding: 10, border: "none",
            background: "transparent", color: T.dim, fontSize: 13,
          }}
        >
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
