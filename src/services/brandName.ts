import { instance } from "./index";
import { cleanQuery } from "../helper/cleanQuery";
import {
  IBrandNameListParams,
  ICreateBrandName,
  IUpdateBrandName,
  IUpdateBrandNameForSale,
  IBrandNameListResult,
  parseBrandNameListResponse,
} from "../types/brandName";

export const getBrandName = async (
  params: IBrandNameListParams,
): Promise<IBrandNameListResult> => {
  const cleanedParams = cleanQuery(params);
  const res = await instance.get("/api/v3/brandname", {
    params: cleanedParams,
  });
  return parseBrandNameListResponse(res.data);
};

export const getBrandNameById = async (id: number) => {
  const res = await instance.get(`/api/v3/brandname/${id}`);
  return res.data;
};

export const createBrandName = async (data: ICreateBrandName) => {
  const res = await instance.post("/api/v3/brandname", data);
  return res.data;
};

export const updateBrandName = async (data: IUpdateBrandName) => {
  const res = await instance.put(`/api/v3/brandname/${data.id}`, data);
  return res.data;
};

export const updateBrandNameForSale = async (
  id: number,
  data: IUpdateBrandNameForSale,
) => {
  const res = await instance.put(`/api/v3/brandname/${id}/sales`, data);
  return res.data;
};

export const deleteBrandName = async (id: number) => {
  const res = await instance.delete(`/api/v3/brandname/${id}`);
  return res.data;
};
