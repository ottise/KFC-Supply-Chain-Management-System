"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/admin/AdminNavbar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import DashboardCard from '@/components/admin/DashboardCard';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useSidebarContext } from '@/lib/contexts/SidebarContext';

const getTimeAgo = (dateString: string | undefined | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `Vừa xong`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  const years = Math.floor(days / 365);
  return `${years} năm trước`;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { isCollapsed } = useSidebarContext();

  const { stats, recentUsers, isLoading } = useAdminDashboard();

  const getRoleBadge = (roleName: string) => {
    const isManager = roleName?.toLowerCase().includes('manager') || roleName?.toLowerCase().includes('quản lý');
    const isAdmin = roleName?.toLowerCase().includes('admin');
    
    if (isAdmin) return <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-purple-200">Admin</span>;
    if (isManager) return <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-blue-200">Manager</span>;
    return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-200">Staff</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      <AdminNavbar />

      <div className="flex">
        <AdminSidebar activePage="dashboard" />

        <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
          <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#1F2937] uppercase tracking-tight flex items-center gap-3 font-sans">
                TỔNG QUAN <span className="text-[#E4002B]">HỆ THỐNG</span>
                {isLoading && (
                  <svg className="w-5 h-5 animate-spin text-[#E4002B]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V12a4 4 0 012 2h4a2 2 0 002 2h-4a2 2 0 016 2h-4"></path>
                  </svg>
                )}
              </h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full shrink-0"></span>
                Theo dõi tình trạng nhân sự và tài khoản trên toàn hệ thống
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => router.push('/admin/manage_account')}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all uppercase tracking-wide flex items-center gap-2"
              >
                Quản Lý Tài Khoản
              </button>
              <button 
                onClick={() => router.push('/admin/staff_assignment')}
                className="px-5 py-2.5 bg-[#E4002B] text-white border border-transparent text-xs font-bold rounded-xl shadow-md shadow-red-200/50 hover:bg-[#B8001F] transition-all uppercase tracking-wide flex items-center gap-2"
              >
                Phân Công
              </button>
            </div>
          </div>

          {/* MÔ HÌNH 'HERO METRIC': 1 Lớn (Bên trái) + 4 Nhỏ (Lưới 2x2 Bên phải) */}
          <div className="flex flex-col lg:flex-row items-stretch gap-4 md:gap-6">
            
            {/* THẺ HERO: Tổng Tài Khoản */}
            <div className="w-full lg:w-1/3 shrink-0 relative">
              <DashboardCard
                title="Tổng Tài Khoản"
                value={isLoading ? '-' : stats.totalAccounts}
                color="blue"
                isHero={true}
                className="h-full w-full min-h-[160px] flex flex-col justify-center relative overflow-hidden"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
            </div>

            {/* SECTION 2x2: 4 Thẻ Bổ Trợ */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <DashboardCard
                title="Đang Hoạt Động"
                value={isLoading ? '-' : stats.verifiedUsers}
                color="green"
                icon={
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />

              <DashboardCard
                title="Chưa Phân Công"
                value={isLoading ? '-' : stats.unassignedUsers}
                color="gray"
                icon={
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />

              <DashboardCard
                title="Chưa Xác Thực Email"
                value={isLoading ? '-' : stats.unverifiedUsers}
                color="gray"
                icon={
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <DashboardCard
                title="Tài Khoản Bị Khóa"
                value={isLoading ? '-' : stats.disabledUsers}
                color={stats.disabledUsers > (stats.verifiedUsers * 0.1) ? 'red' : 'gray'}
                icon={
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* Two Column Layout underneath */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Recent Activity List (takes up 2 cols) */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col h-[600px]">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <span className="w-2 h-6 bg-[#E4002B] rounded-full"></span>
                  Tài Khoản Mới Tạo Gần Đây
                </h2>
                <button 
                  onClick={() => router.push('/admin/manage_account')}
                  className="text-xs font-bold text-gray-500 hover:text-[#E4002B] uppercase tracking-wider transition-colors"
                >
                  Xem Tất Cả
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentUsers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm font-bold">Chưa có tài khoản nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentUsers.map((user) => (
                      <div
                        key={user.Id}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-red-100 hover:shadow-md hover:shadow-red-50 transition-all group cursor-default"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {user.Fullname || user.Username}
                          </p>
                          <p className="text-xs text-gray-500 font-medium truncate flex items-center gap-1.5 mt-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {user.Email}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          {getRoleBadge(typeof user.Role === 'string' ? user.Role : (user.Role?.Name || 'N/A'))}
                          {user.CreatedAt ? (
                            <div className="flex flex-col items-end mt-0.5">
                              <span className="text-xs font-bold text-gray-700">
                                {getTimeAgo(user.CreatedAt)}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(user.CreatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(user.CreatedAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] italic text-gray-400 mt-1 uppercase tracking-wide">Không rõ thời gian</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Quick Actions & Tools */}
            <div className="lg:col-span-1 flex flex-col gap-6 h-full">
              
              {/* Add Account Card */}
              <div className="bg-gradient-to-br from-[#E4002B] to-[#B8001F] rounded-[2rem] p-6 text-white shadow-lg shadow-red-200 transition-transform hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform translate-x-4 -translate-y-4 group-hover:scale-110 duration-500">
                  <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tight mb-2">Mở Rộng Đội Ngũ</h2>
                  <p className="text-sm text-red-100 font-medium mb-6">
                    Mời thêm Ban quản lý, Nhân viên mới vào hệ thống chuỗi cung ứng ngay hôm nay.
                  </p>
                  <button
                    onClick={() => router.push('/admin/manage_account?action=create')}
                    className="w-full py-3 bg-white text-[#E4002B] font-black uppercase tracking-wide text-xs rounded-xl shadow-md hover:bg-red-50 transition-colors"
                  >
                    + Tạo Tài Khoản Mới
                  </button>
                </div>
              </div>

              {/* Maintenance Tools container */}
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Công Cụ Quản Trị
                  </h2>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Quản lý và giám sát các hoạt động hệ thống chuỗi cung ứng.
                  </p>
                </div>

                <div className="space-y-3 mt-2">
                  <button
                    onClick={() => router.push('/admin/maintenance')}
                    className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 text-gray-700 font-bold uppercase tracking-wide text-xs rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-colors flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                        <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span>Xem Lịch Trình Bảo Trì</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => router.push('/admin/staff_assignment')}
                    className="w-full py-3.5 px-4 bg-gray-50 border border-gray-200 text-gray-700 font-bold uppercase tracking-wide text-xs rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-colors flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                        <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span>Phân Công Nhân Viên</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
