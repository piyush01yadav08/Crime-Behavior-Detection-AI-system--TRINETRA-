import React from "react";
import { Search, X } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search cameras, alerts, tracking IDs...",
  className = "",
  onClear = null,
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 w-4 h-4 text-cyan-400/70 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 bg-[#0a1122]/90 text-sm text-slate-100 placeholder-slate-500 rounded-xl border border-[#1b2b4b] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 focus:outline-none transition-all shadow-inner"
      />
      {value && (
        <button
          onClick={() => (onClear ? onClear() : onChange(""))}
          className="absolute right-2.5 p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
