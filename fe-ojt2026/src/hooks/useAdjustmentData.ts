/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from "react";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import { productLotsApi } from "@/lib/api/warehouse/productLotsApi";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { userApi } from "@/lib/api/userApi";
import { inventoryAdjustmentApi } from "@/lib/api/warehouse/inventoryAdjustmentApi";
import { useLocations } from "@/hooks/useLocations";
import { EnrichedInventoryItem, UseAdjustmentDataResult } from "@/types/warehouse/inventoryAdjustment";
import { Warehouse } from "@/types/warehouse/warehouse";
import { User } from "@/types/user";

export function useAdjustmentData(): UseAdjustmentDataResult {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<EnrichedInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Static Data State
  const [products, setProducts] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [staticDataLoaded, setStaticDataLoaded] = useState(false);

  // Lấy locations theo managerId (hoặc userId nếu managerId là null)
  const { locations: allLocations, loading: locationsLoading } = useLocations({
    isActive: undefined, // Lấy cả active lẫn inactive cho mục đích hiển thị
    fetchAll: true,
  });

  // Filter State
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const rowsPerPage = 10;

  const getEndOfMonth = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return end.toISOString().split('T')[0];
  };

  const fetchStaticData = async () => {
    try {
      const [prodData, lotData, whData, empData] = await Promise.all([
        productsApi.getProducts({ pageSize: 1000 }),
        productLotsApi.getAllLots(),
        warehouseApi.getWarehousesForCurrentUser(),
        userApi.getEmployees()
      ]);

      setProducts(prodData?.Items || []);
      setLots(lotData || []);
      setWarehouses(whData || []);
      setEmployees(empData || []);
      setStaticDataLoaded(true);
    } catch (error) {
      console.error("Failed to fetch static data:", error);
    }
  };

  const fetchItems = async () => {
    if (!staticDataLoaded) return;

    setLoading(true);
    try {
      const invData = await inventoryAdjustmentApi.getManagerInventories({
        warehouseId: selectedWarehouse || undefined
      });

      const prodMap = new Map(products.map((p: any) => [p.Id || p.id, p.Name || p.name]));
      const lotMap = new Map(lots.map((l: any) => [l.Id || l.id, l.LotNumber || l.lotNumber]));
      const locMap = new Map(allLocations.map((l: any) => [l.Id || l.id, l]));
      const empMap = new Map(employees.map((e: any) => [e.Id || e.id, e.Fullname || e.fullname]));

      const enriched: EnrichedInventoryItem[] = invData.map((item: any) => {
        const locationId = Number(item.LocationId || item.locationId);
        const warehouseId = Number(item.WarehouseId || item.warehouseId);
        const matchingLoc = locMap.get(locationId) || { Name: "N/A" };
        const assigneeId = item.AssigneeId || item.assigneeId;
        const assignedUserName = assigneeId ? empMap.get(Number(assigneeId)) : "Chưa phân công";

        return {
          Id: Number(item.InventoryId || item.inventoryId),
          ProductId: Number(item.ProductId || item.productId),
          ProductName: prodMap.get(Number(item.ProductId || item.productId)) || `SP #${item.ProductId || item.productId}`,
          Quantity: Number(item.SystemQty || item.systemQty || 0),
          ReservedQuantity: Number(item.ReservedQty || item.reservedQty || 0),
          LotId: item.LotId || item.lotId ? Number(item.LotId || item.lotId) : null,
          LotNumber: (item.LotId || item.lotId) ? (lotMap.get(Number(item.LotId || item.lotId)) || `Lot #${item.LotId || item.lotId}`) : "N/A",
          Location: {
            Id: locationId,
            Name: matchingLoc.Name || matchingLoc.name || "N/A",
            WarehouseId: warehouseId
          },
          CountedQty: item.CountQty !== null && item.CountQty !== undefined ? item.CountQty : "",
          TransactionId: item.TranId || item.tranId,
          AssigneeId: assigneeId || undefined,
          AssignedUser: assignedUserName || (assigneeId ? "Người dùng #" + assigneeId : "Chưa phân công"),
          ScheduledDate: item.PlanDate ? item.PlanDate.split('T')[0] : (item.planDate ? item.planDate.split('T')[0] : getEndOfMonth()),
          Status: item.Status || item.status
        };
      });

      setItems(enriched);
    } catch (error) {
      console.error("Failed to fetch inventories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!locationsLoading) {
      fetchStaticData();
    }
   
  }, [locationsLoading]);

  useEffect(() => {
    if (staticDataLoaded) {
      fetchItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWarehouse, staticDataLoaded]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.ProductName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Location.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.LotNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesWarehouse = !selectedWarehouse || item.Location.WarehouseId === selectedWarehouse;
      const matchesLocation = !selectedLocation || item.Location.Id === selectedLocation;
      const matchesStatus = !selectedStatus || item.Status === selectedStatus;

      return matchesSearch && matchesWarehouse && matchesLocation && matchesStatus;
    });
  }, [items, searchTerm, selectedWarehouse, selectedLocation, selectedStatus]);

  const availableLocations = useMemo(() => {
    if (!selectedWarehouse) return allLocations;
    return allLocations.filter(l => l.WarehouseId === selectedWarehouse);
  }, [allLocations, selectedWarehouse]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);

  return {
    items,
    setItems,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    loading,
    warehouses,
    allLocations: availableLocations,
    employees,
    selectedWarehouse,
    setSelectedWarehouse,
    selectedLocation,
    setSelectedLocation,
    selectedStatus,
    setSelectedStatus,
    filteredItems,
    paginatedItems,
    totalPages,
    refreshItems: fetchItems
  };
}
