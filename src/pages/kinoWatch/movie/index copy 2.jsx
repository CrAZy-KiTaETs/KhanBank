import Head from "next/head";
import KinoboxPlayer from "./KinoboxPlayer";
import styles from "./movie.module.scss";
import { useRef, useEffect, useState, useCallback } from "react";

import { useRouter } from "next/router";
import { useGetFilmByIdQuery } from "@/api/kinoPage/kinoApi";

const socket = new WebSocket("ws://localhost:5000/");

export default function movie() {
  const router = useRouter();
  const queryParams = router.query;
  const { data, isLoading } = useGetFilmByIdQuery(queryParams.id);
  const [userId, setUserId] = useState(Math.floor(Math.random() * 1000000));
  const [isRoomConnected, setIsRoomConnected] = useState(null);
  const [isHost, setIsHost] = useState(false);
  // const [socket, setSocket] = useState(null);

  // const [playerTime, setPlayerTime] = useState(0);
  // const [playerState, setPlayerState] = useState("pause");

  // const playerTimeRef = useRef(0);

  const playerTime = useRef(0);
  const playerState = useRef("pause");
  const roomId = useRef(null);

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
        console.log(
          "пришел запрос на получение данных о плеере",
          msg.userId,
          playerTime,
          playerTimeRef
        );

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
        iframe.contentWindow.postMessage({ api: "seek", time: msg.time }, "*");
        break;

      case "getHostPlayerState":
        console.log("пришел запрос на получение данных о плеере", playerTime);

        socket.send(
          JSON.stringify({
            event: "sendHostPlayerState",
            state: playerState,
            time: playerTime.current,
            userId: msg.userId,
          })
        );
        break;

      case "Room created successfully":
        roomId.current = msg.roomId;
        setIsHost(true);
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
    // console.log(queryParams.roomId);

    socket.send(
      JSON.stringify({
        event: "Connect to the room",
        userId: userId,
        roomId: 23,
        username: `Connected React ${userId}`,
      })
    );
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get("roomId");
    roomId.current = myParam;
    if (myParam) {
      try {
        console.log("ОТПРАВИЛИ ЗАПРОС НА ПОДКЛЮЧЕНИЕ К КОМНАТЕ!!!!!!");

        socket.send(
          JSON.stringify({
            event: "Connect to the room",
            userId: userId,
            roomId: myParam,
            username: `Connected React ${userId}`,
            isHost: false,
          })
        );
      } catch (error) {
        alert("ошибка при подключении к комнате");
        console.log("ошибка при подключении к комнате", error);
      }
    }
  }, []); // Добавляем router.isReady в зависимости

  const playerListener = (event) => {
    if (!isHost) {
      if (roomId && event.data.event === "start") {
        console.log(
          "ЗАПУСТИЛИ ПЛЕЕР И ОТАРВИЛИ ЗАПРОС НА ПОЛУЧЕНИЕ ПЛЕЕРА ХОСТА",
          roomId.current
        );
        socket.send(
          JSON.stringify({
            event: "getHostPlayerState",
            userId: userId,
            roomId: roomId.current,
            username: `Connected React ${userId}`,
          })
        );
      }
      return false;
    }

    switch (event.data.event) {
      case "time":
        console.log(
          "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          event.data.time,
          playerTime
        );
        playerTime.current = event.data.time;
        break;
      case "play":
      case "start":
        playerTime.current = event.data.time;
        socket?.send(
          JSON.stringify({
            event: "play",
            roomId: roomId.current,
            playerState: "play",
            userId: userId,
            time: event.data.time,
          })
        );
        break;

      case "pause":
        playerTime.current = event.data.time;
        socket?.send(
          JSON.stringify({
            event: "play",
            roomId: roomId.current,
            playerState: "pause",
            userId: userId,
            time: event.data.time,
          })
        );
        break;

      case "seek":
        playerTime.current = event.data.time;
        socket?.send(
          JSON.stringify({
            playerState: "seek",
            event: "play",
            roomId: roomId.current,
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

  if (isLoading) return <div>loading</div>;

  window.addEventListener("message", playerListener);

  function sayHi() {
    // socket.send(JSON.stringify({ msg: nixya }));
  }

  function getConsole() {
    console.log(roomId.current, queryParams.roomId, queryParams.id);
  }

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
        <button onClick={() => createRoom()} disabled={isHost}>
          Создать комнату
        </button>{" "}
        <button onClick={() => seek()}>seek</button>
        <button onClick={() => connectRoom()}>Подключится к комнате</button>
        <button onClick={() => sayHi()}>Отправить привет</button>
        <button onClick={() => getConsole()}>вывести что-то в консоль</button>
        {isRoomConnected && <p>Вы подключились к комнате {roomId.current}</p>}
        {isHost && (
          <div>
            <p>Вы создали комнату с id {roomId.current}</p>
            <a
              href={`http://localhost:3000/kinoWatch/movie?id=${queryParams.id}&roomId=${roomId.current}`}
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
