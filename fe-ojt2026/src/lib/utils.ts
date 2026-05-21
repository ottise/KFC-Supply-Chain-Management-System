
export const formatPhoneNumber = (phone: string | null | undefined) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{4})(\d{3})(\d{3})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`;
  }
  return cleaned.replace(/(\d{4})(\d{3})(\d{1,3})/, '$1 $2 $3').trim();
};

export const validateEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  // Cho phép phần tên có chữ/số/chấm/gạch dưới (ít nhất 3 ký tự), sau @ chỉ nhận chữ cái và dấu chấm
  return /^(?=.{3,}@)[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z]+(\.[a-zA-Z]+)+$/.test(email.trim());
};
