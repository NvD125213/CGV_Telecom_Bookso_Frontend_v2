import axiosInstance from "../config/apiToken";
import { instanceStatic } from "../config/apiStatic";
import { cleanQuery } from "../helper/cleanQuery";

export const logPackageService = {
  get: async (params: any) => {
    const cleanedParams = cleanQuery(params);
    return await instanceStatic.get("/api/v3/log-history-packages", {
      params: cleanedParams,
    });
  },
};
