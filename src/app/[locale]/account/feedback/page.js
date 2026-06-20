"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";

export default function WebsiteFeedbackPage() {
  const { wooId, loading } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (wooId) {
      fetch("/api/feedback")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Filter global feedback log by the user's Woo ID
            const userFeedbacks = data.filter(f => String(f.userId) === String(wooId));
            setFeedbacks(userFeedbacks);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    } else if (!loading) {
      setIsLoading(false);
    }
  }, [wooId, loading]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-100 border-t-[#be374f] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-8 text-gray-900">Your Feedback History</h2>

      {feedbacks.length > 0 ? (
        <div className="space-y-4">
          {feedbacks.map((item, index) => (
            <div key={index} className="bg-white border border-gray-100 rounded-md p-6 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < item.rating ? "fill-[#FFA41C] text-[#FFA41C]" : "text-gray-200"} />
                    ))}
                  </div>
                  <span className="text-[13px] font-bold text-orange-600 uppercase tracking-wide">
                    {item.rating === 5 ? "Excellent" : item.rating === 4 ? "Very Good" : item.rating === 3 ? "Average" : item.rating === 2 ? "Below Average" : "Poor"}
                  </span>
                </div>
                <span className="text-[12px] text-gray-400 font-medium">
                  {new Date(item.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {item.categories && item.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {item.categories.map((cat, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-[11px] font-medium rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {item.specificIssue && (
                <div className="text-[12px] text-zinc-500 font-medium mb-2 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded inline-block">
                  Topic/Page: <span className="text-zinc-700">{item.specificIssue}</span>
                </div>
              )}

              <p className="text-[14px] text-gray-700 leading-relaxed font-normal whitespace-pre-wrap">
                {item.comment}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
          <MessageSquare size={48} className="text-gray-100 mb-4" />
          <h3 className="text-[16px] font-bold mb-2">No feedback submitted yet</h3>
          <p className="text-gray-500 text-[14px] max-w-sm">
            We value your suggestions! You can submit your website evaluation anytime by clicking the orange feedback button in the bottom right corner of the page.
          </p>
        </div>
      )}
    </div>
  );
}
