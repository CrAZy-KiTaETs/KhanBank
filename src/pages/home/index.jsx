import Head from "next/head";
import styles from "./home.module.scss";
import { useDispatch, useSelector } from "react-redux";
import { mainIncrement } from "@/store/slicers/mainSlice";

export default function Home() {
  const value = useSelector((state) => state.mainData.value);
  const dispatch = useDispatch();

  return (
    <>
      <Head>
        <title>Gamechanger - Product Web</title>
      </Head>
      <div className={styles.wrapper}>
        <div className="container">
          <h1 id="lox">Count: {value}</h1>
          <button onClick={() => dispatch(mainIncrement())}>Increment</button>
        </div>
      </div>
    </>
  );
}
