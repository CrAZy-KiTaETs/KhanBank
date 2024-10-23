import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const Movie = () => {
  const [socket, setSocket] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  
  const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    // Подключаемся к серверу Socket.io
    const newSocket = io("ws://localhost:5000/", {
      transports: ["websocket"],
      forceNew: true,
    });
    setSocket(newSocket);

    // Запрашиваем доступ к микрофону и настраиваем WebRTC соединение
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        localStreamRef.current = stream;

        const newPeerConnection = new RTCPeerConnection(config);

        // Добавляем аудиотрек в соединение
        stream.getTracks().forEach((track) => {
          newPeerConnection.addTrack(track, stream);
        });

        // Обрабатываем ICE кандидатов
        newPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            newSocket.emit("iceCandidate", event.candidate);
          }
        };

        // Обрабатываем поток удаленного пользователя
        newPeerConnection.ontrack = (event) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        };

        // Создаем предложение и отправляем его через Socket.io
        newPeerConnection.createOffer()
          .then((offer) => {
            return newPeerConnection.setLocalDescription(offer);
          })
          .then(() => {
            newSocket.emit("offer", newPeerConnection.localDescription);
          });

        setPeerConnection(newPeerConnection);
      })
      .catch((error) => console.error("Ошибка доступа к микрофону:", error));

    // Очистка при размонтировании компонента
    return () => {
      if (socket) socket.disconnect();
      if (peerConnection) peerConnection.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
  
    // Получаем предложение от другого пользователя
    socket.on("offer", (offer) => {
      if (peerConnection) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
          .then(() => peerConnection.createAnswer())
          .then((answer) => {
            return peerConnection.setLocalDescription(answer);
          })
          .then(() => {
            socket.emit("answer", peerConnection.localDescription);
          })
          .catch((error) => console.error("Ошибка обработки предложения:", error));
      } else {
        console.error("peerConnection не инициализирован.");
      }
    });
  
    // Получаем ответ от другого пользователя
    socket.on("answer", (answer) => {
      if (peerConnection) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
          .catch((error) => console.error("Ошибка обработки ответа:", error));
      } else {
        console.error("peerConnection не инициализирован.");
      }
    });
  
    // Получаем ICE кандидатов
    socket.on("iceCandidate", (candidate) => {
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
          .catch((error) => console.error("Ошибка добавления ICE кандидата:", error));
      } else {
        console.error("peerConnection не инициализирован.");
      }
    });
  }, [socket, peerConnection]);
  

  return (
    <div>
      <h1>Голосовой чат</h1>
      <audio ref={remoteAudioRef} autoPlay />
    </div>
  );
};

export default Movie;
