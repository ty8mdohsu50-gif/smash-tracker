import { formatDate } from "../utils/format";

export default function Chart({ points: pts, T }) {
  if (!pts || pts.length < 2) return null;

  const W = 360;
  const H = 180;
  const P = { t: 16, r: 12, b: 28, l: 48 };
  const cW = W - P.l - P.r;
  const cH = H - P.t - P.b;

  const vals = pts.map((d) => d.value);
  let mn = Math.min(...vals);
  let mx = Math.max(...vals);
  let rng = mx - mn || 1;
  mn -= rng * 0.08;
  mx += rng * 0.08;
  rng = mx - mn;

  const x = (i) => P.l + (i / (pts.length - 1 || 1)) * cW;
  const y = (v) => P.t + cH - ((v - mn) / rng) * cH;

  const grids = [];
  for (let gi = 0; gi <= 3; gi++) {
    const gv = mn + rng * (gi / 3);
    const gy = y(gv);
    grids.push(
      <line
        key={`g${gi}`}
        x1={P.l}
        x2={W - P.r}
        y1={gy}
        y2={gy}
        stroke={T.inp}
        strokeWidth={1}
      />,
    );
    grids.push(
      <text
        key={`gt${gi}`}
        x={P.l - 6}
        y={gy + 3}
        textAnchor="end"
        fontSize={9}
        fill={T.dim}
      >
        {Math.round(gv / 10000)}万
      </text>,
    );
  }

  const ln = pts.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${P.l},${y(pts[0].value)} ${ln} ${x(pts.length - 1)},${P.t + cH} ${P.l},${P.t + cH}`;

  const step = Math.max(1, Math.floor(pts.length / 5));
  const xl = [];
  for (let xi = 0; xi < pts.length; xi += step) {
    xl.push(
      <text
        key={`xl${xi}`}
        x={x(xi)}
        y={H - 6}
        textAnchor="middle"
        fontSize={9}
        fill={T.dim}
      >
        {pts[xi].label}
      </text>,
    );
  }
  if ((pts.length - 1) % step !== 0) {
    xl.push(
      <text
        key="xll"
        x={x(pts.length - 1)}
        y={H - 6}
        textAnchor="middle"
        fontSize={9}
        fill={T.dim}
      >
        {pts[pts.length - 1].label}
      </text>,
    );
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="cg" x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0%" stopColor="#FF3B30" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#FF3B30" stopOpacity={0} />
        </linearGradient>
      </defs>
      {grids}
      <polygon points={area} fill="url(#cg)" />
      <polyline
        points={ln}
        fill="none"
        stroke="#FF3B30"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((d, i) => (
        <circle
          key={`d${i}`}
          cx={x(i)}
          cy={y(d.value)}
          r={3.5}
          fill="#FF3B30"
          stroke={T.card}
          strokeWidth={2}
        />
      ))}
      {xl}
    </svg>
  );
}
