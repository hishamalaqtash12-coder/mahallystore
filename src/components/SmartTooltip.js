"use client";

import { useState } from "react";
import { HelpCircle, X } from "lucide-react";

export default function SmartTooltip({ title, content, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1.5">
        {children}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-zinc-300 hover:text-brand transition-colors focus:outline-none"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {isOpen && (
        <>
          {/* Backdrop for closing */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Tooltip Content */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-brand">{title}</h4>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              {content}
            </p>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-zinc-900" />
          </div>
        </>
      )}
    </div>
  );
}
