export interface ITypeNumber {
  id: string;
  name: string;
  description?: string;
  booking_expiration: number | string;
}

export const newTypeNumber = {
  id: "",
  name: "",
  description: "",
  booking_expiration: 0,
};
