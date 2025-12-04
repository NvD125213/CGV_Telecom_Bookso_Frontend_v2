import { cleanQuery } from "../helper/cleanQuery";
import { instance } from "./index";

export const orderServices = {
  get: async (params: any) => {
    return await instance.get("/api/v3/orders", {
      params: cleanQuery(params),
    });
  },

  getByID: async (id: number) => {
    return await instance.get(`/api/v3/orders/${id}`);
  },
  create: async (data: any) => {
    return await instance.post("/api/v3/orders", data);
  },

  update: async (id: number, data: any) => {
    return await instance.put(`/api/v3/orders/${id}`, data);
  },
  reNewOrder: async (id: number, data: any) => {
    return await instance.put(`/api/v3/orders/renew-order/${id}`, data);
  },

  delete: async (id: number) => {
    return await instance.delete(`/api/v3/orders/${id}`);
  },
};
