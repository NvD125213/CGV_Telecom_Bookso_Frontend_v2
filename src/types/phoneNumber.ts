export interface IPhoneNumber {
  id: number;
  provider_id: number | string;
  type_number_id: number | string;
  type_id: number | string;
  phone_number: string;
  status?: string;
  booking_expiration?: number;
  booked_until?: string;
  createdAt?: string;
  updatedAt?: string;
  active?: number;
  installation_fee?: number;
  maintenance_fee?: number;
  vanity_number_fee?: number;
  provider_name?: string;
  type_name?: string;
  created_at?: string;
  updated_at?: string;
  released_at?: string;
  phone_number_id?: string;
  user_name?: string;
  user_name_release?: string;
}
