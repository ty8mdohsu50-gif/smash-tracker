import { createContext, useContext, useState } from "react";
import ja from "./ja";
import en from "./en";

const langs = { ja, en };
const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("smash-lang") || "ja";
  });

  const t = (key) => {
    const keys = key.split(".");
    let val = langs[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    return val || key;
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
