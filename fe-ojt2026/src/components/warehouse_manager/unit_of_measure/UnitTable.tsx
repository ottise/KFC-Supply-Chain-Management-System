"use client";
import React from 'react';
import { Uom } from '@/lib/api/warehouse/UomApi';

interface Props {
  displayUnits: Uom[]; // Những đơn vị hiển thị ở trang hiện tại
  allUnits: Uom[];     // Toàn bộ đơn vị để tra cứu tên gốc
  onEdit: (unit: Uom) => void;
}

const UnitTable: React.FC<Props> = ({ displayUnits, allUnits, onEdit }) => {
  
  // Hàm này bây giờ sẽ tìm trong allUnits thay vì chỉ các đơn vị đang hiển thị
  const getBaseUnitName = (currentUnit: Uom) => {
    if (currentUnit.IsBaseUnit) return "MỐC";
    return allUnits.find(u => u.Category === currentUnit.Category && u.IsBaseUnit)?.Name || "-";
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr className="bg-gray-50/50">
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Đơn vị</th>
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Danh mục</th>
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Tỉ lệ</th>
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Quy đổi gốc</th>
            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {displayUnits.map((unit) => (
            <tr key={unit.Id} onClick={() => onEdit(unit)} className="group hover:bg-red-50/30 transition-all cursor-pointer">
              <td className="px-8 py-6 text-center font-black text-gray-900 uppercase group-hover:text-[#E4002B]">{unit.Name}</td>
              <td className="px-8 py-6 text-center">
                <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-tighter italic">{unit.Category}</span>
              </td>
              <td className="px-8 py-6 text-center font-black text-gray-900">{unit.ConversionRatio}</td>
              <td className="px-8 py-6 text-center">
                <span className={`text-[10px] font-bold uppercase ${unit.IsBaseUnit ? 'text-gray-300' : 'text-gray-400'}`}>
                  {unit.IsBaseUnit ? "Chính nó" : getBaseUnitName(unit)}
                </span>
              </td>
              <td className="px-8 py-6 text-center">
                {unit.IsBaseUnit ? (
                  <span className="text-[9px] font-black text-green-600 border border-green-200 px-2 py-1 rounded-lg uppercase bg-green-50">Gốc</span>
                ) : (
                  <span className="text-[9px] font-black text-gray-400 uppercase">Quy đổi</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UnitTable;