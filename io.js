const PORT = process.env.PORT || 5000;
const express = require("express");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

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
  });
  

server.listen(PORT);
