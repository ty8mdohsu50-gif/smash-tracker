export function migrateNotesV2(d) {
  if (!d.matchupNotes || d._notesV2) return d;
  let changed = false;
  for (const [key, note] of Object.entries(d.matchupNotes)) {
    if (note.gameplan !== undefined) continue;
    const parts = [];
    const hasMultiple = [note.neutral, note.advantage, note.disadvantage, note.edgeguard].filter((v) => v?.trim()).length > 1;
    if (note.neutral?.trim()) parts.push(hasMultiple ? `【立ち回り】\n${note.neutral.trim()}` : note.neutral.trim());
    if (note.advantage?.trim()) parts.push(`【有利状況】\n${note.advantage.trim()}`);
    if (note.disadvantage?.trim()) parts.push(`【不利状況】\n${note.disadvantage.trim()}`);
    if (note.edgeguard?.trim()) parts.push(`【復帰阻止】\n${note.edgeguard.trim()}`);
    if (parts.length > 0) {
      d.matchupNotes[key] = { flash: note.flash || "", gameplan: parts.join("\n\n"), stage: note.stage || "", _lastReviewed: note._lastReviewed };
      changed = true;
    } else if (note.flash || note.stage) {
      d.matchupNotes[key] = { flash: note.flash || "", gameplan: "", stage: note.stage || "", _lastReviewed: note._lastReviewed };
      changed = true;
    }
  }
  if (changed) d._notesV2 = true;
  return d;
}

export function migrateCounterMemos(d) {
  if (d.counterMemos && !d.matchupNotes) {
    const notes = {};
    for (const [key, text] of Object.entries(d.counterMemos)) {
      if (text && text.trim()) {
        notes[key] = { flash: text, gameplan: "", stage: "" };
      }
    }
    d.matchupNotes = notes;
    d._notesV2 = true;
  }
  return migrateNotesV2(d);
}
