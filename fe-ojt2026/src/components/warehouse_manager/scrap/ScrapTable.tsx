"use client";

import type { ScrapOrderListItem, ScrapStatus } from '@/types/warehouse/scrap';

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: 'Nháp', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  ready: { label: 'Sẵn sàng', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  done: { label: 'Hoàn tất', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  cancelled: { label: 'Đã hủy', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
};

function StatusBadge({ status }: { status?: ScrapStatus | string }) {
  // Handle casing if backend returns PascalCase status, but keep map consistent
  const s = typeof status === 'string' ? status.toLowerCase() : 'draft';
  const config = STATUS_MAP[s] || STATUS_MAP.draft;
  return (
    <span className={`inline-block px-3 py-1 text-[9px] font-black uppercase rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
}

function parseApiDate(dateStr?: string) {
  if (!dateStr) return null;

  const raw = dateStr.trim().replace(' ', 'T');
  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}Z`;

  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(dateStr?: string) {
  const d = parseApiDate(dateStr);
  if (!d) return '—';

  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

interface Props {
  scraps: ScrapOrderListItem[];
  onSelect: (s: ScrapOrderListItem) => void;
}

export default function ScrapTable({ scraps, onSelect }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-[20%] px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50 border-b border-gray-100">Mã đơn</th>
            <th className="w-[38%] px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50 border-b border-gray-100">Vị trí nguồn</th>
            <th className="w-[20%] px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50 border-b border-gray-100">Người tạo</th>
            <th className="w-[12%] px-4 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50 border-b border-gray-100 text-center">Ngày tạo</th>
            <th className="w-[10%] px-4 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50 border-b border-gray-100 text-center">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-600">
          {scraps.length > 0 ? (
            scraps.map((s) => (
              <tr key={s.Id} onClick={() => onSelect(s)} className="group hover:bg-red-50/20 cursor-pointer transition-colors">
                <td className="px-6 py-4">
                  <span className="text-[13px] font-black text-gray-900 tracking-tight group-hover:text-[#E4002B] transition-colors truncate block">{s.ScrapNo}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex max-w-full px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase truncate">
                    {s.LocationName || `Vị trí #${s.LocationId}`}
                  </span>
                </td>
                <td className="px-6 py-4 text-[11px] font-bold text-gray-600 truncate">{s.CreatedByName || '—'}</td>
                <td className="px-4 py-4 text-[10px] font-bold text-gray-500 tabular-nums text-center">{formatDate(s.CreatedAt)}</td>
                <td className="px-4 py-4 text-center">
                  <StatusBadge status={s.Status} />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-20 text-center">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Không tìm thấy dữ liệu phù hợp</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}