import { createSlice } from '@reduxjs/toolkit';


const initialState = {
    countries: "",
    gengreId: "",
    oreder: "NUM_VOTE",
    type: "",
    year: "",
    page: 1
}

export const kinoQuerySlice = createSlice({
  name: 'mainUserData',
  initialState,
  reducers: {

  },
});

export const {   } = kinoQuerySlice.actions;

export default kinoQuerySlice.reducer;
