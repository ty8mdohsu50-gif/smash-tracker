import FighterIcon from "../shared/FighterIcon";
import { fighterName } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { formatTime } from "../../utils/format";

const SIZES = {
  compact: {
    rowPadding: "5px 0",
    rowGap: 6,
    badgeFs: 10,
    iconSize: 18,
    nameFs: 12,
    stageChipFs: 9,
    timeFs: 10,
    stageImgH: 22,
    stageLabelFs: 8,
    memoFs: 11,
    memoIndent: 42,
  },
  comfortable: {
    rowPadding: "6px 0",
    rowGap: 8,
    badgeFs: 10,
    iconSize: 22,
    nameFs: 13,
    stageChipFs: 9,
    timeFs: 11,
    stageImgH: 24,
    stageLabelFs: 8,
    memoFs: 12,
    memoIndent: 46,
  },
};

export default function RecentMatchList({
  matches,
  allMatches,
  editingStageIdx,
  setEditingStageIdx,
  deleteMatch,
  updateMatchStage,
  T,
  lang,
  size = "compact",
  maxItems,
  showMemo = false,
}) {
  const s = SIZES[size] || SIZES.compact;
  const list = matches.slice().reverse();
  const visible = maxItems ? list.slice(0, maxItems) : list;

  return (
    <>
      {visible.map((m) => {
        const matchIdx = allMatches.indexOf(m);
        const isEditing = editingStageIdx === matchIdx;
        const isWin = m.result === "win";
        return (
          <div
            key={`${m.date}-${m.time}-${matchIdx}`}
            style={{ padding: s.rowPadding, borderBottom: `1px solid ${T.inp}` }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: s.rowGap }}>
              <span
                style={{
                  width: 36, textAlign: "center", padding: "2px 0", borderRadius: 5,
                  fontSize: s.badgeFs, fontWeight: 800,
                  background: isWin ? T.winBg : T.loseBg,
                  color: isWin ? T.win : T.lose,
                  flexShrink: 0,
                }}
              >
                {isWin ? "WIN" : "LOSE"}
              </span>
              <FighterIcon name={m.oppChar} size={s.iconSize} />
              <span style={{ fontSize: s.nameFs, fontWeight: 600, color: T.text, flex: size === "comfortable" ? 1 : undefined }}>
                {fighterName(m.oppChar, lang)}
              </span>
              {m.stage && !isEditing && (
                <span
                  style={{
                    fontSize: s.stageChipFs, color: T.dim, background: T.inp,
                    padding: "1px 5px", borderRadius: 3, flexShrink: 0,
                  }}
                >
                  {stageName(m.stage, lang)}
                </span>
              )}
              <span style={{ fontSize: s.timeFs, color: T.dim, marginLeft: size === "compact" ? "auto" : undefined, flexShrink: 0 }}>
                {formatTime(m.time)}
              </span>
              <button
                onClick={() => setEditingStageIdx(isEditing ? null : matchIdx)}
                style={{
                  border: "none", background: T.inp, color: T.sub,
                  fontSize: 9, padding: "2px 5px", borderRadius: 4,
                  cursor: "pointer", flexShrink: 0,
                }}
              >
                {isEditing ? "\u2713" : "\uD83D\uDDFA"}
              </button>
              <button
                onClick={() => deleteMatch(matchIdx)}
                style={{
                  border: "none", background: "transparent", color: T.dimmer,
                  fontSize: 14, cursor: "pointer", padding: "2px 4px", flexShrink: 0,
                }}
              >
                {"\u00d7"}
              </button>
            </div>
            {isEditing && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 6, marginBottom: 2 }}>
                {STAGES.map((st) => {
                  const active = m.stage === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => updateMatchStage(matchIdx, active ? null : st.id)}
                      style={{
                        textAlign: "center",
                        cursor: "pointer",
                        borderRadius: 6,
                        border: active ? `2px solid ${T.accent}` : `1px solid ${T.brd}`,
                        padding: 2,
                        opacity: active ? 1 : 0.6,
                      }}
                    >
                      <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: s.stageImgH, objectFit: "cover", borderRadius: 4 }} />
                      <div style={{ fontSize: s.stageLabelFs, color: T.text, marginTop: 1 }}>{stageName(st.id, lang)}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {showMemo && m.memo && (
              <div style={{ fontSize: s.memoFs, color: T.sub, marginTop: 2, paddingLeft: s.memoIndent }}>
                {m.memo}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
