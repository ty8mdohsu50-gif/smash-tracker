import { Z_CONFIRM_DIALOG } from "../../constants/zIndex";
import { useEscapeKey } from "../../hooks/useEscapeKey";

// Generic yes/no confirm. Pass destructive=true (default) to style
// the confirm button with the lose gradient — appropriate for
// delete / reset / "lose unsaved memo" prompts. Pass destructive=false
// for neutral confirmations like "change language to English?".
export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  T,
  confirmLabel,
  cancelLabel,
  destructive = true,
}) {
  useEscapeKey(onCancel, true);
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: T.modalScrim, zIndex: Z_CONFIRM_DIALOG,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeIn .15s ease",
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card, borderRadius: 20, padding: "28px 24px",
          width: "100%", maxWidth: 360,
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          animation: "fadeUp .2s ease",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 20, lineHeight: 1.6 }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, minHeight: 44, padding: "12px 0", borderRadius: 12,
              border: `1px solid ${T.brd}`, background: T.inp,
              color: T.text, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, minHeight: 44, padding: "12px 0", borderRadius: 12,
              border: "none",
              background: destructive ? T.loseGrad : T.accentGrad,
              boxShadow: destructive ? T.loseGlow : T.accentGlow,
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
