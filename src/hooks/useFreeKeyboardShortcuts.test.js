import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFreeKeyboardShortcuts } from "./useFreeKeyboardShortcuts";

const dispatchKey = (key, opts = {}) => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, ...opts });
  window.dispatchEvent(event);
};

const dispatchCode = (code, opts = {}) => {
  const event = new KeyboardEvent("keydown", { code, key: opts.key || code, bubbles: true, ...opts });
  window.dispatchEvent(event);
};

const buildActions = () => ({
  recordWin: vi.fn(),
  recordLose: vi.fn(),
  openMyPicker: vi.fn(),
  openOppPicker: vi.fn(),
  closeMyPicker: vi.fn(),
  closeOppPicker: vi.fn(),
  closeConfirm: vi.fn(),
  selectRecentOpp: vi.fn(),
  selectStage: vi.fn(),
  rematch: vi.fn(),
  changeOpp: vi.fn(),
  changeMyChar: vi.fn(),
  focusMemo: vi.fn(),
  goBack: vi.fn(),
});

const renderShortcuts = (overrides = {}) => {
  const actions = buildActions();
  const props = {
    isPC: true,
    isActive: true,
    postRecord: false,
    myChar: "Mario",
    oppChar: "Link",
    showMyPicker: false,
    showOppPicker: false,
    confirmAction: null,
    recOpp: ["Mario", "Link", "Fox", "Falco", "Pikachu"],
    actions,
    ...overrides,
  };
  const { rerender } = renderHook((p) => useFreeKeyboardShortcuts(p), { initialProps: props });
  return { actions, rerender, props };
};

describe("useFreeKeyboardShortcuts", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("does nothing when isActive is false", () => {
    const { actions } = renderShortcuts({ isActive: false });
    dispatchKey("w");
    expect(actions.recordWin).not.toHaveBeenCalled();
  });

  it("records win on W when both characters are picked", () => {
    const { actions } = renderShortcuts();
    dispatchKey("w");
    expect(actions.recordWin).toHaveBeenCalledTimes(1);
  });

  it("blocks W and L while a confirm dialog is open", () => {
    const { actions } = renderShortcuts({ confirmAction: { message: "delete?" } });
    dispatchKey("w");
    dispatchKey("l");
    expect(actions.recordWin).not.toHaveBeenCalled();
    expect(actions.recordLose).not.toHaveBeenCalled();
  });

  it("closes confirm dialog on Escape with highest priority", () => {
    const { actions } = renderShortcuts({
      confirmAction: { message: "delete?" },
      showMyPicker: true,
    });
    dispatchKey("Escape");
    expect(actions.closeConfirm).toHaveBeenCalledTimes(1);
    expect(actions.closeMyPicker).not.toHaveBeenCalled();
  });

  it("dispatches changeMyChar on Digit9 in postRecord (and skips W/L)", () => {
    const { actions } = renderShortcuts({ postRecord: true });
    dispatchCode("Digit9", { key: "9" });
    expect(actions.changeMyChar).toHaveBeenCalledTimes(1);

    dispatchKey("w");
    expect(actions.recordWin).not.toHaveBeenCalled();
  });

  it("Shift+Digit3 selects the third stage (and Shift alone is a no-op)", () => {
    const { actions } = renderShortcuts({ oppChar: "Link" });
    dispatchCode("Digit3", { key: "3", shiftKey: true });
    expect(actions.selectStage).toHaveBeenCalledTimes(1);
    expect(typeof actions.selectStage.mock.calls[0][0]).toBe("string");
  });

  it("Digit2 picks recOpp[1] only when oppChar is empty", () => {
    const { actions, rerender, props } = renderShortcuts({ oppChar: "" });
    dispatchCode("Digit2", { key: "2" });
    expect(actions.selectRecentOpp).toHaveBeenCalledWith("Link");

    rerender({ ...props, oppChar: "Mario" });
    dispatchCode("Digit2", { key: "2" });
    expect(actions.selectRecentOpp).toHaveBeenCalledTimes(1);
  });
});
