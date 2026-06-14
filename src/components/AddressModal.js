"use client";

import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const GOVERNORATES = [
  'Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba', 'Salt', 'Mafraq', 'Jerash', 'Ajloun', 'Karak', 'Tafila', 'Ma\'an'
];

export default function AddressModal({ isOpen, onClose, initialData, type = 'billing' }) {
  const { wooId, refreshAuth } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address_1: '',
    city: 'Amman',
    phone: '',
    email: '',
    country: 'JO',
    ...initialData
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updates = { [type]: formData };
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wooId, updates })
      });

      if (res.ok) {
        await refreshAuth();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update address");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
           <h3 className="text-xl font-bold flex items-center gap-2">
             <MapPin size={20} className="text-[#be374f]" />
             {type === 'billing' ? 'Billing Address' : 'Shipping Address'}
           </h3>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
             <X size={20} className="text-gray-400" />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-[14px] font-medium">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-gray-500 ml-1">First Name</label>
              <input 
                required
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#be374f] outline-none transition-all" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-gray-500 ml-1">Last Name</label>
              <input 
                required
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#be374f] outline-none transition-all" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-bold text-gray-500 ml-1">Street Address</label>
            <input 
              required
              value={formData.address_1}
              onChange={e => setFormData({ ...formData, address_1: e.target.value })}
              className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#be374f] outline-none transition-all" 
              placeholder="Building name, street, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-gray-500 ml-1">City / Governorate</label>
              <select 
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#be374f] outline-none transition-all appearance-none"
              >
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-bold text-gray-500 ml-1">Phone</label>
              <input 
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-12 px-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#be374f] outline-none transition-all" 
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-black text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
