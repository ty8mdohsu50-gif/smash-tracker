import MatchLogModal from "../shared/MatchLogModal";
import SharePopup from "../shared/SharePopup";
import ConfirmDialog from "../shared/ConfirmDialog";
import { useI18n } from "../../i18n/index.jsx";
import { analysisModalShellStyles } from "../../utils/analysis";
import RollingDetailModal from "./modals/RollingDetailModal";
import HourDetailModal from "./modals/HourDetailModal";
import StageDetailModal from "./modals/StageDetailModal";
import MatchupPopupModal from "./modals/MatchupPopupModal";

export default function AnalysisModals({
  data, onSave, T, isPC,
  totalW, hourlyStats, matchesWithIdx,
  expandedRolling, setExpandedRolling,
  hourDetailModal, setHourDetailModal,
  stageDetailId, setStageDetailId,
  matchupPopup, setMatchupPopup,
  matchLogModal, setMatchLogModal,
  sharePopup, setSharePopup,
  confirmAction, setConfirmAction,
  deleteMatch,
  editingStageIdx, setEditingStageIdx,
  updateMatchStage,
  doShare,
  formatHourFn,
}) {
  const { t, lang } = useI18n();
  const { backdrop: analysisModalBackdrop, panel: analysisModalPanel } = analysisModalShellStyles(isPC, T);

  return (
    <>
      <RollingDetailModal
        expandedRolling={expandedRolling}
        setExpandedRolling={setExpandedRolling}
        data={data}
        totalW={totalW}
        T={T}
        isPC={isPC}
        t={t}
        lang={lang}
        analysisModalBackdrop={analysisModalBackdrop}
        analysisModalPanel={analysisModalPanel}
      />
      <HourDetailModal
        hourDetailModal={hourDetailModal}
        setHourDetailModal={setHourDetailModal}
        hourlyStats={hourlyStats}
        data={data}
        totalW={totalW}
        matchesWithIdx={matchesWithIdx}
        formatHourFn={formatHourFn}
        T={T}
        isPC={isPC}
        t={t}
        lang={lang}
        analysisModalBackdrop={analysisModalBackdrop}
        analysisModalPanel={analysisModalPanel}
      />
      <StageDetailModal
        stageDetailId={stageDetailId}
        setStageDetailId={setStageDetailId}
        data={data}
        totalW={totalW}
        matchesWithIdx={matchesWithIdx}
        T={T}
        isPC={isPC}
        t={t}
        lang={lang}
        analysisModalBackdrop={analysisModalBackdrop}
        analysisModalPanel={analysisModalPanel}
      />
      <MatchupPopupModal
        matchupPopup={matchupPopup}
        setMatchupPopup={setMatchupPopup}
        data={data}
        onSave={onSave}
        editingStageIdx={editingStageIdx}
        setEditingStageIdx={setEditingStageIdx}
        updateMatchStage={updateMatchStage}
        doShare={doShare}
        T={T}
        isPC={isPC}
        t={t}
        lang={lang}
      />

      {matchLogModal && (
        <MatchLogModal
          open
          onClose={() => setMatchLogModal(null)}
          title={matchLogModal.title}
          matches={matchLogModal.matches}
          T={T}
          t={t}
          lang={lang}
          isPC={isPC}
        />
      )}
      {sharePopup && <SharePopup text={sharePopup.text} imageBlob={sharePopup.imageBlob} onClose={() => setSharePopup(null)} T={T} />}
      {confirmAction && (
        <ConfirmDialog
          message={t("common.deleteConfirm")}
          confirmLabel={t("history.delete")}
          cancelLabel={t("settings.cancel")}
          onConfirm={() => { deleteMatch(confirmAction.idx); setConfirmAction(null); }}
          onCancel={() => setConfirmAction(null)}
          T={T}
        />
      )}
    </>
  );
}
