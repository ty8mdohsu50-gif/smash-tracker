import { useEffect } from "react";
import { useI18n } from "../../i18n/index.jsx";
import { Z_APP_MODAL_NESTED } from "../../constants/zIndex";
import CloseButton from "./CloseButton";

export default function BroadcastHelpModal({ onClose, T }) {
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

  const section = { marginBottom: 22 };
  const h2 = {
    fontSize: 13, fontWeight: 800, color: T.accent, letterSpacing: 0.3,
    marginBottom: 6,
  };
  const p = { fontSize: 13, color: T.sub, lineHeight: 1.65, marginBottom: 10 };
  const olStyle = {
    margin: 0, paddingLeft: 0, listStyle: "none",
    display: "flex", flexDirection: "column", gap: 8,
  };
  const stepRow = { display: "flex", gap: 10, alignItems: "flex-start" };
  const stepNum = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 20, height: 20, borderRadius: 10, background: T.accentSoft,
    color: T.accent, fontSize: 11, fontWeight: 800, flexShrink: 0,
    fontFamily: "'Chakra Petch', monospace", marginTop: 1,
  };
  const stepText = { fontSize: 13, color: T.text, lineHeight: 1.55 };
  const note = {
    fontSize: 12, color: T.dim, padding: "8px 12px", background: T.inp,
    borderRadius: 8, marginTop: 8, lineHeight: 1.5,
    borderLeft: `3px solid ${T.accent}`,
  };
  const codeChip = {
    display: "inline-block", padding: "1px 6px", borderRadius: 4,
    background: T.inp, color: T.text, fontSize: 12,
    fontFamily: "'Chakra Petch', monospace",
  };

  const renderSteps = (steps) => (
    <ol style={olStyle}>
      {steps.map((text, i) => (
        <li key={i} style={stepRow}>
          <span style={stepNum}>{i + 1}</span>
          <span style={stepText}>{text}</span>
        </li>
      ))}
    </ol>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: Z_APP_MODAL_NESTED,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeIn .15s ease",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="broadcast-help-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card, borderRadius: 16, width: "100%", maxWidth: 560,
          maxHeight: "88vh", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)", overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 22px 14px", borderBottom: `1px solid ${T.brd}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div id="broadcast-help-modal-title" style={{ fontSize: 16, fontWeight: 800, color: T.text }}>
            {t("broadcast.help.title")}
          </div>
          <CloseButton onClick={onClose} T={T} ariaLabel={t("common.close")} />
        </div>

        <div style={{ padding: "18px 22px 24px", overflowY: "auto", flex: 1 }}>
          <p style={{ ...p, marginBottom: 18 }}>{t("broadcast.help.intro")}</p>

          <div style={section}>
            <div style={h2}>{t("broadcast.help.method1Title")}</div>
            <p style={p}>{t("broadcast.help.method1Desc")}</p>
            {renderSteps([
              t("broadcast.help.method1Step1"),
              t("broadcast.help.method1Step2"),
              t("broadcast.help.method1Step3"),
              t("broadcast.help.method1Step4"),
            ])}
            <div style={note}>{t("broadcast.help.method1Note")}</div>
          </div>

          <div style={section}>
            <div style={h2}>{t("broadcast.help.method2Title")}</div>
            <p style={p}>{t("broadcast.help.method2Desc")}</p>
            {renderSteps([
              t("broadcast.help.method2Step1"),
              t("broadcast.help.method2Step2"),
              t("broadcast.help.method2Step3"),
            ])}
          </div>

          <div style={section}>
            <div style={h2}>{t("broadcast.help.presetsTitle")}</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: T.sub, fontSize: 13, lineHeight: 1.7 }}>
              <li>{t("broadcast.help.presetPill")}</li>
              <li>{t("broadcast.help.presetCard")}</li>
              <li>{t("broadcast.help.presetBar")}</li>
            </ul>
          </div>

          <div style={section}>
            <div style={h2}>{t("broadcast.help.urlParamsTitle")}</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: T.sub, fontSize: 13, lineHeight: 1.7 }}>
              <li>
                <span style={codeChip}>layout=pill|card|bar</span>
                {" — "}
                {t("broadcast.help.urlParamLayout")}
              </li>
              <li>
                <span style={codeChip}>position=tl|tr|bl|br|top|bottom</span>
                {" — "}
                {t("broadcast.help.urlParamPosition")}
              </li>
              <li>
                <span style={codeChip}>modules=fighter,score,rate,...</span>
                {" — "}
                {t("broadcast.help.urlParamModules")}
              </li>
              <li>
                <span style={codeChip}>accent=HEX</span>
                {" — "}
                {t("broadcast.help.urlParamColor")}
              </li>
              <li>
                <span style={codeChip}>bg=0-100</span>
                {" — "}
                {t("broadcast.help.urlParamBg")}
              </li>
              <li>
                <span style={codeChip}>scale=0.6-1.8</span>
                {" — "}
                {t("broadcast.help.urlParamScale")}
              </li>
            </ul>
          </div>

          <div style={{ ...section, marginBottom: 4 }}>
            <div style={h2}>{t("broadcast.help.tipsTitle")}</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: T.sub, fontSize: 13, lineHeight: 1.7 }}>
              <li>{t("broadcast.help.tipLogin")}</li>
              <li>{t("broadcast.help.tipUpdate")}</li>
              <li>{t("broadcast.help.tipPrivacy")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
