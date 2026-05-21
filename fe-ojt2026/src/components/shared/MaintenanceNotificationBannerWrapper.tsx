"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";
import { maintenanceApi } from "@/lib/api/admin/maintenanceApi";
import type { MaintenanceResponse } from "@/types/maintenance";
import { formatDateTimeForDisplay } from "@/types/maintenance";

const DISMISS_KEY = "maintBannerDismissed";

function getDismissKey(userId: string) {
  return `${DISMISS_KEY}_${userId}`;
}

function calcHours(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const diffMs = e - s;
  if (diffMs <= 0) return "< 1 tiếng";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} ngày ${hours % 24} tiếng`;
  }
  if (mins > 0) return `${hours} tiếng ${mins} phút`;
  return `${hours} tiếng`;
}

function getUpcomingScheduled(items: MaintenanceResponse[]): MaintenanceResponse | null {
  const now = Date.now();
  return items.find((i) => {
    if (i.status !== "Scheduled") return false;
    const start = new Date(i.startTime).getTime();
    return start > now;
  }) ?? null;
}

export function MaintenanceNotificationBannerWrapper() {
  const { user, isAuthReady } = useAuthContext();
  const { sidebarWidth } = useSidebarContext();
  const [visible, setVisible] = useState(false);
  const [maintenance, setMaintenance] = useState<MaintenanceResponse | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const wasDismissed = localStorage.getItem(getDismissKey(String(user.id))) === "true";
    if (wasDismissed) return;

    const loadMaintenance = async () => {
      const items = await maintenanceApi.getUpcomingMaintenance(5);
      const upcoming = getUpcomingScheduled(items);
      if (upcoming) {
        setMaintenance(upcoming);
        setVisible(true);
      }
    };
    loadMaintenance();
  }, [user?.id]);

  const handleDismiss = () => {
    if (user?.id) {
      localStorage.setItem(getDismissKey(String(user.id)), "true");
    }
    setVisible(false);
  };

  if (!isAuthReady || !user?.id || !visible || !maintenance) {
    return null;
  }

  const duration = calcHours(maintenance.startTime, maintenance.endTime);

  return (
    <div
      className="fixed z-40 bg-amber-50 border-b border-amber-200 px-4 py-2.5 transition-all duration-500 ease-in-out"
      style={{ top: '80px', left: `${sidebarWidth}px`, right: '0px' }}
    >
      <div className="max-w-[1920px] mx-auto flex items-center gap-3">
        <span className="text-lg" role="img" aria-label="warning">🔧</span>
        <div className="flex-1 text-sm">
          <span className="font-semibold text-amber-800">Hệ thống bảo trì: </span>
          <span className="text-amber-700">
            {formatDateTimeForDisplay(maintenance.startTime)} →{" "}
            {formatDateTimeForDisplay(maintenance.endTime)}
          </span>
          <span className="text-amber-600 mx-1">•</span>
          <span className="text-amber-700">Lý do: {maintenance.reason}</span>
          <span className="text-amber-600 mx-1">•</span>
          <span className="text-amber-700">Thời gian: {duration}</span>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 text-amber-400 hover:text-amber-700 transition-colors shrink-0"
          aria-label="Đóng thông báo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
