export default function ConfirmDialog({ message, onConfirm, onCancel, T, confirmLabel, cancelLabel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,.5)", zIndex: 400,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card, borderRadius: 20, padding: "28px 24px",
          width: "100%", maxWidth: 320,
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          animation: "fadeUp .2s ease",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 20, lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 12,
              border: `1px solid ${T.brd}`, background: T.inp,
              color: T.text, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 12,
              border: "none", background: "linear-gradient(135deg, #F87171, #EF4444)",
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
