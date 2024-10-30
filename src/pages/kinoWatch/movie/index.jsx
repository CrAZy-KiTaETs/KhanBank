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

  const userId = queryParams.roomId + Math.random() || 1;
  const [socket, setSocket] = useState(null);
  const roomId = useRef(null || queryParams.roomId);
  const [isRoomConnected, setIsRoomConnected] = useState(null);

  // FILMS
  const { data: film, isLoading } = useGetFilmByIdQuery(queryParams.id);
  const [isHost, setIsHost] = useState(false);
  const playerTime = useRef(0);
  const playerState = useRef("pause");

  // RTC
  const [peerConnection, setPeerConnection] = useState(null);
  const [users, setUsers] = useState([{ username: "user", userId }]);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const connectToSocket = () => {
    return io("ws://localhost:5000/", {
      transports: ["websocket"],
      forceNew: true,
    });
  };

  const createRoom = () => {
    let newSocket;
    try {
      newSocket = connectToSocket();
    } catch (error) {
      console.log("ОШБИКА ПРИ ПОДКЛЮЧЕНИИ К СОКЕТУ", error);
    }

    newSocket.emit("createRoom", { users, userId });
    setSocket(newSocket);
  };

  useEffect(() => {
    // Логика при подключении к комнате
    const urlParams = new URLSearchParams(window.location.search);
    const queryRoomId = urlParams.get("roomId");

    if (queryRoomId) {
      const newSocket = connectToSocket();
      setSocket(newSocket);
      try {
        console.log("ОТПРАВИЛИ ЗАПРОС НА ПОДКЛЮЧЕНИЕ К КОМНАТЕ!!!!!!");
        newSocket.emit("joinRoom", {
          username: "user",
          roomId: queryRoomId,
          userId,
        });
      } catch (error) {
        alert("ошибка при подключении к комнате");
        console.log("ошибка при подключении к комнате", error);
      }
    }
  }, []);

  const [socketEvent, setSocketEvent] = useState(null);

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
        console.log("АХУЕТЬ РЕАЛЬНО РАБОТАЕТ");
        socket.emit("lox")
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
        break;

      case "pause":
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
          {film?.nameRu} - {userId}
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
              <a
                href={`http://localhost:3000/kinoWatch/movie?id=${queryParams.id}&roomId=${roomId.current}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Перейти в комнату
              </a>
            </div>
          )}
        </div>

        <ul>
          {" "}
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

// const voiceOffer = () => {
//   if (peerConnection) {
//     peerConnection
//       .setRemoteDescription(new RTCSessionDescription(socketEvent.data))
//       .then(() => peerConnection.createAnswer())
//       .then((answer) => {
//         return peerConnection.setLocalDescription(answer);
//       })
//       .then(() => {
//         socket.emit("answer", peerConnection.localDescription);
//       })
//       .catch((error) =>
//         console.error("Ошибка обработки предложения:", error)
//       );
//   } else {
//     console.error("peerConnection не инициализирован.");
//   }
// };

// const voiceAnswer = () => {
//   if (peerConnection) {
//     peerConnection
//       .setRemoteDescription(new RTCSessionDescription(socketEvent.data))
//       .catch((error) => console.error("Ошибка обработки ответа:", error));
//   } else {
//     console.error("peerConnection не инициализирован.");
//   }
// };

// const voiceCandidate = () => {
//   if (peerConnection) {
//     peerConnection
//       .addIceCandidate(new RTCIceCandidate(socketEvent.data))
//       .catch((error) =>
//         console.error("Ошибка добавления ICE кандидата:", error)
//       );
//   } else {
//     console.error("peerConnection не инициализирован.");
//   }
// };

// import { useRouter } from "next/router";
// import React, { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";
// import styles from "./movie.module.scss";
// import { useGetFilmByIdQuery } from "@/api/kinoPage/kinoApi";
// import KinoboxPlayer from "./KinoboxPlayer";
// import Head from "next/head";

// const Movie = () => {
//   // ОБЩЕЕ
//   const router = useRouter();
//   const queryParams = router.query;
//   const [socket, setSocket] = useState(null);
//   const userId = queryParams.roomId + Math.random() || 1;
//   const roomId = useRef(null);

//   // FILMS
//   const { film, isLoading } = useGetFilmByIdQuery(queryParams.id);
//   const [isHost, setIsHost] = useState(false);
//   const playerTime = useRef(0);
//   const [isRoomConnected, setIsRoomConnected] = useState(null);
//   const playerState = useRef("pause");
//   // RTC

//   const [peerConnection, setPeerConnection] = useState(null);
//   const [users, setUsers] = useState([{ username: "user", userId }]);

//   const localStreamRef = useRef(null);
//   const remoteAudioRef = useRef(null);

//   // useEffect(() => {
//   //   const urlParams = new URLSearchParams(window.location.search);
//   //   const queryRoomId = urlParams.get("roomId");
//   //   const newSocket = io("ws://localhost:5000/", {
//   //     transports: ["websocket"],
//   //     forceNew: true,
//   //   });
//   //   setSocket(newSocket);

//   //   if (queryRoomId) {
//   //     console.log("ЕБАНАЯ КОМНАТА", queryRoomId);
//   //     try {
//   //       console.log("ОТПРАВИЛИ ЗАПРОС НА ПОДКЛЮЧЕНИЕ К КОМНАТЕ!!!!!!");
//   //       newSocket.emit("joinRoom", {
//   //         username: "user",
//   //         roomId: queryRoomId,
//   //         userId,
//   //       });
//   //       setRoomId(queryRoomId);
//   //     } catch (error) {
//   //       alert("ошибка при подключении к комнате");
//   //       console.log("ошибка при подключении к комнате", error);
//   //     }
//   //   }

//   //   navigator.mediaDevices
//   //     .getUserMedia({ audio: true })
//   //     .then((stream) => {
//   //       localStreamRef.current = stream;

//   //       const newPeerConnection = new RTCPeerConnection({
//   //         iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   //       });

//   //       newPeerConnection.addTrack(stream.getAudioTracks()[0], stream);

//   //       newPeerConnection.onicecandidate = (event) => {
//   //         if (event.candidate) {
//   //           newSocket.emit("iceCandidate", event.candidate);
//   //         }
//   //       };

//   //       newPeerConnection.ontrack = (event) => {
//   //         if (remoteAudioRef.current) {
//   //           remoteAudioRef.current.srcObject = event.streams[0];
//   //         }
//   //       };

//   //       newPeerConnection
//   //         .createOffer()
//   //         .then((offer) => newPeerConnection.setLocalDescription(offer))
//   //         .then(() =>
//   //           newSocket.emit("offer", newPeerConnection.localDescription)
//   //         );

//   //       setPeerConnection(newPeerConnection);
//   //     })
//   //     .catch((error) => console.error("Ошибка доступа к микрофону:", error));

//   //   return () => {
//   //     if (socket) socket.disconnect();
//   //     if (peerConnection) peerConnection.close();
//   //   };
//   // }, []);

//   useEffect(() => {
//     if (!socket) return;
//     const iframe = document.querySelector("iframe");

//     socket.on("offer", (offer) => {
//       if (peerConnection) {
//         peerConnection
//           .setRemoteDescription(new RTCSessionDescription(offer))
//           .then(() => peerConnection.createAnswer())
//           .then((answer) => peerConnection.setLocalDescription(answer))
//           .then(() => socket.emit("answer", peerConnection.localDescription))
//           .catch((error) =>
//             console.error("Ошибка обработки предложения:", error)
//           );
//       }
//     });

//     socket.on("answer", (answer) => {
//       if (peerConnection) {
//         peerConnection
//           .setRemoteDescription(new RTCSessionDescription(answer))
//           .catch((error) => console.error("Ошибка обработки ответа:", error));
//       }
//     });

//     socket.on("iceCandidate", (candidate) => {
//       if (peerConnection) {
//         peerConnection
//           .addIceCandidate(new RTCIceCandidate(candidate))
//           .catch((error) =>
//             console.error("Ошибка добавления ICE кандидата:", error)
//           );
//       }
//     });

//     socket.on("newUserInRoom", (newUserInfo) => {
//       console.log(newUserInfo, "newUserInRoom");
//       newUserInRoom(newUserInfo.newUser);
//     });

//     socket.on("userLeave", (id) => {
//       console.log(id, "userLeave");
//       removeUser(id);
//     });

//     // FILMS LOGIC

//     socket.on("createRoom_success", (data) => {
//       roomId.current = data.roomId;
//       setIsHost(true);
//       console.log(data);
//     });

//     socket.on("joinRoom__success", (data) => {
//       console.log(data, "joinRoom__success");
//       joinRoom__success(data);
//     });

//     socket.on("reqPlayerState", (msg) => {
//       console.log(
//         "пришел запрос на получение данных о плеере",
//         msg.userId,
//         playerTime,
//         playerTimeRef
//       );

//       socket.emit("resHostPlayerState", {
//         state: playerState ? playerState : "pause",
//         time: playerTimeRef.current,
//         userId: msg.userId,
//       });
//     });

//     socket.on("getHostPlayerState", (msg) => {
//       console.log("пришел запрос на получение данных о плеере", playerTime);

//       socket.send(
//         JSON.stringify({
//           event: "sendHostPlayerState",
//           state: playerState,
//           time: playerTime.current,
//           userId: msg.userId,
//         })
//       );
//     });

//     socket.on("sendHostPlayerState", (msg) => {
//       console.log("ЕБАТЬ, ПРИШЛИ ДАННЫЕ", msg);
//       iframe.contentWindow.postMessage({ api: "seek", time: msg.time }, "*");
//     });

//   }, [socket, peerConnection]);

//   const newUserInRoom = (msg) => {
//     setUsers((prev) => [...prev, msg]);
//   };
//   const joinRoom__success = (msg) => {
//     setUsers(msg);
//     setIsRoomConnected(true);

//   };

//   const removeUser = (id) => {
//     setUsers(users.filter((user) => user.userId !== id));
//     console.log(users, "УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ");
//   };

//   function joinRoom1() {
//     if (socket) socket.emit("joinRoom", { userId, roomId: 1 });
//   }

//   function joinRoom2() {
//     if (socket) socket.emit("joinRoom", { userId, roomId: 2 });
//   }

//   function createRoom() {
//     if (socket) socket.emit("createRoom", { users, userId });
//   }

//   function funBtn() {
//     console.log(userId, users);
//   }
//   if (isLoading) return <div>loading</div>;

//   return (
//     <>
//       <Head>
//         <title>KinoWatch - смотри фильмы с друзьями! </title>
//       </Head>
//       <div>
//         <p>{userId}</p>
//         <h1>Голосовой чат</h1>
//         {/* <KinoboxPlayer kpId={queryParams.id} posterUrl={film?.posterUrl} /> */}

//         <audio ref={remoteAudioRef} autoPlay />
//         <button onClick={createRoom2} disabled={isHost}>
//           Создать комнату
//         </button>{" "}
//         <button onClick={joinRoom1}>JOIN ROOM 1</button>
//         <button onClick={joinRoom2}>JOIN ROOM 2</button>
//         <button onClick={funBtn}>FUN BUTTON</button>

//         <div>
//           {isRoomConnected && <p>Вы подключились к комнате {roomId.current}</p>}
//           {isHost && (
//             <div>
//               <p>Вы создали комнату с id {roomId.current}</p>
//               <a
//                 href={`http://localhost:3000/kinoWatch/movie?id=${queryParams.id}&roomId=${roomId.current}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//               >
//                 Перейти в комнату
//               </a>
//             </div>
//           )}
//         </div>

//         <ul>
//           {users?.map((user, index) => (
//             <li key={index}>
//               <p>{user.username}</p>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </>
//   );
// };

// export default Movie;
