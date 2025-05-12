type ITypeNumber = string | number | undefined;

export function convertTimeToNumber(timeStr: ITypeNumber): number {
  if (
    !timeStr ||
    (typeof timeStr !== "string" && typeof timeStr !== "number")
  ) {
    return 0;
  }

  const timeString = typeof timeStr === "number" ? timeStr.toString() : timeStr;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  try {
    const parts = timeString.toLowerCase().trim().split(/\s+/);

    for (const part of parts) {
      const value = parseInt(part.slice(0, -1));
      if (isNaN(value)) {
        continue;
      }

      if (part.endsWith("h")) {
        hours = value;
      } else if (part.endsWith("m")) {
        minutes = value;
      } else if (part.endsWith("s")) {
        seconds = value;
      }
    }

    // Tăng giới hạn hours lên 999
    hours = Math.min(Math.max(hours, 0), 999);
    minutes = Math.min(Math.max(minutes, 0), 59);
    seconds = Math.min(Math.max(seconds, 0), 59);

    // Ghép thành số HHHMMSS
    return hours * 10000 + minutes * 100 + seconds;
  } catch (error: any) {
    console.log(error);
    return 0;
  }
}

// Format số thành định dạng HHH.MM.SS (000.00.00)
export const formatBookingExpiration = (value: string | number): string => {
  const numericValue = String(value).replace(/\D/g, "");
  const paddedValue = numericValue.padStart(7, "0");
  const sevenDigits = paddedValue.slice(-7);

  return `${sevenDigits.slice(0, 3)}.${sevenDigits.slice(
    3,
    5
  )}.${sevenDigits.slice(5, 7)}`;
};

export const parseBookingExpiration = (value: string): number => {
  const [hours, minutes, seconds] = value.split(".").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};
