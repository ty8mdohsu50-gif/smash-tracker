import { useI18n } from "../../i18n/index.jsx";

const STYLES = {
  chip: {
    width: 36,
    textAlign: "center",
    padding: "2px 0",
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
  },
  inline: {
    minWidth: 32,
    fontSize: 11,
    fontWeight: 700,
    textAlign: "left",
  },
  hero: {
    display: "inline-block",
    padding: "6px 24px",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 800,
  },
};

export default function ResultBadge({ result, size = "chip", T, style: extraStyle }) {
  const { t } = useI18n();
  const isWin = result === "win";
  const base = STYLES[size] || STYLES.chip;
  const filled = size !== "inline";

  return (
    <span
      style={{
        ...base,
        background: filled ? (isWin ? T.winBg : T.loseBg) : "transparent",
        color: isWin ? T.win : T.lose,
        flexShrink: 0,
        fontFamily: "'Chakra Petch', sans-serif",
        letterSpacing: 0.3,
        ...extraStyle,
      }}
    >
      {isWin ? t("common.win") : t("common.lose")}
    </span>
  );
}
