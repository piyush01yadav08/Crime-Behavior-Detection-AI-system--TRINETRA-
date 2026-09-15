import React from "react";

export function Badge({ children, variant = "default", size = "sm", className = "", icon = null }) {
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 font-medium",
    sm: "text-xs px-2 py-0.5 font-medium",
    md: "text-sm px-2.5 py-1 font-semibold",
  };

  const variantClasses = {
    default: "bg-slate-800 text-slate-300 border border-slate-700",
    cyan: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]",
    critical: "bg-red-500/15 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.25)]",
    high: "bg-orange-500/15 text-orange-400 border border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.25)]",
    medium: "bg-amber-500/15 text-amber-300 border border-amber-500/40",
    low: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    live: "bg-red-600 text-white font-bold tracking-wider animate-pulse",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider ${sizeClasses[size] || sizeClasses.sm} ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export function RiskScoreBadge({ score, size = "sm" }) {
  let variant = "low";
  if (score >= 85) variant = "critical";
  else if (score >= 70) variant = "high";
  else if (score >= 50) variant = "medium";

  return (
    <Badge variant={variant} size={size} className="font-mono font-bold">
      RISK {score}
    </Badge>
  );
}

export default Badge;
