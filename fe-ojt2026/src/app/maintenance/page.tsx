"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { maintenanceApi } from '@/lib/api/admin/maintenanceApi';
import { formatDateTimeForDisplay } from '@/types/maintenance';

interface MaintenanceInfo {
  message?: string;
  reason?: string;
  endTime?: string;
  startTime?: string;
  status?: string;
}

export default function MaintenancePage() {
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch maintenance status from API
  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      const status = await maintenanceApi.getMaintenanceStatus();
      if (status.isActive && status.id) {
        // Ongoing maintenance - show the page
        const info = {
          reason: status.reason,
          startTime: status.startTime,
          endTime: status.endTime,
          status: status.status,
        };
        setMaintenanceInfo(info);
        sessionStorage.setItem('maintenanceInfo', JSON.stringify(info));
      } else if (status.status === 'Done' || status.status === 'Cancelled') {
        // Maintenance finished or cancelled - still show page with sessionStorage
        const stored = sessionStorage.getItem('maintenanceInfo');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setMaintenanceInfo(parsed);
          } catch {
            // ignore
          }
        }
      } else {
        // No active maintenance - still show page with sessionStorage or default
        const stored = sessionStorage.getItem('maintenanceInfo');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setMaintenanceInfo(parsed);
          } catch {
            // ignore
          }
        }
      }
    } catch (error) {
      console.error('[MaintenancePage] Failed to fetch status:', error);
      // Still show page with sessionStorage data if available
      const stored = sessionStorage.getItem('maintenanceInfo');
      if (stored) {
        try {
          setMaintenanceInfo(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, [fetchMaintenanceStatus]);

  // Also check sessionStorage for initial data while API is loading
  useEffect(() => {
    if (isLoading) {
      const stored = sessionStorage.getItem('maintenanceInfo');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (!maintenanceInfo) {
            setMaintenanceInfo(parsed);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [isLoading, maintenanceInfo]);

  // Countdown timer
  useEffect(() => {
    if (!maintenanceInfo?.endTime) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(maintenanceInfo.endTime!).getTime();
      const distance = end - now;

      if (distance < 0) {
        // Past end time - check status
        if (maintenanceInfo.status === 'Ongoing') {
          setCountdown('Đang xử lý...');
        } else {
          setCountdown('Đã hoàn thành');
        }
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days} ngày ${hours} giờ ${minutes} phút`);
      } else if (hours > 0) {
        setCountdown(`${hours} giờ ${minutes} phút ${seconds} giây`);
      } else if (minutes > 0) {
        setCountdown(`${minutes} phút ${seconds} giây`);
      } else {
        setCountdown(`${seconds} giây`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [maintenanceInfo?.endTime, maintenanceInfo?.status]);

  // Progress calculation
  useEffect(() => {
    if (!maintenanceInfo?.startTime || !maintenanceInfo?.endTime) return;

    const calculateProgress = () => {
      const now = new Date().getTime();
      const start = new Date(maintenanceInfo.startTime!).getTime();
      const end = new Date(maintenanceInfo.endTime!).getTime();

      // If Scheduled but in the past (started already), treat as Ongoing
      if (now >= start && now <= end) {
        const total = end - start;
        const elapsed = now - start;
        setProgress(Math.round((elapsed / total) * 100));
      } else if (now < start) {
        // Not started yet - Scheduled
        setProgress(0);
      } else if (now > end) {
        // Past end time - check status
        if (maintenanceInfo.status === 'Ongoing') {
          // Still Ongoing but past endTime (edge case) - cap at 99%
          setProgress(99);
        } else {
          setProgress(100);
        }
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 1000);
    return () => clearInterval(interval);
  }, [maintenanceInfo?.startTime, maintenanceInfo?.endTime, maintenanceInfo?.status]);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);

    setTimeout(async () => {
      try {
        const status = await maintenanceApi.getMaintenanceStatus();
        if (!status.isActive) {
          // Maintenance ended - redirect to home
          sessionStorage.removeItem('maintenanceInfo');
          window.location.href = '/';
          return;
        }
        // Update info if changed
        if (status.reason || status.endTime) {
          setMaintenanceInfo(prev => prev ? {
            ...prev,
            reason: status.reason || prev.reason,
            startTime: status.startTime || prev.startTime,
            endTime: status.endTime || prev.endTime,
            status: status.status,
          } : null);
        }
      } catch (error) {
        console.error('[MaintenancePage] Retry failed:', error);
      }
      setIsRetrying(false);
    }, delay);
  }, [retryCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 rounded-full animate-pulse opacity-60" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-red-100 via-orange-50 to-yellow-50 rounded-full animate-pulse opacity-50" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-gradient-to-br from-red-200/30 to-transparent rounded-full animate-pulse opacity-30" style={{ animationDelay: '2s' }} />
        </div>

        {/* Header */}
        <header className="relative z-10 px-8 py-6 lg:px-16">
          <Link href="/" className="inline-block cursor-pointer transition-opacity hover:opacity-80">
            <Logo />
          </Link>
        </header>

        {/* Loading Content */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-6 lg:px-16">
          <div className="max-w-2xl w-full">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-red-200 border-t-[#E4002B] rounded-full animate-spin mb-6" />
              <p className="text-gray-500 text-sm font-medium">Đang kiểm tra trạng thái...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 rounded-full animate-pulse opacity-60" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-red-100 via-orange-50 to-yellow-50 rounded-full animate-pulse opacity-50" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-gradient-to-br from-red-200/30 to-transparent rounded-full animate-pulse opacity-30" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6 lg:px-16">
        <Link href="/" className="inline-block cursor-pointer transition-opacity hover:opacity-80">
          <Logo />
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 lg:px-16">
        <div className="max-w-2xl w-full">

          {/* Animated Icon */}
          <div className="mb-12 text-center">
            <div className="relative inline-block">
              <div className="w-28 h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-[#E4002B] to-[#B8001F] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-200/50 animate-bounce" style={{ animationDuration: '3s' }}>
                <svg className="w-14 h-14 lg:w-16 lg:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              {/* Pulsing ring */}
              <span className="absolute inset-0 w-28 h-28 lg:w-32 lg:h-32 rounded-3xl border-4 border-[#E4002B]/20 animate-ping" />
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center mb-10">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Hệ thống đang được bảo trì
            </h1>
            <p className="text-lg text-gray-500 mb-6">
              Chúng tôi đang nâng cấp hệ thống để phục vụ bạn tốt hơn
            </p>

            {/* Reason Card */}
            <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 mb-8">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Lý do bảo trì</p>
              <p className="text-gray-700 leading-relaxed">
                {maintenanceInfo?.reason || 'Hệ thống đang được bảo trì để nâng cấp và cải thiện dịch vụ. Chúng tôi sẽ sớm trở lại với phiên bản tốt hơn.'}
              </p>
            </div>
          </div>

          {/* Progress & Countdown Card */}
          {(maintenanceInfo?.startTime || maintenanceInfo?.endTime) && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 mb-8 shadow-lg shadow-gray-100/50">
              {/* Schedule Info */}
              <div className="flex items-center justify-center gap-6 mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Bắt đầu</p>
                    <p className="text-base font-bold text-gray-900">{formatDateTimeForDisplay(maintenanceInfo.startTime || '')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Kết thúc</p>
                    <p className="text-base font-bold text-gray-900">{formatDateTimeForDisplay(maintenanceInfo.endTime || '')}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiến độ bảo trì</p>
                  <p className="text-xs font-bold text-[#E4002B]">{progress}%</p>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#E4002B] to-[#B8001F] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Countdown */}
              <div className="flex items-center justify-center gap-4 py-4 bg-red-50/50 rounded-2xl">
                <div className="w-12 h-12 bg-[#E4002B]/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dự kiến hoàn thành sau</p>
                  <p className="text-2xl font-bold text-gray-900">{countdown}</p>
                </div>
              </div>
            </div>
          )}

          {/* What to Expect */}
          <div className="bg-gradient-to-r from-gray-50 to-red-50/30 border border-gray-100 rounded-2xl p-6 mb-10">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Những điều bạn có thể mong đợi</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Dữ liệu của bạn được bảo mật an toàn</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Hệ thống nhanh hơn khi quay lại</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Tính năng mới được cập nhật</p>
              </div>
            </div>
          </div>

          {/* Contact & Retry */}
          <div className="flex flex-col items-center gap-6">
            {/* Retry Button */}
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-8 py-4 bg-[#E4002B] text-white font-bold rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-red-200/50 hover:shadow-red-300/50 hover:bg-red-700 transition-all disabled:opacity-70 cursor-pointer flex items-center gap-3"
            >
              {isRetrying ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Thử Lại Ngay
                </>
              )}
            </button>

            {/* Contact Options */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <a href="tel:19001234" className="group flex items-center gap-3 text-gray-500 hover:text-[#E4002B] transition-colors duration-200 cursor-pointer">
                <div className="w-11 h-11 bg-gray-100 group-hover:bg-red-50 rounded-xl flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">1900 1234</span>
              </a>

              <a href="mailto:support@kfcvietnam.vn" className="group flex items-center gap-3 text-gray-500 hover:text-[#E4002B] transition-colors duration-200 cursor-pointer">
                <div className="w-11 h-11 bg-gray-100 group-hover:bg-red-50 rounded-xl flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">support@kfcvietnam.vn</span>
              </a>

              <a href="https://kfcvietnam.vn" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-gray-500 hover:text-[#E4002B] transition-colors duration-200 cursor-pointer">
                <div className="w-11 h-11 bg-gray-100 group-hover:bg-red-50 rounded-xl flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <span className="text-sm font-medium">kfcvietnam.vn</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center border-t border-gray-100">
        <p className="text-gray-400 text-sm">© 2026 KFC Việt Nam. All rights reserved.</p>
      </footer>
    </div>
  );
}
