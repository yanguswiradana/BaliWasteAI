"use client";

import { useId } from "react";

interface TongSampahGaugeProps {
  /** Fill level 0–100 */
  level: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}

const SIZES = {
  sm: { width: 36, height: 44, lid: 6, handle: 8 },
  md: { width: 52, height: 64, lid: 8, handle: 12 },
  lg: { width: 80, height: 100, lid: 12, handle: 18 },
};

function getLevelColor(level: number) {
  if (level <= 40) return "var(--bw-aman)";
  if (level <= 70) return "var(--bw-peringatan)";
  return "var(--bw-kritis)";
}

function getLevelBg(level: number) {
  if (level <= 40) return "var(--bw-aman-light)";
  if (level <= 70) return "var(--bw-peringatan-light)";
  return "var(--bw-kritis-light)";
}

export default function TongSampahGauge({
  level,
  size = "md",
  showLabel = false,
  label,
}: TongSampahGaugeProps) {
  const { width, height, lid, handle } = SIZES[size];
  const clampedLevel = Math.min(100, Math.max(0, level));
  const color = getLevelColor(clampedLevel);
  const bgColor = getLevelBg(clampedLevel);

  // The bin body goes from y=lid to y=height
  const bodyHeight = height - lid;
  const fillHeight = (clampedLevel / 100) * bodyHeight;
  const fillY = lid + (bodyHeight - fillHeight);

  // Bin shape: slightly tapered (wider at top)
  const topWidth = width;
  const bottomWidth = width * 0.85;
  const topX = 0;
  const bottomXOffset = (topWidth - bottomWidth) / 2;

  // Body path (trapezoid)
  const bodyPath = [
    `M ${topX} ${lid}`,
    `L ${topWidth} ${lid}`,
    `L ${topWidth - bottomXOffset} ${height}`,
    `L ${bottomXOffset} ${height}`,
    `Z`,
  ].join(" ");

  // Fill clip path (same trapezoid shape, clipped from bottom)
  const fillPath = [
    `M ${topX} ${fillY}`,
    `L ${topWidth} ${fillY}`,
    `L ${topWidth - bottomXOffset} ${height}`,
    `L ${bottomXOffset} ${height}`,
    `Z`,
  ].join(" ");

  // Lid path
  const lidPath = [
    `M ${-2} ${lid}`,
    `L ${width + 2} ${lid}`,
    `L ${width + 2} ${lid - lid * 0.7}`,
    `L ${-2} ${lid - lid * 0.7}`,
    `Z`,
  ].join(" ");

  // Handle (small arch on top of lid)
  const handleW = handle;
  const handleX = (width - handleW) / 2;
  const handleY = lid - lid * 0.7;

  const reactId = useId();
  const id = `gauge-clip-${reactId.replace(/:/g, "")}`;


  return (
    <div
      className="tong-gauge"
      style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}
    >
      <svg
        width={width + 4}
        height={height + lid + 4}
        viewBox={`-2 -${lid} ${width + 4} ${height + lid + 4}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Waste bin ${clampedLevel}% full`}
      >
        <defs>
          <clipPath id={id}>
            <path d={bodyPath} />
          </clipPath>
        </defs>

        {/* Bin body background */}
        <path d={bodyPath} fill={bgColor} />

        {/* Fill level */}
        <path d={fillPath} fill={color} opacity={0.85} clipPath={`url(#${id})`} />

        {/* Bin body outline */}
        <path
          d={bodyPath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Lines inside fill (texture) */}
        {clampedLevel > 15 && (
          <g opacity={0.3} clipPath={`url(#${id})`}>
            <line
              x1={width * 0.3}
              y1={fillY + fillHeight * 0.3}
              x2={width * 0.3}
              y2={fillY + fillHeight * 0.9}
              stroke="#fff"
              strokeWidth={1}
            />
            <line
              x1={width * 0.6}
              y1={fillY + fillHeight * 0.2}
              x2={width * 0.6}
              y2={fillY + fillHeight * 0.85}
              stroke="#fff"
              strokeWidth={1}
            />
          </g>
        )}

        {/* Lid */}
        <path d={lidPath} fill={bgColor} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />

        {/* Handle */}
        <path
          d={`M ${handleX} ${handleY} Q ${width / 2} ${handleY - lid * 0.9} ${handleX + handleW} ${handleY}`}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>

      {showLabel && (
        <span
          className="mono-label"
          style={{ color }}
        >
          {label ?? `${clampedLevel}%`}
        </span>
      )}
    </div>
  );
}
