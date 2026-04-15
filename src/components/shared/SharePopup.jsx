import { useState, useEffect } from "react";
import { getShareLinks } from "../../utils/share";
import { useI18n } from "../../i18n/index.jsx";
import { useToast } from "../../contexts/ToastContext";
import { Z_SHARE_POPUP } from "../../constants/zIndex";

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const LINEIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);
const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const ShareDeviceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

export default function SharePopup({ text, onClose, T, imageBlob }) {
  const { t } = useI18n();
  const toast = useToast();
  const links = getShareLinks(text);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const [imageUrl, setImageUrl] = useState(null);
  useEffect(() => {
    if (!imageBlob) { setImageUrl(null); return; }
    const url = URL.createObjectURL(imageBlob);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageBlob]);

  const btnBase = {
    width: "100%", padding: "14px 18px", borderRadius: 12,
    fontSize: 14, fontWeight: 700, textAlign: "left",
    textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
    border: "none", cursor: "pointer",
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `smash-tracker-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const nativeShareCapable = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const nativeShare = async () => {
    if (!nativeShareCapable) return;
    try {
      await navigator.share({ text });
    } catch (_) {
      /* cancelled */
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: T.modalScrim, zIndex: Z_SHARE_POPUP,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeIn .15s ease",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-popup-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card, borderRadius: 20, padding: "24px 20px",
          width: "100%", maxWidth: 360,
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          animation: "fadeUp .2s ease",
          maxHeight: "85vh", overflowY: "auto",
        }}
      >
        <div id="share-popup-title" style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 14, textAlign: "center" }}>
          {t("common.share")}
        </div>

        {imageBlob && imageUrl && (
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              border: `1px solid ${T.brd}`,
              marginBottom: 14,
            }}
          >
            <img src={imageUrl} alt="" style={{ width: "100%", display: "block" }} />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {imageBlob && (
            <button onClick={downloadImage} style={{ ...btnBase, background: T.accent, color: "#fff" }}>
              <DownloadIcon />
              {saved ? t("battle.copied") : t("common.saveImage")}
            </button>
          )}

          {nativeShareCapable && (
            <button
              onClick={nativeShare}
              style={{ ...btnBase, background: "#5856D6", color: "#fff" }}
            >
              <ShareDeviceIcon />
              {t("common.shareText")}
            </button>
          )}

          <a href={links.x} target="_blank" rel="noopener noreferrer" style={{ ...btnBase, background: "#000", color: "#fff" }}>
            <XIcon /> X (Twitter)
          </a>

          <a href={links.line} target="_blank" rel="noopener noreferrer" style={{ ...btnBase, background: "#06C755", color: "#fff" }}>
            <LINEIcon /> LINE
          </a>

          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => { setCopied(false); onClose(); }, 800);
              } catch (_) {
                toast.error(t("common.errors.copy"));
              }
            }}
            style={{ ...btnBase, background: T.inp, color: T.text, border: `1px solid ${T.brd}` }}
          >
            <CopyIcon />
            {copied ? t("battle.copied") : t("battle.copyText")}
          </button>
        </div>

        <button
          onClick={onClose}
          style={{ width: "100%", padding: 10, border: "none", background: "transparent", color: T.dim, fontSize: 13, cursor: "pointer" }}
        >
          {t("common.close")}
        </button>
      </div>
    </div>
  );
}
