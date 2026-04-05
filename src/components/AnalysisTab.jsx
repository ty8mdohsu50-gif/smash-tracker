import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import Chart from "./Chart";
import FighterIcon from "./FighterIcon";
import { shortName } from "../constants/fighters";
import {
  today,
  formatDate,
  percentStr,
  barColor,
  numFormat,
  formatHour,
} from "../utils/format";

export default function AnalysisTab({ data, T, isPC }) {
  const [aMode, setAMode] = useState("myChar");
  const [period, setPeriod] = useState("all");
  const [charDetail, setCharDetail] = useState(null);
  const [charTab, setCharTab] = useState("matchup");

  const totalW = data.matches.filter((m) => m.result === "win").length;
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
        pts.push({
          date: e[0],
          value: e[1].start,
          label: formatDate(e[0]) + "開始",
        });
      if (e[1].end)
        pts.push({
          date: e[0],
          value: e[1].end,
          label: formatDate(e[0]) + "終了",
        });
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

  const renderLabel = (r) => (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 8,
        background:
          r >= 0.6
            ? T.winBg
            : r >= 0.4
              ? "rgba(255,159,10,.15)"
              : T.loseBg,
        color:
          r >= 0.6 ? T.win : r >= 0.4 ? "#a16207" : T.lose,
      }}
    >
      {r >= 0.6 ? "得意" : r >= 0.4 ? "互角" : "苦手"}
    </span>
  );

  if (data.matches.length === 0) {
    return (
      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {pill("myChar", "キャラ別", aMode, setAMode)}
          {pill("oppChar", "マッチアップ", aMode, setAMode)}
          {pill("trend", "推移", aMode, setAMode)}
          {pill("stats", "統計", aMode, setAMode)}
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
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>分析データがありません</div>
          <div style={{ fontSize: 13, color: T.dim }}>対戦データを記録すると分析結果が表示されます</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ display: "flex", gap: 6, marginBottom: 16 }}
      >
        {pill("myChar", "キャラ別", aMode, setAMode)}
        {pill("oppChar", "マッチアップ", aMode, setAMode)}
        {pill("trend", "推移", aMode, setAMode)}
        {pill("stats", "統計", aMode, setAMode)}
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
              総試合
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
              勝率
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
              勝-負
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
              ← 戻る
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FighterIcon name={charDetail} size={36} />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{charDetail}</div>
                {(() => {
                  const tt = charMatchups.reduce((a, s) => ({ w: a.w + s.w, l: a.l + s.l }), { w: 0, l: 0 });
                  return <div style={{ fontSize: 12, color: T.dim }}>{tt.w + tt.l}戦 {tt.w}W {tt.l}L ({percentStr(tt.w, tt.w + tt.l)})</div>;
                })()}
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[["matchup", "vs 相手キャラ"], ["daily", "日別戦績"]].map(([k, l]) => (
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
            return (
              <div key={s.c} style={{ ...cd, marginBottom: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FighterIcon name={s.c} size={32} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{s.c}</div>
                      <div style={{ fontSize: 11, color: T.dim }}>{s.w}W {s.l}L ({s.t}戦)</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(s.w, s.t)}</div>
                    {renderLabel(r)}
                  </div>
                </div>
                {renderBar(r)}
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
            if (days.length === 0) return <div style={{ ...cd, textAlign: "center", padding: 20, color: T.dim, fontSize: 13 }}>データなし</div>;
            return days.map(([date, d]) => {
              const t = d.w + d.l;
              const r = t ? d.w / t : 0;
              return (
                <div key={date} style={{ ...cd, marginBottom: 8, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{formatDate(date)}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, color: T.dim }}>{t}戦</span>
                    <span style={{ fontSize: 16, fontWeight: 800 }}>
                      <span style={{ color: T.win }}>{d.w}</span>
                      <span style={{ color: T.dimmer }}> : </span>
                      <span style={{ color: T.lose }}>{d.l}</span>
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: barColor(r) }}>{percentStr(d.w, t)}</span>
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
            使用キャラ別（タップで詳細）
          </div>
          {mCS.length === 0
            ? emptyMsg("対戦を記録するとキャラ別の戦績が表示されます")
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
                        {s.c}
                      </span>
                      <span
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: barColor(r),
                        }}
                      >
                        {percentStr(s.w, s.t)}
                      </span>
                    </div>
                    {renderBar(r)}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: 12, color: T.dim }}>
                        {s.w}W {s.l}L · {s.t}戦
                      </span>
                      <span style={{ fontSize: 12, color: T.accent }}>
                        詳細 ›
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
            ? emptyMsg("対戦を記録するとマッチアップが表示されます")
            : (
              <div>
                {/* Character selector */}
                <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}>
                  使用キャラを選択
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
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{s.c}</div>
                            <div style={{ fontSize: 11, color: active ? T.accent : T.dim, fontWeight: 500, marginTop: 2 }}>{s.t}戦 {s.w}W {s.l}L</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>
                          {percentStr(s.w, s.t)}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!charDetail ? (
                  <div style={{ ...cd, padding: "32px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, color: T.dim }}>
                      上からキャラを選ぶと、相手キャラごとの戦績が表示されます
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
                        return (
                          <div key={s.c} style={{ ...cd, marginBottom: isPC ? 0 : 8, padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <FighterIcon name={s.c} size={26} />
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{s.c}</div>
                                  <div style={{ fontSize: 11, color: T.dim }}>{s.w}W {s.l}L ({s.t}戦)</div>
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>
                                  {percentStr(s.w, s.t)}
                                </div>
                                {renderLabel(r)}
                              </div>
                            </div>
                            {renderBar(r)}
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
            {pill("day", "今日", period, setPeriod)}
            {pill("week", "1週間", period, setPeriod)}
            {pill("month", "1ヶ月", period, setPeriod)}
            {pill("all", "全期間", period, setPeriod)}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isPC ? "repeat(4, 1fr)" : "1fr 1fr",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div style={{ ...cd, marginBottom: 0, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>
                現在
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: T.text,
                  marginTop: 4,
                }}
              >
                {trendData.cur ? numFormat(trendData.cur) : "\u2014"}
              </div>
            </div>
            <div style={{ ...cd, marginBottom: 0, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>
                変動
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  marginTop: 4,
                  color: trendData.chg > 0
                    ? T.win
                    : trendData.chg < 0
                      ? T.lose
                      : T.dim,
                }}
              >
                {trendData.chg
                  ? (trendData.chg > 0 ? "+" : "") +
                    numFormat(trendData.chg)
                  : "\u2014"}
              </div>
            </div>
            <div style={{ ...cd, marginBottom: 0, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>
                最高
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginTop: 4,
                  color: trendData.mx ? T.win : T.dim,
                }}
              >
                {trendData.mx ? numFormat(trendData.mx) : "\u2014"}
              </div>
            </div>
            <div style={{ ...cd, marginBottom: 0, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>
                最低
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginTop: 4,
                  color: trendData.mn ? T.lose : T.dim,
                }}
              >
                {trendData.mn ? numFormat(trendData.mn) : "\u2014"}
              </div>
            </div>
          </div>
          {trendData.points.length > 1 ? (
            <div style={{ ...cd, padding: "14px 8px 8px" }}>
              <Chart points={trendData.points} T={T} />
            </div>
          ) : (
            <div style={{ ...cd, textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 13, color: T.dim }}>
                戦闘力を入力すると推移が見れます
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
            直近の勝率
          </div>
          <div style={{ display: "flex", gap: isPC ? 16 : 8, marginBottom: isPC ? 20 : 14 }}>
            {[20, 50].map((n) => {
              const d = rolling[n];
              const r = d.t ? d.w / d.t : 0;
              const label =
                d.t < n ? `直近${d.t}戦` : `直近${n}戦`;
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
            時間帯別の勝率
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
                データなし
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
                          {hr}時
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
                          {d.w + d.l}戦
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
