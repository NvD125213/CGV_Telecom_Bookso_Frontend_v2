import axios from "axios";
const apiNonToken = axios.create({
  baseURL: "http://13.229.236.236:8000",
});

export default apiNonToken;
