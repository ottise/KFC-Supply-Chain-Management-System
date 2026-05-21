/**
 * Chứa các hàm tiện ích xử lý dữ liệu kho hàng
 */

// Định dạng tiền tệ Việt Nam
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount).replace('₫', 'đ');
};

// Định dạng ngày tháng từ API (ISO string) sang format VN
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Hàm xử lý label cho ProductType nếu cần thiết
export const getProductTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    'Nguyên Liệu Thô': 'Nguyên liệu thô',
    'Thiết Bị': 'Thiết bị',
    'Bao Bì': 'Bao bì',
  };
  return types[type] || type;
};

/**
 * Normalize/translate backend error messages into a user-friendly Vietnamese string.
 * Components pass `rawMsg` (often already in Vietnamese) so this function must be tolerant.
 */
export const translateError = (rawMsg: string): string => {
  const msg = (rawMsg ?? "").toString().trim();
  if (!msg) return "Có lỗi xảy ra. Vui lòng thử lại.";

  const lower = msg.toLowerCase();

  // Common axios/network-ish cases
  if (lower.includes("network error") || lower.includes("net::err") || lower.includes("timeout")) {
    return "Không thể kết nối tới hệ thống. Vui lòng thử lại sau.";
  }

  // Common validation-ish cases
  if (lower.includes("required")) return "Vui lòng nhập đầy đủ thông tin.";
  if (lower.includes("invalid") || lower.includes("bad request") || lower.includes("validation")) {
    return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
  }

  // Duplicate/exist
  if (lower.includes("duplicate") || lower.includes("already exists") || lower.includes("exists")) {
    return "Dữ liệu đã tồn tại.";
  }

  // Not found
  if (lower.includes("not found") || lower.includes("no such")) {
    return "Không tìm thấy dữ liệu.";
  }

  // Range/overflow
  if (lower.includes("overflow") || lower.includes("out of range") || lower.includes("range")) {
    return "Giá trị vượt quá giới hạn hệ thống.";
  }

  // Fallback: if it's already Vietnamese, return as-is; otherwise keep original message.
  return msg;
};