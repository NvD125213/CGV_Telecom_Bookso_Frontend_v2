export const formatDateTime = (dateTimeStr: string): string => {
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return "Invalid date"; // Check date if Invalid

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // 24-hour format
  };

  return date.toLocaleString("en-GB", options).replace(",", "");
};
