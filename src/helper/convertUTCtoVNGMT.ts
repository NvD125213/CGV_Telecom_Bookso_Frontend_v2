export function VietNamGMT(dateString: string): Date {
  const utcDate = new Date(dateString);
  const vnTime = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
  return vnTime;
}
