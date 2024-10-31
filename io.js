const PORT = process.env.PORT || 5000;
const express = require("express");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const generateRoomId = require("./components/generateRoomId");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Пользователь подключился", socket.id);

  // Принимаем и пересылаем предложения WebRTC
  socket.on("offer", (offer) => {
    socket.broadcast.emit("offer", offer);
  });

  // Принимаем и пересылаем ответы WebRTC
  socket.on("answer", (answer) => {
    socket.broadcast.emit("answer", answer);
  });

  // Принимаем и пересылаем ICE кандидатов
  socket.on("iceCandidate", (candidate) => {
    socket.broadcast.emit("iceCandidate", candidate);
  });

  socket.on("createRoom", ({ users, userId }) => {
    try {
      let roomId = generateRoomId();
      socket.join(roomId);
      socket.data.users = users;
      socket.data.userId = userId;
      socket.data.roomId = roomId;
      socket.data.isHost = true;

      socket.emit("createRoom_success", { roomId });
      console.log(`Комната успешно создана под номером ${roomId}`);
    } catch (error) {
      console.log("Ошибка при создании комнаты", error);
    }
  });

  socket.on("joinRoom", async (userData) => {
    try {
      console.log("данные нового пользователя", userData);
      // добавляем в комнату
      socket.join(userData.roomId);
      // добавляем в сокет новые данные о пользователе
      socket.data.userId = userData.userId;
      socket.data.roomId = userData.roomId;
      // находим хоста кмонат
      const usersInRoom = await io.in(userData.roomId).fetchSockets();
      const host = usersInRoom[0];
      // добавляем данные нового пользователя в массив всех участников комнаты
      host.data.users?.push(userData);
      console.log(host.data.users, "пользователи в комнате");

      socket.to(userData.roomId).emit("newUserInRoom", {
        msg: `Подключился ${userData.userId}`,
        newUser: userData,
      });
      socket.emit("joinRoom__success", host.data.users);
    } catch (error) {
      console.log("Ошибка при подключении к комнате", error, userData);
    }
  });

  socket.on("play", () => {
    try {
      console.log("Сработал плей");
      socket.to(socket.data.roomId).emit("play");
    } catch (error) {
      console.log("Ошибка при воспроизведении плеера", error);
    }
  });

  socket.on("pause", () => {
    try {
      console.log("Сработала пауза");
      socket.to(socket.data.roomId).emit("pause");
    } catch (error) {
      console.log("Ошибка при воспроизведении плеера", error);
    }
  });

  socket.on("seek", (time) => {
    try {
      console.log("Сработала перемотка", time);
      socket.to(socket.data.roomId).emit("seek", time);
    } catch (error) {
      console.log("Ошибка при воспроизведении плеера", error);
    }
  });

  socket.on("getPlayerState", async () => {
    try {
      console.log("Кидаем запрос на плеер хоста");
      const usersInRoom = await io.in(socket.data.roomId).fetchSockets();
      const host = usersInRoom[0];
      console.log(host.id, socket.data.userId);
      host.emit("getPlayerState", socket.data.userId);
    } catch (error) {
      console.log("Ошибка при воспроизведении плеера", error);
    }
  });

  socket.on("hostPlayerState", async ({ userId, time, state }) => {
    try {
      console.log("Получили состояние плеера", userId, time, state);
      const usersInRoom = await io.in(socket.data.roomId).fetchSockets();
      const user = usersInRoom.find((user) => user.data.userId === userId);
      user.emit("hostPlayerState", { time, state });
      console.log(user);
      // host.emit("getPlayerState", socket.data.userId)
    } catch (error) {
      console.log("Ошибка при воспроизведении плеера", error);
    }
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.userId;
    const roomId = socket.data.roomId;
    if (roomId) {
      const usersInRoom = await io.in(roomId).fetchSockets();
      const host = usersInRoom[0];
      if (host?.data?.users) {
        host.data.users = host.data.users.filter(
          (user) => user.userId !== userId
        );
        io.to(roomId).emit("userLeave", userId);
      }
      console.log(userId, roomId, "DISCONNECT");
    }
  });
});

server.listen(PORT, () => {
  console.log("Сервер запущен на порту ", PORT);
});
