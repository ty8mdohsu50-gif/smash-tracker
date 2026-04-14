import { useEffect, useRef } from "react";
import { STAGES } from "../constants/stages";

export function useFreeKeyboardShortcuts({
  isPC,
  isActive,
  postRecord,
  myChar,
  oppChar,
  showMyPicker,
  showOppPicker,
  confirmAction,
  recOpp,
  actions,
}) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    if (!isPC || !isActive) return;

    const onKey = (e) => {
      if ((e.isComposing || e.keyCode === 229) && e.key !== "Escape") return;
      if (e.repeat) return;

      const a = actionsRef.current;
      const tag = e.target.tagName;
      const inTextField =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;

      if (e.key === "Escape") {
        if (confirmAction) { a.closeConfirm(); return; }
        if (showMyPicker) { a.closeMyPicker(); return; }
        if (showOppPicker) { a.closeOppPicker(); return; }
        if (inTextField) return;
        a.goBack();
        return;
      }

      if (inTextField) return;
      if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Block all other shortcuts while a picker or confirm dialog is open
      if (showMyPicker || showOppPicker || confirmAction) return;

      if (e.shiftKey && !postRecord) {
        const codeMatch = e.code.match(/^Digit([1-8])$/);
        if (codeMatch) {
          const idx = parseInt(codeMatch[1]) - 1;
          if (STAGES[idx]) {
            e.preventDefault();
            a.selectStage(STAGES[idx].id);
            return;
          }
        }
      }
      if (e.shiftKey) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      if (postRecord) {
        if (key === "n") { e.preventDefault(); a.rematch(); }
        else if (key === "c") { e.preventDefault(); a.changeOpp(); }
        else if (key === "m") { e.preventDefault(); a.focusMemo(); }
        else if (code === "Digit9") { e.preventDefault(); a.changeMyChar(); }
      } else {
        if (key === "w" && myChar && oppChar) { a.recordWin(); }
        else if (key === "l" && myChar && oppChar) { a.recordLose(); }
        else if (code === "Digit9") { e.preventDefault(); a.openMyPicker(); }
        else if (code === "Digit0") { e.preventDefault(); a.openOppPicker(); }
        else if (!oppChar && code >= "Digit1" && code <= "Digit5") {
          const idx = parseInt(code.slice(-1)) - 1;
          if (recOpp[idx]) { e.preventDefault(); a.selectRecentOpp(recOpp[idx]); }
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `actions` is intentionally read through actionsRef (always
    // current) so we don't resubscribe the listener on every render
    // when the parent passes a fresh action object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPC, isActive, postRecord, myChar, oppChar, showMyPicker, showOppPicker, confirmAction, recOpp]);
}
