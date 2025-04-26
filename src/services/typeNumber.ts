import axiosInstance from "../config/apiToken";
import { ITypeNumber } from "../types";
import Swal from "sweetalert2";

export const newTypeNumber = {
  id: "",
  name: "",
  description: "",
  booking_expiration: "",
};

// Get all list typeNumber
export const getTypeNumber = async () => {
  try {
    const res = await axiosInstance.get("/api/v1/type_number/alls");
    return res.data;
  } catch (error) {
    console.error("Failed to fetch profile:", error);
  }
};

// Get provider by id
export const getTypeNumberByID = async (id: string) => {
  try {
    const res = await axiosInstance.get(
      `/api/v1/type_number/by-id?type_number_id=${id}`
    );
    return res.data;
  } catch (error) {
    console.error("Failed to fetch type:", error);
  }
};

// Create new provider
export const createTypeNumber = async (data: ITypeNumber) => {
  const res = await axiosInstance.post("/api/v1/type_number", data);
  return res;
};

// Update provider by id
export const updateTypeNumber = async (id: string, data: ITypeNumber) => {
  const res = await axiosInstance.put(
    `/api/v1/type_number/type-number-by-id?type_number_id=${id}`,
    data
  );
  return res;
};

// Delete provider by id
export const deleteTypeNumber = async (id: string) => {
  try {
    const res = await axiosInstance.delete(`/api/v1/type_number/${id}`);
    return res;
  } catch (error: any) {
    if (error.status === 400) {
      if (
        error.response.data.detail ===
        "Cannot delete type number with existing phone numbers"
      ) {
        Swal.fire(
          "Oops...",
          "Đang tồn tại số điện thoại sử dụng định dạng này ",
          "error"
        );
      }
    } else {
      throw new Error(error);
    }
  }
};
