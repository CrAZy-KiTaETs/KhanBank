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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  allowEIO3: true, // Если используете старую версию клиентской библиотеки
});

io.on("connection", (socket) => {
  console.log("Пользователь подключился", socket.id);

  socket.on("audioData", (audioBuffer) => {
    // Рассылаем аудиоданные всем другим пользователям
    socket.broadcast.emit("audioData", audioBuffer);
  });

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

  socket.on("createRoom", ({users, userId}) => {
    try {

      let roomId = generateRoomId();
      socket.join(roomId);
      socket.data.users = users;
      socket.data.userId = userId

      socket.emit("createRoom_success", { roomId });
      console.log(`Комната успешно создана под номером ${roomId}`);
    } catch (error) {
      console.log("Ошибка при создании комнаты", error);
    }
  });

  socket.on("joinRoom", async (userData) => {
    try {
      console.log(userData, "userData");

      socket.join(userData.roomId);
      const usersInRoom = await io.in(userData.roomId).fetchSockets();
      const host = usersInRoom[0];
      host.data.users?.push(userData.userInfo);

      socket
        .to(userData.roomId)
        .emit("newUserInRoom", {
          msg: `Подключился ${userData.userInfo.userId}`,
          newUser: userData.userInfo,
        });
      socket.emit("joinRoom__success", host.data.users);
      socket.data.userId = userData.userId
    } catch (error) {
      console.log("Ошибка при подключении к комнате", error, userData);
    }
  });


  socket.on("disconnect", () => {
    const disconnectedUserId = socket.data.userId


    console.log(disconnectedUserId, 'DISCONNECT');
    
  })
});




server.listen(PORT);
