import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { csvDownload } from "../utils/storage";
import { THEME_KEYS, getThemeLabel } from "../styles/theme";
import { useI18n } from "../i18n/index.jsx";
import CloseButton from "./shared/CloseButton";
import { Z_APP_MODAL } from "../constants/zIndex";

const SWATCH_COLORS = {
  purple: "#7C3AED",
  blue: "#2563EB",
  cyan: "#0891B2",
  emerald: "#059669",
  orange: "#EA580C",
  rose: "#E11D48",
  amber: "#D97706",
  red: "#DC2626",
  white: "#E5E7EB",
  black: "#1F2937",
};

export default function Settings({ data, onSave, onClose, onOpenLegal, onOpenAbout, onLogout, user, T }) {
  const { t, lang, setLanguage } = useI18n();
  const [step, setStep] = useState(0);
  const [showTheme, setShowTheme] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [dayBoundary, setDayBoundary] = useState(
    () => localStorage.getItem("smash-day-boundary") || "5",
  );
  const [region, setRegion] = useState(
    () => localStorage.getItem("smash-region-tz") || Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  const currentColor = data.themeColor || "black";

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  const setThemeColor = (key) => {
    onSave({ ...data, themeColor: key });
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,.7)",
        zIndex: Z_APP_MODAL,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        animation: "fadeIn .15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card,
          borderRadius: 20,
          width: "100%",
          maxWidth: 400,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          animation: "fadeUp .2s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: `1px solid ${T.brd}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div id="settings-modal-title" style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{t("settings.title")}</div>
          <CloseButton onClick={handleClose} T={T} ariaLabel={t("common.close")} />
        </div>

        {/* Scrollable content */}
        <div style={{ padding: "0 22px 22px", overflowY: "auto", flex: 1 }}>

          {/* Share settings - collapsible */}
          <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
            <button
              onClick={() => setShowShare(!showShare)}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "transparent", border: "none", color: T.text, padding: 0,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600 }}>{t("settings.shareSettings")}</span>
              {showShare ? <ChevronUp size={18} color={T.dim} /> : <ChevronDown size={18} color={T.dim} />}
            </button>
            {showShare && (
              <div style={{ marginTop: 14, animation: "fadeUp .15s ease" }}>
                {[
                  { key: "showChar", label: t("settings.showChar") },
                  { key: "showMatchups", label: t("settings.showMatchups") },
                  { key: "showRecord", label: t("settings.showRecord") },
                  { key: "showPower", label: t("settings.showPower") },
                  { key: "showStages", label: t("settings.showStages") },
                ].map(({ key, label }) => {
                  const ss = { showChar: true, showMatchups: true, showPower: true, showRecord: true, showStages: true, ...(data.shareSettings || {}) };
                  const enabled = ss[key];
                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{label}</span>
                      <button
                        onClick={() =>
                          onSave({
                            ...data,
                            shareSettings: { showChar: true, showMatchups: true, showPower: true, showRecord: true, showStages: true, ...(data.shareSettings || {}), [key]: !enabled },
                          })
                        }
                        style={{
                          width: 54, height: 30, borderRadius: 15, border: "none",
                          background: enabled ? T.accent : T.dimmer,
                          position: "relative", flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 26, height: 26, borderRadius: 13, background: "#fff",
                            position: "absolute", top: 2, left: enabled ? 26 : 2,
                            transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Theme color - collapsible (includes dark mode) */}
          <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
            <button
              onClick={() => setShowTheme(!showTheme)}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "transparent", border: "none", color: T.text, padding: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t("settings.themeColor")}</span>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: SWATCH_COLORS[currentColor],
                  border: currentColor === "white" ? `2px solid ${T.dimmer}` : "none",
                }} />
                <span style={{ fontSize: 12, color: T.dim }}>{getThemeLabel(currentColor, lang)}</span>
              </div>
              {showTheme ? <ChevronUp size={18} color={T.dim} /> : <ChevronDown size={18} color={T.dim} />}
            </button>
            {showTheme && (
              <div style={{ marginTop: 14, animation: "fadeUp .15s ease" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
                  {THEME_KEYS.map((key) => {
                    const active = currentColor === key;
                    const swatchColor = SWATCH_COLORS[key];
                    const isLight = key === "white";
                    return (
                      <button
                        key={key}
                        onClick={() => setThemeColor(key)}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                          padding: "10px 4px", borderRadius: 12,
                          border: active ? `2px solid ${T.accent}` : `1px solid ${T.inp}`,
                          background: active ? T.accentSoft : "transparent",
                          transition: "all .15s ease",
                        }}
                      >
                        <div
                          style={{
                            width: 32, height: 32, borderRadius: "50%", background: swatchColor,
                            border: isLight ? `2px solid ${T.dimmer}` : "none",
                            boxShadow: active ? `0 0 0 2px ${T.card}, 0 0 0 4px ${swatchColor}` : "none",
                          }}
                        />
                        <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? T.accent : T.dim }}>
                          {getThemeLabel(key, lang)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t("settings.darkMode")}</span>
                  <button
                    onClick={() => onSave({ ...data, dark: !data.dark })}
                    style={{
                      width: 54, height: 30, borderRadius: 15, border: "none",
                      background: data.dark ? T.accent : T.dimmer,
                      position: "relative", flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 26, height: 26, borderRadius: 13, background: "#fff",
                        position: "absolute", top: 2, left: data.dark ? 26 : 2,
                        transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                      }}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Day boundary */}
          <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>
              {t("settings.dayBoundary")}
            </div>
            <div style={{ fontSize: 12, color: T.dim, marginBottom: 10 }}>
              {t("settings.dayBoundaryDesc")}
            </div>
            <select
              value={dayBoundary}
              onChange={(e) => {
                setDayBoundary(e.target.value);
                localStorage.setItem("smash-day-boundary", e.target.value);
              }}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${T.brd}`, background: T.inp, color: T.text,
                fontSize: 14, fontWeight: 600,
              }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={String(i)}>{i}:00</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 12 }}>
              {t("settings.language")}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ code: "ja", label: "日本語" }, { code: "en", label: "English" }].map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: lang === code ? `2px solid ${T.accent}` : `1px solid ${T.brd}`,
                    background: lang === code ? T.accentSoft : T.inp,
                    color: lang === code ? T.accent : T.sub,
                    fontSize: 14,
                    fontWeight: lang === code ? 700 : 500,
                    transition: "all .15s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Region / Timezone */}
          <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>
              {t("settings.region")}
            </div>
            <div style={{ fontSize: 12, color: T.dim, marginBottom: 10 }}>
              {t("settings.regionDesc")}
            </div>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                localStorage.setItem("smash-region-tz", e.target.value);
              }}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${T.brd}`, background: T.inp, color: T.text,
                fontSize: 14, fontWeight: 600,
              }}
            >
              {[
                { label: t("common.timezones.tokyo"), tz: "Asia/Tokyo" },
                { label: t("common.timezones.seoul"), tz: "Asia/Seoul" },
                { label: t("common.timezones.shanghai"), tz: "Asia/Shanghai" },
                { label: t("common.timezones.singapore"), tz: "Asia/Singapore" },
                { label: t("common.timezones.sydney"), tz: "Australia/Sydney" },
                { label: t("common.timezones.london"), tz: "Europe/London" },
                { label: t("common.timezones.paris"), tz: "Europe/Paris" },
                { label: t("common.timezones.newYork"), tz: "America/New_York" },
                { label: t("common.timezones.chicago"), tz: "America/Chicago" },
                { label: t("common.timezones.losAngeles"), tz: "America/Los_Angeles" },
                { label: t("common.timezones.mexicoCity"), tz: "America/Mexico_City" },
                { label: t("common.timezones.saoPaulo"), tz: "America/Sao_Paulo" },
              ].map(({ label, tz }) => (
                <option key={tz} value={tz}>{label}</option>
              ))}
            </select>
          </div>

          {/* CSV / Reset */}
          <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
            <button
              onClick={() => csvDownload(data)}
              style={{
                width: "100%", padding: 16, border: "none", borderRadius: 12,
                background: T.inp, color: T.text, fontSize: 15, fontWeight: 600,
                textAlign: "left", marginBottom: 6,
              }}
            >
              {t("settings.csvDownload")}
            </button>
            <div style={{ fontSize: 12, color: T.dim, paddingLeft: 4, marginBottom: 4 }}>
              {t("settings.csvDownloadDesc")}
            </div>
            <div style={{ fontSize: 12, color: T.dim, paddingLeft: 4, marginBottom: 12 }}>
              {data.matches.length ? t("settings.dataCount", { count: data.matches.length }) : t("settings.noData")}
            </div>

            {step === 0 && (
              <button
                onClick={() => setStep(1)}
                style={{
                  width: "100%", padding: 16, border: "none", borderRadius: 12,
                  background: "rgba(220,38,38,.08)", color: "#dc2626",
                  fontSize: 15, fontWeight: 600, textAlign: "left",
                }}
              >
                {t("settings.resetAll")}
              </button>
            )}

            {step === 1 && (
              <div style={{ background: "rgba(220,38,38,.08)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>
                  {t("settings.resetConfirm1Title")}
                </div>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 14 }}>
                  {t("settings.resetConfirm1Desc")}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setStep(0)}
                    style={{
                      flex: 1, padding: 14, border: `1px solid ${T.dimmer}`, borderRadius: 12,
                      background: T.card, color: T.text, fontSize: 14, fontWeight: 600,
                    }}
                  >
                    {t("settings.cancel")}
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      flex: 1, padding: 14, border: "none", borderRadius: 12,
                      background: "rgba(220,38,38,.15)", color: "#dc2626", fontSize: 14, fontWeight: 600,
                    }}
                  >
                    {t("settings.next")}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ background: "rgba(220,38,38,.12)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>
                  {t("settings.resetConfirm2Title")}
                </div>
                <div style={{ fontSize: 13, color: T.sub, marginBottom: 14 }}>
                  {t("settings.resetConfirm2Desc")}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setStep(0)}
                    style={{
                      flex: 1, padding: 14, border: `1px solid ${T.dimmer}`, borderRadius: 12,
                      background: T.card, color: T.text, fontSize: 14, fontWeight: 600,
                    }}
                  >
                    {t("settings.cancel")}
                  </button>
                  <button
                    onClick={() => {
                      onSave({
                        matches: [], settings: data.settings, daily: {},
                        goals: data.goals || {}, dark: data.dark, themeColor: data.themeColor,
                      });
                      setStep(0);
                      onClose();
                    }}
                    style={{
                      flex: 1, padding: 14, border: "none", borderRadius: 12,
                      background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 600,
                    }}
                  >
                    {t("settings.deleteConfirm")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account */}
          {user && (
            <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>{t("settings.account")}</div>
              <div style={{ fontSize: 13, color: T.dim, marginBottom: 12, wordBreak: "break-all" }}>{user.email}</div>
              <button
                onClick={() => { handleClose(); onLogout(); }}
                style={{
                  width: "100%", padding: 14, border: `1px solid ${T.dimmer}`, borderRadius: 12,
                  background: "transparent", color: T.sub, fontSize: 14, fontWeight: 600, textAlign: "left",
                }}
              >
                {t("settings.logout")}
              </button>
            </div>
          )}
          {!user && (
            <div style={{ padding: "16px 0", borderBottom: `1px solid ${T.inp}` }}>
              <div style={{ fontSize: 13, color: T.dim, marginBottom: 10 }}>
                {t("settings.loginPrompt")}
              </div>
              <button
                onClick={() => { handleClose(); localStorage.removeItem("smash-skipped-auth"); window.location.reload(); }}
                style={{
                  width: "100%", padding: 14, border: "none", borderRadius: 12,
                  background: T.inp, color: T.text, fontSize: 14, fontWeight: 600, textAlign: "left",
                }}
              >
                {t("settings.loginButton")}
              </button>
            </div>
          )}

          {/* Legal links */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "16px 0" }}>
            <button
              onClick={() => { handleClose(); onOpenLegal("terms"); }}
              style={{ background: "transparent", border: "none", color: T.dim, fontSize: 12, textDecoration: "underline" }}
            >
              {t("settings.terms")}
            </button>
            <button
              onClick={() => { handleClose(); onOpenLegal("privacy"); }}
              style={{ background: "transparent", border: "none", color: T.dim, fontSize: 12, textDecoration: "underline" }}
            >
              {t("settings.privacy")}
            </button>
            <button
              onClick={() => { handleClose(); onOpenAbout(); }}
              style={{ background: "transparent", border: "none", color: T.dim, fontSize: 12, textDecoration: "underline" }}
            >
              {t("about.siteAbout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
