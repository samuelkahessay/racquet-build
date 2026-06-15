import { SCORE_AXES, type ScoreVector } from "@/lib/domain/score";
import { AXIS_SHORT } from "@/lib/domain/labels";

interface RadarPlotProps {
  scores: ScoreVector;
  size?: number;
}

const N = SCORE_AXES.length;

/** Point on a regular N-gon at vertex `i`, scaled by radius `r`, around center `c`. */
function vertex(i: number, r: number, c: number) {
  const angle = (Math.PI * 2 * i) / N - Math.PI / 2; // start at top
  return { x: c + r * Math.cos(angle), y: c + r * Math.sin(angle) };
}

/**
 * Hand-rolled SVG radar (no chart lib). Decorative — the numeric ReadoutBars carry the
 * same data for assistive tech, so this is aria-hidden.
 */
export function RadarPlot({ scores, size = 240 }: RadarPlotProps) {
  const c = size / 2;
  const maxR = c - 30;
  const rings = [25, 50, 75, 100];

  const dataPoints = SCORE_AXES.map((axis, i) =>
    vertex(i, (scores[axis] / 100) * maxR, c),
  );
  const dataPath = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      aria-hidden="true"
      className="overflow-visible"
    >
      {/* concentric rings */}
      {rings.map((pct) => {
        const pts = SCORE_AXES.map((_, i) => vertex(i, (pct / 100) * maxR, c))
          .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          .join(" ");
        return (
          <polygon
            key={pct}
            points={pts}
            fill="none"
            stroke="var(--rule-major)"
            strokeWidth={pct === 100 ? 1 : 0.5}
            strokeDasharray={pct === 100 ? "none" : "2 3"}
          />
        );
      })}

      {/* spokes + labels */}
      {SCORE_AXES.map((axis, i) => {
        const outer = vertex(i, maxR, c);
        const label = vertex(i, maxR + 16, c);
        return (
          <g key={axis}>
            <line
              x1={c}
              y1={c}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--rule)"
              strokeWidth={0.5}
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              letterSpacing="0.12em"
              fill="var(--ink-3)"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {AXIS_SHORT[axis]}
            </text>
          </g>
        );
      })}

      {/* data polygon */}
      <polygon
        points={dataPath}
        fill="var(--accent)"
        fillOpacity={0.14}
        stroke="var(--accent)"
        strokeWidth={1.5}
        style={{ transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)" }}
      />
      {dataPoints.map((p, i) => (
        <rect
          key={i}
          x={p.x - 2}
          y={p.y - 2}
          width={4}
          height={4}
          fill="var(--accent)"
          style={{ transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)" }}
        />
      ))}
    </svg>
  );
}
