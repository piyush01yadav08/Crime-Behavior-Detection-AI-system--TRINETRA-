import React from "react";
import { Crosshair, Maximize, UserCheck, UserPlus } from "lucide-react";

/**
 * QuickActions Component
 * Restrained, clean action controls for the operator command panel.
 */
export function QuickActions({
  onFocusCamera,
  onFullScreen,
  onTrackObject,
  onAddToWatchlist,
}) {
  const actions = [
    {
      id: "focus",
      label: "Focus",
      icon: Crosshair,
      onClick: onFocusCamera,
    },
    {
      id: "fullscreen",
      label: "Full Screen",
      icon: Maximize,
      onClick: onFullScreen,
    },
    {
      id: "track",
      label: "Track Object",
      icon: UserCheck,
      onClick: onTrackObject,
    },
    {
      id: "watchlist",
      label: "Watchlist",
      icon: UserPlus,
      onClick: onAddToWatchlist,
    },
  ];

  return (
    <div className="bg-[#070c18]/80 rounded-xl border border-slate-800/80 p-3.5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
        Quick Actions
      </h3>

      <div className="grid grid-cols-4 gap-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#090e1c] hover:bg-[#0e162c] border border-slate-800/90 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-slate-400 mb-1" />
              <span className="text-[10.5px] font-normal leading-tight text-center">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickActions;
