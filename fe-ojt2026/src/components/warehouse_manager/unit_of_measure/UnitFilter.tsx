"use client";
import React, { useState } from 'react';
import { Uom } from '@/lib/api/warehouse/UomApi';

interface Props {
  units: Uom[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const UnitFilter: React.FC<Props> = ({ units, activeCategory, onCategoryChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const categories = ["All", ...Array.from(new Set(units.map(u => u.Category)))];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between min-w-[200px] px-5 h-14 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 hover:bg-white hover:border-red-100/30 transition-all ${isOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
      >
        <span className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm"></span>
          {activeCategory === "All" ? "Tất cả danh mục" : activeCategory}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#E4002B]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 mt-2 w-full bg-white rounded-[1.2rem] shadow-lg border border-gray-100 p-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-200 origin-top overflow-hidden">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onCategoryChange(cat);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left transition-colors ${
                  activeCategory === cat ? "bg-red-50 text-[#E4002B]" : "text-gray-500 hover:bg-red-50/60 hover:text-[#E4002B]"
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${activeCategory === cat ? "bg-[#E4002B]" : "bg-gray-300"}`}></div>
                {cat === "All" ? "Tất cả" : cat}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UnitFilter;