export const formatPhoneNumber = (phoneNumber: string) => {
  if (phoneNumber.startsWith("1800") || phoneNumber.startsWith("1900")) {
    return phoneNumber;
  }

  if (phoneNumber.length === 10) {
    return `${phoneNumber.slice(0, 3)}**${phoneNumber.slice(5)}`;
  }

  return phoneNumber;
};
