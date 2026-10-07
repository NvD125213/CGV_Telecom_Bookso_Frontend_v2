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

/** POST /api/v3/booking — book chọn tay hoặc auto */
export const useBookingV3 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IBookingRequestV3) => bookingV3(payload),
    onSuccess: () => invalidateRelated(queryClient),
  });
};

/** POST /api/v3/booking/random — book random theo type + provider */
export const useBookingRandomV3 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IBookingRandomRequestV3) => bookingRandomV3(payload),
    onSuccess: () => invalidateRelated(queryClient),
  });
};
