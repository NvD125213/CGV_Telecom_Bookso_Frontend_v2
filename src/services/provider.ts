import { IProvider } from "../types";
import axiosInstance from "../config/apiToken";
import Swal from "sweetalert2";
import { instance } from "./index";

export const newProvider = {
  id: "",
  name: "",
  description: "",
  phone_number_limit_alert: 0,
  installation_fee: 0,
  maintenance_fee: 0,
  is_public: false,
  users: { rule: [] },
};

// Get all list provider
export const getProviders = async () => {
  try {
    const res = await instance.get("/api/v2/provider/all");
    return res?.data;
  } catch (error: any) {
    throw new Error(error);
  }
};

// Get provider by id
export const getProviderById = async (id: string) => {
  try {
    const res = await instance.get(
      `/api/v2/provider/provider-by-id?provider_id=${id}`
    );
    return res.data;
  } catch (error: any) {
    throw new Error(error);
  }
};

// Create new provider
export const createProvider = async (data: IProvider) => {
  const res = await axiosInstance.post("/api/v2/provider", data);
  return res;
};

// Update provider by id
export const updateProvider = async (id: string, data: IProvider) => {
  const res = await axiosInstance.put(
    `/api/v2/provider/provider-by-id?provider_id=${id}`,
    data
  );
  return res;
};

// Delete provider by id
export const deleteProvider = async (id: string) => {
  try {
    const res = await axiosInstance.delete(`/api/v2/provider/${id}`);
    return res.data;
  } catch (error: any) {
    if (error.status == 400) {
      if (
        error.response.data.detail ==
        "Cannot delete provider with existing phone numbers"
      ) {
        Swal.fire(
          "Oops...",
          "Đang tồn tại số điện thoại sử dụng nhà cung cấp này ",
          "error"
        );
      }
    } else {
      throw new Error(error);
    }
  }
};
