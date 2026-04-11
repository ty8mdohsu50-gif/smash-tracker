import { useState } from "react";
import { fighterIconUrl } from "../../constants/fighters";

export default function FighterIcon({ name, size = 24, style }) {
  const [failed, setFailed] = useState(false);
  const url = fighterIconUrl(name);

  if (!url || failed) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: "50%",
          background: "rgba(128,128,128,.15)",
          fontSize: size * 0.4,
          fontWeight: 700,
          color: "inherit",
          flexShrink: 0,
          ...style,
        }}
      >
        {name ? name[0] : "?"}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
