import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";

export function useSessionCard() {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [imageBlob, setImageBlob] = useState(null);

  const generateCard = useCallback(async () => {
    if (!cardRef.current || generating) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: 1200,
        height: 630,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      setImageBlob(blob);
      return blob;
    } finally {
      setGenerating(false);
    }
  }, [generating]);

  const clearImage = useCallback(() => setImageBlob(null), []);

  return { cardRef, generating, imageBlob, generateCard, clearImage };
}
