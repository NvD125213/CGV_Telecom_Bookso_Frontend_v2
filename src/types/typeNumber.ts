export interface ITypeNumber {
  id: string;
  name: string;
  description?: string;
  booking_expiration: string;
  weekend_booking_expiration: string;
}

export const newTypeNumber = {
  id: "",
  name: "",
  description: "",
  booking_expiration: "",
  weekend_booking_expiration: "",
};
