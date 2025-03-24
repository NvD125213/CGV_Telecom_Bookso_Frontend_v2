export interface IPhoneNumber {
  id: number;
  provider_id: number | string;
  type_id: number | string;
  phone_number: string;
  status?: string;
  booked_until?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: number;
  installation_fee?: number;
  maintenance_fee?: number;
  vanity_number_fee?: number;
  provider_name?: string;
  type_name?: string;
}
