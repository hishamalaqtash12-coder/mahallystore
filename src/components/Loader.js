"use client";

import { Loader2 } from "lucide-react";

/**
 * Premium Brand Loader for Mahally.jo
 */
export default function Loader({
  size = "md",
  text = "Loading...",
  fullPage = false,
  overlay = false,
  className = ""
}) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  const loaderContent = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 
        className={`${sizes[size]} animate-spin text-zinc-400`} 
        strokeWidth={2}
      />
      {text && (
        <span className="text-sm font-medium text-zinc-500">
          {text}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
        {loaderContent}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-[2px] flex items-center justify-center rounded-xl transition-all duration-300">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}
