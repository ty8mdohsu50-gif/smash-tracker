import { useI18n } from "../i18n/index.jsx";

export default function AboutPage({ T, onClose }) {
  const { t } = useI18n();

  return (
    <div
      onClick={onClose}
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
        {/* Fixed header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${T.brd}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: T.text,
                letterSpacing: "-0.02em",
              }}
            >
              {t("about.title")}
            </div>
            <button
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
              aria-label={t("common.close")}
            >
              x
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ padding: "20px 24px 28px", overflowY: "auto", flex: 1 }}>
          <div
            style={{
              marginBottom: 24,
              padding: "16px 18px",
              background: T.inp,
              borderRadius: 12,
              border: `1px solid ${T.brd}`,
            }}
          >
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {t("about.description")}
            </div>
          </div>

          <div
            style={{
              marginBottom: 24,
              padding: "16px 18px",
              background: T.inp,
              borderRadius: 12,
              border: `1px solid ${T.brd}`,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 10 }}>
              {t("about.features")}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {t("about.featureList").map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: T.sub,
                    lineHeight: 1.8,
                    paddingLeft: 0,
                  }}
                >
                  {"\u30FB"}{item}
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              marginBottom: 24,
              padding: "16px 18px",
              background: T.inp,
              borderRadius: 12,
              border: `1px solid ${T.brd}`,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 10 }}>
              {t("about.developer")}
            </div>
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8 }}>
              {t("about.developerDesc")}
            </div>
          </div>

          <div
            style={{
              padding: "16px 18px",
              background: T.inp,
              borderRadius: 12,
              border: `1px solid ${T.brd}`,
            }}
          >
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8, marginBottom: 8 }}>
              {t("about.version")}: 1.0.0
            </div>
            <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.8 }}>
              {t("about.contact")}:{" "}
              <a
                href="https://forms.gle/KtoWRKo1ciJNd7eS9"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: T.accent, fontWeight: 700 }}
              >
                https://forms.gle/KtoWRKo1ciJNd7eS9
              </a>
            </div>
          </div>
        </div>

        {/* Fixed footer */}
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
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
