import { forwardRef } from "react";
import KeyHint from "../shared/KeyHint";
import { STAGES, stageImg } from "../../constants/stages";
import { useI18n } from "../../i18n/index.jsx";
import { getCardStyle } from "./battleStyles";

const StageSelector = forwardRef(function StageSelector(
  { selectedStage, onSelect, showHints = false, suppressPointerFocus, T, marginTop, marginBottom },
  ref,
) {
  const { t, lang } = useI18n();
  const cd = getCardStyle(T);

  return (
    <div
      ref={ref}
      style={{
        ...cd,
        padding: "10px 14px",
        marginTop: marginTop ?? undefined,
        marginBottom: marginBottom ?? 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 13 }}>{"\uD83D\uDDFA\uFE0F"}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>{t("stages.selectStage")}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {STAGES.map((s, stageIdx) => {
          const active = selectedStage === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onPointerDown={suppressPointerFocus}
              onClick={() => onSelect(active ? null : s.id)}
              style={{
                border: `2px solid ${active ? T.accent : T.brd}`,
                borderRadius: 8,
                padding: 0,
                background: "none",
                overflow: "hidden",
                cursor: "pointer",
                opacity: active ? 1 : 0.7,
                transition: "all .15s ease",
                boxShadow: active ? T.accentGlow : "none",
              }}
            >
              <img
                src={stageImg(s.id)}
                alt={s.jp}
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
              />
              <div
                style={{
                  fontSize: 9,
                  fontWeight: active ? 700 : 500,
                  color: active ? T.accent : T.sub,
                  padding: "3px 4px",
                  textAlign: "center",
                  background: T.inp,
                  lineHeight: 1.2,
                }}
              >
                {lang === "ja" ? s.jp : s.en}
              </div>
              {showHints && <KeyHint keyLabel={"Shift+" + String(stageIdx + 1)} T={T} />}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default StageSelector;
