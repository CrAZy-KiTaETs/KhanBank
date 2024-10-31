import { useGetCollectionsFilmsQuery } from "@/api/kinoPage/kinoApi";
import * as Icon from "react-bootstrap-icons";
import styles from "./movieList.module.scss";
import Head from "next/head";
import Link from "next/link";

export default function kinoWatch() {
  let {
    data: filmsList,
    error,
    isLoading,
  } = useGetCollectionsFilmsQuery({
    type: "TOP_POPULAR_ALL",
    page: 1,
  });
  console.log(filmsList, error, isLoading);

  if (error) return <div>Error</div>;
  if (isLoading) return <div>loading</div>;

  return (
    <>
      <Head>
        <title>KinoWatch - смотри фильмы с друзьями! </title>
      </Head>
      <main className={`${styles.container} container`}>
        <h1>KinoWatch - Смотри фильмы онлайн вместе с другом</h1>
        <div className={styles.findWrapper}>
          <input type="text" placeholder="Найди свой фильм!" />
          <button>
            Найти <Icon.Search color="orange" />
          </button>
        </div>
        <ul>
          {filmsList.items.map((movie) => (
            <li key={movie.kinopoiskId} data-id={movie.kinopoiskId}>
              <Link
                href={{
                  pathname: "/kinoWatch/movie",
                  query: { id: movie.kinopoiskId },
                }}
              >
                <img src={movie.posterUrlPreview} alt={movie.nameRu} />
                <h2>{movie.nameRu}</h2>
                {movie.genres?.map((genre) => (
                  <p key={genre.genre}>{genre.genre}</p>
                ))}
              </Link>
            </li>
          ))}
        </ul>

        <div className="lox" id="lox"></div>
      </main>
    </>
  );
}
