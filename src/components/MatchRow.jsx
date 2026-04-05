import { formatTime, formatDateLong } from "../utils/format";
import FighterIcon from "./FighterIcon";

export default function MatchRow({ m, onDelete, showTime, T }) {
  return (
    <div
      style={{
        background: T.card,
        borderRadius: 16,
        padding: "12px 16px",
        marginBottom: 6,
        boxShadow: T.sh,
        border: T.brd !== "transparent" ? `1px solid ${T.brd}` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: m.result === "win" ? T.win : T.lose,
            flexShrink: 0,
          }}
        />
        <FighterIcon name={m.myChar} size={30} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: T.text,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {m.myChar}
        </span>
        <span style={{ fontSize: 12, color: T.dim, flexShrink: 0 }}>vs</span>
        <FighterIcon name={m.oppChar} size={30} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: T.text,
            flex: 1,
            textAlign: "right",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {m.oppChar}
        </span>
        {showTime && (
          <span style={{ fontSize: 11, color: T.dim, flexShrink: 0 }}>
            {formatTime(m.time)}
          </span>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
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
      {showTime && (
        <div
          style={{ fontSize: 11, color: T.dim, marginTop: 4, paddingLeft: 16 }}
        >
          {formatDateLong(m.date)}
        </div>
      )}
      {m.memo && (
        <div
          style={{ fontSize: 11, color: T.sub, marginTop: 3, paddingLeft: 16 }}
        >
          {m.memo}
        </div>
      )}
    </div>
  );
}
