import { useState } from "react";
import { formatTime, formatDateLong } from "../../utils/format";
import { shortName } from "../../constants/fighters";
import { useI18n } from "../../i18n/index.jsx";
import FighterIcon from "./FighterIcon";
import ConfirmDialog from "./ConfirmDialog";

export default function MatchRow({ m, onDelete, showTime, T }) {
  const { t, lang } = useI18n();
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        {showTime && (
          <span style={{ fontSize: 10, color: T.dim, flexShrink: 0, marginLeft: "auto" }}>
            {formatTime(m.time)}
          </span>
        )}
        {onDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label={t("history.delete")}
            style={{
              border: "none",
              background: "transparent",
              color: T.dimmer,
              fontSize: 18,
              cursor: "pointer",
              padding: "8px 10px",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>
      {showTime && (
        <div style={{ fontSize: 11, color: T.dim, marginTop: 4, paddingLeft: 46 }}>
          {formatDateLong(m.date)}
        </div>
      )}
      {m.memo && (
        <div style={{ fontSize: 11, color: T.sub, marginTop: 3, paddingLeft: 46 }}>
          {m.memo}
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          message={t("common.deleteConfirm")}
          confirmLabel={t("history.delete")}
          cancelLabel={t("settings.cancel")}
          onConfirm={() => { setConfirmDelete(false); onDelete(); }}
          onCancel={() => setConfirmDelete(false)}
          T={T}
        />
      )}
    </div>
  );
}
