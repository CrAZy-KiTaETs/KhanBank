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

  const [room, setRoom] = useState(null);
  const [userId, setUserId] = useState(Math.random());

  const [socket, setSocket] = useState(null);

  const [playerTime, setPlayerTime] = useState(0);
  const [playerState, setPlayerState] = useState("pause");

  const playerTimeRef = useRef(playerTime);

  useEffect(() => {
    playerTimeRef.current = playerTime; // обновляем значение рефа при изменении состояния
  }, [playerTime]);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:5000/");
    socket.onopen = () => {
      console.log("Соединение установлено");
      socket.send(
        JSON.stringify({
          event: "createUser",
          userId: userId,
          username: `React ${userId}`,
        })
      );
    };

    socket.onmessage = (event) => {
      // const res = event.data;
      const msg = JSON.parse(event.data);
      console.log("Сообщение от сервера: ", msg);
      if (msg.event === "player") {
        playerHandler({ player: msg.play, time: msg.time });
      }

      if (msg.event === "getPlayerState") {
        console.log("пришел запрос на получение данных о плеере", playerTimeRef);

        socket.send(
          JSON.stringify({
            event: "sendHostPlayerState",
            state: playerState ? playerState : "pause",
            time: playerTimeRef.current,
            userId: msg.userId,
          })
        );
        console.log(" отправили данные о плеере", msg.userId, playerTime);
      }
    };

    setSocket(socket);
    return () => {
      socket.close();
    };
  }, []);

  function playerHandler({ player, time }) {
    const iframe = document.querySelector("iframe");

    if (player === "seek") {
      iframe.contentWindow.postMessage({ api: "seek", time: time }, "*");
    } else {
      iframe.contentWindow.postMessage({ api: player }, "*");
    }
  }

  useEffect(() => {
    const playerListener = (event) => {
      // if (host === false) return;
      console.log("🚀:", event.data.time, playerTime);

      switch (event.data.event) {
        case "time":
          setPlayerTime(event.data.time);
          console.log("🚀:", event.data.time, playerTime);

          break;
        case "play":
          setPlayerState("play");
          console.log("🚀:", playerTime, playerState);
          socket?.send(
            JSON.stringify({
              isHost: true,
              roomId: 1,
              userId: userId,
              username: `React ${userId}`,
              event: "player",
              play: "play",
              time: event.data.time,
            })
          );
          break;

        case "pause":
          setPlayerState("pause");
          socket?.send(
            JSON.stringify({
              isHost: true,
              roomId: 1,
              userId: userId,
              username: `React ${userId}`,
              event: "player",
              play: "pause",
              time: event.data.time,
            })
          );
          break;

        case "seek":
          setPlayerState("seek");
          socket?.send(
            JSON.stringify({
              isHost: true,
              roomId: 1,
              userId: userId,
              username: `React ${userId}`,
              event: "player",
              play: "seek",
              time: event.data.time,
            })
          );
          break;
      }
    };

    window.addEventListener("message", playerListener);

    // Удаляем старый обработчик при размонтировании или обновлении
    return () => {
      window.removeEventListener("message", playerListener);
    };
  }, []);

  const createRoom = () => {
    setRoom("createRoom");
    setHost(true);
    console.log(host);
    socket.send(
      JSON.stringify({
        isHost: room === "createRoom" ? true : false,
        event: room,
        roomId: 1,
        userId: userId,
        username: `React ${userId}`,
      })
    );
  };

  const connectToRoom = () => {
    setRoom("connect");
    socket.send(
      JSON.stringify({
        isHost: room === "createRoom" ? true : false,
        event: room,
        roomId: 1,
        userId: userId,
        username: `React ${userId}`,
      })
    );
  };

  // if (isLoading) return <div>loading</div>;

  return (
    <>
      <Head>
        <title>KinoWatch - смотри фильмы с друзьями! </title>
      </Head>
      <main className={`${styles.container} container`}>
        <h1>{data?.nameRu}</h1>
        <button onClick={() => createRoom()}>Создать комнату</button>
        <button onClick={() => connectToRoom()}>Подключится к комнате</button>
        <button onClick={() => console.log(playerTime)}>
          Совместный просмотр
        </button>
        <KinoboxPlayer kpId={queryParams.id} posterUrl={data?.posterUrl} />
      </main>
    </>
  );
}
