import { instance } from "./index";
import { cleanQuery } from "../helper/cleanQuery";

export const logPackageService = {
  get: async (params: any) => {
    const cleanedParams = cleanQuery(params);
    return await instance.get("/api/v3/log-history-packages", {
      params: cleanedParams,
    });
  },
};
