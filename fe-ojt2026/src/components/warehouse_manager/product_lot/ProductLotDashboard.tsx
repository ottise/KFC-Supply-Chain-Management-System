// src/components/warehouse_manager/product_lot/ProductLotDashboard.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { ProductLot } from '@/types/warehouse/productLot';
import { productLotsApi, SearchProductLotsParams } from '@/lib/api/warehouse/productLotsApi';
import { LotTable } from './LotTable';
import { LotFilter } from './LotFilter';
import { LotDetailBox } from './LotDetailBox';

import { useAuth } from '@/hooks/useAuth';

export const ProductLotDashboard = ({ onTotalUpdate }: { onTotalUpdate?: (count: number) => void }) => {
    const { user } = useAuth();
    const [lots, setLots] = useState<ProductLot[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLot, setSelectedLot] = useState<ProductLot | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [expirationFilter, setExpirationFilter] = useState("");

    const fetchLots = useCallback(async () => {
        try {
            setLoading(true);
            // Build search params dựa trên filter
            const searchParams: SearchProductLotsParams = {
                keyword: searchTerm || undefined,
                page: currentPage,
                pageSize: 10,
                managerId: user?.id ? parseInt(user.id) : undefined,
            };
            // Xử lý filter hạn sử dụng
            if (expirationFilter === "expired") {
                // Đã hết hạn = expirationDateBefore = hôm nay
                searchParams.expirationDateBefore = new Date().toISOString().split("T")[0];
            } else if (expirationFilter && expirationFilter !== "") {
                // Sắp hết hạn trong N ngày
                searchParams.expiresWithinDays = parseInt(expirationFilter);
            }
            const data = await productLotsApi.searchLots(searchParams);
            setLots(data.Items || []);
            setTotal(data.TotalItems || 0);
            setTotalPages(data.TotalPages || 0);
            if (onTotalUpdate) onTotalUpdate(data.TotalItems || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, currentPage, expirationFilter, onTotalUpdate, user?.id]);

    const handleSearch = useCallback(() => {
        setCurrentPage(1);  // Reset về trang 1 khi search
        fetchLots();
    }, [fetchLots]);

    useEffect(() => {
        const delay = setTimeout(fetchLots, 500);
        return () => clearTimeout(delay);
    }, [fetchLots]);

    return (
        <div className="w-full space-y-6">
            <LotFilter
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={handleSearch}
                expirationFilter={expirationFilter}
                setExpirationFilter={setExpirationFilter}
            />
            {loading ? (
                <div className="p-20 text-center font-bold text-gray-400">Đang tải...</div>
            ) : (
                <LotTable data={lots}
                    total={total}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    onRowClick={(lot) => setSelectedLot(lot)} />
            )}

            <LotDetailBox lot={selectedLot} onClose={() => setSelectedLot(null)} onUpdate={fetchLots} />
        </div>
    );
};
