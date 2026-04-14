import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { useToast } from "../contexts/ToastContext";
import { useI18n } from "../i18n/index.jsx";
import { SHARE_CARD_SCALE, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from "../constants/rendering";

export function useSessionCard() {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [imageBlob, setImageBlob] = useState(null);
  const toast = useToast();
  const { t } = useI18n();

  const generateCard = useCallback(async () => {
    if (!cardRef.current || generating) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: SHARE_CARD_SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: SHARE_CARD_WIDTH,
        height: SHARE_CARD_HEIGHT,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      setImageBlob(blob);
      return blob;
    } catch {
      toast.error(t("common.errors.imageGen"));
      return null;
    } finally {
      setGenerating(false);
    }
  }, [generating, toast, t]);

  const clearImage = useCallback(() => setImageBlob(null), []);

  return { cardRef, generating, imageBlob, generateCard, clearImage };
}
