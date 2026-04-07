import { useI18n } from "../i18n/index.jsx";

export default function AboutPage({ T, onClose, onOpenLegal }) {
  const { t } = useI18n();

  const section = (title, children) => (
    <div
      style={{
        marginBottom: 20,
        padding: "16px 18px",
        background: T.inp,
        borderRadius: 12,
        border: `1px solid ${T.brd}`,
      }}
    >
      {title && (
        <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 10 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );

  const text = (content) => (
    <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8 }}>{content}</div>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,.55)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px", animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card, borderRadius: 16, width: "100%", maxWidth: 640,
          maxHeight: "88vh", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)", animation: "fadeUp .2s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.brd}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src="/icon.png" alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>SMASH TRACKER</div>
                <div style={{ fontSize: 11, color: T.dim }}>v1.0.0</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.brd}`,
                background: T.inp, color: T.sub, fontSize: 18, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              x
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px 28px", overflowY: "auto", flex: 1 }}>

          {section(null,
            text(t("about.description"))
          )}

          {section(t("about.unofficial"),
            text(t("about.unofficialDesc"))
          )}

          {section(t("about.howToUse"), (
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 2 }}>
              <div style={{ fontWeight: 600, color: T.text, marginBottom: 4 }}>{t("about.howStep1Title")}</div>
              {t("about.howStep1Desc")}
              <div style={{ fontWeight: 600, color: T.text, marginTop: 12, marginBottom: 4 }}>{t("about.howStep2Title")}</div>
              {t("about.howStep2Desc")}
              <div style={{ fontWeight: 600, color: T.text, marginTop: 12, marginBottom: 4 }}>{t("about.howStep3Title")}</div>
              {t("about.howStep3Desc")}
              <div style={{ fontWeight: 600, color: T.text, marginTop: 12, marginBottom: 4 }}>{t("about.howStep4Title")}</div>
              {t("about.howStep4Desc")}
            </div>
          ))}

          {section(t("about.features"), (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {t("about.featureList").map((item, i) => (
                <li key={i} style={{ fontSize: 13, color: T.sub, lineHeight: 1.8 }}>
                  {item}
                </li>
              ))}
            </ul>
          ))}

          {section(t("about.legalSection"), (
            <>
              <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8, marginBottom: 12 }}>
                {t("about.legalDesc")}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { onClose(); if (onOpenLegal) onOpenLegal("terms"); }}
                  style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.brd}`, background: T.card, color: T.accent, fontSize: 13, fontWeight: 600 }}
                >
                  {t("about.terms")}
                </button>
                <button
                  onClick={() => { onClose(); if (onOpenLegal) onOpenLegal("privacy"); }}
                  style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.brd}`, background: T.card, color: T.accent, fontSize: 13, fontWeight: 600 }}
                >
                  {t("about.privacy")}
                </button>
              </div>
            </>
          ))}

          {section(t("about.contactSection"), (
            <>
              <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8, marginBottom: 10 }}>
                {t("about.contactDesc")}
              </div>
              <a
                href="https://forms.gle/KtoWRKo1ciJNd7eS9"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block", padding: "8px 20px", borderRadius: 8,
                  background: T.accentSoft, color: T.accent, fontSize: 13, fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                {t("about.contactForm")}
              </a>
            </>
          ))}

        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.brd}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontSize: 14, fontWeight: 700 }}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
