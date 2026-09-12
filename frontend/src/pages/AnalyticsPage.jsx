import React, { useState } from "react";
import {
  ANALYTICS_METRICS,
  ALERTS_OVER_TIME,
  BEHAVIOR_DISTRIBUTION,
  RISK_LEVEL_DISTRIBUTION,
  CAMERA_INCIDENTS,
  LOCATION_DISTRIBUTION,
} from "../data/analytics";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Tabs from "../components/ui/Tabs";
import {
  Activity,
  AlertTriangle,
  Video,
  Users,
  Percent,
  TrendingUp,
  ShieldCheck,
  Flame,
} from "lucide-react";

export function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("24h");

  const timeframeTabs = [
    { id: "today", label: "Today" },
    { id: "24h", label: "Last 24 Hours" },
    { id: "7d", label: "7 Days" },
    { id: "30d", label: "30 Days" },
  ];

  // Custom Dark Cyber Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-xl border border-cyan-500/40 text-xs font-mono shadow-xl">
          <p className="font-bold text-white mb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="font-bold text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#14223d]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wide text-white">
              Surveillance Intelligence & Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              AI ENGINE TELEMETRY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical behavioral aggregations, incident velocity, and risk modeling distributions
          </p>
        </div>

        <Tabs
          tabs={timeframeTabs}
          activeTab={timeframe}
          onChange={setTimeframe}
        />
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="glass-panel p-4 rounded-2xl border border-[#16274a]">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Total Events
            </span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-mono font-black text-white">
            {ANALYTICS_METRICS.totalEvents.toLocaleString()}
          </p>
          <span className="text-[10px] font-mono text-emerald-400">
            +12.4% vs prev period
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-red-500/30 bg-red-500/5">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">
              Critical Alerts
            </span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-mono font-black text-red-400">
            {ANALYTICS_METRICS.criticalEvents}
          </p>
          <span className="text-[10px] font-mono text-red-300">
            Immediate SOP required
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-[#16274a]">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Active Feeds
            </span>
            <Video className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-mono font-black text-white">
            {ANALYTICS_METRICS.activeCameras} / {ANALYTICS_METRICS.totalCameras}
          </p>
          <span className="text-[10px] font-mono text-slate-400">
            99.85% Uptime
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-[#16274a]">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Tracked Persons
            </span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-mono font-black text-white">
            {ANALYTICS_METRICS.trackedPersonsToday}
          </p>
          <span className="text-[10px] font-mono text-cyan-300">
            Unique DeepSORT trajectories
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-[#16274a]">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Avg Risk Index
            </span>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-mono font-black text-amber-400">
            {ANALYTICS_METRICS.avgRiskScore}
          </p>
          <span className="text-[10px] font-mono text-slate-400">
            Severity threshold: 70+
          </span>
        </div>
      </div>

      {/* Row 1: Alerts Over Time (Area) & Risk Level Distribution (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alerts Over Time */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-[#16274a] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Alert Volume Over 24 Hours by Severity
              </h3>
              <p className="text-xs text-slate-400">
                Temporal distribution of automated behavioral triggers
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Hourly Interval</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ALERTS_OVER_TIME}>
                <defs>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#132039" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#475569" fontSize={11} fontFamily="monospace" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                <Area type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorCritical)" />
                <Area type="monotone" dataKey="high" name="High" stroke="#f97316" fillOpacity={1} fill="url(#colorHigh)" />
                <Area type="monotone" dataKey="medium" name="Medium" stroke="#f59e0b" fillOpacity={1} fill="url(#colorMedium)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Distribution Donut */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-[#16274a] shadow-xl">
          <h3 className="text-sm font-bold text-white tracking-wide mb-1">
            Risk Classification Ratio
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Proportion across 1,420 total surveillance events
          </p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={RISK_LEVEL_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {RISK_LEVEL_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#050811" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {RISK_LEVEL_DISTRIBUTION.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs font-mono">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300">{item.name}:</span>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Behavior Categories & Camera Incident Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Behavior Categories Horizontal Bar Chart */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-[#16274a] shadow-xl">
          <h3 className="text-sm font-bold text-white tracking-wide mb-1">
            Incidents by Behavior Classification
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            AI Engine detection modules frequency
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={BEHAVIOR_DISTRIBUTION} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#132039" horizontal={false} />
                <XAxis type="number" stroke="#475569" fontSize={11} fontFamily="monospace" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                  {BEHAVIOR_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Camera Incidents Activity Comparison */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-[#16274a] shadow-xl">
          <h3 className="text-sm font-bold text-white tracking-wide mb-1">
            Camera Node Alert Activity
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Incident density across active cameras
          </p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CAMERA_INCIDENTS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#132039" vertical={false} />
                <XAxis dataKey="camera" stroke="#475569" fontSize={9} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="#475569" fontSize={11} fontFamily="monospace" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="alerts" name="Total Alerts" fill="#00e5ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="critical" name="Critical" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
