import axios from "axios";

export const instanceStatic = axios.create({
  baseURL: "http://103.216.124.164:8000/",
  headers: {
    "Content-Type": "application/json",
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJIVVlMUSIsInVzZXJfaWQiOjQ2NCwicm9sZSI6MSwiY2hhdF9pZCI6ODY4Mjk0NTU0LCJlbWFpbCI6IkhVWUxRQENHVlRFTEVDT00uVk4iLCJleHAiOjE3NjMwMjMzNzQsInR5cGVfdG9rZW4iOiJhcyJ9.G7vOT_XO9HyFhkghN-dqZ33_A-cR06-8Qm8b5PL0kRY",
  },
});
