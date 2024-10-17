export default function useWebSocket(socket, msg) {
  switch (msg.event) {
    case "reqPlayerState":
      console.log("пришел запрос на получение данных о плеере", playerTimeRef);
      socket.send(
        JSON.stringify({
          event: "resHostPlayerState",
          state: playerState ? playerState : "pause",
          time: playerTimeRef.current,
          userId: msg.userId,
        })
      );
      console.log(" отправили данные о плеере", msg.userId, playerTime);
      break;

    case "sendHostPlayerState":
      playerHandler({ player: "seek", time: msg.time });
      break;

    case "Room created successfully":
      setIsRoomCreated(msg.roomId);
      break;

    default:
      break;
  }
}
