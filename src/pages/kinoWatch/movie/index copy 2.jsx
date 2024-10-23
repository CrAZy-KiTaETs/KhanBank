import Head from "next/head";
import KinoboxPlayer from "./KinoboxPlayer";
import styles from "./movie.module.scss";
import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useGetFilmByIdQuery } from "@/api/kinoPage/kinoApi";

import { io } from "socket.io-client";

export default function Movie() {
  const router = useRouter();
  const { id, roomId: queryRoomId } = router.query;
  const { data, isLoading } = useGetFilmByIdQuery(id);
  const [userId] = useState(() => Math.floor(Math.random() * 1000000));
  const [isRoomConnected, setIsRoomConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);

  const playerTime = useRef(0);
  const playerState = useRef("pause");
  const roomId = useRef(null);
  // const socket = useRef(null);
  const socket = io("ws://localhost:5000/", {
      transports: ["websocket"],
      forceNew: true,
    });

    let localStream;
let peerConnection;
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};



// Запрос доступа к микрофону
navigator.mediaDevices.getUserMedia({ audio: true })
  .then((stream) => {
    localStream = stream;

    // Создание соединения WebRTC
    peerConnection = new RTCPeerConnection(config);
    
    // Добавляем аудиотрек в соединение
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Обрабатываем ICE кандидатов
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", event.candidate);
      }
    };

    // Обработка удаленного потока
    peerConnection.ontrack = (event) => {
      const remoteAudio = document.getElementById("remoteAudio");
      remoteAudio.srcObject = event.streams[0];
    };

    // Обрабатываем предложение WebRTC
    peerConnection.createOffer()
      .then((offer) => {
        peerConnection.setLocalDescription(offer);
        socket.emit("offer", offer);
      });
  })
  .catch((error) => console.error("Ошибка доступа к микрофону:", error));

// Получение предложения от другого участника
socket.on("offer", (offer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  peerConnection.createAnswer()
    .then((answer) => {
      peerConnection.setLocalDescription(answer);
      socket.emit("answer", answer);
    });
});

// Получение ответа
socket.on("answer", (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Обработка ICE кандидатов
socket.on("iceCandidate", (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});



  // useEffect(() => {
  //   // Инициализация сокета при загрузке компонента
  //   // socket.current = new WebSocket("ws://localhost:5000/");
  //   socket.current = io("ws://localhost:5000/", {
  //     transports: ["websocket"],
  //     forceNew: true,
  //   });

  //   return () => {
  //     // Закрытие соединения при размонтировании компонента
  //     if (socket.current) {
  //       socket.current.close();
  //     }
  //   };
  // }, [userId]);

  const handleSocketMessages = (msg) => {
    const iframe = document.querySelector("iframe");

    switch (msg.event) {
      case "reqPlayerState":
        socket.current.send(
          JSON.stringify({
            event: "resHostPlayerState",
            state: playerState.current || "pause",
            time: playerTime.current,
            userId: msg.userId,
          })
        );
        break;
      case "sendHostPlayerState":
        iframe?.contentWindow.postMessage({ api: "seek", time: msg.time }, "*");
        break;
      case "getHostPlayerState":
        socket.current.send(
          JSON.stringify({
            event: "sendHostPlayerState",
            state: playerState.current,
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
        handlePlayerControl(msg, iframe);
        break;
      default:
        break;
    }
  };

  const handlePlayerControl = (msg, iframe) => {
    switch (msg.playerState) {
      case "play":
        iframe?.contentWindow.postMessage({ api: "play" }, "*");
        break;
      case "pause":
        iframe?.contentWindow.postMessage({ api: "pause" }, "*");
        break;
      case "seek":
        iframe?.contentWindow.postMessage({ api: "seek", time: msg.time }, "*");
        break;
      default:
        break;
    }
  };

  const createRoom = () => {
    socket.current?.send(
      JSON.stringify({
        isHost: true,
        event: "createRoom",
        userId,
        username: `React ${userId}`,
      })
    );
  };

  const connectRoom = () => {
    if (queryRoomId) {
      socket.current?.send(
        JSON.stringify({
          event: "Connect to the room",
          userId,
          roomId: queryRoomId,
          username: `Connected React ${userId}`,
          isHost: false,
        })
      );
    }
  };

  useEffect(() => {
    if (queryRoomId) {
      roomId.current = queryRoomId;
      connectRoom();
    }
  }, [queryRoomId]);

  const playerListener = (event) => {
    if (!isHost) {
      if (roomId.current && event.data.event === "start") {
        socket.current.send(
          JSON.stringify({
            event: "getHostPlayerState",
            userId,
            roomId: roomId.current,
            username: `Connected React ${userId}`,
          })
        );
      }
      return;
    }

    switch (event.data.event) {
      case "time":
        playerTime.current = event.data.time;
        break;
      case "play":
      case "start":
        handlePlayerAction("play", event.data.time);
        break;
      case "pause":
        handlePlayerAction("pause", event.data.time);
        break;
      case "seek":
        handlePlayerAction("seek", event.data.time);
        break;
      default:
        break;
    }
  };

  const handlePlayerAction = (action, time) => {
    playerTime.current = time;
    socket.current.send(
      JSON.stringify({
        event: "play",
        roomId: roomId.current,
        playerState: action,
        userId,
        time,
      })
    );
  };

  useEffect(() => {
    window.addEventListener("message", playerListener);
    return () => window.removeEventListener("message", playerListener);
  }, [isHost]);


  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef(null);
  const audioInputRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const startRecording = () => {
    // Проверяем поддержку браузером getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Инициализируем аудиоконтекст
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;

          // Создаем аудиопоток из микрофона
          const source =
            audioContextRef.current.createMediaStreamSource(stream);

          // Подключаем источник к выходу устройства (динамики)
          source.connect(audioContextRef.current.destination);

          setIsRecording(true);
        })
        .catch((err) => {
          console.error("Ошибка доступа к микрофону: ", err);
        });

      stream.getTracks;
    } else {
      alert("Ваш браузер не поддерживает запись аудио.");
    }
  };

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      // Останавливаем запись
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  function btnFn() {
    // navigator.mediaDevices
    //   .getUserMedia({ audio: true })
    //   .then((stream) => {
    //     const mediaRecorder = new MediaRecorder(stream);

    //     mediaRecorder.ondataavailable = (event) => {
    //       if (event.data.size > 0) {
    //         event.data.arrayBuffer().then((buffer) => {
    //           socket.current.emit("audioData", buffer);
    //         });
    //       }
    //     };

    //     mediaRecorder.start(250);
    //   })
    //   .catch((err) => {
    //     console.error("Ошибка доступа к микрофону:", err);
    //   });
  }

  return (
    <>
      <Head>
        <title>KinoWatch - смотри фильмы с друзьями!</title>
      </Head>
      <main className={`${styles.container} container`}>
        <h1>
          {data?.nameRu} - {userId}
        </h1>
        <KinoboxPlayer kpId={id} posterUrl={data?.posterUrl} />
        <button onClick={createRoom} disabled={isHost}>
          Создать комнату
        </button>
        <button onClick={connectRoom}>Подключится к комнате</button>
        <button onClick={btnFn}>РАБОЧАЯ КНОПКА</button>
        <button onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? "Остановить запись" : "Начать запись"}
        </button>
        <audio id="remoteAudio" autoplay></audio>
        {isRoomConnected && <p>Вы подключились к комнате {roomId.current}</p>}
        {isHost && (
          <div>
            <p>Вы создали комнату с id {roomId.current}</p>
            <a
              href={`http://localhost:3000/kinoWatch/movie?id=${id}&roomId=${roomId.current}`}
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
