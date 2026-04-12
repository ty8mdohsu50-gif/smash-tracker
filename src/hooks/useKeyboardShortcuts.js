import { useEffect, useRef } from "react";

export function useKeyboardShortcuts({
  phase, isPC, isActive, battleMode, result,
  oppChar, myChar, pStart, recOpp,
  showMyPicker, showOppPicker, sharePopupText, confirmAction,
  actions,
}) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    if (!isPC || !isActive || battleMode !== "ranked") return;

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

      switch (phase) {
        case "setup":
          if (key === " ") { e.preventDefault(); a.startBattle(); }
          break;

        case "battle":
          if (key === "w" && !result) a.selectRes("win");
          else if (key === "l" && !result) a.selectRes("lose");
          else if (key === "e") a.endSession();
          else if (key === "s") { e.preventDefault(); a.focusStage(); }
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
          break;

        case "end":
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPC, isActive, battleMode, phase, result, oppChar, myChar, pStart, recOpp,
      showMyPicker, showOppPicker, sharePopupText, confirmAction]);
}
