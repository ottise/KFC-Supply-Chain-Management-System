// Maintenance ticket status enum (matches backend MaintenanceStatus)
export type MaintenanceStatus = 'Scheduled' | 'Ongoing' | 'Done' | 'Cancelled';

// Maintenance ticket response (matches backend MaintenanceResponse)
export interface MaintenanceResponse {
  id: string;
  reason: string;
  startTime: string;
  endTime: string;
  status: MaintenanceStatus;
  createdAt: string;
  createdBy: string;
}

// Request to create maintenance ticket (matches backend CreateMaintenanceRequest)
export interface CreateMaintenanceRequest {
  reason: string;
  startTime: string;
  endTime: string;
}

// Request to start maintenance immediately (matches backend StartMaintenanceRequest)
export interface StartMaintenanceRequest {
  reason: string;
  endTime: string;
}

// Request to update maintenance ticket (matches backend UpdateMaintenanceRequest)
export interface UpdateMaintenanceRequest {
  reason: string;
  startTime: string;
  endTime: string;
  status: MaintenanceStatus;
}

// Paginated maintenance list response (matches backend PagedMaintenanceResponse)
export interface PagedMaintenanceResponse {
  items: MaintenanceResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Maintenance status response (matches backend GetStatus response)
export interface MaintenanceStatusResponse {
  isActive: boolean;
  id?: string;
  reason?: string;
  startTime?: string;
  endTime?: string;
  status?: MaintenanceStatus;
}

// Helper to get status display text in Vietnamese
export const getMaintenanceStatusText = (status: MaintenanceStatus): string => {
  const statusMap: Record<MaintenanceStatus, string> = {
    Scheduled: 'Sắp Tới (Chờ Xử Lý)',
    Ongoing: 'Đang Thực Hiện',
    Done: 'Hoàn Thành',
    Cancelled: 'Đã Hủy',
  };
  return statusMap[status] || status;
};

// Helper to get status color class
export const getMaintenanceStatusColorClass = (status: MaintenanceStatus): string => {
  const colorMap: Record<MaintenanceStatus, string> = {
    Scheduled: 'bg-yellow-100 text-yellow-700',
    Ongoing: 'bg-blue-100 text-blue-700',
    Done: 'bg-green-100 text-green-700',
    Cancelled: 'bg-gray-100 text-gray-400',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-400';
};

// Helper to format date for display
export const formatDateTimeForDisplay = (isoString: string): string => {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
