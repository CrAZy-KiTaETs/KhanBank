import { createSlice } from "@reduxjs/toolkit";

export const homeSlice = createSlice({
  name: "homeData",
  initialState: {
    value: 0,
  },
  reducers: {
    homeIncrement: (state) => {
      state.value += 1;
    },
  },
});

export const { homeIncrement } = homeSlice.actions;

export default homeSlice.reducer;
