import axiosInstance from "../config/apiToken";
import { IPhoneNumber, IReportDate } from "../types";

export const initialPhoneNumber: IPhoneNumber = {
  id: 0,
  phone_number: "",
  provider_id: 0,
  type_number_id: 0,
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

// interface ApiResponse {
//   total_pages: number;
//   phone_numbers: IPhoneNumber[];
// }

export interface IReleasePhoneNumber {
  data_releases: {
    username: string;
    phone_number: string;
    contract_code: string;
  }[];
}

export interface IRandomNumber {
  type_number_id: number;
  provider_id: number;
  quantity_book: number;
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

export const fetchAllBookingPhones = async ({
  quantity,
  status,
}: {
  quantity: number;
  status: string;
}) => {
  let allData: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const res = await bookingPhoneForOption({ quantity, status, offset });
    const data = res.data; // Giả sử API trả về { data: [] }

    if (data.length > 0) {
      allData = [...allData, ...data];
      offset += data.length; // Tăng offset theo số lượng dữ liệu lấy được
    }

    if (data.length < quantity) {
      hasMore = false; // Dừng nếu số dữ liệu ít hơn quantity (trang cuối)
    }
  }

  return allData;
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

export const releasePhoneNumber = async (data: IReleasePhoneNumber) => {
  try {
    const res = await axiosInstance.post(
      "/api/v1/booking/release-phone-number",
      data
    );
    return res;
  } catch (err: any) {
    console.error("API Error:", err.response?.data.detail);
    throw new Error(err.response?.data?.detail);
  }
};

export const getQuantityPhoneAvailable = async () => {
  const res = await axiosInstance.get("/api/v1/phone/quantity-available");
  return res;
};

export const updatePhone = async (id: number, data: IPhoneNumber) => {
  try {
    const res = await axiosInstance.put(`/api/v1/phone?phone_id=${id}`, data);
    return res;
  } catch (error) {
    console.error("Failed to update phone number:", error);
  }
};

export const deletePhone = async (id: number) => {
  try {
    const res = await axiosInstance.delete(`/api/v1/phone?phone_id=${id}`);
    return res;
  } catch (error) {
    console.error("Failed to update phone number:", error);
  }
};

export const getPhoneByID = async (id: number) => {
  try {
    const res = await axiosInstance.get(`/api/v1/phone/by-id?phone_id=${id}`);
    return res;
  } catch (error) {
    console.error("Failed to get phone number:", error);
  }
};

export const getQuantityAvailable = async () => {
  try {
    const res = await axiosInstance.get(`/api/v1/phone/quantity-available`);
    return res;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getRandomNumber = async (params: IRandomNumber) => {
  try {
    const res = await axiosInstance.get(
      "/api/v1/booking/booking-random-by-type-number-and-provider",
      {
        params,
      }
    );
    return res;
  } catch (error) {
    console.error("Failed to fetch detail random :", error);
    throw error;
  }
};

export const getAllBookingLimit = async (params: IReportDate) => {
  try {
    const res = await axiosInstance.get("/api/v1/booking/limit-booking-all", {
      params,
    });
    return res;
  } catch (error: any) {
    throw new Error(error);
  }
};

export const updateQuantityLimit = async (id: number, data: any) => {
  try {
    const res = await axiosInstance.put(
      `/api/v1/booking/limit-booking/${id}`,
      data
    );
    return res;
  } catch (error: any) {
    throw new Error(error);
  }
};
