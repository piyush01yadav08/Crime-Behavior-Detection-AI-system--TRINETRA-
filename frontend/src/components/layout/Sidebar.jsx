import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Globe,
  MapPin,
  Bell,
  BarChart3,
  Search,
  FileText,
  Sparkles,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { ALERTS_DATA } from "../../data/alerts";

export function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  const alertCount = ALERTS_DATA.filter((a) => a.status !== "RESOLVED").length;

  const navItems = [
    {
      to: "/dashboard",
      label: "Live Sphere",
      icon: Globe,
      badge: null,
      exact: true,
    },
    {
      to: "/map",
      label: "Map View",
      icon: MapPin,
      badge: null,
    },
    {
      to: "/alerts",
      label: "Alerts",
      icon: Bell,
      badge: alertCount,
    },
    {
      to: "/analytics",
      label: "Analytics",
      icon: BarChart3,
      badge: null,
    },
    {
      to: "/search",
      label: "Search",
      icon: Search,
      badge: null,
    },
    {
      to: "/reports",
      label: "Reports",
      icon: FileText,
      badge: null,
    },
    {
      to: "/ai-insights",
      label: "AI Insights",
      icon: Sparkles,
      badge: null,
    },
    {
      to: "/settings",
      label: "Settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 z-20 flex flex-col justify-between bg-[#060a14]/95 backdrop-blur-md border-r border-slate-800/80 transition-all duration-300 select-none ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Navigation List */}
      <div className="py-5 px-2.5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === "/dashboard"
              ? location.pathname === "/" || location.pathname === "/dashboard"
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group relative ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                {!collapsed && (
                  <span className="tracking-wide">{item.label}</span>
                )}
              </div>

              {/* Badge */}
              {!collapsed && item.badge !== null && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-red-500/90 text-white">
                  {item.badge}
                </span>
              )}

              {collapsed && item.badge !== null && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Sidebar */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#050811]/40">
        {!collapsed ? (
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono font-medium tracking-wider text-slate-300">
                TRINETRA v1.0
              </span>
            </div>
            <p className="text-[9.5px] text-slate-400">
              Built for a Safer Tomorrow
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[9px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Network Active</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="TRINETRA v1.0">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
