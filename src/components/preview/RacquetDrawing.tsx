import type { RacquetConfig } from "@/lib/domain/config";
import { SHAPE_LABELS } from "@/lib/domain/labels";
import { buildRacquetGeometry, type Pt } from "./geometry";

/** SVG y is down; our geometry is y-up, so negate y on emit. */
const path = (pts: Pt[], close = false) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${(-y).toFixed(1)}`).join(" ") +
  (close ? " Z" : "");

/**
 * A single pure-SVG squash racquet, drawn as a cyanotype blueprint. Every line is
 * derived from `buildRacquetGeometry`, so the drawing reacts to the live config:
 * head shape, beam thickness (weight), string density (tension), grip wrap, and the
 * balance marker. No WebGL, no animation — it renders identically on the server.
 */
export function RacquetDrawing({ config }: { config: RacquetConfig }) {
  const g = buildRacquetGeometry(config);
  const { minX, maxX, minY, maxY } = g.bounds;
  const pad = 6;
  const vbX = minX - pad;
  const vbY = -maxY - pad;
  const vbW = maxX - minX + pad * 2;
  const vbH = maxY - minY + pad * 2;

  const ink = "var(--blueprint-ink)";
  const gripStroke = g.grip.accent ? "var(--accent)" : ink;

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Technical drawing of a ${SHAPE_LABELS[config.shape].toLowerCase()} squash racquet at ${config.stringTensionLb} lb string tension`}
      style={{ display: "block" }}
    >
      {/* construction axis */}
      <path
        d={path(g.centerLine)}
        fill="none"
        stroke={ink}
        strokeOpacity={0.28}
        strokeWidth={0.7}
        strokeDasharray="5 5"
      />

      {/* faint string-bed wash inside the frame */}
      <path d={path(g.frame, true)} fill={ink} fillOpacity={0.05} stroke="none" />

      {/* string bed */}
      <g stroke={ink} strokeWidth={0.7} strokeOpacity={g.stringBrightness * 0.7} strokeLinecap="round">
        {g.mains.map((l, i) => (
          <path key={`m${i}`} d={path(l)} fill="none" />
        ))}
        {g.crosses.map((l, i) => (
          <path key={`c${i}`} d={path(l)} fill="none" />
        ))}
      </g>

      {/* frame beam — stroked centerline gives the beam real thickness */}
      <path
        d={path(g.frame, true)}
        fill="none"
        stroke={ink}
        strokeWidth={g.beamWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* inner beam highlight */}
      <path
        d={path(g.frame, true)}
        fill="none"
        stroke="var(--blueprint)"
        strokeOpacity={0.5}
        strokeWidth={g.beamWidth * 0.34}
        strokeLinejoin="round"
      />
      {g.bridge && (
        <path d={path(g.bridge)} fill="none" stroke={ink} strokeWidth={g.beamWidth * 0.7} strokeLinecap="round" />
      )}

      {/* grip wrap on the handle */}
      <g>
        <rect
          x={-g.grip.halfW}
          y={-g.grip.topY}
          width={g.grip.halfW * 2}
          height={g.grip.topY - g.grip.buttY}
          rx={g.grip.halfW * 0.55}
          fill={gripStroke}
          fillOpacity={g.grip.accent ? 0.16 : 0.1}
          stroke={gripStroke}
          strokeWidth={1.4}
        />
        {/* diagonal overgrip wraps */}
        <g stroke={gripStroke} strokeOpacity={0.55} strokeWidth={0.7}>
          {Array.from({ length: 7 }, (_, i) => {
            const y = g.grip.buttY + ((g.grip.topY - g.grip.buttY) * (i + 0.5)) / 7;
            return (
              <line
                key={i}
                x1={-g.grip.halfW}
                y1={-(y - g.grip.halfW * 0.9)}
                x2={g.grip.halfW}
                y2={-(y + g.grip.halfW * 0.9)}
              />
            );
          })}
        </g>
        {/* butt cap */}
        <line
          x1={-g.grip.halfW - 1.5}
          y1={-g.grip.buttY}
          x2={g.grip.halfW + 1.5}
          y2={-g.grip.buttY}
          stroke={gripStroke}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </g>

      {/* balance marker on the axis */}
      <g>
        <circle cx={0} cy={-g.balanceY} r={4.6} fill="none" stroke="var(--accent)" strokeWidth={1.4} />
        <line x1={-9} y1={-g.balanceY} x2={9} y2={-g.balanceY} stroke="var(--accent)" strokeWidth={1.2} />
        <text
          x={13}
          y={-g.balanceY + 3}
          fontSize="8"
          letterSpacing="0.14em"
          fill="var(--accent)"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          BAL
        </text>
      </g>

      {/* corner registration ticks */}
      {[
        [minX, maxY],
        [maxX, maxY],
        [minX, minY],
        [maxX, minY],
      ].map(([x, y], i) => (
        <g key={i} stroke={ink} strokeOpacity={0.45} strokeWidth={0.8}>
          <line x1={x} y1={-y} x2={x + (x < 0 ? 7 : -7)} y2={-y} />
          <line x1={x} y1={-y} x2={x} y2={-y + (y > 0 ? 7 : -7)} />
        </g>
      ))}
    </svg>
  );
}
