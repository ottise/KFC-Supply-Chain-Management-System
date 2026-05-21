"use client";

import React from "react";
import { Loader2, CheckCircle2, Trash2 } from "lucide-react";

interface Props {
    selectedCount: number;
    isUpdating: boolean;
    onUpdate: () => void;
    onComplete: () => void;
    onClearSelection: () => void;
}

const StaffActionPanel: React.FC<Props> = ({
    selectedCount,
    isUpdating,
    onUpdate,
    onComplete,
    onClearSelection
}) => {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#E4002B] text-white px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-10 animate-in slide-in-from-bottom duration-300 z-[100]">
            <div className="flex items-center gap-4 border-r border-white/20 pr-10">
                <div className="w-9 h-9 bg-white text-[#E4002B] rounded-xl flex items-center justify-center font-black text-sm">
                    {selectedCount}
                </div>
                <div>
                    <p className="text-[11px] font-black uppercase tracking-widest">Đã chọn</p>
                    <p className="text-[9px] text-white/60 font-bold uppercase truncate max-w-[150px]">
                        {selectedCount} công việc đang được chọn
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Lưu nháp - xám */}
                <button
                    onClick={onUpdate}
                    disabled={isUpdating}
                    className="flex flex-col items-center gap-1.5 group disabled:opacity-50"
                >
                    <div className="w-11 h-11 bg-gray-500 rounded-2xl flex items-center justify-center group-hover:bg-gray-600 transition-all">
                        {isUpdating ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-white/90">Lưu nháp</span>
                </button>

                {/* Hoàn tất kiểm kê - xanh lá */}
                <button
                    onClick={onComplete}
                    disabled={isUpdating}
                    className="flex flex-col items-center gap-1.5 group disabled:opacity-50"
                >
                    <div className="w-11 h-11 bg-green-500 rounded-2xl flex items-center justify-center group-hover:bg-green-600 transition-all shadow-lg shadow-black/10">
                        {isUpdating ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-white/90">Hoàn tất kiểm kê</span>
                </button>

                {/* Xóa chọn - xám */}
                <button
                    onClick={onClearSelection}
                    className="flex flex-col items-center gap-1.5 group"
                >
                    <div className="w-11 h-11 bg-gray-500 rounded-2xl flex items-center justify-center group-hover:bg-gray-600 transition-all">
                        <Trash2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-tighter text-white/60">Xóa chọn</span>
                </button>
            </div>
        </div>
    );
};

export default StaffActionPanel;
