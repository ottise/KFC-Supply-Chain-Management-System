import { useEffect, useState } from "react";
import { StockDocumentListItem, StockDocumentDetail } from "@/types/warehouse/stockDocuments";
import { stockDocumentsApi } from "@/lib/api/warehouse/stockDocumentsApi";

interface AdjustmentDetailModalProps {
    adjustment: StockDocumentListItem | null;
    onClose: () => void;
}

export default function AdjustmentDetailModal({ adjustment, onClose }: AdjustmentDetailModalProps) {
    const [detail, setDetail] = useState<StockDocumentDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!adjustment) return;
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const data = await stockDocumentsApi.getStockDocumentById(adjustment.Id);
                setDetail(data);
            } catch (error) {
                console.error("Failed to fetch adjustment detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [adjustment?.Id]);

    if (!adjustment) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-[998] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-8">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Chi tiết: {adjustment.DocumentNo}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Kho</p>
                                <p className="text-sm font-bold text-gray-900 mt-2">{adjustment.FromLocationName || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Ngày</p>
                                <p className="text-sm font-bold text-gray-900 mt-2">
                                    {adjustment.CreatedAt ? new Date(adjustment.CreatedAt).toLocaleDateString('vi-VN') : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Bắt đầu</p>
                                <p className="text-sm font-mono font-bold text-gray-900 mt-2">
                                    {adjustment.CreatedAt ? new Date(adjustment.CreatedAt).toLocaleTimeString('vi-VN', { hour12: false }) : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Kết thúc</p>
                                <p className="text-sm font-mono font-bold text-green-600 mt-2">
                                    {adjustment.CompletedAt ? new Date(adjustment.CompletedAt).toLocaleTimeString('vi-VN', { hour12: false }) : "-"}
                                </p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <h3 className="font-black text-gray-900 mb-4">Chi tiết kiểm kê:</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="px-4 py-3 text-left font-black text-gray-400 text-xs uppercase tracking-wide">
                                                Sản phẩm
                                            </th>
                                            <th className="px-4 py-3 text-center font-black text-gray-400 text-xs uppercase tracking-wide">
                                                Hệ thống
                                            </th>
                                            <th className="px-4 py-3 text-center font-black text-gray-400 text-xs uppercase tracking-wide">
                                                Thực tế
                                            </th>
                                            <th className="px-4 py-3 text-center font-black text-gray-400 text-xs uppercase tracking-wide">
                                                Chênh lệch
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-10 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                                    Đang tải chi tiết...
                                                </td>
                                            </tr>
                                        ) : detail && detail.Items.length > 0 ? detail.Items.map((item, idx) => {
                                            const diff = item.ActualQty - item.PlannedQty;
                                            return (
                                                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-gray-900 font-medium">{item.ProductName}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{item.PlannedQty}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-gray-900">{item.ActualQty}</td>
                                                    <td
                                                        className={`px-4 py-3 text-center font-bold ${diff === 0 ? "text-green-600" : "text-red-600"
                                                            }`}
                                                    >
                                                        {diff > 0 ? "+" : ""}{diff}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-10 text-center text-gray-300 font-bold uppercase text-[10px]">
                                                    {loading ? "" : "Không có dữ liệu chi tiết"}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="w-full px-6 py-3 border border-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition-all"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
