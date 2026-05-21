"use client";
import { ToastProvider } from '@/components/ui/ToastProvider';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <ToastProvider position="top-right">
        <div className="bg-gray-50 min-h-screen">
          {children}
        </div>
      </ToastProvider>
    </AdminAuthGuard>
  );
}
