"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import MoveDetailView from './MoveDetailView';
import ReportingPagination from './ReportingPagination';
import { stockDocumentsApi } from '@/lib/api/warehouse/stockDocumentsApi';
import type { PagedStockDocumentResult } from '@/types/warehouse/stockDocuments';

import { useAuth } from '@/hooks/useAuth';
import { warehouseApi } from '@/lib/api/warehouse/warehouseApi';
import { Warehouse, Location } from '@/types/warehouse/warehouse';
import OdooDropdown from '@/components/common/OdooDropdown';

export default function MoveHistoryReport() {
  const { user } = useAuth();
  const [selectedMoveId, setSelectedMoveId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<PagedStockDocumentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filter State
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);

  const fetchStaticData = async () => {
    setLoadingFilters(true);
    try {
      const [whData, locData] = await Promise.all([
        warehouseApi.getWarehousesForCurrentUser(),
        warehouseApi.getLocations({ ManagerId: user?.managerId || user?.id || "" })
      ]);
      setWarehouses(whData || []);
      setAllLocations(locData?.Items || locData?.items || locData || []);
    } catch (error) {
      console.error("Failed to fetch static data for move history:", error);
      setWarehouses([]);
      setAllLocations([]);
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const effectiveWarehouseId = selectedWarehouse ?? (warehouses.length === 1 ? warehouses[0].Id : undefined);

      const result = await stockDocumentsApi.getStockDocuments({
        page,
        pageSize,
        search: searchTerm?.trim() || undefined,
        managerId: Number(user?.managerId || user?.id) || undefined,
        warehouseId: effectiveWarehouseId,
        locationId: selectedLocation ?? undefined,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to fetch stock documents:", error);
      setData({
        Items: [],
        Page: page,
        PageSize: pageSize,
        TotalItems: 0,
        TotalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchStaticData();
  }, [user?.id, user?.managerId]);

  useEffect(() => {
    if (!user || loadingFilters) return;
    fetchHistory();
  }, [user, loadingFilters, page, searchTerm, selectedWarehouse, selectedLocation]);

  if (selectedMoveId !== null) {
    return <MoveDetailView moveId={selectedMoveId} onBack={() => setSelectedMoveId(null)} />;
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const warehouseOptions = warehouses.map((wh) => ({
    Id: wh.Id,
    DisplayValue: wh.Name,
    SecondaryValue: wh.WarehouseCode || '',
  }));

  const locationOptions = allLocations
    .filter((loc) => selectedWarehouse && loc.WarehouseId === selectedWarehouse)
    .map((loc) => ({
      Id: loc.Id,
      DisplayValue: loc.Name,
      SecondaryValue: loc.Code || '',
      WarehouseId: loc.WarehouseId,
    }));

  const selectedWarehouseOption = selectedWarehouse
    ? warehouseOptions.find((x) => x.Id === selectedWarehouse) || null
    : null;

  const selectedLocationOption = selectedLocation
    ? locationOptions.find((x) => x.Id === selectedLocation) || null
    : null;

  const parseApiDate = (dateStr?: string | null) => {
    if (!dateStr) return null;

    const raw = String(dateStr).trim().replace(' ', 'T');
    const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw);
    const normalized = hasTimezone ? raw : `${raw}Z`;

    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDateTime = (dateStr?: string | null) => {
    const d = parseApiDate(dateStr);
    if (!d) return '---';

    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDisplayLocation = (locationId: number | null, locationName: string | null) => {
    if (!locationId) return locationName || '---';
    const loc = allLocations.find(l => l.Id === locationId);
    if (!loc) return locationName || '---';
    const wh = warehouses.find(w => w.Id === loc.WarehouseId);
    if (!wh) return locationName || '---';
    return `${loc.Name}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Search Bar - Phong cách KFC hiện đại */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Tìm theo mã đơn (ADJ-...), loại phiếu hoặc trạng thái..." 
            className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center gap-3">
          <OdooDropdown
            items={warehouseOptions}
            value={selectedWarehouseOption}
            onChange={(item) => {
              setSelectedWarehouse(item?.Id ?? null);
              setSelectedLocation(null);
              setPage(1);
            }}
            displayField="DisplayValue"
            secondaryField="SecondaryValue"
            placeholder="Tất cả kho"
            className="w-[280px]"
            loading={loadingFilters}
            portal
            showClearButton={false}
            showSearch={false}
          />

          <OdooDropdown
            items={locationOptions}
            value={selectedLocationOption}
            onChange={(item) => {
              if (!selectedWarehouse) return;
              setSelectedLocation(item?.Id ?? null);
              setPage(1);
            }}
            displayField="DisplayValue"
            secondaryField="SecondaryValue"
            placeholder={selectedWarehouse ? "Tất cả vị trí" : "Chọn kho trước"}
            className="w-[280px]"
            disabled={!selectedWarehouse || loadingFilters}
            loading={loadingFilters && !!selectedWarehouse}
            portal
            showClearButton={false}
          />


        </div>

        <button
          onClick={() => {
            setSearchTerm("");
            setSelectedWarehouse(null);
            setSelectedLocation(null);
            setPage(1);
          }}
          className="text-[11px] font-bold text-gray-500 hover:text-[#E4002B] transition-all flex items-center gap-2 group uppercase tracking-[0.08em] subpixel-antialiased shrink-0 bg-gray-50 hover:bg-red-50 px-5 h-14 rounded-full border border-transparent hover:border-red-100/50 justify-center disabled:opacity-50 disabled:cursor-default disabled:hover:text-gray-500 disabled:hover:bg-gray-50 disabled:hover:border-transparent"
          disabled={!searchTerm && !selectedWarehouse && !selectedLocation}
        >
          <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-all duration-700" />
          Đặt lại
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-5">Ngày tạo</th>
              <th className="px-6 py-5">Tham chiếu</th>
              <th className="px-6 py-5">Loại phiếu</th>
              <th className="px-6 py-5">Từ</th>
              <th className="px-6 py-5">Đến</th>
              <th className="px-6 py-5">Người tạo</th>
              <th className="px-6 py-5 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-600">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#E4002B] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : data && data.Items.length > 0 ? (
              data.Items.map((move) => (
                <tr key={move.Id} className="hover:bg-red-50/20 transition-colors group">
                  <td className="px-6 py-4 text-gray-400 font-bold">
                    {formatDateTime(move.CreatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedMoveId(move.Id)}
                      className="font-black text-blue-600 hover:text-blue-800 hover:underline transition-all"
                    >
                      {move.DocumentNo}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-black text-gray-900 uppercase tracking-tight">{move.DocumentType}</td>
                  <td className="px-6 py-4 text-gray-500">{getDisplayLocation(move.FromLocationId, move.FromLocationName)}</td>
                  <td className="px-6 py-4 text-gray-500">{getDisplayLocation(move.ToLocationId, move.ToLocationName)}</td>
                  <td className="px-6 py-4 text-gray-600 font-semibold">
                    {move.CreatedByName || (move.CreatedById ? `ID ${move.CreatedById}` : '---')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border ${
                      move.Status === 'Completed' || move.Status === 'Done' 
                        ? 'bg-green-100 text-green-600 border-green-200' 
                        : 'bg-yellow-100 text-yellow-600 border-yellow-200'
                    }`}>
                      {move.Status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Không tìm thấy dữ liệu phù hợp</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {data && data.TotalPages !== undefined && data.TotalPages > 1 && (
          <ReportingPagination
            currentPage={page}
            totalPages={data.TotalPages}
            totalItems={data.TotalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="bản ghi"
          />
        )}
      </div>
    </div>
  );
}