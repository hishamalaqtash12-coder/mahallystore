"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ currentPage, totalPages, onPageChange, loading }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 border border-zinc-100 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-x-auto max-w-[280px] no-scrollbar">
           {[...Array(totalPages)].map((_, i) => {
             const page = i + 1;
             // Only show current, first, last and surrounding pages if too many
             const isNear = Math.abs(page - currentPage) <= 1;
             const isEdge = page === 1 || page === totalPages;
             
             if (!isNear && !isEdge && totalPages > 7) {
                if (page === 2 || page === totalPages - 1) return <span key={page} className="text-zinc-300">...</span>;
                return null;
             }

             return (
               <button 
                 key={page}
                 onClick={() => onPageChange(page)}
                 disabled={loading}
                 className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all shrink-0 ${currentPage === page ? 'bg-zinc-950 text-white shadow-xl scale-110' : 'text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50'}`}
               >
                 {page}
               </button>
             );
           })}
        </div>

        {/* Next Button */}
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 border border-zinc-100 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">
        Page {currentPage} of {totalPages} · Secure Navigation
      </p>
    </div>
  );
}
