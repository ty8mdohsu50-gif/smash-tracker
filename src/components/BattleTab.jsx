import { useState, useMemo } from "react";
import CharPicker from "./CharPicker";
import MatchRow from "./MatchRow";
import {
  today,
  formatDateWithDay,
  formatPower,
  rawPower,
  numFormat,
  percentStr,
  blurOnEnter,
  getStreak,
  recentChars,
  lastEndPower,
} from "../utils/format";

export default function BattleTab({ data, onSave, T }) {
  const [phase, setPhase] = useState("setup");
  const [myChar, setMyChar] = useState(data.settings.myChar || "");
  const [result, setResult] = useState(null);
  const [oppChar, setOppChar] = useState("");
  const [showPowerEdit, setShowPowerEdit] = useState(false);
  const [showMyPicker, setShowMyPicker] = useState(false);
  const [showOppPicker, setShowOppPicker] = useState(false);
  const [lastRes, setLastRes] = useState(null);
  const [memo, setMemo] = useState("");

  const todayDaily = data.daily?.[today()] || {};
  const prevEnd = lastEndPower(data.daily || {});

  const [pStart, setPStart] = useState(
    todayDaily.start || prevEnd || "",
  );
  const [pEnd, setPEnd] = useState(todayDaily.end || "");

  const savePower = (s, e) => {
    const d = { ...data };
    if (!d.daily) d.daily = {};
    d.daily[today()] = { start: s ? Number(s) : null, end: e ? Number(e) : null };
    onSave(d);
  };

  const saveMemo = () => {
    if (!memo) return;
    const nm = [...data.matches];
    nm[nm.length - 1] = { ...nm[nm.length - 1], memo };
    onSave({ ...data, matches: nm });
  };

  const recMy = useMemo(() => recentChars(data.matches, "myChar"), [data]);
  const recOpp = useMemo(() => recentChars(data.matches, "oppChar"), [data]);

  const tM = useMemo(
    () => data.matches.filter((m) => m.date === today()),
    [data],
  );
  const tW = tM.filter((m) => m.result === "win").length;
  const tL = tM.length - tW;
  const streak = useMemo(() => getStreak(data.matches), [data]);
  const goals = data.goals || {};
  const pwrDelta =
    todayDaily.start && todayDaily.end
      ? todayDaily.end - todayDaily.start
      : null;

  const deleteMatch = (idx) => {
    const nm = [...data.matches];
    nm.splice(idx, 1);
    onSave({ ...data, matches: nm });
  };

  const startBattle = () => {
    if (!pStart || !myChar) return;
    const d = { ...data };
    if (!d.daily) d.daily = {};
    d.daily[today()] = {
      start: Number(pStart),
      end: pEnd ? Number(pEnd) : null,
    };
    d.settings = { myChar };
    onSave(d);
    setPhase("fighting");
  };

  const selectRes = (r) => {
    if (oppChar) {
      const m = {
        date: today(),
        time: new Date().toISOString(),
        myChar,
        oppChar,
        result: r,
        memo: "",
      };
      onSave({ ...data, matches: [...data.matches, m] });
      setLastRes(r);
      setMemo("");
      setPhase("postMatch");
    } else {
      setResult(r);
      setPhase("pickOpp");
    }
  };

  const confirmOpp = () => {
    if (!oppChar) return;
    const m = {
      date: today(),
      time: new Date().toISOString(),
      myChar,
      oppChar,
      result,
      memo: "",
    };
    onSave({ ...data, matches: [...data.matches, m] });
    setLastRes(result);
    setMemo("");
    setPhase("postMatch");
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
    <div style={{ textAlign: "center", padding: "32px 0", color: T.dim, fontSize: 13 }}>
      {msg}
    </div>
  );

  const pwrInput = (val, set, ph, big) => (
    <input
      type="text"
      inputMode="numeric"
      value={formatPower(val)}
      onChange={(e) => set(rawPower(e.target.value))}
      onKeyDown={blurOnEnter}
      placeholder={ph}
      style={{
        width: "100%",
        padding: big ? "14px 0" : "10px 0",
        background: "transparent",
        border: "none",
        borderBottom: `2px solid ${T.dimmer}`,
        color: T.text,
        fontSize: big ? 28 : 18,
        fontWeight: 800,
        outline: "none",
        boxSizing: "border-box",
        letterSpacing: big ? -1 : 0,
      }}
      onFocus={(e) => {
        e.target.style.borderBottomColor = "#FF3B30";
      }}
      onBlur={(e) => {
        e.target.style.borderBottomColor = T.dimmer;
        if (!big) savePower(pStart, pEnd);
      }}
    />
  );

  return (
    <div>
      {/* Today summary card */}
      <div
        style={{
          ...cd,
          background: T.tBg,
          color: "#fff",
          border: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,.5)",
                letterSpacing: 1,
              }}
            >
              TODAY · {formatDateWithDay(today())}
            </div>
            {tM.length > 0 ? (
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  marginTop: 2,
                  letterSpacing: -1,
                }}
              >
                {tW}
                <span
                  style={{
                    color: "rgba(255,255,255,.3)",
                    margin: "0 4px",
                    fontSize: 24,
                  }}
                >
                  :
                </span>
                {tL}
              </div>
            ) : (
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginTop: 6,
                  color: "rgba(255,255,255,.4)",
                }}
              >
                対戦データなし
              </div>
            )}
            {streak.count >= 2 && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 2,
                  color: streak.type === "win" ? "#34C759" : "#FF9F0A",
                }}
              >
                {streak.count}
                {streak.type === "win" ? "連勝中" : "連敗中"}
              </div>
            )}
            {tM.length > 0 && (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,.6)",
                  marginTop: 2,
                }}
              >
                {tM.length}戦 · {percentStr(tW, tM.length)}
              </div>
            )}
            {pwrDelta !== null ? (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  marginTop: 2,
                  color: pwrDelta >= 0 ? "#34C759" : "#FF3B30",
                }}
              >
                戦闘力 {pwrDelta >= 0 ? "+" : ""}
                {numFormat(pwrDelta)}
              </div>
            ) : todayDaily.start ? (
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,.6)",
                  marginTop: 2,
                }}
              >
                戦闘力 {numFormat(todayDaily.start)}
              </div>
            ) : null}
          </div>
          {tM.length > 0 ? (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: `conic-gradient(#34C759 ${(tW / tM.length) * 360}deg, #FF3B30 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: T.tC,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                {percentStr(tW, tM.length)}
              </div>
            </div>
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(255,255,255,.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              🎮
            </div>
          )}
        </div>

        {/* Goals progress */}
        {(goals.games || goals.winRate) ? (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,.1)",
            }}
          >
            {goals.games ? (
              <div style={{ marginBottom: 6 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "rgba(255,255,255,.6)",
                    marginBottom: 3,
                  }}
                >
                  <span>目標 {goals.games}戦</span>
                  <span>
                    {tM.length}/{goals.games}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "rgba(255,255,255,.15)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (tM.length / goals.games) * 100)}%`,
                      height: "100%",
                      background: "#34C759",
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ) : null}
            {goals.winRate && tM.length > 0 ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "rgba(255,255,255,.6)",
                    marginBottom: 3,
                  }}
                >
                  <span>目標勝率 {goals.winRate}%</span>
                  <span
                    style={{
                      color:
                        Math.round((tW / tM.length) * 100) >= goals.winRate
                          ? "#34C759"
                          : "#FF9F0A",
                    }}
                  >
                    {Math.round((tW / tM.length) * 100)}%
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "rgba(255,255,255,.15)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (tW / tM.length) * 100)}%`,
                      height: "100%",
                      background:
                        Math.round((tW / tM.length) * 100) >= goals.winRate
                          ? "#34C759"
                          : "#FF9F0A",
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Setup phase */}
      {phase === "setup" && (
        <div style={{ animation: "fadeUp .2s ease" }}>
          <div style={cd}>
            <div
              style={{
                fontSize: 13,
                color: T.sub,
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              開始時の戦闘力
            </div>
            {prevEnd && !todayDaily.start && (
              <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>
                前回から自動引き継ぎ
              </div>
            )}
            {pwrInput(pStart, setPStart, "14,000,000", true)}
          </div>

          <div style={{ ...cd, paddingBottom: 18 }}>
            {showMyPicker ? (
              <CharPicker
                value={myChar}
                onChange={(c) => {
                  setMyChar(c);
                  setShowMyPicker(false);
                }}
                label="使用キャラ"
                placeholder="ファイターを選択"
                recent={recMy}
                T={T}
              />
            ) : (
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: T.sub,
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  使用キャラ
                </div>
                {myChar ? (
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: T.text,
                      marginBottom: 4,
                    }}
                  >
                    {myChar}
                  </div>
                ) : (
                  <div
                    style={{ fontSize: 15, color: T.dim, marginBottom: 4 }}
                  >
                    未選択
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => setShowMyPicker(true)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: `1px solid ${T.dimmer}`,
                      background: T.card,
                      color: T.sub,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    変更
                  </button>
                  {recMy
                    .filter((c) => c !== myChar)
                    .slice(0, 2)
                    .map((c) => (
                      <button
                        key={c}
                        onClick={() => setMyChar(c)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 10,
                          border: "none",
                          background: T.inp,
                          color: T.text,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          maxWidth: 120,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={startBattle}
            disabled={!pStart || !myChar}
            style={{
              width: "100%",
              padding: 16,
              border: "none",
              borderRadius: 14,
              background:
                !pStart || !myChar
                  ? "#E5E5EA"
                  : "linear-gradient(135deg,#FF3B30,#FF6B6B)",
              color: !pStart || !myChar ? T.dim : "#fff",
              fontSize: 17,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow:
                !pStart || !myChar
                  ? "none"
                  : "0 4px 16px rgba(255,59,48,.3)",
            }}
          >
            対戦開始
          </button>
        </div>
      )}

      {/* Fighting phase */}
      {phase === "fighting" && (
        <div style={{ animation: "fadeUp .15s ease" }}>
          <button
            onClick={() => setShowPowerEdit(!showPowerEdit)}
            style={{
              ...cd,
              width: "100%",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>
                {myChar}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: T.text,
                  marginTop: 2,
                }}
              >
                開始 {numFormat(pStart)}
                {pEnd && (
                  <span style={{ color: T.sub, fontWeight: 500 }}>
                    {" "}
                    → {numFormat(pEnd)}
                  </span>
                )}
              </div>
            </div>
            <span style={{ fontSize: 12, color: T.dim }}>
              {showPowerEdit ? "▲" : "▼"}
            </span>
          </button>

          {showPowerEdit && (
            <div style={{ ...cd, animation: "fadeUp .15s ease" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: T.sub,
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    開始
                  </div>
                  {pwrInput(pStart, setPStart, "", false)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: T.sub,
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    現在
                  </div>
                  {pwrInput(pEnd, setPEnd, "終了後", false)}
                </div>
              </div>
            </div>
          )}

          <div style={{ ...cd, padding: "12px 16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>
                相手キャラ
              </div>
              {oppChar && (
                <button
                  onClick={() => setOppChar("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#FF3B30",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  クリア
                </button>
              )}
            </div>
            {oppChar && !showOppPicker && (
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: T.text,
                  marginTop: 4,
                }}
              >
                {oppChar}
              </div>
            )}
            {showOppPicker ? (
              <div style={{ marginTop: 8 }}>
                <CharPicker
                  value={oppChar}
                  onChange={(c) => {
                    setOppChar(c);
                    setShowOppPicker(false);
                  }}
                  placeholder="相手を選択"
                  recent={recOpp}
                  T={T}
                />
              </div>
            ) : (
              !showOppPicker && (
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {recOpp.slice(0, 3).map((c) => (
                    <button
                      key={c}
                      onClick={() => setOppChar(c)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 10,
                        border:
                          oppChar === c ? "2px solid #FF3B30" : "none",
                        background:
                          oppChar === c
                            ? "rgba(255,59,48,.08)"
                            : T.inp,
                        color: oppChar === c ? "#FF3B30" : T.text,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowOppPicker(true)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 10,
                      border: `1px dashed ${T.dimmer}`,
                      background: "transparent",
                      color: T.sub,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    他…
                  </button>
                </div>
              )
            )}
          </div>

          <div
            style={{
              fontSize: 13,
              color: T.sub,
              textAlign: "center",
              margin: "12px 0 8px",
            }}
          >
            試合結果を選択
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => selectRes("win")}
              style={{
                flex: 1,
                padding: "22px 0",
                border: "none",
                borderRadius: 16,
                background: "linear-gradient(135deg,#34C759,#30D158)",
                color: "#fff",
                fontSize: 20,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(52,199,89,.3)",
              }}
            >
              勝ち
            </button>
            <button
              onClick={() => selectRes("lose")}
              style={{
                flex: 1,
                padding: "22px 0",
                border: "none",
                borderRadius: 16,
                background: "linear-gradient(135deg,#FF3B30,#FF6B6B)",
                color: "#fff",
                fontSize: 20,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(255,59,48,.3)",
              }}
            >
              負け
            </button>
          </div>

          <button
            onClick={() => {
              setPhase("setup");
              setShowPowerEdit(false);
              setShowOppPicker(false);
            }}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 10,
              border: "none",
              background: "transparent",
              color: T.dim,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ← 設定に戻る
          </button>
        </div>
      )}

      {/* Pick opponent phase */}
      {phase === "pickOpp" && (
        <div style={{ animation: "fadeUp .15s ease" }}>
          <div
            style={{
              ...cd,
              textAlign: "center",
              background:
                result === "win"
                  ? "rgba(52,199,89,.1)"
                  : "rgba(255,59,48,.1)",
            }}
          >
            <span style={{ fontSize: 28 }}>
              {result === "win" ? "🏆" : "❌"}
            </span>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                marginTop: 4,
                color: result === "win" ? "#16a34a" : "#dc2626",
              }}
            >
              {result === "win" ? "WIN" : "LOSE"}
            </div>
          </div>
          <div style={cd}>
            <CharPicker
              value={oppChar}
              onChange={setOppChar}
              label="相手キャラ"
              placeholder="相手を選択"
              recent={recOpp}
              T={T}
            />
            {recOpp.length > 0 && !oppChar && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                {recOpp.slice(0, 3).map((c) => (
                  <button
                    key={c}
                    onClick={() => setOppChar(c)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: "none",
                      background: T.inp,
                      color: T.text,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={confirmOpp}
            disabled={!oppChar}
            style={{
              width: "100%",
              padding: 16,
              border: "none",
              borderRadius: 14,
              background: !oppChar ? "#E5E5EA" : "#1c1c1e",
              color: !oppChar ? T.dim : "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            記録する
          </button>
        </div>
      )}

      {/* Post match phase */}
      {phase === "postMatch" && (
        <div style={{ animation: "fadeUp .15s ease" }}>
          <div style={{ ...cd, textAlign: "center", padding: "24px 18px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: T.dim,
                letterSpacing: 1,
              }}
            >
              RECORDED
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                {myChar}
              </span>
              <span style={{ fontSize: 13, color: T.dim }}>vs</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                {oppChar}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 16px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  background:
                    lastRes === "win"
                      ? "rgba(52,199,89,.15)"
                      : "rgba(255,59,48,.15)",
                  color: lastRes === "win" ? "#16a34a" : "#dc2626",
                }}
              >
                {lastRes === "win" ? "WIN" : "LOSE"}
              </span>
            </div>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={saveMemo}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveMemo();
                  e.target.blur();
                }
              }}
              placeholder="メモ（任意）"
              style={{
                width: "100%",
                marginTop: 12,
                padding: "10px 12px",
                background: T.inp,
                border: "none",
                borderRadius: 10,
                color: T.text,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                textAlign: "center",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => {
                saveMemo();
                setPhase("fighting");
                setShowOppPicker(false);
              }}
              style={{
                width: "100%",
                padding: 20,
                border: "none",
                borderRadius: 14,
                background: "linear-gradient(135deg,#FF3B30,#FF6B6B)",
                color: "#fff",
                fontSize: 17,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(255,59,48,.3)",
              }}
            >
              連戦する
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  saveMemo();
                  setOppChar("");
                  setShowOppPicker(true);
                  setPhase("fighting");
                }}
                style={{
                  flex: 1,
                  padding: 16,
                  border: `1px solid ${T.dimmer}`,
                  borderRadius: 10,
                  background: T.card,
                  color: T.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                次の試合
              </button>
              <button
                onClick={() => {
                  saveMemo();
                  setOppChar("");
                  setShowOppPicker(false);
                  setPhase("setup");
                }}
                style={{
                  flex: 1,
                  padding: 16,
                  border: `1px solid ${T.dimmer}`,
                  borderRadius: 10,
                  background: T.card,
                  color: T.text,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                自キャラを変える
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent matches */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}
        >
          直近の対戦
        </div>
        {tM.length === 0
          ? emptyMsg("今日の対戦記録がここに表示されます")
          : tM
              .slice()
              .reverse()
              .slice(0, 10)
              .map((m, i) => (
                <MatchRow
                  key={i}
                  m={m}
                  onDelete={() =>
                    deleteMatch(data.matches.length - 1 - i)
                  }
                  showTime
                  T={T}
                />
              ))}
      </div>
    </div>
  );
}
