'use client';

import { useAuthContext } from '@/lib/contexts/AuthContext';

// Re-export auth context hook
export const useAuth = useAuthContext;

export default useAuth;
