const key = process.env.NEXT_PUBLIC_KINO_API;
const baseUrl = "https://kinopoiskapiunofficial.tech/api/v2.2/";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const kinoApi = createApi({
  reducerPath: "kinoApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      headers.set("X-API-KEY", key);
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),

  endpoints: (builder) => ({
    getAllFilms: builder.query({
      query: () => `films`,
    }),
    getCollectionsFilms: builder.query({
      query: ({ type, page }) => `films/collections?type=${type}&page=${page}`,
    }),
    getFilmById: builder.query({
      query: (id ) => `films/${id}`,
    }),
  }),
});

export const {
  useGetAllFilmsQuery,
  useGetCollectionsFilmsQuery,
  useGetFilmByIdQuery,
} = kinoApi;
