"use client";

import { useAuth } from "@/context/AuthContext";
import { AlertCircle, RefreshCw, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function ServiceStatusBanner() {
  const { backendError } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (backendError) {
      setIsVisible(true);
    }
  }, [backendError]);

  if (!backendError || !isVisible) return null;

  return (
    <div className="fixed bottom-6 end-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white border-2 border-red-100 shadow-2xl rounded-2xl p-4 md:p-5 flex items-start gap-4 ring-1 ring-black/5">
        <div className="bg-red-50 p-2 rounded-xl shrink-0">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-zinc-900 mb-1">
            Backend Connection Issue
          </h3>
          <p className="text-sm text-zinc-600 leading-relaxed mb-4">
            {backendError.message} We're having trouble reaching our servers right now.
          </p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Page
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-4 py-2 bg-zinc-100 text-zinc-600 text-xs font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
