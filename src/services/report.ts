import axiosInstance from "../config/apiToken";
import { IReportDate } from "../types";

export const getDashBoard = async (params: IReportDate) => {
  try {
    let url = `/api/v2/report/dashboard?year=${params.year}&month=${params.month}`;
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
      "/api/v2/report/detail-report-by-option",
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
      "/api/v2/report/booking-by-current",
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

export const getNumberCurrent = async (params: IReportDate) => {
  try {
    const response = await axiosInstance.get(
      "/api/v1/phone/report-phone-number-by-time",
      { params }
    );
    return response;
  } catch (error: any) {
    console.error(
      "Failed to fetch detail report by option:",
      error?.response?.data?.detail || error
    );
    throw error;
  }
};

export const getBookingByCurrent = async (params: IReportDate) => {
  try {
    const response = await axiosInstance.get(
      "/api/v2/report/booking-by-current",
      { params }
    );
    return response;
  } catch (error: any) {
    console.error(
      "Failed to fetch detail report by option:",
      error?.response?.data?.detail || error
    );
    throw error;
  }
};

export const getBookingStatusBySales = async (params: IReportDate) => {
  const response = await axiosInstance.get(
    "/api/v2/report/booking-status-by-sales",
    {
      params,
    }
  );
  return response;
};

export const getTimeOnlineByUser = async () => {
  const response = await axiosInstance.get(
    "/api/v2/report/time-online-by-user"
  );
  return response;
};
