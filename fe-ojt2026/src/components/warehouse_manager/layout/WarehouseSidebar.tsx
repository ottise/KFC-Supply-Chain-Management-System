"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { useSidebarContext } from '@/lib/contexts/SidebarContext';

interface SubItem {
  id: string;
  label: string;
  href: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  subItems?: SubItem[];
}

interface SidebarProps {
  activePage: string;
}

const menuGroups: MenuItem[] = [
  {
    id: 'reporting',
    label: 'Báo Cáo',
    href: '/warehouse_manager/reporting',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  },
  {
    id: 'activities',
    label: 'Hoạt Động',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    subItems: [
      { id: 'replenishment', label: 'Nhập Kho', href: '/warehouse_manager/replenishment' },
      { id: 'stock-operations', label: 'Xuất Kho', href: '/warehouse_manager/stock-operations' },
      { id: 'stock-transfer', label: 'Điều Chuyển', href: '/warehouse_manager/stock-transfer' },
      { id: 'inventory-adjustment', label: 'Kiểm Kê', href: '/warehouse_manager/inventory-adjustment' },
      { id: 'scrap', label: 'Loại Bỏ', href: '/warehouse_manager/scrap' },
    ]
  },
  {
    id: 'warehouse-manager',
    label: 'Kho',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    subItems: [
      { id: 'warehouse-list', label: 'Danh sách kho', href: '/warehouse_manager/warehouse' },
      { id: 'location-management', label: 'Vị trí kho', href: '/warehouse_manager/stock-locations' },
    ]
  },
  {
    id: 'products',
    label: 'Sản Phẩm',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    subItems: [
      { id: 'product-management', label: 'Quản Lý Sản Phẩm', href: '/warehouse_manager/product-management' },
      { id: 'warehouse-products', label: 'Sản Phẩm Trong Kho', href: '/warehouse_manager/warehouse-products' },
      { id: 'product-lot', label: 'Quản Lý Lô', href: '/warehouse_manager/product-lot' },
    ]
  },
  {
    id: 'contacts',
    label: 'Liên Hệ',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    subItems: [
      { id: 'vendor-management', label: 'Nhà Cung Cấp', href: '/warehouse_manager/vendor' },
      { id: 'customer-management', label: 'Khách Hàng', href: '/warehouse_manager/customer-management' },
    ]
  },
  {
    id: 'hr-settings',
    label: 'Nhân Sự',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    subItems: [
      { id: 'hr-management', label: 'Quản Lý Nhân Sự', href: '/warehouse_manager/human-resources' },
    ]
  },
  {
    id: 'system-config',
    label: 'Cấu Hình',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    subItems: [
      { id: 'unit-management', label: 'Đơn Vị Tính', href: '/warehouse_manager/unit_of_measure' },
    ]
  }
];

const WarehouseSidebar: React.FC<SidebarProps> = ({ activePage }) => {
  const { isCollapsed, setCollapsed, isPinned, setPinned } = useSidebarContext();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthContext();

  // --- Logic: Đóng Sidebar & Profile khi Click ra ngoài ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }

      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (!isPinned) {
          setCollapsed(true); // Sử dụng setCollapsed thay vì setIsCollapsed
          setOpenGroupId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setCollapsed, isPinned]);

  // --- Logic: Đồng bộ Open Group khi Active Page thay đổi (Mô hình React khuyến nghị) ---
  const [prevActivePage, setPrevActivePage] = useState(activePage);
  if (activePage !== prevActivePage) {
    setPrevActivePage(activePage);
    if (!isCollapsed) {
      const parentGroup = menuGroups.find(group => group.subItems?.some(sub => sub.id === activePage));
      if (parentGroup) setOpenGroupId(parentGroup.id);
    }
  }

  const getBtnStyle = (isActive: boolean) => `
    flex items-center transition-all duration-300 rounded-xl
    ${isCollapsed ? 'justify-center h-12 w-12 mx-auto hover:scale-110' : 'px-4 py-3 gap-4 w-full hover:translate-x-1'} 
    ${isActive
      ? 'bg-[#E4002B] text-white shadow-lg shadow-red-200'
      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
    active:scale-95
  `;

  return (
    <aside
      ref={sidebarRef}
      onMouseEnter={() => { if (!isPinned) setCollapsed(false); }}
      onMouseLeave={() => { if (!isPinned) { setCollapsed(true); setOpenGroupId(null); } }}
      className={`fixed left-0 top-20 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-500 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'} h-[calc(100vh-5rem)]`}
    >
      {/* Top Header */}
      <div className={`px-4 py-6 border-b border-gray-50 mb-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E4002B] to-[#ff4d6d] flex items-center justify-center shrink-0 shadow-lg shadow-red-100 hover:scale-110 transition-transform cursor-pointer">
          <span className="text-white text-xs font-black">K</span>
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden flex-1">
            <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
              Chức năng <span className="text-[#E4002B]">Hệ Thống</span>
            </h2>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Quản Lý Kho</p>
          </div>
        )}
        {!isCollapsed && (
          <button
            onClick={() => setPinned(!isPinned)}
            className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isPinned ? 'bg-red-50 text-[#E4002B]' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              }`}
            title={isPinned ? "Bỏ ghim" : "Ghim sidebar"}
          >
            <svg viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="17" x2="12" y2="22" />
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3 space-y-2">
        {menuGroups.map((group) => {
          const isChildActive = group.subItems?.some(sub => sub.id === activePage) ?? false;
          const isSelfActive = group.id === activePage;
          const isActive = isSelfActive || isChildActive;
          const isOpen = openGroupId === group.id;

          return (
            <div key={group.id} className="relative group/item">
              {group.subItems ? (
                <>
                  <button
                    onClick={() => {
                      if (isCollapsed) setCollapsed(false); // Sửa từ setIsCollapsed thành setCollapsed
                      setOpenGroupId(isOpen ? null : group.id);
                    }}
                    className={getBtnStyle(isActive)}
                  >
                    <span className="shrink-0">{group.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="font-bold text-sm flex-1 text-left whitespace-nowrap">{group.label}</span>
                        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </>
                    )}
                  </button>

                  {!isCollapsed && isOpen && (
                    <div className="ml-9 mt-1 space-y-1 border-l-2 border-gray-100 pl-4 animate-in slide-in-from-top-1">
                      {group.subItems.map(sub => (
                        <Link
                          key={sub.id}
                          href={sub.href}
                          className={`block py-2 px-3 rounded-lg text-xs font-bold transition-all ${activePage === sub.id
                            ? 'text-[#E4002B] bg-red-50/50'
                            : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50 hover:translate-x-1'
                            }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={group.href || '#'} className={getBtnStyle(isActive)}>
                  <span className="shrink-0">{group.icon}</span>
                  {!isCollapsed && <span className="font-bold text-sm whitespace-nowrap">{group.label}</span>}
                </Link>
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all z-50 whitespace-nowrap shadow-xl">
                  {group.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* --- PHẦN PROFILE NÂNG CẤP --- */}
      <div className="p-4 border-t border-gray-100 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className={`group flex items-center w-full transition-all active:scale-95 ${isCollapsed ? 'justify-center hover:scale-110' : 'gap-3 bg-gray-50 p-2 rounded-2xl hover:bg-gray-100 hover:shadow-md'}`}
        >
          <div className="w-10 h-10 rounded-full bg-[#E4002B] flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md transition-transform group-hover:scale-105">
            {user?.fullname?.charAt(0).toUpperCase() || 'A'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-black text-gray-900 truncate">{user?.fullname || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          )}
        </button>

        {isProfileDropdownOpen && (
          <div className={`absolute bottom-full mb-3 bg-white rounded-2xl border border-gray-100 shadow-2xl p-2 z-[100] min-w-[200px] animate-in fade-in zoom-in-95 duration-200 ${isCollapsed ? 'left-14' : 'left-4 right-4'}`}>
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-sm font-black text-gray-900">{user?.fullname || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <div className="py-2">
              <Link href="/warehouse_manager/profile" className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-[#E4002B] hover:translate-x-1 rounded-xl transition-all">Hồ Sơ Của Tôi</Link>
              <Link href="/warehouse_manager/unit_of_measure" className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-[#E4002B] hover:translate-x-1 rounded-xl transition-all">Cài Đặt Hệ Thống</Link>
            </div>
            <div className="h-px bg-gray-50 my-1" />
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:translate-x-1 rounded-xl transition-all text-left">Đăng Xuất</button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default WarehouseSidebar;