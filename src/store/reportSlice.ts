import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ReportState {
  revokeSuccess: boolean;
  refreshTrigger: number;
}

const initialState: ReportState = {
  revokeSuccess: false,
  refreshTrigger: 0,
};

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    setRevokeSuccess: (state, action: PayloadAction<boolean>) => {
      state.revokeSuccess = action.payload;
    },
    triggerRefresh: (state) => {
      state.refreshTrigger += 1;
    },
    resetRevokeState: (state) => {
      state.revokeSuccess = false;
    },
  },
});

export const { setRevokeSuccess, triggerRefresh, resetRevokeState } =
  reportSlice.actions;
export default reportSlice.reducer;
