import axiosInstance from "../config/apiToken";
 

export const getPublicNumber1900 = async () => {
  const res = await axiosInstance.get("http://13.228.23.40:8000/api/v2/public-numbers")
  return res
};
