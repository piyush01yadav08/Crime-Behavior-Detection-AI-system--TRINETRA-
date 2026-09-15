import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  disabled = false,
  onClick,
  className = "",
  type = "button",
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-3.5 py-2 rounded-lg gap-2",
    lg: "text-base px-5 py-2.5 rounded-xl gap-2.5",
    icon: "p-2 rounded-lg",
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_20px_rgba(0,229,255,0.5)] border border-cyan-400/40",
    secondary:
      "bg-[#0f1932] text-slate-200 hover:text-cyan-300 hover:bg-[#152345] border border-[#1e325c] hover:border-cyan-500/40",
    outline:
      "bg-transparent text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/10 hover:border-cyan-400",
    danger:
      "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 hover:border-red-400",
    ghost:
      "bg-transparent text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
