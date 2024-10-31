import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import styles from "./movie.module.scss";

import { useGetFilmByIdQuery } from "@/api/kinoPage/kinoApi";
import KinoboxPlayer from "./KinoboxPlayer";

const Movie = () => {
  // ОБЩЕЕ
  const router = useRouter();
  const queryParams = router.query;

  const userId = useRef(null);
  const [socket, setSocket] = useState(null);
  const roomId = useRef(null || queryParams.roomId);
  const [isRoomConnected, setIsRoomConnected] = useState(null);
  const [socketEvent, setSocketEvent] = useState(null);

  // FILMS
  const { data: film, isLoading } = useGetFilmByIdQuery(queryParams.id);
  const [isHost, setIsHost] = useState(false);
  const playerTime = useRef(0);
  const playerState = useRef("pause");

  // RTC
  const [peerConnection, setPeerConnection] = useState(null);
  const [users, setUsers] = useState([{ username: "user", userId: 1 }]);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const connectToSocket = () => {
    return io("wss://khanbank.onrender.com", {
      transports: ["websocket"],
      forceNew: true,
    });
  };

  const createRoom = () => {
    let newSocket;
    try {
      newSocket = connectToSocket();
    } catch (error) {
      console.log("ОШИбКА ПРИ ПОДКЛЮЧЕНИИ К СОКЕТУ", error);
    }

    newSocket.emit("createRoom", { users, userId: userId.current });
    setSocket(newSocket);
  };

  useEffect(() => {
    // Логика при подключении к комнате
    const urlParams = new URLSearchParams(window.location.search);
    const queryRoomId = urlParams.get("roomId");

    userId.current = urlParams.get("id") + Math.floor(Math.random() * 1000);

    if (queryRoomId) {
      const newSocket = connectToSocket();
      setSocket(newSocket);
      try {
        console.log("ОТПРАВИЛИ ЗАПРОС НА ПОДКЛЮЧЕНИЕ К КОМНАТЕ!!!!!!");
        newSocket.emit("joinRoom", {
          username: "user",
          roomId: queryRoomId,
          userId: userId.current,
        });
      } catch (error) {
        alert("ошибка при подключении к комнате");
        console.log("ошибка при подключении к комнате", error);
      }
    }
  }, []);

  socket?.onAny((event, data) => {
    setSocketEvent({ event, data });
    console.log("ЭТО В ОН ЭНИ", event, data);
  });

  useEffect(() => {
    if (!socketEvent) return;
    console.log(socketEvent, "looool");
    switch (socketEvent.event) {
      case "createRoom_success":
        createRoom_success();
        break;

      case "joinRoom__success":
        joinRoom__success();
        break;
      case "newUserInRoom":
        newUserInRoom();
        break;

      case "userLeave":
        userLeave();
        break;

      case "play":
        playPlayer();
        break;

      case "pause":
        pausePlayer();
        break;

      case "seek":
        seekPlayer();
        break;

      case "getPlayerState":
        getPlayerState();
        break;

      case "hostPlayerState":
        hostPlayerState();
        break;

      default:
        break;
    }
  }, [socketEvent]);

  const createRoom_success = () => {
    roomId.current = socketEvent.data.roomId;
    setIsHost(true);
    console.log(socketEvent);
  };

  const joinRoom__success = () => {
    setUsers(socketEvent.data);
    setIsRoomConnected(true);
    console.log("УСПЕШНО ПОДКЛЮЧИЛИСЬ К КОМНАТЕ");
  };

  const newUserInRoom = () => {
    setUsers([...users, socketEvent.data.newUser]);
  };

  const userLeave = () => {
    setUsers(users.filter((user) => user.userId !== socketEvent.data));
  };

  const playPlayer = () => {
    console.log("PLAAAAAY");
    const player = document.querySelector("iframe");
    player.contentWindow.postMessage({ api: "play" }, "*");
  };

  const pausePlayer = () => {
    const player = document.querySelector("iframe");
    player.contentWindow.postMessage({ api: "pause" }, "*");
  };

  const seekPlayer = () => {
    const player = document.querySelector("iframe");
    player.contentWindow.postMessage(
      { api: "seek", time: socketEvent.data },
      "*"
    );
  };

  const getPlayerState = () => {
    socket.emit("hostPlayerState", {
      userId: socketEvent.data,
      time: playerTime.current,
      state: playerState.current,
    });
  };

  const hostPlayerState = () => {
    console.log(socketEvent.data, "eee");
    const player = document.querySelector("iframe");

    player.contentWindow.postMessage(
      { api: "seek", time: socketEvent.data.time },
      "*"
    );
    if (socketEvent.data.state === "pause") {
      player.contentWindow.postMessage({ api: "pause" }, "*");
    }
  };

  const openVoiceChat = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        localStreamRef.current = stream;

        const newPeerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        newPeerConnection.addTrack(stream.getAudioTracks()[0], stream);

        newPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("iceCandidate", event.candidate);
          }
        };

        newPeerConnection.ontrack = (event) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        };

        newPeerConnection
          .createOffer()
          .then((offer) => newPeerConnection.setLocalDescription(offer))
          .then(() => socket.emit("offer", newPeerConnection.localDescription));

        setPeerConnection(newPeerConnection);
      })
      .catch((error) => console.error("Ошибка доступа к микрофону:", error));
  };

  useEffect(() => {
    if (!socket) return;

    // Получаем предложение от другого пользователя
    socket.on("offer", (offer) => {
      if (peerConnection) {
        peerConnection
          .setRemoteDescription(new RTCSessionDescription(offer))
          .then(() => peerConnection.createAnswer())
          .then((answer) => {
            return peerConnection.setLocalDescription(answer);
          })
          .then(() => {
            socket.emit("answer", peerConnection.localDescription);
          })
          .catch((error) =>
            console.error("Ошибка обработки предложения:", error)
          );
      } else {
        console.error("peerConnection не инициализирован.");
      }
    });

    // Получаем ответ от другого пользователя
    socket.on("answer", (answer) => {
      if (peerConnection) {
        peerConnection
          .setRemoteDescription(new RTCSessionDescription(answer))
          .catch((error) => console.error("Ошибка обработки ответа:", error));
      } else {
        console.error("peerConnection не инициализирован.");
      }
    });

    // Получаем ICE кандидатов
    socket.on("iceCandidate", (candidate) => {
      if (peerConnection) {
        peerConnection
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch((error) =>
            console.error("Ошибка добавления ICE кандидата:", error)
          );
      } else {
        console.error("peerConnection не инициализирован.");
      }
    });
  }, [socket, peerConnection]);

  const playerListener = (event) => {
    if (!socket) return;

    if (!isHost) {
      if (event.data.event === "start") {
        console.log(
          "ЗАПУСТИЛИ ПЛЕЕР И ОТАРВИЛИ ЗАПРОС НА ПОЛУЧЕНИЕ ПЛЕЕРА ХОСТА"
        );
        socket.emit("getPlayerState");
      }
      return false;
    }

    switch (event.data.event) {
      case "time":
        playerTime.current = event.data.time;
        break;
      case "play":
      case "start":
        socket.emit("play");
        playerState.current = "play";
        break;

      case "pause":
        playerState.current = "pause";
        playerTime.current = event.data.time;
        socket.emit("pause");

        break;

      case "seek":
        playerTime.current = event.data.time;
        socket.emit("seek", event.data.time);

        break;
    }
  };

  if (isLoading) return <div>Loading</div>;

  window.addEventListener("message", playerListener);

  return (
    <>
      <Head>
        <title>KinoWatch - смотри фильмы с друзьями! </title>
      </Head>
      <main className={`${styles.container} container`}>
        <h1>
          {film?.nameRu} - {userId.current}
        </h1>
        <KinoboxPlayer kpId={queryParams.id} posterUrl={film?.posterUrl} />
        <button onClick={createRoom} disabled={isHost || queryParams.roomId}>
          Создать комнату
        </button>

        <button onClick={openVoiceChat}>Подключить голосовуху</button>

        <div>
          {isRoomConnected && <p>Вы подключились к комнате {roomId.current}</p>}
          {isHost && (
            <div>
              <p>Вы создали комнату с id {roomId.current}</p>
              {/* <h2>Локально</h2>
              <a
                href={`http://localhost:3000/kinoWatch/movie?id=${queryParams.id}&roomId=${roomId.current}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Перейти в комнату
              </a> */}
              <h2>Прод</h2>
              <a
                href={`https://khanbank.onrender.com/movie?id=${queryParams.id}&roomId=${roomId.current}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Перейти в комнату
              </a>
            </div>
          )}
        </div>

        <ul>
          {users?.map((user, index) => (
            <li key={index}>
              <p>{user.username}</p>
            </li>
          ))}
        </ul>

        <audio ref={remoteAudioRef} autoPlay />
      </main>
    </>
  );
};

export default Movie;
