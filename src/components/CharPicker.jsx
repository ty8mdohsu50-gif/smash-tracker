import { useState, useEffect, useRef, useMemo } from "react";
import { FIGHTERS, getSearchText } from "../constants/fighters";
import { useI18n } from "../i18n/index.jsx";
import { normalizeCharSearchInput } from "../utils/format";
import FighterIcon from "./FighterIcon";

export default function CharPicker({
  value,
  onChange,
  placeholder,
  label,
  recent = [],
  autoOpen = false,
  T,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(autoOpen);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);
  const composingRef = useRef(false);

  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = useMemo(() => {
    const trimmed = q.trim();
    if (!trimmed) {
      const seen = new Set(recent);
      const recentOrdered = recent.filter((c) => FIGHTERS.includes(c));
      const rest = FIGHTERS.filter((c) => !seen.has(c));
      return [...recentOrdered, ...rest];
    }
    const lq = normalizeCharSearchInput(trimmed);
    return FIGHTERS.filter((f) => normalizeCharSearchInput(getSearchText(f)).includes(lq))
      .sort((a, b) => {
        const ah = normalizeCharSearchInput(a);
        const bh = normalizeCharSearchInput(b);
        const aStart = ah.startsWith(lq) ? 0 : 1;
        const bStart = bh.startsWith(lq) ? 0 : 1;
        return aStart - bStart || ah.localeCompare(bh, "ja");
      });
  }, [q, recent]);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {label && (
        <div
          style={{ fontSize: 13, color: T.sub, marginBottom: 6, fontWeight: 600 }}
        >
          {label}
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
          setQ("");
        }}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: T.card,
          border: `2px solid ${open ? T.accent : T.dimmer}`,
          borderRadius: 12,
          color: value ? T.text : T.dim,
          textAlign: "left",
          cursor: "pointer",
          fontSize: 15,
          fontWeight: value ? 600 : 400,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {value && <FighterIcon name={value} size={32} />}
        {value || placeholder || t("charPicker.select")}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: T.card,
            border: `2px solid ${T.dimmer}`,
            borderRadius: 14,
            marginTop: 6,
            boxShadow: "0 12px 40px rgba(0,0,0,.2)",
            overflow: "hidden",
            animation: "fadeUp .15s ease",
          }}
        >
          <div style={{ padding: 10, borderBottom: `1px solid ${T.inp}` }}>
            <input
              ref={inputRef}
              value={q}
              lang="ja"
              inputMode="text"
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={(e) => {
                composingRef.current = false;
                setQ(normalizeCharSearchInput(e.currentTarget.value));
              }}
              onChange={(e) => {
                const v = e.target.value;
                if (composingRef.current) {
                  setQ(v);
                  return;
                }
                setQ(normalizeCharSearchInput(v));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length) {
                  onChange(filtered[0]);
                  setOpen(false);
                  setQ("");
                }
              }}
              placeholder={t("charPicker.search")}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-lpignore="true"
              data-form-type="other"
              data-1p-ignore="true"
              name="fighter-search"
              id="fighter-search"
              type="text"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: T.inp,
                border: "none",
                borderRadius: 10,
                color: T.text,
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {recent.length > 0 && !q.trim() && (
            <div
              style={{
                padding: "6px 12px",
                borderBottom: `1px solid ${T.inp}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: T.dim,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {t("charPicker.recent")}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {recent.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                    style={{
                      padding: "4px 10px 4px 4px",
                      borderRadius: 8,
                      border: "none",
                      background: c === value ? T.accent : T.inp,
                      color: c === value ? "#fff" : T.text,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FighterIcon name={c} size={24} />
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ maxHeight: "min(320px, 42vh)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
            {filtered.map((f) => (
              <div
                key={f}
                onClick={() => {
                  onChange(f);
                  setOpen(false);
                }}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: f === value ? 700 : 400,
                  color: f === value ? T.accent : T.text,
                  background: f === value ? T.accentSoft : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <FighterIcon name={f} size={32} />
                {f}
              </div>
            ))}
            {filtered.length === 0 && (
              <div
                style={{
                  padding: 20,
                  color: T.dim,
                  fontSize: 14,
                  textAlign: "center",
                }}
              >
                {t("charPicker.notFound")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
