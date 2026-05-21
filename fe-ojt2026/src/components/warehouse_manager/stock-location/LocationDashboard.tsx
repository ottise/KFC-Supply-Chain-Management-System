"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { locationsApi } from "@/lib/api/warehouse/locationsApi";
import LocationTable from "./LocationTable";
import LocationPagination from "./LocationPagination";
import LocationFilter from "./LocationFilter";
import LocationDetailBox from "./LocationDetailBox";
import LocationCreateForm from "./LocationCreateForm";
import type { Location, CreateLocationRequest } from "@/types/warehouse/locations";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  onTotalUpdate?: (total: number) => void;
}

export default function LocationDashboard({ onTotalUpdate }: Props) {
  const { user } = useAuth();
  const locationManagerId = (user?.managerId && user.managerId !== "null") ? Number(user.managerId) : (user?.id ? Number(user.id) : undefined);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [locationMap, setLocationMap] = useState<Record<number, string>>({});
  const [allLocations, setAllLocations] = useState<Location[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseId, setWarehouseId] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(true); // Default to active only like Product

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await locationsApi.getLocations({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        search: searchTerm || undefined,
        warehouseId: warehouseId,
        isActive: isActive,
        managerId: locationManagerId,
      });
      setLocations(data.Items);
      setPagination((prev) => ({
        ...prev,
        totalItems: data.TotalItems,
        totalPages: data.TotalPages,
      }));
      onTotalUpdate?.(data.TotalItems);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message || "Lỗi khi tải danh sách vị trí");
      }
      // setError(err.message || "Lỗi khi tải danh sách vị trí");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, searchTerm, warehouseId, isActive, onTotalUpdate, locationManagerId]);

  // Fetch all locations once on mount to build name map
  useEffect(() => {
    const fetchAllLocations = async () => {
      try {
        const allLocs = await locationsApi.getAllLocations();
        setAllLocations(allLocs);
        const map: Record<number, string> = {};
        allLocs.forEach(loc => {
          map[loc.Id] = loc.Name;
        });
        setLocationMap(map);
      } catch (err) {
        console.error("Lỗi khi tải bản đồ vị trí:", err);
      }
    };
    fetchAllLocations();
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await locationsApi.deactivateLocation(id);
      } else {
        await locationsApi.activateLocation(id);
      }
      fetchLocations();
      // If the selected location was updated, either refresh it or close it
      if (selectedLocation?.Id === id) {
        // Simple approach: close detail
        setSelectedLocation(null);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message || "Lỗi cập nhật trạng thái");
      }
      // throw err; // Propagate to component if needed
    }
  };

  const handleCreateLocation = async (data: unknown) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      await locationsApi.createLocation(data as CreateLocationRequest);
      setShowCreate(false);
      fetchLocations();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message || "Lỗi khi tạo vị trí");
      }
      // setCreateError(err.message || "Lỗi khi tạo vị trí");
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <LocationFilter
        onSearch={setSearchTerm}
        onAddClick={() => setShowCreate(true)}
        onWarehouseFilter={(id) => { setWarehouseId(id); setPagination(p => ({ ...p, currentPage: 1 })); }}
        onStatusFilter={(active) => { setIsActive(active); setPagination(p => ({ ...p, currentPage: 1 })); }}
        initialStatus={isActive}
        initialWarehouseId={warehouseId}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {loading && !locations.length ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <span className="ml-3 text-sm font-bold text-gray-400">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            <LocationTable
              locations={locations}
              currentPage={pagination.currentPage}
              pageSize={pagination.pageSize}
              onRowClick={setSelectedLocation}
              onToggleStatus={handleToggleStatus}
              locationMap={locationMap}
            />

            <LocationPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {selectedLocation && (
        <LocationDetailBox
          location={selectedLocation}
          close={() => setSelectedLocation(null)}
          onUpdate={fetchLocations}
          onToggleStatus={handleToggleStatus}
          locationMap={locationMap}
        />
      )}

      <LocationCreateForm
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreateLocation}
        isLoading={isCreating}
        error={createError}
        allLocations={allLocations}
      />
    </div>
  );
}
