import { combineReducers, configureStore } from "@reduxjs/toolkit";
import mainSlicer from "./slicers/mainSlicer";
import homeSlicer from "./slicers/homeSlicer";

/* 
  ДЛЯ ДОБАВЛЕНИЯ НОВОГО СЛАЙСЕРА СЛЕДУЙ ПУНКТАМ
  1) СЛАЙСЕР НАХОДИТСЯ В ПАПКЕ slicers
  2) НАЗВАНИЕ ПРИ ИМПОРТЕ - название_страницыSliser
  3) СЛАЙСЕР ДОБАВЛЯЕТСЯ В rootReducer
  4) НАЗВАНИЕ СЛАЙСЕРА В rootReducer - название_страницыData
*/

const rootReducer = combineReducers({
  mainData: mainSlicer,
  homeData: homeSlicer,
});

export const store = configureStore({
  reducer: rootReducer,
});
