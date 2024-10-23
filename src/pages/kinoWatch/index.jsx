import { useGetCollectionsFilmsQuery } from "@/api/kinoPage/kinoApi";
import * as Icon from "react-bootstrap-icons";
import { useEffect, useState } from "react";
import styles from "./movieList.module.scss";
import Head from "next/head";
import Link from "next/link";



import ReactDOM from 'react-dom';
import ReactPaginate from 'react-paginate';

// Example items, to simulate fetching from another resources.
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,];

function Items({ currentItems }) {
  return (
    <>
      {currentItems &&
        currentItems.map((item) => (
          <div>
            <h3>Item #{item}</h3>
          </div>
        ))}
    </>
  );
}

function PaginatedItems({ itemsPerPage }) {
  // Here we use item offsets; we could also use page offsets
  // following the API or data you're working with.
  const [itemOffset, setItemOffset] = useState(0);

  // Simulate fetching items from another resources.
  // (This could be items from props; or items loaded in a local state
  // from an API endpoint with useEffect and useState)
  const endOffset = itemOffset + itemsPerPage;
  console.log(`Loading items from ${itemOffset} to ${endOffset}`);
  const currentItems = items.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(items.length / itemsPerPage);

  // Invoke when user click to request another page.
  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % items.length;
    console.log(
      `User requested page number ${event.selected}, which is offset ${newOffset}`
    );
    setItemOffset(newOffset);
  };

  return (
    <>
      <Items currentItems={currentItems} />
      <ReactPaginate
        breakLabel="..."
        nextLabel="next >"
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={pageCount}
        previousLabel="< previous"
        renderOnZeroPageCount={null}
      />
    </>
  );
}

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


  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];


  return (
    <>
      <Head>
        <title>KinoWatch - смотри фильмы с друзьями! </title>
      </Head>
      <main className={`${styles.container} container`}>
        <h1>KinoWhatch - Смотри фильмы онлайн вместе с другом</h1>
        <div className={styles.findWrapper}>
          <input type="text" placeholder="Найди свой фильм!" />
          <button >
            Найти <Icon.Search color="orange" />
          </button>
        </div>
        <ul>
          {filmsList.items.map((movie) => (
            <li key={movie.kinopoiskId} data-id={movie.kinopoiskId}>
              <Link href={{ pathname: "/kinoWatch/movie", query: { id: movie.kinopoiskId } }}>
                <img src={movie.posterUrlPreview} alt={movie.nameRu} />
                <h2>{movie.nameRu}</h2>
                {movie.genres?.map((genre) => (
                  <p key={genre.genre}>{genre.genre}</p>
                ))}
              </Link>
            </li>
          ))}
        </ul>
        {/* <Items/> */}
        <PaginatedItems itemsPerPage={4} />,


        <div className="lox" id="lox"></div>

        {/* <ReactPaginate
        breakLabel="..."
        nextLabel="next >"
        // onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={items}
        previousLabel="< previous"
        renderOnZeroPageCount={null}
      /> */}

      </main>
    </>
  );
}
