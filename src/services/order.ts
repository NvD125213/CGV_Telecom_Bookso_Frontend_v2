// import { instanceStatic } from "../config/apiStatic";
import { cleanQuery } from "../helper/cleanQuery";
import axiosInstance from "../config/apiToken";

export const orderServices = {
  get: async (params: any) => {
    return await axiosInstance.get("/api/v3/orders", {
      params: cleanQuery(params),
    });
  },

  getByID: async (id: number) => {
    return await axiosInstance.get(`/api/v3/orders/${id}`);
  },
  create: async (data: any) => {
    return await axiosInstance.post("/api/v3/orders", data);
  },

  update: async (id: number, data: any) => {
    return await axiosInstance.put(`/api/v3/orders/${id}`, data);
  },

  delete: async (id: number) => {
    return await axiosInstance.delete(`/api/v3/orders/${id}`);
  },
};
