import { useEffect, useRef } from "react";
import { STAGES } from "../constants/stages";

export function useKeyboardShortcuts({
  phase, isPC, isActive, result,
  oppChar, myChar, pStart, recOpp,
  showMyPicker, showOppPicker, sharePopupText, confirmAction,
  actions,
}) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    if (!isPC || !isActive) return;

    const onKey = (e) => {
      // Guard: text input
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.target.isContentEditable) return;

      // Guard: browser shortcuts (Ctrl/Cmd/Alt)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const a = actionsRef.current;

      // Esc always works — close modals first, then phase back
      if (e.key === "Escape") {
        if (confirmAction) { a.closeConfirm(); return; }
        if (showMyPicker) { a.closeMyPicker(); return; }
        if (showOppPicker) { a.closeOppPicker(); return; }
        if (sharePopupText) { a.closeShare(); return; }
        a.goBack();
        return;
      }

      // When any picker/modal is open, block all other shortcuts
      if (showMyPicker || showOppPicker || confirmAction || sharePopupText) return;

      // Shift + Digit1~Digit8: stage selection (battle & postMatch)
      // Use e.code (layout-independent) to avoid Shift producing symbols
      if (e.shiftKey && (phase === "battle" || phase === "postMatch")) {
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

      // No other Shift combos
      if (e.shiftKey) return;

      // Use e.code for number keys (layout-independent), e.key for letters
      const code = e.code;
      const key = e.key.toLowerCase();

      switch (phase) {
        case "setup":
          if (key === " ") { e.preventDefault(); a.startBattle(); }
          else if (code === "Digit9") { e.preventDefault(); a.openMyPicker(); }
          else if (key === "p") { e.preventDefault(); a.focusPower(); }
          break;

        case "battle":
          if (key === "w" && !result) a.selectRes("win");
          else if (key === "l" && !result) a.selectRes("lose");
          else if (key === "e") a.endSession();
          else if (key === "s") { e.preventDefault(); a.focusStage(); }
          else if (code === "Digit0") { e.preventDefault(); a.openOppPicker(); }
          else if (code === "Digit9") { e.preventDefault(); a.openMyPicker(); }
          else if (!oppChar && code >= "Digit1" && code <= "Digit5") {
            const idx = parseInt(code.slice(-1)) - 1;
            if (recOpp[idx]) { e.preventDefault(); a.selectRecentOpp(recOpp[idx]); }
          }
          break;

        case "postMatch":
          if (key === "n") a.continueSame();
          else if (key === "c") a.changeOpp();
          else if (key === "e") a.endSession();
          else if (key === "m") { e.preventDefault(); a.focusMemo(); }
          else if (code === "Digit0") { e.preventDefault(); a.changeOpp(); }
          else if (code === "Digit9") { e.preventDefault(); a.openMyPicker(); }
          break;

        case "end":
          if (key === "enter") { e.preventDefault(); a.saveAndEnd(); }
          else if (key === "s") { e.preventDefault(); a.shareAndEnd(); }
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPC, isActive, phase, result, oppChar, myChar, pStart, recOpp,
      showMyPicker, showOppPicker, sharePopupText, confirmAction]);
}
