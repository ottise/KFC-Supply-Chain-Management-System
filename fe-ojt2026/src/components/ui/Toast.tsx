"use client";
import React, { useCallback, useEffect, useState } from 'react';

export type ToastType = 'default' | 'info' | 'success' | 'error' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  }, [id, onClose]);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const typeConfig = {
    default: {
      borderColor: 'border-slate-200',
      bgColor: 'bg-white',
      iconWrap: 'bg-slate-50 border border-slate-200',
      iconColor: 'text-slate-500',
      progressColor: 'bg-slate-300',
      titleColor: 'text-slate-800',
      messageColor: 'text-slate-500',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    info: {
      borderColor: 'border-sky-200',
      bgColor: 'bg-white',
      iconWrap: 'bg-white border border-sky-200',
      iconColor: 'text-sky-600',
      progressColor: 'bg-sky-400',
      titleColor: 'text-slate-800',
      messageColor: 'text-slate-500',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    success: {
      borderColor: 'border-emerald-200',
      bgColor: 'bg-white',
      iconWrap: 'bg-white border border-emerald-200',
      iconColor: 'text-emerald-600',
      progressColor: 'bg-emerald-400',
      titleColor: 'text-slate-800',
      messageColor: 'text-slate-500',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    error: {
      borderColor: 'border-red-200',
      bgColor: 'bg-white',
      iconWrap: 'bg-white border border-red-200',
      iconColor: 'text-[#E4002B]',
      progressColor: 'bg-red-400',
      titleColor: 'text-slate-800',
      messageColor: 'text-slate-500',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="currentColor" />
          <rect x="11" y="6.8" width="2" height="8" rx="1" fill="white" />
          <circle cx="12" cy="17.6" r="1.2" fill="white" />
        </svg>
      )
    },
    warning: {
      borderColor: 'border-amber-200',
      bgColor: 'bg-white',
      iconWrap: 'bg-white border border-amber-200',
      iconColor: 'text-amber-600',
      progressColor: 'bg-amber-400',
      titleColor: 'text-slate-800',
      messageColor: 'text-slate-500',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  };

  const config = typeConfig[type];

  return (
    <div
      className={`
        relative overflow-hidden
        flex items-start gap-2.5 pl-3 pr-2.5 py-2.5 rounded-[0.9rem] ${config.bgColor}
        shadow-[0_16px_34px_-16px_rgba(15,23,42,0.38),0_8px_18px_-10px_rgba(15,23,42,0.24),0_2px_6px_-2px_rgba(15,23,42,0.12)]
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'}
      `}
      role="status"
      aria-live="polite"
    >
      <div className={`w-5 h-5 flex items-center justify-center ${config.iconColor} shrink-0`}>
        {config.icon}
      </div>

      <div className="flex-1 min-w-0 leading-tight pr-1">
        <p className={`text-[12px] font-semibold tracking-[-0.005em] break-words ${config.titleColor}`}>{title}</p>
        {message && (
          <p className={`text-[10px] mt-0.5 break-words ${config.messageColor}`}>{message}</p>
        )}
      </div>

      <button
        onClick={handleClose}
        className="self-start mt-0.5 p-1 rounded-md transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        aria-label="Đóng thông báo"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/70">
        <div
          className={`h-full ${config.progressColor} origin-left animate-[kfc-toast-progress_linear_forwards]`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

export default Toast;
