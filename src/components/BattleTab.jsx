import { useState, useMemo } from "react";
import { Trophy, X, ChevronUp, ChevronDown, Zap } from "lucide-react";
import CharPicker from "./CharPicker";
import MatchRow from "./MatchRow";
import MatchupBadge from "./MatchupBadge";
import FighterIcon from "./FighterIcon";
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

export default function BattleTab({ data, onSave, T, isPC }) {
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
    border: `1px solid ${T.brd}`,
    transition: "box-shadow .2s ease",
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
        fontFamily: "'Chakra Petch', sans-serif",
        transition: "border-color .2s ease",
      }}
      onFocus={(e) => {
        e.target.style.borderBottomColor = T.accent;
      }}
      onBlur={(e) => {
        e.target.style.borderBottomColor = T.dimmer;
        if (!big) savePower(pStart, pEnd);
      }}
    />
  );

  const recentMatchList = tM.length === 0
    ? emptyMsg("今日の対戦記録がここに表示されます")
    : tM
        .slice()
        .reverse()
        .slice(0, 10)
        .map((m, i) => (
          <MatchRow
            key={i}
            m={m}
            onDelete={() => deleteMatch(data.matches.length - 1 - i)}
            showTime
            T={T}
          />
        ));

  const winRate = tM.length > 0 ? Math.round((tW / tM.length) * 100) : 0;

  const todayCard = (
    <div
      style={{
        ...cd,
        background: T.tBg,
        color: "#fff",
        border: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          background: "radial-gradient(circle, rgba(255,255,255,.06) 0%, transparent 70%)",
          borderRadius: "50%",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,.5)",
              letterSpacing: 1.5,
              fontFamily: "'Chakra Petch', sans-serif",
            }}
          >
            TODAY  {formatDateWithDay(today())}
          </div>
          {tM.length > 0 ? (
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                marginTop: 4,
                letterSpacing: -1,
                fontFamily: "'Chakra Petch', sans-serif",
              }}
            >
              {tW}
              <span style={{ color: "rgba(255,255,255,.3)", margin: "0 4px", fontSize: 24 }}>:</span>
              {tL}
            </div>
          ) : (
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, color: "rgba(255,255,255,.4)" }}>
              対戦データなし
            </div>
          )}
          {streak.count >= 2 && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                marginTop: 4,
                color: streak.type === "win" ? "#34C759" : "#FF9F0A",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Zap size={14} fill="currentColor" />
              {streak.count}{streak.type === "win" ? "連勝中" : "連敗中"}
            </div>
          )}
          {tM.length > 0 && (
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.6)", marginTop: 2 }}>
              {tM.length}戦  {percentStr(tW, tM.length)}
            </div>
          )}
          {pwrDelta !== null ? (
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: pwrDelta >= 0 ? "#34C759" : "#F43F5E" }}>
              戦闘力 {pwrDelta >= 0 ? "+" : ""}{numFormat(pwrDelta)}
            </div>
          ) : todayDaily.start ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 2 }}>
              戦闘力 {numFormat(todayDaily.start)}
            </div>
          ) : null}
        </div>
        {tM.length > 0 ? (
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: `conic-gradient(#22C55E ${(tW / tM.length) * 360}deg, #F43F5E 0deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,.2)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: T.tC,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 800,
                color: "#fff",
                fontFamily: "'Chakra Petch', sans-serif",
              }}
            >
              {percentStr(tW, tM.length)}
            </div>
          </div>
        ) : (
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "rgba(255,255,255,.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <Trophy size={28} color="rgba(255,255,255,.25)" />
          </div>
        )}
      </div>

      {(goals.games || goals.winRate) ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.1)" }}>
          {goals.games ? (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.6)", marginBottom: 3 }}>
                <span>目標 {goals.games}戦</span>
                <span>{tM.length}/{goals.games}</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,.15)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (tM.length / goals.games) * 100)}%`, height: "100%", background: "#22C55E", borderRadius: 2, transition: "width .3s ease" }} />
              </div>
            </div>
          ) : null}
          {goals.winRate && tM.length > 0 ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.6)", marginBottom: 3 }}>
                <span>目標勝率 {goals.winRate}%</span>
                <span style={{ color: winRate >= goals.winRate ? "#22C55E" : "#FF9F0A" }}>{winRate}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,.15)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (tW / tM.length) * 100)}%`, height: "100%", background: winRate >= goals.winRate ? "#22C55E" : "#FF9F0A", borderRadius: 2, transition: "width .3s ease" }} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const activeBtn = (disabled) => ({
    width: "100%",
    padding: 16,
    border: "none",
    borderRadius: 14,
    background: disabled ? T.inp : T.accentGrad,
    color: disabled ? T.dim : "#fff",
    fontSize: 17,
    fontWeight: 800,
    boxShadow: disabled ? "none" : T.accentGlow,
    transition: "all .2s ease",
  });

  const mainContent = (
    <div>
      {phase === "setup" && todayCard}

      {phase === "setup" && (
        <div style={{ animation: "fadeUp .2s ease" }}>
          <div style={cd}>
            <div style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}>開始時の戦闘力</div>
            {prevEnd && !todayDaily.start && (
              <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>前回から自動引き継ぎ</div>
            )}
            {pwrInput(pStart, setPStart, "14,000,000", true)}
          </div>

          <div style={{ ...cd, paddingBottom: 18 }}>
            {showMyPicker ? (
              <CharPicker
                value={myChar}
                onChange={(c) => { setMyChar(c); setShowMyPicker(false); }}
                label="使用キャラ"
                placeholder="ファイターを選択"
                recent={recMy}
                T={T}
              />
            ) : (
              <div>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}>使用キャラ</div>
                {myChar ? (
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>{myChar}</div>
                ) : (
                  <div style={{ fontSize: 15, color: T.dim, marginBottom: 4 }}>未選択</div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => setShowMyPicker(true)}
                    style={{
                      padding: "8px 14px", borderRadius: 10, border: `1px solid ${T.brd}`,
                      background: T.card, color: T.sub, fontSize: 12, fontWeight: 600,
                      transition: "all .15s ease",
                    }}
                  >
                    変更
                  </button>
                  {recMy.filter((c) => c !== myChar).slice(0, 2).map((c) => (
                    <button
                      key={c}
                      onClick={() => setMyChar(c)}
                      style={{
                        padding: "8px 14px", borderRadius: 10, border: "none",
                        background: T.inp, color: T.text, fontSize: 12, fontWeight: 600,
                        maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        transition: "all .15s ease",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={startBattle} disabled={!pStart || !myChar} style={activeBtn(!pStart || !myChar)}>
            対戦開始
          </button>
        </div>
      )}

      {phase === "fighting" && (
        <div style={{ animation: "fadeUp .2s ease" }}>
          {/* Compact status bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: T.card,
              borderRadius: 12,
              marginBottom: 12,
              border: `1px solid ${T.brd}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FighterIcon name={myChar} size={30} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{myChar}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {tM.length > 0 && (
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  <span style={{ color: "#16a34a" }}>{tW}</span>
                  <span style={{ color: T.dimmer }}> : </span>
                  <span style={{ color: "#dc2626" }}>{tL}</span>
                </span>
              )}
              <button
                onClick={() => setShowPowerEdit(!showPowerEdit)}
                style={{
                  border: "none", background: T.inp, borderRadius: 8,
                  padding: "4px 10px", fontSize: 12, fontWeight: 600,
                  color: T.sub, display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {numFormat(pStart)}{pEnd ? " → " + numFormat(pEnd) : ""}
                {showPowerEdit ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {showPowerEdit && (
            <div style={{ ...cd, animation: "fadeUp .15s ease" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 4, fontWeight: 600 }}>開始</div>
                  {pwrInput(pStart, setPStart, "", false)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 4, fontWeight: 600 }}>現在</div>
                  {pwrInput(pEnd, setPEnd, "終了後", false)}
                </div>
              </div>
            </div>
          )}

          <div style={{ ...cd, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>相手キャラ</div>
              {oppChar && (
                <button
                  onClick={() => setOppChar("")}
                  style={{ border: "none", background: "transparent", color: T.lose, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}
                >
                  <X size={12} /> クリア
                </button>
              )}
            </div>
            {oppChar && !showOppPicker && (
              <div style={{ fontSize: 17, fontWeight: 800, color: T.text, marginTop: 4 }}>{oppChar}</div>
            )}
            {showOppPicker ? (
              <div style={{ marginTop: 8 }}>
                <CharPicker value={oppChar} onChange={(c) => { setOppChar(c); setShowOppPicker(false); }} placeholder="相手を選択" recent={recOpp} autoOpen T={T} />
              </div>
            ) : (
              !showOppPicker && (
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {recOpp.slice(0, 3).map((c) => (
                    <button
                      key={c}
                      onClick={() => setOppChar(c)}
                      style={{
                        padding: "7px 14px", borderRadius: 10,
                        border: oppChar === c ? `2px solid ${T.accent}` : "none",
                        background: oppChar === c ? T.accentSoft : T.inp,
                        color: oppChar === c ? T.accent : T.text,
                        fontSize: 13, fontWeight: 600,
                        transition: "all .15s ease",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowOppPicker(true)}
                    style={{
                      padding: "7px 14px", borderRadius: 10, border: `1px dashed ${T.dimmer}`,
                      background: "transparent", color: T.sub, fontSize: 12, fontWeight: 600,
                    }}
                  >
                    他…
                  </button>
                </div>
              )
            )}
          </div>

          {oppChar && myChar && (
            <MatchupBadge myChar={myChar} oppChar={oppChar} matches={data.matches} T={T} />
          )}

          <div style={{ fontSize: 13, color: T.sub, textAlign: "center", margin: "12px 0 8px" }}>試合結果を選択</div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => selectRes("win")}
              style={{
                flex: 1, padding: "22px 0", border: "none", borderRadius: 16,
                background: "linear-gradient(135deg, #16A34A, #22C55E)",
                color: "#fff", fontSize: 20, fontWeight: 800,
                boxShadow: "0 4px 16px rgba(34,197,94,.3)",
                transition: "transform .1s ease",
              }}
            >
              勝ち
            </button>
            <button
              onClick={() => selectRes("lose")}
              style={{
                flex: 1, padding: "22px 0", border: "none", borderRadius: 16,
                background: "linear-gradient(135deg, #E11D48, #F43F5E)",
                color: "#fff", fontSize: 20, fontWeight: 800,
                boxShadow: "0 4px 16px rgba(244,63,94,.3)",
                transition: "transform .1s ease",
              }}
            >
              負け
            </button>
          </div>

          <button
            onClick={() => setPhase("endSession")}
            style={{ width: "100%", padding: 12, marginTop: 10, border: "none", background: "transparent", color: T.dim, fontSize: 13 }}
          >
            対戦を終了する
          </button>
        </div>
      )}

      {phase === "endSession" && (
        <div style={{ animation: "fadeUp .2s ease" }}>
          {todayCard}
          <div style={cd}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>終了時の戦闘力</div>
            <div style={{ fontSize: 12, color: T.dim, marginBottom: 8 }}>次回の開始戦闘力に引き継がれます</div>
            {pwrInput(pEnd, setPEnd, "終了時の戦闘力", true)}
          </div>
          <button
            onClick={() => {
              savePower(pStart, pEnd);
              setPhase("setup");
              setShowPowerEdit(false);
              setShowOppPicker(false);
            }}
            style={{
              width: "100%", padding: 16, border: "none", borderRadius: 14,
              background: T.accentGrad,
              color: "#fff", fontSize: 16, fontWeight: 800,
              boxShadow: T.accentGlow,
            }}
          >
            保存して終了
          </button>
          <button
            onClick={() => setPhase("fighting")}
            style={{ width: "100%", padding: 12, marginTop: 8, border: "none", background: "transparent", color: T.dim, fontSize: 13 }}
          >
            ← 対戦に戻る
          </button>
        </div>
      )}

      {phase === "pickOpp" && (
        <div style={{ animation: "fadeUp .2s ease" }}>
          <div style={{ ...cd, textAlign: "center", background: result === "win" ? T.winBg : T.loseBg }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4, color: result === "win" ? T.win : T.lose }}>
              {result === "win" ? "WIN" : "LOSE"}
            </div>
          </div>
          <div style={cd}>
            <CharPicker value={oppChar} onChange={setOppChar} label="相手キャラ" placeholder="相手を選択" recent={recOpp} T={T} />
            {recOpp.length > 0 && !oppChar && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {recOpp.slice(0, 3).map((c) => (
                  <button
                    key={c}
                    onClick={() => setOppChar(c)}
                    style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: T.inp, color: T.text, fontSize: 13, fontWeight: 600, transition: "all .15s ease" }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          {oppChar && myChar && (
            <MatchupBadge myChar={myChar} oppChar={oppChar} matches={data.matches} T={T} />
          )}
          <button onClick={confirmOpp} disabled={!oppChar} style={{ ...activeBtn(!oppChar), marginTop: 12 }}>
            記録する
          </button>
        </div>
      )}

      {phase === "postMatch" && (
        <div style={{ animation: "fadeUp .2s ease" }}>
          <div style={{ ...cd, textAlign: "center", padding: "20px 18px" }}>
            <div
              style={{
                display: "inline-block", padding: "6px 24px", borderRadius: 10,
                fontSize: 18, fontWeight: 800,
                background: lastRes === "win" ? T.winBg : T.loseBg,
                color: lastRes === "win" ? T.win : T.lose,
              }}
            >
              {lastRes === "win" ? "WIN" : "LOSE"}
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 12 }}>
              <FighterIcon name={myChar} size={32} />
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{myChar}</span>
              <span style={{ fontSize: 12, color: T.dim }}>vs</span>
              <FighterIcon name={oppChar} size={32} />
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{oppChar}</span>
            </div>
            <textarea
              value={memo}
              onChange={(e) => { setMemo(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
              onBlur={saveMemo}
              placeholder="メモ（任意）"
              rows={1}
              style={{
                width: "100%", marginTop: 12, padding: "10px 12px", background: T.inp,
                border: "none", borderRadius: 10, color: T.text, fontSize: 13,
                outline: "none", boxSizing: "border-box", textAlign: "center",
                resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.5,
              }}
            />
          </div>

          {myChar && oppChar && (
            <MatchupBadge myChar={myChar} oppChar={oppChar} matches={data.matches} T={T} />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => { saveMemo(); setPhase("fighting"); setShowOppPicker(false); }}
              style={{
                width: "100%", padding: 20, border: "none", borderRadius: 14,
                background: T.accentGrad,
                color: "#fff", fontSize: 17, fontWeight: 800,
                boxShadow: T.accentGlow,
              }}
            >
              連戦する
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { saveMemo(); setOppChar(""); setShowOppPicker(true); setPhase("fighting"); }}
                style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.text, fontSize: 14, fontWeight: 600, transition: "all .15s ease" }}
              >
                次の試合
              </button>
              <button
                onClick={() => { saveMemo(); setOppChar(""); setShowOppPicker(false); setPhase("setup"); }}
                style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.text, fontSize: 14, fontWeight: 600, transition: "all .15s ease" }}
              >
                自キャラを変える
              </button>
            </div>
          </div>
        </div>
      )}

      {!isPC && phase === "setup" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>直近の対戦</div>
          {recentMatchList}
        </div>
      )}
    </div>
  );

  if (!isPC) return mainContent;

  const statCard = (label, value, color) => (
    <div style={{ ...cd, flex: 1, marginBottom: 0, padding: "20px 24px", minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginBottom: 8, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: color || T.text, letterSpacing: -1, fontFamily: "'Chakra Petch', sans-serif" }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {statCard("今日の戦績", tM.length > 0 ? `${tW}W - ${tL}L` : "\u2014")}
        {statCard("勝率", tM.length > 0 ? `${winRate}%` : "\u2014", tM.length > 0 ? (winRate >= 60 ? T.win : winRate >= 40 ? "#FF9F0A" : T.lose) : T.dim)}
        {statCard("対戦数", `${tM.length}戦`)}
        {statCard("戦闘力変動", pwrDelta !== null ? `${pwrDelta >= 0 ? "+" : ""}${numFormat(pwrDelta)}` : todayDaily.start ? numFormat(todayDaily.start) : "\u2014", pwrDelta !== null ? (pwrDelta >= 0 ? T.win : T.lose) : T.dim)}
        {streak.count >= 2 && statCard(streak.type === "win" ? "連勝中" : "連敗中", `${streak.count}`, streak.type === "win" ? T.win : "#FF9F0A")}
      </div>

      {(goals.games || goals.winRate) && (
        <div style={{ ...cd, marginBottom: 24, padding: "18px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 12 }}>目標進捗</div>
          <div style={{ display: "flex", gap: 24 }}>
            {goals.games ? (
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.dim, marginBottom: 6 }}>
                  <span>対戦数 {tM.length}/{goals.games}</span>
                  <span>{Math.min(100, Math.round((tM.length / goals.games) * 100))}%</span>
                </div>
                <div style={{ height: 8, background: T.inp, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (tM.length / goals.games) * 100)}%`, height: "100%", background: T.win, borderRadius: 4, transition: "width .3s ease" }} />
                </div>
              </div>
            ) : null}
            {goals.winRate && tM.length > 0 ? (
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.dim, marginBottom: 6 }}>
                  <span>勝率目標 {goals.winRate}%</span>
                  <span style={{ color: winRate >= goals.winRate ? T.win : "#FF9F0A" }}>{winRate}%</span>
                </div>
                <div style={{ height: 8, background: T.inp, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (tW / tM.length) * 100)}%`, height: "100%", background: winRate >= goals.winRate ? T.win : "#FF9F0A", borderRadius: 4, transition: "width .3s ease" }} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 3, minWidth: 0 }}>
          {phase === "setup" && (
            <div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                  <div style={{ fontSize: 13, color: T.sub, marginBottom: 8, fontWeight: 600 }}>開始時の戦闘力</div>
                  {prevEnd && !todayDaily.start && <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>前回から自動引き継ぎ</div>}
                  {pwrInput(pStart, setPStart, "14,000,000", true)}
                </div>
                <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                  {showMyPicker ? (
                    <CharPicker value={myChar} onChange={(c) => { setMyChar(c); setShowMyPicker(false); }} label="使用キャラ" placeholder="ファイターを選択" recent={recMy} T={T} />
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, color: T.sub, marginBottom: 8, fontWeight: 600 }}>使用キャラ</div>
                      {myChar ? <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 8 }}>{myChar}</div> : <div style={{ fontSize: 15, color: T.dim, marginBottom: 8 }}>未選択</div>}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setShowMyPicker(true)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>変更</button>
                        {recMy.filter((c) => c !== myChar).slice(0, 3).map((c) => (
                          <button key={c} onClick={() => setMyChar(c)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: T.inp, color: T.text, fontSize: 13, fontWeight: 600 }}>{c}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={startBattle} disabled={!pStart || !myChar} style={{ ...activeBtn(!pStart || !myChar), marginTop: 16 }}>対戦開始</button>
            </div>
          )}

          {phase === "fighting" && (
            <div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                  <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 6 }}>開始戦闘力</div>
                  {pwrInput(pStart, setPStart, "", false)}
                </div>
                <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                  <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 6 }}>現在の戦闘力</div>
                  {pwrInput(pEnd, setPEnd, "終了後", false)}
                </div>
              </div>
              <div style={{ ...cd, padding: "20px 24px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>相手キャラ</div>
                  {oppChar && <button onClick={() => setOppChar("")} style={{ border: "none", background: "transparent", color: T.lose, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}><X size={12} /> クリア</button>}
                </div>
                {oppChar && !showOppPicker && <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8 }}>{oppChar}</div>}
                {showOppPicker ? (
                  <CharPicker value={oppChar} onChange={(c) => { setOppChar(c); setShowOppPicker(false); }} placeholder="相手を選択" recent={recOpp} T={T} />
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {recOpp.slice(0, 5).map((c) => (
                      <button key={c} onClick={() => setOppChar(c)} style={{ padding: "8px 16px", borderRadius: 10, border: oppChar === c ? `2px solid ${T.accent}` : "none", background: oppChar === c ? T.accentSoft : T.inp, color: oppChar === c ? T.accent : T.text, fontSize: 13, fontWeight: 600, transition: "all .15s ease" }}>{c}</button>
                    ))}
                    <button onClick={() => setShowOppPicker(true)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px dashed ${T.dimmer}`, background: "transparent", color: T.sub, fontSize: 13, fontWeight: 600 }}>他…</button>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <button onClick={() => selectRes("win")} style={{ flex: 1, padding: "24px 0", border: "none", borderRadius: 16, background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", fontSize: 22, fontWeight: 800, boxShadow: "0 4px 16px rgba(34,197,94,.3)" }}>勝ち</button>
                <button onClick={() => selectRes("lose")} style={{ flex: 1, padding: "24px 0", border: "none", borderRadius: 16, background: "linear-gradient(135deg, #E11D48, #F43F5E)", color: "#fff", fontSize: 22, fontWeight: 800, boxShadow: "0 4px 16px rgba(244,63,94,.3)" }}>負け</button>
              </div>
              <button onClick={() => { setPhase("setup"); setShowPowerEdit(false); setShowOppPicker(false); }} style={{ width: "100%", padding: 12, marginTop: 12, border: "none", background: "transparent", color: T.dim, fontSize: 13 }}>← 設定に戻る</button>
            </div>
          )}

          {phase === "pickOpp" && (
            <div>
              <div style={{ ...cd, textAlign: "center", padding: "24px", background: result === "win" ? T.winBg : T.loseBg, marginBottom: 16 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: result === "win" ? T.win : T.lose }}>{result === "win" ? "WIN" : "LOSE"}</div>
              </div>
              <div style={{ ...cd, padding: "20px 24px", marginBottom: 16 }}>
                <CharPicker value={oppChar} onChange={setOppChar} label="相手キャラ" placeholder="相手を選択" recent={recOpp} T={T} />
              </div>
              <button onClick={confirmOpp} disabled={!oppChar} style={activeBtn(!oppChar)}>記録する</button>
            </div>
          )}

          {phase === "postMatch" && (
            <div>
              <div style={{ ...cd, textAlign: "center", padding: "28px 24px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, letterSpacing: 1.5, fontFamily: "'Chakra Petch', sans-serif" }}>RECORDED</div>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{myChar}</span>
                  <span style={{ fontSize: 14, color: T.dim }}>vs</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{oppChar}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <span style={{ display: "inline-block", padding: "6px 24px", borderRadius: 10, fontSize: 16, fontWeight: 800, background: lastRes === "win" ? T.winBg : T.loseBg, color: lastRes === "win" ? T.win : T.lose }}>{lastRes === "win" ? "WIN" : "LOSE"}</span>
                </div>
                <textarea value={memo} onChange={(e) => { setMemo(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} onBlur={saveMemo} placeholder="メモ（任意）" rows={1} style={{ width: "100%", marginTop: 16, padding: "12px 16px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box", textAlign: "center", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.5 }} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => { saveMemo(); setPhase("fighting"); setShowOppPicker(false); }} style={{ flex: 2, padding: 20, border: "none", borderRadius: 14, background: T.accentGrad, color: "#fff", fontSize: 17, fontWeight: 800, boxShadow: T.accentGlow }}>連戦する</button>
                <button onClick={() => { saveMemo(); setOppChar(""); setShowOppPicker(true); setPhase("fighting"); }} style={{ flex: 1, padding: 20, border: `1px solid ${T.brd}`, borderRadius: 14, background: T.card, color: T.text, fontSize: 14, fontWeight: 600 }}>次の試合</button>
                <button onClick={() => { saveMemo(); setOppChar(""); setShowOppPicker(false); setPhase("setup"); }} style={{ flex: 1, padding: 20, border: `1px solid ${T.brd}`, borderRadius: 14, background: T.card, color: T.text, fontSize: 14, fontWeight: 600 }}>キャラ変更</button>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            flex: 2, minWidth: 300, background: T.card, borderRadius: 20,
            padding: "24px", border: `1px solid ${T.brd}`, boxShadow: T.sh,
            position: "sticky", top: 90, maxHeight: "calc(100vh - 140px)", overflowY: "auto",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>直近の対戦</div>
          <div style={{ fontSize: 12, color: T.dim, marginBottom: 16 }}>{formatDateWithDay(today())}  {tM.length}戦</div>
          {recentMatchList}
        </div>
      </div>
    </div>
  );
}
