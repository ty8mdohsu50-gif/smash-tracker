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
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      const a = actionsRef.current;

      // Esc: close modals first, then phase back
      if (key === "escape") {
        if (confirmAction) { a.closeConfirm(); return; }
        if (showMyPicker) { a.closeMyPicker(); return; }
        if (showOppPicker) { a.closeOppPicker(); return; }
        if (sharePopupText) { a.closeShare(); return; }
        a.goBack();
        return;
      }

      // Shift+1~8: stage selection (battle & postMatch)
      if (e.shiftKey && (phase === "battle" || phase === "postMatch")) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 8 && STAGES[num - 1]) {
          e.preventDefault();
          a.selectStage(STAGES[num - 1].id);
          return;
        }
      }

      // Skip if shift is held for non-stage actions
      if (e.shiftKey) return;

      switch (phase) {
        case "setup":
          if (key === " ") { e.preventDefault(); a.startBattle(); }
          else if (key === "9") a.openMyPicker();
          else if (key === "p") { e.preventDefault(); a.focusPower(); }
          break;

        case "battle":
          if (key === "w" && !result) a.selectRes("win");
          else if (key === "l" && !result) a.selectRes("lose");
          else if (key === "e") a.endSession();
          else if (key === "s") { e.preventDefault(); a.focusStage(); }
          else if (key === "0") a.openOppPicker();
          else if (key === "9") a.openMyPicker();
          else if (!oppChar && key >= "1" && key <= "5") {
            const idx = parseInt(key) - 1;
            if (recOpp[idx]) a.selectRecentOpp(recOpp[idx]);
          }
          break;

        case "postMatch":
          if (key === "n") a.continueSame();
          else if (key === "c") a.changeOpp();
          else if (key === "e") a.endSession();
          else if (key === "m") { e.preventDefault(); a.focusMemo(); }
          else if (key === "0") a.changeOpp();
          else if (key === "9") a.openMyPicker();
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
