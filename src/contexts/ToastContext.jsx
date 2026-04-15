import { createContext, useContext, useState, useCallback, useRef } from "react";
import { Z_TOAST } from "../constants/zIndex";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const idRef = useRef(0);

  const push = useCallback((message, type = "success") => {
    if (!message) return;
    idRef.current += 1;
    const id = idRef.current;
    setToast({ id, message, type });
    const timer = setTimeout(() => {
      setToast((current) => (current && current.id === id ? null : current));
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  const api = {
    success: useCallback((m) => push(m, "success"), [push]),
    error: useCallback((m) => push(m, "error"), [push]),
    info: useCallback((m) => push(m, "info"), [push]),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {toast && <GlobalToast toast={toast} onDismiss={() => setToast(null)} />}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}

function GlobalToast({ toast, onDismiss }) {
  const palette = {
    success: "linear-gradient(135deg, #34D399, #10B981)",
    error: "linear-gradient(135deg, #F87171, #EF4444)",
    info: "linear-gradient(135deg, #60A5FA, #3B82F6)",
  };
  return (
    <div
      role="status"
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      onClick={onDismiss}
      style={{
        position: "fixed",
        // Sit below the mobile sticky header and iOS notch so the
        // toast is always visible even on small screens in
        // landscape mode.
        top: "max(24px, env(safe-area-inset-top, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: Z_TOAST,
        background: palette[toast.type] || palette.success,
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 700,
        boxShadow: "0 6px 24px rgba(0,0,0,0.28)",
        animation: "fadeUp .25s ease",
        cursor: "pointer",
        // Keep the toast readable on small screens: 240px min so
        // short error strings don't shrink, ~(100vw - 32px) max
        // so it never touches the edges.
        minWidth: "min(240px, calc(100vw - 32px))",
        maxWidth: "calc(100vw - 32px)",
        textAlign: "center",
      }}
    >
      {toast.message}
    </div>
  );
}
