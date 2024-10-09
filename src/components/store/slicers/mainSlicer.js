import { createSlice } from '@reduxjs/toolkit';

export const mainSliser = createSlice({
  name: 'mainUserData',
  initialState: {
    value: 0,
  },
  reducers: {
    mainIncrement: (state) => {
      state.value += 1;
    },

  },
});

export const { mainIncrement,  } = mainSliser.actions;

export default mainSliser.reducer;
