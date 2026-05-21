/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Role } from "@/types/user";

interface HRFilterProps {
  onSearch: (val: string) => void;
  onFilterRole: (val: string) => void;
  roles?: Role[];
  selectedEmails?: string[];
}

export default function HRFilter({ onSearch, onFilterRole, roles = [], selectedEmails = [] }: HRFilterProps) {
  const handleBulkEmail = () => {
    if (selectedEmails.length === 0) return;
    const emailsStr = selectedEmails.join(',');
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailsStr}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };
  return (
    <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col gap-4 mb-8">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 flex gap-4 max-w-3xl">
          <div className="relative flex-1 group">
             <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
               <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm tên, email hoặc SĐT..."
              className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="pl-5 pr-10 h-14 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 outline-none focus:bg-white focus:border-red-100/50 focus:ring-8 focus:ring-red-50/20 transition-all cursor-pointer min-w-[200px] shadow-sm hover:bg-white hover:border-red-100/30 appearance-none"
              onChange={(e) => onFilterRole(e.target.value)}
            >
              <option value="">Tất cả chức vụ</option>
              {roles.map(role => {
                const id = role.Id || (role as any).id;
                const name = role.Name || (role as any).name;
                return (
                  <option key={id} value={name}>
                    {name}
                  </option>
                );
              })}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {selectedEmails.length > 0 && (
          <button
            onClick={handleBulkEmail}
            className="px-6 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center gap-2 shrink-0 justify-center animate-in fade-in zoom-in duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Gửi Email Hàng Loạt ({selectedEmails.length})
          </button>
        )}
      </div>
    </div>
  );
}