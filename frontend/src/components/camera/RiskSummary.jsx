import React from "react";

export function RiskSummary({ counts = { low: 1103, medium: 215, high: 74, critical: 28 } }) {
  const levels = [
    {
      level: "Low Risk",
      count: counts.low,
      dotColor: "bg-emerald-400",
    },
    {
      level: "Medium Risk",
      count: counts.medium,
      dotColor: "bg-amber-400",
    },
    {
      level: "High Risk",
      count: counts.high,
      dotColor: "bg-orange-400",
    },
    {
      level: "Critical Risk",
      count: counts.critical,
      dotColor: "bg-red-400",
    },
  ];

  return (
    <div className="bg-[#070c18]/80 rounded-xl border border-slate-800/80 p-3.5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
        Risk Assessment Summary
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {levels.map((item) => (
          <div
            key={item.level}
            className="p-2.5 rounded-lg bg-[#090e1c] border border-slate-800/80 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
              <span className="text-[11.5px] text-slate-300 font-normal">
                {item.level}
              </span>
            </div>
            <span className="font-mono text-sm font-medium text-slate-200">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RiskSummary;
