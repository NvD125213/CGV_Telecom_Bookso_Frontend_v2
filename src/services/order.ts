import { instanceStatic } from "../config/apiStatic";
import { cleanQuery } from "../helper/cleanQuery";

export const orderServices = {
  get: async (params: any) => {
    return await instanceStatic.get("/api/v3/orders", {
      params: cleanQuery(params),
    });
  },

  getByID: async (id: number) => {
    return await instanceStatic.get(`/api/v3/orders/${id}`);
  },
  create: async (data: any) => {
    return await instanceStatic.post("/api/v3/orders", data);
  },

  update: async (id: number, data: any) => {
    return await instanceStatic.put(`/api/v3/orders/${id}`, data);
  },
};
