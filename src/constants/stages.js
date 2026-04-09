export const STAGES = [
  { id: "bf",    jp: "戦場",               en: "Battlefield" },
  { id: "sbf",   jp: "小戦場",             en: "Small Battlefield" },
  { id: "fd",    jp: "終点",               en: "Final Destination" },
  { id: "ps2",   jp: "ポケモンスタジアム2", en: "Pokémon Stadium 2" },
  { id: "sv",    jp: "すま村",             en: "Smashville" },
  { id: "tc",    jp: "村と街",             en: "Town & City" },
  { id: "hb",    jp: "ホロウバスティオン",   en: "Hollow Bastion" },
  { id: "kalos", jp: "カロスポケモンリーグ", en: "Kalos Pokémon League" },
];

export const stageName = (id, lang) => {
  const s = STAGES.find((s) => s.id === id);
  return s ? (lang === "ja" ? s.jp : s.en) : id;
};

export const stageImg = (id) => `/stages/${id}.jpg`;
