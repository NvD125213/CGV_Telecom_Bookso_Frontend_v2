import axiosInstance from "../config/apiToken";
import { ITypeNumber } from "../types";

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
    const res = await axiosInstance.delete(
      `/api/v1/type_number/{type_number_id }?id_type_number=${id}`
    );
    return res;
  } catch (error) {
    console.error("Failed to delete type:", error);
  }
};
