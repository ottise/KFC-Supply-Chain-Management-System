"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  type = "warning",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <Trash2 className="w-8 h-8 text-red-500" />,
      confirmBtn: "bg-red-500 hover:bg-red-600 text-white shadow-red-100",
      borderColor: "border-red-200",
      bgColor: "bg-red-50",
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
      confirmBtn: "bg-[#E4002B] hover:brightness-110 text-white shadow-red-100",
      borderColor: "border-amber-200",
      bgColor: "bg-amber-50",
    },
    info: {
      icon: <AlertTriangle className="w-8 h-8 text-blue-500" />,
      confirmBtn: "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-100",
      borderColor: "border-blue-200",
      bgColor: "bg-blue-50",
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-300 border-2 border-gray-100 overflow-hidden">
        {/* Icon Header */}
        <div className={`${config.bgColor} px-8 py-6 flex flex-col items-center border-b border-gray-100`}>
          <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
            {config.icon}
          </div>
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="px-8 py-6 text-center">
          <p className="text-sm font-medium text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${config.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}