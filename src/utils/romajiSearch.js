// Romaji → hiragana conversion for the CharPicker search box.
// Handles the common Hepburn / IME-friendly mappings plus a trailing
// incomplete consonant (e.g. "mar" or "まr") which expands to every
// hiragana starting with that consonant. Combined with the existing
// hiragana-normalised fighter text, this lets users search for
// "mario" / "mar" / "まりお" / "まり" / "まr" and all find マリオ.

// Longer keys first so lookup below can try 3 → 2 → 1 chars.
const ROMAJI_TO_HIRA = {
  // 3-char
  kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  sha: "しゃ", shu: "しゅ", sho: "しょ",
  sya: "しゃ", syu: "しゅ", syo: "しょ",
  shi: "し",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
  chi: "ち",
  tya: "ちゃ", tyu: "ちゅ", tyo: "ちょ",
  tsu: "つ",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  fya: "ふゃ", fyu: "ふゅ", fyo: "ふょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  mya: "みゃ", myu: "みゅ", myo: "みょ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  jya: "じゃ", jyu: "じゅ", jyo: "じょ",
  zya: "じゃ", zyu: "じゅ", zyo: "じょ",
  fja: "ふぁ", fji: "ふぃ", fje: "ふぇ", fjo: "ふぉ",

  // 2-char
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  sa: "さ", si: "し", su: "す", se: "せ", so: "そ",
  za: "ざ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  ja: "じゃ", ju: "じゅ", je: "じぇ", jo: "じょ", ji: "じ",
  ta: "た", ti: "ち", tu: "つ", te: "て", to: "と",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  ha: "は", hi: "ひ", hu: "ふ", he: "へ", ho: "ほ",
  fa: "ふぁ", fi: "ふぃ", fu: "ふ", fe: "ふぇ", fo: "ふぉ",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  wa: "わ", wi: "うぃ", we: "うぇ", wo: "を",
  nn: "ん",
  // Lone "n" → ん. Longest-match order guarantees na/ni/nu/ne/no and
  // nya/nyu/nyo still win when a vowel/y follows.
  n: "ん",

  // 1-char vowels
  a: "あ", i: "い", u: "う", e: "え", o: "お",
};

// When the user stops mid-syllable (e.g. "まr" / "mar"), expand the
// remaining consonant(s) into every hiragana they could become. The
// expansions intentionally err on the side of matching too much — the
// CharPicker is ranked, so extra candidates are harmless.
const ROMAJI_PARTIAL_EXPANSIONS = {
  k: ["か", "き", "く", "け", "こ", "きゃ", "きゅ", "きょ"],
  g: ["が", "ぎ", "ぐ", "げ", "ご", "ぎゃ", "ぎゅ", "ぎょ"],
  s: ["さ", "し", "す", "せ", "そ", "しゃ", "しゅ", "しょ"],
  z: ["ざ", "じ", "ず", "ぜ", "ぞ"],
  j: ["じ", "じゃ", "じゅ", "じぇ", "じょ"],
  t: ["た", "ち", "つ", "て", "と", "ちゃ", "ちゅ", "ちょ"],
  d: ["だ", "ぢ", "づ", "で", "ど"],
  n: ["な", "に", "ぬ", "ね", "の", "ん", "にゃ", "にゅ", "にょ"],
  h: ["は", "ひ", "ふ", "へ", "ほ", "ひゃ", "ひゅ", "ひょ"],
  f: ["ふ", "ふぁ", "ふぃ", "ふぇ", "ふぉ"],
  b: ["ば", "び", "ぶ", "べ", "ぼ", "びゃ", "びゅ", "びょ"],
  p: ["ぱ", "ぴ", "ぷ", "ぺ", "ぽ", "ぴゃ", "ぴゅ", "ぴょ"],
  m: ["ま", "み", "む", "め", "も", "みゃ", "みゅ", "みょ"],
  y: ["や", "ゆ", "よ"],
  r: ["ら", "り", "る", "れ", "ろ", "りゃ", "りゅ", "りょ"],
  w: ["わ", "を", "うぃ", "うぇ"],
  sh: ["し", "しゃ", "しゅ", "しょ"],
  ch: ["ち", "ちゃ", "ちゅ", "ちょ"],
  ts: ["つ"],
  ky: ["きゃ", "きゅ", "きょ"],
  gy: ["ぎゃ", "ぎゅ", "ぎょ"],
  ny: ["にゃ", "にゅ", "にょ"],
  hy: ["ひゃ", "ひゅ", "ひょ"],
  my: ["みゃ", "みゅ", "みょ"],
  ry: ["りゃ", "りゅ", "りょ"],
  by: ["びゃ", "びゅ", "びょ"],
  py: ["ぴゃ", "ぴゅ", "ぴょ"],
};

/**
 * Parse a search query into a fixed hiragana prefix plus an optional
 * set of candidate next-hiragana characters (for incomplete trailing
 * romaji).
 *
 * `fixed` is the hiragana produced from complete syllables. `partial`
 * is either `null` (no trailing incomplete syllable) or a non-empty
 * array of hiragana strings the user might be about to type.
 */
export function parseSearchQuery(rawInput) {
  const HIRA_OR_KATA = /[\u3040-\u309F\u30A0-\u30FFー]/;
  // Lowercase, NFKC, convert any leading katakana to hiragana.
  let s = String(rawInput || "").normalize("NFKC").toLowerCase();
  // Kata → Hira
  s = s.replace(/[\u30A1-\u30F6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

  let fixed = "";
  let partial = null;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (HIRA_OR_KATA.test(ch) || /\s/.test(ch) || !/[a-z]/.test(ch)) {
      // Pass hiragana / spaces / symbols through unchanged.
      fixed += ch;
      i++;
      continue;
    }
    // Try longest romaji match (3 → 2 → 1).
    let matched = false;
    for (const len of [3, 2, 1]) {
      const sub = s.slice(i, i + len);
      if (ROMAJI_TO_HIRA[sub]) {
        fixed += ROMAJI_TO_HIRA[sub];
        i += len;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Trailing consonant(s) that didn't resolve to a full syllable.
    const rest = s.slice(i);
    // Only treat the tail as "partial" — anything before must already
    // have been consumed by the loop, so rest is always the suffix.
    const key2 = rest.slice(0, 2);
    if (ROMAJI_PARTIAL_EXPANSIONS[key2]) {
      partial = ROMAJI_PARTIAL_EXPANSIONS[key2];
    } else {
      const key1 = rest.slice(0, 1);
      if (ROMAJI_PARTIAL_EXPANSIONS[key1]) {
        partial = ROMAJI_PARTIAL_EXPANSIONS[key1];
      } else {
        // Unknown suffix (e.g. "x"): keep as literal so direct
        // English/name matches still work.
        fixed += rest;
      }
    }
    break;
  }

  return { fixed, partial };
}

/**
 * Return true if `fighterText` (already normalized via
 * normalizeCharSearchInput) matches the user's raw query.
 *
 * Matches if either the literal normalized query is a substring, or
 * the romaji-converted version (optionally with trailing expansions)
 * is a substring.
 */
export function matchesFighterSearch(normalizedFighterText, rawQuery, normalizedLiteralQuery) {
  if (!rawQuery) return true;
  if (normalizedLiteralQuery && normalizedFighterText.includes(normalizedLiteralQuery)) return true;
  const { fixed, partial } = parseSearchQuery(rawQuery);
  if (!fixed && !partial) return false;
  if (!partial) return normalizedFighterText.includes(fixed);
  return partial.some((p) => normalizedFighterText.includes(fixed + p));
}
