import { instanceStatic } from "../config/apiStatic";
import axiosInstance from "../config/apiToken";

interface ConfigData {
  key: string;
  value: Record<any, any>;
}

export const configService = {
  getConfig: async () => {
    return await instanceStatic.get("/api/v3/configs");
  },
  getConfigByKey: async (key: string) => {
    return await instanceStatic.get(`/api/v3/configs/${key}`);
  },
  createConfig: async (body: ConfigData) => {
    return await instanceStatic.post("/api/v3/configs", body);
  },
  updateConfig: async (id: number, body: ConfigData) => {
    return await instanceStatic.put(`/api/v3/configs/${id}`, body);
  },
};
