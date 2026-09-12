import React from "react";
import { INSIGHTS_DATA } from "../data/insights";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import {
  Sparkles,
  TrendingUp,
  AlertOctagon,
  ShieldCheck,
  Cpu,
  Activity,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Video,
  ArrowRight,
} from "lucide-react";

export function AIInsightsPage() {
  return (
    <div className="space-y-6">
      {/* Top Banner with Model Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#14223d]">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold tracking-wide text-white">
              AI Surveillance Insights & Behavioral Patterns
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Autonomous anomaly discovery, threat trajectory forecasting, and node optical diagnostics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Threat Level: {INSIGHTS_DATA.summary.overallThreatLevel}
          </span>
        </div>
      </div>

      {/* Model Transparency Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3 text-xs text-cyan-200">
        <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Trinetra AI Behavior Model Intelligence (Simulated Inference Pipeline)
          </p>
          <p className="text-[11px] text-cyan-200/80 leading-relaxed">
            These insights reflect behavioral anomaly clustering from the computer vision pipeline (YOLOv8 + DeepSORT + Optical Velocity analysis). In this development phase, records use the local surveillance intelligence model ready for live Django REST integration.
          </p>
        </div>
      </div>

      {/* Section 1: Behavior & Risk Trends */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Discovered Behavioral Anomalies & Trends
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INSIGHTS_DATA.behaviorTrends.map((trend) => (
            <div
              key={trend.id}
              className="glass-panel p-5 rounded-2xl border border-[#16274a] space-y-3 hover:border-cyan-500/40 transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0f1d3a] text-cyan-300 border border-cyan-500/30">
                    {trend.badge}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Conf: {trend.confidence}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">
                  {trend.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {trend.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#142340] flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Nodes: {trend.affectedCameras.join(", ")}
                </span>
                <Badge
                  variant={
                    trend.impact === "HIGH"
                      ? "high"
                      : trend.impact === "MEDIUM"
                      ? "medium"
                      : "low"
                  }
                  size="xs"
                >
                  {trend.impact} IMPACT
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Unusual Activity Spotlights */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Unusual Activity Spotlights
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INSIGHTS_DATA.unusualActivity.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-5 rounded-2xl border border-[#16274a] space-y-3 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400 text-xs">
                    {item.camera}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({item.location})
                  </span>
                </div>
                <Badge
                  variant={item.severity === "CRITICAL" ? "critical" : "medium"}
                  size="xs"
                >
                  {item.severity}
                </Badge>
              </div>

              <h3 className="text-sm font-bold text-white">
                {item.title}
              </h3>

              <div className="space-y-1 text-xs">
                <p className="text-slate-300">
                  <strong className="text-slate-400">Pattern:</strong> {item.detectedPattern}
                </p>
                <p className="text-cyan-300">
                  <strong className="text-slate-400">AI Assessment:</strong> {item.riskAssessment}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: AI Recommendations & Camera Optical Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Recommendations */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-[#16274a] shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Actionable AI Safety Recommendations
            </h2>
          </div>

          <div className="space-y-3">
            {INSIGHTS_DATA.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-xl bg-[#091122] border border-[#16274a] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">
                    {rec.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      rec.priority === "IMMEDIATE"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : rec.priority === "PREVENTATIVE"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  <strong className="text-slate-400">Action:</strong> {rec.action}
                </p>
                <p className="text-[11px] text-slate-500">
                  <strong className="text-slate-400">Rationale:</strong> {rec.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Camera Optical Health & Diagnostic Stream */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-[#16274a] shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Camera Optical Health
            </h2>
          </div>

          <div className="space-y-3">
            {INSIGHTS_DATA.cameraHealth.map((cam) => (
              <div
                key={cam.id}
                className="p-3 rounded-xl bg-[#070d1c] border border-[#142340] space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{cam.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cam.status === "OPTIMAL"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : cam.status === "DEGRADED"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {cam.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-400">
                  <div>Optics: <span className="text-white">{cam.opticalScore}</span></div>
                  <div>FPS: <span className="text-white">{cam.fpsStability}</span></div>
                  <div>Ping: <span className="text-cyan-300">{cam.latency}</span></div>
                </div>

                <p className="text-[11px] font-sans text-slate-400 pt-1 border-t border-[#132038]">
                  {cam.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIInsightsPage;
