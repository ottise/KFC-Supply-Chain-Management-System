import React, { useEffect, useState, useCallback } from "react";
import { X, History, User, Calendar, Package, MapPin, ChevronLeft, ChevronRight, ClipboardList, Hash, Search, ChevronDown, ChevronUp } from "lucide-react";
import { stockDocumentsApi } from "@/lib/api/warehouse/stockDocumentsApi";
import { StockDocumentListItem, StockDocumentDetail } from "@/types/warehouse/stockDocuments";
import { format, addHours } from "date-fns";
import { vi } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { userApi } from "@/lib/api/admin/userApi";
import { User as UserType } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";

interface OdooSelectProps {
    label: string;
    placeholder: string;
    options: { id: number | null; name: string }[];
    value: number | null;
    onChange: (id: number | null) => void;
    icon?: React.ReactNode;
}

const OdooSelect: React.FC<OdooSelectProps> = ({ label, placeholder, options, value, onChange, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const selectedOption = options.find(o => o.id === value);
    const displayValue = selectedOption ? selectedOption.name : placeholder;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex items-center gap-3" ref={dropdownRef}>
            <div className="flex items-center gap-2">
                {icon}
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">{label}:</span>
            </div>

            <div className="relative">
                <div
                    className={`flex items-center w-48 h-9 px-4 bg-white border border-gray-100 rounded-xl shadow-sm cursor-pointer transition-all hover:border-[#E4002B]/30 ${isOpen ? 'ring-2 ring-[#E4002B]/10 border-[#E4002B]/50' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                    <span className={`text-xs font-bold truncate flex-1 ${!selectedOption ? 'text-gray-400' : 'text-gray-800'}`}>
                        {displayValue}
                    </span>
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 ml-2" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-2" />}
                </div>

                {isOpen && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white shadow-2xl rounded-2xl py-2 z-[150] border border-gray-50 animate-in fade-in zoom-in-95 duration-200 w-full overflow-hidden">
                        <div className="max-h-[250px] overflow-y-auto scrollbar-hide px-1">
                            {options.map((option, idx) => (
                                <div
                                    key={`${option.id}-${idx}`}
                                    className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer rounded-lg mx-1 ${value === option.id ? 'text-[#E4002B] bg-[#E4002B]/5' : 'text-gray-700 hover:bg-gray-50'}`}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    {option.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productName: string;
    lotId?: number | null;
    lotNumber?: string;
    locationId?: number;
    locationName?: string;
}

const StockHistoryModal: React.FC<Props> = ({
    isOpen,
    onClose,
    productId,
    productName,
    lotId,
    lotNumber,
    locationId,
    locationName
}) => {
    const [documents, setDocuments] = useState<StockDocumentListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user } = useAuth();
    const pageSize = 10;

    // Cache for document details to get PlannedQty, ActualQty, and PlannedDate
    const [detailsCache, setDetailsCache] = useState<Record<number, StockDocumentDetail>>({});

    // Filters state
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [createdByUserId, setCreatedByUserId] = useState<number | undefined>(undefined);
    const [employees, setEmployees] = useState<UserType[]>([]);
    const [dateType, setDateType] = useState<string>("completed");

    useEffect(() => {
        const fetchEmployees = async () => {
            if (!user) return;
            try {
                const data = await userApi.getEmployees();
                const rawId = user.id;
                const managerId = rawId ? Number(rawId) : null;

                console.log("StockHistoryModal - Current User ID:", managerId);

                // Get subordinates
                const subordinates = data.filter(emp => {
                    const empManagerId = emp.ManagerId ? Number(emp.ManagerId) : null;
                    return empManagerId === managerId;
                });

                // Ensure current manager is also in the list
                const managerInList = data.find(emp => Number(emp.Id) === managerId);
                const finalEmployees = [...subordinates];

                if (managerInList) {
                    if (!finalEmployees.find(e => e.Id === managerInList.Id)) {
                        finalEmployees.unshift(managerInList);
                    }
                } else if (managerId) {
                    // Create a dummy user object for the manager if not in the list
                    finalEmployees.unshift({
                        Id: managerId,
                        Fullname: user.fullname || user.username || "Manager",
                        Username: user.username || "manager",
                        Email: user.email || ""
                    } as UserType);
                }

                console.log("StockHistoryModal - Final Employees for Filter:", finalEmployees.length);
                setEmployees(finalEmployees);
            } catch (error) {
                console.error("Failed to fetch employees:", error);
            }
        };
        fetchEmployees();
    }, [user]);


    const fetchMissingDetails = useCallback(async (items: StockDocumentListItem[]) => {
        const missingIds = items
            .map(item => item.Id)
            .filter(id => !detailsCache[id]);

        if (missingIds.length === 0) return;

        try {
            const detailPromises = missingIds.map(id => stockDocumentsApi.getStockDocumentById(id));
            const details = await Promise.all(detailPromises);

            setDetailsCache(prev => {
                const next = { ...prev };
                details.forEach(d => {
                    if (d && d.Id) next[d.Id] = d;
                });
                return next;
            });
        } catch (error) {
            console.error("Failed to pre-fetch document details:", error);
        }
    }, [detailsCache]);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const result = await stockDocumentsApi.getStockDocuments({
                page,
                pageSize,
                productId,
                lotId: lotId || undefined,
                locationId: locationId || undefined,
                status: "all",
                fromDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
                toDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
                createdByUserId: createdByUserId,
                dateType: dateType
            });

            const allItems = result.Items || [];
            // Lọc cứng ở frontend vì backend có thể trả về cả PurchaseOrder
            const items = allItems.filter(item =>
                item.DocumentType?.toLowerCase() === 'adjustment'
            );

            setDocuments(items);
            setTotalPages(result.TotalPages || 1);

            setEmployees(prev => {
                const existingIds = new Set(prev.map(e => Number(e.Id)));
                const newCreators: UserType[] = [];

                items.forEach(doc => {
                    const creatorId = Number(doc.CreatedById);
                    if (creatorId && !existingIds.has(creatorId)) {
                        newCreators.push({
                            Id: creatorId,
                            Fullname: doc.CreatedByName || `User ${creatorId}`,
                            Username: doc.CreatedByName || `user${creatorId}`,
                            Email: ""
                        } as UserType);
                        existingIds.add(creatorId);
                    }
                });

                return [...prev, ...newCreators];
            });

            await fetchMissingDetails(items);
        } catch (error) {
            console.error("Failed to fetch stock history:", error);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, productId, lotId, locationId, startDate, endDate, createdByUserId, dateType, fetchMissingDetails]);

    useEffect(() => {
        if (isOpen && productId) {
            fetchHistory();
        }
    }, [isOpen, productId, lotId, locationId, page, startDate, endDate, createdByUserId, dateType, fetchHistory]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [startDate, endDate, createdByUserId, dateType]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-200">

                {/* Header (KFC Red Theme) */}
                <div className="shrink-0 bg-gradient-to-r from-[#E4002B] to-[#c70022] px-6 py-4 flex items-center justify-between text-white shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-wider">Lịch Sử Kiểm Kê</h3>
                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Theo dõi chi tiết số lượng sản phẩm</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-all group"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Info Bar */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-3 bg-red-50 rounded-lg">
                                <Package className="w-5 h-5 text-[#E4002B]" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</p>
                                <p className="text-sm font-bold text-gray-800 uppercase">{productName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Hash className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Số Lô (Lot)</p>
                                <p className="text-sm font-bold text-gray-800 uppercase">{lotNumber || "Không có lô"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-3 bg-green-50 rounded-lg">
                                <MapPin className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vị trí (Location)</p>
                                <p className="text-sm font-bold text-gray-800 truncate" title={locationName}>{locationName || "Tất cả vị trí"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="px-6 py-4 bg-white border-b border-gray-100 flex flex-wrap items-center gap-6 shrink-0 shadow-sm relative z-50">
                    <div className="flex items-center gap-3">
                        <OdooSelect
                            label="Loại ngày"
                            placeholder="Chọn loại ngày"
                            value={dateType === "completed" ? 1 : dateType === "created" ? 2 : 3}
                            onChange={(val) => {
                                if (val === 1) setDateType("completed");
                                else if (val === 2) setDateType("created");
                                else if (val === 3) setDateType("planned");
                            }}
                            icon={<History className="w-4 h-4 text-gray-400" />}
                            options={[
                                { id: 1, name: "Ngày xử lý" },
                                { id: 2, name: "Ngày tạo" },
                                { id: 3, name: "Ngày lên lịch" }
                            ]}
                        />

                        <div className="h-6 w-px bg-gray-100 hidden md:block"></div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Thời gian:</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date: Date | null) => setStartDate(date)}
                                    selectsStart
                                    startDate={startDate}
                                    endDate={endDate}
                                    placeholderText="Từ ngày"
                                    className="h-9 w-28 px-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/10 focus:border-[#E4002B]/50 hover:bg-white hover:border-gray-200 transition-all placeholder:text-gray-300"
                                    dateFormat="dd/MM/yyyy"
                                    isClearable
                                />
                            </div>
                            <span className="text-gray-300 font-bold">→</span>
                            <div className="relative group">
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date: Date | null) => setEndDate(date)}
                                    selectsEnd
                                    startDate={startDate}
                                    endDate={endDate}
                                    minDate={startDate || undefined}
                                    placeholderText="Đến ngày"
                                    className="h-9 w-28 px-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/10 focus:border-[#E4002B]/50 hover:bg-white hover:border-gray-200 transition-all placeholder:text-gray-300"
                                    dateFormat="dd/MM/yyyy"
                                    isClearable
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-gray-100 hidden md:block"></div>

                    <OdooSelect
                        label="Người tạo"
                        placeholder="Tất cả người tạo"
                        value={createdByUserId || null}
                        onChange={(id) => setCreatedByUserId(id || undefined)}
                        icon={<User className="w-4 h-4 text-gray-400" />}
                        options={[
                            { id: null, name: "Tất cả người tạo" },
                            ...employees.map(emp => ({ id: emp.Id, name: emp.Fullname || emp.Username }))
                        ]}
                    />

                    {(startDate || endDate || createdByUserId) && (
                        <button
                            onClick={() => {
                                setStartDate(null);
                                setEndDate(null);
                                setCreatedByUserId(undefined);
                                setDateType("completed");
                            }}
                            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100/50 hover:bg-red-50 text-[10px] font-black uppercase text-gray-400 hover:text-[#E4002B] transition-all border border-transparent hover:border-red-100"
                        >
                            <X className="w-3 h-3" />
                            Xóa bộ lọc
                        </button>
                    )}
                </div>

                {/* Content Table */}
                <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
                    <div className="flex-1 overflow-y-auto scrollbar-hide border border-gray-200 rounded-xl bg-gray-50/30 overflow-x-auto">
                        <table className="w-full border-collapse min-w-[1000px]">
                            <thead className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
                                <tr className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                    <th className="px-5 py-4 text-left">MÃ PHIẾU</th>
                                    <th className="px-5 py-4 text-center">NGÀY LÊN LỊCH</th>
                                    <th className="px-5 py-4 text-center">DỰ KIẾN</th>
                                    <th className="px-5 py-4 text-center">THỰC TẾ</th>
                                    <th className="px-5 py-4 text-center">CHÊNH LỆCH</th>
                                    <th className="px-5 py-4 text-center">TRẠNG THÁI</th>
                                    <th className="px-5 py-4 text-center">NGƯỜI PHỤ TRÁCH</th>
                                    <th className="px-5 py-4 text-right pr-6">NGÀY XỬ LÝ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loading && documents.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-5 py-6">
                                                <div className="h-4 bg-gray-100 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : documents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400 opacity-40">
                                                <ClipboardList className="w-16 h-16" />
                                                <p className="text-sm font-black uppercase tracking-widest">Không tìm thấy lịch sử biến động</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    documents.map((doc) => {
                                        const detail = detailsCache[doc.Id];
                                        const relevantItem = detail?.Items?.find(item =>
                                            item.ProductId === productId && (!lotId || item.LotId === lotId)
                                        );

                                        return (
                                            <tr key={doc.Id} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="px-5 py-5 border-l-4 border-transparent hover:border-l-[#E4002B]">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-[#E4002B]">
                                                            {doc.DocumentNo}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                            {doc.CreatedAt ? format(addHours(new Date(doc.CreatedAt.replace('Z', '')), 7), "dd/MM/yyyy HH:mm", { locale: vi }) : "--"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5 text-center">
                                                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600">
                                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                        {relevantItem?.PlannedDate
                                                            ? format(new Date(relevantItem.PlannedDate.endsWith('Z') ? relevantItem.PlannedDate : relevantItem.PlannedDate + 'Z'), "dd/MM/yyyy", { locale: vi })
                                                            : detail ? "--" : <div className="w-16 h-3 bg-gray-100 rounded animate-pulse"></div>}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5 text-center">
                                                    {relevantItem ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-100 min-w-[50px] justify-center">
                                                            {relevantItem.PlannedQty.toLocaleString()}
                                                        </span>
                                                    ) : detail ? (
                                                        <span className="text-[10px] font-bold text-gray-300">N/A</span>
                                                    ) : (
                                                        <div className="w-10 h-5 bg-gray-100 rounded-full animate-pulse mx-auto"></div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-5 text-center">
                                                    {relevantItem ? (
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black min-w-[50px] justify-center ${(relevantItem.ActualQty ?? 0) >= relevantItem.PlannedQty
                                                            ? 'bg-green-50 text-green-700 border border-green-100'
                                                            : 'bg-orange-50 text-orange-700 border border-orange-100'
                                                            }`}>
                                                            {relevantItem.ActualQty !== null && relevantItem.ActualQty !== undefined
                                                                ? relevantItem.ActualQty.toLocaleString()
                                                                : "--"}
                                                        </span>
                                                    ) : detail ? (
                                                        <span className="text-[10px] font-bold text-gray-300">N/A</span>
                                                    ) : (
                                                        <div className="w-10 h-5 bg-gray-100 rounded-full animate-pulse mx-auto"></div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-5 text-center">
                                                    {relevantItem && relevantItem.ActualQty !== null && relevantItem.ActualQty !== undefined ? (
                                                        <span className={`text-xs font-black ${(relevantItem.ActualQty - relevantItem.PlannedQty) > 0
                                                            ? 'text-green-600'
                                                            : (relevantItem.ActualQty - relevantItem.PlannedQty) < 0
                                                                ? 'text-red-600'
                                                                : 'text-gray-400'
                                                            }`}>
                                                            {(relevantItem.ActualQty - relevantItem.PlannedQty) > 0 ? '+' : ''}
                                                            {(relevantItem.ActualQty - relevantItem.PlannedQty).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-300">--</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider
                            ${doc.Status?.toLowerCase() === 'done' || doc.Status?.toLowerCase() === 'completed'
                                                            ? 'bg-green-100 text-green-700'
                                                            : doc.Status?.toLowerCase() === 'cancelled'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {doc.Status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-bold text-gray-700">{doc.CreatedByName || "Hệ thống"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5 text-right pr-6">
                                                    {doc.CompletedAt ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-bold text-green-700">
                                                                {format(addHours(new Date(doc.CompletedAt.replace('Z', '')), 7), "dd/MM/yyyy", { locale: vi })}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-green-600/60">
                                                                {format(addHours(new Date(doc.CompletedAt.replace('Z', '')), 7), "HH:mm")}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] font-bold text-gray-300 text-right w-full">--</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="shrink-0 flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">
                                Trang {page} / {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1 || loading}
                                    onClick={() => setPage(p => p - 1)}
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-[10px] font-black uppercase text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-all"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Trước
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let p;
                                        if (totalPages <= 5) p = i + 1;
                                        else if (page <= 3) p = i + 1;
                                        else if (page >= totalPages - 2) p = totalPages - 4 + i;
                                        else p = page - 2 + i;

                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`w-9 h-9 rounded-lg text-xs font-black transition-all ${page === p
                                                    ? 'bg-[#E4002B] text-white shadow-md shadow-[#E4002B]/30'
                                                    : 'bg-white text-gray-500 border border-gray-100 hover:border-[#E4002B] hover:text-[#E4002B]'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    disabled={page === totalPages || loading}
                                    onClick={() => setPage(p => p + 1)}
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#E4002B] text-white text-[10px] font-black uppercase disabled:opacity-30 hover:bg-[#c70022] transition-all shadow-md shadow-[#E4002B]/20"
                                >
                                    Tiếp
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#E4002B] animate-pulse"></div>
                        KFC Warehouse Tracking System
                    </div>
                    <div>Dữ liệu lưu động thời gian thực</div>
                </div>
            </div>
        </div>
    );
};

export default StockHistoryModal;
