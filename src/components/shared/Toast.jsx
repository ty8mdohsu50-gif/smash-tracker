import { useState, useEffect } from "react";
import { Z_TOAST } from "../../constants/zIndex";

export default function Toast({ message, type = "success", onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), 1800);
    const t2 = setTimeout(() => onDone?.(), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const bg = type === "success"
    ? "linear-gradient(135deg, #34D399, #10B981)"
    : "linear-gradient(135deg, #F87171, #EF4444)";

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
        zIndex: Z_TOAST,
        background: bg,
        color: "#fff",
        padding: "10px 24px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 700,
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        opacity: visible ? 1 : 0,
        transition: "all .3s ease",
        pointerEvents: "none",
      }}
    >
      {message}
    </div>
  );
}
