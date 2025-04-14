import axiosInstance from "../config/apiToken";
import { IProvider } from "../types";

export const newProvider = {
  id: "",
  name: "",
  description: "",
};

// Get all list provider
export const getProviders = async () => {
  try {
    const res = await axiosInstance.get("/api/v1/provider/all");
    return res.data;
  } catch (error: any) {
    throw new Error(error);
  }
};

// Get provider by id
export const getProviderById = async (id: string) => {
  try {
    const res = await axiosInstance.get(
      `/api/v1/provider/provider-by-id?provider_id=${id}`
    );
    return res.data;
  } catch (error: any) {
    throw new Error(error);
  }
};

// Create new provider
export const createProvider = async (data: IProvider) => {
  const res = await axiosInstance.post("/api/v1/provider", data);
  return res;
};

// Update provider by id
export const updateProvider = async (id: string, data: IProvider) => {
  const res = await axiosInstance.put(
    `/api/v1/provider/provider-by-id?provider_id=${id}`,
    data
  );
  return res;
};

// Delete provider by id
export const deleteProvider = async (id: string) => {
  try {
    const res = await axiosInstance.delete(`/api/v1/provider/${id}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error);
  }
};
