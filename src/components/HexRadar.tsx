import React, { useState } from 'react';

export interface HexRadarAxis {
  key: string;
  label: string;
  fullName: string;
}

export interface HexRadarSeries {
  name: string;
  values: number[];
  polygonClass: string;
  dotClass: string;
}

interface HexRadarProps {
  axes: HexRadarAxis[];
  series: HexRadarSeries[];
  max?: number;
  className?: string;
  /** Compact mode draws only the shape; axis names stay in the accessible title. */
  showLabels?: boolean;
}

const RADIUS = 70;
const LABEL_RADIUS = RADIUS + 12;
// Wide enough for a side label plus its value ("OPR 100") at the 14-unit label size.
export const HEX_RADAR_VIEWBOX = { x: -150, y: -100, width: 300, height: 200 };
const GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1];

// Axis i points at -90° + i·(360°/n), so the first axis is straight up and the rest
// follow clockwise. A value v sits at distance (v / max)·RADIUS along its axis.
function polar(index: number, count: number, distance: number): [number, number] {
  const angle = ((-90 + (index * 360) / count) * Math.PI) / 180;
  return [distance * Math.cos(angle), distance * Math.sin(angle)];
}

const toPoints = (coords: Array<[number, number]>) => coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/**
 * Dependency-free SVG radar. The dashboard renders one per team card (80+ at once), so
 * plain SVG replaces a charting library there: no resize observers, no animation loop,
 * and the library stays out of the initial bundle.
 */
export function HexRadar({ axes, series, max = 100, className = '', showLabels = true }: HexRadarProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const n = axes.length;
  const primary = series[0];

  const summary = axes.map((a, i) => `${a.fullName} ${primary?.values[i] ?? 0}`).join(', ');
  const { x: vx, y: vy, width: vw, height: vh } = HEX_RADAR_VIEWBOX;
  const viewBox = showLabels ? `${vx} ${vy} ${vw} ${vh}` : '-74 -74 148 148';

  return (
    <svg viewBox={viewBox} className={`w-full h-full select-none ${className}`} role="img" aria-label={summary}>
      <title>{summary}</title>

      {/* Concentric grid and spokes */}
      {GRID_LEVELS.map((level) => (
        <polygon
          key={level}
          points={toPoints(axes.map((_, i) => polar(i, n, RADIUS * level)))}
          className="fill-none stroke-border-main"
          strokeWidth={1}
        />
      ))}
      {axes.map((axis, i) => {
        const [x, y] = polar(i, n, RADIUS);
        return (
          <line
            key={axis.key}
            x1={0}
            y1={0}
            x2={x}
            y2={y}
            className={hovered === i ? 'stroke-accent' : 'stroke-border-main'}
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygons */}
      {series.map((s) => (
        <polygon
          key={s.name}
          points={toPoints(s.values.map((v, i) => polar(i, n, (Math.max(0, Math.min(max, v)) / max) * RADIUS)))}
          className={s.polygonClass}
          strokeWidth={1.75}
          strokeLinejoin="round"
        />
      ))}

      {/* Vertices with generous invisible hit areas for hover */}
      {showLabels && primary?.values.map((v, i) => {
        const [x, y] = polar(i, n, (Math.max(0, Math.min(max, v)) / max) * RADIUS);
        return (
          <g key={axes[i].key} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <circle cx={x} cy={y} r={11} className="fill-transparent" />
            <circle cx={x} cy={y} r={hovered === i ? 4.5 : 3} className={primary.dotClass} />
          </g>
        );
      })}

      {/* Axis labels: the short code, plus the value while hovered; full names are in <title>. */}
      {showLabels && axes.map((axis, i) => {
        const [x, y] = polar(i, n, LABEL_RADIUS);
        const anchor = x > 1 ? 'start' : x < -1 ? 'end' : 'middle';
        const dy = y < -1 ? -4 : y > 1 ? 14 : 5;
        const isHovered = hovered === i;
        return (
          <text
            key={axis.key}
            x={x}
            y={y}
            dy={dy}
            textAnchor={anchor}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={`font-montserrat cursor-default transition-colors text-[14px] ${
              isHovered ? 'fill-accent font-extrabold' : 'fill-text-muted font-bold'
            }`}
          >
            <title>{`${axis.fullName}: ${primary?.values[i] ?? 0} / ${max}`}</title>
            {isHovered ? `${axis.label} ${primary?.values[i] ?? 0}` : axis.label}
          </text>
        );
      })}
    </svg>
  );
}
