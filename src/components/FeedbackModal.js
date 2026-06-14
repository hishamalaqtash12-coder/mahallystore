"use client";

import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const RATINGS = [
  { label: 'سيء جداً', value: 1 },
  { label: 'سيء', value: 2 },
  { label: 'مقبول', value: 3 },
  { label: 'جيد', value: 4 },
  { label: 'ممتاز', value: 5 },
];

const CATEGORIES = [
  { 
    id: 'experience', 
    label: 'تجربة الموقع', 
    issues: ['نتائج بحث ضعيفة', 'لا أثق في هذا الموقع', 'قلة المنتجات', 'صعب الاستخدام'] 
  },
  { 
    id: 'promotions', 
    label: 'العروض والتخفيضات', 
    issues: ['لا توجد عروض جذابة', 'الكوبون لا يعمل', 'صعب إيجاد الكوبونات'] 
  },
  { 
    id: 'search', 
    label: 'بحث الموقع', 
    issues: ['لا توجد نتائج', 'نتائج غير ذات صلة', 'البحث بطيء'] 
  },
  { 
    id: 'size', 
    label: 'جدول المقاسات', 
    issues: ['غير دقيق', 'غير موجود', 'مُربك'] 
  },
  { 
    id: 'cart', 
    label: 'سلة التسوق', 
    issues: ['المنتجات تختفي', 'لا أستطيع إضافتها', 'عدم تطابق السعر'] 
  },
  { 
    id: 'checkout', 
    label: 'إتمام الشراء', 
    issues: ['فشل الدفع', 'خطوات كثيرة جداً', 'خطأ في الدفع'] 
  },
  { 
    id: 'delivery', 
    label: 'التوصيل', 
    issues: ['بطيء جداً', 'غالي', 'لا يوجد تتبع'] 
  },
  { 
    id: 'returns', 
    label: 'الإرجاع', 
    issues: ['عملية معقدة', 'إرجاع مدفوع', 'لا يوجد رد'] 
  },
  { 
    id: 'service', 
    label: 'خدمة العملاء', 
    issues: ['رد بطيء', 'غير مفيدة', 'صعب التواصل'] 
  },
  { 
    id: 'other', 
    label: 'أخرى', 
    issues: [] 
  },
];

export default function FeedbackModal({ isOpen, onClose, isRTL = true }) {
  const { user, wooId, customerName, email, role, avatarUrl, avatarBgColor } = useAuth();
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(3);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [specificIssue, setSpecificIssue] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCategoryToggle = (catId) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wooId,
          userName: customerName || user?.displayName || 'ضيف',
          userEmail: email || user?.email || '',
          role: role || 'customer',
          rating,
          categories: selectedCategories,
          specificIssue,
          comment,
          path: window.location.pathname,
          avatarUrl,
          avatarBgColor
        })
      });
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            setStep(1);
            setRating(3);
            setSelectedCategories([]);
            setSpecificIssue('');
            setComment('');
            setIsSuccess(false);
          }, 300);
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCat = selectedCategories.length > 0 ? CATEGORIES.find(c => c.id === selectedCategories[0]) : null;
  const showProblems = rating <= 3;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        dir="rtl"
        className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded hover:bg-gray-100 transition-colors z-10"
        >
          <X size={20} className="text-gray-400" />
        </button>

        {isSuccess ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-md flex items-center justify-center text-emerald-600 mb-6">
              <Check size={32} strokeWidth={3} />
            </div>
            <h2 className="text-xl font-bold mb-2">شكراً لك!</h2>
            <p className="text-gray-500 text-[14px]">تعليقاتك تساعدنا على تحسين تجربة محلي للجميع.</p>
          </div>
        ) : (
          <div className="p-10 max-h-[85vh] overflow-y-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2 text-gray-900">نحن هنا لتحسين تجربتك!</h2>
              <p className="text-gray-500 text-[14px]">رأيك يهمنا! يرجى إخبارنا بما تفكر به حول موقعنا أدناه.</p>
            </div>

            {/* Rating Section */}
            <div className="mb-10">
              <h3 className="text-center font-bold text-gray-800 mb-8 text-[15px]">
                كيف تشعر تجاه زيارتك لموقعنا اليوم؟
              </h3>
              <div className="flex justify-between max-w-lg mx-auto flex-row-reverse">
                {RATINGS.map((r) => (
                  <button 
                    key={r.value}
                    onClick={() => {
                      setRating(r.value);
                      if (r.value > 3) setSelectedCategories([]);
                    }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${rating === r.value ? 'bg-black border-black text-white shadow-md' : 'border-gray-200 group-hover:border-gray-400'}`}>
                      {rating === r.value && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className={`text-[11px] font-bold ${rating === r.value ? 'text-black' : 'text-gray-400'}`}>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Problems Section */}
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {showProblems && (
                <div className="p-6 bg-gray-50/50 rounded-md border border-gray-100">
                  <p className="text-[13px] text-gray-600 mb-5 font-medium">
                    عذراً لسماع ذلك! ما هي المشكلة؟
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryToggle(cat.id)}
                        className={`px-4 py-2 rounded-md border text-[12px] font-bold transition-all ${selectedCategories.includes(cat.id) ? 'bg-black border-black text-white' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Issues */}
              {showProblems && activeCat && activeCat.issues.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <h4 className="font-bold text-[14px] mb-3">{activeCat.label}</h4>
                  <p className="text-[12px] text-gray-500 mb-3">ما هي المشكلة بالتحديد؟</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {activeCat.issues.map(issue => (
                      <button
                        key={issue}
                        onClick={() => setSpecificIssue(issue)}
                        className={`px-4 py-2 rounded-md border text-[12px] font-medium transition-all ${specificIssue === issue ? 'bg-black border-black text-white' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                      >
                        {issue}
                      </button>
                    ))}
                    <button 
                      onClick={() => setSpecificIssue('أخرى')}
                      className={`px-4 py-2 rounded-md border text-[12px] font-medium transition-all ${specificIssue === 'أخرى' ? 'bg-black border-black text-white' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                    >
                      أخرى
                    </button>
                  </div>
                </div>
              )}

              {/* Comment */}
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="يرجى إخبارنا المزيد!"
                  className="w-full h-28 p-4 bg-white border border-gray-200 rounded-md outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all resize-none text-[14px]"
                  maxLength={1000}
                  dir="rtl"
                />
                <span className="absolute bottom-3 left-4 text-[11px] text-gray-400 font-medium">
                  {comment.length}/1000
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (showProblems && selectedCategories.length === 0)}
                className="w-full h-12 bg-[#be374f] text-white rounded-md font-bold text-[16px] hover:bg-[#8f2d4a] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إرسال التقييم لمحلي'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}