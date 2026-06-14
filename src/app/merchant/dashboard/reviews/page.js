"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Star, 
  MessageSquare, 
  Search, 
  Filter, 
  Reply, 
  Trash2, 
  ExternalLink,
  Clock,
  CheckCircle2,
  MoreVertical,
  Loader2,
  Send,
  AlertCircle
} from "lucide-react";
import Loader from "@/components/Loader";

export default function MerchantReviewsPage() {
  const { wooId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = async () => {
    if (!wooId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/merchant/reviews?wooId=${wooId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [wooId]);

  const handleReply = async (e, reviewId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    setSubmittingReply(true);
    try {
      const res = await fetch("/api/merchant/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, reply: replyText, wooId })
      });
      
      if (res.ok) {
        setReplyingTo(null);
        setReplyText("");
        fetchReviews(); // Refresh to show reply
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit reply");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch("/api/merchant/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        alert("Failed to delete review");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const reviewerName = r.reviewer || "";
    const reviewContent = r.review || "";
    const matchesSearch = reviewerName.toLowerCase().includes(search.toLowerCase()) || 
                         reviewContent.toLowerCase().includes(search.toLowerCase());
    const matchesRating = ratingFilter === "all" || r.rating.toString() === ratingFilter;
    return matchesSearch && matchesRating;
  });

  if (loading && reviews.length === 0) return (
    <div className="h-[400px] flex items-center justify-center">
        <Loader size="lg" text="Fetching reviews" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-zinc-900 tracking-tight">Customer Reviews</h1>
          <p className="text-[13px] text-zinc-500 font-medium">Manage and respond to feedback from your buyers</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input 
                type="text" 
                placeholder="Search reviews..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-[36px] bg-white border border-zinc-300 rounded-md pl-9 pr-3 text-[13px] outline-none focus:border-[#e77600] transition-all w-64 shadow-sm"
              />
           </div>
           <select 
             value={ratingFilter}
             onChange={(e) => setRatingFilter(e.target.value)}
             className="h-[36px] px-4 bg-white border border-zinc-300 rounded-md text-[13px] outline-none shadow-sm cursor-pointer"
           >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {filteredReviews.length > 0 ? filteredReviews.map((review, i) => (
           <div key={review.id} className="bg-white border border-zinc-200 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="p-6 flex flex-col md:flex-row gap-6">
                 {/* User Info */}
                 <div className="md:w-48 shrink-0 space-y-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 text-[13px] font-bold">
                          {review.reviewer?.[0] || "U"}
                       </div>
                       <div className="min-w-0">
                          <p className="text-[14px] font-bold text-zinc-900 truncate">{review.reviewer}</p>
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                             <CheckCircle2 size={10} />
                             Verified Buyer
                          </div>
                       </div>
                    </div>
                    <div className="pt-2 space-y-2">
                       <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-bold">
                          <Clock size={12} />
                          {new Date(review.date_created).toLocaleDateString()}
                       </div>
                        <a 
                           href={`/product/${review.product_id}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center gap-2 text-[11px] text-[#007185] font-bold hover:text-[#c45500] transition-colors"
                        >
                           <ExternalLink size={12} />
                           Product: {review.product_name || `#${review.product_id}`}
                        </a>
                    </div>
                 </div>

                 {/* Review Content */}
                 <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={16} className={s <= review.rating ? 'fill-[#FFA41C] text-[#FFA41C]' : 'fill-zinc-100 text-zinc-200'} />
                          ))}
                       </div>
                       <div className="flex items-center gap-2">
                          {deletingId === review.id && <Loader2 size={14} className="animate-spin text-rose-500" />}
                          <button className="p-2 text-zinc-300 hover:text-zinc-600 transition-colors">
                            <MoreVertical size={16} />
                          </button>
                       </div>
                    </div>
                    
                    <div className="text-[14px] text-zinc-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: review.review }} />

                    <div className="pt-4 flex items-center gap-4">
                       <button 
                         onClick={() => {
                            setReplyingTo(replyingTo === review.id ? null : review.id);
                            setReplyText("");
                         }}
                         className={`flex items-center gap-2 text-[12px] font-bold transition-colors ${replyingTo === review.id ? 'text-zinc-500' : 'text-[#007185] hover:text-[#c45500]'}`}
                       >
                          <Reply size={14} />
                          {replyingTo === review.id ? 'Cancel Reply' : 'Reply to Customer'}
                       </button>
                       <button 
                         onClick={() => handleDelete(review.id)}
                         disabled={deletingId === review.id}
                         className="flex items-center gap-2 text-[12px] font-bold text-rose-600 hover:text-rose-800 transition-colors disabled:opacity-50"
                       >
                          <Trash2 size={14} />
                          Delete
                       </button>
                    </div>

                    {replyingTo === review.id && (
                      <div className="mt-4 p-5 bg-zinc-50 rounded-xl border border-zinc-200 animate-in slide-in-from-top-2 duration-200 shadow-inner">
                         <form onSubmit={(e) => handleReply(e, review.id)} className="space-y-4">
                            <div className="relative">
                               <textarea 
                                 rows={4} 
                                 value={replyText}
                                 onChange={(e) => setReplyText(e.target.value)}
                                 placeholder="Type your response to this customer..."
                                 className="w-full p-4 bg-white border border-zinc-300 rounded-xl text-[14px] outline-none focus:border-[#e77600] focus:ring-1 focus:ring-[#e77600] shadow-sm resize-none transition-all"
                                 required
                                 autoFocus
                               />
                               <MessageSquare className="absolute right-4 bottom-4 text-zinc-100 w-12 h-12 -z-0" />
                            </div>
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                                  <AlertCircle size={14} />
                                  <span>Responses are public and visible to all customers.</span>
                               </div>
                               <div className="flex justify-end gap-3">
                                  <button 
                                    type="button"
                                    onClick={() => setReplyingTo(null)}
                                    className="px-4 py-2 text-[12px] font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
                                  >
                                     Cancel
                                  </button>
                                  <button 
                                    type="submit"
                                    disabled={submittingReply}
                                    className="h-[36px] px-6 bg-zinc-900 text-white rounded-lg text-[12px] font-bold hover:bg-zinc-800 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                                  >
                                     {submittingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                     Post Reply
                                  </button>
                               </div>
                            </div>
                         </form>
                      </div>
                    )}
                 </div>
              </div>
           </div>
         )) : (
           <div className="bg-white border border-zinc-200 rounded-md p-20 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                 <MessageSquare size={32} />
              </div>
              <div className="space-y-1">
                 <h3 className="text-[16px] font-bold text-zinc-900">No reviews found</h3>
                 <p className="text-[13px] text-zinc-500 font-medium">Reviews from your customers will appear here.</p>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}

