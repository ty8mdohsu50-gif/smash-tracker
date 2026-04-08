import { useState, useMemo } from "react";
import { Share2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import CharPicker from "./CharPicker";
import FighterIcon from "./FighterIcon";
import SharePopup from "./SharePopup";
import Toast from "./Toast";
import ConfirmDialog from "./ConfirmDialog";
import Chart from "./Chart";
import { fighterName, shortName, FIGHTERS } from "../constants/fighters";
import { useI18n } from "../i18n/index.jsx";
import { today, formatDate, formatTime, formatDateWithDay, percentStr, barColor, recentChars } from "../utils/format";

export default function FreeMatchTab({ data, onSave, T, isPC, onBack }) {
  const { t, lang } = useI18n();

  const [phase, setPhase] = useState("list");
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [myChar, setMyChar] = useState(data.settings?.myChar || "");
  const [oppChar, setOppChar] = useState("");
  const [showMyPicker, setShowMyPicker] = useState(false);
  const [showOppPicker, setShowOppPicker] = useState(false);
  const [newOpponentName, setNewOpponentName] = useState("");
  const [sharePopupText, setSharePopupText] = useState(null);
  const [showAddInput, setShowAddInput] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [postRecord, setPostRecord] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [subTab, setSubTab] = useState("battle");
  const [expandedMatchup, setExpandedMatchup] = useState(null);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [calDate, setCalDate] = useState(null);

  const freeMatches = useMemo(() => data.freeMatches || [], [data.freeMatches]);
  const freeOpponents = useMemo(() => data.freeOpponents || [], [data.freeOpponents]);
  const recMy = useMemo(() => recentChars(freeMatches, "myChar"), [freeMatches]);
  const recOpp = useMemo(() => recentChars(freeMatches, "oppChar"), [freeMatches]);

  const getOpponentStats = (opp) => {
    const ms = freeMatches.filter((m) => m.opponent === opp);
    const w = ms.filter((m) => m.result === "win").length;
    return { total: ms.length, w, l: ms.length - w };
  };
  const getTodayMatches = (opp) => freeMatches.filter((m) => m.opponent === opp && m.date === today());
  const getOpponentHistory = (opp) => freeMatches.filter((m) => m.opponent === opp);

  const deleteFreeMatch = (match) => {
    setConfirmAction({
      message: t("common.deleteConfirm"),
      onConfirm: () => { onSave({ ...data, freeMatches: freeMatches.filter((m) => m !== match) }); setConfirmAction(null); },
    });
  };

  const addOpponent = () => {
    const name = newOpponentName.trim();
    if (!name || freeOpponents.includes(name)) return;
    onSave({ ...data, freeOpponents: [...freeOpponents, name] });
    setNewOpponentName(""); setShowAddInput(false);
  };

  const deleteOpponent = (opp) => {
    onSave({ ...data, freeOpponents: freeOpponents.filter((o) => o !== opp), freeMatches: freeMatches.filter((m) => m.opponent !== opp) });
  };

  const recordMatch = (result) => {
    if (!myChar || !oppChar || !selectedOpponent) return;
    const match = { date: today(), time: new Date().toISOString(), opponent: selectedOpponent, myChar, oppChar, result };
    onSave({ ...data, freeMatches: [...freeMatches, match] });
    setLastResult(result); setPostRecord(true); setToast(t("battle.toastRecorded"));
  };

  const buildShareText = (opp, matchList) => {
    const w = matchList.filter((m) => m.result === "win").length;
    const l = matchList.length - w;
    const rate = matchList.length > 0 ? Math.round((w / matchList.length) * 100) : 0;
    return [
      `【SMASH TRACKER】${t("free.freeMatch")} vs ${opp}`, "",
      `${w}W ${l}L（${t("battle.winRate")} ${rate}%）`,
      ...matchList.map((m) => `${m.result === "win" ? "WIN" : "LOSE"} ${fighterName(m.myChar, lang)} vs ${fighterName(m.oppChar, lang)}`),
      "", "#SmashTracker #スマブラ", "https://smash-tracker.pages.dev/",
    ].join("\n");
  };

  const doShare = async (text) => {
    if (navigator.share) { try { await navigator.share({ text }); return; } catch (_) { /* */ } }
    setSharePopupText(text);
  };

  // ── Analysis data (must be top-level for hooks rules) ──
  const oppMs = useMemo(() => selectedOpponent ? freeMatches.filter((m) => m.opponent === selectedOpponent) : [], [freeMatches, selectedOpponent]);

  const matchups = useMemo(() => {
    const s = {};
    oppMs.forEach((m) => {
      const k = `${m.myChar}|${m.oppChar}`;
      if (!s[k]) s[k] = { myChar: m.myChar, oppChar: m.oppChar, w: 0, l: 0, matches: [] };
      m.result === "win" ? s[k].w++ : s[k].l++;
      s[k].matches.push(m);
    });
    return Object.values(s).sort((a, b) => {
      const ia = FIGHTERS.indexOf(a.myChar) * 100 + FIGHTERS.indexOf(a.oppChar);
      const ib = FIGHTERS.indexOf(b.myChar) * 100 + FIGHTERS.indexOf(b.oppChar);
      return ia - ib;
    });
  }, [oppMs]);

  const winRatePoints = useMemo(() => {
    if (oppMs.length < 2) return [];
    const pts = [];
    const w = 10;
    for (let i = 0; i < oppMs.length; i++) {
      const start = Math.max(0, i - w + 1);
      const slice = oppMs.slice(start, i + 1);
      const wins = slice.filter((m) => m.result === "win").length;
      pts.push({ date: `#${i + 1}`, value: Math.round((wins / slice.length) * 100) });
    }
    return pts;
  }, [oppMs]);

  const freeDailyMap = useMemo(() => {
    const map = {};
    oppMs.forEach((m) => {
      if (!map[m.date]) map[m.date] = { w: 0, l: 0, matches: [] };
      m.result === "win" ? map[m.date].w++ : map[m.date].l++;
      map[m.date].matches.push(m);
    });
    return map;
  }, [oppMs]);

  const cd = { background: T.card, borderRadius: 16, border: `1px solid ${T.brd}`, boxShadow: T.sh, padding: "16px 18px", marginBottom: 10 };
  const btnBase = { border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all .15s ease", fontFamily: "inherit" };

  const freeHeader = (backFn, title) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <button onClick={backFn} style={{ ...btnBase, padding: "8px 14px", background: T.inp, color: T.sub, fontSize: 13 }}>{t("free.back")}</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ background: T.accentGrad, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>FREE</div>
        <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{title}</span>
      </div>
    </div>
  );

  const overlays = (
    <>
      {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {confirmAction && <ConfirmDialog message={confirmAction.message} confirmLabel={t("history.delete")} cancelLabel={t("settings.cancel")} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} T={T} />}
    </>
  );

  // ══════════════════════════════
  // LIST PHASE
  // ══════════════════════════════
  if (phase === "list") {
    return (
      <div style={{ animation: "fadeUp .2s ease" }}>
        {freeHeader(onBack, t("free.title"))}
        <div style={cd}>
          {showAddInput ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" value={newOpponentName} onChange={(e) => setNewOpponentName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addOpponent(); if (e.key === "Escape") { setShowAddInput(false); setNewOpponentName(""); } }}
                placeholder={t("free.opponentName")} autoFocus
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.accent}`, background: T.inp, color: T.text, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
              <button onClick={addOpponent} disabled={!newOpponentName.trim()} style={{ ...btnBase, padding: "10px 18px", background: newOpponentName.trim() ? T.accentGrad : T.inp, color: newOpponentName.trim() ? "#fff" : T.dim, fontSize: 13, boxShadow: newOpponentName.trim() ? T.accentGlow : "none" }}>{t("free.add")}</button>
              <button onClick={() => { setShowAddInput(false); setNewOpponentName(""); }} style={{ ...btnBase, padding: "10px 14px", background: T.inp, color: T.sub, fontSize: 13 }}>×</button>
            </div>
          ) : (
            <button onClick={() => setShowAddInput(true)} style={{ ...btnBase, width: "100%", background: T.accentSoft, color: T.accent, border: `1.5px dashed ${T.accentBorder}`, fontSize: 14 }}>+ {t("free.addOpponent")}</button>
          )}
        </div>
        {freeOpponents.length === 0 ? (
          <div style={{ ...cd, textAlign: "center", padding: "32px 18px" }}><div style={{ fontSize: 14, color: T.dim }}>{t("free.noOpponents")}</div></div>
        ) : freeOpponents.map((opp) => {
          const { total, w, l } = getOpponentStats(opp);
          const rate = total > 0 ? Math.round((w / total) * 100) : null;
          return (
            <div key={opp} style={{ ...cd, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => { setSelectedOpponent(opp); setPostRecord(false); setSubTab("battle"); setPhase("battle"); }}
                style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", fontFamily: "inherit" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.accentSoft, border: `2px solid ${T.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: T.accent, flexShrink: 0 }}>{opp[0]}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{opp}</div>
                  {total > 0 ? (
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                      <span style={{ color: T.win, fontWeight: 700 }}>{w}{t("free.winLabel")}</span>{" : "}<span style={{ color: T.lose, fontWeight: 700 }}>{l}{t("free.loseLabel")}</span>{"  "}
                      <span style={{ color: rate >= 60 ? T.win : rate >= 40 ? "#FF9F0A" : T.lose, fontWeight: 700 }}>{rate}%</span>
                    </div>
                  ) : <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>—</div>}
                </div>
              </button>
              <button onClick={() => setConfirmAction({ message: `${opp} ${t("free.deleteOpponent")}?`, onConfirm: () => { deleteOpponent(opp); setConfirmAction(null); } })}
                style={{ ...btnBase, padding: "6px 10px", background: T.loseBg, color: T.lose, fontSize: 12 }}>×</button>
            </div>
          );
        })}
        {overlays}
      </div>
    );
  }

  // ══════════════════════════════
  // BATTLE PHASE (with sub-tabs)
  // ══════════════════════════════
  if (phase === "battle") {
    const todayMs = getTodayMatches(selectedOpponent);
    const todayW = todayMs.filter((m) => m.result === "win").length;
    const todayL = todayMs.length - todayW;
    const totalW = oppMs.filter((m) => m.result === "win").length;
    const totalL = oppMs.length - totalW;
    const dailyMap = freeDailyMap;

    const calendarView = (() => {
      const [yStr, mStr] = calMonth.split("-");
      const year = Number(yStr); const month = parseInt(mStr) - 1;
      const monthLabel = lang === "ja" ? `${year}年${month + 1}月` : `${new Date(year, month).toLocaleString("en", { month: "long" })} ${year}`;
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startOffset = (firstDay + 6) % 7;
      const todayStr = today();
      const weekDays = t("heatmap.weekDays");
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const dotColor = (r) => r >= 0.6 ? T.win : r <= 0.4 ? T.lose : "#FF9F0A";

      const monthDays = Object.entries(dailyMap).filter(([d]) => d.startsWith(calMonth));
      const mW = monthDays.reduce((a, [, d]) => a + d.w, 0);
      const mL = monthDays.reduce((a, [, d]) => a + d.l, 0);
      const mT = mW + mL;

      const selData = calDate ? dailyMap[calDate] : null;

      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <button onClick={() => { const d = new Date(year, month - 1, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); setCalDate(null); }}
              style={{ border: "none", background: "transparent", color: T.text, padding: 6, cursor: "pointer" }}><ChevronLeft size={18} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{monthLabel}</span>
              {calMonth !== currentMonth && <button onClick={() => { setCalMonth(currentMonth); setCalDate(null); }} style={{ border: `1px solid ${T.brd}`, background: T.card, color: T.sub, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, cursor: "pointer" }}>{t("analysis.thisMonth")}</button>}
            </div>
            <button onClick={() => { const d = new Date(year, month + 1, 1); setCalMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); setCalDate(null); }}
              style={{ border: "none", background: "transparent", color: T.text, padding: 6, cursor: "pointer" }}><ChevronRight size={18} /></button>
          </div>
          {mT > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 2px", marginBottom: 4, fontSize: 11, color: T.dim }}>
              <span>{mT}{t("analysis.battles")}</span>
              <span style={{ fontWeight: 800, fontSize: 13 }}><span style={{ color: T.win }}>{mW}</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: T.lose }}>{mL}</span></span>
              <span style={{ fontWeight: 700, fontSize: 12, color: barColor(mT ? mW / mT : 0) }}>{percentStr(mW, mT)}</span>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, textAlign: "center", marginBottom: 8 }}>
            {weekDays.map((d, i) => <div key={`h${i}`} style={{ fontSize: 10, fontWeight: 600, color: T.dim, padding: "2px 0" }}>{d}</div>)}
            {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${yStr}-${mStr}-${String(day).padStart(2, "0")}`;
              const dd = dailyMap[dateStr]; const isFuture = dateStr > todayStr;
              const isSel = calDate === dateStr; const isToday = dateStr === todayStr;
              const r = dd ? dd.w / (dd.w + dd.l) : 0;
              return (
                <div key={day} onClick={() => { if (dd) setCalDate(isSel ? null : dateStr); }}
                  style={{ padding: "4px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: dd ? "pointer" : "default",
                    background: isSel ? T.accentSoft : "transparent", border: isSel ? `2px solid ${T.accent}` : isToday ? `1px solid ${T.dimmer}` : "1px solid transparent", opacity: isFuture ? 0.3 : 1 }}>
                  <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isSel ? T.accent : isToday ? T.text : T.sub, lineHeight: 1 }}>{day}</span>
                  {dd && <div style={{ width: 5, height: 5, borderRadius: 3, background: dotColor(r), marginTop: 2 }} />}
                </div>
              );
            })}
          </div>
          {selData && (
            <div style={{ ...cd, padding: "14px 16px", marginTop: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 8 }}>{formatDate(calDate)}</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, background: T.inp, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 2 }}>{t("analysis.winLoss")}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif" }}><span style={{ color: T.win }}>{selData.w}</span><span style={{ color: T.dimmer, fontSize: 12, margin: "0 2px" }}>:</span><span style={{ color: T.lose }}>{selData.l}</span></div>
                </div>
                <div style={{ flex: 1, background: T.inp, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, marginBottom: 2 }}>{t("analysis.winRate")}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: barColor(selData.w / (selData.w + selData.l)), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(selData.w, selData.w + selData.l)}</div>
                </div>
              </div>
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {selData.matches.slice().reverse().map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.result === "win" ? T.win : T.lose, minWidth: 32 }}>{m.result === "win" ? "WIN" : "LOSE"}</span>
                    <FighterIcon name={m.myChar} size={18} /><span style={{ fontSize: 11, color: T.sub }}>{shortName(m.myChar, lang)}</span>
                    <span style={{ fontSize: 10, color: T.dim }}>vs</span>
                    <FighterIcon name={m.oppChar} size={18} /><span style={{ fontSize: 11, color: T.sub, flex: 1 }}>{shortName(m.oppChar, lang)}</span>
                    <span style={{ fontSize: 10, color: T.dim }}>{formatTime(m.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    })();

    return (
      <div style={{ animation: "fadeUp .2s ease" }}>
        {freeHeader(() => { setPhase("list"); setPostRecord(false); setLastResult(null); setSubTab("battle"); }, `vs ${selectedOpponent}`)}

        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[["battle", t("free.battle")], ["analysis", t("free.analysis")]].map(([k, l]) => (
            <button key={k} onClick={() => setSubTab(k)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", fontSize: 13, fontWeight: subTab === k ? 700 : 500, textAlign: "center", background: subTab === k ? T.accentGrad : T.inp, color: subTab === k ? "#fff" : T.sub, transition: "all .15s ease" }}>{l}</button>
          ))}
        </div>

        {/* ── BATTLE SUB-TAB ── */}
        {subTab === "battle" && (
          <div>
            {/* Summary */}
            {todayMs.length > 0 && (
              <div style={{ ...cd, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                <span style={{ fontSize: 12, color: T.dim }}>{t("free.todayRecord")}</span>
                <div><span style={{ color: T.win, fontWeight: 800 }}>{todayW}W</span><span style={{ color: T.dimmer }}> : </span><span style={{ color: T.lose, fontWeight: 800 }}>{todayL}L</span></div>
                <button onClick={() => doShare(buildShareText(selectedOpponent, todayMs))} style={{ ...btnBase, padding: "4px 10px", background: T.inp, color: T.sub, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Share2 size={11} />{t("free.share")}</button>
              </div>
            )}

            {!postRecord && (
              <>
                <div style={cd}>
                  {showMyPicker ? <CharPicker value={myChar} onChange={(c) => { setMyChar(c); setShowMyPicker(false); }} label={t("battle.selectChar")} placeholder={t("charPicker.select")} recent={recMy} autoOpen T={T} /> : (
                    <div>
                      <div style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{t("battle.selectChar")}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        {myChar && <FighterIcon name={myChar} size={32} />}
                        <span style={{ fontSize: 16, fontWeight: 700, color: myChar ? T.text : T.dim }}>{myChar ? fighterName(myChar, lang) : t("battle.notSelected")}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setShowMyPicker(true)} style={{ ...btnBase, padding: "7px 13px", background: T.inp, color: T.sub, fontSize: 12, border: `1px solid ${T.brd}` }}>{t("battle.change")}</button>
                        {recMy.filter((c) => c !== myChar).slice(0, 3).map((c) => <button key={c} onClick={() => setMyChar(c)} style={{ ...btnBase, padding: "7px 13px", background: T.inp, color: T.text, fontSize: 12 }}>{fighterName(c, lang)}</button>)}
                      </div>
                    </div>
                  )}
                </div>
                <div style={cd}>
                  {showOppPicker ? <CharPicker value={oppChar} onChange={(c) => { setOppChar(c); setShowOppPicker(false); }} label={t("battle.oppChar")} placeholder={t("charPicker.select")} recent={recOpp} autoOpen T={T} /> : (
                    <div>
                      <div style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{t("battle.oppChar")}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        {oppChar && <FighterIcon name={oppChar} size={32} />}
                        <span style={{ fontSize: 16, fontWeight: 700, color: oppChar ? T.text : T.dim }}>{oppChar ? fighterName(oppChar, lang) : t("battle.notSelected")}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setShowOppPicker(true)} style={{ ...btnBase, padding: "7px 13px", background: T.inp, color: T.sub, fontSize: 12, border: `1px solid ${T.brd}` }}>{t("battle.change")}</button>
                        {recOpp.filter((c) => c !== oppChar).slice(0, 3).map((c) => <button key={c} onClick={() => setOppChar(c)} style={{ ...btnBase, padding: "7px 13px", background: T.inp, color: T.text, fontSize: 12 }}>{fighterName(c, lang)}</button>)}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <button onClick={() => recordMatch("win")} disabled={!myChar || !oppChar} style={{ ...btnBase, flex: 1, padding: 16, fontSize: 18, background: myChar && oppChar ? T.win : T.inp, color: myChar && oppChar ? "#fff" : T.dim, boxShadow: myChar && oppChar ? `0 4px 16px ${T.win}44` : "none" }}>{t("battle.win")}</button>
                  <button onClick={() => recordMatch("lose")} disabled={!myChar || !oppChar} style={{ ...btnBase, flex: 1, padding: 16, fontSize: 18, background: myChar && oppChar ? T.lose : T.inp, color: myChar && oppChar ? "#fff" : T.dim, boxShadow: myChar && oppChar ? `0 4px 16px ${T.lose}44` : "none" }}>{t("battle.lose")}</button>
                </div>
              </>
            )}
            {postRecord && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", marginBottom: 10 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif", color: lastResult === "win" ? T.win : T.lose }}>{lastResult === "win" ? "WIN" : "LOSE"}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setPostRecord(false)} style={{ ...btnBase, flex: 2, padding: 16, background: T.accentGrad, color: "#fff", fontSize: 16, fontWeight: 800, boxShadow: T.accentGlow }}>{t("free.rematch")}</button>
                  <button onClick={() => { setOppChar(""); setShowOppPicker(true); setPostRecord(false); }} style={{ ...btnBase, flex: 1, padding: 16, background: T.card, color: T.text, fontSize: 14, fontWeight: 600, border: `1px solid ${T.brd}` }}>{t("free.changeChar")}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYSIS SUB-TAB ── */}
        {subTab === "analysis" && (
          <div>
            {oppMs.length === 0 ? (
              <div style={{ ...cd, textAlign: "center", padding: 24, color: T.dim, fontSize: 13 }}>{t("analysis.noData")}</div>
            ) : (
              <>
                {/* Summary */}
                <div style={{ ...cd, display: "flex", padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.totalMatches")}</div><div style={{ fontSize: 22, fontWeight: 900, color: T.text, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>{oppMs.length}</div></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.winRate")}</div><div style={{ fontSize: 22, fontWeight: 900, color: barColor(totalW / oppMs.length), marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(totalW, oppMs.length)}</div></div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: T.dim, fontWeight: 600 }}>{t("analysis.winLoss")}</div><div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, fontFamily: "'Chakra Petch', sans-serif" }}><span style={{ color: T.win }}>{totalW}</span><span style={{ color: T.dimmer, fontSize: 14, margin: "0 3px" }}>:</span><span style={{ color: T.lose }}>{totalL}</span></div></div>
                </div>

                {/* Win rate trend */}
                {winRatePoints.length > 1 && (
                  <div style={{ ...cd, padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("free.winRateTrend")}</div>
                    <Chart points={winRatePoints} T={T} />
                  </div>
                )}

                {/* Matchups */}
                <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("free.matchupStats")}</div>
                {matchups.map((mu) => {
                  const r = mu.w / (mu.w + mu.l);
                  const k = `${mu.myChar}|${mu.oppChar}`;
                  const isExp = expandedMatchup === k;
                  return (
                    <div key={k} style={{ ...cd, marginBottom: 8, padding: "12px 16px" }}>
                      <div onClick={() => setExpandedMatchup(isExp ? null : k)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <FighterIcon name={mu.myChar} size={24} />
                          <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{shortName(mu.myChar, lang)}</span>
                          <span style={{ fontSize: 10, color: T.dim }}>vs</span>
                          <FighterIcon name={mu.oppChar} size={24} />
                          <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{shortName(mu.oppChar, lang)}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: T.dim }}>{mu.w}W {mu.l}L</span>
                          <span style={{ fontSize: 15, fontWeight: 800, color: barColor(r), fontFamily: "'Chakra Petch', sans-serif" }}>{percentStr(mu.w, mu.w + mu.l)}</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: T.inp, borderRadius: 2, overflow: "hidden", marginTop: 6 }}>
                        <div style={{ width: `${r * 100}%`, height: "100%", borderRadius: 2, background: barColor(r) }} />
                      </div>
                      {isExp && (
                        <div style={{ marginTop: 8, borderTop: `1px solid ${T.inp}`, paddingTop: 8, maxHeight: 200, overflowY: "auto" }}>
                          {mu.matches.slice().reverse().map((m, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: m.result === "win" ? T.win : T.lose, minWidth: 32 }}>{m.result === "win" ? "WIN" : "LOSE"}</span>
                              <span style={{ fontSize: 11, color: T.dim }}>{formatDate(m.date)}</span>
                              <span style={{ fontSize: 11, color: T.dim, marginLeft: "auto" }}>{formatTime(m.time)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Calendar */}
                <div style={{ fontSize: 13, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{t("analysis.dailyRecord")}</div>
                <div style={{ ...cd, padding: "12px 14px" }}>
                  {calendarView}
                </div>
              </>
            )}
          </div>
        )}

        {overlays}
      </div>
    );
  }

  return null;
}
