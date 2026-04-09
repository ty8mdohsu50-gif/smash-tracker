import { useEffect } from "react";
import { useI18n } from "../i18n/index.jsx";
import { TERMS_JA, TERMS_EN, PRIVACY_JA, PRIVACY_EN } from "../legal/legalDocs";

function SectionBlock({ title, content, T }) {
  return (
    <div
      style={{
        marginBottom: 24,
        padding: "16px 18px",
        background: T.inp,
        borderRadius: 12,
        border: `1px solid ${T.brd}`,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: T.accent,
          marginBottom: 10,
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: T.sub,
          lineHeight: 1.8,
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </div>
    </div>
  );
}

export default function LegalPage({ T, onClose, page }) {
  const { t, lang } = useI18n();
  const isTerms = page === "terms";
  const title = isTerms ? t("settings.terms") : t("settings.privacy");
  const sections = isTerms
    ? (lang === "en" ? TERMS_EN : TERMS_JA)
    : (lang === "en" ? PRIVACY_EN : PRIVACY_JA);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,.7)",
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
          borderRadius: 16,
          width: "100%",
          maxWidth: 640,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          animation: "fadeUp .2s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${T.brd}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: T.text,
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>
                {t("legal.effectiveDate")}
              </div>
              {lang === "en" && (
                <div style={{ fontSize: 10, color: T.dim, marginTop: 6, lineHeight: 1.5 }}>
                  {t("legal.enLegalNotice")}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: `1px solid ${T.brd}`,
                background: T.inp,
                color: T.sub,
                fontSize: 18,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginLeft: 12,
              }}
              aria-label={t("legal.close")}
            >
              ×
            </button>
          </div>
        </div>

        <div
          style={{
            padding: "20px 24px 28px",
            overflowY: "auto",
            flex: 1,
          }}
        >
          {isTerms && (
            <div
              style={{
                padding: "12px 14px",
                background: T.accentSoft,
                border: `1px solid ${T.accentBorder}`,
                borderRadius: 10,
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 4 }}>
                {t("legal.readFirst")}
              </div>
              <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
                {t("legal.readFirstDesc")}
              </div>
            </div>
          )}

          {sections.map((section) => (
            <SectionBlock
              key={section.title}
              title={section.title}
              content={section.content}
              T={T}
            />
          ))}

          {!isTerms && (
            <div
              style={{
                padding: "12px 14px",
                background: T.accentSoft,
                border: `1px solid ${T.accentBorder}`,
                borderRadius: 10,
                marginTop: 8,
              }}
            >
              <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.7 }}>
                {t("legal.privacyNote")}<a href="https://forms.gle/KtoWRKo1ciJNd7eS9" target="_blank" rel="noopener noreferrer" style={{ color: T.accent, fontWeight: 700 }}>{t("legal.privacyNoteLink")}</a>{t("legal.privacyNoteEnd")}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${T.brd}`,
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              background: T.accent,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            {t("legal.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
