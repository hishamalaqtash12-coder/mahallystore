"use client";

import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function FloatingWidgets() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user || pathname?.startsWith('/messages')) return null;

  return (
    <>
      <div className="fixed bottom-4 start-4 z-[9999]">
        {/* Shield Icon Button */}
        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="cursor-pointer bg-white p-1.5 rounded-lg shadow-xl border border-zinc-100 flex items-center justify-center hover:shadow-2xl transition-all hover:scale-110 active:scale-95 group relative"
          title="Give Feedback"
        >
          <ShieldAlert size={28} className="text-[#be374f] group-hover:rotate-12 transition-transform" />

          {/* Subtle Label on Hover */}
          <span className="absolute start-full ms-4 bg-black text-white text-[11px] font-bold px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
            Feedback
          </span>
        </button>
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
