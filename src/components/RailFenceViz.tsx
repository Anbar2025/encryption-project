import { motion } from "framer-motion";
import { railRowPerColumn } from "../ciphers";

type Props = {
  text: string;
  rails: number;
  activeColumn?: number | null;
};

export function RailFenceViz({ text, rails, activeColumn }: Props) {
  const len = text.length;
  const rows = railRowPerColumn(len, rails);
  const w = Math.min(560, Math.max(280, len * 14));
  const rowH = 34;
  const h = rails * rowH + 36;
  const step = len > 1 ? (w - 36) / (len - 1) : 0;
  const yPos = rows.map((r) => 22 + r * rowH);

  let pathD = `M 18 ${yPos[0]}`;
  for (let i = 1; i < len; i++) pathD += ` L ${18 + i * step} ${yPos[i]}`;

  const gradId = `rg-${rails}-${len}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="rail-svg w-full max-w-[560px] mx-auto block">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5b8def" />
          <stop offset="100%" stopColor="#3ecf9a" />
        </linearGradient>
      </defs>
      {Array.from({ length: rails }, (_, r) => (
        <line
          key={r}
          x1={10}
          y1={22 + r * rowH}
          x2={w - 10}
          y2={22 + r * rowH}
          stroke="rgba(120,160,220,0.22)"
          strokeWidth={1}
        />
      ))}
      <motion.path
        d={pathD}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {text.split("").map((ch, i) => (
        <g key={i}>
          <motion.circle
            cx={18 + i * step}
            cy={yPos[i]}
            r={activeColumn === i ? 9 : 6}
            fill={activeColumn === i ? "rgba(91,141,239,0.45)" : "rgba(91,141,239,0.2)"}
            animate={{
              scale: activeColumn === i ? 1.15 : 1,
              opacity:
                activeColumn !== null && activeColumn !== undefined && i <= activeColumn ? 1 : 0.35,
            }}
          />
          <text
            x={18 + i * step}
            y={yPos[i] - 11}
            textAnchor="middle"
            className="rail-char fill-[var(--text)] font-mono text-[11px]"
          >
            {ch}
          </text>
        </g>
      ))}
    </svg>
  );
}
