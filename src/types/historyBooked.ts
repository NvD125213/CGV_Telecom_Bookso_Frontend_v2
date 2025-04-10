export interface IHistoryBooked {
  id: number;
  user_name: string;
  status: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  booked_until: string; // ISO date string
  phone_number: string;
  installation_fee: number | string;
  vanity_number_fee: number | string;
  maintenance_fee: number | string;
  provider_name: string;
  type_name: string;
  active: number;
}
