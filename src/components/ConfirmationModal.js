"use client";

import { X, AlertTriangle, Loader2 } from "lucide-react";

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger", // 'danger' | 'warning' | 'info'
  isLoading = false 
}) {
  if (!isOpen) return null;

  const colors = {
    danger:  { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-100", icon: <AlertTriangle size={24} /> },
    warning: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", btn: "bg-amber-600 hover:bg-amber-700 shadow-amber-100", icon: <AlertTriangle size={24} /> },
    info:    { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-100", icon: <AlertTriangle size={24} /> }
  };

  const style = colors[type];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={!isLoading ? onClose : undefined} 
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="p-8 text-center">
          <div className={`w-16 h-16 ${style.bg} ${style.text} rounded-full flex items-center justify-center mx-auto mb-6`}>
            {style.icon}
          </div>
          
          <h3 className="text-[20px] font-bold text-zinc-900 mb-2">{title}</h3>
          <p className="text-[14px] text-zinc-500 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-zinc-50 border-t border-zinc-100 flex items-center gap-3">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-11 text-[14px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 h-11 ${style.btn} text-white rounded-xl text-[14px] font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
