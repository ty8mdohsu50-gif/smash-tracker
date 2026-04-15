import { useMemo } from "react";
import SectionTitle from "../shared/SectionTitle";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { useI18n } from "../../i18n/index.jsx";
import { percentStr, barColor } from "../../utils/format";

export default function StageStatsGrid({ matches, T }) {
  const { t, lang } = useI18n();

  const stageStats = useMemo(() => {
    const map = {};
    for (const st of STAGES) {
      map[st.id] = { id: st.id, w: 0, l: 0 };
    }
    for (const m of matches) {
      if (!m.stage || !map[m.stage]) continue;
      m.result === "win" ? map[m.stage].w++ : map[m.stage].l++;
    }
    return STAGES.map((st) => map[st.id]);
  }, [matches]);

  const hasAny = stageStats.some((s) => s.w + s.l > 0);
  if (!hasAny) return null;

  return (
    <div>
      <SectionTitle T={T}>{t("free.stageMatrix")}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 6 }}>
        {stageStats.map((s) => {
          const total = s.w + s.l;
          const rate = total > 0 ? s.w / total : 0;
          const accent = total > 0 ? barColor(rate) : T.dimmer;
          return (
            <div
              key={s.id}
              style={{
                borderRadius: 8,
                border: `1.5px solid ${total > 0 ? accent : T.brd}`,
                overflow: "hidden",
                background: T.card,
                opacity: total > 0 ? 1 : 0.45,
                position: "relative",
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={stageImg(s.id)}
                  alt=""
                  style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block", filter: total > 0 ? "none" : "grayscale(80%)" }}
                />
                {total > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      right: 3,
                      background: "rgba(0,0,0,0.65)",
                      color: accent,
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontFamily: "'Chakra Petch', sans-serif",
                    }}
                  >
                    {percentStr(s.w, total)}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: T.text,
                  padding: "3px 4px 1px",
                  textAlign: "center",
                  background: T.inp,
                  lineHeight: 1.2,
                }}
              >
                {stageName(s.id, lang)}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textAlign: "center",
                  background: T.inp,
                  padding: "0 4px 4px",
                  fontFamily: "'Chakra Petch', sans-serif",
                }}
              >
                {total > 0 ? (
                  <>
                    <span style={{ color: T.win }}>{s.w}</span>
                    <span style={{ color: T.dimmer, margin: "0 2px" }}>:</span>
                    <span style={{ color: T.lose }}>{s.l}</span>
                  </>
                ) : (
                  <span style={{ color: T.dim, fontSize: 9 }}>{t("free.stageNoData")}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
