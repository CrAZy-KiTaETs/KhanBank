import Head from "next/head";
import KinoboxPlayer from "./KinoboxPlayer";
import { useRef } from "react";
import { useRouter } from "next/router";
import { useGetFilmByIdQuery } from "@/api/kinoPage/kinoApi";

export default function movie() {

    const router = useRouter()
    const queryParams = router.query
    console.log("🚀 ~ movie ~ queryParams:", queryParams)
    const {data, isLoading} = useGetFilmByIdQuery(queryParams.id)
    console.log("🚀 ~ movie ~ data:", data)

    // console.log(search, params, foo);
    
    if (isLoading) return <div>loadin</div>

  return (
    <>
      <Head>
        <title>KinoWatch - смотри фильмы с друзьями! </title>
      </Head>
      <main>
        СМОТРЮ ФИЛЬМЫasda
        <KinoboxPlayer kpId={queryParams.id} posterUrl={data.posterUrl} />
      </main>
    </>
  );
}
