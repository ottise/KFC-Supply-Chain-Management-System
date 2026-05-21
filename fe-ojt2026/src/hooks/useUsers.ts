import { useState, useEffect, useCallback, useRef } from 'react';
import { userApi } from '@/lib/api/admin/userApi';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import type { User, UserListResponse, Role, UserStatus } from '@/types/user';

// Role mapping cache (role name -> role id)
const ROLE_MAP: Record<string, number> = {
  'Administrator': 1,
  'Admin': 1,
  'Manager': 2,
  'Staff': 3,
};

const normalizeUser = (user: any): User => {
  const roleString = user.Role || user.role;
  let mappedRoleId = user.RoleId || user.roleId;
  if (!mappedRoleId && typeof roleString === 'string') {
    mappedRoleId = ROLE_MAP[roleString] || ROLE_MAP['Admin'];
  }
  return {
    Id: user.Id || user.id || user.ID,
    Username: user.Username || user.username || user.USERNAME,
    Email: user.Email || user.email || user.EMAIL,
    Fullname: user.Fullname || user.fullname || user.FULLNAME || user.Name || user.name || 'Unknown User',
    Phone: user.Phone || user.phone || user.PHONE,
    RoleId: mappedRoleId,
    Status: user.Status || user.status || user.STATUS,
    ManagerId: user.ManagerId || user.managerId,
    CreatedAt: user.CreatedAt || user.createdAt,
    UpdatedAt: user.UpdatedAt || user.updatedAt,
    IsActiveEmail: user.IsActiveEmail ?? user.isActiveEmail ?? user.isActiveMail,
    Role: user.Role || user.role,
  };
};

export const useUsers = (initialPage = 1, pageSize = 10) => {
  const { isAuthenticated, isAuthReady } = useAuthContext();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All filter/page params stored in refs to avoid stale closures
  // State versions are only used for exposing to consumers and re-renders
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [activeEmailFilter, setActiveEmailFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Refs that always hold the latest values synchronously
  const searchRef = useRef('');
  const roleRef = useRef<number | undefined>(undefined);
  const statusRef = useRef<string | undefined>(undefined);
  const activeEmailRef = useRef<boolean | undefined>(undefined);
  const pageRef = useRef(initialPage);

  // Incrementing counter — bump it to trigger a fetch without adding state to the fetch function
  const [fetchCount, setFetchCount] = useState(0);

  // Abort controller ref to cancel previous in-flight request
  const abortRef = useRef<AbortController | null>(null);

  // The actual fetch function — reads from refs so it's always fresh
  const doFetch = useCallback(async () => {
    if (!isAuthReady || !isAuthenticated) return;

    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const page = pageRef.current;
    const search = searchRef.current;
    const role = roleRef.current;
    const status = statusRef.current;
    const activeEmail = activeEmailRef.current;

    try {
      const data: UserListResponse = await userApi.getUsers(
        page,
        pageSize,
        search || undefined,
        role,
        status,
        activeEmail
      );

      // Support both camelCase and PascalCase from backend
      const rawItems: any[] =
        Array.isArray((data as any).items) ? (data as any).items :
        Array.isArray((data as any).Items) ? (data as any).Items :
        (data as any).data || [];

      const items = rawItems.map(normalizeUser);

      const backendTotalItems: number =
        (data as any).totalItems ?? (data as any).TotalItems ??
        (data as any).totalCount ?? (data as any).TotalCount ?? items.length;

      const backendTotalPages: number =
        (data as any).totalPages ?? (data as any).TotalPages ??
        (backendTotalItems > 0 ? Math.ceil(backendTotalItems / pageSize) : 0);

      setUsers(items);
      setCurrentPage(page);      // confirm the page we fetched
      setTotalPages(backendTotalPages);
      setTotalItems(backendTotalItems);
    } catch (err: unknown) {
      if ((err as any)?.name === 'AbortError' || (err as any)?.code === 'ERR_CANCELED') return;
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthReady, isAuthenticated, pageSize]);

  // Trigger fetch whenever auth changes OR fetchCount bumps
  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;
    doFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, isAuthenticated, fetchCount, doFetch]);

  // ─── Public API ───────────────────────────────────────────────────────────

  const changePage = useCallback((page: number) => {
    pageRef.current = page;
    setCurrentPage(page);
    setFetchCount(c => c + 1);
  }, []);

  const search = useCallback((term: string) => {
    searchRef.current = term;
    pageRef.current = 1;
    setSearchTerm(term);
    setCurrentPage(1);
    setFetchCount(c => c + 1);
  }, []);

  const filterByRole = useCallback((roleId: number | undefined) => {
    roleRef.current = roleId;
    pageRef.current = 1;
    setRoleFilter(roleId);
    setCurrentPage(1);
    setFetchCount(c => c + 1);
  }, []);

  const filterByStatus = useCallback((status: string | undefined) => {
    statusRef.current = status;
    pageRef.current = 1;
    setStatusFilter(status);
    setCurrentPage(1);
    setFetchCount(c => c + 1);
  }, []);

  const filterByActiveEmail = useCallback((isActiveEmail: boolean | undefined) => {
    activeEmailRef.current = isActiveEmail;
    pageRef.current = 1;
    setActiveEmailFilter(isActiveEmail);
    setCurrentPage(1);
    setFetchCount(c => c + 1);
  }, []);

  const clearFilters = useCallback(() => {
    searchRef.current = '';
    roleRef.current = undefined;
    statusRef.current = undefined;
    activeEmailRef.current = undefined;
    pageRef.current = 1;
    setSearchTerm('');
    setRoleFilter(undefined);
    setStatusFilter(undefined);
    setActiveEmailFilter(undefined);
    setCurrentPage(1);
    setFetchCount(c => c + 1);
  }, []);

  const refresh = useCallback(() => {
    setFetchCount(c => c + 1);
  }, []);

  return {
    users,
    loading,
    error,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
    },
    searchTerm,
    roleFilter,
    statusFilter,
    activeEmailFilter,
    changePage,
    search,
    filterByRole,
    filterByStatus,
    filterByActiveEmail,
    clearFilters,
    refresh,
  };
};
