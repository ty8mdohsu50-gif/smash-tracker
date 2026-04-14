import { useMemo } from "react";
import Chart from "../shared/Chart";
import SectionTitle from "../shared/SectionTitle";
import { useI18n } from "../../i18n/index.jsx";
import { percentStr, barColor } from "../../utils/format";

// Returns the ISO date string (YYYY-MM-DD) of the Monday on or before
// the given date. Used to bucket matches into weeks.
function startOfWeek(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function WeeklyProgress({ matches, T }) {
  const { t, lang } = useI18n();

  const weeks = useMemo(() => {
    const buckets = new Map();
    for (const m of matches) {
      const wk = startOfWeek(m.date);
      if (!buckets.has(wk)) buckets.set(wk, { weekStart: wk, w: 0, l: 0 });
      const b = buckets.get(wk);
      m.result === "win" ? b.w++ : b.l++;
    }
    return Array.from(buckets.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }, [matches]);

  // Need at least 2 distinct weeks to draw a meaningful progression
  if (weeks.length < 2) return null;

  const points = weeks.map((wk) => {
    const total = wk.w + wk.l;
    const value = total > 0 ? Math.round((wk.w / total) * 100) : 0;
    const [, m, d] = wk.weekStart.split("-");
    return { date: `${Number(m)}/${Number(d)}`, value, w: wk.w, l: wk.l, total };
  });

  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  const firstRate = first.w + first.l > 0 ? first.w / (first.w + first.l) : 0;
  const lastRate = last.w + last.l > 0 ? last.w / (last.w + last.l) : 0;
  const delta = Math.round((lastRate - firstRate) * 100);

  return (
    <div>
      <SectionTitle
        T={T}
        right={
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: delta >= 0 ? T.win : T.lose,
              fontFamily: "'Chakra Petch', sans-serif",
            }}
          >
            {delta >= 0 ? "+" : ""}{delta}%
          </span>
        }
      >
        {t("free.weeklyProgress")}
      </SectionTitle>
      <Chart
        points={points}
        T={T}
        yMin={0}
        yMax={100}
        yStep={25}
        yFormat={(v) => `${Math.round(v)}%`}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: T.dim, fontFamily: "'Chakra Petch', sans-serif" }}>
        <span>
          {points[0].date}: <span style={{ color: barColor(firstRate), fontWeight: 700 }}>{percentStr(first.w, first.w + first.l)}</span>
          <span style={{ marginLeft: 4 }}>({first.w}-{first.l})</span>
        </span>
        <span>
          {points[points.length - 1].date}: <span style={{ color: barColor(lastRate), fontWeight: 700 }}>{percentStr(last.w, last.w + last.l)}</span>
          <span style={{ marginLeft: 4 }}>({last.w}-{last.l})</span>
        </span>
      </div>
    </div>
  );
}
