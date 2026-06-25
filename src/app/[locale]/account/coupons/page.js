"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { Ticket, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function AccountCouponsPage() {
  const { wooId, loading } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Unused');

  useEffect(() => {
    if (wooId) {
      fetch(`/api/merchant/coupons?wooId=${wooId}`)
        .then(r => r.json())
        .then(data => setCoupons(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else if (!loading) {
      setIsLoading(false);
    }
  }, [wooId, loading]);

  const filteredCoupons = useMemo(() => {
    if (activeTab === 'Unused') return coupons.filter(c => !c.usage_count || c.usage_count === 0);
    if (activeTab === 'Used') return coupons.filter(c => c.usage_count > 0);
    // Expired logic: checking date_expires
    if (activeTab === 'Expired') {
      const now = new Date();
      return coupons.filter(c => c.date_expires && new Date(c.date_expires) < now);
    }
    return coupons;
  }, [coupons, activeTab]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-100 border-t-[#be374f] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-8 text-gray-900">Coupons & offers</h2>
      
      <div className="flex items-center gap-8 border-b border-gray-100 mb-8 pb-1 overflow-x-auto">
        {['Unused', 'Used', 'Expired'].map((tab) => {
          const count = tab === 'Unused' 
            ? coupons.filter(c => !c.usage_count || c.usage_count === 0).length
            : tab === 'Used' 
              ? coupons.filter(c => c.usage_count > 0).length 
              : coupons.filter(c => c.date_expires && new Date(c.date_expires) < new Date()).length;

          return (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[15px] font-medium relative whitespace-nowrap transition-colors ${activeTab === tab ? 'text-black' : 'text-gray-500 hover:text-black'}`}
            >
              {tab} ({count})
              {activeTab === tab && <div className="absolute bottom-0 end-0 w-full h-[2px] bg-black animate-in fade-in slide-in-from-end-2 duration-300"></div>}
            </button>
          );
        })}
      </div>

      {filteredCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCoupons.map((coupon) => (
            <div key={coupon.id} className="bg-white border border-gray-100 rounded-md p-6 flex flex-col relative overflow-hidden group hover:border-[#be374f] transition-colors">
              <div className="absolute top-0 start-0 w-12 h-12 bg-gray-50 rounded-bl-md flex items-center justify-center text-gray-300 group-hover:text-[#be374f] group-hover:bg-[#be374f]/5 transition-all">
                 <Ticket size={20} />
              </div>
              <div className="flex flex-col gap-0.5 mb-4">
                 <span className="text-2xl font-black text-[#be374f]">{coupon.amount}{coupon.discount_type.includes('percent') ? '%' : ' JOD'} OFF</span>
                 <span className="text-[13px] font-bold text-gray-900 uppercase tracking-widest">{coupon.code}</span>
              </div>
              <p className="text-[13px] text-gray-500 mb-6 line-clamp-2 leading-relaxed">{coupon.description || 'Valid on all items storewide.'}</p>
              <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                 <span className="text-[11px] text-gray-400 font-medium uppercase tracking-tight">Expires: {coupon.date_expires ? new Date(coupon.date_expires).toLocaleDateString() : 'Never'}</span>
                 <button className="text-[13px] font-bold text-black hover:text-[#be374f] transition-colors">Apply Coupon</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
           <Ticket size={48} className="text-gray-100 mb-4" />
           <h3 className="text-[16px] font-bold mb-2">No coupons found</h3>
           <p className="text-gray-500 text-[14px] mb-8">Check back later for exclusive deals!</p>
           <Link href="/browse" className="px-10 py-2.5 bg-black text-white rounded-md font-bold text-[14px] hover:bg-gray-800 transition-all">
             Browse Products
           </Link>
        </div>
      )}
    </div>
  );
}
