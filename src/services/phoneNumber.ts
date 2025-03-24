import axiosInstance from "../config/apiToken";
import { IPhoneNumber } from "../types";

export const initialPhoneNumber: IPhoneNumber = {
  id: 0,
  phone_number: "",
  provider_id: 0,
  type_id: 0,
  installation_fee: 0,
  maintenance_fee: 0,
  vanity_number_fee: 0,
  provider_name: "",
  type_name: "",
  booked_until: "",
};

export interface IBookPhoneNumber {
  id_phone_numbers: number[];
}

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axiosInstance.post(
    "/api/v1/phone/upload-phone-number",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

export const createPhoneNumber = async (data: IPhoneNumber) => {
  const res = await axiosInstance.post("/api/v1/phone", data);
  return res;
};

export const bookingPhoneForOption = async ({
  quantity,
  status,
  offset,
}: {
  quantity: number;
  status: string;
  offset: number;
}) => {
  const res = await axiosInstance.get(
    `/api/v1/booking/booking-phone-number-for-option?quantity=${quantity}&option=${status}&offset=${offset}`
  );
  return res;
};

export const bookingPhone = async ({
  offset,
  quantity,
  telco,
  search,
  signal,
}: {
  offset: number;
  quantity: number;
  telco: string;
  search: string;
  signal?: AbortSignal;
}) => {
  const res = await axiosInstance.get(
    `/api/v1/booking/booking-phone-number?filter=${search}&telco=${telco}&limit=${quantity}&offset=${offset}`,
    { signal } // Transmit signal in config
  );
  return res;
};

export const booking = async (data: IBookPhoneNumber) => {
  const res = await axiosInstance.post("/api/v1/booking", data);
  return res;
};
