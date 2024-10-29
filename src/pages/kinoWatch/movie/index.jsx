import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import styles from "./movie.module.scss";
import { useGetFilmByIdQuery } from "@/api/kinoPage/kinoApi";
import KinoboxPlayer from "./KinoboxPlayer";
import Head from "next/head";


const Movie = () => {
  const router = useRouter();
  const queryParams = router.query;
  const { film, isLoading } = useGetFilmByIdQuery(queryParams.id);

  const [socket, setSocket] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const userId = (queryParams.roomId + Math.random()) || 1;

  const [roomId, setRoomId] = useState(null);
  const [users, setUsers] = useState([{ username: "user", userId }]);



  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryRoomId = urlParams.get("roomId");
    const newSocket = io("ws://localhost:5000/", {
      transports: ["websocket"],
      forceNew: true,
    });
    setSocket(newSocket);

    if (queryRoomId) {
      console.log("ЕБАНАЯ КОМНАТА", queryRoomId);
      try {
        console.log("ОТПРАВИЛИ ЗАПРОС НА ПОДКЛЮЧЕНИЕ К КОМНАТЕ!!!!!!");
        newSocket.emit("joinRoom", {
          username: "user",
          roomId: queryRoomId,
          userId
        });
        setRoomId(queryRoomId);
      } catch (error) {
        alert("ошибка при подключении к комнате");
        console.log("ошибка при подключении к комнате", error);
      }
    }

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
            newSocket.emit("iceCandidate", event.candidate);
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
          .then(() =>
            newSocket.emit("offer", newPeerConnection.localDescription)
          );

        setPeerConnection(newPeerConnection);
      })
      .catch((error) => console.error("Ошибка доступа к микрофону:", error));

    return () => {
      if (socket) socket.disconnect();
      if (peerConnection) peerConnection.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("offer", (offer) => {
      if (peerConnection) {
        peerConnection
          .setRemoteDescription(new RTCSessionDescription(offer))
          .then(() => peerConnection.createAnswer())
          .then((answer) => peerConnection.setLocalDescription(answer))
          .then(() => socket.emit("answer", peerConnection.localDescription))
          .catch((error) =>
            console.error("Ошибка обработки предложения:", error)
          );
      }
    });

    socket.on("answer", (answer) => {
      if (peerConnection) {
        peerConnection
          .setRemoteDescription(new RTCSessionDescription(answer))
          .catch((error) => console.error("Ошибка обработки ответа:", error));
      }
    });

    socket.on("iceCandidate", (candidate) => {
      if (peerConnection) {
        peerConnection
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch((error) =>
            console.error("Ошибка добавления ICE кандидата:", error)
          );
      }
    });

    socket.on("createRoom_success", ({ roomId }) => {
      setRoomId(roomId);
      console.log(roomId);
    });

    socket.on("newUserInRoom", (newUserInfo) => {
      console.log(newUserInfo, 'newUserInRoom');
      newUserInRoom(newUserInfo.newUser)
    });

    socket.on("joinRoom__success", (data) => {
      console.log(data, "joinRoom__success");
      joinRoom__success(data)
    });

    socket.on("userLeave", (id) => {
      console.log(id, "userLeave");
      removeUser(id)
    });
  }, [socket, peerConnection]);


  const newUserInRoom = (msg) => {
    setUsers(prev => [...prev, msg])
  }
  const joinRoom__success = (msg) => {
    setUsers(msg)
  }

  const removeUser = (id) => {
    setUsers(users.filter(user => user.userId !== id))
    console.log(users, 'УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ');
  }




  function joinRoom1() {
    if (socket) socket.emit("joinRoom", { userId, roomId: 1 });
  }

  function joinRoom2() {
    if (socket) socket.emit("joinRoom", { userId, roomId: 2 });
  }

  function createRoom() {
    if (socket) socket.emit("createRoom", { users, userId });
  }

  function funBtn() {
    console.log(userId, users);
  }
  if (isLoading) return <div>loading</div>;

  return (
    <>
          <Head>
        <title>KinoWatch - смотри фильмы с друзьями! </title>
      </Head>
    <div>
      <p>{userId}</p>
      <h1>Голосовой чат</h1>
      <KinoboxPlayer kpId={queryParams.id} posterUrl={film?.posterUrl} />

      <audio ref={remoteAudioRef} autoPlay />
      <button onClick={createRoom}>CREATE</button>
      <button onClick={joinRoom1}>JOIN ROOM 1</button>
      <button onClick={joinRoom2}>JOIN ROOM 2</button>
      <button onClick={funBtn}>FUN BUTTON</button>

      <div>
        {roomId && (
          <h2>
            <a
              href={`http://localhost:3000/kinoWatch/movie?id=${queryParams.id}&roomId=${roomId}`}
              target="_blank"
            >
              Вы подключились к комнате {roomId}
            </a>
          </h2>
        )}
      </div>

      <ul>
        {users?.map((user, index) => (
          <li key={index}>
            <p>{user.username}</p>
          </li>
        ))}
      </ul>
    </div>
    </>
  );
};

export default Movie;
