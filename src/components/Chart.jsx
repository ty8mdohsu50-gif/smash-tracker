import { formatDateShort } from "../utils/format";

export default function Chart({ points: pts, T }) {
  if (!pts || pts.length < 2) return null;

  const W = 440;
  const H = 220;
  const P = { t: 20, r: 16, b: 36, l: 90 };
  const cW = W - P.l - P.r;
  const cH = H - P.t - P.b;

  const vals = pts.map((d) => d.value);
  let mn = Math.min(...vals);
  let mx = Math.max(...vals);
  let rng = mx - mn || 1;
  mn -= rng * 0.1;
  mx += rng * 0.1;
  rng = mx - mn;

  const x = (i) => P.l + (i / (pts.length - 1 || 1)) * cW;
  const y = (v) => P.t + cH - ((v - mn) / rng) * cH;

  const isUp = pts[pts.length - 1].value >= pts[0].value;
  const lineColor = isUp ? T.win : T.lose;

  const gridCount = 4;
  const grids = [];
  for (let gi = 0; gi <= gridCount; gi++) {
    const gv = mn + rng * (gi / gridCount);
    const gy = y(gv);
    grids.push(
      <line
        key={`g${gi}`}
        x1={P.l}
        x2={W - P.r}
        y1={gy}
        y2={gy}
        stroke={T.inp}
        strokeWidth={0.5}
        strokeDasharray={gi === 0 || gi === gridCount ? "0" : "4,4"}
      />,
    );
    grids.push(
      <text
        key={`gt${gi}`}
        x={P.l - 8}
        y={gy + 4}
        textAnchor="end"
        fontSize={11}
        fontWeight={500}
        fill={T.dim}
        fontFamily="'Chakra Petch', sans-serif"
      >
        {formatPower(gv)}
      </text>,
    );
  }

  const smooth = pts.length > 2;
  let pathD = "";
  if (smooth) {
    pathD = `M ${x(0)},${y(pts[0].value)}`;
    for (let i = 1; i < pts.length; i++) {
      const prevX = x(i - 1);
      const prevY = y(pts[i - 1].value);
      const curX = x(i);
      const curY = y(pts[i].value);
      const cpX = (prevX + curX) / 2;
      pathD += ` C ${cpX},${prevY} ${cpX},${curY} ${curX},${curY}`;
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
      <text
        key={`xl${xi}`}
        x={x(xi)}
        y={H - 8}
        textAnchor="middle"
        fontSize={10}
        fontWeight={500}
        fill={T.dim}
      >
        {formatDateShort(dateStr)}
      </text>,
    );
  }
  const lastDate = pts[pts.length - 1].date;
  if (!seen.has(lastDate)) {
    dateLabels.push(
      <text
        key="xll"
        x={x(pts.length - 1)}
        y={H - 8}
        textAnchor="middle"
        fontSize={10}
        fontWeight={500}
        fill={T.dim}
      >
        {formatDateShort(lastDate)}
      </text>,
    );
  }

  const gradId = `chart-grad-${isUp ? "up" : "down"}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      {grids}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.length <= 20 && pts.map((d, i) => (
        <circle
          key={`d${i}`}
          cx={x(i)}
          cy={y(d.value)}
          r={3}
          fill={lineColor}
          stroke={T.card}
          strokeWidth={2}
        />
      ))}
      {dateLabels}
    </svg>
  );
}

function formatPower(v) {
  return Math.round(v).toLocaleString();
}
