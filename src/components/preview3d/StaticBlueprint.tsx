import type { RacquetConfig } from "@/lib/domain/config";
import { buildRacquetGeometry, type Pt } from "./racquetGeometry";

/** SVG y is down; our geometry is y-up, so negate y on emit. */
const toStr = (pts: Pt[]) => pts.map(([x, y]) => `${x.toFixed(1)},${(-y).toFixed(1)}`).join(" ");

export function StaticBlueprint({ config }: { config: RacquetConfig }) {
  const g = buildRacquetGeometry(config);
  const { halfW, halfH } = g.bounds;
  const pad = 14;

  return (
    <svg
      viewBox={`${-halfW - pad} ${-halfH - pad} ${(halfW + pad) * 2} ${(halfH + pad) * 2}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Technical drawing of a ${config.shape} squash racquet, ${config.stringTensionLb} pound string tension`}
      style={{ display: "block" }}
    >
      {/* construction axis */}
      <polyline
        points={toStr(g.centerLine)}
        fill="none"
        stroke="var(--blueprint-ink)"
        strokeOpacity={0.3}
        strokeWidth={0.6}
        strokeDasharray="4 4"
      />

      {/* string bed */}
      <g stroke="var(--blueprint-ink)" strokeWidth={0.5} strokeOpacity={g.stringBrightness * 0.8}>
        {g.mains.map((l, i) => (
          <polyline key={`m${i}`} points={toStr(l)} fill="none" />
        ))}
        {g.crosses.map((l, i) => (
          <polyline key={`c${i}`} points={toStr(l)} fill="none" />
        ))}
      </g>

      {/* frame: head, throat, bridge, handle */}
      <g fill="none" stroke="var(--blueprint-ink)" strokeWidth={1.6} strokeLinejoin="round">
        <polyline points={toStr(g.headOutline)} />
        {g.bridge && <polyline points={toStr(g.bridge)} strokeWidth={1.1} />}
        <polyline points={toStr(g.throat[0])} />
        <polyline points={toStr(g.throat[1])} />
        <polyline points={toStr(g.handle)} />
      </g>

      {/* balance marker on the axis */}
      <g>
        <circle cx={0} cy={-g.balanceY} r={4.5} fill="none" stroke="var(--accent)" strokeWidth={1.4} />
        <line x1={-9} y1={-g.balanceY} x2={9} y2={-g.balanceY} stroke="var(--accent)" strokeWidth={1.2} />
        <text
          x={14}
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
        [-halfW, -halfH],
        [halfW, -halfH],
        [-halfW, halfH],
        [halfW, halfH],
      ].map(([x, y], i) => (
        <g key={i} stroke="var(--blueprint-ink)" strokeOpacity={0.5} strokeWidth={0.8}>
          <line x1={x} y1={y} x2={x + (x < 0 ? 8 : -8)} y2={y} />
          <line x1={x} y1={y} x2={x} y2={y + (y < 0 ? 8 : -8)} />
        </g>
      ))}
    </svg>
  );
}
