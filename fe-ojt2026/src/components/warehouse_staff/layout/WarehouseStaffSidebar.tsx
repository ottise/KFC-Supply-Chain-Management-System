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
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuGroups: MenuItem[] = [
  {
    id: 'activities',
    label: 'Hoạt Động',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    subItems: [
      { id: 'replenishment', label: 'Nhập Kho', href: '/warehouse-staff/replenishment' },
      { id: 'stock-operations', label: 'Xuất Kho', href: '/warehouse-staff/stock-operations' },
      { id: 'stock-transfer', label: 'Điều Chuyển', href: '/warehouse-staff/stock-transfer' },
      { id: 'inventory-adjustment', label: 'Kiểm Kê', href: '/warehouse-staff/inventory-adjustment' },
    ]
  },
  {
    id: 'products',
    label: 'Sản Phẩm',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    subItems: [
      { id: 'product-management', label: 'Quản Lý Sản Phẩm', href: '/warehouse-staff/product-management' },
    ]
  },
  {
    id: 'contacts',
    label: 'Liên Hệ',
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    subItems: [
      { id: 'customer-management', label: 'Khách Hàng', href: '/warehouse-staff/customer-management' },
    ]
  }
];

const WarehouseStaffSidebar: React.FC<SidebarProps> = ({
  activePage,
  isMobileOpen = false,
  onMobileClose
}) => {
  const { isCollapsed, setCollapsed, isPinned, setPinned } = useSidebarContext();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthContext();

  // Check if user has managerId assigned
  const hasManagerId = React.useMemo(() => {
    const managerId = user?.managerId;
    if (managerId === null || managerId === undefined) return false;
    if (typeof managerId === "string" && (managerId === "null" || managerId === "undefined" || managerId === "")) return false;
    return true;
  }, [user?.managerId]);

  // --- Logic: Đóng Sidebar & Profile khi Click ra ngoài ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }

      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (!isPinned) {
          setCollapsed(true);
          setOpenGroupId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPinned, setCollapsed]);

  const activeGroupId = React.useMemo(() => {
    const parentGroup = menuGroups.find((group) => group.subItems?.some((sub) => sub.id === activePage));
    return parentGroup ? parentGroup.id : null;
  }, [activePage]);

  const expandedGroupId = isCollapsed ? null : (openGroupId ?? activeGroupId);

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
      className={`fixed left-0 top-20 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-500 ease-in-out 
        ${isCollapsed ? 'w-20' : 'w-64'} 
        ${isMobileOpen ? 'translate-x-0' : 'max-md:-translate-x-full'} 
        md:translate-x-0 h-[calc(100vh-5rem)]`}
    >
      {/* Top Header */}
      <div className={`px-4 py-6 border-b border-gray-50 mb-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} max-md:hidden`}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E4002B] to-[#ff4d6d] flex items-center justify-center shrink-0 shadow-lg shadow-red-100 hover:scale-110 transition-transform cursor-pointer">
          <span className="text-white text-xs font-black">K</span>
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden flex-1">
            <h2 className="text-[10px] font-black text-gray-900 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
              Chức Năng <span className="text-[#E4002B]">Hệ Thống</span>
            </h2>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">Nhân Viên Kho</p>
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

      <nav className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3 space-y-2 pt-4 md:pt-0">

        {/* Show menu only if user has managerId */}
        {hasManagerId ? (
          <>
            {menuGroups.map((group) => {
              const isChildActive = group.subItems?.some(sub => sub.id === activePage) ?? false;
              const isSelfActive = group.id === activePage;
              const isActive = isSelfActive || isChildActive;
              const isOpen = expandedGroupId === group.id;

          return (
            <div key={group.id} className="relative group/item">
              {group.subItems ? (
                <>
                  <button
                    onClick={() => {
                      if (isCollapsed) setCollapsed(false);
                      setOpenGroupId((prev) => {
                        const current = prev ?? activeGroupId;
                        return current === group.id ? null : group.id;
                      });
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
                          onClick={onMobileClose}
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
                <Link href={group.href || '#'} onClick={onMobileClose} className={getBtnStyle(isActive)}>
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-gray-700 mb-1">Chưa được phân công</p>
            <p className="text-xs text-gray-400">Liên hệ admin để được gán quản lý</p>
          </div>
        )}
      </nav>

      {/* --- PHẦN PROFILE --- */}
      <div className="p-4 border-t border-gray-100 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className={`group flex items-center w-full transition-all active:scale-95 ${isCollapsed ? 'justify-center hover:scale-110' : 'gap-3 bg-gray-50 p-2 rounded-2xl hover:bg-gray-100 hover:shadow-md'}`}
        >
          <div className="w-10 h-10 rounded-full bg-[#E4002B] flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md transition-transform group-hover:scale-105">
            {user?.fullname?.charAt(0).toUpperCase() || 'S'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-black text-gray-900 truncate">{user?.fullname || 'Nhân Viên'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          )}
        </button>

        {isProfileDropdownOpen && (
          <div className={`absolute bottom-full mb-3 bg-white rounded-2xl border border-gray-100 shadow-2xl p-2 z-[100] min-w-[200px] animate-in fade-in zoom-in-95 duration-200 ${isCollapsed ? 'left-14' : 'left-4 right-4'}`}>
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-sm font-black text-gray-900">{user?.fullname || 'Staff'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <div className="py-2">
              <Link href="/warehouse-staff/profile" onClick={() => { setIsProfileDropdownOpen(false); onMobileClose?.(); }} className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-[#E4002B] hover:translate-x-1 rounded-xl transition-all">Hồ Sơ Của Tôi</Link>
            </div>
            <div className="h-px bg-gray-50 my-1" />
            <button onClick={() => { logout(); onMobileClose?.(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:translate-x-1 rounded-xl transition-all text-left">Đăng Xuất</button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default WarehouseStaffSidebar;