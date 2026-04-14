import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBattleState } from "./useBattleState";
import { ToastProvider } from "../contexts/ToastContext";
import { I18nProvider } from "../i18n/index.jsx";

const wrapper = ({ children }) => (
  <I18nProvider>
    <ToastProvider>{children}</ToastProvider>
  </I18nProvider>
);

const baseData = (overrides = {}) => ({
  matches: [],
  settings: { myChar: "Mario" },
  daily: {},
  goals: {},
  ...overrides,
});

const renderBattleState = (data = baseData()) => {
  const onSave = vi.fn();
  const result = renderHook(
    ({ d }) => useBattleState({ data: d, onSave, isPC: true }),
    { wrapper, initialProps: { d: data } },
  );
  return { ...result, onSave };
};

describe("useBattleState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes phase=setup and inherits myChar from data.settings", () => {
    const { result } = renderBattleState();
    expect(result.current.phase).toBe("setup");
    expect(result.current.myChar).toBe("Mario");
  });

  it("transitions setup → battle on startBattle when pStart and myChar are set", () => {
    const { result, onSave } = renderBattleState();
    act(() => { result.current.setPStart(13000000); });
    act(() => { result.current.startBattle(); });
    expect(result.current.phase).toBe("battle");
    expect(onSave).toHaveBeenCalled();
  });

  it("startBattle is a no-op when pStart is missing", () => {
    const { result, onSave } = renderBattleState();
    act(() => { result.current.startBattle(); });
    expect(result.current.phase).toBe("setup");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("recordMatch writes the match, advances to postMatch, and clears the memo", () => {
    const { result, onSave } = renderBattleState();
    act(() => { result.current.setPStart(13000000); });
    act(() => { result.current.startBattle(); });
    act(() => { result.current.setOppChar("Link"); });
    act(() => { result.current.setMemo("test memo"); });
    act(() => { result.current.recordMatch("win", "Link"); });

    expect(result.current.phase).toBe("postMatch");
    expect(result.current.lastRes).toBe("win");
    expect(result.current.memo).toBe("");
    const lastSavedData = onSave.mock.calls[onSave.mock.calls.length - 1][0];
    expect(lastSavedData.matches).toHaveLength(1);
    expect(lastSavedData.matches[0]).toMatchObject({ myChar: "Mario", oppChar: "Link", result: "win" });
  });

  it("computes today's tW/tL from data.matches", () => {
    const today = new Date().toISOString().slice(0, 10);
    const data = baseData({
      matches: [
        { date: today, time: "t1", myChar: "Mario", oppChar: "Link", result: "win" },
        { date: today, time: "t2", myChar: "Mario", oppChar: "Fox", result: "win" },
        { date: today, time: "t3", myChar: "Mario", oppChar: "Falco", result: "lose" },
        { date: "1999-01-01", time: "t4", myChar: "Mario", oppChar: "Link", result: "win" },
      ],
    });
    const { result } = renderBattleState(data);
    expect(result.current.tW).toBe(2);
    expect(result.current.tL).toBe(1);
    expect(result.current.tM).toHaveLength(3);
  });

  it("doShare opens the share popup state", () => {
    const { result } = renderBattleState();
    act(() => { result.current.doShare("hello world"); });
    expect(result.current.sharePopupText).toBe("hello world");
    expect(result.current.sharePopupImage).toBeNull();
  });
});
