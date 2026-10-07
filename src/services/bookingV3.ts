import { instance } from "./index";
import type {
  IBookingRandomRequestV3,
  IBookingRequestV3,
  IBookingV3Result,
} from "../types/bookingV3";

const BASE = "/api/v3/booking";

/**
 * POST /api/v3/booking — Book số (v3)
 * - is_new_customer=true → booked có hạn
 * - deployment_customer → pending_deploy + tạo đơn triển khai
 * - Chọn tay: id_phone_numbers | Random/auto: type_number_id + provider_id
 */
export const bookingV3 = async (
  data: IBookingRequestV3,
): Promise<IBookingV3Result> => {
  const res = await instance.post(BASE, data);
  return res.data;
};

/**
 * POST /api/v3/booking/random — Book random theo type + provider
 * Cùng rule khách với bookingV3; không nhận id_phone_numbers
 */
export const bookingRandomV3 = async (
  data: IBookingRandomRequestV3,
): Promise<IBookingV3Result> => {
  const res = await instance.post(`${BASE}/random`, data);
  return res.data;
};
