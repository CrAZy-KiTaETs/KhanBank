import { combineReducers, configureStore } from "@reduxjs/toolkit";
import mainSlice from "./slicers/mainSlice";
import homeSlice from "./slicers/homeSlice";
import { kinoQuerySlice } from "./slicers/kinoQuerySlise";
import { kinoApi } from "@/api/kinoPage/kinoApi";

/* 
  ДЛЯ ДОБАВЛЕНИЯ НОВОГО СЛАЙСЕРА СЛЕДУЙ ПУНКТАМ
  1) СЛАЙСЕР НАХОДИТСЯ В ПАПКЕ slicers
  2) НАЗВАНИЕ ПРИ ИМПОРТЕ - название_страницыSliser
  3) СЛАЙСЕР ДОБАВЛЯЕТСЯ В rootReducer
  4) НАЗВАНИЕ СЛАЙСЕРА В rootReducer - название_страницыData
*/

const rootReducer = combineReducers({
  mainData: mainSlice,
  homeData: homeSlice,
  // kinoDataApi: kinoQuerySlice,
  [kinoApi.reducerPath]: kinoApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(kinoApi.middleware),
});
