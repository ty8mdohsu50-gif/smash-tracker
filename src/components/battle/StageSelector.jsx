import { forwardRef, useMemo } from "react";
import KeyHint from "../shared/KeyHint";
import { STAGES, stageImg } from "../../constants/stages";
import { useI18n } from "../../i18n/index.jsx";
import { percentStr, barColor } from "../../utils/format";
import { getCardStyle } from "./battleStyles";

// Build a per-stage W/L map from a list of matches scoped to the
// current matchup. Stages with zero matches are still present in
// the map (counts 0/0) so callers can render the neutral state.
function computeStageStats(matches) {
  const map = {};
  for (const st of STAGES) map[st.id] = { w: 0, l: 0 };
  for (const m of matches || []) {
    if (!m.stage || !map[m.stage]) continue;
    m.result === "win" ? map[m.stage].w++ : map[m.stage].l++;
  }
  return map;
}

const StageSelector = forwardRef(function StageSelector(
  {
    selectedStage,
    onSelect,
    showHints = false,
    suppressPointerFocus,
    matchupMatches,
    historyHint,
    bannedStageIds,
    T,
    marginTop,
    marginBottom,
  },
  ref,
) {
  const { t, lang } = useI18n();
  const cd = getCardStyle(T);

  const stats = useMemo(() => computeStageStats(matchupMatches), [matchupMatches]);
  const hasContext = Array.isArray(matchupMatches);
  const totalInContext = hasContext
    ? Object.values(stats).reduce((acc, s) => acc + s.w + s.l, 0)
    : 0;
  const banSet = useMemo(
    () => new Set(Array.isArray(bannedStageIds) ? bannedStageIds : []),
    [bannedStageIds],
  );

  return (
    <div
      ref={ref}
      style={{
        ...cd,
        padding: "12px 16px",
        marginTop: marginTop ?? undefined,
        marginBottom: marginBottom ?? 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13 }}>{"\uD83D\uDDFA\uFE0F"}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.sub, letterSpacing: 0.3 }}>
            {t("stages.selectStage")}
          </span>
        </div>
        {hasContext && totalInContext > 0 && (
          <span style={{ fontSize: 9, fontWeight: 700, color: T.dim, letterSpacing: 0.3 }}>
            {historyHint ?? t("stages.matchupHistoryHint", { n: totalInContext })}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {STAGES.map((s, stageIdx) => {
          const active = selectedStage === s.id;
          const banned = banSet.has(s.id);
          const cell = stats[s.id];
          const total = cell.w + cell.l;
          const rate = total > 0 ? cell.w / total : 0;
          const dataColor = total > 0 ? barColor(rate) : null;

          // Border priority: active accent > ban red > data color
          // (only when matchup context provided) > neutral border.
          const borderColor = active
            ? T.accent
            : banned
              ? T.lose
              : hasContext && dataColor
                ? dataColor
                : T.brd;
          const borderWidth = active || banned || (hasContext && dataColor) ? 2 : 1.5;

          return (
            <button
              key={s.id}
              type="button"
              onPointerDown={suppressPointerFocus}
              onClick={() => onSelect(active ? null : s.id)}
              style={{
                border: `${borderWidth}px solid ${borderColor}`,
                borderRadius: 8,
                padding: 0,
                background: "none",
                overflow: "hidden",
                cursor: "pointer",
                opacity: active ? 1 : (hasContext && total === 0 ? 0.55 : 0.85),
                transition: "all .15s ease",
                boxShadow: active ? T.accentGlow : "none",
                position: "relative",
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={stageImg(s.id)}
                  alt={s.jp}
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    objectFit: "cover",
                    display: "block",
                    filter: hasContext && total === 0 ? "grayscale(60%)" : "none",
                  }}
                />
                {banned && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(255,69,58,.28)",
                        pointerEvents: "none",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 3,
                        left: 3,
                        background: "rgba(0,0,0,0.7)",
                        color: T.lose,
                        fontSize: 11,
                        fontWeight: 900,
                        lineHeight: 1,
                        width: 16,
                        height: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 4,
                      }}
                    >
                      ✕
                    </div>
                  </>
                )}
                {hasContext && total > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      right: 3,
                      background: "rgba(0,0,0,0.7)",
                      color: dataColor,
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontFamily: "'Chakra Petch', sans-serif",
                    }}
                  >
                    {percentStr(cell.w, total)}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: active ? 700 : 500,
                  color: active ? T.accent : T.sub,
                  padding: "3px 4px 1px",
                  textAlign: "center",
                  background: T.inp,
                  lineHeight: 1.2,
                }}
              >
                {lang === "ja" ? s.jp : s.en}
              </div>
              {hasContext && (
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textAlign: "center",
                    background: T.inp,
                    padding: "0 4px 3px",
                    fontFamily: "'Chakra Petch', sans-serif",
                  }}
                >
                  {total > 0 ? (
                    <>
                      <span style={{ color: T.win }}>{cell.w}</span>
                      <span style={{ color: T.dimmer, margin: "0 2px" }}>:</span>
                      <span style={{ color: T.lose }}>{cell.l}</span>
                    </>
                  ) : (
                    <span style={{ color: T.dim, fontSize: 8 }}>—</span>
                  )}
                </div>
              )}
              {showHints && <KeyHint keyLabel={"Shift+" + String(stageIdx + 1)} T={T} />}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default StageSelector;
