import { describe, it, expect } from "vitest";
import {
  percentStr,
  barColor,
  numFormat,
  formatPower,
  rawPower,
  getStreak,
  recentChars,
  lastEndPower,
  normalizeCharSearchInput,
} from "./format";

describe("percentStr", () => {
  it("returns em dash for zero total", () => {
    expect(percentStr(0, 0)).toBe("\u2014");
  });
  it("rounds to integer percent", () => {
    expect(percentStr(1, 3)).toBe("33%");
    expect(percentStr(2, 3)).toBe("67%");
  });
});

describe("barColor", () => {
  it("returns green at 60%+", () => {
    expect(barColor(0.6)).toBe("#34C759");
    expect(barColor(0.9)).toBe("#34C759");
  });
  it("returns amber between 40% and 59%", () => {
    expect(barColor(0.5)).toBe("#FF9F0A");
  });
  it("returns red below 40%", () => {
    expect(barColor(0.39)).toBe("#FF3B30");
  });
});

describe("formatPower / rawPower", () => {
  it("strips non-digits and groups thousands", () => {
    expect(formatPower("12345678")).toBe("12,345,678");
    expect(formatPower("abc12,345xyz")).toBe("12,345");
  });
  it("rawPower returns digits only", () => {
    expect(rawPower("12,345")).toBe("12345");
    expect(rawPower("abc999def")).toBe("999");
  });
  it("numFormat returns em dash for falsy", () => {
    expect(numFormat(0)).toBe("\u2014");
    expect(numFormat(1234)).toBe("1,234");
  });
});

describe("getStreak", () => {
  it("returns zero count for empty list", () => {
    expect(getStreak([])).toEqual({ type: null, count: 0 });
  });
  it("counts trailing same-result run", () => {
    const ms = [
      { result: "lose" },
      { result: "win" },
      { result: "win" },
      { result: "win" },
    ];
    expect(getStreak(ms)).toEqual({ type: "win", count: 3 });
  });
  it("breaks the streak on the first different result", () => {
    const ms = [
      { result: "win" },
      { result: "win" },
      { result: "lose" },
    ];
    expect(getStreak(ms)).toEqual({ type: "lose", count: 1 });
  });
});

describe("recentChars", () => {
  it("returns most-recent-first list of unique chars", () => {
    const ms = [
      { myChar: "Mario" },
      { myChar: "Link" },
      { myChar: "Mario" },
      { myChar: "Fox" },
    ];
    expect(recentChars(ms, "myChar")).toEqual(["Fox", "Mario", "Link"]);
  });
});

describe("lastEndPower", () => {
  it("falls back to char start when no end is present", () => {
    const dl = {
      "2026-04-01": { chars: { Mario: { start: 100 } } },
    };
    expect(lastEndPower(dl, "Mario")).toBe(100);
  });
  it("prefers most-recent end value", () => {
    const dl = {
      "2026-04-01": { chars: { Mario: { start: 100, end: 200 } } },
      "2026-04-03": { chars: { Mario: { start: 250, end: 300 } } },
    };
    expect(lastEndPower(dl, "Mario")).toBe(300);
  });
  it("returns empty string when nothing found", () => {
    expect(lastEndPower({}, "Mario")).toBe("");
  });
});

describe("normalizeCharSearchInput", () => {
  it("converts katakana to hiragana", () => {
    expect(normalizeCharSearchInput("マリオ")).toBe("まりお");
  });
  it("normalizes width and lowercases ascii", () => {
    expect(normalizeCharSearchInput("ＭＡＲＩＯ")).toBe("mario");
  });
});
