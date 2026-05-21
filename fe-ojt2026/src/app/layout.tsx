import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { Toaster } from "react-hot-toast";
import { MaintenanceNotificationBannerWrapper } from "@/components/shared/MaintenanceNotificationBannerWrapper";
import { SidebarProvider } from "@/lib/contexts/SidebarContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // Thêm đầy đủ weights để phục vụ thiết kế "black/bold" của KFC
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "KFC SCM Việt Nam",
  description: "Hợp tác KFC Việt Nam - Xây dựng sự nghiệp kinh doanh bền vững cùng thương hiệu gà rán hàng đầu thế giới",
  icons: {
    icon: "https://upload.wikimedia.org/wikipedia/sco/b/bf/KFC_logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`} suppressHydrationWarning>
        <AuthProvider>
          <SidebarProvider>
            <ToastProvider position="top-right">
              <MaintenanceNotificationBannerWrapper />
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                  },
                  success: {
                    style: {
                      background: '#10B981',
                      color: '#fff',
                    },
                  },
                  error: {
                    style: {
                      background: '#EF4444',
                      color: '#fff',
                    },
                    duration: 5000,
                  },
                }}
              />
            </ToastProvider>
          </SidebarProvider>
        </AuthProvider>
        {/* Portals for DatePickers and Modals */}
        <div id="kfc-replenishment-portal"></div>
        <div id="kfc-stock-portal"></div>
      </body>
    </html>
  );
}