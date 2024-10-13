import Head from "next/head";
import KinoboxPlayer from "./KinoboxPlayer";
import { useRef, useEffect, useState, useCallback } from "react";

import styles from "./movie.module.scss";

import { useRouter } from "next/router";
import { useGetFilmByIdQuery } from "@/api/kinoPage/kinoApi";

export default function movie() {
  const router = useRouter();
  const queryParams = router.query;
  const { data, isLoading } = useGetFilmByIdQuery(queryParams.id);

  const [host, setHost] = useState(false);
  const [socket, setSocket] = useState(null);

  const [room, setRoom] = useState(null);
  const [userId, setUserId] = useState(Math.random());

  // useEffect(() => {
  //   if (room) {
  //     const socket = new WebSocket("ws://localhost:5000/");
  //     socket.onopen = () => {
  //       socket.send(
  //         JSON.stringify({
  //           isHost: (room === "create" ? true : false),
  //           event: room,
  //           roomId: 1,
  //           userId: userId,
  //           username: `React ${userId}`,
  //         })
  //       );
  //       // alert(room);
  //     };

  //     socket.onmessage = (event) => {
  //       const res = event.data;
  //       const data = JSON.parse(res);
  //       console.log("Сообщение от сервера: ", data);
  //       if (data.event === "player") {
  //         playerHandler({ player: data.play, time: data.time });
  //       }

  //       if (data.event === "error") {
  //         alert("Произошла ошибка при подключении");
  //       }
  //     };

  //     setSocket(socket);

  //     return () => {
  //       socket.close();
  //     };
  //   }
  // }, [room]);

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

  function playerHandler({player, time}) {
    const iframe = document.querySelector("iframe");
    if (player === "seek") {
      iframe.contentWindow.postMessage({ api: "seek", time: time }, "*");
    } else {
      iframe.contentWindow.postMessage({ api: player }, "*");
    }
  }

  const playerListener = useCallback(
    (event) => {
      if (host === false) return;

      const eventMap = {
        resumed: {
          message: "Плеер запущен",
          play: "play",
        },
        pause: {
          message: "Плеер остановлен",
          play: "pause",
        },
        seek: {
          message: "Плеер перемотан",
          play: "seek",
        },
      };

      const eventData = eventMap[event.data.event];
      if (eventData && socket) {
        console.log("🚀:", eventData.message);

        socket.send(
          JSON.stringify({
            isHost: true,
            roomId: 1,
            userId: userId,
            username: `React ${userId}`,
            event: "player",
            play: eventData.play,
            time: event.data.time,
          })
        );
      }
    },
    [host]
  );

  const activeHost = () => {
    setHost((prev) => !prev);
  };

  // useEffect(() => {
  //   if (host) {
  //     window.addEventListener("message", playerListener);
  //   } else {
  //     window.removeEventListener("message", playerListener);
  //   }

  //   return () => {
  //     window.removeEventListener("message", playerListener);
  //   };
  // }, []);

  const createRoom = () => {
    setRoom("create");
    setHost((prev) => !prev);
    socket.send(
      JSON.stringify({
        isHost: room === "create" ? true : false,
        event: room,
        roomId: 1,
        userId: userId,
        username: `React ${userId}`,
      })
    );
  };

  const connetToRoom = () => {
    setRoom("connect");
    socket.send(
      JSON.stringify({
        isHost: room === "create" ? true : false,
        event: room,
        roomId: 1,
        userId: userId,
        username: `React ${userId}`,
      })
    );
  };

  if (isLoading) return <div>loadin</div>;
  window.addEventListener("message", playerListener);
  return (
    <>
      <Head>
        <title>KinoWatch - смотри фильмы с друзьями! </title>
      </Head>
      <main className={`${styles.container} container`}>
        <h1>{data.nameRu}</h1>
        <button onClick={() => createRoom()}>Создать комнату</button>
        <button onClick={() => connetToRoom()}>Подключится к комнате</button>
        <button onClick={() => playerHandler("play")}>
          Совместный просмотр {host ? "включен" : "выключен"}
        </button>
        <KinoboxPlayer
          kpId={queryParams.id}
          posterUrl={data.posterUrl}
          host={host}
        />
      </main>
    </>
  );
}
