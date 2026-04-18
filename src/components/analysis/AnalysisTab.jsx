import { useState, useMemo, useCallback, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { FIGHTERS } from "../../constants/fighters";
import { formatHour } from "../../utils/format";
import { useI18n } from "../../i18n/index.jsx";
import { ANALYSIS_PREFS_KEY, loadAnalysisPrefs } from "../../utils/analysis";
import { pill } from "./analysisHelpers";
import MyCharMode from "./MyCharMode";
import OppCharMode from "./OppCharMode";
import OverallMode from "./OverallMode";
import AnalysisModals from "./AnalysisModals";

export default function AnalysisTab({ data, onSave, T, isPC, aMode, setAMode }) {
  const { t } = useI18n();

  // Navigation state
  const [charDetail, setCharDetailRaw] = useState(null);
  const [oppDetail, setOppDetailRaw] = useState(null);

  const setCharDetail = useCallback((v) => {
    if (v && !isPC) window.history.pushState({ type: "charDetail", v }, "", `#a/char/${encodeURIComponent(v)}`);
    setCharDetailRaw(v);
  }, [isPC]);
  const setOppDetail = useCallback((v) => {
    if (v && !isPC) window.history.pushState({ type: "oppDetail", v }, "", `#a/opp/${encodeURIComponent(v)}`);
    setOppDetailRaw(v);
  }, [isPC]);

  useEffect(() => {
    if (isPC) return;
    const onPop = () => {
      if (oppDetail) { setOppDetailRaw(null); return; }
      if (charDetail) { setCharDetailRaw(null); return; }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isPC, charDetail, oppDetail]);

  const [oppSubTab, setOppSubTab] = useState("myChars");

  // Expansion state
  const [expandedItem, setExpandedItem] = useState(null);
  const [dateDetailModal, setDateDetailModal] = useState(null);
  const [expandedRolling, setExpandedRolling] = useState(null);
  const [hourDetailModal, setHourDetailModal] = useState(null);
  const [stageDetailId, setStageDetailId] = useState(null);

  // PC matchup popup
  const [matchupPopup, setMatchupPopup] = useState(null);

  // Editing state
  const [sharePopup, setSharePopup] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingStageIdx, setEditingStageIdx] = useState(null);
  const [analysisPrefs, setAnalysisPrefsState] = useState(loadAnalysisPrefs);
  const [matchLogModal, setMatchLogModal] = useState(null);

  const setAnalysisPrefs = useCallback((patch) => {
    setAnalysisPrefsState((prev) => {
      const n = { ...prev, ...patch };
      try {
        localStorage.setItem(ANALYSIS_PREFS_KEY, JSON.stringify(n));
      } catch {
        /* ignore */
      }
      return n;
    });
  }, []);

  const matchesWithIdx = useMemo(() => data.matches.map((m, idx) => ({ ...m, idx })), [data.matches]);

  // Month navigation for daily list
  const [dailyMonth, setDailyMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // ── Computed data ──

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
      .sort((a, b) => FIGHTERS.indexOf(a.c) - FIGHTERS.indexOf(b.c));
  }, [data]);

  const totalW = useMemo(() => data.matches.filter((m) => m.result === "win").length, [data]);
  const totalL = data.matches.length - totalW;

  // Char detail matchups
  const charMatchups = useMemo(() => {
    if (!charDetail) return [];
    const s = {};
    data.matches.filter((m) => m.myChar === charDetail).forEach((m) => {
      if (!s[m.oppChar]) s[m.oppChar] = { w: 0, l: 0 };
      m.result === "win" ? s[m.oppChar].w++ : s[m.oppChar].l++;
    });
    return FIGHTERS.map((c) => ({
      c, w: s[c]?.w || 0, l: s[c]?.l || 0, t: (s[c]?.w || 0) + (s[c]?.l || 0),
    }));
  }, [data, charDetail]);

  // Opp detail: my chars used against this opponent
  const oppMyChars = useMemo(() => {
    if (!oppDetail) return [];
    const s = {};
    data.matches.filter((m) => m.oppChar === oppDetail).forEach((m) => {
      if (!s[m.myChar]) s[m.myChar] = { w: 0, l: 0 };
      m.result === "win" ? s[m.myChar].w++ : s[m.myChar].l++;
    });
    return Object.entries(s)
      .map(([c, v]) => ({ c, w: v.w, l: v.l, t: v.w + v.l }))
      .sort((a, b) => b.t - a.t);
  }, [data, oppDetail]);

  // Hourly stats
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

  // Rolling win rate
  const rolling = useMemo(() => {
    const r = {};
    [20, 50].forEach((n) => {
      const recent = data.matches.slice(-n);
      const w = recent.filter((m) => m.result === "win").length;
      r[n] = { w, t: recent.length };
    });
    return r;
  }, [data]);

  // ── Helpers ──

  const doShare = (text, imageBlob) => {
    setSharePopup({ text, imageBlob: imageBlob || null });
  };

  const deleteMatch = (idx) => {
    const nm = [...data.matches];
    nm.splice(idx, 1);
    onSave({ ...data, matches: nm });
  };

  const updateMatchStage = (idx, newStage) => {
    const nm = [...data.matches];
    nm[idx] = { ...nm[idx], stage: newStage || undefined };
    onSave({ ...data, matches: nm });
    setEditingStageIdx(null);
  };

  // ── Empty state ──

  if (data.matches.length === 0) {
    return (
      <div style={isPC ? { display: "flex", flexDirection: "column", height: "100%", minHeight: 0, minWidth: 0 } : undefined}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexShrink: 0 }}>
          {pill("myChar", t("analysis.myChar"), aMode, setAMode, T, isPC)}
          {pill("oppChar", t("analysis.oppChar"), aMode, setAMode, T, isPC)}
          {pill("overall", t("analysis.overall"), aMode, setAMode, T, isPC)}
        </div>
        <div style={{ background: T.card, borderRadius: 16, padding: "48px 24px", boxShadow: T.sh, border: T.brd !== "transparent" ? `1px solid ${T.brd}` : "none", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ background: T.accentSoft, borderRadius: "50%", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${T.accentBorder}` }}>
            <BarChart3 size={24} strokeWidth={2} color={T.accent} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t("analysis.emptyTitle")}</div>
          <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.6 }}>{t("analysis.emptyDesc")}</div>
        </div>
      </div>
    );
  }

  // ── Main render ──

  const switchMode = (k) => { setAMode(k); setCharDetail(null); setOppDetail(null); setDateDetailModal(null); };

  return (
    <div style={isPC ? { display: "flex", flexDirection: "column", height: "100%", minHeight: 0, minWidth: 0 } : undefined}>
      {/* Top-level tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: isPC ? 8 : 12, flexShrink: 0 }}>
        {pill("myChar", t("analysis.myChar"), aMode, switchMode, T, isPC)}
        {pill("oppChar", t("analysis.oppChar"), aMode, switchMode, T, isPC)}
        {pill("overall", t("analysis.overall"), aMode, switchMode, T, isPC)}
      </div>
      {data.matches.length > 0 && (
        <div style={{ fontSize: 10, color: T.dim, marginBottom: isPC ? 6 : 10, lineHeight: 1.45, flexShrink: 0 }}>{t("analysis.rankedOnlyNote")}</div>
      )}

      {/* MODE: MY CHAR */}
      {aMode === "myChar" && (
        <MyCharMode
          data={data} onSave={onSave} T={T} isPC={isPC}
          charDetail={charDetail} setCharDetail={setCharDetail}
          mCS={mCS} charMatchups={charMatchups} matchesWithIdx={matchesWithIdx}
          analysisPrefs={analysisPrefs} setAnalysisPrefs={setAnalysisPrefs}
          setMatchupPopup={setMatchupPopup} setOppDetail={setOppDetail} setOppSubTab={setOppSubTab}
          setExpandedItem={setExpandedItem} setDateDetailModal={setDateDetailModal} dateDetailModal={dateDetailModal}
          setMatchLogModal={setMatchLogModal}
          editingStageIdx={editingStageIdx} setEditingStageIdx={setEditingStageIdx}
          setConfirmAction={setConfirmAction} updateMatchStage={updateMatchStage} doShare={doShare}
          dailyMonth={dailyMonth} setDailyMonth={setDailyMonth}
        />
      )}

      {/* MODE: OPP CHAR */}
      {aMode === "oppChar" && (
        <OppCharMode
          data={data} onSave={onSave} T={T} isPC={isPC}
          oppDetail={oppDetail} setOppDetail={setOppDetail}
          oCS={oCS} oppMyChars={oppMyChars} matchesWithIdx={matchesWithIdx}
          analysisPrefs={analysisPrefs} setAnalysisPrefs={setAnalysisPrefs}
          setMatchupPopup={setMatchupPopup} setOppSubTab={setOppSubTab}
          setExpandedItem={setExpandedItem} setDateDetailModal={setDateDetailModal} dateDetailModal={dateDetailModal}
          setMatchLogModal={setMatchLogModal}
          editingStageIdx={editingStageIdx} setEditingStageIdx={setEditingStageIdx}
          setConfirmAction={setConfirmAction} updateMatchStage={updateMatchStage} doShare={doShare}
          dailyMonth={dailyMonth} setDailyMonth={setDailyMonth}
          oppSubTab={oppSubTab} setOppSubTabProp={setOppSubTab}
        />
      )}

      {/* MODE: OVERALL */}
      {aMode === "overall" && (
        <OverallMode
          data={data} T={T} isPC={isPC}
          totalW={totalW} totalL={totalL} rolling={rolling} hourlyStats={hourlyStats}
          matchesWithIdx={matchesWithIdx}
          setExpandedRolling={setExpandedRolling} setHourDetailModal={setHourDetailModal} hourDetailModal={hourDetailModal}
          setStageDetailId={setStageDetailId}
          setMatchLogModal={setMatchLogModal}
          doShare={doShare}
          dateDetailModal={dateDetailModal} setDateDetailModal={setDateDetailModal}
          editingStageIdx={editingStageIdx} setEditingStageIdx={setEditingStageIdx}
          setConfirmAction={setConfirmAction} updateMatchStage={updateMatchStage}
          dailyMonth={dailyMonth} setDailyMonth={setDailyMonth}
        />
      )}

      {/* Shared overlays */}
      <AnalysisModals
        data={data} onSave={onSave} T={T} isPC={isPC}
        totalW={totalW} hourlyStats={hourlyStats} matchesWithIdx={matchesWithIdx}
        expandedRolling={expandedRolling} setExpandedRolling={setExpandedRolling}
        hourDetailModal={hourDetailModal} setHourDetailModal={setHourDetailModal}
        stageDetailId={stageDetailId} setStageDetailId={setStageDetailId}
        matchupPopup={matchupPopup} setMatchupPopup={setMatchupPopup}
        matchLogModal={matchLogModal} setMatchLogModal={setMatchLogModal}
        sharePopup={sharePopup} setSharePopup={setSharePopup}
        confirmAction={confirmAction} setConfirmAction={setConfirmAction}
        deleteMatch={deleteMatch}
        editingStageIdx={editingStageIdx} setEditingStageIdx={setEditingStageIdx}
        updateMatchStage={updateMatchStage}
        doShare={doShare}
        formatHourFn={formatHour}
      />
    </div>
  );
}
