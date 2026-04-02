import { useState, useMemo } from "react";
import HistRow from "./HistRow";
import { formatDateLong, numFormat, percentStr } from "../utils/format";

export default function HistoryTab({ data, onSave, T }) {
  const [histDate, setHistDate] = useState(null);

  const dGroups = useMemo(() => {
    const g = {};
    data.matches.forEach((m) => {
      if (!g[m.date]) g[m.date] = [];
      g[m.date].push(m);
    });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [data]);

  const selDay = useMemo(
    () =>
      histDate ? data.matches.filter((m) => m.date === histDate) : [],
    [data, histDate],
  );

  const deleteMatch = (idx) => {
    const nm = [...data.matches];
    nm.splice(idx, 1);
    onSave({ ...data, matches: nm });
  };

  const cd = {
    background: T.card,
    borderRadius: 16,
    padding: "16px 18px",
    marginBottom: 12,
    boxShadow: T.sh,
    border: T.brd !== "transparent" ? `1px solid ${T.brd}` : "none",
  };

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

  return (
    <div>
      <div
        style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 10 }}
      >
        日別戦績
      </div>

      {!histDate ? (
        <div>
          {dGroups.length === 0
            ? emptyMsg("対戦を記録すると日別の戦績が表示されます")
            : dGroups.map(([dt, ms]) => {
                const w = ms.filter((m) => m.result === "win").length;
                const dp = data.daily?.[dt];
                return (
                  <button
                    key={dt}
                    onClick={() => setHistDate(dt)}
                    style={{
                      ...cd,
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      cursor: "pointer",
                      textAlign: "left",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{ fontSize: 15, fontWeight: 700, color: T.text }}
                      >
                        {formatDateLong(dt)}
                      </div>
                      <div
                        style={{ fontSize: 12, color: T.dim, marginTop: 2 }}
                      >
                        {ms.length}戦
                        {dp?.start
                          ? ` · ${numFormat(dp.start)}${dp.end ? "→" + numFormat(dp.end) : ""}`
                          : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", marginRight: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>
                        <span style={{ color: "#34C759" }}>{w}</span>
                        <span style={{ color: T.dimmer }}> : </span>
                        <span style={{ color: "#FF3B30" }}>
                          {ms.length - w}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: T.dim }}>
                        {percentStr(w, ms.length)}
                      </div>
                    </div>
                    <span style={{ color: T.dimmer, fontSize: 20 }}>›</span>
                  </button>
                );
              })}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setHistDate(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#FF3B30",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              marginBottom: 14,
            }}
          >
            ← 戻る
          </button>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>
            {formatDateLong(histDate)}
          </div>
          {(() => {
            const w = selDay.filter((m) => m.result === "win").length;
            return (
              <div
                style={{
                  fontSize: 14,
                  color: T.sub,
                  marginTop: 4,
                  marginBottom: 16,
                }}
              >
                {selDay.length}戦 ·{" "}
                <span style={{ color: "#34C759", fontWeight: 700 }}>
                  {w}W
                </span>{" "}
                -{" "}
                <span style={{ color: "#FF3B30", fontWeight: 700 }}>
                  {selDay.length - w}L
                </span>{" "}
                · {percentStr(w, selDay.length)}
              </div>
            );
          })()}
          {selDay.map((m, i) => {
            let ri = -1;
            let c = 0;
            for (let j = 0; j < data.matches.length; j++) {
              if (data.matches[j].date === histDate) {
                if (c === i) {
                  ri = j;
                  break;
                }
                c++;
              }
            }
            return (
              <HistRow
                key={i}
                m={m}
                onDelete={ri >= 0 ? () => deleteMatch(ri) : null}
                T={T}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
