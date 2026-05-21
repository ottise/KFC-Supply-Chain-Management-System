/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { User, getUserStatusColorClass, getUserStatusText } from '@/types/user';

type Props = {
  employees: User[]
  onSelect: (emp: User) => void
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[]) => void
}

export default function HRTable({ employees, onSelect, selectedIds, onToggleSelect, onSelectAll }: Props) {
  const isAllSelected = employees.length > 0 && selectedIds.length === employees.length;

  const handleSelectAllChange = () => {
    if (isAllSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(employees.map(e => String(e.Id)));
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            <th className="px-10 py-6 w-16">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAllChange}
                className="w-4 h-4 rounded border-gray-300 text-[#E4002B] focus:ring-[#E4002B] cursor-pointer"
              />
            </th>
            <th className="px-10 py-6">Họ và Tên</th>
            <th className="px-10 py-6">Email</th>
            <th className="px-10 py-6">Số điện thoại</th>
            <th className="px-10 py-6">Vai trò</th>
            <th className="px-10 py-6">Trạng thái</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {employees.map((emp) => {
            const isSelected = selectedIds.includes(String(emp.Id));
            return (
              <tr
                key={emp.Id}
                className={`transition-all cursor-pointer group ${isSelected ? 'bg-red-50/30' : 'hover:bg-red-50/50'}`}
                onClick={() => onSelect(emp)}
              >
                <td className="px-10 py-6" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(String(emp.Id))}
                    className="w-4 h-4 rounded border-gray-300 text-[#E4002B] focus:ring-[#E4002B] cursor-pointer"
                  />
                </td>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                      {emp.Fullname ? emp.Fullname.slice(0, 2).toUpperCase() : emp.Username?.slice(0, 2).toUpperCase()}
                    </div>
                    <span className={`text-sm font-black transition-colors ${isSelected ? 'text-[#E4002B]' : 'text-gray-800'}`}>
                      {emp.Fullname || emp.Username}
                    </span>
                  </div>
                </td>

                <td className="px-10 py-6 text-xs font-bold text-blue-600 underline">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${emp.Email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-blue-800 transition-colors"
                  >
                    {emp.Email}
                  </a>
                </td>

                <td className="px-10 py-6 text-xs font-bold text-gray-600">
                  {emp.Phone || 'N/A'}
                </td>

                <td className="px-10 py-6">
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-lg uppercase tracking-widest">
                    {typeof emp.Role === 'string' ? emp.Role : (emp.Role as any)?.Name || (emp.Role as any)?.name || 'N/A'}
                  </span>
                </td>

                <td className="px-10 py-6">
                  <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-[0.1em] ${getUserStatusColorClass(emp.Status)}`}>
                    {getUserStatusText(emp.Status)}
                  </span>
                </td>
              </tr>
            );
          })}
          {employees.length === 0 && (
            <tr>
              <td colSpan={6} className="px-10 py-12 text-center text-sm font-bold text-gray-400">
                Không có dữ liệu nhân sự.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}