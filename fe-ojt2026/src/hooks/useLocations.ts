'use client';

import { useState, useEffect, useCallback } from 'react';
import { locationsApi } from '@/lib/api/warehouse/locationsApi';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import type { Location } from '@/types/warehouse/locations';

export interface UseLocationsOptions {
  /** Có lấy tất cả không phân trang không? (dùng getAllLocations endpoint) */
  fetchAll?: boolean;
  /** Chỉ lấy location đang active? */
  isActive?: boolean;
  /** Số lượng tối đa khi dùng getLocations (có filter) */
  pageSize?: number;
  /** Tự động fetch khi mount? Mặc định true */
  autoFetch?: boolean;
}

export interface UseLocationsResult {
  locations: Location[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** managerId đã được resolve (từ user.managerId hoặc user.id) */
  resolvedManagerId: number | undefined;
}

/**
 * Hook tập trung để lấy danh sách location với logic lọc theo manager.
 *
 * Logic:
 * - Nếu `user.managerId` khác null → dùng `managerId = user.managerId`
 * - Nếu `user.managerId` là null     → dùng `managerId = user.id`
 *
 * Điều này đảm bảo người dùng chỉ thấy các location thuộc phạm vi quản lý của họ.
 */
export function useLocations(options: UseLocationsOptions = {}): UseLocationsResult {
  const { isActive = true, pageSize = 100, autoFetch = true } = options;

  const { user, isAuthReady, isAuthenticated } = useAuthContext();

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Resolve managerId từ thông tin user:
   * - Nếu managerId không null/undefined → dùng managerId đó
   * - Ngược lại → dùng userId
   */
  const resolvedManagerId = (() => {
    if (!user) return undefined;

    const rawManagerId = user.managerId;
    if (rawManagerId !== null && rawManagerId !== undefined) {
      const parsed = parseInt(String(rawManagerId), 10);
      if (!isNaN(parsed)) return parsed;
    }

    // Fall back: dùng userId
    const parsedUserId = user.id ? parseInt(user.id, 10) : NaN;
    const finalId = !isNaN(parsedUserId) ? parsedUserId : undefined;

    // Diagnostic logging for debugging ID issues
    if (typeof window !== 'undefined' && !isNaN(finalId as number)) {
      // console.log(`[useLocations] resolvedManagerId for ${user.username}:`, finalId);
    }

    return finalId;
  })();

  const fetchLocations = useCallback(async () => {
    if (!isAuthReady || !isAuthenticated || !user) return;

    setLoading(true);
    setError(null);
    try {
      const data = await locationsApi.getLocations({
        managerId: resolvedManagerId,
        isActive,
        pageSize,
      });
      setLocations(data.Items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách vị trí';
      setError(msg);
      console.error('[useLocations] Fetch error:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, isAuthenticated, user?.id, user?.managerId, isActive, pageSize]);

  useEffect(() => {
    if (autoFetch) {
      fetchLocations();
    }
  }, [autoFetch, fetchLocations]);

  return {
    locations,
    loading,
    error,
    refresh: fetchLocations,
    resolvedManagerId,
  };
}

export default useLocations;
