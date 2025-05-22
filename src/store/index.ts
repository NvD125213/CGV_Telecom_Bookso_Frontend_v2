import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import reportReducer from "./reportSlice";
import selectedPhoneReducer from "./selectedPhoneSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    report: reportReducer,
    selectedPhone: selectedPhoneReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
