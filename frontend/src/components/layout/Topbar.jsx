import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  User,
  LogOut,
  Sliders,
} from "lucide-react";
import { ALERTS_DATA } from "../../data/alerts";

export function Topbar() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  // Clock live update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadAlerts = ALERTS_DATA.filter((a) => a.status === "NEW");

  return (
    <header className="h-14 px-6 border-b border-slate-800/80 bg-[#060a14]/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Eye Logo */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center p-1 transition-all">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
              <path
                d="M10 50 C25 24, 75 24, 90 50 C75 76, 25 76, 10 50 Z"
                stroke="#00e5ff"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="50" cy="50" r="15" stroke="#0070f3" strokeWidth="5" />
              <circle cx="50" cy="50" r="7" fill="#00e5ff" />
              <circle cx="47" cy="47" r="2.5" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <span className="text-base font-bold tracking-[0.18em] text-white font-mono block leading-none">
              TRINETRA
            </span>
            <p className="text-[8.5px] font-medium tracking-[0.2em] text-slate-400 mt-0.5">
              SEE BEYOND. FOR A SAFER TOMORROW.
            </p>
          </div>
        </Link>
      </div>

      {/* Center Slogan / System Status */}
      <div className="hidden lg:flex items-center gap-3 px-3.5 py-1 rounded-full bg-[#090e1c] border border-slate-800/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-[11px] font-medium tracking-wider text-slate-300">
          SYSTEM OPERATIONAL
        </span>
        <div className="h-2.5 w-px bg-slate-700/60" />
        <span className="text-[10px] font-mono text-cyan-400/90 tracking-wider">
          AI EYES. REAL IMPACT.
        </span>
        <div className="h-2.5 w-px bg-slate-700/60" />
        <span className="text-[9px] font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
          DEMO MODE
        </span>
      </div>

      {/* Right Controls: Clock, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* Clock */}
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-[11px] text-slate-400 font-normal">
            {currentDate}
          </span>
          <span className="text-xs font-semibold font-mono text-slate-200">
            {currentTime}
          </span>
        </div>

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-2 rounded-lg bg-[#090f1e] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all relative"
            title="Active Surveillance Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#060a14]">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2.5 w-72 bg-[#090f1f] rounded-xl border border-slate-700/60 shadow-xl p-3 z-50 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  Priority Alerts ({unreadAlerts.length})
                </span>
                <Link
                  to="/alerts"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  View All &rarr;
                </Link>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {unreadAlerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate(`/alerts?id=${alert.id}`);
                    }}
                    className="p-2 rounded-lg bg-[#070b16] border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition-all text-left"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-cyan-400 font-medium">{alert.id}</span>
                      <span className="text-[9px] text-red-400 font-semibold uppercase">{alert.severity}</span>
                    </div>
                    <p className="text-[11px] text-slate-200 mt-0.5 truncate">
                      {alert.behavior}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{alert.camera}</span>
                      <span>{alert.timeFormatted}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-[#090f1e] border border-slate-800 hover:border-slate-700 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600/80 text-white font-medium text-[10px] flex items-center justify-center font-mono">
              PY
            </div>
            <div className="text-left hidden md:block">
              <div className="text-[11px] font-medium text-slate-200 leading-none">
                Piyush Yadav
              </div>
              <div className="text-[9px] text-slate-400 leading-none mt-0.5">
                Administrator
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2.5 w-52 bg-[#090f1f] rounded-xl border border-slate-700/60 shadow-xl p-2 z-50 animate-in fade-in">
              <div className="px-2.5 py-1.5 border-b border-slate-800 text-left">
                <p className="text-xs font-semibold text-white">Piyush Yadav</p>
                <p className="text-[10px] text-slate-400 truncate">piyush01yadav08@trinetra.ai</p>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Operator Profile
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate("/settings");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors text-left"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Preferences
                </button>
                <div className="border-t border-slate-800 my-1" />
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    alert("Terminal Locked for Security.");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Lock Terminal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
