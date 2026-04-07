import { useState, useMemo } from "react";
import { Share2, ArrowLeft, Clock } from "lucide-react";
import CharPicker from "./CharPicker";
import FighterIcon from "./FighterIcon";
import SharePopup from "./SharePopup";
import Toast from "./Toast";
import ConfirmDialog from "./ConfirmDialog";
import { fighterName } from "../constants/fighters";
import { useI18n } from "../i18n/index.jsx";
import { today, formatTime, formatDateWithDay, percentStr, recentChars } from "../utils/format";

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

  const freeMatches = useMemo(() => data.freeMatches || [], [data.freeMatches]);
  const freeOpponents = useMemo(() => data.freeOpponents || [], [data.freeOpponents]);

  const recMy = useMemo(() => recentChars(freeMatches, "myChar"), [freeMatches]);
  const recOpp = useMemo(() => recentChars(freeMatches, "oppChar"), [freeMatches]);

  const getOpponentStats = (opponent) => {
    const ms = freeMatches.filter((m) => m.opponent === opponent);
    const w = ms.filter((m) => m.result === "win").length;
    const l = ms.filter((m) => m.result === "lose").length;
    return { total: ms.length, w, l };
  };

  const getTodayMatches = (opponent) => {
    const todayStr = today();
    return freeMatches.filter((m) => m.opponent === opponent && m.date === todayStr);
  };

  const getOpponentHistory = (opponent) => {
    return freeMatches.filter((m) => m.opponent === opponent);
  };

  const deleteFreeMatch = (match) => {
    setConfirmAction({
      message: t("common.deleteConfirm"),
      onConfirm: () => {
        const newMatches = freeMatches.filter((m) => m !== match);
        onSave({ ...data, freeMatches: newMatches });
        setConfirmAction(null);
      },
    });
  };

  const addOpponent = () => {
    const name = newOpponentName.trim();
    if (!name || freeOpponents.includes(name)) return;
    const updated = { ...data, freeOpponents: [...freeOpponents, name] };
    onSave(updated);
    setNewOpponentName("");
    setShowAddInput(false);
  };

  const deleteOpponent = (opponent) => {
    const updatedOpponents = freeOpponents.filter((o) => o !== opponent);
    const updatedMatches = freeMatches.filter((m) => m.opponent !== opponent);
    onSave({ ...data, freeOpponents: updatedOpponents, freeMatches: updatedMatches });
  };

  const recordMatch = (result) => {
    if (!myChar || !oppChar || !selectedOpponent) return;
    const now = new Date().toISOString();
    const match = {
      date: today(),
      time: now,
      opponent: selectedOpponent,
      myChar,
      oppChar,
      result,
    };
    const updated = { ...data, freeMatches: [...freeMatches, match] };
    onSave(updated);
    setLastResult(result);
    setPostRecord(true);
    setToast(t("battle.toastRecorded"));
  };

  const buildShareText = (opponent, matchList) => {
    const w = matchList.filter((m) => m.result === "win").length;
    const l = matchList.filter((m) => m.result === "lose").length;
    const rate = matchList.length > 0 ? Math.round((w / matchList.length) * 100) : 0;
    const lines = [
      `【SMASH TRACKER】フリー対戦 vs ${opponent}`,
      "",
      `${w}W ${l}L（勝率 ${rate}%）`,
      ...matchList.map((m) => {
        const label = m.result === "win" ? "WIN" : "LOSE";
        return `${label} ${fighterName(m.myChar, lang)} vs ${fighterName(m.oppChar, lang)}`;
      }),
      "",
      "#スマブラ #SmashTracker #スマトラ",
      "https://smash-tracker.pages.dev/",
    ];
    return lines.join("\n");
  };

  const doShare = async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (_) { /* cancelled */ }
    }
    setSharePopupText(text);
  };

  const cd = {
    background: T.card,
    borderRadius: 16,
    border: `1px solid ${T.brd}`,
    boxShadow: T.sh,
    padding: "16px 18px",
    marginBottom: 10,
  };

  const btnBase = {
    border: "none",
    borderRadius: 12,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all .15s ease",
    fontFamily: "inherit",
  };

  // ── list phase ──
  if (phase === "list") {
    return (
      <div style={{ animation: "fadeUp .2s ease" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button
            onClick={onBack}
            style={{ ...btnBase, padding: "8px 14px", background: T.inp, color: T.sub, fontSize: 13 }}
          >
            {t("free.back")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: T.accentGrad,
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: 0.5,
              }}
            >
              FREE
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{t("free.title")}</span>
          </div>
        </div>

        {/* Add opponent */}
        <div style={{ ...cd }}>
          {showAddInput ? (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={newOpponentName}
                onChange={(e) => setNewOpponentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addOpponent();
                  if (e.key === "Escape") { setShowAddInput(false); setNewOpponentName(""); }
                }}
                placeholder={t("free.opponentName")}
                autoFocus
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: `1.5px solid ${T.accent}`, background: T.inp,
                  color: T.text, fontSize: 14, outline: "none", fontFamily: "inherit",
                }}
              />
              <button
                onClick={addOpponent}
                disabled={!newOpponentName.trim()}
                style={{
                  ...btnBase,
                  padding: "10px 18px",
                  background: newOpponentName.trim() ? T.accentGrad : T.inp,
                  color: newOpponentName.trim() ? "#fff" : T.dim,
                  fontSize: 13,
                  boxShadow: newOpponentName.trim() ? T.accentGlow : "none",
                }}
              >
                {t("free.add")}
              </button>
              <button
                onClick={() => { setShowAddInput(false); setNewOpponentName(""); }}
                style={{ ...btnBase, padding: "10px 14px", background: T.inp, color: T.sub, fontSize: 13 }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddInput(true)}
              style={{
                ...btnBase,
                width: "100%",
                background: T.accentSoft,
                color: T.accent,
                border: `1.5px dashed ${T.accentBorder}`,
                fontSize: 14,
              }}
            >
              + {t("free.addOpponent")}
            </button>
          )}
        </div>

        {/* Opponents list */}
        {freeOpponents.length === 0 ? (
          <div style={{ ...cd, textAlign: "center", padding: "32px 18px" }}>
            <div style={{ fontSize: 14, color: T.dim, fontWeight: 500 }}>{t("free.noOpponents")}</div>
          </div>
        ) : (
          <div>
            {freeOpponents.map((opponent) => {
              const { total, w, l } = getOpponentStats(opponent);
              const rate = total > 0 ? Math.round((w / total) * 100) : null;
              return (
                <div key={opponent} style={{ ...cd, display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => { setSelectedOpponent(opponent); setPostRecord(false); setPhase("battle"); }}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", gap: 14,
                      background: "none", border: "none", cursor: "pointer",
                      padding: 0, textAlign: "left", fontFamily: "inherit",
                    }}
                  >
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: T.accentSoft,
                        border: `2px solid ${T.accentBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: T.accent, flexShrink: 0,
                      }}
                    >
                      {opponent[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{opponent}</div>
                      {total > 0 ? (
                        <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                          <span style={{ color: T.win, fontWeight: 700 }}>{w}{t("free.winLabel")}</span>
                          {" : "}
                          <span style={{ color: T.lose, fontWeight: 700 }}>{l}{t("free.loseLabel")}</span>
                          {"  "}
                          <span style={{ color: rate >= 60 ? T.win : rate >= 40 ? "#FF9F0A" : T.lose, fontWeight: 700 }}>
                            {rate}%
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>—</div>
                      )}
                    </div>
                  </button>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => { setSelectedOpponent(opponent); setPhase("history"); }}
                      style={{
                        ...btnBase,
                        padding: "6px 12px",
                        background: T.inp,
                        color: T.sub,
                        fontSize: 12,
                      }}
                    >
                      {t("free.history")}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmAction({
                          message: `${opponent} ${t("free.deleteOpponent")}?`,
                          onConfirm: () => { deleteOpponent(opponent); setConfirmAction(null); },
                        });
                      }}
                      style={{
                        ...btnBase,
                        padding: "6px 10px",
                        background: T.loseBg,
                        color: T.lose,
                        fontSize: 12,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {confirmAction && (
          <ConfirmDialog
            message={confirmAction.message}
            confirmLabel={t("history.delete")}
            cancelLabel={t("settings.cancel")}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setConfirmAction(null)}
            T={T}
          />
        )}
      </div>
    );
  }

  // ── battle phase ──
  if (phase === "battle") {
    const todayMs = getTodayMatches(selectedOpponent);
    const todayW = todayMs.filter((m) => m.result === "win").length;
    const todayL = todayMs.filter((m) => m.result === "lose").length;

    return (
      <div style={{ animation: "fadeUp .2s ease" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => { setPhase("list"); setPostRecord(false); setLastResult(null); }}
            style={{ ...btnBase, padding: "8px 14px", background: T.inp, color: T.sub, fontSize: 13 }}
          >
            {t("free.back")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: T.accentGrad,
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: 0.5,
              }}
            >
              FREE
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>
              vs {selectedOpponent}
            </span>
          </div>
          {todayMs.length > 0 && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: T.win, fontWeight: 700 }}>{todayW}W</span>
              <span style={{ fontSize: 13, color: T.lose, fontWeight: 700 }}>{todayL}L</span>
            </div>
          )}
        </div>

        {!postRecord && (
          <>
            {/* My char */}
            <div style={{ ...cd }}>
              {showMyPicker ? (
                <CharPicker
                  value={myChar}
                  onChange={(c) => { setMyChar(c); setShowMyPicker(false); }}
                  label={t("battle.selectChar")}
                  placeholder={t("charPicker.select")}
                  recent={recMy}
                  autoOpen
                  T={T}
                />
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{t("battle.selectChar")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    {myChar && <FighterIcon name={myChar} size={32} />}
                    <span style={{ fontSize: 16, fontWeight: 700, color: myChar ? T.text : T.dim }}>
                      {myChar ? fighterName(myChar, lang) : t("battle.notSelected")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setShowMyPicker(true)}
                      style={{ ...btnBase, padding: "7px 13px", background: T.inp, color: T.sub, fontSize: 12, border: `1px solid ${T.brd}` }}
                    >
                      {t("battle.change")}
                    </button>
                    {recMy.filter((c) => c !== myChar).slice(0, 3).map((c) => (
                      <button
                        key={c}
                        onClick={() => setMyChar(c)}
                        style={{ ...btnBase, padding: "7px 13px", background: T.inp, color: T.text, fontSize: 12 }}
                      >
                        {fighterName(c, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Opp char */}
            <div style={{ ...cd }}>
              {showOppPicker ? (
                <CharPicker
                  value={oppChar}
                  onChange={(c) => { setOppChar(c); setShowOppPicker(false); }}
                  label={t("battle.oppChar")}
                  placeholder={t("charPicker.select")}
                  recent={recOpp}
                  autoOpen
                  T={T}
                />
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}>{t("battle.oppChar")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    {oppChar && <FighterIcon name={oppChar} size={32} />}
                    <span style={{ fontSize: 16, fontWeight: 700, color: oppChar ? T.text : T.dim }}>
                      {oppChar ? fighterName(oppChar, lang) : t("battle.notSelected")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setShowOppPicker(true)}
                      style={{ ...btnBase, padding: "7px 13px", background: T.inp, color: T.sub, fontSize: 12, border: `1px solid ${T.brd}` }}
                    >
                      {t("battle.change")}
                    </button>
                    {recOpp.filter((c) => c !== oppChar).slice(0, 3).map((c) => (
                      <button
                        key={c}
                        onClick={() => setOppChar(c)}
                        style={{ ...btnBase, padding: "7px 13px", background: T.inp, color: T.text, fontSize: 12 }}
                      >
                        {fighterName(c, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Win / Lose buttons */}
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <button
                onClick={() => recordMatch("win")}
                disabled={!myChar || !oppChar}
                style={{
                  ...btnBase,
                  flex: 1,
                  padding: "16px",
                  fontSize: 18,
                  background: myChar && oppChar ? T.win : T.inp,
                  color: myChar && oppChar ? "#fff" : T.dim,
                  boxShadow: myChar && oppChar ? `0 4px 16px ${T.win}44` : "none",
                }}
              >
                {t("battle.win")}
              </button>
              <button
                onClick={() => recordMatch("lose")}
                disabled={!myChar || !oppChar}
                style={{
                  ...btnBase,
                  flex: 1,
                  padding: "16px",
                  fontSize: 18,
                  background: myChar && oppChar ? T.lose : T.inp,
                  color: myChar && oppChar ? "#fff" : T.dim,
                  boxShadow: myChar && oppChar ? `0 4px 16px ${T.lose}44` : "none",
                }}
              >
                {t("battle.lose")}
              </button>
            </div>
          </>
        )}

        {/* Post-record: same position as win/lose buttons */}
        {postRecord && (
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "10px 0", marginBottom: 10,
              }}
            >
              <span style={{
                fontSize: 20, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif",
                color: lastResult === "win" ? T.win : T.lose,
              }}>
                {lastResult === "win" ? "WIN" : "LOSE"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setPostRecord(false)}
                style={{ ...btnBase, flex: 2, padding: "16px", background: T.accentGrad, color: "#fff", fontSize: 16, fontWeight: 800, boxShadow: T.accentGlow }}
              >
                {t("free.rematch")}
              </button>
              <button
                onClick={() => { setOppChar(""); setShowOppPicker(true); setPostRecord(false); }}
                style={{ ...btnBase, flex: 1, padding: "16px", background: T.card, color: T.text, fontSize: 14, fontWeight: 600, border: `1px solid ${T.brd}` }}
              >
                {t("free.changeChar")}
              </button>
            </div>
          </div>
        )}

        {/* Today's log */}
        {todayMs.length > 0 && (
          <div style={{ ...cd }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{t("free.todayRecord")}</div>
              <button
                onClick={() => doShare(buildShareText(selectedOpponent, todayMs))}
                style={{
                  ...btnBase,
                  padding: "5px 11px",
                  background: T.inp,
                  color: T.sub,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Share2 size={12} /> {t("free.share")}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...todayMs].reverse().map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: m.result === "win" ? T.winBg : T.loseBg,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: m.result === "win" ? T.win : T.lose,
                      fontFamily: "'Chakra Petch', sans-serif",
                      minWidth: 36,
                    }}
                  >
                    {m.result === "win" ? "WIN" : "LOSE"}
                  </span>
                  <FighterIcon name={m.myChar} size={22} />
                  <span style={{ fontSize: 12, color: T.dim }}>vs</span>
                  <FighterIcon name={m.oppChar} size={22} />
                  <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                    {fighterName(m.myChar, lang)} vs {fighterName(m.oppChar, lang)}
                  </span>
                  <span style={{ fontSize: 11, color: T.dim, display: "flex", alignItems: "center", gap: 3, marginLeft: "auto" }}>
                    <Clock size={10} /> {formatTime(m.time)}
                  </span>
                  <button
                    onClick={() => deleteFreeMatch(m)}
                    aria-label={t("history.delete")}
                    style={{ border: "none", background: "transparent", color: T.dimmer, fontSize: 16, cursor: "pointer", padding: "4px 6px", flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        {confirmAction && (
          <ConfirmDialog
            message={confirmAction.message}
            confirmLabel={t("history.delete")}
            cancelLabel={t("settings.cancel")}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setConfirmAction(null)}
            T={T}
          />
        )}
      </div>
    );
  }

  // ── history phase ──
  if (phase === "history") {
    const histMs = getOpponentHistory(selectedOpponent);
    const histW = histMs.filter((m) => m.result === "win").length;
    const histL = histMs.filter((m) => m.result === "lose").length;
    const histRate = histMs.length > 0 ? Math.round((histW / histMs.length) * 100) : null;

    const byDate = histMs.reduce((acc, m) => {
      if (!acc[m.date]) acc[m.date] = [];
      acc[m.date].push(m);
      return acc;
    }, {});
    const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

    return (
      <div style={{ animation: "fadeUp .2s ease" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => setPhase("list")}
            style={{ ...btnBase, padding: "8px 14px", background: T.inp, color: T.sub, fontSize: 13 }}
          >
            {t("free.back")}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: T.accentGrad,
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: 0.5,
              }}
            >
              FREE
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text }}>
              vs {selectedOpponent} {t("free.allHistory")}
            </span>
          </div>
        </div>

        {/* Summary */}
        {histMs.length > 0 && (
          <div style={{ ...cd, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginBottom: 4 }}>{t("free.total")}</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Chakra Petch', sans-serif" }}>
                <span style={{ color: T.win }}>{histW}W</span>
                <span style={{ color: T.dim, margin: "0 4px", fontSize: 14 }}>:</span>
                <span style={{ color: T.lose }}>{histL}L</span>
                {histRate !== null && (
                  <span style={{ fontSize: 14, color: histRate >= 60 ? T.win : histRate >= 40 ? "#FF9F0A" : T.lose, marginLeft: 10 }}>
                    {histRate}%
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => doShare(buildShareText(selectedOpponent, histMs))}
              style={{
                ...btnBase,
                padding: "8px 14px",
                background: T.inp,
                color: T.sub,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Share2 size={14} /> {t("free.share")}
            </button>
          </div>
        )}

        {/* Matches by date */}
        {histMs.length === 0 ? (
          <div style={{ ...cd, textAlign: "center", padding: "32px 18px" }}>
            <div style={{ fontSize: 14, color: T.dim }}>{t("free.noOpponents")}</div>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 6, paddingLeft: 4 }}>
                {formatDateWithDay(date)}
              </div>
              <div style={{ ...cd, padding: "10px 14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {byDate[date].map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 10,
                        background: m.result === "win" ? T.winBg : T.loseBg,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: m.result === "win" ? T.win : T.lose,
                          fontFamily: "'Chakra Petch', sans-serif",
                          minWidth: 36,
                        }}
                      >
                        {m.result === "win" ? "WIN" : "LOSE"}
                      </span>
                      <FighterIcon name={m.myChar} size={22} />
                      <span style={{ fontSize: 12, color: T.dim }}>vs</span>
                      <FighterIcon name={m.oppChar} size={22} />
                      <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                        {fighterName(m.myChar, lang)} vs {fighterName(m.oppChar, lang)}
                      </span>
                      <span style={{ fontSize: 11, color: T.dim, display: "flex", alignItems: "center", gap: 3, marginLeft: "auto" }}>
                        <Clock size={10} /> {formatTime(m.time)}
                      </span>
                      <button
                        onClick={() => deleteFreeMatch(m)}
                        aria-label={t("history.delete")}
                        style={{ border: "none", background: "transparent", color: T.dimmer, fontSize: 16, cursor: "pointer", padding: "4px 6px", flexShrink: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
        {sharePopupText && <SharePopup text={sharePopupText} onClose={() => setSharePopupText(null)} T={T} />}
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        {confirmAction && (
          <ConfirmDialog
            message={confirmAction.message}
            confirmLabel={t("history.delete")}
            cancelLabel={t("settings.cancel")}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setConfirmAction(null)}
            T={T}
          />
        )}
      </div>
    );
  }

  return null;
}
