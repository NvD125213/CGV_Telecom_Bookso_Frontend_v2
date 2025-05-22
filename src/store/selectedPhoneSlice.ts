import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SelectedPhoneState<T> {
  selectedIds: (string | number)[];
  selectedRows: T[];
}

const initialState: SelectedPhoneState<any> = {
  selectedIds: [],
  selectedRows: [],
};

const selectedPhoneSlice = createSlice({
  name: "selectedPhone",
  initialState,
  reducers: {
    setSelectedIds: <T>(
      state: SelectedPhoneState<T>,
      action: PayloadAction<{ ids: (string | number)[]; rows: T[] }>
    ) => {
      state.selectedIds = action.payload.ids;
      state.selectedRows = action.payload.rows;
    },
    resetSelectedIds: (state) => {
      state.selectedIds = [];
      state.selectedRows = [];
    },
  },
});

export const { setSelectedIds, resetSelectedIds } = selectedPhoneSlice.actions;
export default selectedPhoneSlice.reducer;
