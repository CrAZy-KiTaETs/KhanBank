import Head from "next/head";
import KinoboxPlayer from "./KinoboxPlayer";
import { useRef, useEffect, useState } from "react";

import { useRouter } from "next/router";
import { useGetFilmByIdQuery } from "@/api/kinoPage/kinoApi";

export default function movie() {
  const router = useRouter();
  const queryParams = router.query;
  const { data, isLoading } = useGetFilmByIdQuery(queryParams.id);

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const soket = new WebSocket("ws://localhost:5000/");
    // Когда соединение открыто
    soket.onopen = () => {
      console.log("Соединение установлено");
    };

    // Когда приходит сообщение
    soket.onmessage = (event) => {
      const res = event.data;
      const data = JSON.parse(res);
      console.log("Сообщение от сервера: ", data);
      if (data.event === "player") {
        playerHandler({ player: data.play, time: data.time });
      }
    };

    // Устанавливаем сокет в состояние
    setSocket(soket);

    // const roomId = queryParams.roomId

    // if (roomId) {
    //   soket.send("")
    // }

    // Очистка сокета при размонтировании компонента
    return () => {
      soket.close();
    };
  }, []);

  function playerHandler({ player, time }) {
    const iframe = document.querySelector("iframe");
    iframe.contentWindow.postMessage({ api: player, time: time }, "*");
  }

  function pausePlayer() {
    const iframe = document.querySelector("iframe");
    iframe.contentWindow.postMessage({ api: "pause" }, "*");
  }

  function playPlayer() {
    const iframe = document.querySelector("iframe");
    iframe.contentWindow.postMessage({ api: "play" }, "*");
  }

  function timePlayer() {
    const iframe = document.querySelector("iframe");
    iframe.contentWindow.postMessage({ api: "seek", time: 200 }, "*");
  }

  const playerListener = (event) => {
    switch (event.data.event) {
      case "resumed":
        console.log("🚀:", "ЗАПУЩЕН");
        socket.send(
          JSON.stringify({
            message: "Плеер запущен",
            event: "player",
            roomId: 1,
            userName: "React 1",
            play: "play",
            time: event.data.time,
          })
        );

        break;
      case "pause":
        console.log("🚀:", "СТОП");
        socket.send(
          JSON.stringify({
            message: "Плеер остановлен",
            event: "player",
            roomId: 1,
            userName: "React 1",
            play: "pause",
            time: event.data.time,
          })
        );

        break;

      case "seek":
        console.log("🚀:", "ПЕРЕМОТКА", event.data.time);
        socket.send(
          JSON.stringify({
            message: "Плеер перемотан",
            event: "player",
            roomId: 1,
            userName: "React 1",
            play: "seek",
            time: event.data.time,
          })
        );
        break;
    }

    // if (socket && socket.readyState === WebSocket.OPEN) {
    //   socket.send(
    //     JSON.stringify({
    //       message: "Сообщение от реакт пользователя 1",
    //       roomId: 1,
    //       userName: "React 1",
    //       play: play,
    //     })
    //   );
    // } else {
    //   console.log("Соединение еще не установлено");
    // }
  };

  if (isLoading) return <div>loadin</div>;

  window.addEventListener("message", playerListener);

  return (
    <>
      <Head>
        <title>KinoWatch - смотри фильмы с друзьями! </title>
      </Head>
      <main>
        СМОТРЮ ФИЛЬМЫ
        <button onClick={() => playerHandler(true)}></button>
        <button onClick={() => pausePlayer()}>STOP PLAYER</button>
        <button onClick={() => playPlayer()}>PLAY PLAYER</button>
        <KinoboxPlayer kpId={queryParams.id} posterUrl={data.posterUrl} />
      </main>
    </>
  );
}
