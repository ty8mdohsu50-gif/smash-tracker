const SIZES = {
  sm: { size: 32, radius: 8, fontSize: 18 },
  md: { size: 36, radius: 10, fontSize: 20 },
  lg: { size: 44, radius: 12, fontSize: 20 },
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
