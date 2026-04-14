import { ChevronLeft, ChevronRight } from "lucide-react";
import FighterIcon from "../shared/FighterIcon";
import ResultBadge from "../shared/ResultBadge";
import { shortName } from "../../constants/fighters";
import { STAGES, stageName, stageImg } from "../../constants/stages";
import { useI18n } from "../../i18n/index.jsx";
import { today, formatDate, formatTime, percentStr, barColor } from "../../utils/format";

const dotColor = (T, r) => (r >= 0.6 ? T.win : r <= 0.4 ? T.lose : T.mid);

export default function OpponentCalendar({
  freeDailyMap,
  calMonth,
  setCalMonth,
  calDate,
  setCalDate,
  editingStageMatch,
  setEditingStageMatch,
  deleteFreeMatch,
  updateFreeMatchStage,
  T,
}) {
  const { t, lang } = useI18n();

  const [yStr, mStr] = calMonth.split("-");
  const year = Number(yStr);
  const mo = parseInt(mStr) - 1;
  const monthLabel = lang === "ja"
    ? `${year}${mo + 1}`
    : `${new Date(year, mo).toLocaleString("en", { month: "long" })} ${year}`;
  const firstDay = new Date(year, mo, 1).getDay();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7;
  const todayStr = today();
  const weekDays = t("heatmap.weekDays");
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthDays = Object.entries(freeDailyMap).filter(([d]) => d.startsWith(calMonth));
  const mW = monthDays.reduce((a, [, d]) => a + d.w, 0);
  const mL = monthDays.reduce((a, [, d]) => a + d.l, 0);
  const mT = mW + mL;

  const selData = calDate ? freeDailyMap[calDate] : null;

  const goPrev = () => {
    const d = new Date(year, mo - 1, 1);
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setCalDate(null);
  };
  const goNext = () => {
    const d = new Date(year, mo + 1, 1);
    setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setCalDate(null);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <button onClick={goPrev} style={{ border: "none", background: "transparent", color: T.text, padding: 4, cursor: "pointer" }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{monthLabel}</span>
          {calMonth !== currentMonth && (
            <button
              onClick={() => { setCalMonth(currentMonth); setCalDate(null); }}
              style={{ border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 6, cursor: "pointer" }}
            >
              {t("analysis.thisMonth")}
            </button>
          )}
        </div>
        <button onClick={goNext} style={{ border: "none", background: "transparent", color: T.text, padding: 4, cursor: "pointer" }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {mT > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 2px 4px", fontSize: 11, color: T.dim }}>
          <span>{mT}{t("analysis.battles")}</span>
          <span style={{ fontWeight: 800, fontSize: 12 }}>
            <span style={{ color: T.win }}>{mW}</span>
            <span style={{ color: T.dimmer }}> : </span>
            <span style={{ color: T.lose }}>{mL}</span>
          </span>
          <span style={{ fontWeight: 700, fontSize: 11, color: barColor(mT ? mW / mT : 0) }}>{percentStr(mW, mT)}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, textAlign: "center" }}>
        {weekDays.map((d, i) => (
          <div key={`h${i}`} style={{ fontSize: 10, fontWeight: 600, color: T.dim, padding: "2px 0" }}>{d}</div>
        ))}
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${yStr}-${mStr}-${String(day).padStart(2, "0")}`;
          const dd = freeDailyMap[dateStr];
          const isFuture = dateStr > todayStr;
          const isSel = calDate === dateStr;
          const isToday = dateStr === todayStr;
          const r = dd ? dd.w / (dd.w + dd.l) : 0;
          return (
            <div
              key={day}
              onClick={() => { if (dd) setCalDate(isSel ? null : dateStr); }}
              style={{
                padding: "4px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                cursor: dd ? "pointer" : "default",
                background: isSel ? T.accentSoft : "transparent",
                border: isSel ? `2px solid ${T.accent}` : isToday ? `1px solid ${T.dimmer}` : "1px solid transparent",
                opacity: isFuture ? 0.3 : 1,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isSel ? T.accent : isToday ? T.text : T.sub, lineHeight: 1 }}>{day}</span>
              {dd && <div style={{ width: 5, height: 5, borderRadius: 3, background: dotColor(T, r), marginTop: 2 }} />}
            </div>
          );
        })}
      </div>

      {selData && (
        <div style={{ marginTop: 8, borderTop: `1px solid ${T.inp}`, paddingTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{formatDate(calDate)}</span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>
              <span style={{ color: T.win }}>{selData.w}W</span>{" "}
              <span style={{ color: T.lose }}>{selData.l}L</span>{" "}
              <span style={{ color: barColor(selData.w / (selData.w + selData.l)) }}>{percentStr(selData.w, selData.w + selData.l)}</span>
            </span>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {selData.matches.slice().reverse().map((m, i) => {
              const isEditing = editingStageMatch && editingStageMatch.time === m.time && editingStageMatch.date === m.date;
              return (
                <div key={i} style={{ paddingBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ResultBadge result={m.result} size="inline" T={T} style={{ minWidth: 32 }} />
                    <FighterIcon name={m.myChar} size={18} />
                    <span style={{ fontSize: 11, color: T.sub }}>{shortName(m.myChar, lang)}</span>
                    <span style={{ fontSize: 10, color: T.dim }}>vs</span>
                    <FighterIcon name={m.oppChar} size={18} />
                    <span style={{ fontSize: 11, color: T.sub, flex: 1 }}>{shortName(m.oppChar, lang)}</span>
                    {m.stage && !isEditing && (
                      <span style={{ fontSize: 9, color: T.dim, background: T.inp, padding: "1px 4px", borderRadius: 3, flexShrink: 0 }}>{stageName(m.stage, lang)}</span>
                    )}
                    <span style={{ fontSize: 10, color: T.dim }}>{formatTime(m.time)}</span>
                    <button
                      onClick={() => setEditingStageMatch(isEditing ? null : m)}
                      style={{ border: "none", background: T.inp, color: T.sub, fontSize: 9, padding: "1px 4px", borderRadius: 3, cursor: "pointer", flexShrink: 0 }}
                    >
                      {isEditing ? "\u2713" : "\uD83D\uDDFA"}
                    </button>
                    <button
                      onClick={() => deleteFreeMatch(m)}
                      style={{ border: "none", background: "transparent", color: T.dimmer, fontSize: 14, cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </div>
                  {isEditing && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 3, marginBottom: 2 }}>
                      {STAGES.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => updateFreeMatchStage(m, m.stage === st.id ? null : st.id)}
                          style={{
                            textAlign: "center",
                            cursor: "pointer",
                            borderRadius: 6,
                            border: m.stage === st.id ? `2px solid ${T.accent}` : `1px solid ${T.brd}`,
                            padding: 2,
                            opacity: m.stage === st.id ? 1 : 0.6,
                          }}
                        >
                          <img src={stageImg(st.id)} alt="" style={{ width: "100%", height: 22, objectFit: "cover", borderRadius: 4 }} />
                          <div style={{ fontSize: 8, color: T.text, marginTop: 1 }}>{stageName(st.id, lang)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
