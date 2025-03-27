export interface IReportRole {
  option: string;
  limit: number;
  offset: number;
  year?: number;
  month?: number;
  day?: number;
}

export interface IReportDetail extends IReportRole {
  id: number;
  user_name: string;
  status: string;
  installation_fee: number;
  vanity_number_fee: number;
  phone_number: string;
  booked_until: string;
  active: number;
  maintenance_fee: number;
  provider_name: string;
  type_name: string;
}
