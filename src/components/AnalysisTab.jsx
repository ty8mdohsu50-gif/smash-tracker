import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import Chart from "./Chart";
import FighterIcon from "./FighterIcon";
import Heatmap from "./Heatmap";
import { shortName, fighterName } from "../constants/fighters";
import { useI18n } from "../i18n/index.jsx";
import {
  today,
  formatDate,
  formatDateLong,
  formatTime,
  percentStr,
  barColor,
  numFormat,
  formatHour,
  getDayPowerSummary,
} from "../utils/format";

export default function AnalysisTab({ data, T, isPC }) {
  const { t, lang } = useI18n();
  const [aMode, setAMode] = useState("myChar");
  const [period, setPeriod] = useState("all");
  const [charDetail, setCharDetail] = useState(null);
  const [charTab, setCharTab] = useState("matchup");
  const [expandedOpp, setExpandedOpp] = useState(null);

  const totalW = useMemo(() => data.matches.filter((m) => m.result === "win").length, [data]);
  const totalL = data.matches.length - totalW;

  const cd = {
    background: T.card,
    borderRadius: 16,
    padding: "16px 18px",
    marginBottom: 12,
    boxShadow: T.sh,
    border: T.brd !== "transparent" ? `1px solid ${T.brd}` : "none",
  };

  const pill = (k, l, cur, fn) => (
    <button
      key={k}
      onClick={() => fn(k)}
      style={{
        flex: 1,
        padding: isPC ? "10px 0" : "9px 0",
        borderRadius: 10,
        border: "none",
        fontSize: isPC ? 13 : 12,
        fontWeight: cur === k ? 700 : 500,
        cursor: "pointer",
        textAlign: "center",
        background: cur === k ? T.accentGrad : T.inp,
        color: cur === k ? "#fff" : T.sub,
        transition: "all .15s ease",
      }}
    >
      {l}
    </button>
  );

  const emptyMsg = (msg) => (
    <div
      style={{
        textAlign: "center",
        padding: "32px 0",
        color: T.dim,
        fontSize: 13,
      }}
    >
      {msg}
    </div>
  );

  const mCS = useMemo(() => {
    const s = {};
    data.matches.forEach((m) => {
      if (!s[m.myChar]) s[m.myChar] = { w: 0, l: 0 };
      m.result === "win" ? s[m.myChar].w++ : s[m.myChar].l++;
    });
    return Object.entries(s)
      .map(([c, v]) => ({ c, w: v.w, l: v.l, t: v.w + v.l }))
      .sort((a, b) => b.t - a.t);
  }, [data]);

  const oCS = useMemo(() => {
    const s = {};
    data.matches.forEach((m) => {
      if (!s[m.oppChar]) s[m.oppChar] = { w: 0, l: 0 };
      m.result === "win" ? s[m.oppChar].w++ : s[m.oppChar].l++;
    });
    return Object.entries(s)
      .map(([c, v]) => ({ c, w: v.w, l: v.l, t: v.w + v.l }))
      .sort((a, b) => (a.t ? a.w / a.t : 0) - (b.t ? b.w / b.t : 0));
  }, [data]);

  const charMatchups = useMemo(() => {
    if (!charDetail) return [];
    const s = {};
    data.matches
      .filter((m) => m.myChar === charDetail)
      .forEach((m) => {
        if (!s[m.oppChar]) s[m.oppChar] = { w: 0, l: 0 };
        m.result === "win" ? s[m.oppChar].w++ : s[m.oppChar].l++;
      });
    return Object.entries(s)
      .map(([c, v]) => ({ c, w: v.w, l: v.l, t: v.w + v.l }))
      .sort((a, b) => b.t - a.t);
  }, [data, charDetail]);

  const trendData = useMemo(() => {
    const dl = data.daily || {};
    const entries = Object.entries(dl)
      .map((e) => {
        const ps = getDayPowerSummary(e[1]);
        return [e[0], ps];
      })
      .filter((e) => e[1].start || e[1].end)
      .sort((a, b) => a[0].localeCompare(b[0]));
    if (!entries.length) return { points: [], cur: 0, chg: 0, mx: 0, mn: 0 };

    const now = new Date();
    let filtered;
    if (period === "day") {
      filtered = entries.filter((e) => e[0] === today());
    } else if (period === "week") {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      const ws = w.toISOString().split("T")[0];
      filtered = entries.filter((e) => e[0] >= ws);
    } else if (period === "month") {
      const mo = new Date(now);
      mo.setDate(mo.getDate() - 30);
      const mos = mo.toISOString().split("T")[0];
      filtered = entries.filter((e) => e[0] >= mos);
    } else {
      filtered = entries;
    }
    if (!filtered.length)
      return { points: [], cur: 0, chg: 0, mx: 0, mn: 0 };

    const pts = [];
    filtered.forEach((e) => {
      if (e[1].start)
        pts.push({ date: e[0], value: e[1].start });
      if (e[1].end)
        pts.push({ date: e[0], value: e[1].end });
    });
    if (!pts.length) return { points: [], cur: 0, chg: 0, mx: 0, mn: 0 };

    const vals = pts.map((p) => p.value);
    const cur = pts[pts.length - 1].value;
    return {
      points: pts,
      cur,
      chg: cur - pts[0].value,
      mx: Math.max(...vals),
      mn: Math.min(...vals),
    };
  }, [data, period]);

  const matrix = useMemo(() => {
    const m = {};
    const myS = new Set();
    const opS = new Set();
    data.matches.forEach((mt) => {
      const k = `${mt.myChar}|${mt.oppChar}`;
      if (!m[k]) m[k] = { w: 0, l: 0 };
      mt.result === "win" ? m[k].w++ : m[k].l++;
      myS.add(mt.myChar);
      opS.add(mt.oppChar);
    });
    return { data: m, myCs: [...myS], opCs: [...opS] };
  }, [data]);

  const hourlyStats = useMemo(() => {
    const h = {};
    data.matches.forEach((m) => {
      const hr = formatHour(m.time);
      if (hr < 0) return;
      if (!h[hr]) h[hr] = { w: 0, l: 0 };
      m.result === "win" ? h[hr].w++ : h[hr].l++;
    });
    return h;
  }, [data]);

  const rolling = useMemo(() => {
    const r = {};
    [20, 50].forEach((n) => {
      const recent = data.matches.slice(-n);
      const w = recent.filter((m) => m.result === "win").length;
      r[n] = { w, t: recent.length };
    });
    return r;
  }, [data]);

  const renderBar = (r) => (
    <div
      style={{
        height: 6,
        background: T.inp,
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 6,
      }}
    >
      <div
        style={{
          width: `${r * 100}%`,
          height: "100%",
          borderRadius: 3,
          background: barColor(r),
        }}
      />
    </div>
  );

  const renderLabel = (r) => {
    const label = r >= 0.6 ? t("analysis.winning") : r >= 0.4 ? t("analysis.even") : t("analysis.losing");
    const bg = r >= 0.6 ? T.winBg : r >= 0.4 ? "rgba(255,159,10,.15)" : T.loseBg;
    const color = r >= 0.6 ? T.win : r >= 0.4 ? "#a16207" : T.lose;
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: bg, color }}>
        {label}
      </span>
    );
  };

  if (data.matches.length === 0) {
    return (
      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {pill("myChar", t("analysis.charBased"), aMode, setAMode)}
          {pill("oppChar", t("analysis.matchup"), aMode, setAMode)}
          {pill("trend", t("analysis.trend"), aMode, setAMode)}
          {pill("stats", t("analysis.stats"), aMode, setAMode)}
        </div>
        <div
          style={{
            background: T.card,
            borderRadius: 16,
            padding: "48px 24px",
            boxShadow: T.sh,
            border: T.brd !== "transparent" ? `1px solid ${T.brd}` : "none",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ background: T.accentSoft, borderRadius: "50%", width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={30} color={T.accent} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{t("analysis.emptyTitle")}</div>
          <div style={{ fontSize: 13, color: T.dim }}>{t("analysis.emptyDesc")}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ display: "flex", gap: 6, marginBottom: 16 }}
      >
        {pill("myChar", t("analysis.charBased"), aMode, setAMode)}
        {pill("oppChar", t("analysis.matchup"), aMode, setAMode)}
        {pill("trend", t("analysis.trend"), aMode, setAMode)}
        {pill("stats", t("analysis.stats"), aMode, setAMode)}
      </div>

      {/* Summary */}
      {aMode !== "trend" && aMode !== "stats" && (
        <div
          style={{
            ...cd,
            display: "flex",
            padding: isPC ? "24px 20px" : "18px 12px",
            textAlign: "center",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>
              {t("analysis.totalMatches")}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: T.text,
                marginTop: 4,
              }}
            >
              {data.matches.length || "0"}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>
              {t("analysis.winRate")}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: T.text,
                marginTop: 4,
              }}
            >
              {percentStr(totalW, data.matches.length)}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>
              {t("analysis.winLoss")}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
              <span style={{ color: T.win }}>{totalW}</span>
              <span style={{ color: T.dimmer }}> : </span>
              <span style={{ color: T.lose }}>{totalL}</span>
            </div>
          </div>
        </div>
      )}

      {/* My char detail */}
      {aMode === "myChar" && charDetail && (
        <div>
          {/* Header with back + stats */}
          <div style={{ ...cd, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
            <button
              onClick={() => { setCharDetail(null); setCharTab("matchup"); }}
              style={{ border: "none", background: T.inp, borderRadius: 10, padding: "8px 14px", color: T.sub, fontSize: 13, fontWeight: 600, flexShrink: 0 }}
            >
              {t("analysis.backToList")}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FighterIcon name={charDetail} size={36} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{fighterName(charDetail, lang)}</div>
                {(() => {
                  const tt = charMatchups.reduce((a, s) => ({ w: a.w + s.w, l: a.l + s.l }), { w: 0, l: 0 });
                  return <div style={{ fontSize: 12, color: T.dim }}>{tt.w + tt.l}戦 {tt.w}W {tt.l}L ({percentStr(tt.w, tt.w + tt.l)})</div>;
                })()}
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[["matchup", t("analysis.vsOpponent")], ["daily", t("analysis.dailyRecord")]].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setCharTab(k)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                  fontSize: 13, fontWeight: charTab === k ? 700 : 500, textAlign: "center",
                  background: charTab === k ? T.accentGrad : T.inp,
                  color: charTab === k ? "#fff" : T.sub,
                  transition: "all .15s ease",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Matchup tab */}
          {charTab === "matchup" && charMatchups.slice().sort((a, b) => {
            const ra = a.t ? a.w / a.t : 0;
            const rb = b.t ? b.w / b.t : 0;
            return ra - rb;
          }).map((s) => {
            const r = s.t ? s.w / s.t : 0;
            const isExpanded = expandedOpp === s.c;
            const oppMatches = isExpanded
              ? data.matches
                  .filter((m) => m.myChar === charDetail && m.oppChar === s.c)
                  .slice()
                  .reverse()
              : [];
            return (
              <div key={s.c} style={{ ...cd, marginBottom: 8, padding: "12px 16px" }}>
                <div
                  onClick={() => setExpandedOpp(isExpanded ? null : s.c)}
                  style={{ cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <FighterIcon name={s.c} size={32} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{fighterName(s.c, lang)}</div>
                        <div style={{ fontSize: 11, color: T.dim }}>{s.w}W {s.l}L ({s.t}{t("analysis.battles")})</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 10, color: T.dim }}>{t("analysis.winRate")}</span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(s.w, s.t)}</span>
                      </div>
                      {renderLabel(r)}
                    </div>
                  </div>
                  {renderBar(r)}
                </div>
                {isExpanded && (
                  <div style={{ marginTop: 10, borderTop: `1px solid ${T.inp}`, paddingTop: 10 }}>
                    {oppMatches.slice(0, 10).map((m, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: T.dim, flexShrink: 0 }}>{formatDateLong(m.date)}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, flexShrink: 0,
                          background: m.result === "win" ? T.winBg : T.loseBg,
                          color: m.result === "win" ? T.win : T.lose,
                        }}>
                          {m.result === "win" ? "WIN" : "LOSE"}
                        </span>
                        {m.time && (
                          <span style={{ fontSize: 12, color: T.dim, flexShrink: 0 }}>{formatTime(m.time)}</span>
                        )}
                        {m.memo && (
                          <span style={{ fontSize: 11, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.memo}</span>
                        )}
                      </div>
                    ))}
                    {oppMatches.length > 10 && (
                      <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>
                        {t("analysis.others").replace("{n}", oppMatches.length - 10)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Daily tab */}
          {charTab === "daily" && (() => {
            const dailyMap = {};
            data.matches.filter((m) => m.myChar === charDetail).forEach((m) => {
              if (!dailyMap[m.date]) dailyMap[m.date] = { w: 0, l: 0 };
              m.result === "win" ? dailyMap[m.date].w++ : dailyMap[m.date].l++;
            });
            const days = Object.entries(dailyMap).sort((a, b) => b[0].localeCompare(a[0]));
            if (days.length === 0) return <div style={{ ...cd, textAlign: "center", padding: 20, color: T.dim, fontSize: 13 }}>{t("analysis.noData")}</div>;
            return days.map(([date, d]) => {
              const total = d.w + d.l;
              const r = total ? d.w / total : 0;
              return (
                <div key={date} style={{ ...cd, marginBottom: 8, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{formatDate(date)}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, color: T.dim }}>{total}{t("analysis.battles")}</span>
                    <span style={{ fontSize: 16, fontWeight: 800 }}>
                      <span style={{ color: T.win }}>{d.w}</span>
                      <span style={{ color: T.dimmer }}> : </span>
                      <span style={{ color: T.lose }}>{d.l}</span>
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: barColor(r) }}>{percentStr(d.w, total)}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* My char list */}
      {aMode === "myChar" && !charDetail && (
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.sub,
              marginBottom: 10,
            }}
          >
            {t("analysis.charDetail")}
          </div>
          {mCS.length === 0
            ? emptyMsg(t("analysis.noCharData"))
            : <div style={isPC ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 } : undefined}>
              {mCS.map((s) => {
                const r = s.t ? s.w / s.t : 0;
                return (
                  <button
                    key={s.c}
                    onClick={() => setCharDetail(s.c)}
                    style={{
                      ...cd,
                      marginBottom: isPC ? 0 : 8,
                      padding: "14px 18px",
                      width: "100%",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: T.text,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <FighterIcon name={s.c} size={28} />
                        {fighterName(s.c, lang)}
                      </span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>{t("analysis.winRate")}</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: barColor(r) }}>
                          {percentStr(s.w, s.t)}
                        </span>
                      </div>
                    </div>
                    {renderBar(r)}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: 12, color: T.dim }}>
                        {s.w}W {s.l}L · {s.t}{t("analysis.battles")}
                      </span>
                      <span style={{ fontSize: 12, color: T.accent }}>
                        {t("analysis.detail")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>}
        </div>
      )}

      {/* Matchup */}
      {aMode === "oppChar" && (
        <div>
          {mCS.length === 0
            ? emptyMsg(t("analysis.noMatchupData"))
            : (
              <div>
                {/* Character selector */}
                <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}>
                  {t("analysis.selectChar")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {mCS.map((s) => {
                    const active = charDetail === s.c;
                    const r = s.t ? s.w / s.t : 0;
                    return (
                      <button
                        key={s.c}
                        onClick={() => setCharDetail(active ? null : s.c)}
                        style={{
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: active ? `2px solid ${T.accent}` : `1px solid ${T.brd}`,
                          background: active ? T.accentSoft : T.card,
                          color: active ? T.accent : T.text,
                          fontSize: 15,
                          fontWeight: active ? 700 : 500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          textAlign: "left",
                          transition: "all .15s ease",
                          boxShadow: active ? `0 2px 8px ${T.accent}22` : T.sh,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <FighterIcon name={s.c} size={36} />
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{fighterName(s.c, lang)}</div>
                            <div style={{ fontSize: 11, color: active ? T.accent : T.dim, fontWeight: 500, marginTop: 2 }}>{s.t}{t("analysis.battles")} {s.w}W {s.l}L</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <span style={{ fontSize: 10, color: active ? T.accent : T.dim }}>{t("analysis.winRate")}</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>
                            {percentStr(s.w, s.t)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!charDetail ? (
                  <div style={{ ...cd, padding: "32px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, color: T.dim }}>
                      {t("analysis.selectCharDesc")}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={isPC ? { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 } : undefined}>
                      {charMatchups.slice().sort((a, b) => {
                        const ra = a.t ? a.w / a.t : 0;
                        const rb = b.t ? b.w / b.t : 0;
                        return ra - rb;
                      }).map((s) => {
                        const r = s.t ? s.w / s.t : 0;
                        const isExpanded = expandedOpp === s.c;
                        const oppMatches = isExpanded
                          ? data.matches
                              .filter((m) => m.myChar === charDetail && m.oppChar === s.c)
                              .slice()
                              .reverse()
                          : [];
                        return (
                          <div key={s.c} style={{ ...cd, marginBottom: isPC ? 0 : 8, padding: "12px 16px" }}>
                            <div
                              onClick={() => setExpandedOpp(isExpanded ? null : s.c)}
                              style={{ cursor: "pointer" }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <FighterIcon name={s.c} size={26} />
                                  <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{fighterName(s.c, lang)}</div>
                                    <div style={{ fontSize: 11, color: T.dim }}>{s.w}W {s.l}L ({s.t}{t("analysis.battles")})</div>
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
                                    <span style={{ fontSize: 10, color: T.dim }}>{t("analysis.winRate")}</span>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>
                                      {percentStr(s.w, s.t)}
                                    </span>
                                  </div>
                                  {renderLabel(r)}
                                </div>
                              </div>
                              {renderBar(r)}
                            </div>
                            {isExpanded && (
                              <div style={{ marginTop: 10, borderTop: `1px solid ${T.inp}`, paddingTop: 10 }}>
                                {oppMatches.slice(0, 10).map((m, i) => (
                                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: T.dim, flexShrink: 0 }}>{formatDateLong(m.date)}</span>
                                    <span style={{
                                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, flexShrink: 0,
                                      background: m.result === "win" ? T.winBg : T.loseBg,
                                      color: m.result === "win" ? T.win : T.lose,
                                    }}>
                                      {m.result === "win" ? "WIN" : "LOSE"}
                                    </span>
                                    {m.time && (
                                      <span style={{ fontSize: 12, color: T.dim, flexShrink: 0 }}>{formatTime(m.time)}</span>
                                    )}
                                    {m.memo && (
                                      <span style={{ fontSize: 11, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.memo}</span>
                                    )}
                                  </div>
                                ))}
                                {oppMatches.length > 10 && (
                                  <div style={{ fontSize: 12, color: T.dim, marginTop: 4 }}>
                                    {t("analysis.others").replace("{n}", oppMatches.length - 10)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {/* Trend */}
      {aMode === "trend" && (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {pill("day", t("analysis.today"), period, setPeriod)}
            {pill("week", t("analysis.week"), period, setPeriod)}
            {pill("month", t("analysis.month"), period, setPeriod)}
            {pill("all", t("analysis.all"), period, setPeriod)}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isPC ? "repeat(4, 1fr)" : "1fr 1fr",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {[
              { label: t("analysis.current"), value: trendData.cur ? numFormat(trendData.cur) : "\u2014", color: T.text },
              { label: t("analysis.change"), value: trendData.chg ? (trendData.chg > 0 ? "+" : "") + numFormat(trendData.chg) : "\u2014", color: trendData.chg > 0 ? T.win : trendData.chg < 0 ? T.lose : T.dim },
              { label: t("analysis.highest"), value: trendData.mx ? numFormat(trendData.mx) : "\u2014", color: trendData.mx ? T.win : T.dim },
              { label: t("analysis.lowest"), value: trendData.mn ? numFormat(trendData.mn) : "\u2014", color: trendData.mn ? T.lose : T.dim },
            ].map((s) => (
              <div key={s.label} style={{ ...cd, marginBottom: 0, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: T.dim, fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "'Chakra Petch', sans-serif" }}>{s.value}</div>
              </div>
            ))}
          </div>
          {trendData.points.length > 1 ? (
            <div style={{ ...cd, padding: "16px 12px 10px" }}>
              <Chart points={trendData.points} T={T} />
            </div>
          ) : (
            <div style={{ ...cd, textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 13, color: T.dim }}>
                {t("analysis.enterPowerToSee")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {aMode === "stats" && (
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.sub,
              marginBottom: 10,
            }}
          >
            {t("analysis.heatmap")}
          </div>
          <div style={{ ...cd, padding: "16px 14px", marginBottom: isPC ? 20 : 14 }}>
            <Heatmap matches={data.matches} T={T} isPC={isPC} />
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.sub,
              marginBottom: 10,
            }}
          >
            {t("analysis.recentWinRate")}
          </div>
          <div style={{ display: "flex", gap: isPC ? 16 : 8, marginBottom: isPC ? 20 : 14 }}>
            {[20, 50].filter((n) => {
              if (n === 50 && data.matches.length <= 20) return false;
              return true;
            }).map((n) => {
              const d = rolling[n];
              const r = d.t ? d.w / d.t : 0;
              const label = `${t("battle.recentLabel")} ${d.t}${t("analysis.battles")}`;
              return (
                <div
                  key={n}
                  style={{
                    ...cd,
                    flex: 1,
                    marginBottom: 0,
                    padding: "14px 16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: d.t ? barColor(r) : T.dim,
                      marginTop: 4,
                    }}
                  >
                    {d.t ? percentStr(d.w, d.t) : "\u2014"}
                  </div>
                  {d.t > 0 && (
                    <div
                      style={{ fontSize: 11, color: T.dim, marginTop: 2 }}
                    >
                      {d.w}W {d.t - d.w}L
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.sub,
              marginBottom: 10,
            }}
          >
            {t("analysis.timeOfDay")}
          </div>
          <div style={{ ...cd, padding: "14px 12px" }}>
            {Object.keys(hourlyStats).length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: T.dim,
                  fontSize: 13,
                  padding: 16,
                }}
              >
                {t("analysis.noData")}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isPC ? "repeat(8, 1fr)" : "repeat(4, 1fr)",
                  gap: 6,
                }}
              >
                {Object.entries(hourlyStats)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([hr, d]) => {
                    const r = d.w / (d.w + d.l);
                    return (
                      <div
                        key={hr}
                        style={{
                          textAlign: "center",
                          padding: "8px 4px",
                          borderRadius: 10,
                          background: T.inp,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: T.text,
                          }}
                        >
                          {hr}{t("analysis.hour")}
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: barColor(r),
                            marginTop: 2,
                          }}
                        >
                          {percentStr(d.w, d.w + d.l)}
                        </div>
                        <div style={{ fontSize: 10, color: T.dim }}>
                          {d.w + d.l}{t("analysis.battles")}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
