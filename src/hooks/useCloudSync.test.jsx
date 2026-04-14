import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const cloudSaveMock = vi.fn(() => Promise.resolve(true));
const cloudLoadMock = vi.fn(() => Promise.resolve(null));
const migrateMock = vi.fn(() => Promise.resolve(false));

vi.mock("../utils/storage", async () => {
  const actual = await vi.importActual("../utils/storage");
  return {
    ...actual,
    cloudSave: (...args) => cloudSaveMock(...args),
    cloudLoad: (...args) => cloudLoadMock(...args),
    migrateLocalToCloud: (...args) => migrateMock(...args),
  };
});

import { useCloudSync } from "./useCloudSync";
import { ToastProvider } from "../contexts/ToastContext";
import { I18nProvider } from "../i18n/index.jsx";

const wrapper = ({ children }) => (
  <I18nProvider>
    <ToastProvider>{children}</ToastProvider>
  </I18nProvider>
);

describe("useCloudSync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cloudSaveMock.mockClear();
    cloudSaveMock.mockResolvedValue(true);
    cloudLoadMock.mockClear();
    cloudLoadMock.mockResolvedValue(null);
    migrateMock.mockClear();
    migrateMock.mockResolvedValue(false);
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns default data when no user and no local storage", () => {
    const { result } = renderHook(() => useCloudSync(null), { wrapper });
    expect(result.current.data.matches).toEqual([]);
    expect(typeof result.current.saveData).toBe("function");
  });

  it("debounces localStorage writes (single flush after 250ms idle)", () => {
    const { result } = renderHook(() => useCloudSync(null), { wrapper });

    act(() => { result.current.saveData({ matches: [{ id: 1 }], settings: {}, daily: {}, goals: {} }); });
    act(() => { result.current.saveData({ matches: [{ id: 2 }], settings: {}, daily: {}, goals: {} }); });
    act(() => { result.current.saveData({ matches: [{ id: 3 }], settings: {}, daily: {}, goals: {} }); });

    expect(localStorage.getItem("smash-tracker-v4")).toBeNull();

    act(() => { vi.advanceTimersByTime(260); });

    const stored = JSON.parse(localStorage.getItem("smash-tracker-v4"));
    expect(stored.matches).toEqual([{ id: 3 }]);
  });

  it("does not call cloudSave when user is null", () => {
    const { result } = renderHook(() => useCloudSync(null), { wrapper });
    act(() => { result.current.saveData({ matches: [{ id: 1 }], settings: {}, daily: {}, goals: {} }); });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(cloudSaveMock).not.toHaveBeenCalled();
  });

  it("debounces cloudSave separately at 800ms when a user is logged in", async () => {
    const user = { id: "user-1" };
    const { result } = renderHook(() => useCloudSync(user), { wrapper });

    await act(async () => { await Promise.resolve(); });

    act(() => { result.current.saveData({ matches: [{ id: 1 }], settings: {}, daily: {}, goals: {} }); });
    act(() => { vi.advanceTimersByTime(300); });
    expect(cloudSaveMock).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(600); });
    expect(cloudSaveMock).toHaveBeenCalledTimes(1);
    expect(cloudSaveMock).toHaveBeenCalledWith("user-1", expect.objectContaining({ matches: [{ id: 1 }] }));
  });

  it("flushes pending writes on unmount so data is never stranded", () => {
    const user = { id: "user-1" };
    const { result, unmount } = renderHook(() => useCloudSync(user), { wrapper });

    act(() => { result.current.saveData({ matches: [{ id: 99 }], settings: {}, daily: {}, goals: {} }); });

    expect(localStorage.getItem("smash-tracker-v4")).toBeNull();
    expect(cloudSaveMock).not.toHaveBeenCalled();

    unmount();

    expect(JSON.parse(localStorage.getItem("smash-tracker-v4")).matches).toEqual([{ id: 99 }]);
    expect(cloudSaveMock).toHaveBeenCalledTimes(1);
  });
});
