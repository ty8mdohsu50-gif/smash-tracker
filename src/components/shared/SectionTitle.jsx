// Canonical section heading inside cards and analysis panels.
// Replaces the half-dozen variations of "div with bold sub-color text
// and 8px margin-bottom" scattered across screens.
//
// Variants:
//   - "default" : 12 / 700 / T.sub  — for in-card labels
//   - "large"   : 14 / 800 / T.text — for area headers like 「分析」
//   - "small"   : 11 / 700 / T.dim  — for tertiary group labels

const VARIANTS = {
  default: { fontSize: 12, fontWeight: 700, color: "sub", marginBottom: 10 },
  large: { fontSize: 14, fontWeight: 800, color: "text", marginBottom: 8 },
  small: { fontSize: 11, fontWeight: 700, color: "dim", marginBottom: 6 },
};

export default function SectionTitle({
  children,
  variant = "default",
  T,
  right,
  style: extraStyle,
}) {
  const v = VARIANTS[variant] || VARIANTS.default;
  const titleStyle = {
    fontSize: v.fontSize,
    fontWeight: v.fontWeight,
    color: T[v.color],
    letterSpacing: 0.3,
  };

  // When a `right` slot is provided, render the title and the slot
  // on the same row with space-between. Otherwise render a plain
  // block-level header.
  if (right) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: v.marginBottom,
          ...extraStyle,
        }}
      >
        <span style={titleStyle}>{children}</span>
        {right}
      </div>
    );
  }

  return (
    <div
      style={{
        ...titleStyle,
        marginBottom: v.marginBottom,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}
