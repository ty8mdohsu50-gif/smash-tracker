import FighterIcon from "../../shared/FighterIcon";
import { fighterName } from "../../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../../constants/stages";
import { percentStr, barColor } from "../../../utils/format";
import { topOpponentStats } from "../../../utils/analysis";
import { analysisMatchLogTable } from "../analysisHelpers";

export default function StageDetailModal({
  stageDetailId, setStageDetailId,
  data, totalW, matchesWithIdx,
  T, isPC, t, lang,
  analysisModalBackdrop, analysisModalPanel,
}) {
  if (!stageDetailId) return null;

  const ms = data.matches.filter((m) => m.stage === stageDetailId);
  if (ms.length === 0) return null;

  const w = ms.filter((m) => m.result === "win").length;
  const l = ms.length - w;
  const rS = w / ms.length;
  const careerR = data.matches.length ? totalW / data.matches.length : 0;
  const diffPt = Math.round((rS - careerR) * 100);
  const staged = data.matches.filter((m) => m.stage);
  const stagedW = staged.filter((m) => m.result === "win").length;
  const rStaged = staged.length ? stagedW / staged.length : 0;
  const diffStaged = Math.round((rS - rStaged) * 100);
  const stageMsIdx = matchesWithIdx.filter((m) => m.stage === stageDetailId).slice().reverse();
  const topO = topOpponentStats(ms, 6);
  const stMeta = STAGES.find((s) => s.id === stageDetailId);
  const closeFs = { border: "none", background: T.inp, borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.sub, fontSize: 20, fontWeight: 700, flexShrink: 0 };

  return (
    <div role="presentation" style={analysisModalBackdrop} onClick={() => setStageDetailId(null)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-fs-stage-title"
        style={analysisModalPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ flexShrink: 0, padding: "14px 18px", borderBottom: `1px solid ${T.brd}`, display: "flex", alignItems: "center", gap: 12, background: T.card }}>
          <button type="button" aria-label={t("common.close")} onClick={() => setStageDetailId(null)} style={closeFs}>{"\u00D7"}</button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {stMeta && <img src={stageImg(stageDetailId)} alt={stageName(stageDetailId, lang)} style={{ width: isPC ? 80 : 64, height: isPC ? 44 : 36, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: `1px solid ${T.brd}` }} />}
            <div style={{ minWidth: 0 }}>
              <div id="analysis-fs-stage-title" style={{ fontSize: isPC ? 18 : 16, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", lineHeight: 1.25 }}>{stageName(stageDetailId, lang)}</div>
              <div style={{ fontSize: 12, color: T.dim, marginTop: 4, lineHeight: 1.45 }}>{t("analysis.stageDetailSubtitle")}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: isPC ? "18px 20px 24px" : "14px 14px 20px", background: T.bg }}>
          <div style={{ display: "grid", gridTemplateColumns: isPC ? "repeat(3, 1fr)" : "1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.winRate")}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: barColor(rS), fontFamily: "'Chakra Petch', sans-serif", marginTop: 4 }}>{percentStr(w, ms.length)}</div>
            </div>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.winLoss")}</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>
                <span style={{ color: T.win }}>{w}</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: T.lose }}>{l}</span>
              </div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 4 }}>{ms.length}{t("common.matches")}</div>
            </div>
            <div style={{ background: T.inp, borderRadius: 14, padding: "14px 12px", textAlign: "center", border: `1px solid ${T.brd}` }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 700 }}>{t("analysis.vsCareerWr")}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: diffPt >= 0 ? T.win : T.lose, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>{diffPt >= 0 ? "+" : ""}{diffPt}pt</div>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{t("analysis.vsStagedOnly")} {diffStaged >= 0 ? "+" : ""}{diffStaged}pt</div>
            </div>
          </div>

          <div style={{ background: T.inp, borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: `1px solid ${T.brd}` }}>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 700, marginBottom: 8 }}>{t("analysis.topOpponents")}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))", gap: 10 }}>
              {topO.map((o) => (
                <div key={o.c} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, padding: "6px 8px", borderRadius: 10, background: T.card, border: `1px solid ${T.brd}` }}>
                  <FighterIcon name={o.c} size={28} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fighterName(o.c, lang)}>{fighterName(o.c, lang)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, marginTop: 2 }}>{o.w}W {o.l}L</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, color: T.sub, marginBottom: 10, letterSpacing: "0.02em" }}>{t("analysis.matchHistory")}</div>
          {analysisMatchLogTable({ matchesRev: stageMsIdx, T, isPC, lang, t })}
        </div>
      </div>
    </div>
  );
}
