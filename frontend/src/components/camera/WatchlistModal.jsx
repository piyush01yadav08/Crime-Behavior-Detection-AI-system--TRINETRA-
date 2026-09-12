import React, { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { UserPlus, ShieldAlert, Check } from "lucide-react";

export function WatchlistModal({ isOpen, onClose, defaultCamera }) {
  const [personId, setPersonId] = useState("TRK-104");
  const [priority, setPriority] = useState("HIGH");
  const [reason, setReason] = useState("Aggressive confrontation vectors detected on City Road");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
      alert(`Subject ${personId} has been added to the TRINETRA Active Watchlist.`);
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Subject to Surveillance Watchlist"
      subtitle={`Associated Feed: ${defaultCamera?.name || "CAM-02"}`}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            icon={saved ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          >
            {saved ? "Saved to Watchlist" : "Register Watchlist Target"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Tracking / Subject ID
          </label>
          <input
            type="text"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
            required
          />
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Watchlist Priority Level
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-white text-xs focus:outline-none focus:border-cyan-400"
          >
            <option value="CRITICAL">CRITICAL — Immediate Guard Intercept</option>
            <option value="HIGH">HIGH — Real-time Cross-Camera Tracking</option>
            <option value="MEDIUM">MEDIUM — Log Trajectory & Dwell Time</option>
            <option value="LOW">LOW — Routine Observation</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Reason / Observation Notes
          </label>
          <textarea
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#091122] border border-[#172748] text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
            required
          />
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed">
          <strong>Ethical AI Protocol:</strong> Watchlist tagging assists operators with continuous trajectory re-identification across camera feeds. It does not replace operator verification.
        </div>
      </form>
    </Modal>
  );
}

export default WatchlistModal;
