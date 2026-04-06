import { useState, useMemo, useRef } from "react";
import { Trophy, X, ChevronUp, ChevronDown, Zap, Share2, Copy } from "lucide-react";
import CharPicker from "./CharPicker";
import MatchRow from "./MatchRow";
import MatchupBadge from "./MatchupBadge";
import SharePopup from "./SharePopup";
import FighterIcon from "./FighterIcon";
import { checkMilestones } from "../constants/milestones";
import { fighterName } from "../constants/fighters";
import { useI18n } from "../i18n/index.jsx";
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

export default function BattleTab({ data, onSave, T, isPC, onOpenSettings }) {
  const { t, lang } = useI18n();
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
  const [sharePopupText, setSharePopupText] = useState(null);
  // editGoals state removed - goals always visible
  const [gGames, setGG] = useState(String(data.goals?.games || ""));
  const [gWR, setGWR] = useState(String(data.goals?.winRate || ""));

  const doShare = async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (_) { /* cancelled */ }
    }
    setSharePopupText(text);
  };

  const todayDaily = data.daily?.[today()] || {};
  const charPower = todayDaily.chars?.[myChar] || {};
  const prevEnd = lastEndPower(data.daily || {}, myChar);

  const [pStart, setPStart] = useState(
    charPower.end || charPower.start || prevEnd || (myChar ? 0 : ""),
  );
  const [pEnd, setPEnd] = useState(charPower.end || todayDaily.end || "");

  // Update power when returning to setup (after endSession/summary)
  const prevPhase = useRef(phase);
  if (prevPhase.current !== phase) {
    if (phase === "setup" && myChar) {
      const daily = data.daily?.[today()] || {};
      const cp = daily.chars?.[myChar] || {};
      const pe = lastEndPower(data.daily || {}, myChar);
      const newStart = cp.end || cp.start || pe || 0;
      if (newStart !== pStart) setPStart(newStart);
      setPEnd("");
    }
    prevPhase.current = phase;
  }

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

  const saveGoals = () =>
    onSave({
      ...data,
      goals: { games: parseInt(gGames) || 0, winRate: parseInt(gWR) || 0 },
    });

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
    const daily = data.daily?.[today()] || {};
    const cp = daily.chars?.[charName] || {};
    const prev = lastEndPower(data.daily || {}, charName);
    setPStart(cp.start || prev || 0);
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
        power: pEnd ? Number(pEnd) : (pStart ? Number(pStart) : null),
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
      power: pEnd ? Number(pEnd) : (pStart ? Number(pStart) : null),
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

  const goalInputStyle = {
    flex: 1, padding: "12px 14px", background: T.inp, border: "none",
    borderRadius: 10, color: T.text, fontSize: 16, fontWeight: 700,
    outline: "none", boxSizing: "border-box", fontFamily: "'Chakra Petch', sans-serif",
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
    ? emptyMsg(t("battle.startMatching"))
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
        {t("battle.today")}  {formatDateWithDay(today())}
      </div>

      {tM.length > 0 ? (
        <div>
          {/* Top row: W:L and Win Rate */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ ...cd, flex: 1, padding: "18px 16px", marginBottom: 0, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginBottom: 8 }}>{t("battle.winLoss")}</div>
              <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, fontFamily: "'Chakra Petch', sans-serif" }}>
                <span style={{ color: T.win }}>{tW}</span>
                <span style={{ color: T.dimmer, fontSize: 20, margin: "0 4px" }}>:</span>
                <span style={{ color: T.lose }}>{tL}</span>
              </div>
              <div style={{ fontSize: 13, color: T.dim, marginTop: 6 }}>{tM.length}{t("battle.matches")}</div>
            </div>
            <div style={{ ...cd, flex: 1, padding: "18px 16px", marginBottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginBottom: 8 }}>{t("battle.winRate")}</div>
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
                  {streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose")}
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
          <div style={{ fontSize: 16, fontWeight: 600, color: T.dim }}>{t("battle.noData")}</div>
        </div>
      )}

      {/* Goals - always show input + progress */}
      <div style={{ ...cd, padding: "16px 18px", marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t("settings.todayGoal")}</span>
          {(goals.games || goals.winRate) && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const lines = [`【SMASH TRACKER】${t("share.todayGoal")}`];
                if (goals.games) lines.push(`${tM.length}/${goals.games}${t("settings.gamesUnit")} ${tM.length >= goals.games ? t("share.achieved") : ""}`);
                if (goals.winRate && tM.length > 0) lines.push(`${t("settings.winRate")} ${winRate}% / ${goals.winRate}% ${winRate >= goals.winRate ? t("share.achieved") : ""}`);
                lines.push("", "#スマブラ #SmashTracker #スマトラ", "https://smash-tracker.pages.dev/");
                doShare(lines.join("\n"));
              }}
              style={{ border: "none", background: T.inp, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}
            >
              <Share2 size={12} /> {t("battle.share")}
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: isPC ? "row" : "column", gap: 8, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <span style={{ fontSize: 12, color: T.sub, fontWeight: 600, minWidth: 42 }}>{t("settings.games")}</span>
            <input type="number" value={gGames} onChange={(e) => setGG(e.target.value)} onBlur={saveGoals} placeholder="10" style={{ ...goalInputStyle, padding: "8px 10px", fontSize: 14 }} />
            <span style={{ fontSize: 12, color: T.sub }}>{t("settings.gamesUnit")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <span style={{ fontSize: 12, color: T.sub, fontWeight: 600, minWidth: 42 }}>{t("settings.winRate")}</span>
            <input type="number" value={gWR} onChange={(e) => setGWR(e.target.value)} onBlur={saveGoals} placeholder="60" style={{ ...goalInputStyle, padding: "8px 10px", fontSize: 14 }} />
            <span style={{ fontSize: 12, color: T.sub }}>{t("settings.winRateUnit")}</span>
          </div>
        </div>
        {goals.games ? (
          <div style={{ marginBottom: goals.winRate && tM.length > 0 ? 8 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 4, fontWeight: 600 }}>
              <span>{tM.length}/{goals.games}{t("settings.gamesUnit")}</span>
              <span style={{ color: T.text, fontWeight: 700 }}>{Math.min(100, Math.round((tM.length / goals.games) * 100))}%</span>
            </div>
            <div style={{ height: 5, background: T.inp, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (tM.length / goals.games) * 100)}%`, height: "100%", background: T.win, borderRadius: 3, transition: "width .3s ease" }} />
            </div>
          </div>
        ) : null}
        {goals.winRate && tM.length > 0 ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 4, fontWeight: 600 }}>
              <span>{t("settings.winRate")} {goals.winRate}%</span>
              <span style={{ color: winRate >= goals.winRate ? T.win : T.lose, fontWeight: 700 }}>{winRate}%</span>
            </div>
            <div style={{ height: 5, background: T.inp, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (tW / tM.length) * 100)}%`, height: "100%", background: winRate >= goals.winRate ? T.win : T.lose, borderRadius: 3, transition: "width .3s ease" }} />
            </div>
          </div>
        ) : null}
      </div>
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
              <div style={{ fontSize: 15, fontWeight: 800, color: T.accent, marginBottom: 10 }}>{t("battle.welcome")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  t("battle.step1"),
                  t("battle.step2"),
                  t("battle.step3"),
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

          {/* 1. キャラ選択（先） */}
          <div style={{ ...cd, paddingBottom: 18 }}>
            {showMyPicker ? (
              <CharPicker
                value={myChar}
                onChange={(c) => { setMyChar(c); switchCharPower(c); setShowMyPicker(false); }}
                label="使用キャラ"
                placeholder="ファイターを選択"
                recent={recMy}
                autoOpen
                T={T}
              />
            ) : (
              <div>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{t("battle.selectChar")}</div>
                {myChar ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <FighterIcon name={myChar} size={32} />
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{fighterName(myChar, lang)}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 15, color: T.dim, marginBottom: 4 }}>{t("battle.notSelected")}</div>
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
                    {t("battle.change")}
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
                      {fighterName(c, lang)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. 戦闘力入力（キャラ選択後に表示） */}
          {myChar && (
            <div style={cd}>
              <div style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}>
                {fighterName(myChar, lang)}{t("battle.startPower")}
              </div>
              {prevEnd && !charPower.start && (
                <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>{t("battle.autoCarryOver")}</div>
              )}
              {pwrInput(pStart, setPStart, "14,000,000", true)}
            </div>
          )}

          <button onClick={startBattle} disabled={!pStart || !myChar} style={activeBtn(!pStart || !myChar)}>
            {t("battle.startBattle")}
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
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{fighterName(myChar, lang)}</div>
                  {tM.length > 0 && (
                    <div style={{ fontSize: 13, color: T.dim, marginTop: 2 }}>
                      {tM.length}{t("battle.matches")} {percentStr(tW, tM.length)}
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
              <div style={{ fontSize: 15, color: T.text, fontWeight: 700 }}>{t("battle.oppChar")}</div>
              {oppChar && (
                <button
                  onClick={() => setOppChar("")}
                  style={{ border: "none", background: T.loseBg, color: T.lose, fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <X size={14} /> {t("battle.clear")}
                </button>
              )}
            </div>
            {oppChar && !showOppPicker && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <FighterIcon name={oppChar} size={32} />
                <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{fighterName(oppChar, lang)}</span>
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
                      {fighterName(c, lang)}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowOppPicker(true)}
                    style={{
                      padding: "10px 18px", borderRadius: 12, border: `1px dashed ${T.dimmer}`,
                      background: "transparent", color: T.sub, fontSize: 14, fontWeight: 600,
                    }}
                  >
                    {t("battle.other")}
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
                {t("battle.win")}
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
                {t("battle.lose")}
              </button>
            </div>
          </div>

          <button
            onClick={() => setPhase("endSession")}
            style={{ width: "100%", padding: 14, marginTop: 12, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.sub, fontSize: 14, fontWeight: 600 }}
          >
            {t("battle.endSession")}
          </button>
        </div>
      )}

      {phase === "endSession" && (
        <div style={{ animation: "fadeUp .2s ease" }}>
          {todayCard}
          <div style={cd}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>{t("battle.endPower")}</div>
            <div style={{ fontSize: 12, color: T.dim, marginBottom: 8 }}>{t("battle.endPowerDesc")}</div>
            {pwrInput(pEnd, setPEnd, "終了時の戦闘力", true)}
          </div>
          <div style={{ ...cd, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t("battle.vipReached")}</div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 2 }}>{t("battle.vipShareDesc")}</div>
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
            {t("battle.saveAndEnd")}
          </button>
          <button
            onClick={() => {
              const ss = { showChar: true, showMatchups: true, showPower: true, showRecord: true, ...(data.shareSettings || {}) };
              const lines = [`【SMASH TRACKER】${formatDateLong(today())}`];
              if (ss.showChar && myChar) {
                const charLabel = ss.showRecord
                  ? `${t("share.used")}: ${fighterName(myChar, lang)} ${tW}W ${tL}L（${t("battle.winRate")} ${percentStr(tW, tM.length)}）`
                  : `${t("share.used")}: ${fighterName(myChar, lang)}`;
                lines.push(charLabel);
              } else if (ss.showRecord) {
                lines.push(`${tW}W ${tL}L（${t("battle.winRate")} ${percentStr(tW, tM.length)}）`);
              }
              if (ss.showMatchups) {
                const oppStats = {};
                tM.forEach((m) => {
                  if (!oppStats[m.oppChar]) oppStats[m.oppChar] = { w: 0, l: 0 };
                  m.result === "win" ? oppStats[m.oppChar].w++ : oppStats[m.oppChar].l++;
                });
                Object.entries(oppStats)
                  .sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))
                  .slice(0, 5)
                  .forEach(([opp, s]) => {
                    lines.push(`vs ${fighterName(opp, lang)} ${s.w}W:${s.l}L`);
                  });
              }
              if (ss.showPower && pStart) {
                const pStartN = Number(pStart);
                const pEndN = Number(pEnd || pStart);
                const delta = pEndN - pStartN;
                lines.push("");
                lines.push(`${t("battle.power")}: ${numFormat(pStartN)} → ${numFormat(pEndN)} (${delta >= 0 ? "+" : ""}${numFormat(delta)})`);
              }
              if (todayDaily.vip) lines.push(t("share.vip"));
              lines.push("", "#スマブラ #SmashTracker #スマトラ", "https://smash-tracker.pages.dev/");
              doShare(lines.join("\n"));
            }}
            style={{
              width: "100%", padding: 14, marginTop: 8, border: `1px solid ${T.brd}`,
              borderRadius: 12, background: T.card, color: T.sub, fontSize: 14, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Share2 size={16} /> {t("battle.share")}
          </button>
          <button
            onClick={() => setPhase("fighting")}
            style={{ width: "100%", padding: 12, marginTop: 8, border: "none", background: "transparent", color: T.dim, fontSize: 13 }}
          >
            {t("battle.backToBattle")}
          </button>
        </div>
      )}

      {phase === "summary" && (() => {
        const oppStats = (() => {
          const stats = {};
          tM.forEach((m) => {
            if (!stats[m.oppChar]) stats[m.oppChar] = { w: 0, l: 0 };
            m.result === "win" ? stats[m.oppChar].w++ : stats[m.oppChar].l++;
          });
          return stats;
        })();
        const topOppEntry = Object.entries(oppStats).sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))[0];
        const topOpp = topOppEntry ? topOppEntry[0] : null;
        const pDelta = pEnd && pStart ? Number(pEnd) - Number(pStart) : null;
        const ss = { showChar: true, showMatchups: true, showPower: true, showRecord: true, ...(data.shareSettings || {}) };
        const shareLines = [`【SMASH TRACKER】${formatDateLong(today())}`];
        if (ss.showChar && myChar) {
          const charLabel = ss.showRecord
            ? `使用: ${fighterName(myChar, lang)} ${tW}W ${tL}L（勝率 ${percentStr(tW, tM.length)}）`
            : `使用: ${fighterName(myChar, lang)}`;
          shareLines.push(charLabel);
        } else if (ss.showRecord) {
          shareLines.push(`${tW}W ${tL}L（勝率 ${percentStr(tW, tM.length)}）`);
        }
        if (ss.showMatchups) {
          Object.entries(oppStats)
            .sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))
            .slice(0, 5)
            .forEach(([opp, s]) => {
              shareLines.push(`vs ${fighterName(opp, lang)} ${s.w}W:${s.l}L`);
            });
        }
        if (ss.showPower && pStart) {
          shareLines.push("");
          shareLines.push(`戦闘力: ${numFormat(Number(pStart))} → ${numFormat(Number(pEnd || pStart))}${pDelta !== null ? ` (${pDelta >= 0 ? "+" : ""}${numFormat(pDelta)})` : ""}`);
        }
        if (todayDaily.vip) shareLines.push("VIP到達!");
        shareLines.push("", "#スマブラ #SmashTracker #スマトラ", "https://smash-tracker.pages.dev/");
        const shareText = shareLines.join("\n");

        const handleShare = () => doShare(shareText);

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
                {t("battle.todaySummary")}
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 20 }}>
                {formatDateLong(today())}
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>{t("battle.winLoss")}</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>
                    {tW}<span style={{ fontSize: 20, opacity: 0.6, margin: "0 4px" }}>:</span>{tL}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{tM.length}{t("battle.matches")}</div>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>{t("battle.winRate")}</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>
                    {percentStr(tW, tM.length)}
                  </div>
                </div>
              </div>

              {Object.keys(oppStats).length > 0 && (
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
                  {Object.entries(oppStats)
                    .sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))
                    .slice(0, 5)
                    .map(([opp, s]) => (
                      <div key={opp} style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{fighterName(opp, lang)}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginLeft: "auto" }}>{s.w}W:{s.l}L</span>
                      </div>
                    ))}
                </div>
              )}

              {pStart && (
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{t("battle.power")}</div>
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
                    {streak.count}{streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose")}
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
                {shareStatus === "copied" ? <><Copy size={16} /> {t("battle.copied")}</> : shareStatus === "error" ? t("battle.shareError") : <><Share2 size={16} /> {t("battle.share")}</>}
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
                {t("battle.close")}
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
            <CharPicker value={oppChar} onChange={setOppChar} label={t("battle.oppChar")} placeholder={t("charPicker.select")} recent={recOpp} T={T} />
            {recOpp.length > 0 && !oppChar && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {recOpp.slice(0, 3).map((c) => (
                  <button
                    key={c}
                    onClick={() => setOppChar(c)}
                    style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: T.inp, color: T.text, fontSize: 13, fontWeight: 600, transition: "all .15s ease" }}
                  >
                    {fighterName(c, lang)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {oppChar && myChar && (
            <MatchupBadge myChar={myChar} oppChar={oppChar} matches={data.matches} T={T} />
          )}
          <button onClick={confirmOpp} disabled={!oppChar} style={{ ...activeBtn(!oppChar), marginTop: 12 }}>
            {t("battle.record")}
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
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{fighterName(myChar, lang)}</span>
              <span style={{ fontSize: 12, color: T.dim }}>vs</span>
              <FighterIcon name={oppChar} size={32} />
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{fighterName(oppChar, lang)}</span>
            </div>
            <textarea
              value={memo}
              onChange={(e) => { setMemo(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
              onBlur={saveMemo}
              placeholder={t("battle.memo")}
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
                    {t("battle.milestoneUnlocked")}
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
              {t("battle.continueSame")}
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { saveMemo(); setNewMilestones([]); setOppChar(""); setShowOppPicker(true); setPhase("fighting"); }}
                style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.text, fontSize: 14, fontWeight: 600, transition: "all .15s ease" }}
              >
                {t("battle.nextMatch")}
              </button>
              <button
                onClick={() => { saveMemo(); setNewMilestones([]); setOppChar(""); setShowOppPicker(false); setPhase("setup"); }}
                style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.text, fontSize: 14, fontWeight: 600, transition: "all .15s ease" }}
              >
                {t("battle.changeChar")}
              </button>
            </div>
            <button
              onClick={() => { saveMemo(); setNewMilestones([]); setPhase("endSession"); }}
              style={{ width: "100%", padding: 14, marginTop: 8, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.sub, fontSize: 14, fontWeight: 600 }}
            >
              {t("battle.endSession")}
            </button>
          </div>
        </div>
      )}

      {!isPC && phase === "setup" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("battle.recent")}</div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {recentMatchList}
          </div>
        </div>
      )}
      {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
    </div>
  );

  if (!isPC) return mainContent;

  const statCard = (label, value, color) => {
    const len = String(value).length;
    const fs = len > 10 ? 16 : len > 7 ? 20 : 28;
    return (
      <div style={{ ...cd, flex: 1, marginBottom: 0, padding: "16px 14px", minWidth: 0, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.dim, marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: fs, fontWeight: 900, color: color || T.text, letterSpacing: -1, fontFamily: "'Chakra Petch', sans-serif", whiteSpace: "nowrap", marginTop: "auto" }}>{value}</div>
      </div>
    );
  };

  if (phase === "setup") {
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "stretch", height: "100%", flex: 1 }}>
        {/* Left column */}
        <div style={{ flex: 3, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 12 }}>
            {statCard(t("battle.winLoss"), tM.length > 0 ? `${tW}W - ${tL}L` : "\u2014")}
            {statCard(t("battle.winRate"), tM.length > 0 ? `${winRate}%` : "\u2014", tM.length > 0 ? (winRate >= 60 ? T.win : winRate >= 40 ? "#FF9F0A" : T.lose) : T.dim)}
            {statCard(t("battle.matches"), `${tM.length}${t("battle.matches")}`)}
            {statCard(t("battle.powerDelta"), pwrDelta !== null ? `${pwrDelta >= 0 ? "+" : ""}${numFormat(pwrDelta)}` : todayDaily.start ? numFormat(todayDaily.start) : "\u2014", pwrDelta !== null ? (pwrDelta >= 0 ? T.win : T.lose) : T.dim)}
            {streak.count >= 2 && statCard(streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose"), `${streak.count}`, streak.type === "win" ? T.win : "#FF9F0A")}
          </div>

          {/* Goals - always show input + progress */}
          <div style={{ ...cd, padding: "16px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t("settings.todayGoal")}</span>
              {(goals.games || goals.winRate) && (
                <button
                  onClick={async () => {
                    const lines = [`【SMASH TRACKER】${t("share.todayGoal")}`];
                    if (goals.games) lines.push(`${tM.length}/${goals.games}${t("settings.gamesUnit")} ${tM.length >= goals.games ? t("share.achieved") : ""}`);
                    if (goals.winRate && tM.length > 0) lines.push(`${t("settings.winRate")} ${winRate}% / ${goals.winRate}% ${winRate >= goals.winRate ? t("share.achieved") : ""}`);
                    lines.push("", "#スマブラ #SmashTracker #スマトラ", "https://smash-tracker.pages.dev/");
                    doShare(lines.join("\n"));
                  }}
                  style={{ border: "none", background: T.inp, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Share2 size={12} /> {t("battle.share")}
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{t("settings.games")}</span>
                <input type="number" value={gGames} onChange={(e) => setGG(e.target.value)} onBlur={saveGoals} placeholder="10" style={{ ...goalInputStyle, padding: "8px 10px", fontSize: 14 }} />
                <span style={{ fontSize: 12, color: T.sub }}>{t("settings.gamesUnit")}</span>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{t("settings.winRate")}</span>
                <input type="number" value={gWR} onChange={(e) => setGWR(e.target.value)} onBlur={saveGoals} placeholder="60" style={{ ...goalInputStyle, padding: "8px 10px", fontSize: 14 }} />
                <span style={{ fontSize: 12, color: T.sub }}>{t("settings.winRateUnit")}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {goals.games ? (
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 4, fontWeight: 600 }}>
                    <span>{tM.length}/{goals.games}{t("settings.gamesUnit")}</span>
                    <span style={{ color: T.text, fontWeight: 700 }}>{Math.min(100, Math.round((tM.length / goals.games) * 100))}%</span>
                  </div>
                  <div style={{ height: 6, background: T.inp, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (tM.length / goals.games) * 100)}%`, height: "100%", background: T.win, borderRadius: 3, transition: "width .3s ease" }} />
                  </div>
                </div>
              ) : null}
              {goals.winRate && tM.length > 0 ? (
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 4, fontWeight: 600 }}>
                    <span>{t("settings.winRate")} {goals.winRate}%</span>
                    <span style={{ color: winRate >= goals.winRate ? T.win : T.lose, fontWeight: 700 }}>{winRate}%</span>
                  </div>
                  <div style={{ height: 6, background: T.inp, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (tW / tM.length) * 100)}%`, height: "100%", background: winRate >= goals.winRate ? T.win : T.lose, borderRadius: 3, transition: "width .3s ease" }} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Onboarding */}
          {data.matches.length === 0 && (
            <div
              style={{
                background: T.accentSoft,
                borderRadius: 16,
                padding: "20px 24px",
                border: `1px solid ${T.accent}33`,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: T.accent, marginBottom: 12 }}>{t("battle.welcome")}</div>
              <div style={{ display: "flex", gap: 24 }}>
                {[t("battle.step1"), t("battle.step2"), t("battle.step3")].map((step, i) => (
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

          {/* Char + Power row */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
              {showMyPicker ? (
                <CharPicker value={myChar} onChange={(c) => { setMyChar(c); switchCharPower(c); setShowMyPicker(false); }} label={t("battle.selectChar")} placeholder={t("charPicker.select")} recent={recMy} autoOpen T={T} />
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: T.sub, marginBottom: 8, fontWeight: 600 }}>{t("battle.selectChar")}</div>
                  {myChar ? <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 8 }}>{fighterName(myChar, lang)}</div> : <div style={{ fontSize: 15, color: T.dim, marginBottom: 8 }}>{t("battle.notSelected")}</div>}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowMyPicker(true)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.change")}</button>
                    {recMy.filter((c) => c !== myChar).slice(0, 3).map((c) => (
                      <button key={c} onClick={() => { setMyChar(c); switchCharPower(c); }} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: T.inp, color: T.text, fontSize: 13, fontWeight: 600 }}>{fighterName(c, lang)}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
              <div style={{ fontSize: 13, color: T.sub, marginBottom: 8, fontWeight: 600 }}>{myChar ? `${fighterName(myChar, lang)}${t("battle.startPower")}` : t("battle.power")}</div>
              {prevEnd && !todayDaily.start && <div style={{ fontSize: 11, color: T.dim, marginBottom: 6 }}>{t("battle.autoCarryOver")}</div>}
              {pwrInput(pStart, setPStart, "14,000,000", true)}
            </div>
          </div>

          {/* Start button */}
          <button onClick={startBattle} disabled={!pStart || !myChar} style={activeBtn(!pStart || !myChar)}>{t("battle.startBattle")}</button>
        </div>

        {/* Right column: recent matches */}
        <div
          style={{
            flex: 2, minWidth: 300, minHeight: 0, background: T.card, borderRadius: 20,
            padding: "20px 24px 24px", border: `1px solid ${T.brd}`, boxShadow: T.sh,
            overflowY: "auto",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>{t("battle.recent")}</div>
          <div style={{ fontSize: 12, color: T.dim, marginBottom: 16 }}>{formatDateWithDay(today())}  {tM.length}{t("battle.matches")}</div>
          {recentMatchList}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {statCard(t("battle.winLoss"), tM.length > 0 ? `${tW}W - ${tL}L` : "\u2014")}
        {statCard(t("battle.winRate"), tM.length > 0 ? `${winRate}%` : "\u2014", tM.length > 0 ? (winRate >= 60 ? T.win : winRate >= 40 ? "#FF9F0A" : T.lose) : T.dim)}
        {statCard(t("battle.matches"), `${tM.length}${t("battle.matches")}`)}
        {statCard(t("battle.powerDelta"), pwrDelta !== null ? `${pwrDelta >= 0 ? "+" : ""}${numFormat(pwrDelta)}` : todayDaily.start ? numFormat(todayDaily.start) : "\u2014", pwrDelta !== null ? (pwrDelta >= 0 ? T.win : T.lose) : T.dim)}
        {streak.count >= 2 && statCard(streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose"), `${streak.count}`, streak.type === "win" ? T.win : "#FF9F0A")}
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 3, minWidth: 0 }}>
          {phase === "fighting" && (
            <div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                  <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 6 }}>{t("battle.powerStart")}</div>
                  {pwrInput(pStart, setPStart, "", false)}
                </div>
                <div style={{ ...cd, flex: 1, padding: "20px 24px" }}>
                  <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 6 }}>{t("battle.powerCurrent")}</div>
                  {pwrInput(pEnd, setPEnd, t("battle.powerPlaceholder"), false)}
                </div>
              </div>
              <div style={{ ...cd, padding: "20px 24px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>{t("battle.oppChar")}</div>
                  {oppChar && <button onClick={() => setOppChar("")} style={{ border: "none", background: "transparent", color: T.lose, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}><X size={12} /> {t("battle.clear")}</button>}
                </div>
                {oppChar && !showOppPicker && <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8 }}>{fighterName(oppChar, lang)}</div>}
                {showOppPicker ? (
                  <CharPicker value={oppChar} onChange={(c) => { setOppChar(c); setShowOppPicker(false); }} placeholder={t("charPicker.select")} recent={recOpp} T={T} />
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {recOpp.slice(0, 5).map((c) => (
                      <button key={c} onClick={() => setOppChar(c)} style={{ padding: "8px 16px", borderRadius: 10, border: oppChar === c ? `2px solid ${T.accent}` : "none", background: oppChar === c ? T.accentSoft : T.inp, color: oppChar === c ? T.accent : T.text, fontSize: 13, fontWeight: 600, transition: "all .15s ease" }}>{fighterName(c, lang)}</button>
                    ))}
                    <button onClick={() => setShowOppPicker(true)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px dashed ${T.dimmer}`, background: "transparent", color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.other")}</button>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <button onClick={() => selectRes("win")} style={{ flex: 1, padding: "24px 0", border: "none", borderRadius: 16, background: "linear-gradient(135deg, #16A34A, #22C55E)", color: "#fff", fontSize: 22, fontWeight: 800, boxShadow: "0 4px 16px rgba(34,197,94,.3)" }}>{t("battle.win")}</button>
                <button onClick={() => selectRes("lose")} style={{ flex: 1, padding: "24px 0", border: "none", borderRadius: 16, background: "linear-gradient(135deg, #E11D48, #F43F5E)", color: "#fff", fontSize: 22, fontWeight: 800, boxShadow: "0 4px 16px rgba(244,63,94,.3)" }}>{t("battle.lose")}</button>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => { setShareStatus(null); setPhase("endSession"); }} style={{ flex: 1, padding: 12, border: `1px solid ${T.brd}`, borderRadius: 10, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}>{t("battle.endSession")}</button>
                <button onClick={() => { setPhase("setup"); setShowPowerEdit(false); setShowOppPicker(false); }} style={{ flex: 1, padding: 12, border: "none", background: "transparent", color: T.dim, fontSize: 13 }}>{t("battle.backToBattle")}</button>
              </div>
            </div>
          )}

          {phase === "endSession" && (
            <div style={{ animation: "fadeUp .2s ease" }}>
              <div style={{ ...cd, padding: "20px 24px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{t("battle.endPower")}</div>
                <div style={{ fontSize: 12, color: T.dim, marginBottom: 10 }}>{t("battle.endPowerDesc")}</div>
                {pwrInput(pEnd, setPEnd, t("battle.endPower"), true)}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  onClick={() => { savePower(pStart, pEnd); setShareStatus(null); setPhase("summary"); setShowPowerEdit(false); setShowOppPicker(false); }}
                  style={{ flex: 2, padding: 16, border: "none", borderRadius: 12, background: T.accentGrad, color: "#fff", fontSize: 15, fontWeight: 800, boxShadow: T.accentGlow }}
                >
                  {t("battle.saveAndEnd")}
                </button>
                <button
                  onClick={() => setPhase("fighting")}
                  style={{ flex: 1, padding: 16, border: `1px solid ${T.brd}`, borderRadius: 12, background: T.card, color: T.sub, fontSize: 13, fontWeight: 600 }}
                >
                  {t("battle.backToBattle")}
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
                <CharPicker value={oppChar} onChange={setOppChar} label={t("battle.oppChar")} placeholder={t("charPicker.select")} recent={recOpp} T={T} />
              </div>
              <button onClick={confirmOpp} disabled={!oppChar} style={activeBtn(!oppChar)}>{t("battle.record")}</button>
            </div>
          )}

          {phase === "postMatch" && (
            <div>
              <div style={{ ...cd, textAlign: "center", padding: "28px 24px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.dim, letterSpacing: 1.5, fontFamily: "'Chakra Petch', sans-serif" }}>{t("battle.recorded")}</div>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 8, animation: "slideUp .3s ease .1s both" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{fighterName(myChar, lang)}</span>
                  <span style={{ fontSize: 14, color: T.dim }}>vs</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{fighterName(oppChar, lang)}</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <span style={{ display: "inline-block", padding: "6px 24px", borderRadius: 10, fontSize: 16, fontWeight: 800, background: lastRes === "win" ? T.winBg : T.loseBg, color: lastRes === "win" ? T.win : T.lose, animation: "popIn .3s ease" }}>{lastRes === "win" ? "WIN" : "LOSE"}</span>
                </div>
                <textarea value={memo} onChange={(e) => { setMemo(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} onBlur={saveMemo} placeholder={t("battle.memo")} rows={1} style={{ width: "100%", marginTop: 16, padding: "12px 16px", background: T.inp, border: "none", borderRadius: 10, color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box", textAlign: "center", resize: "none", overflow: "hidden", fontFamily: "inherit", lineHeight: 1.5 }} />
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
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: 1.5, marginBottom: 4 }}>{t("battle.milestoneUnlocked")}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>{m.condition}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, animation: "slideUp .3s ease .3s both" }}>
                <button onClick={() => { saveMemo(); setNewMilestones([]); setPhase("fighting"); setShowOppPicker(false); }} style={{ flex: 2, padding: 20, border: "none", borderRadius: 14, background: T.accentGrad, color: "#fff", fontSize: 17, fontWeight: 800, boxShadow: T.accentGlow }}>{t("battle.continueSame")}</button>
                <button onClick={() => { saveMemo(); setNewMilestones([]); setOppChar(""); setShowOppPicker(true); setPhase("fighting"); }} style={{ flex: 1, padding: 20, border: `1px solid ${T.brd}`, borderRadius: 14, background: T.card, color: T.text, fontSize: 14, fontWeight: 600 }}>{t("battle.nextMatch")}</button>
                <button onClick={() => { saveMemo(); setNewMilestones([]); setOppChar(""); setShowOppPicker(false); setPhase("setup"); }} style={{ flex: 1, padding: 20, border: `1px solid ${T.brd}`, borderRadius: 14, background: T.card, color: T.text, fontSize: 14, fontWeight: 600 }}>{t("battle.changeChar")}</button>
              </div>
            </div>
          )}

          {phase === "summary" && (() => {
            const oppStatsPC = (() => {
              const stats = {};
              tM.forEach((m) => {
                if (!stats[m.oppChar]) stats[m.oppChar] = { w: 0, l: 0 };
                m.result === "win" ? stats[m.oppChar].w++ : stats[m.oppChar].l++;
              });
              return stats;
            })();
            const topOppPC = Object.entries(oppStatsPC).sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))[0]?.[0] ?? null;
            const pDelta = pEnd && pStart ? Number(pEnd) - Number(pStart) : null;
            const ss = { showChar: true, showMatchups: true, showPower: true, showRecord: true, ...(data.shareSettings || {}) };
            const shareLines = [`【SMASH TRACKER】${formatDateLong(today())}`];
            if (ss.showChar && myChar) {
              const charLabel = ss.showRecord
                ? `使用: ${fighterName(myChar, lang)} ${tW}W ${tL}L（勝率 ${percentStr(tW, tM.length)}）`
                : `使用: ${fighterName(myChar, lang)}`;
              shareLines.push(charLabel);
            } else if (ss.showRecord) {
              shareLines.push(`${tW}W ${tL}L（勝率 ${percentStr(tW, tM.length)}）`);
            }
            if (ss.showMatchups) {
              Object.entries(oppStatsPC)
                .sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))
                .slice(0, 5)
                .forEach(([opp, s]) => {
                  shareLines.push(`vs ${fighterName(opp, lang)} ${s.w}W:${s.l}L`);
                });
            }
            if (ss.showPower && pStart) {
              shareLines.push("");
              shareLines.push(`戦闘力: ${numFormat(Number(pStart))} → ${numFormat(Number(pEnd || pStart))}${pDelta !== null ? ` (${pDelta >= 0 ? "+" : ""}${numFormat(pDelta)})` : ""}`);
            }
            if (todayDaily.vip) shareLines.push("VIP到達!");
            shareLines.push("", "#スマブラ #SmashTracker #スマトラ", "https://smash-tracker.pages.dev/");
            const shareText = shareLines.join("\n");

            const handleShare = () => doShare(shareText);

            return (
              <div style={{ animation: "fadeUp .25s ease" }}>
                <div
                  style={{
                    background: T.tBg, borderRadius: 20, padding: "32px 28px",
                    marginBottom: 20, boxShadow: T.accentGlow,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 2, marginBottom: 6, fontFamily: "'Chakra Petch', sans-serif" }}>
                    {t("battle.todaySummary")}
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 24 }}>
                    {formatDateLong(today())}
                  </div>

                  <div style={{ display: "flex", gap: 24, marginBottom: 20 }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>{t("battle.winLoss")}</div>
                      <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>
                        {tW}<span style={{ fontSize: 24, opacity: 0.6, margin: "0 6px" }}>:</span>{tL}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>{tM.length}{t("battle.matches")}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 4 }}>{t("battle.winRate")}</div>
                      <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", fontFamily: "'Chakra Petch', sans-serif", lineHeight: 1 }}>
                        {percentStr(tW, tM.length)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Object.keys(oppStatsPC).length > 0 && (
                      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px 16px" }}>
                        {Object.entries(oppStatsPC)
                          .sort((a, b) => (b[1].w + b[1].l) - (a[1].w + a[1].l))
                          .slice(0, 5)
                          .map(([opp, s]) => (
                            <div key={opp} style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
                              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{fighterName(opp, lang)}</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginLeft: "auto" }}>{s.w}W:{s.l}L</span>
                            </div>
                          ))}
                      </div>
                    )}
                    {pStart && (
                      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{t("battle.power")}</span>
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
                          {streak.count}{streak.type === "win" ? t("battle.streak.win") : t("battle.streak.lose")}
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
                    {shareStatus === "copied" ? <><Copy size={16} /> {t("battle.copied")}</> : shareStatus === "error" ? t("battle.shareError") : <><Share2 size={16} /> {t("battle.share")}</>}
                  </button>
                  <button
                    onClick={() => { setPhase("setup"); setShowPowerEdit(false); setShowOppPicker(false); }}
                    style={{
                      flex: 1, padding: "16px 0", border: `1px solid ${T.brd}`, borderRadius: 12,
                      background: T.card, color: T.text, fontSize: 15, fontWeight: 700,
                    }}
                  >
                    {t("battle.close")}
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
            position: "sticky", top: 90, overflowY: "auto",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4 }}>{t("battle.recent")}</div>
          <div style={{ fontSize: 12, color: T.dim, marginBottom: 16 }}>{formatDateWithDay(today())}  {tM.length}{t("battle.matches")}</div>
          {recentMatchList}
        </div>
      </div>
      {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
    </div>
  );
}
