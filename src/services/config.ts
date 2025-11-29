// import { instanceStatic } from "../config/apiStatic";
import axiosInstance from "../config/apiToken";

interface ConfigData {
  key: string;
  value: Record<any, any>;
}

export const configService = {
  getConfig: async () => {
    return await axiosInstance.get("/api/v3/configs");
  },
  getConfigByKey: async (key: string) => {
    return await axiosInstance.get(`/api/v3/configs/${key}`);
  },
  createConfig: async (body: ConfigData) => {
    return await axiosInstance.post("/api/v3/configs", body);
  },
  updateConfig: async (id: number, body: ConfigData) => {
    return await axiosInstance.put(`/api/v3/configs/${id}`, body);
  },
};
