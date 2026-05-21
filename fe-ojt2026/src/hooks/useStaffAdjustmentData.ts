/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { inventoryAdjustmentApi } from "@/lib/api/warehouse/inventoryAdjustmentApi";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import { productLotsApi } from "@/lib/api/warehouse/productLotsApi";
import { useLocations } from "@/hooks/useLocations";
import { Warehouse } from "@/types/warehouse/warehouse";
import { Location } from "@/types/warehouse/locations";
import { StaffWorkItem } from "@/types/warehouse/inventoryAdjustment";

export interface UseStaffAdjustmentDataResult {
    adjustments: StaffWorkItem[];
    setAdjustments: (items: StaffWorkItem[]) => void;
    loading: boolean;
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedWarehouse: number | null;
    setSelectedWarehouse: (id: number | null) => void;
    selectedLocation: number | null;
    setSelectedLocation: (id: number | null) => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    warehouses: Warehouse[];
    allLocations: Location[];
    filteredAdjustments: StaffWorkItem[];
    refreshAdjustments: () => Promise<void>;
    staticDataLoaded: boolean;
}

export function useStaffAdjustmentData(): UseStaffAdjustmentDataResult {
    const [adjustments, setAdjustments] = useState<StaffWorkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [lots, setLots] = useState<any[]>([]);
    const [staticDataLoaded, setStaticDataLoaded] = useState(false);

    // Lấy locations theo managerId (hoặc userId nếu managerId là null)
    const { locations: allLocations, loading: locationsLoading } = useLocations({
        isActive: undefined, // Lấy cả active lẫn inactive để hiển thị đầy đủ
        fetchAll: true,
    });

    const fetchStaticData = useCallback(async () => {
        try {
            const [whData, prodData, lotData] = await Promise.all([
                warehouseApi.getWarehouses(),
                productsApi.getProducts({ pageSize: 1000 }),
                productLotsApi.getAllLots()
            ]);
            setWarehouses(whData || []);
            setProducts(prodData?.Items || []);
            setLots(lotData || []);
            setStaticDataLoaded(true);
        } catch (error) {
            console.error("Failed to fetch static data for staff:", error);
        }
    }, []);

    const fetchAdjustments = useCallback(async () => {
        if (!staticDataLoaded) return;
        setLoading(true);
        try {
            const result = await inventoryAdjustmentApi.getStaffWork();
            const prodMap = new Map(products.map((p: any) => [p.Id || p.id, p.Name || p.name]));
            const lotMap = new Map(lots.map((l: any) => [l.Id || l.id, l.LotNumber || l.lotNumber]));
            const locMap = new Map(allLocations.map((l: any) => [l.Id || l.id, l.Name || l.name]));

            const enriched = result.map(item => ({
                ...item,
                ProductName: prodMap.get(item.ProductId) || `SP #${item.ProductId}`,
                LotNumber: item.LotId ? (lotMap.get(item.LotId) || `Lot #${item.LotId}`) : "N/A",
                LocationName: locMap.get(item.LocationId) || `Loc #${item.LocationId}`
            }));

            setAdjustments(enriched as any);
        } catch (error) {
            console.error("Failed to fetch staff work:", error);
        } finally {
            setLoading(false);
        }
    }, [allLocations, lots, products, staticDataLoaded]);

    useEffect(() => {
        if (!locationsLoading) {
            fetchStaticData();
        }
         
    }, [fetchStaticData, locationsLoading]);

    useEffect(() => {
        if (staticDataLoaded) {
            fetchAdjustments();
        }
    }, [fetchAdjustments, staticDataLoaded]);

    useEffect(() => {
        if (!staticDataLoaded) return;

        // Keep "Hiện có" in sync when inventory changes elsewhere (e.g. outbound flow).
        const interval = window.setInterval(() => {
            fetchAdjustments();
        }, 15000);

        const handleVisibilityOrFocus = () => {
            if (document.visibilityState === "visible") {
                fetchAdjustments();
            }
        };

        window.addEventListener("focus", handleVisibilityOrFocus);
        document.addEventListener("visibilitychange", handleVisibilityOrFocus);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener("focus", handleVisibilityOrFocus);
            document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
        };
    }, [fetchAdjustments, staticDataLoaded]);

    const filteredAdjustments = useMemo(() => {
        return adjustments.filter(item => {
            const matchesSearch =
                item.TranId.toString().includes(searchTerm) ||
                item.ProductId.toString().includes(searchTerm) ||
                (item as any).ProductName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item as any).LotNumber?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesWarehouse = !selectedWarehouse || item.WarehouseId === selectedWarehouse;
            const matchesLocation = !selectedLocation || item.LocationId === selectedLocation;
            const matchesStatus = !selectedStatus || item.Status === selectedStatus;

            return matchesSearch && matchesWarehouse && matchesLocation && matchesStatus;
        });
    }, [adjustments, searchTerm, selectedWarehouse, selectedLocation, selectedStatus]);

    const relevantWarehouses = useMemo(() => {
        const ids = new Set(adjustments.map(a => a.WarehouseId));
        return warehouses.filter(w => ids.has(w.Id));
    }, [warehouses, adjustments]);

    const availableLocations = useMemo(() => {
        // Only show locations that have been assigned to this staff for inventory checking
        const assignedLocationIds = new Set(adjustments.map(a => a.LocationId));
        const assignedLocations = allLocations.filter(l => assignedLocationIds.has(l.Id));
        if (!selectedWarehouse) return assignedLocations;
        return assignedLocations.filter(l => l.WarehouseId === selectedWarehouse);
    }, [allLocations, selectedWarehouse, adjustments]);

    return {
        adjustments,
        setAdjustments,
        loading,
        searchTerm,
        setSearchTerm,
        selectedWarehouse,
        setSelectedWarehouse,
        selectedLocation,
        setSelectedLocation,
        selectedStatus,
        setSelectedStatus,
        warehouses: relevantWarehouses,
        allLocations: availableLocations,
        filteredAdjustments,
        refreshAdjustments: fetchAdjustments,
        staticDataLoaded
    };
}
