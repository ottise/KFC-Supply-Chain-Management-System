"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';
import { inventoryAdjustmentApi } from "@/lib/api/warehouse/inventoryAdjustmentApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import { productLotsApi } from "@/lib/api/warehouse/productLotsApi";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { Warehouse, Location } from "@/types/warehouse/warehouse";
import { useAuth } from "@/hooks/useAuth";
import OdooDropdown from '@/components/common/OdooDropdown';

type ProductRaw = {
  Id?: number;
  id?: number;
  Name?: string;
  name?: string;
  BaseUomName?: string;
  UomName?: string;
  PurchaseUomName?: string;
};

type LotRaw = {
  Id?: number;
  id?: number;
  LotNumber?: string;
  lotNumber?: string;
};

type InventoryRaw = {
  InventoryId?: number;
  inventoryId?: number;
  ProductId?: number;
  productId?: number;
  LocationId?: number;
  locationId?: number;
  LotId?: number;
  lotId?: number;
  SystemQty?: number;
  systemQty?: number;
  ReservedQty?: number;
  reservedQty?: number;
  ReservedQuantity?: number;
  reservedQuantity?: number;
};

type StockRow = {
  id: number | undefined;
  location: string;
  locationId: number | undefined;
  warehouseId: number | undefined;
  product: string;
  unit: string;
  lot: string;
  onHand: number;
  reserved: number;
};

export default function StockLocationReport() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [stockData, setStockData] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Static Data State
  const [products, setProducts] = useState<ProductRaw[]>([]);
  const [lots, setLots] = useState<LotRaw[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [staticDataLoaded, setStaticDataLoaded] = useState(false);

  // Filter State
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  const fetchStaticData = useCallback(async () => {
    try {
      const [prodData, lotData, whData, locData] = await Promise.all([
        productsApi.getProducts({ pageSize: 1000 }),
        productLotsApi.getAllLots(),
        warehouseApi.getWarehousesForCurrentUser(),
        warehouseApi.getLocations({ ManagerId: user?.id || "" })
      ]);

      setProducts(prodData?.Items || []);
      setLots(lotData || []);
      setWarehouses(whData || []);
      setAllLocations(locData?.Items || locData?.items || locData || []);
      setStaticDataLoaded(true);
    } catch (error) {
      console.error("Failed to fetch static data:", error);
    }
  }, [user?.id]);

  const fetchStockData = useCallback(async () => {
    if (!staticDataLoaded) return;
    setLoading(true);
    try {
      const invData = await inventoryAdjustmentApi.getManagerInventories({
        warehouseId: selectedWarehouse || undefined,
        locationId: selectedLocation || undefined
      });

      const prodMap = new Map(products.map((p) => [p.Id || p.id, p]));
      const whMap = new Map(warehouses.map((w) => [w.Id, w.WarehouseCode]));
      const lotMap = new Map(lots.map((l) => [l.Id || l.id, l.LotNumber || l.lotNumber]));
      const locMap = new Map(allLocations.map((l) => [l.Id, l]));

      const enriched = (invData as InventoryRaw[]).map((item) => {
        const productId = item.ProductId ?? item.productId;
        const locationId = item.LocationId ?? item.locationId;
        const lotId = item.LotId ?? item.lotId;

        const product = productId !== undefined ? prodMap.get(productId) : undefined;
        const location = locationId !== undefined ? locMap.get(locationId) : undefined;
        const warehouseId = location?.WarehouseId || location?.WarehouseId;
        const warehouseCode = warehouseId ? whMap.get(warehouseId) : null;
        const displayLocation = warehouseCode ? `${warehouseCode}-${location?.Name || location?.Name}` : (location?.Name || location?.Name || "N/A");

        return {
          id: item.InventoryId || item.inventoryId,
          location: displayLocation,
          locationId: locationId,
          warehouseId: warehouseId,
          product: product?.Name || product?.name || `SP #${productId ?? "N/A"}`,
          unit: product?.BaseUomName || product?.UomName || product?.PurchaseUomName || "đơn vị",
          lot: lotId !== undefined ? (lotMap.get(lotId) || `Lot #${lotId}`) : "---",
          onHand: item.SystemQty ?? item.systemQty ?? 0,
          reserved: item.ReservedQty ?? item.reservedQty ?? item.ReservedQuantity ?? item.reservedQuantity ?? 0
        };
      });

      setStockData(enriched);
    } catch (error) {
      console.error("Failed to fetch stock data:", error);
    } finally {
      setLoading(false);
    }
  }, [staticDataLoaded, selectedWarehouse, selectedLocation, products, warehouses, lots, allLocations]);

  useEffect(() => {
    fetchStaticData();
  }, [fetchStaticData]);

  useEffect(() => {
    if (staticDataLoaded) {
      fetchStockData();
    }
  }, [staticDataLoaded, selectedWarehouse, selectedLocation, fetchStockData]);

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

  const filteredData = useMemo(() => {
    return stockData.filter(item => {
      const searchStr = searchTerm.toLowerCase();
      return (
        item.product.toLowerCase().includes(searchStr) ||
        item.location.toLowerCase().includes(searchStr) ||
        item.lot.toLowerCase().includes(searchStr)
      );
    });
  }, [stockData, searchTerm]);

  const totalOnHand = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.onHand, 0);
  }, [filteredData]);

  const totalReserved = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.reserved, 0);
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Search Bar - đồng bộ với tab Lịch sử dịch chuyển */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm, vị trí, số lô..."
            className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <OdooDropdown
            items={warehouseOptions}
            value={selectedWarehouseOption}
            onChange={(item) => {
              setSelectedWarehouse(item?.Id ?? null);
              setSelectedLocation(null);
            }}
            displayField="DisplayValue"
            secondaryField="SecondaryValue"
            placeholder="Tất cả kho"
            className="w-[280px]"
            portal
            showClearButton={false}
            showSearch={false}
          />

          <OdooDropdown
            items={locationOptions}
            value={selectedLocationOption}
            onChange={(item) => setSelectedLocation(item?.Id ?? null)}
            displayField="DisplayValue"
            secondaryField="SecondaryValue"
            placeholder={selectedWarehouse ? "Tất cả vị trí" : "Chọn kho trước"}
            className="w-[280px]"
            disabled={!selectedWarehouse}
            portal
            showClearButton={false}
          />
        </div>

        <button
          onClick={() => {
            setSearchTerm("");
            setSelectedWarehouse(null);
            setSelectedLocation(null);
          }}
          className="text-[11px] font-bold text-gray-500 hover:text-[#E4002B] transition-all flex items-center gap-2 group uppercase tracking-[0.08em] subpixel-antialiased shrink-0 bg-gray-50 hover:bg-red-50 px-5 h-14 rounded-full border border-transparent hover:border-red-100/50 justify-center disabled:opacity-50 disabled:cursor-default disabled:hover:text-gray-500 disabled:hover:bg-gray-50 disabled:hover:border-transparent"
          disabled={!searchTerm && !selectedWarehouse && !selectedLocation}
        >
          <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-all duration-700" />
          Đặt lại
        </button>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-6 py-4">Vị trí</th>
              <th className="px-6 py-4">Sản phẩm</th>
              <th className="px-6 py-4">Số lô/sê-ri</th>
              <th className="px-6 py-4 text-right">Số lượng thực tế</th>
              <th className="px-6 py-4 text-right">Số lượng đặt trước</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#E4002B] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-red-50/30 transition-colors group text-xs font-medium text-gray-600">
                  <td className="px-6 py-3 text-gray-900">{item.location}</td>
                  <td className="px-6 py-3">
                    <span className="text-[#E4002B] font-bold group-hover:underline cursor-pointer">{item.product}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-400">{item.lot}</td>
                  <td className="px-6 py-3 font-bold text-gray-900 tabular-nums whitespace-nowrap">
                    <div className="relative w-full">
                      <span className="block text-right pr-[65px]">{Number(item.onHand ?? 0).toFixed(2)}</span>
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-right text-[10px] text-gray-400 font-normal">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-semibold text-[11px] text-gray-900 tabular-nums whitespace-nowrap">
                    <div className="relative w-full">
                      <span className="block text-right pr-[65px]">{Number(item.reserved ?? 0).toFixed(2)}</span>
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-right text-[9px] text-gray-400 font-normal">{item.unit}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Không có dữ liệu tồn kho</p>
                </td>
              </tr>
            )}
          </tbody>
          {filteredData.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 text-[11px] font-black text-gray-900 border-t border-gray-100">
                <td colSpan={3} className="px-6 py-4 text-right uppercase tracking-widest text-gray-400">Tổng cộng</td>
                <td className="px-6 py-4 text-right text-[#E4002B]">{totalOnHand.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-gray-900 tabular-nums">{totalReserved.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
