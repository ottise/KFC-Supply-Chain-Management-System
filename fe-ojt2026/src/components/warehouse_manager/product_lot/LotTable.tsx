"use client";
import React from 'react';
import { ProductLot } from '@/types/warehouse/productLot';
import { productsApi } from '@/lib/api/warehouse/productsApi';
import { LotPagination } from './LotPagination';

const unitCache: Record<number, string> = {};

const UnitLabel = ({ productId }: { productId: number | null }) => {
    const [unit, setUnit] = React.useState<string>(productId && unitCache[productId] ? unitCache[productId] : "ĐVT");

    React.useEffect(() => {
        if (!productId) return;
        if (unitCache[productId]) {
            setUnit(unitCache[productId]);
            return;
        }
        let isMounted = true;
        productsApi.getProductById(productId)
            .then((product) => {
                if (isMounted && product?.BaseUomName) {
                    unitCache[productId] = product.BaseUomName;
                    setUnit(product.BaseUomName);
                }
            })
            .catch((err) => console.error(err));
        return () => { isMounted = false; };
    }, [productId]);

    return <>{unit}</>;
};

interface LotTableProps {
    data: ProductLot[];
    total: number;
    currentPage: number;      // Thêm
    totalPages: number;       // Thêm
    onPageChange: (page: number) => void;  // Thêm
    onRowClick: (lot: ProductLot) => void;
}

export const LotTable = ({ data, total, currentPage, totalPages, onPageChange, onRowClick }: LotTableProps) => {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md shadow-sm">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                        <th className="px-6 py-5 text-left border-b border-gray-100">Số Lô</th>
                        <th className="px-6 py-5 text-left border-b border-gray-100">Sản Phẩm</th>
                        <th className="px-6 py-5 text-center border-b border-gray-100">Số Lượng</th>
                        <th className="px-6 py-5 text-right border-b border-gray-100">Ngày Hết Hạn</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((lot) => (
                        <tr
                            key={lot.Id}
                            onClick={() => onRowClick(lot)}
                            className="hover:bg-gray-50/80 transition-all group cursor-pointer"
                        >
                            <td className="px-6 py-4">
                                <span className="text-xs font-black text-gray-900 tracking-tight group-hover:text-[#E4002B] transition-colors">
                                    {lot.LotNumber}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-xs font-bold text-gray-900">
                                    {lot.ProductName || `Product ID: ${lot.ProductId}`}
                                </p>
                            </td>
                            <td className="px-6 py-4 text-center">
                                {/* Hiển thị tổng số lượng kèm đơn vị */}
                                <span className="inline-flex items-center gap-1">
                                    <span className={`text-xs font-black ${(lot.Locations || []).reduce((acc, loc) => acc + loc.Quantity, 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {(lot.Locations || []).reduce((acc, loc) => acc + loc.Quantity, 0).toLocaleString('vi-VN')}
                                    </span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">
                                        <UnitLabel productId={lot.ProductId} />
                                    </span>
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className="text-xs font-semibold text-gray-500">
                                    {new Date(lot.ExpirationDate).toLocaleDateString("vi-VN")}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <LotPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                pageSize={10}
                onPageChange={onPageChange}
            />
        </div>
    );
};