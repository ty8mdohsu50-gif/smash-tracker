import { createContext, useContext, useState } from "react";
import ja from "./ja";
import en from "./en";

const langs = { ja, en };
const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("smash-lang") || "ja";
  });

  const t = (key, vars) => {
    const keyParts = key.split(".");
    let val = langs[lang];
    for (const k of keyParts) {
      val = val?.[k];
    }
    if (val == null) return key;
    if (typeof val !== "string") return val;
    if (!vars || typeof vars !== "object" || Array.isArray(vars)) return val;
    let s = val;
    for (const [vk, vv] of Object.entries(vars)) {
      s = s.split(`{${vk}}`).join(String(vv));
    }
    return s;
  };

  const setLanguage = (l) => {
    setLang(l);
    localStorage.setItem("smash-lang", l);
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
