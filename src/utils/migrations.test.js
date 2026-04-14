import { describe, it, expect } from "vitest";
import { migrateCounterMemos, migrateNotesV2 } from "./migrations";

describe("migrateCounterMemos", () => {
  it("converts legacy counterMemos into matchupNotes v2 shape", () => {
    const data = {
      counterMemos: {
        "Mario": "Watch fireballs in neutral",
        "Empty": "   ",
      },
    };
    const result = migrateCounterMemos(data);
    expect(result.matchupNotes.Mario).toEqual({
      flash: "Watch fireballs in neutral",
      gameplan: "",
      stage: "",
    });
    expect(result.matchupNotes.Empty).toBeUndefined();
    expect(result._notesV2).toBe(true);
  });

  it("does not touch matchupNotes when already present", () => {
    const data = {
      counterMemos: { Mario: "x" },
      matchupNotes: { Mario: { flash: "kept", gameplan: "", stage: "" } },
      _notesV2: true,
    };
    const result = migrateCounterMemos(data);
    expect(result.matchupNotes.Mario.flash).toBe("kept");
  });
});

describe("migrateNotesV2", () => {
  it("preserves notes already on the v2 schema", () => {
    const data = {
      matchupNotes: {
        Bowser: { flash: "f", gameplan: "g", stage: "FD" },
      },
      _notesV2: true,
    };
    const result = migrateNotesV2(data);
    expect(result.matchupNotes.Bowser).toEqual({ flash: "f", gameplan: "g", stage: "FD" });
  });

  it("merges legacy phase fields (neutral / advantage / disadvantage / edgeguard) into a single gameplan block", () => {
    const data = {
      matchupNotes: {
        Pikachu: {
          flash: "fast",
          neutral: "watch quick attack",
          advantage: "combo into thunder",
          disadvantage: "respect QAC",
          edgeguard: "wall of pain",
          stage: "BF",
        },
      },
    };
    const result = migrateNotesV2(data);
    const note = result.matchupNotes.Pikachu;
    expect(note.flash).toBe("fast");
    expect(note.stage).toBe("BF");
    expect(note.gameplan).toContain("【立ち回り】");
    expect(note.gameplan).toContain("watch quick attack");
    expect(note.gameplan).toContain("【有利状況】");
    expect(note.gameplan).toContain("combo into thunder");
    expect(note.gameplan).toContain("【不利状況】");
    expect(note.gameplan).toContain("【復帰阻止】");
    expect(result._notesV2).toBe(true);
  });

  it("handles a single phase field without the 【立ち回り】 header", () => {
    const data = {
      matchupNotes: {
        Fox: { neutral: "stay grounded" },
      },
    };
    const result = migrateNotesV2(data);
    expect(result.matchupNotes.Fox.gameplan).toBe("stay grounded");
  });

  it("preserves flash/stage when there are no phase fields to merge", () => {
    const data = {
      matchupNotes: {
        Link: { flash: "bombs", stage: "BF" },
      },
    };
    const result = migrateNotesV2(data);
    expect(result.matchupNotes.Link).toEqual({
      flash: "bombs",
      gameplan: "",
      stage: "BF",
      _lastReviewed: undefined,
    });
  });
});
