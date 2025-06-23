import axiosInstance from "../config/apiToken";
import { AxiosResponse } from "axios";

interface QueryRequestType {
  day?: string;
  month?: string;
  year?: string;
  page?: number;
  page_size?: number;
  search?: string;
}

export interface SessionData {
  username: string;
  duration: string;
}

export interface SessionHistoryResponse {
  data: SessionData[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const getTimeOnline = async (
  params: QueryRequestType
): Promise<AxiosResponse<SessionHistoryResponse>> => {
  const now = new Date();

  const defaultedParams: QueryRequestType = {
    day: params.day,
    search: params.search,
    month: params.month ?? String(now.getMonth() + 1).padStart(2, "0"),
    year: params.year ?? String(now.getFullYear()),
    page: params.page ?? 1,
    page_size: params.page_size ?? 10,
  };

  const filteredParams = Object.fromEntries(
    Object.entries(defaultedParams).filter(([_, value]) => value !== undefined)
  );

  const res = await axiosInstance.get<SessionHistoryResponse>(
    "/api/v2/report/time-onlines",
    {
      params: filteredParams,
    }
  );

  return res;
};
