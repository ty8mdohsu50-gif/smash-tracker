import { useState } from "react";
import { formatDateShort } from "../utils/format";

export default function Chart({ points: pts, T }) {
  const [selected, setSelected] = useState(null);

  if (!pts || pts.length < 2) return null;

  const W = 440;
  const H = 240;
  const P = { t: 24, r: 16, b: 36, l: 90 };
  const cW = W - P.l - P.r;
  const cH = H - P.t - P.b;

  const vals = pts.map((d) => d.value);
  const rawMn = Math.min(...vals);
  const rawMx = Math.max(...vals);

  const niceStep = getNiceStep(rawMx - rawMn);
  const mn = Math.floor(rawMn / niceStep) * niceStep;
  const mx = Math.ceil(rawMx / niceStep) * niceStep;
  const rng = mx - mn || 1;

  const x = (i) => P.l + (i / (pts.length - 1 || 1)) * cW;
  const y = (v) => P.t + cH - ((v - mn) / rng) * cH;

  const isUp = pts[pts.length - 1].value >= pts[0].value;
  const lineColor = isUp ? T.win : T.lose;

  const grids = [];
  for (let gv = mn; gv <= mx; gv += niceStep) {
    const gy = y(gv);
    grids.push(
      <line key={`g${gv}`} x1={P.l} x2={W - P.r} y1={gy} y2={gy} stroke={T.inp} strokeWidth={0.5} strokeDasharray={gv === mn || gv === mx ? "0" : "4,4"} />,
    );
    grids.push(
      <text key={`gt${gv}`} x={P.l - 8} y={gy + 4} textAnchor="end" fontSize={10} fontWeight={500} fill={T.dim} fontFamily="'Chakra Petch', sans-serif">
        {Math.round(gv).toLocaleString()}
      </text>,
    );
  }

  const smooth = pts.length > 2;
  let pathD = "";
  if (smooth) {
    pathD = `M ${x(0)},${y(pts[0].value)}`;
    for (let i = 1; i < pts.length; i++) {
      const cpX = (x(i - 1) + x(i)) / 2;
      pathD += ` C ${cpX},${y(pts[i - 1].value)} ${cpX},${y(pts[i].value)} ${x(i)},${y(pts[i].value)}`;
    }
  } else {
    pathD = pts.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)},${y(d.value)}`).join(" ");
  }

  const areaPath = `${pathD} L ${x(pts.length - 1)},${P.t + cH} L ${P.l},${P.t + cH} Z`;

  const step = Math.max(1, Math.ceil(pts.length / 5));
  const dateLabels = [];
  const seen = new Set();
  for (let xi = 0; xi < pts.length; xi += step) {
    const dateStr = pts[xi].date;
    if (seen.has(dateStr)) continue;
    seen.add(dateStr);
    dateLabels.push(
      <text key={`xl${xi}`} x={x(xi)} y={H - 8} textAnchor="middle" fontSize={10} fontWeight={500} fill={T.dim}>
        {formatDateShort(dateStr)}
      </text>,
    );
  }
  const lastDate = pts[pts.length - 1].date;
  if (!seen.has(lastDate)) {
    dateLabels.push(
      <text key="xll" x={x(pts.length - 1)} y={H - 8} textAnchor="middle" fontSize={10} fontWeight={500} fill={T.dim}>
        {formatDateShort(lastDate)}
      </text>,
    );
  }

  const gradId = `chart-grad-${isUp ? "up" : "down"}`;

  const handleClick = (i) => {
    setSelected(selected === i ? null : i);
  };

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <defs>
          <linearGradient id={gradId} x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        {grids}
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((d, i) => (
          <circle
            key={`d${i}`}
            cx={x(i)}
            cy={y(d.value)}
            r={selected === i ? 5 : 3}
            fill={selected === i ? lineColor : lineColor}
            stroke={T.card}
            strokeWidth={selected === i ? 3 : 2}
            style={{ cursor: "pointer" }}
            onClick={() => handleClick(i)}
          />
        ))}
        {/* Tap target overlay (larger hit area) */}
        {pts.map((d, i) => (
          <circle
            key={`hit${i}`}
            cx={x(i)}
            cy={y(d.value)}
            r={18}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onClick={() => handleClick(i)}
          />
        ))}
        {/* Selected tooltip */}
        {selected !== null && pts[selected] && (() => {
          const d = pts[selected];
          const tx = x(selected);
          const ty = y(d.value) - 20;
          const label = Math.round(d.value).toLocaleString();
          const labelW = label.length * 9 + 20;
          const clampedX = Math.max(P.l + labelW / 2, Math.min(W - P.r - labelW / 2, tx));
          return (
            <g>
              <line x1={tx} y1={y(d.value)} x2={tx} y2={P.t + cH} stroke={lineColor} strokeWidth={0.5} strokeDasharray="3,3" opacity={0.5} />
              <rect x={clampedX - labelW / 2} y={ty - 14} width={labelW} height={26} rx={7} fill={T.text} opacity={0.92} />
              <text x={clampedX} y={ty + 3} textAnchor="middle" fontSize={14} fontWeight={700} fill={T.bg} fontFamily="'Chakra Petch', sans-serif">
                {label}
              </text>
            </g>
          );
        })()}
        {dateLabels}
      </svg>
    </div>
  );
}

function getNiceStep(range) {
  if (range <= 0) return 100000;
  const rough = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  if (norm <= 1) return mag;
  if (norm <= 2) return 2 * mag;
  if (norm <= 5) return 5 * mag;
  return 10 * mag;
}
