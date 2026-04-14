export default function KeyHint({ keyLabel, T }) {
  return (
    <span aria-hidden="true" style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 18,
      height: 18,
      padding: "0 5px",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      fontFamily: "'Chakra Petch', monospace",
      color: T.dim,
      background: T.inp,
      border: `1px solid ${T.brd}`,
      lineHeight: 1,
      opacity: 0.6,
      marginLeft: 6,
      flexShrink: 0,
      letterSpacing: 0,
      boxShadow: `0 1px 0 ${T.brd}`,
    }}>
      {keyLabel}
    </span>
  );
}
