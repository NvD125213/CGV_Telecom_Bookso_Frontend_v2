import axiosInstance from "../config/apiToken";
import { IReportDate } from "../types";

export const getDashBoard = async (params: IReportDate) => {
  try {
    let url = `/api/v1/report/dashboard?year=${params.year}&month=${params.month}`;
    if (params.day) {
      url += `&day=${params.day}`;
    }
    const response = await axiosInstance.get(url);
    return response;
  } catch (error) {
    console.error("Failed to api getDashBoard:", error);
    throw error;
  }
};

export const getDetailReportByOption = async (params: IReportDate) => {
  try {
    const response = await axiosInstance.get(
      "/api/v1/report/detail-report-by-option",
      {
        params,
      }
    );
    return response;
  } catch (error) {
    console.error("Failed to fetch detail report by option:", error);
    throw error;
  }
};

export const getDetailReportCurrent = async (params: IReportDate) => {
  try {
    const response = await axiosInstance.get(
      "/api/v1/report/booking-by-current",
      {
        params,
      }
    );
    return response;
  } catch (error) {
    console.error("Failed to fetch detail report by option:", error);
    throw error;
  }
};
