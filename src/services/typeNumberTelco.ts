import { instance } from "./index";
import { cleanQuery } from "../helper/cleanQuery";
import {
  ICreateTypeNumberTelco,
  ICreateTypeNumberTelcosBulk,
  IReplaceTelcosForType,
  IReplaceTelcosForTypeResult,
  ITypeNumberTelco,
  ITypeNumberTelcoListParams,
  ITypeNumberTelcoListResult,
  ITypeNumberTelcoMap,
  IUpdateTypeNumberTelco,
  parseTypeNumberTelcoListResponse,
  parseTypeNumberTelcoMapResponse,
} from "../types/typeNumberTelco";

const BASE = "/api/v3/type-number-telcos";

/** GET /api/v3/type-number-telcos — danh sách có phân trang / lọc */
export const getTypeNumberTelcos = async (
  params: ITypeNumberTelcoListParams,
): Promise<ITypeNumberTelcoListResult> => {
  const cleanedParams = cleanQuery(params);
  const res = await instance.get(BASE, { params: cleanedParams });
  return parseTypeNumberTelcoListResponse(res.data);
};

/** GET /api/v3/type-number-telcos/map — map 2 chiều by_type / by_telco */
export const getTypeNumberTelcoMap = async (): Promise<ITypeNumberTelcoMap> => {
  const res = await instance.get(`${BASE}/map`);
  return parseTypeNumberTelcoMapResponse(res.data);
};

/** GET /api/v3/type-number-telcos/:link_id */
export const getTypeNumberTelcoById = async (
  linkId: number,
): Promise<ITypeNumberTelco> => {
  const res = await instance.get(`${BASE}/${linkId}`);
  return res.data;
};

/** POST /api/v3/type-number-telcos — thêm 1 cặp định dạng – nhà mạng */
export const createTypeNumberTelco = async (
  data: ICreateTypeNumberTelco,
): Promise<ITypeNumberTelco> => {
  const res = await instance.post(BASE, data);
  return res.data;
};

/** PUT /api/v3/type-number-telcos/:link_id */
export const updateTypeNumberTelco = async (
  linkId: number,
  data: IUpdateTypeNumberTelco,
): Promise<ITypeNumberTelco> => {
  const res = await instance.put(`${BASE}/${linkId}`, data);
  return res.data;
};

/** DELETE /api/v3/type-number-telcos/:link_id */
export const deleteTypeNumberTelco = async (linkId: number) => {
  const res = await instance.delete(`${BASE}/${linkId}`);
  return res.data;
};

/** POST /api/v3/type-number-telcos/bulk — thêm nhiều nhà mạng cho 1 định dạng */
export const createTypeNumberTelcosBulk = async (
  data: ICreateTypeNumberTelcosBulk,
): Promise<ITypeNumberTelco[]> => {
  const res = await instance.post(`${BASE}/bulk`, data);
  return res.data;
};

/** PUT /api/v3/type-number-telcos/by-type/:type_id — ghi đè toàn bộ telco của định dạng */
export const replaceTelcosForType = async (
  typeId: number,
  data: IReplaceTelcosForType,
): Promise<IReplaceTelcosForTypeResult> => {
  const res = await instance.put(`${BASE}/by-type/${typeId}`, data);
  return res.data;
};
