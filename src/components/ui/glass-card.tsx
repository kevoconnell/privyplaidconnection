import type { HTMLAttributes } from "react";

type GlassCardProps = HTMLAttributes<HTMLDivElement>;

export function GlassCard({ className = "", ...props }: GlassCardProps) {
  return (
    <div
      className={`rounded-3xl border backdrop-blur-xl surface-card ${className}`.trim()}
      {...props}
    />
  );
}
