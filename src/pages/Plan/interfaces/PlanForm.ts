export interface PlanData {
  id: number;
  name: string;
  minutes: number;
  did_count: number;
  price_vnd: number;
  outbound_did_by_route: Record<string, any>;
  total_users: number;
  meta: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expiration_time: string;
  expiration_time_package: string;
  status: number;
}

export const PlanDefault = {
  name: "",
  parent_id: null,
  minutes: 0,
  did_count: 0,
  price_vnd: 0,
  outbound_did_by_route: {},
  total_users: 1,
  meta: {},
  is_active: true,
  status: 1,
  is_public: true,
  users: {
    rule: [],
  },
  expiration_time: new Date().toISOString(),
  expiration_time_package: 3,
};
