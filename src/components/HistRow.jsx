import { formatTime } from "../utils/format";
import { shortName } from "../constants/fighters";
import { useI18n } from "../i18n/index.jsx";
import FighterIcon from "./FighterIcon";

export default function HistRow({ m, onDelete, T }) {
  const { lang } = useI18n();
  return (
    <div
      style={{
        background: T.card,
        borderRadius: 16,
        padding: "10px 14px",
        marginBottom: 6,
        boxShadow: T.sh,
        border: T.brd !== "transparent" ? `1px solid ${T.brd}` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 40,
            textAlign: "center",
            padding: "3px 0",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 800,
            background: m.result === "win" ? T.winBg : T.loseBg,
            color: m.result === "win" ? T.win : T.lose,
            flexShrink: 0,
          }}
        >
          {m.result === "win" ? "WIN" : "LOSE"}
        </span>
        <FighterIcon name={m.myChar} size={26} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.text,
            width: 56,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {shortName(m.myChar, lang)}
        </span>
        <span style={{ fontSize: 11, color: T.dim, flexShrink: 0 }}>vs</span>
        <FighterIcon name={m.oppChar} size={26} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: T.text,
            width: 56,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {shortName(m.oppChar, lang)}
        </span>
        <span style={{ fontSize: 10, color: T.dim, flexShrink: 0, marginLeft: "auto" }}>
          {formatTime(m.time)}
        </span>
        {onDelete && (
          <button
            onClick={() => { if (window.confirm("この対戦記録を削除しますか？")) onDelete(); }}
            style={{
              border: "none",
              background: "transparent",
              color: T.dimmer,
              fontSize: 16,
              cursor: "pointer",
              padding: "4px",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>
      {m.memo && (
        <div style={{ fontSize: 11, color: T.sub, marginTop: 3, paddingLeft: 46 }}>
          {m.memo}
        </div>
      )}
    </div>
  );
}
