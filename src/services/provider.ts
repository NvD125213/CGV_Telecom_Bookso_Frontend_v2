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
  } catch (error) {
    console.error("Failed to fetch provider:", error);
  }
};

// Get provider by id
export const getProviderById = async (id: string) => {
  try {
    const res = await axiosInstance.get(
      `/api/v1/provider/provider-by-id?provider_id=${id}`
    );
    return res.data;
  } catch (error) {
    console.error("Failed to get by id provider:", error);
  }
};

// Create new provider
export const createProvider = async (data: IProvider) => {
  try {
    const res = await axiosInstance.post("/api/v1/provider", data);
    return res;
  } catch (error) {
    console.error("Failed to fetch provider:", error);
  }
};

// Update provider by id
export const updateProvider = async (id: string, data: IProvider) => {
  try {
    const res = await axiosInstance.put(
      `/api/v1/provider/provider-by-id?provider_id=${id}`,
      data
    );
    return res;
  } catch (error) {
    console.error("Failed to update provider:", error);
  }
};

// Delete provider by id
export const deleteProvider = async (id: string) => {
  try {
    const res = await axiosInstance.delete(`/api/v1/provider/${id}`);
    return res.data;
  } catch (error) {
    console.error("Failed to delete provider:", error);
  }
};
