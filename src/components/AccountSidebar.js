"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import UserAvatar from '@/components/UserAvatar';
import { 
  RotateCcw, 
  Star, 
  User, 
  Ticket, 
  Wallet, 
  Store, 
  History, 
  MapPin, 
  Globe, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Bell,
  MessageSquare,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  LogOut
} from 'lucide-react';

const sidebarItems = [
  { 
    id: 'orders', 
    icon: RotateCcw, 
    label: 'طلباتك', 
    href: '/account/orders',
    expandable: true,
    subItems: [
      { id: 'all', label: 'جميع الطلبات', href: '/account/orders' },
      { id: 'processing', label: 'قيد المعالجة', href: '/account/orders?status=processing' },
      { id: 'on-hold', label: 'قيد الانتظار', href: '/account/orders?status=on-hold' },
      { id: 'completed', label: 'مكتملة', href: '/account/orders?status=completed' },
      { id: 'cancelled', label: 'ملغاة', href: '/account/orders?status=cancelled' },
    ]
  },
  { id: 'reviews', icon: Star, label: 'تقييماتك', href: '/account/reviews' },
  { id: 'profile', icon: User, label: 'الملف الشخصي', href: '/account/profile' },
  { id: 'coupons', icon: Ticket, label: 'الكوبونات والعروض', href: '/account/coupons' },
  { id: 'balance', icon: Wallet, label: 'رصيد المحفظة', href: '/account/balance' },
  { id: 'stores', icon: Store, label: 'المتاجر المتابعة', href: '/account/followed-stores' },
  { id: 'history', icon: History, label: 'سجل التصفح', href: '/account/recently-viewed' },
  { id: 'addresses', icon: MapPin, label: 'العناوين', href: '/account/addresses' },
  { id: 'language', icon: Globe, label: 'الدولة واللغة', href: '/account/settings' },
  { id: 'payments', icon: CreditCard, label: 'طرق الدفع', href: '/account/payments' },
  { id: 'security', icon: ShieldCheck, label: 'أمان الحساب', href: '/account/security' },
  { id: 'permissions', icon: Lock, label: 'الصلاحيات', href: '/account/permissions' },
  { id: 'notifications', icon: Bell, label: 'الإشعارات', href: '/account/notifications' },
  { id: 'feedback', icon: MessageSquare, label: 'الشكاوي والملاحظات', href: '/account/feedback' },
];

export default function AccountSidebar({ user, customerName, logout, isVendor, vendorLogo, avatarUrl, avatarBgColor }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeStatus = searchParams ? (searchParams.get("status") || "all") : "all";
  const [isOrdersExpanded, setIsOrdersExpanded] = React.useState(pathname.startsWith('/account/orders'));

  const handleLogoutClick = async (e) => {
    e.preventDefault();
    await logout();
  };

  return (
    <aside className="w-full md:w-72 bg-white md:min-h-screen border-l border-gray-100 py-6 px-4 shrink-0 sticky top-0 h-fit" dir="rtl">
      <div className="mb-8 px-3">
        <div className="flex items-center gap-3 mb-6">
          <UserAvatar 
            user={user}
            customerName={customerName}
            avatarUrl={vendorLogo || avatarUrl}
            avatarBgColor={avatarBgColor}
            className="w-11 h-11 rounded-md text-[16px] border border-gray-100/20 shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-[15px] font-bold leading-tight text-gray-900">{customerName || user?.displayName || 'حساب المستخدم'}</span>
            {/* <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Online Status</span> */}
          </div>
        </div>
      </div>
      <nav className="space-y-0.5">
        {isVendor && (
          <div className="mb-2 pb-2 border-b border-gray-100">
            <Link href="/merchant/dashboard" className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[14px] transition-all group hover:bg-[#FFD700]/10 font-bold text-[#8f2d4a]">
              <div className="flex items-center gap-3">
                <Store size={19} strokeWidth={2} className="text-[#8f2d4a]" />
                <span>لوحة تحكم التاجر</span>
              </div>
            </Link>
          </div>
        )}
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || (item.expandable && pathname.startsWith('/account/orders'));
          
          return (
            <div key={item.id}>
              {item.expandable ? (
                <button 
                  onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[14px] transition-all group ${isActive && !isOrdersExpanded ? 'bg-gray-100 font-bold text-gray-900' : 'hover:bg-gray-50 font-medium text-gray-600 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={19} className={isActive ? 'text-black' : 'text-gray-400 group-hover:text-black'} strokeWidth={isActive ? 2 : 1.5} />
                    <span>{item.label}</span>
                  </div>
                  {isOrdersExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>
              ) : (
                <Link 
                  href={item.href}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[14px] transition-all group ${isActive ? 'bg-gray-100 font-bold text-gray-900' : 'hover:bg-gray-50 font-medium text-gray-600 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={19} className={isActive ? 'text-black' : 'text-gray-400 group-hover:text-black'} strokeWidth={isActive ? 2 : 1.5} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )}
              
              {item.expandable && isOrdersExpanded && (
                <div className="mr-9 mt-0.5 space-y-0.5 mb-2">
                  {item.subItems.map((sub) => {
                    const isSubActive = pathname === '/account/orders' && (
                      (sub.id === 'all' && activeStatus === 'all') ||
                      (sub.id !== 'all' && activeStatus === sub.id)
                    );
                    
                    return (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        className={`w-full block text-right px-3 py-1.5 rounded-md text-[13px] transition-all ${isSubActive ? 'text-[#be374f] font-bold bg-[#be374f]/5' : 'text-gray-500 font-medium hover:text-black hover:bg-gray-50'}`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        <div className="pt-4 mt-4 border-t border-gray-100">
          <button 
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] text-rose-600 font-bold hover:bg-rose-50 transition-all group"
          >
            <LogOut size={19} strokeWidth={2} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
