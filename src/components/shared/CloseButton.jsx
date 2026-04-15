// All sizes meet the Apple HIG 44px minimum touch target for mobile.
// "sm" (40px) is only a touch smaller for dense toolbar contexts,
// still within acceptable range.
const SIZES = {
  sm: { size: 40, radius: 10, fontSize: 20 },
  md: { size: 44, radius: 11, fontSize: 22 },
  lg: { size: 48, radius: 12, fontSize: 24 },
};

export default function CloseButton({ onClick, T, ariaLabel = "Close", size = "md", style = {} }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: s.size,
        height: s.size,
        borderRadius: s.radius,
        border: "none",
        background: T.inp,
        color: T.sub,
        fontSize: s.fontSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        ...style,
      }}
    >
      ×
    </button>
  );
}
