"use client";

import { Search, X } from "lucide-react";

export default function AdminSearch({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 bg-white border border-zinc-200 rounded-lg pe-9 ps-9 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute start-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
