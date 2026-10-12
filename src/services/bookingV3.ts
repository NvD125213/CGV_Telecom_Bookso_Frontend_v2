import { instance } from "./index";
import type {
  IBookingRandomRequestV3,
  IBookingRequestV3,
  IBookingV3Result,
} from "../types/bookingV3";

const BASE = "/api/v3/booking";

/**
 * POST /api/v3/booking — Book số (v3), gom 1 đơn
 * - is_new_customer=true → customer/contract NULL, điền lúc confirm
 * - deployment_customer → snapshot CRM
 * Chọn số (chỉ một cách): id_phone_numbers | selections[] | type_number_id + provider_id
 */
export const bookingV3 = async (
  data: IBookingRequestV3,
): Promise<IBookingV3Result> => {
  const res = await instance.post(BASE, data);
  return res.data;
};

/**
 * POST /api/v3/booking/random — Book random gom 1 deployment_order
 * - selections[]: nhiều loại/NCC
 * - hoặc legacy: type_number_id + provider_id + quantity_book
 * Không gửi đồng thời hai cách. Thiếu kho một dòng → 404, rollback cả request.
 * Response có selections_result.
 */
export const bookingRandomV3 = async (
  data: IBookingRandomRequestV3,
): Promise<IBookingV3Result> => {
  const res = await instance.post(`${BASE}/random`, data);
  return res.data;
};
