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
  const [userId, setUserId] = useState(Math.floor(Math.random() * 1000000));
  const [localRoomId, setLocalRoomId] = useState(null);
  const [queryRoomId, setQueryRoomId] = useState(null);
  const [isRoomConnected, setIsRoomConnected] = useState(null);
  const [socket, setSocket] = useState(null);

  const [playerTime, setPlayerTime] = useState(0);
  const [playerState, setPlayerState] = useState("pause");

  const playerTimeRef = useRef(playerTime);

  // WEB SOCKET
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
      const iframe = document.querySelector("iframe");

      const msg = JSON.parse(event.data);
      console.log("Сообщение от сервера: ", msg);

      switch (msg.event) {
        case "reqPlayerState":
          console.log("пришел запрос на получение данных о плеере", msg.userId, playerTime, playerTimeRef);

          socket.send(
            JSON.stringify({
              event: "resHostPlayerState",
              state: playerState ? playerState : "pause",
              time: playerTimeRef.current,
              userId: msg.userId,
            })
          );
          break;

        case "sendHostPlayerState":
          console.log("ЕБАТЬ, ПРИШЛИ ДАННЫЕ", msg);
          iframe.contentWindow.postMessage(
            { api: "seek", time: msg.time },
            "*"
          );
          break;

          case "getHostPlayerState":
          console.log(
            "пришел запрос на получение данных о плеере",
            playerTime, playerTimeRef
          );

          socket.send(
            JSON.stringify({
              event: "sendHostPlayerState",
              state: playerState,
              time: playerTimeRef.current,
              userId: msg.userId,
            })
          );
          break;

        case "Room created successfully":
          setLocalRoomId(msg.roomId);
          break;

        case "Room connected successfully":
          setIsRoomConnected(true);
          break;

        case "play":
          console.log("ЗАПРОС ОТ СЕРВАКА НА РАБОТУ С ПЛЕЕРОМ", msg);
          if (msg.playerState === "play") {
            iframe.contentWindow.postMessage({ api: "play" }, "*");
          }

          if (msg.playerState === "pause") {
            iframe.contentWindow.postMessage({ api: "pause" }, "*");
          }

          if (msg.playerState === "seek") {
            iframe.contentWindow.postMessage(
              { api: "seek", time: msg.time },
              "*"
            );
          }

          break;

        default:
          break;
      }
    };

    setSocket(socket);
    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    playerTimeRef.current = playerTime;
  }, [playerTime]);

  const createRoom = () => {
    socket.send(
      JSON.stringify({
        isHost: true,
        event: "createRoom",
        userId: userId,
        username: `React ${userId}`,
      })
    );
  };

  const connectRoom = () => {
    console.log(queryParams.roomId);

    socket?.send(
      JSON.stringify({
        event: "Connect to the room",
        userId: userId,
        roomId: queryParams.roomId,
        username: `Connected React ${userId}`,
      })
    );
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get("roomId");
    setQueryRoomId(myParam);
    if (myParam) {
      socket?.send(
        JSON.stringify({
          event: "Connect to the room",
          userId: userId,
          roomId: myParam,
          username: `Connected React ${userId}`,
        })
      );
    }
  }, []); // Добавляем router.isReady в зависимости

  if (isLoading) return <div>loading</div>;

  const playerListener = (event) => {
    // console.log("🚀:", event.data.time, playerTime);

    // if (["play", "start", "seek", "pause"].includes(event.data.event)) {
    //   socket?.send(
    //     JSON.stringify({
    //       event: "play",
    //       playerState: event.data.event,
    //       roomId: localRoomId,
    //       userId: userId,
    //       time: event.data.time,
    //     })
    //   );
    // }

    if (queryRoomId && event.data.event === "start") {
      console.log(
        "ЗАПУСТИЛИ ПЛЕЕР И ОТАРВИЛИ ЗАПРОС НА ПОЛУЧЕНИЕ ПЛЕЕРА ХОСТА",
        queryRoomId
      );
      return socket?.send(
        JSON.stringify({
          event: "getHostPlayerState",
          userId: userId,
          roomId: queryRoomId,
          username: `Connected React ${userId}`,
        })
      );
    }

    switch (event.data.event) {
      case "time":
        console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", event.data.time, playerTime, playerTimeRef);
        setPlayerTime(event.data.time);

        break;
      case "play":
      case "start":
        setPlayerState("play");
        socket?.send(
          JSON.stringify({
            event: "play",
            roomId: localRoomId,
            playerState: "play",
            userId: userId,
            time: event.data.time,
          })
        );
        break;

      case "pause":
        setPlayerState("pause");
        socket?.send(
          JSON.stringify({
            event: "play",
            roomId: localRoomId,
            playerState: "pause",
            userId: userId,
            time: event.data.time,
          })
        );
        break;

      case "seek":
        socket?.send(
          JSON.stringify({
            playerState: "seek",
            event: "play",
            roomId: localRoomId,
            userId: userId,
            time: event.data.time,
          })
        );
        break;
    }
  };

  function seek() {
    const iframe = document.querySelector("iframe");

    iframe.contentWindow.postMessage({ api: "seek", time: 200 }, "*");
  }

  window.addEventListener("message", playerListener);

  return (
    <>
      <Head>
        <title>KinoWatch - смотри фильмы с друзьями! </title>
      </Head>
      <main className={`${styles.container} container`}>
        <h1>
          {data?.nameRu} - {userId}
        </h1>
        <KinoboxPlayer kpId={queryParams.id} posterUrl={data?.posterUrl} />
        <button onClick={() => createRoom()} disabled={localRoomId}>
          Создать комнату
        </button>{" "}
        <button onClick={() => seek()}>seek</button>
        <button onClick={() => connectRoom()}>Подключится к комнате</button>
        {queryParams.roomId && isRoomConnected && (
          <p>Вы подключились к комнате {queryParams.roomId}</p>
        )}
        {localRoomId && (
          <div>
            <p>Вы создали комнату с id {localRoomId}</p>
            <a
              href={`http://localhost:3000/kinoWatch/movie?id=${queryParams.id}&roomId=${localRoomId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Перейти в комнату
            </a>
          </div>
        )}
      </main>
    </>
  );
}
