import axiosInstance from "../config/apiToken";
import { cleanQuery } from "../helper/cleanQuery";
import { instance } from "./index";

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
  is_payment?: boolean;
  updated_at: Date;
}

export interface SubscriptionItem {
  subscription_id: number;
  plan_id: number;
  quantity: number;
  price_override_vnd: number;
  is_payment?: boolean;
  note: string;
}

export const subscriptionService = {
  get: async (params: any) => {
    const cleanedParams = cleanQuery(params);
    return await instance.get("/api/v3/subscription", {
      params: cleanedParams,
    });
  },
  getTotalPrice: async (month_year?: string) => {
    const params = month_year ? { month_year } : {};
    return await instance.get("/api/v3/subscription/get-total-price", {
      params,
    });
  },
  getById: async (id: number) => {
    return await instance.get(`/api/v3/subscription/${id}`);
  },

  create: async (data: SubcriptionData) => {
    return await instance.post("/api/v3/subscription", data);
  },
  update: async (id: number, data: Partial<SubcriptionData>) => {
    return await instance.put(`/api/v3/subscription/${id}`, data);
  },
  reNewSubcription: async (sub_id: any, data: any) => {
    return await instance.put(
      `/api/v3/subscription/renew-subscription/${sub_id}`,
      data
    );
  },
  delete: async (id: number) => {
    return await instance.delete(`/api/v3/subscription/${id}`);
  },
};

export const subscriptionItemService = {
  get: async (params: any) => {
    const cleanedParams = cleanQuery(params);
    return await instance.get("/api/v3/subscription-items", {
      params: cleanedParams,
    });
  },

  getById: async (id: number) => {
    return await instance.get(`/api/v3/subscription-items/${id}`);
  },
  create: async (data: SubscriptionItem) => {
    return await instance.post("/api/v3/subscription-items", data);
  },
  update: async (id: number, data: Partial<SubscriptionItem>) => {
    return await instance.put(`/api/v3/subscription-items/${id}`, data);
  },
  delete: async (id: number) => {
    return await instance.delete(`/api/v3/subscription-items/${id}`);
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
    console.error("Lỗi khi gọi combo detail:", error);
    throw error;
  }
};

export const getQuota = async (
  list_account: { sub_Id: number; list_account: string[] }[],
  month_year: string
) => {
  try {
    const response = await axiosInstance.post(
      "/api/v3/combo/quota",
      list_account, // body JSON
      {
        headers: {
          "Content-Type": "application/json",
          month_year,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Lỗi khi gọi combo quota:", error);
    throw error;
  }
};
