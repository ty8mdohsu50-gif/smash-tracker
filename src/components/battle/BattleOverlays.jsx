import SharePopup from "../shared/SharePopup";
import ConfirmDialog from "../shared/ConfirmDialog";
import { useI18n } from "../../i18n/index.jsx";

export default function BattleOverlays({ state, T }) {
  const { t } = useI18n();
  const {
    sharePopupText, setSharePopupText,
    sharePopupImage, setSharePopupImage,
    confirmAction, setConfirmAction,
  } = state;

  return (
    <>
      {sharePopupText && (
        <SharePopup
          text={sharePopupText}
          imageBlob={sharePopupImage}
          onClose={() => { setSharePopupText(null); setSharePopupImage(null); }}
          T={T}
        />
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
    </>
  );
}
