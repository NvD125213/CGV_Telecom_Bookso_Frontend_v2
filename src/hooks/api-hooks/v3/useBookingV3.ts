import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingRandomV3, bookingV3 } from "../../../services/bookingV3";
import type {
  IBookingRandomRequestV3,
  IBookingRequestV3,
} from "../../../types/bookingV3";

const invalidateRelated = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: ["v3", "deployment-orders"] });
  queryClient.invalidateQueries({ queryKey: ["v3", "customers"] });
};

/** POST /api/v3/booking — chọn tay, random 1 dòng, hoặc selections[] */
export const useBookingV3 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IBookingRequestV3) => bookingV3(payload),
    onSuccess: () => invalidateRelated(queryClient),
  });
};

/**
 * POST /api/v3/booking/random — gom 1 đơn.
 * Payload: selections[] (nhiều loại) hoặc type_number_id + provider_id (1 dòng).
 */
export const useBookingRandomV3 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IBookingRandomRequestV3) => bookingRandomV3(payload),
    onSuccess: () => invalidateRelated(queryClient),
  });
};
