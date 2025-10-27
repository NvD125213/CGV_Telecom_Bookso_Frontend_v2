import { instanceStatic } from "../config/apiStatic";
import axiosInstance from "../config/apiToken";
import axios from "axios";
import { cleanQuery } from "../helper/cleanQuery";

export interface SubcriptionData {
  customer_name: string;
  tax_code: string;
  contract_code: string;
  username: string;
  slide_users: Record<any, any>;
  root_plan_id: number | null;
  total_minutes: number;
  total_did: number;
  auto_renew: boolean;
  status: number;
  created_at: Date;
  expired: Date;
  updated_at: Date;
}

export interface SubscriptionItem {
  subscription_id: number;
  plan_id: number;
  quantity: number;
  price_override_vnd: number;
  note: string;
}

export const subscriptionService = {
  get: async (params: any) => {
    const cleanedParams = cleanQuery(params);
    return await axiosInstance.get("/api/v3/subscription", {
      params: cleanedParams,
    });
  },
  getById: async (id: number) => {
    return await axiosInstance.get(`/api/v3/subscription/${id}`);
  },

  create: async (data: SubcriptionData) => {
    return await axiosInstance.post("/api/v3/subscription", data);
  },
  update: async (id: number, data: SubcriptionData) => {
    return await axiosInstance.put(`/api/v3/subscription/${id}`, data);
  },
  delete: async (id: number) => {
    return await axiosInstance.delete(`/api/v3/subscription/${id}`);
  },
};

export const subscriptionItemService = {
  get: async (params: any) => {
    const cleanedParams = cleanQuery(params);
    return await axiosInstance.get("/api/v3/subscription-items", {
      params: cleanedParams,
    });
  },
  getById: async (id: number) => {
    return await axiosInstance.get(`/api/v3/subscription-items/${id}`);
  },
  create: async (data: SubscriptionItem) => {
    return await axiosInstance.post("/api/v3/subscription-items", data);
  },
  update: async (id: number, data: SubscriptionItem) => {
    return await axiosInstance.put(`/api/v3/subscription-items/${id}`, data);
  },
  delete: async (id: number) => {
    return await axiosInstance.delete(`/api/v3/subscription-items/${id}`);
  },
};

export const getDetailCombo = async (
  list_account?: string,
  month_year?: string
) => {
  const listHeader = list_account;
  const monthHeader = month_year;

  try {
    const response = await axiosInstance.get("/api/v3/combo/detail", {
      headers: {
        list_account: listHeader,
        month_year: monthHeader,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi khi gọi combo detail:", error);
    throw error;
  }
};
