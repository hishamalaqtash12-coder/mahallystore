"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export default function ProductShare({ productTitle }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: productTitle,
      text: `Check out this product on Mahally: ${productTitle}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.log("Clipboard error:", err);
      }
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-brand hover:bg-brand/5 transition-all relative group"
      title="Share product"
    >
      {copied ? <Check size={18} className="text-green-600" /> : <Share2 size={18} />}
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap animate-in fade-in slide-in-from-bottom-1">
          Copied!
        </span>
      )}
    </button>
  );
}
