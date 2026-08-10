"use client";

import { X, MapPin, Mail, Phone, Calendar, Clock, ChevronDown, CheckCircle, Package, Truck, CreditCard, Plus, Trash2, Send, History, Settings, ExternalLink, Loader2, Save, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { logMerchantAction } from "@/lib/merchant-logger";
import { useAuth } from "@/context/AuthContext";

function decodeHTMLEntities(str) {
  if (!str) return "";
  return str
    .replace(/&rarr;/g, "→")
    .replace(/&larr;/g, "←")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&hellip;/g, "...");
}

function normalizeNotes(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.notes)) return value.notes;
  return [];
}

export default function OrderDetailsModal({ order, onClose, onUpdateStatus }) {
  const { user } = useAuth();
  const locale = useLocale();
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("customer");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [customerStats, setCustomerStats] = useState(null);
  const [editMode, setEditMode] = useState(null); // 'billing', 'shipping'
  const [editedData, setEditedData] = useState({ ...order });
  const [lineItemImages, setLineItemImages] = useState({});

  const isReadOnly = order.status === "cancelled" || order.status === "completed";
  const isMissingInventory = Boolean(order.hasMissingInventoryItems || (order.missingProductIds?.length > 0));
  const isViewOnly = isReadOnly || isMissingInventory;

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/merchant/orders/notes?id=${order.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load notes");
      setNotes(normalizeNotes(data));
    } catch (err) {
      console.error("Error fetching notes:", err);
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadNotes = async () => {
      setLoadingNotes(true);
      try {
        const res = await fetch(`/api/merchant/orders/notes?id=${order.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load notes");
        if (!cancelled) setNotes(normalizeNotes(data));
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching notes:", err);
          setNotes([]);
        }
      } finally {
        if (!cancelled) setLoadingNotes(false);
      }
    };

    const fetchCustomerStats = async () => {
      try {
        const res = await fetch(`/api/customers?id=${order.customer_id}`);
        const data = await res.json();
        if (!cancelled) setCustomerStats(data);
      } catch (err) {
        if (!cancelled) console.error("Error fetching customer stats:", err);
      }
    };

    loadNotes();
    if (order.customer_id && order.customer_id !== 0) {
      fetchCustomerStats();
    }

    return () => {
      cancelled = true;
    };
  }, [order.id, order.customer_id]);

  useEffect(() => {
    const fetchItemImages = async () => {
      const imageMap = {};
      try {
        await Promise.all((order.line_items || []).map(async (item) => {
          if (!item.product_id) return;
          try {
            const res = await fetch(`/api/products/${item.product_id}`);
            if (res.ok) {
              const product = await res.json();
              if (product.images?.[0]?.src) {
                imageMap[item.id] = product.images[0].src;
              }
            }
          } catch (e) {
            console.warn("Error fetching product image", e);
          }
        }));
      } catch (err) {}
      setLineItemImages(imageMap);
    };
    fetchItemImages();
  }, [order.line_items]);


  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/merchant/orders/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, note: newNote, customer_note: noteType === "customer" })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to add note");
      }
      const newNoteEntry = normalizeNotes(data)?.[0] || data;
      setNotes(prev => [newNoteEntry, ...normalizeNotes(prev)].filter(Boolean));
      
      await logMerchantAction(user, "ORDER_NOTE", `Added ${noteType} note to Order #${order.id}`);
      
      setNewNote("");
    } catch (err) {
      alert("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleMasterUpdate = async () => {
    if (!window.confirm("You're about to send a notification to the user to see his order details in the local messages system. Continue?")) {
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: order.id,
        status: status,
        billing: editedData.billing,
        shipping: editedData.shipping,
        meta_data: editedData.meta_data
      };

      const res = await fetch(`/api/merchant/orders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const updatedOrder = await res.json().catch(() => null);

      if (!res.ok) throw new Error(updatedOrder?.error || "Failed to save changes");

      setStatus(updatedOrder?.status || status);
      setEditedData(prev => ({
        ...prev,
        ...updatedOrder,
        billing: updatedOrder?.billing || prev.billing || {},
        shipping: updatedOrder?.shipping || prev.shipping || {},
        meta_data: updatedOrder?.meta_data || prev.meta_data || []
      }));

      await logMerchantAction(user, "ORDER_UPDATE", `Updated Order #${order.id} status to ${status}`);

      onUpdateStatus(order.id, updatedOrder || { status });
      fetchNotes();
      setEditMode(null);
      alert("Order updated successfully!");
      onClose();
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/merchant/orders/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, noteId })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete note");
      }
      setNotes(prev => normalizeNotes(prev).filter(n => n.id !== noteId));
      await logMerchantAction(user, "NOTE_DELETE", `Deleted note from Order #${order.id}`);
    } catch (err) {
      alert("Failed to delete note");
    }
  };

  const updateMeta = (key, value) => {
    const newMeta = editedData.meta_data.map(m => m.key === key ? { ...m, value } : m);
    setEditedData({ ...editedData, meta_data: newMeta });
  };

  const deleteMeta = (key) => {
    const newMeta = editedData.meta_data.filter(m => m.key !== key);
    setEditedData({ ...editedData, meta_data: newMeta });
  };

  const addMeta = () => {
    if (isViewOnly) return;
    const key = prompt("Enter Meta Key:");
    if (!key) return;
    const newMeta = [...editedData.meta_data, { key, value: "" }];
    setEditedData({ ...editedData, meta_data: newMeta });
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 text-zinc-900">
      <div className="bg-[#f0f0f1] w-full max-w-[1280px] h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-zinc-300">
        
        {/* Header */}
        <div className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-[20px] font-medium text-zinc-900">
              {isAr ? `تفاصيل الطلب #${order.id}` : `Order #${order.id} details`}
            </h2>
            <div className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                'bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}>
              {status}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Body */}
        {isMissingInventory && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm">
            {isAr ? 'هذا الطلب يحتوي على منتج غير موجود في المخزون بعد الآن. جميع وظائف التحرير مقفلة للحماية.' : 'This order contains a product that is no longer available in inventory. Editing is locked for protection.'}
          </div>
        )}
        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row">
          
          {/* Main Area */}
          <div className="flex-1 overflow-visible md:overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
               {/* General */}
               <div className="bg-white p-4 rounded border border-zinc-200 shadow-sm space-y-4">
                  <h3 className="text-[14px] font-bold text-zinc-900 border-b pb-2">{isAr ? 'عام' : 'General'}</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight">Date created:</label>
                      <p className="text-[13px] text-zinc-600">{new Date(order.date_created).toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight">Status:</label>
                      {isViewOnly ? (
                        <div className="w-full h-10 px-3 flex items-center border border-zinc-200 bg-zinc-50 rounded text-[13px] text-zinc-500 font-medium cursor-not-allowed">
                          {status.charAt(0).toUpperCase() + status.slice(1)} {isMissingInventory ? (isAr ? ' (مقفلة بسبب منتج مفقود)' : ' (Locked due to missing product)') : '(Locked)'}
                        </div>
                      ) : (
                        <>
                          <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full h-10 px-3 border border-zinc-300 rounded text-[13px] bg-white outline-none focus:border-[#2271b1]"
                          >
                            {['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'].map(s => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-amber-600 font-medium italic pt-1">{isAr ? ' * اضغط تحديث لحفظ تغيير الحالة' : '* Click Update to save status change'}</p>
                        </>
                      )}
                    </div>
                  </div>
               </div>

               {/* Billing */}
               <div className="bg-white p-4 rounded border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-[14px] font-bold text-zinc-900">{isAr ? 'الفواتير' : 'Billing'}</h3>
                    {!isViewOnly && (
                      <button onClick={() => setEditMode(editMode === 'billing' ? null : 'billing')} className="text-[11px] text-[#2271b1] hover:underline font-bold">
                        {editMode === 'billing' ? (isAr ? 'إلغاء' : 'CANCEL') : (isAr ? 'تعديل' : 'EDIT')}
                      </button>
                    )}
                  </div>
                  {editMode === 'billing' ? (
                    <div className="space-y-2">
                       <input value={editedData.billing.first_name} onChange={(e) => setEditedData({...editedData, billing: {...editedData.billing, first_name: e.target.value}})} className="w-full border p-2 text-[13px] rounded" placeholder={isAr ? 'الاسم الأول' : 'First Name'} />
                       <input value={editedData.billing.address_1} onChange={(e) => setEditedData({...editedData, billing: {...editedData.billing, address_1: e.target.value}})} className="w-full border p-2 text-[13px] rounded" placeholder={isAr ? 'العنوان' : 'Address'} />
                       <input value={editedData.billing.email} onChange={(e) => setEditedData({...editedData, billing: {...editedData.billing, email: e.target.value}})} className="w-full border p-2 text-[13px] rounded" placeholder={isAr ? 'البريد الإلكتروني' : 'Email'} />
                       <input value={editedData.billing.phone} onChange={(e) => setEditedData({...editedData, billing: {...editedData.billing, phone: e.target.value}})} className="w-full border p-2 text-[13px] rounded" placeholder={isAr ? 'الهاتف' : 'Phone'} />
                    </div>
                  ) : (
                    <div className="text-[13px] text-zinc-600 space-y-1">
                      <p className="font-bold text-zinc-900">{editedData.billing.first_name} {editedData.billing.last_name}</p>
                      <p>{editedData.billing.address_1}</p>
                      <p>{editedData.billing.city}, {editedData.billing.country}</p>
                      <p className="text-[#2271b1] font-medium pt-2">{editedData.billing.email}</p>
                      <p className="text-[#2271b1]">{editedData.billing.phone}</p>
                    </div>
                  )}
               </div>

               {/* Shipping */}
               <div className="bg-white p-4 rounded border border-zinc-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-[14px] font-bold text-zinc-900">{isAr ? 'الشحن' : 'Shipping'}</h3>
                    {!isViewOnly && (
                      <button onClick={() => setEditMode(editMode === 'shipping' ? null : 'shipping')} className="text-[11px] text-[#2271b1] hover:underline font-bold">
                        {editMode === 'shipping' ? (isAr ? 'إلغاء' : 'CANCEL') : (isAr ? 'تعديل' : 'EDIT')}
                      </button>
                    )}
                  </div>
                  {editMode === 'shipping' ? (
                    <div className="space-y-2">
                       <input value={editedData.shipping.first_name} onChange={(e) => setEditedData({...editedData, shipping: {...editedData.shipping, first_name: e.target.value}})} className="w-full border p-2 text-[13px] rounded" placeholder={isAr ? 'الاسم الأول' : 'First Name'} />
                       <input value={editedData.shipping.address_1} onChange={(e) => setEditedData({...editedData, shipping: {...editedData.shipping, address_1: e.target.value}})} className="w-full border p-2 text-[13px] rounded" placeholder={isAr ? 'العنوان' : 'Address'} />
                       <input value={editedData.shipping.city} onChange={(e) => setEditedData({...editedData, shipping: {...editedData.shipping, city: e.target.value}})} className="w-full border p-2 text-[13px] rounded" placeholder={isAr ? 'المدينة' : 'City'} />
                    </div>
                  ) : (
                    <div className="text-[13px] text-zinc-600 space-y-1">
                      <p className="font-bold text-zinc-900">{editedData.shipping.first_name} {editedData.shipping.last_name}</p>
                      <p>{editedData.shipping.address_1 || (isAr ? 'لا يوجد عنوان شحن' : 'No shipping address')}</p>
                      <p>{editedData.shipping.city} {editedData.shipping.postcode}</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded border border-zinc-200 shadow-sm overflow-hidden">
               <table className="w-full text-end">
                 <thead className="bg-[#f6f7f7] border-b">
                   <tr className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                     <th className="p-4">Item</th>
                     <th className="p-4 text-start">Cost</th>
                     <th className="p-4 text-center">Qty</th>
                     <th className="p-4 text-start">Total</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-100">
                   {order.line_items.map((item) => {
                     const itemMissing = isMissingInventory && order.missingProductIds?.includes(item.product_id);
                     return (
                       <tr key={item.id} className={`text-[13px] ${itemMissing ? 'bg-rose-50 text-rose-700' : 'text-zinc-600'}`}>
                         <td className="p-4 flex items-center gap-3">
                           <div className="w-10 h-10 bg-zinc-50 border rounded overflow-hidden flex items-center justify-center">
                             {lineItemImages[item.id] || item.image?.src ? (
                               <img src={lineItemImages[item.id] || item.image.src} className="w-full h-full object-cover" />
                             ) : (
                               <Package size={16} className="text-zinc-400" />
                             )}
                           </div>
                           <div>
                             <p className="text-[#2271b1] font-bold hover:underline cursor-pointer">
                               {item.name || (isAr ? 'منتج محذوف' : 'Deleted Product')}
                             </p>
                             <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-400 mt-0.5">
                               {item.sku && (
                                 <>
                                   <span>SKU: {item.sku}</span>
                                   <span className="text-zinc-300">•</span>
                                 </>
                               )}
                               {item.product_id ? (
                                 <>
                                   <span>Product ID: {item.product_id}</span>
                                   <span className="text-zinc-300">•</span>
                                 </>
                               ) : null}
                               <span>Item ID: {item.id}</span>
                             </div>
                           </div>
                         </td>
                         <td className="p-4 text-start">JOD {item.price}</td>
                         <td className="p-4 text-center">× {item.quantity}</td>
                         <td className="p-4 text-start font-bold text-zinc-900">JOD {item.total}</td>
                       </tr>
                     );
                   })}
                 </tbody>
                 <tfoot className="bg-zinc-50/50 border-t">
                    <tr className="text-[13px]">
                        <td colSpan={3} className="p-4 text-start text-zinc-500 font-medium">{isAr ? 'إجمالي الطلب:' : 'Order Total:'}</td>
                        <td className="p-4 text-start font-bold text-zinc-900 text-[16px]">JOD {order.total}</td>
                    </tr>
                 </tfoot>
               </table>
            </div>

            {/* Custom Fields */}
            <div className="bg-white rounded border border-zinc-200 shadow-sm overflow-hidden">
              <div className="bg-[#f6f7f7] px-4 py-2 border-b flex justify-between items-center">
                <h3 className="text-[13px] font-bold text-zinc-700">{isAr ? 'حقول مخصصة' : 'Custom Fields'}</h3>
                {!isViewOnly && (
                  <button onClick={addMeta} className="text-[11px] text-[#2271b1] hover:underline font-bold">{isAr ? '+ إضافة حقل' : '+ ADD FIELD'}</button>
                )}
              </div>
              <div className="p-4 space-y-4">
                {editedData.meta_data.filter(m => !m.key.startsWith('_') && !m.key.startsWith('mahally_') && !m.key.startsWith('shipping_') && !m.key.startsWith('tax_')).map((meta, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-zinc-50 p-2 rounded border border-zinc-100">
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase">{meta.key}</label>
                      <input 
                        readOnly={isViewOnly}
                        value={meta.value} 
                        onChange={(e) => updateMeta(meta.key, e.target.value)}
                        className={`w-full bg-transparent border-none text-[13px] outline-none ${isViewOnly ? 'text-zinc-500 cursor-default' : ''}`}
                      />
                    </div>
                    {!isViewOnly && (
                      <button onClick={() => deleteMeta(meta.key)} className="text-zinc-300 hover:text-rose-500"><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-80 bg-[#f0f0f1] border-t md:border-t-0 md:border-l border-zinc-300 overflow-visible md:overflow-y-auto p-4 space-y-4">
            
            {/* Master Update Box */}
            <div className="bg-white rounded border border-zinc-200 shadow-sm overflow-hidden">
               <div className="bg-[#f6f7f7] px-4 py-2 border-b flex items-center gap-2">
                 <Settings size={16} className="text-zinc-500" />
                 <h3 className="text-[13px] font-bold text-zinc-700">Order Actions</h3>
               </div>
               <div className="p-4 space-y-3">
                  <select disabled className="w-full h-9 px-2 border border-zinc-200 rounded text-[12px] bg-zinc-50 text-zinc-400 outline-none cursor-not-allowed">
                    <option>{isAr ? 'اختر إجراء...' : 'Choose an action...'}</option>
                    <option>{isAr ? 'إرسال الفاتورة / تفاصيل الطلب' : 'Email invoice / order details'}</option>
                    <option>{isAr ? 'إعادة إرسال إشعار جديد للطلب' : 'Resend new order notification'}</option>
                  </select>
                  {isViewOnly ? (
                    <button 
                      disabled
                      className="w-full h-[36px] bg-zinc-200 text-zinc-400 border border-zinc-300 rounded text-[13px] font-bold cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isMissingInventory ? (isAr ? 'مقفلة' : 'Locked') : 'Locked (Read-Only)'}
                    </button>
                  ) : (
                    <button 
                      onClick={handleMasterUpdate}
                      disabled={loading || isViewOnly}
                      className={`w-full h-[36px] rounded text-[13px] font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${isViewOnly ? 'bg-zinc-200 text-zinc-400 border border-zinc-300 cursor-not-allowed' : 'bg-[#2271b1] hover:bg-[#135e96] text-white'}`}
                    >
                      {loading ? <RefreshCw size={14} className="animate-spin" /> : (isViewOnly ? (isMissingInventory ? (isAr ? 'مقفلة' : 'Locked') : 'Locked') : 'Update')}
                    </button>
                  )}
               </div>
            </div>

            {/* Tracking Step Control */}
            <div className="bg-white rounded border border-zinc-200 shadow-sm overflow-hidden">
               <div className="bg-[#f6f7f7] px-4 py-2 border-b flex items-center gap-2">
                 <Truck size={16} className="text-zinc-500" />
                 <h3 className="text-[13px] font-bold text-zinc-700">{isAr ? 'مرحلة التتبع' : 'Tracking Step'}</h3>
               </div>
               <div className="p-4 space-y-3">
                 <p className="text-[11px] text-zinc-500 mb-2">{isAr ? 'قم بتحديث تقدم التتبع المعروض للعميل.' : 'Update the visual tracking progress shown to the customer.'}</p>
                 <select 
                   disabled={isViewOnly}
                   value={editedData.meta_data.find(m => m.key === 'mahally_tracking_step')?.value || '1'}
                   onChange={(e) => {
                     const val = e.target.value;
                     let found = false;
                     const newMeta = editedData.meta_data.map(m => {
                       if (m.key === 'mahally_tracking_step') {
                         found = true;
                         return { ...m, value: val };
                       }
                       return m;
                     });
                     if (!found) {
                       newMeta.push({ key: 'mahally_tracking_step', value: val });
                     }
                     setEditedData({ ...editedData, meta_data: newMeta });
                     if (val === '5') setStatus('completed');
                   }}
                   className={`w-full h-9 px-2 border rounded text-[12px] outline-none ${isViewOnly ? 'bg-zinc-50 text-zinc-400 cursor-not-allowed border-zinc-200' : 'bg-white border-zinc-300 focus:border-[#2271b1]'}`}
                 >
                   <option value="1">{isAr ? '1. تم تأكيد الطلب' : '1. Order Confirmed'}</option>
                   <option value="2">{isAr ? '2. جاري تجهيز الطلب' : '2. Order Processed'}</option>
                   <option value="3">{isAr ? '3. جاهز للشحن' : '3. Ready to Ship'}</option>
                   <option value="4">{isAr ? '4. في طريقها للتسليم' : '4. Out for Delivery'}</option>
                   <option value="5">{isAr ? '5. تم تسليم الطلب' : '5. Order Delivered'}</option>
                 </select>
                 {editedData.meta_data.find(m => m.key === 'mahally_tracking_step')?.value === '5' && (
                   <p className="text-[10px] text-emerald-600 font-medium pt-1">This will also mark the order as Completed.</p>
                 )}
               </div>
            </div>

            {/* History */}
            <div className="bg-white rounded border border-zinc-200 shadow-sm overflow-hidden">
               <div className="bg-[#f6f7f7] px-4 py-2 border-b flex items-center gap-2">
                 <History size={16} className="text-zinc-500" />
                 <h3 className="text-[13px] font-bold text-zinc-700">{isAr ? 'تاريخ العميل' : 'Customer History'}</h3>
               </div>
               <div className="p-4 space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-zinc-500">Total orders:</span>
                    <span className="font-bold">{customerStats?.orders_count || 0}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-zinc-500">Lifetime revenue:</span>
                    <span className="font-bold">JOD {customerStats?.total_spent || '0.00'}</span>
                  </div>
               </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded border border-zinc-200 shadow-sm overflow-hidden">
               <div className="bg-[#f6f7f7] px-4 py-2 border-b flex items-center gap-2">
                 <Clock size={16} className="text-zinc-500" />
                 <h3 className="text-[13px] font-bold text-zinc-700">{isAr ? 'ملاحظات الطلب' : 'Order Notes'}</h3>
               </div>
               <div className="p-4 space-y-4">
                  {!isViewOnly ? (
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <textarea 
                        placeholder={isAr ? 'أضف ملاحظة...' : 'Add note...'}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full min-h-[60px] p-2 border border-zinc-300 rounded text-[13px] outline-none"
                      />
                      <div className="flex gap-2">
                        <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="flex-1 h-8 px-2 border border-zinc-300 rounded text-[11px] bg-white">
                          <option value="private">Private note</option>
                          <option value="customer">Customer note</option>
                        </select>
                        <button type="submit" disabled={addingNote} className="h-8 px-3 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded text-[11px] font-bold text-zinc-600 disabled:opacity-50">
                          {addingNote ? "..." : (isAr ? 'أضف' : 'Add')}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-3 bg-zinc-100 border border-zinc-200 rounded text-[12px] text-zinc-500 text-center font-medium italic">
                      {isMissingInventory ? (isAr ? 'هذا الطلب غير قابل للتعديل بسبب منتج مفقود من المخزون.' : 'This order is not editable because it contains a removed inventory item.') : 'Order is locked. Adding new notes is disabled.'}
                    </div>
                  )}

                  <div className="space-y-4 max-h-[300px] overflow-y-auto ps-1 text-zinc-900">
                    {notes.map(note => (
                      <div key={note.id} className={`p-3 rounded-lg text-[12px] relative ${
                        note.customer_note ? 'bg-amber-50 border border-amber-100' : 'bg-zinc-100 border border-zinc-200'
                      }`}>
                        <p>{decodeHTMLEntities(note.note)}</p>
                        <div className="mt-2 text-[10px] text-zinc-400 flex justify-between">
                          <span>{new Date(note.date_created).toLocaleDateString()}</span>
                          {!isViewOnly && (
                             <button onClick={() => deleteNote(note.id)} className="underline hover:text-rose-500">Delete</button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
