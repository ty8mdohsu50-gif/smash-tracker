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
      // Guard: IME composition (Japanese input, etc.) — but allow Esc
      // through so the user can always dismiss a picker / modal even
      // while composing hiragana.
      if ((e.isComposing || e.keyCode === 229) && e.key !== "Escape") return;

      // Guard: auto-repeat (holding a key) — prevents accidental spam
      if (e.repeat) return;

      const a = actionsRef.current;
      const tag = e.target.tagName;
      const inTextField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;

      // Esc always works — even when a text input inside a picker/modal
      // is focused — so that users can back out of the CharPicker's
      // search input (and any other nested text input) via keyboard.
      if (e.key === "Escape") {
        if (confirmAction) { a.closeConfirm(); return; }
        if (showMyPicker) { a.closeMyPicker(); return; }
        if (showOppPicker) { a.closeOppPicker(); return; }
        if (sharePopupText) { a.closeShare(); return; }
        if (inTextField) return; // nothing to unwind; let browser handle blur
        a.goBack();
        return;
      }

      // All other shortcuts: skip when typing into a text field
      if (inTextField) return;

      // Guard: focused button will already activate on Space/Enter —
      // skip the shortcut so the button click isn't duplicated.
      if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;

      // Guard: browser shortcuts (Ctrl/Cmd/Alt)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

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
          // Digit9 transitions back to setup (same as the existing
          // "自キャラを変える" button). Previously it called
          // openMyPicker, but the CharPicker is not rendered in
          // postMatch JSX — the state flipped silently with no
          // visible effect.
          else if (code === "Digit9") { e.preventDefault(); a.changeChar(); }
          break;

        case "end":
          if (key === "enter") { e.preventDefault(); a.saveAndEnd(); }
          else if (key === "s") { e.preventDefault(); a.shareAndEnd(); }
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // Dependencies intentionally limited: `actions` is read through
    // actionsRef (always fresh), and the rest are values the handler
    // branches on. Adding every watched state variable would cause
    // redundant listener resubscription on each battle update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPC, isActive, phase, result, oppChar, recOpp,
      showMyPicker, showOppPicker, sharePopupText, confirmAction]);
}
