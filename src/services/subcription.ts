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
  month_year?: any
) => {
  try {
    const res = await axios.get("http://180.93.175.210:8989/combo/detail", {
      headers: {
        list_account: list_account || '["SGCRD.2020.VoiceOTP","CGV275"]',
        month_year: month_year || "2025-9",
      },
    });
    return res.data;
  } catch {
    console.warn("⚠️ API lỗi, dùng mock data tạm thời");

    // Mock fallback
    return {
      data: {
        cids_data: [
          {
            cid: "84592146785",
            description: "on.vt,on.mb,on.vn,on.ot",
            mb: 0,
            name: "SGCRD.2020.VoiceOTP",
            ot: 1,
            vn: 1,
            vt: 0,
          },
          {
            cid: "84592146811",
            description: "on.vt,on.mb,on.vn,on.ot",
            mb: 0,
            name: "SGCRD.2020.VoiceOTP",
            ot: 1,
            vn: 1,
            vt: 0,
          },
          {
            cid: "84592147094",
            description: "on.vt,on.mb,on.vn,on.ot",
            mb: 0,
            name: "SGCRD.2020.VoiceOTP",
            ot: 1,
            vn: 1,
            vt: 0,
          },
        ],
        cids_mb: 33,
        cids_ot: 375,
        cids_vn: 375,
        cids_vt: 138,
        quota_data: [
          {
            call_out: 1088,
            datemon: "Mon, 01 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 864,
            datemon: "Tue, 02 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 727,
            datemon: "Wed, 03 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 0,
            datemon: "Thu, 04 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 0,
            datemon: "Fri, 05 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 0,
            datemon: "Sat, 06 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 0,
            datemon: "Sun, 07 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 1043,
            datemon: "Mon, 08 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 867,
            datemon: "Tue, 09 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 777,
            datemon: "Wed, 10 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 938,
            datemon: "Thu, 11 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 809,
            datemon: "Fri, 12 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 922,
            datemon: "Sat, 13 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 955,
            datemon: "Sun, 14 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 1171,
            datemon: "Mon, 15 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 1014,
            datemon: "Tue, 16 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 1167,
            datemon: "Wed, 17 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 1046,
            datemon: "Thu, 18 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 927,
            datemon: "Fri, 19 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 864,
            datemon: "Sat, 20 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 804,
            datemon: "Sun, 21 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 1168,
            datemon: "Mon, 22 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 1172,
            datemon: "Tue, 23 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 1152,
            datemon: "Wed, 24 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 1096,
            datemon: "Thu, 25 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 1089,
            datemon: "Fri, 26 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 964,
            datemon: "Sat, 27 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 698,
            datemon: "Sun, 28 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 892,
            datemon: "Mon, 29 Sep 2025 00:00:00 GMT",
          },
          {
            call_out: 912,
            datemon: "Tue, 30 Sep 2025 00:00:00 GMT",
          },
        ],
        total_call_out: 25126,
      },
      error_code: 0,
      message: "OK (mock data)",
    };
  }
};
