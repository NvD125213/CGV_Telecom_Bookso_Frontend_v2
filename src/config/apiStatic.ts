import axios from "axios";

export const instanceStatic = axios.create({
  baseURL: "http://103.216.124.164:8000/",
  headers: {
    "Content-Type": "application/json",
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJIVVlMUSIsInVzZXJfaWQiOjQ2NCwicm9sZSI6MSwiY2hhdF9pZCI6ODY4Mjk0NTU0LCJlbWFpbCI6IkhVWUxRQENHVlRFTEVDT00uVk4iLCJleHAiOjE3NjE0OTExMTYsInR5cGVfdG9rZW4iOiJhcyJ9.c8C_9HUpB0ysEo13lHWIPWPqyqDEiYHZNCxZoEh4MK8",
  },
});
