import axiosInstance from "../config/apiToken";
import { cleanQuery } from "../helper/cleanQuery";
import { instanceStatic } from "../config/apiStatic";

interface PlanData {
  name: string;
  parent_id: number;
  minutes: number;
  did_count: number;
  price_vnd: number;
  outbound_did_by_route: Record<string, any>;
  total_users: number;
  meta: Record<string, any>;
  is_active: boolean;
  status: number;
  expiration_time: Date;
}

export const planService = {
  get: async (params: any) => {
    const cleanedParams = cleanQuery(params);
    return await axiosInstance.get("/api/v3/plan", { params: cleanedParams });
  },
  getById: async (id: number) => {
    return await axiosInstance.get(`/api/v3/plan/${id}`);
  },
  getChildren: async (id: number) => {
    return await axiosInstance.get(`/api/v3/plan/${id}/children`);
  },

  create: async (data: PlanData) => {
    return await axiosInstance.post("/api/v3/plan", data);
  },
  update: async (id: number, data: PlanData) => {
    return await axiosInstance.put(`/api/v3/plan/${id}`, data);
  },
  delete: async (id: number) => {
    return await axiosInstance.delete(`/api/v3/plan/${id}`);
  },
};
