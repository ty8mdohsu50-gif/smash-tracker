import { forwardRef } from "react";
import {
  formatPower,
  rawPower,
  blurOnEnter,
} from "../../utils/format";

export const getCardStyle = (T) => ({
  background: T.card,
  borderRadius: 16,
  padding: "16px 18px",
  marginBottom: 12,
  boxShadow: T.sh,
  border: `1px solid ${T.brd}`,
  transition: "box-shadow .2s ease",
});

export const getGoalInputStyle = (T) => ({
  flex: 1,
  padding: "12px 14px",
  background: T.inp,
  border: "none",
  borderRadius: 10,
  color: T.text,
  fontSize: 16,
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Chakra Petch', sans-serif",
});

export const getActiveBtn = (T, disabled) => ({
  width: "100%",
  padding: 16,
  border: "none",
  borderRadius: 14,
  background: disabled ? T.inp : T.accentGrad,
  color: disabled ? T.dim : "#fff",
  fontSize: 17,
  fontWeight: 800,
  boxShadow: disabled ? "none" : T.accentGlow,
  transition: "all .2s ease",
  marginBottom: 12,
});

export const getPrimaryBtn = (T, { variant = "accent", disabled = false, size = "lg" } = {}) => {
  const grad = disabled
    ? T.inp
    : variant === "win"
      ? T.winGrad
      : variant === "lose"
        ? T.loseGrad
        : T.accentGrad;
  const glow = disabled
    ? "none"
    : variant === "win"
      ? T.winGlow
      : variant === "lose"
        ? T.loseGlow
        : T.accentGlow;
  const sizes = {
    sm: { padding: "8px 14px", fontSize: 13, borderRadius: 10 },
    md: { padding: "10px 18px", fontSize: 14, borderRadius: 12 },
    lg: { padding: "16px 18px", fontSize: 17, borderRadius: 14 },
  };
  const s = sizes[size] || sizes.lg;
  return {
    ...s,
    border: "none",
    background: grad,
    color: disabled ? T.dim : "#fff",
    fontWeight: 800,
    boxShadow: glow,
    transition: "all .2s ease",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.6 : 1,
    fontFamily: "inherit",
  };
};

export const getSecondaryBtn = (T, { size = "md", ghost = false } = {}) => {
  const sizes = {
    sm: { padding: "5px 10px", fontSize: 11, borderRadius: 8 },
    md: { padding: "8px 14px", fontSize: 12, borderRadius: 10 },
    lg: { padding: "12px 18px", fontSize: 13, borderRadius: 12 },
  };
  const s = sizes[size] || sizes.md;
  return {
    ...s,
    border: ghost ? "none" : `1px solid ${T.brd}`,
    background: ghost ? "rgba(255,255,255,0.15)" : T.inp,
    color: ghost ? "rgba(255,255,255,0.85)" : T.sub,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all .15s ease",
    fontFamily: "inherit",
  };
};

export const getTextInputStyle = (T, { size = "md" } = {}) => {
  const sizes = {
    sm: { padding: "8px 10px", fontSize: 12 },
    md: { padding: "10px 12px", fontSize: 13 },
    lg: { padding: "12px 16px", fontSize: 14 },
  };
  const s = sizes[size] || sizes.md;
  return {
    ...s,
    width: "100%",
    background: T.inp,
    border: "none",
    borderRadius: 10,
    color: T.text,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    lineHeight: 1.5,
  };
};

export const getBtnR = () => ({
  border: "none",
  borderRadius: 10,
  padding: "6px 11px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all .15s ease",
  fontFamily: "inherit",
});

export const PwrInput = forwardRef(function PwrInput({ value, onChange, placeholder, big, T, pStart, pEnd, savePower }, ref) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      autoCorrect="off"
      data-lpignore="true"
      data-1p-ignore="true"
      data-form-type="other"
      value={formatPower(value)}
      onChange={(e) => onChange(rawPower(e.target.value))}
      onKeyDown={blurOnEnter}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: big ? "14px 0" : "10px 0",
        background: "transparent",
        border: "none",
        borderBottom: `2px solid ${T.dimmer}`,
        color: T.text,
        fontSize: big ? 28 : 18,
        fontWeight: 800,
        outline: "none",
        boxSizing: "border-box",
        letterSpacing: big ? -1 : 0,
        fontFamily: "'Chakra Petch', sans-serif",
        transition: "border-color .2s ease",
      }}
      onFocus={(e) => { e.target.style.borderBottomColor = T.accent; }}
      onBlur={(e) => { e.target.style.borderBottomColor = T.dimmer; if (!big) savePower(pStart, pEnd); }}
    />
  );
});
