import { useState, useMemo } from "react";
import { Trophy, X, ChevronUp, ChevronDown, Zap, Share2, Copy } from "lucide-react";
import CharPicker from "./CharPicker";
import MatchRow from "./MatchRow";
import MatchupBadge from "./MatchupBadge";
import FighterIcon from "./FighterIcon";
import { checkMilestones } from "../constants/milestones";
import {
  today,
  formatDateWithDay,
  formatDateLong,
  formatPower,
  rawPower,
  numFormat,
  percentStr,
  blurOnEnter,
  getStreak,
  recentChars,
  lastEndPower,
  getDayPowerSummary,
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
  const [newMilestones, setNewMilestones] = useState([]);
  const [prevMatchCount, setPrevMatchCount] = useState(data.matches.length);
  const [shareStatus, setShareStatus] = useState(null);

  const todayDaily = data.daily?.[today()] || {};
  const charPower = todayDaily.chars?.[myChar] || {};
  const prevEnd = lastEndPower(data.daily || {}, myChar);

  const [pStart, setPStart] = useState(
    charPower.start || todayDaily.start || prevEnd || "",
  );
  const [pEnd, setPEnd] = useState(charPower.end || todayDaily.end || "");

  const savePower = (s, e) => {
    const d = { ...data };
    if (!d.daily) d.daily = {};
    if (!d.daily[today()]) d.daily[today()] = {};
    const day = d.daily[today()];
    if (!day.chars) day.chars = {};
    day.chars[myChar] = {
      start: s ? Number(s) : null,
      end: e ? Number(e) : null,
    };
    if (!day.start) day.start = s ? Number(s) : null;
    if (e) day.end = Number(e);
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

  const switchCharPower = (charName) => {
    const cp = todayDaily.chars?.[charName] || {};
    const prev = lastEndPower(data.daily || {}, charName);
    setPStart(cp.start || prev || "");
    setPEnd(cp.end || "");
  };

  const startBattle = () => {
    if (!pStart || !myChar) return;
    const d = { ...data };
    if (!d.daily) d.daily = {};
    if (!d.daily[today()]) d.daily[today()] = {};
    const day = d.daily[today()];
    if (!day.chars) day.chars = {};
    day.chars[myChar] = {
      start: Number(pStart),
      end: pEnd ? Number(pEnd) : null,
    };
    d.settings = { myChar };
    onSave(d);
    setPhase("fighting");
  };

  const recordMatch = (newMatches, r) => {
    const newTotal = newMatches.length;
    const wins = newMatches.filter((m) => m.result === "win").length;
    const currentStreak = getStreak(newMatches);
    const winRatePct = newTotal > 0 ? Math.round((wins / newTotal) * 100) : 0;
    const achieved = checkMilestones(prevMatchCount, newTotal, currentStreak, winRatePct);
    setPrevMatchCount(newTotal);
    setNewMilestones(achieved);
    setLastRes(r);
    setMemo("");
    setPhase("postMatch");
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
      const newMatches = [...data.matches, m];
      onSave({ ...data, matches: newMatches });
      recordMatch(newMatches, r);
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
    const newMatches = [...data.matches, m];
    onSave({ ...data, matches: newMatches });
    recordMatch(newMatches, result);
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
    ? emptyMsg("対戦を始めましょう！上の「対戦開始」ボタンから記録できます")
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

  const statBox = (label, value, color) => (
    <div style={{ ...cd, flex: 1, padding: "14px 16px", marginBottom: 0, textAlign: "center" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: color || T.text, fontFamily: "'Chakra Petch', sans-serif" }}>{value}</div>
    </div>
  );

  const todayCard = (
    <div>
      {/* Date header */}
      <div style={{ fontSize: 13, fontWeight: 700, color: T.dim, letterSpacing: 1, marginBottom: 10, fontFamily: "'Chakra Petch', sans-serif" }}>
        TODAY  {formatDateWithDay(today())}
      </div>

      {tM.length > 0 ? (
        <div>
          {/* Top row: W:L and Win Rate */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ ...cd, flex: 1, padding: "18px 16px", marginBottom: 0, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginBottom: 8 }}>勝敗</div>
              <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, fontFamily: "'Chakra Petch', sans-serif" }}>
                <span style={{ color: T.win }}>{tW}</span>
                <span style={{ color: T.dimmer, fontSize: 20, margin: "0 4px" }}>:</span>
                <span style={{ color: T.lose }}>{tL}</span>
              </div>
              <div style={{ fontSize: 13, color: T.dim, marginTop: 6 }}>{tM.length}戦</div>
            </div>
            <div style={{ ...cd, flex: 1, padding: "18px 16px", marginBottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginBottom: 8 }}>勝率</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: T.text, fontFamily: "'Chakra Petch', sans-serif" }}>
                {percentStr(tW, tM.length)}
              </div>
            </div>
          </div>

          {/* Second row: streak + power */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            {streak.count >= 2 && (
              <div
                style={{
                  ...cd,
                  flex: 1,
                  padding: "14px 16px",
                  marginBottom: 0,
                  background: streak.type === "win" ? T.win : T.lose,
                  color: "#fff",
                  border: "none",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginBottom: 6 }}>
                  {streak.type === "win" ? "連勝中" : "連敗中"}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Zap size={18} fill="#fff" />
                  <span style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif" }}>
                    {streak.count}
                  </span>
                </div>
              </div>
            )}
            {pwrDelta !== null ? (
              statBox("戦闘力変動", `${pwrDelta >= 0 ? "+" : ""}${numFormat(pwrDelta)}`, pwrDelta >= 0 ? T.win : T.lose)
            ) : todayDaily.start ? (
              statBox("戦闘力", numFormat(todayDaily.start), T.text)
            ) : null}
          </div>
        </div>
      ) : (
        <div style={{ ...cd, padding: "28px 20px", textAlign: "center", marginBottom: 10 }}>
          <Trophy size={32} color={T.dimmer} style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: T.dim }}>対戦データなし</div>
        </div>
      )}

      {/* Goals */}
      {(goals.games || goals.winRate) ? (
        <div style={{ ...cd, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.dim }}>目標</span>
            <button
              onClick={async () => {
                const lines = [`【SMASH TRACKER】今日の目標`];
                if (goals.games) lines.push(`${tM.length}/${goals.games}戦 達成${tM.length >= goals.games ? "!" : "まであと" + (goals.games - tM.length) + "戦"}`);
                if (goals.winRate && tM.length > 0) lines.push(`勝率 ${winRate}% / 目標${goals.winRate}% ${winRate >= goals.winRate ? "達成!" : ""}`);
                if (!goals.games && !goals.winRate) return;
                lines.push("#SmashTracker #スマブラ", "https://ty8mdohsu50-gif.github.io/smash-tracker/");
                const text = lines.join("\n");
                if (navigator.share) {
                  try { await navigator.share({ text }); } catch (_) { /* cancelled */ }
                } else {
                  try { await navigator.clipboard.writeText(text); } catch (_) { /* */ }
                }
              }}
              style={{ border: "none", background: T.inp, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}
            >
              <Share2 size={12} /> シェア
            </button>
          </div>
          {goals.games ? (
            <div style={{ marginBottom: goals.winRate && tM.length > 0 ? 10 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.sub, marginBottom: 5, fontWeight: 600 }}>
                <span>対戦数 {goals.games}戦</span>
                <span style={{ color: T.text, fontWeight: 700 }}>{tM.length}/{goals.games}</span>
              </div>
              <div style={{ height: 6, background: T.inp, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (tM.length / goals.games) * 100)}%`, height: "100%", background: T.win, borderRadius: 3, transition: "width .3s ease" }} />
              </div>
            </div>
          ) : null}
          {goals.winRate && tM.length > 0 ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.sub, marginBottom: 5, fontWeight: 600 }}>
                <span>勝率目標 {goals.winRate}%</span>
                <span style={{ color: winRate >= goals.winRate ? T.win : T.lose, fontWeight: 700 }}>{winRate}%</span>
              </div>
              <div style={{ height: 6, background: T.inp, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, (tW / tM.length) * 100)}%`, height: "100%", background: winRate >= goals.winRate ? T.win : T.lose, borderRadius: 3, transition: "width .3s ease" }} />
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
          {data.matches.length === 0 && (
            <div
              style={{
                background: T.accentSoft,
                borderRadius: 16,
                padding: "18px 20px",
                marginBottom: 12,
                border: `1px solid ${T.accent}33`,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: T.accent, marginBottom: 10 }}>SMASH TRACKERへようこそ</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "開始時の戦闘力を入力",
                  "使用キャラを選択",
                  "「対戦開始」で記録スタート",
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: T.accent, color: "#fff",
                        fontSize: 12, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                onChange={(c) => { setMyChar(c); switchCharPower(c); setShowMyPicker(false); }}
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
                      onClick={() => { setMyChar(c); switchCharPower(c); }}
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
          {/* Status bar - larger */}
          <div
            style={{
              ...cd,
              padding: "14px 16px",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FighterIcon name={myChar} size={36} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{myChar}</div>
                  {tM.length > 0 && (
                    <div style={{ fontSize: 13, color: T.dim, marginTop: 2 }}>
                      {tM.length}戦 {percentStr(tW, tM.length)}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {tM.length > 0 && (
                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif" }}>
                    <span style={{ color: T.win }}>{tW}</span>
                    <span style={{ color: T.dimmer, fontSize: 16, margin: "0 4px" }}>:</span>
                    <span style={{ color: T.lose }}>{tL}</span>
                  </div>
                )}
                <button
                  onClick={() => setShowPowerEdit(!showPowerEdit)}
                  style={{
                    border: "none", background: T.inp, borderRadius: 8,
                    padding: "4px 10px", fontSize: 13, fontWeight: 600,
                    color: T.sub, display: "flex", alignItems: "center", gap: 4, marginTop: 4,
                  }}
                >
                  {numFormat(pStart)}{pEnd ? " → " + numFormat(pEnd) : ""}
                  {showPowerEdit ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            </div>
          </div>

          {showPowerEdit && (
            <div style={{ ...cd, animation: "fadeUp .15s ease" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: T.sub, marginBottom: 4, fontWeight: 600 }}>開始</div>
                  {pwrInput(pStart, setPStart, "", false)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: T.sub, marginBottom: 4, fontWeight: 600 }}>現在</div>
                  {pwrInput(pEnd, setPEnd, "終了後", false)}
                </div>
              </div>
            </div>
          )}

          {/* Opponent char selection - FIRST */}
          <div style={{ ...cd, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 15, color: T.text, fontWeight: 700 }}>相手キャラ</div>
              {oppChar && (
                <button
                  onClick={() => setOppChar("")}
                  style={{ border: "none", background: T.loseBg, color: T.lose, fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <X size={14} /> クリア
                </button>
              )}
            </div>
            {oppChar && !showOppPicker && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <FighterIcon name={oppChar} size={32} />
                <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{oppChar}</span>
              </div>
            )}
            {showOppPicker ? (
              <div>
                <CharPicker value={oppChar} onChange={(c) => { setOppChar(c); setShowOppPicker(false); }} placeholder="相手を選択" recent={recOpp} autoOpen T={T} />
              </div>
            ) : (
              !showOppPicker && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {recOpp.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      onClick={() => setOppChar(c)}
                      style={{
                        padding: "10px 14px 10px 8px", borderRadius: 12,
                        border: oppChar === c ? `2px solid ${T.accent}` : `1px solid ${T.brd}`,
                        background: oppChar === c ? T.accentSoft : T.card,
                        color: oppChar === c ? T.accent : T.text,
                        fontSize: 14, fontWeight: 600,
                        display: "flex", alignItems: "center", gap: 6,
                        transition: "all .15s ease",
                      }}
                    >
                      <FighterIcon name={c} size={24} />
                      {c}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowOppPicker(true)}
                    style={{
                      padding: "10px 18px", borderRadius: 12, border: `1px dashed ${T.dimmer}`,
                      background: "transparent", color: T.sub, fontSize: 14, fontWeight: 600,
                    }}
                  >
                    他...
                  </button>
                </div>
              )
            )}
          </div>

          {oppChar && myChar && (
            <MatchupBadge myChar={myChar} oppChar={oppChar} matches={data.matches} T={T} />
          )}

          {/* Win/Lose buttons - SECOND, larger */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => selectRes("win")}
                style={{
                  flex: 1, padding: "26px 0", border: "none", borderRadius: 16,
                  background: "linear-gradient(135deg, #16A34A, #22C55E)",
                  color: "#fff", fontSize: 22, fontWeight: 900,
                  boxShadow: "0 4px 16px rgba(34,197,94,.3)",
                }}
              >
                勝ち
              </button>
              <button
                onClick={() => selectRes("lose")}
                style={{
                  flex: 1, padding: "26px 0", border: "none", borderRadius: 16,
                  background: "linear-gradient(135deg, #E11D48, #F43F5E)",
                  color: "#fff", fontSize: 22, fontWeight: 900,
                  boxShadow: "0 4px 16px rgba(244,63,94,.3)",
                }}
              >
                負け
              </button>
            </div>
          </div>

          <button
            onClick={() => setPhase("endSession")}
            style={{ width: "100%", padding: 14, marginTop: 12, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.sub, fontSize: 14, fontWeight: 600 }}
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
          <div style={{ ...cd, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>VIP到達</div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>シェア時に表示されます</div>
            </div>
            <button
              onClick={() => {
                const d = { ...data };
                if (!d.daily) d.daily = {};
                if (!d.daily[today()]) d.daily[today()] = {};
                d.daily[today()] = { ...d.daily[today()], vip: !d.daily[today()]?.vip };
                onSave(d);
              }}
              style={{
                width: 54, height: 30, borderRadius: 15, border: "none",
                background: todayDaily.vip ? T.accent : "#555",
                position: "relative", flexShrink: 0,
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 13, background: "#fff",
                position: "absolute", top: 2, left: todayDaily.vip ? 26 : 2,
                transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
              }} />
            </button>
          </div>
          <button
            onClick={() => {
              savePower(pStart, pEnd);
              setShareStatus(null);
              setPhase("summary");
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

      {phase === "summary" && (() => {
        const topOpp = (() => {
          const cnt = {};
          tM.forEach((m) => { cnt[m.oppChar] = (cnt[m.oppChar] || 0) + 1; });
          const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
          return sorted[0] ? sorted[0][0] : null;
        })();
        const pDelta = pEnd && pStart ? Number(pEnd) - Number(pStart) : null;
        const ss = { showChar: true, showOppChar: true, showPower: true, showRecord: true, ...(data.shareSettings || {}) };
        const shareLines = [`【SMASH TRACKER】${formatDateLong(today())}の結果`];
        if (ss.showChar && myChar) shareLines.push(`使用: ${myChar}`);
        if (ss.showRecord) shareLines.push(`${tW}勝${tL}敗（勝率${percentStr(tW, tM.length)}）`);
        if (ss.showOppChar && topOpp) shareLines.push(`最多対戦: ${topOpp}`);
        if (ss.showPower && pStart) shareLines.push(`戦闘力: ${numFormat(Number(pStart))} → ${numFormat(Number(pEnd || pStart))}${pDelta !== null ? ` (${pDelta >= 0 ? "+" : ""}${numFormat(pDelta)})` : ""}`);
        if (todayDaily.vip) shareLines.push("VIP到達!");
        shareLines.push("#SmashTracker #スマブラ", "https://ty8mdohsu50-gif.github.io/smash-tracker/");
        const shareText = shareLines.join("\n");

        const handleShare = async () => {
          if (navigator.share) {
            try {
              await navigator.share({ text: shareText });
            } catch (_) { /* user cancelled */ }
          } else {
            try {
              await navigator.clipboard.writeText(shareText);
              setShareStatus("copied");
              setTimeout(() => setShareStatus(null), 2000);
            } catch (_) {
              setShareStatus("error");
              setTimeout(() => setShareStatus(null), 2000);
            }
          }
        };

        return (
          <div style={{ animation: "fadeUp .25s ease" }}>
            <div
              style={{
                background: T.tBg,
                borderRadius: 20,
                padding: "28px 22px",
                marginBottom: 14,
                boxShadow: T.accentGlow,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 2, marginBottom: 6, fontFamily: "'Chakra Petch', sans-serif" }}>
                TODAY'S SUMMARY
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 20 }}>
                {formatDateLong(today())}
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>勝敗</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>
                    {tW}<span style={{ fontSize: 20, opacity: 0.6, margin: "0 4px" }}>:</span>{tL}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{tM.length}試合</div>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>勝率</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>
                    {percentStr(tW, tM.length)}
                  </div>
                </div>
              </div>

              {topOpp && (
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>最多対戦相手</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginLeft: "auto" }}>{topOpp}</div>
                </div>
              )}

              {pStart && (
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>戦闘力</div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{numFormat(Number(pStart))}</span>
                    {pEnd && (
                      <>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>→</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{numFormat(Number(pEnd))}</span>
                        {pDelta !== null && (
                          <span style={{
                            fontSize: 13, fontWeight: 800,
                            color: pDelta >= 0 ? "#4ade80" : "#f87171",
                            marginLeft: 4,
                          }}>
                            ({pDelta >= 0 ? "+" : ""}{numFormat(pDelta)})
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {streak.count >= 2 && (
                <div style={{ marginTop: 12, background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={16} color={streak.type === "win" ? "#4ade80" : "#f87171"} fill={streak.type === "win" ? "#4ade80" : "#f87171"} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {streak.count}{streak.type === "win" ? "連勝中" : "連敗中"}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button
                onClick={handleShare}
                style={{
                  flex: 1, padding: "14px 0", border: "none", borderRadius: 12,
                  background: T.accentGrad, color: "#fff", fontSize: 14, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: T.accentGlow,
                }}
              >
                {shareStatus === "copied" ? <><Copy size={16} /> コピー済み</> : shareStatus === "error" ? "失敗" : <><Share2 size={16} /> シェア</>}
              </button>
              <button
                onClick={() => {
                  setPhase("setup");
                  setShowPowerEdit(false);
                  setShowOppPicker(false);
                }}
                style={{
                  flex: 1, padding: "14px 0", border: `1px solid ${T.brd}`, borderRadius: 12,
                  background: T.card, color: T.text, fontSize: 14, fontWeight: 700,
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        );
      })()}

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
                animation: "popIn .3s ease",
              }}
            >
              {lastRes === "win" ? "WIN" : "LOSE"}
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 12, animation: "slideUp .3s ease .1s both" }}>
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

          {newMilestones.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "popIn .4s ease .2s both" }}>
              {newMilestones.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: T.accentGrad,
                    borderRadius: 14,
                    padding: "14px 18px",
                    textAlign: "center",
                    boxShadow: T.accentGlow,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: 1.5, marginBottom: 4 }}>
                    MILESTONE UNLOCKED
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
                    {m.condition}
                  </div>
                </div>
              ))}
            </div>
          )}

          {myChar && oppChar && (
            <div style={{ animation: "slideUp .3s ease .2s both" }}>
              <MatchupBadge myChar={myChar} oppChar={oppChar} matches={data.matches} T={T} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, animation: "slideUp .3s ease .3s both" }}>
            <button
              onClick={() => { saveMemo(); setNewMilestones([]); setPhase("fighting"); setShowOppPicker(false); }}
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
                onClick={() => { saveMemo(); setNewMilestones([]); setOppChar(""); setShowOppPicker(true); setPhase("fighting"); }}
                style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.text, fontSize: 14, fontWeight: 600, transition: "all .15s ease" }}
              >
                次の試合
              </button>
              <button
                onClick={() => { saveMemo(); setNewMilestones([]); setOppChar(""); setShowOppPicker(false); setPhase("setup"); }}
                style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.text, fontSize: 14, fontWeight: 600, transition: "all .15s ease" }}
              >
                自キャラを変える
              </button>
            </div>
            <button
              onClick={() => { saveMemo(); setNewMilestones([]); setPhase("endSession"); }}
              style={{ width: "100%", padding: 14, marginTop: 8, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.sub, fontSize: 14, fontWeight: 600 }}
            >
              対戦を終了する
            </button>
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
              {data.matches.length === 0 && (
                <div
                  style={{
                    background: T.accentSoft,
                    borderRadius: 16,
                    padding: "20px 24px",
                    marginBottom: 16,
                    border: `1px solid ${T.accent}33`,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.accent, marginBottom: 12 }}>SMASH TRACKERへようこそ</div>
                  <div style={{ display: "flex", gap: 24 }}>
                    {[
                      "開始時の戦闘力を入力",
                      "使用キャラを選択",
                      "「対戦開始」で記録スタート",
                    ].map((step, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 24, height: 24, borderRadius: "50%",
                            background: T.accent, color: "#fff",
                            fontSize: 13, fontWeight: 800,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                  <div style={{ fontSize: 13, color: T.sub, marginBottom: 8, fontWeight: 600 }}>開始時の戦闘力</div>
                  {prevEnd && !todayDaily.start && <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>前回から自動引き継ぎ</div>}
                  {pwrInput(pStart, setPStart, "14,000,000", true)}
                </div>
                <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                  {showMyPicker ? (
                    <CharPicker value={myChar} onChange={(c) => { setMyChar(c); switchCharPower(c); setShowMyPicker(false); }} label="使用キャラ" placeholder="ファイターを選択" recent={recMy} T={T} />
                  ) : (
                    <div>
                      <div style={{ fontSize: 13, color: T.sub, marginBottom: 8, fontWeight: 600 }}>使用キャラ</div>
                      {myChar ? <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 8 }}>{myChar}</div> : <div style={{ fontSize: 15, color: T.dim, marginBottom: 8 }}>未選択</div>}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setShowMyPicker(true)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>変更</button>
                        {recMy.filter((c) => c !== myChar).slice(0, 3).map((c) => (
                          <button key={c} onClick={() => { setMyChar(c); switchCharPower(c); }} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: T.inp, color: T.text, fontSize: 13, fontWeight: 600 }}>{c}</button>
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
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => { setShareStatus(null); setPhase("endSession"); }} style={{ flex: 1, padding: 12, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>対戦を終了する</button>
                <button onClick={() => { setPhase("setup"); setShowPowerEdit(false); setShowOppPicker(false); }} style={{ flex: 1, padding: 12, border: "none", background: "transparent", color: T.dim, fontSize: 13 }}>← 設定に戻る</button>
              </div>
            </div>
          )}

          {phase === "endSession" && (
            <div style={{ animation: "fadeUp .2s ease" }}>
              <div style={{ ...cd, padding: "20px 24px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>終了時の戦闘力</div>
                <div style={{ fontSize: 12, color: T.dim, marginBottom: 10 }}>次回の開始戦闘力に引き継がれます</div>
                {pwrInput(pEnd, setPEnd, "終了時の戦闘力", true)}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  onClick={() => { savePower(pStart, pEnd); setShareStatus(null); setPhase("summary"); setShowPowerEdit(false); setShowOppPicker(false); }}
                  style={{ flex: 2, padding: 16, border: "none", borderRadius: 12, background: T.accentGrad, color: "#fff", fontSize: 15, fontWeight: 800, boxShadow: T.accentGlow }}
                >
                  保存して終了
                </button>
                <button
                  onClick={() => setPhase("fighting")}
                  style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}
                >
                  ← 対戦に戻る
                </button>
              </div>
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
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 8, animation: "slideUp .3s ease .1s both" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{myChar}</span>
                  <span style={{ fontSize: 14, color: T.dim }}>vs</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{oppChar}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <span style={{ display: "inline-block", padding: "6px 24px", borderRadius: 10, fontSize: 16, fontWeight: 800, background: lastRes === "win" ? T.winBg : T.loseBg, color: lastRes === "win" ? T.win : T.lose, animation: "popIn .3s ease" }}>{lastRes === "win" ? "WIN" : "LOSE"}</span>
                </div>
                <textarea value={memo} onChange={(e) => { setMemo(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} onBlur={saveMemo} placeholder="メモ（任意）" rows={1} style={{ width: "100%", marginTop: 16, padding: "12px 16px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box", textAlign: "center", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.5 }} />
              </div>
              {newMilestones.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, animation: "popIn .4s ease .2s both" }}>
                  {newMilestones.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        background: T.accentGrad, borderRadius: 14,
                        padding: "16px 24px", textAlign: "center", boxShadow: T.accentGlow,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: 1.5, marginBottom: 4 }}>MILESTONE UNLOCKED</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>{m.condition}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, animation: "slideUp .3s ease .3s both" }}>
                <button onClick={() => { saveMemo(); setNewMilestones([]); setPhase("fighting"); setShowOppPicker(false); }} style={{ flex: 2, padding: 20, border: "none", borderRadius: 14, background: T.accentGrad, color: "#fff", fontSize: 17, fontWeight: 800, boxShadow: T.accentGlow }}>連戦する</button>
                <button onClick={() => { saveMemo(); setNewMilestones([]); setOppChar(""); setShowOppPicker(true); setPhase("fighting"); }} style={{ flex: 1, padding: 20, border: `1px solid ${T.brd}`, borderRadius: 14, background: T.card, color: T.text, fontSize: 14, fontWeight: 600 }}>次の試合</button>
                <button onClick={() => { saveMemo(); setNewMilestones([]); setOppChar(""); setShowOppPicker(false); setPhase("setup"); }} style={{ flex: 1, padding: 20, border: `1px solid ${T.brd}`, borderRadius: 14, background: T.card, color: T.text, fontSize: 14, fontWeight: 600 }}>キャラ変更</button>
              </div>
            </div>
          )}

          {phase === "summary" && (() => {
            const topOpp = (() => {
              const cnt = {};
              tM.forEach((m) => { cnt[m.oppChar] = (cnt[m.oppChar] || 0) + 1; });
              const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
              return sorted[0] ? sorted[0][0] : null;
            })();
            const pDelta = pEnd && pStart ? Number(pEnd) - Number(pStart) : null;
            const ss = { showChar: true, showOppChar: true, showPower: true, showRecord: true, ...(data.shareSettings || {}) };
            const shareLines = [`【SMASH TRACKER】${formatDateLong(today())}の結果`];
            if (ss.showChar && myChar) shareLines.push(`使用: ${myChar}`);
            if (ss.showRecord) shareLines.push(`${tW}勝${tL}敗（勝率${percentStr(tW, tM.length)}）`);
            if (ss.showOppChar && topOpp) shareLines.push(`最多対戦: ${topOpp}`);
            if (ss.showPower && pStart) shareLines.push(`戦闘力: ${numFormat(Number(pStart))} → ${numFormat(Number(pEnd || pStart))}${pDelta !== null ? ` (${pDelta >= 0 ? "+" : ""}${numFormat(pDelta)})` : ""}`);
            if (todayDaily.vip) shareLines.push("VIP到達!");
            shareLines.push("#SmashTracker #スマブラ", "https://ty8mdohsu50-gif.github.io/smash-tracker/");
            const shareText = shareLines.join("\n");

            const handleShare = async () => {
              if (navigator.share) {
                try { await navigator.share({ text: shareText }); } catch (_) { /* cancelled */ }
              } else {
                try {
                  await navigator.clipboard.writeText(shareText);
                  setShareStatus("copied");
                  setTimeout(() => setShareStatus(null), 2000);
                } catch (_) {
                  setShareStatus("error");
                  setTimeout(() => setShareStatus(null), 2000);
                }
              }
            };

            return (
              <div style={{ animation: "fadeUp .25s ease" }}>
                <div
                  style={{
                    background: T.tBg, borderRadius: 20, padding: "32px 28px",
                    marginBottom: 20, boxShadow: T.accentGlow,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 2, marginBottom: 6, fontFamily: "'Chakra Petch', sans-serif" }}>
                    TODAY'S SUMMARY
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 24 }}>
                    {formatDateLong(today())}
                  </div>

                  <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>勝敗</div>
                      <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>
                        {tW}<span style={{ fontSize: 24, opacity: 0.6, margin: "0 6px" }}>:</span>{tL}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>{tM.length}試合</div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>勝率</div>
                      <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>
                        {percentStr(tW, tM.length)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {topOpp && (
                      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>最多対戦相手</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginLeft: "auto" }}>{topOpp}</span>
                      </div>
                    )}
                    {pStart && (
                      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>戦闘力</span>
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{numFormat(Number(pStart))}</span>
                          {pEnd && (
                            <>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>→</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{numFormat(Number(pEnd))}</span>
                              {pDelta !== null && (
                                <span style={{ fontSize: 13, fontWeight: 800, color: pDelta >= 0 ? "#4ade80" : "#f87171", marginLeft: 4 }}>
                                  ({pDelta >= 0 ? "+" : ""}{numFormat(pDelta)})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {streak.count >= 2 && (
                      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <Zap size={16} color={streak.type === "win" ? "#4ade80" : "#f87171"} fill={streak.type === "win" ? "#4ade80" : "#f87171"} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                          {streak.count}{streak.type === "win" ? "連勝中" : "連敗中"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={handleShare}
                    style={{
                      flex: 1, padding: "16px 0", border: "none", borderRadius: 12,
                      background: T.accentGrad, color: "#fff", fontSize: 15, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: T.accentGlow,
                    }}
                  >
                    {shareStatus === "copied" ? <><Copy size={16} /> コピー済み</> : shareStatus === "error" ? "失敗" : <><Share2 size={16} /> シェア</>}
                  </button>
                  <button
                    onClick={() => { setPhase("setup"); setShowPowerEdit(false); setShowOppPicker(false); }}
                    style={{
                      flex: 1, padding: "16px 0", border: `1px solid ${T.brd}`, borderRadius: 12,
                      background: T.card, color: T.text, fontSize: 15, fontWeight: 700,
                    }}
                  >
                    閉じる
                  </button>
                </div>
              </div>
            );
          })()}
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
