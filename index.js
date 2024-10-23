const express = require("express");
const app = express();
const WSServer = require("express-ws")(app);
const aWss = WSServer.getWss();
const PORT = process.env.PORT || 5000;

const EVENTS = {
  CREATE_ROOM: "createRoom",
  CONNECT_ROOM: "Connect to the room",
  GET_HOST_STATE: "getHostPlayerState",
  SEND_HOST_STATE: "sendHostPlayerState",
  PLAY: "play",
  STOP: "stop",
  SEEK: "seek",
};

function generatePassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 12 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
}

// Общая функция для отправки сообщений другим пользователям
const broadcastMessage = (roomId, excludeUserId, message) => {
  aWss.clients.forEach(client => {
    if (client.roomId === roomId && client.id !== excludeUserId) {
      client.send(JSON.stringify(message));
    }
  });
};

// Логика создания пользователя
const createUser = (ws, msg) => {
  ws.id = msg.userId;
  ws.username = msg.username;
  ws.roomId = msg.roomId;
  ws.isHost = msg.isHost;
  console.log(`Создан новый пользователь: id - ${ws.id}, username - ${ws.username}, roomId - ${ws.roomId}, isHost - ${ws.isHost}`);
  ws.send(JSON.stringify({ event: "Room connected successfully" }));
};

// Логика создания комнаты
const createRoom = (ws, msg) => {
  const roomId = generatePassword();
  ws.id = msg.userId;
  ws.roomId = roomId;
  ws.username = msg.username;
  ws.isHost = msg.isHost;
  console.log(`Комната создана: roomId = ${roomId}, username = ${ws.username}, isHost - ${ws.isHost}`);
  ws.send(JSON.stringify({ event: "Room created successfully", roomId }));
};

// Получение состояния хоста
const getHostPlayerState = (ws, msg) => {
  aWss.clients.forEach(client => {
    if (client.isHost && client.roomId === msg.roomId) {
      client.send(JSON.stringify(msg));
      console.log("Запрос на состояние плеера хоста", msg);
    }
  });
};

// Логика воспроизведения
const playOtherPlayers = (ws, msg) => {
  if (!ws.isHost) return;
  console.log("Воспроизведение плеера");
  broadcastMessage(msg.roomId, msg.userId, msg);
};

// Логика паузы
const stopOtherPlayers = (ws, msg) => {
  if (!ws.isHost) return;
  console.log("Пауза плеера");
  broadcastMessage(msg.roomId, msg.userId, msg);
};

// Логика перемотки
const seekOtherPlayers = (ws, msg) => {
  if (!ws.isHost) return;
  console.log("Перемотка плеера");
  broadcastMessage(msg.roomId, msg.userId, msg);
};

// Подключение к комнате
const connectToTheRoom = (ws, msg) => {
  const host = [...aWss.clients].find(client => client.isHost && client.roomId === msg.roomId);
  if (host) {
    createUser(ws, msg);
  } else {
    ws.send(JSON.stringify({ event: "error", message: "Host not found" }));
  }
};

app.ws("/", (ws, req) => {
  console.log("Новый Вебсокет подключен");
  ws.on("message", (msg) => {
    try {
      msg = JSON.parse(msg);

      switch (msg.event) {
        case EVENTS.CREATE_ROOM:
          createRoom(ws, msg);
          break;
        case EVENTS.CONNECT_ROOM:
          connectToTheRoom(ws, msg);
          break;
        case EVENTS.GET_HOST_STATE:
          getHostPlayerState(ws, msg);
          break;
        case EVENTS.SEND_HOST_STATE:
          aWss.clients.forEach(client => {
            if (client.id === msg.userId) {
              client.send(JSON.stringify(msg));
            }
          });
          break;
        case EVENTS.PLAY:
          playOtherPlayers(ws, msg);
          break;
        case EVENTS.STOP:
          stopOtherPlayers(ws, msg);
          break;
        case EVENTS.SEEK:
          seekOtherPlayers(ws, msg);
          break;
        default:
          ws.send(JSON.stringify({ event: "error", message: "Unknown event" }));
      }
    } catch (error) {
      console.error("Ошибка обработки сообщения:", error);
      ws.send(JSON.stringify({ event: "error", message: "Invalid message format" }));
    }
  });
});

app.listen(PORT, () => console.log("Сервер запущен на порту", PORT));
