"use client";

interface NeonProgressProps {
  value: number; // 0-100
  color?: "cyan" | "magenta" | "green" | "yellow" | "red";
  height?: string; // default "h-1.5"
  showValue?: boolean;
  label?: string;
}

const COLOR_MAP = {
  cyan: {
    from: "oklch(0.60 0.14 195)",
    to: "oklch(0.78 0.14 195)",
    glow: "oklch(0.78 0.14 195 / 0.4)",
  },
  magenta: {
    from: "oklch(0.50 0.22 310)",
    to: "oklch(0.65 0.25 310)",
    glow: "oklch(0.65 0.25 310 / 0.4)",
  },
  green: {
    from: "oklch(0.60 0.17 155)",
    to: "oklch(0.78 0.17 155)",
    glow: "oklch(0.78 0.17 155 / 0.4)",
  },
  yellow: {
    from: "oklch(0.65 0.14 85)",
    to: "oklch(0.82 0.14 85)",
    glow: "oklch(0.82 0.14 85 / 0.4)",
  },
  red: {
    from: "oklch(0.50 0.22 25)",
    to: "oklch(0.65 0.22 25)",
    glow: "oklch(0.65 0.22 25 / 0.4)",
  },
} as const;

export function NeonProgress({
  value,
  color = "cyan",
  height = "h-1.5",
  showValue = false,
  label,
}: NeonProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const colors = COLOR_MAP[color];

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div className={`${height} bg-border rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
            boxShadow: `0 0 8px ${colors.glow}`,
          }}
        />
      </div>
    </div>
  );
}
