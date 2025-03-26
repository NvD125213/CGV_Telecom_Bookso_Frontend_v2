// Định nghĩa type cho tham số đầu vào
type ITypeNumber = string | number | undefined;

export function convertTimeToNumber(timeStr: ITypeNumber): number {
  // Xử lý các trường hợp undefined hoặc không phải string/number
  if (
    !timeStr ||
    (typeof timeStr !== "string" && typeof timeStr !== "number")
  ) {
    return 0;
  }

  // Chuyển number thành string nếu cần
  const timeString = typeof timeStr === "number" ? timeStr.toString() : timeStr;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  try {
    // Tách các phần tử bằng khoảng trắng
    const parts = timeString.toLowerCase().trim().split(/\s+/);

    for (const part of parts) {
      // Xóa ký tự cuối (h/m/s) và lấy số
      const value = parseInt(part.slice(0, -1));

      // Kiểm tra nếu không phải số hợp lệ
      if (isNaN(value)) {
        continue;
      }

      // Gán giá trị vào biến tương ứng
      if (part.endsWith("h")) {
        hours = value;
      } else if (part.endsWith("m")) {
        minutes = value;
      } else if (part.endsWith("s")) {
        seconds = value;
      }
    }

    // Đảm bảo giá trị trong khoảng hợp lệ
    hours = Math.min(Math.max(hours, 0), 99);
    minutes = Math.min(Math.max(minutes, 0), 59);
    seconds = Math.min(Math.max(seconds, 0), 59);

    // Ghép thành số HHMMSS
    return hours * 10000 + minutes * 100 + seconds;
  } catch (error: any) {
    console.log(error);
    return 0; // Trả về 0 nếu có lỗi
  }
}

// Format số thành định dạng HH.MM.SS (00.00.00)
export const formatBookingExpiration = (value: string | number): string => {
  // Chuyển đổi input thành string và chỉ giữ lại số
  const numericValue = String(value).replace(/\D/g, "");

  // Nếu không đủ 6 chữ số, thêm số 0 vào đầu
  const paddedValue = numericValue.padStart(6, "0");

  // Lấy 6 chữ số cuối cùng nếu chuỗi dài hơn
  const sixDigits = paddedValue.slice(-6);

  // Định dạng thành HH.MM.SS
  return `${sixDigits.slice(0, 2)}.${sixDigits.slice(2, 4)}.${sixDigits.slice(
    4,
    6
  )}`;
};

export const parseBookingExpiration = (value: string): number => {
  // Tách chuỗi thành mảng dựa trên dấu chấm
  const [hours, minutes, seconds] = value.split(".").map(Number);

  // Tính tổng số giây
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  return totalSeconds;
};
