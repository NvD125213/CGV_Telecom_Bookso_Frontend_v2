import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PaymentState {
  currentPayment: any;
  totalPayment: any;
}

const initialState: PaymentState = {
  currentPayment: 0,
  totalPayment: 0,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setCurrentPayment: (state, action: PayloadAction<any>) => {
      state.currentPayment = action.payload;
    },
    setTotalPayment: (state, action: PayloadAction<any>) => {
      state.totalPayment = action.payload;
    },
  },
});

export const { setCurrentPayment, setTotalPayment } = paymentSlice.actions;
export default paymentSlice.reducer;
