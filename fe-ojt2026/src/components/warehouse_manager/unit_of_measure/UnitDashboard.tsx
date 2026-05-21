"use client";
import React, { useState, useEffect } from 'react';
import UnitTable from './UnitTable';
import UnitCreateForm from './UnitCreateForm';
import UnitDetail from './UnitDetailUpdate';
import UnitFilter from './UnitFilter';
import { Plus } from 'lucide-react';
import UnitPagination from './UnitPagination';
import { uomService, Uom } from '@/lib/api/warehouse/UomApi';

const UnitDashboard = () => {
  const [units, setUnits] = useState<Uom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // LOGIC PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Bạn có thể chỉnh số dòng hiển thị tại đây

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Uom | null>(null);

  const fetchUnits = async () => {
    try {
      setIsLoading(true);
      const data = await uomService.getAll();
      setUnits(data);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUnits(); }, []);

  // Helper function để xóa dấu tiếng Việt
  const normalizeString = (str: string) =>
    str.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();

  const normalizedSearch = normalizeString(searchQuery);

  // 1. Lọc dữ liệu theo Category và Search (không phân biệt dấu)
  const filteredUnits = units.filter(u => {
    const matchesCategory = filterCategory === "All" || u.Category === filterCategory;
    const matchesSearch = normalizeString(u.Name).includes(normalizedSearch) ||
      normalizeString(u.Category).includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  });

  // 2. Tính toán phân trang dựa trên dữ liệu đã lọc
  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUnits = filteredUnits.slice(startIndex, startIndex + itemsPerPage);

  // Reset về trang 1 nếu người dùng đổi filter hoặc search
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header & Filter Section */}
      <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 flex gap-4 max-w-2xl">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm đơn vị..."
                className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
              />
            </div>

            <UnitFilter
              units={units}
              activeCategory={filterCategory}
              onCategoryChange={setFilterCategory}
            />
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-8 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center gap-2 shrink-0 justify-center"
          >
            <Plus className="w-4 h-4" />
            THÊM ĐƠN VỊ MỚI
          </button>
        </div>

        <div className="flex items-center gap-4 border-t border-gray-50 pt-4">
          <div>
            <h3 className="text-[10px] font-black text-[#E4002B] uppercase tracking-[0.2em]">Hệ thống đơn vị</h3>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {filteredUnits.length} kết quả được tìm thấy
            </p>
          </div>
        </div>
      </div>

      {/* Vùng chứa bảng và Phân trang */}
      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">

        {/* Table Area (Có scroll nếu dữ liệu trong 1 trang quá dài) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className={isLoading ? "opacity-30 pointer-events-none" : ""}>
            <UnitTable
              displayUnits={paginatedUnits}
              allUnits={units}
              onEdit={(u) => { setSelectedUnit(u); setIsDetailOpen(true); }}
            />
          </div>
        </div>

        {/* Component Phân trang của bạn */}
        <div className="shrink-0 border-t border-gray-50">
          <UnitPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUnits.length}
            pageSize={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>

      <UnitCreateForm isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={fetchUnits} />
      <UnitDetail isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} unit={selectedUnit} allUnits={units} onRefresh={fetchUnits} />
    </div>
  );
};

export default UnitDashboard;