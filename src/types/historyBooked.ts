export interface IHistoryBooked {
  id: number;
  user_name: string;
  status: string;
  brandname_name: string;
  raw_status: string;
  brandname_id: number;
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
  booked_at: string;
  released_at: string;
}
