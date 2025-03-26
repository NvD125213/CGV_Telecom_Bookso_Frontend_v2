import axiosInstance from "../config/apiToken";
import { IReportRole } from "../types";

export const getDetailReportByRole = async (params: IReportRole) => {
  try {
    const response = await axiosInstance.get(
      "http://13.229.236.236:8000/api/v1/report/detail-report-by-role",
      {
        params,
      }
    );
    return response;
  } catch (error) {
    console.error("Failed to fetch detail report by role:", error);
    throw error;
  }
};
