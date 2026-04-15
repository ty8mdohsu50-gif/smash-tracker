import { useEffect } from "react";
import { useI18n } from "../../i18n/index.jsx";
import { Z_APP_MODAL } from "../../constants/zIndex";
import CloseButton from "./CloseButton";
import OverlayBuilder from "./OverlayBuilder";

export default function OverlayBuilderModal({ T, user, onClose, onOpenHelp }) {
  const { t } = useI18n();

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

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: T.modalScrim,
        zIndex: Z_APP_MODAL,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fadeIn .15s ease",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-builder-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card,
          borderRadius: 18,
          width: "100%",
          maxWidth: 760,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.4)",
          overflow: "hidden",
          animation: "fadeUp .2s ease",
        }}
      >
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: `1px solid ${T.brd}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              id="overlay-builder-title"
              style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}
            >
              {t("broadcast.builder.title")}
            </div>
            <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>
              {t("broadcast.help.method1Title")}
            </div>
          </div>
          <CloseButton onClick={onClose} T={T} ariaLabel={t("common.close")} />
        </div>

        <div style={{ padding: "18px 24px 24px", overflowY: "auto", flex: 1 }}>
          {user ? (
            <OverlayBuilder T={T} user={user} initialAccent={T.accent} onOpenHelp={onOpenHelp} />
          ) : (
            <div
              style={{
                padding: "28px 20px",
                textAlign: "center",
                color: T.sub,
                fontSize: 13,
                lineHeight: 1.7,
                background: T.inp,
                borderRadius: 12,
                border: `1px solid ${T.brd}`,
              }}
            >
              {t("broadcast.builder.loginRequired")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
