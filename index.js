const express = require("express");

const app = express();
const WSServer = require("express-ws")(app);
const aWss = WSServer.getWss();
const PORT = process.env.PORT || 5000;

const createUser = (ws, msg) => {
  ws.id = msg.userId;
  ws.username = msg.username;
  console.log(
    `Записались данные в клиент,
    id - ${ws.id},
    username - ${ws.username}`
  );
  ws.send(JSON.stringify({ msg: "Пользователь создан" }));
};

const createRoom = (ws, msg) => {
  ws.id = msg.userId;
  ws.roomId = msg.roomId;
  ws.username = msg.username;
  ws.isHost = msg.isHost;
  console.log(
    `Записались данные в клиент,
    id - ${ws.id},
    roomId = ${ws.roomId},
    username = ${ws.username},
    isHost - ${ws.isHost},`
  );
  ws.send(JSON.stringify({ msg: "Комната создана" }));
};

const reqHostPLayer = (client, userId) => {
  client.send(
    JSON.stringify({
      event: "getPlayerState",
      msg: "Запрос на получение данных о плеере",
      userId: userId
    })
  );
};

const getHostPlayerState = (ws, msg) => {
  for (const client of aWss.clients) {
    if (client.id === msg.userId) {
      client.send(
        JSON.stringify(msg)
      );
      console.log("отправили полученные от хоста данные о плеере", msg);
      
    }
  }

};

const connectToTheRoom = (ws, msg) => {
  for (const client of aWss.clients) {
    console.log(client.roomId);
    if (client.isHost && client.roomId === msg.roomId) {
      reqHostPLayer(client, msg.userId);
    }
  }
};

const playerHandler = (ws, msg) => {
  // msg = JSON.parse(msg);

  console.log("работа по плееру");

  // aWss.clients.forEach((client) => {
  //   console.log("да ну нафиг,", client.id);
  //   if (client.roomId === msg.roomId && client.id !== msg.userId) {
  //     client.send(JSON.stringify(msg));
  //   }
  // });
};

app.ws("/", (ws, req) => {
  console.log("Новый Вебсокет подключен");
  ws.on("message", (msg) => {
    msg = JSON.parse(msg);

    switch (msg.event) {
      case "createUser":
        createUser(ws, msg);
        break;
      case "createRoom":
        createRoom(ws, msg);
        break;

      case "connectToTheRoom":
        connectToTheRoom(ws, msg);
        break;

      case "sendHostPlayerState":
        getHostPlayerState(ws, msg)
        // sendHostPlayerState
        // createUser(ws, msg);
        break;
    }
    if (msg.event === "create") {
      createUser(ws, msg);
    }

    if (msg.event === "connect") {
      connectToTheRoom(ws, msg);
    }

    if (msg.event === "player") {
      playerHandler(ws, msg);
    }
  });
});

const roomConnection = (ws, msg) => {
  if (msg.event === "connect") {
    console.log("Идет подключение к комнате...");
    connectToTheRoom(ws, msg);
    // aWss.clients.forEach((client) => {
    //   if (client.roomId === msg.roomId && client.isHost) {
    //     console.log("Подключение к комнате прошло УСПЕШНО");
    //     client.send(
    //       JSON.stringify({
    //         event: "player",
    //         play: client.play,
    //         time: client.time,
    //       })
    //     );
    //   } else {
    //     client.send(
    //       JSON.stringify({
    //         event: "error",
    //       })
    //     );
    //   }
    // });
  }

  // aWss.clients.forEach((client) => {
  //   // console.log("Сработала функция roomConnection", client.id);
  //   // playerSynchronization(client, msg)
  //   console.log("да ну нафиг,", client.id);
  //   if (client.roomId === msg.roomId) {
  //     client.send(JSON.stringify(msg));
  //   } else {
  //     client.send(JSON.stringify({ event: "error" }));
  //   }
  // });
};

// const playerSynchronization = (client, msg) => {
//   if (client.id === msg.roomId && !msg.isHost) {
//     client.send(JSON.stringify(msg));
//   }
// };

// const createRoom = (ws, msg) => {
//   ws.id = msg.userId;
//   ws.roomId = msg.roomId;
//   ws.username = msg.username;
//   ws.isHost = msg.isHost;
//   console.log(`Комната #${msg.roomId} создана. Хост - ${msg.username}`);
// };

app.listen(PORT, () => console.log("Сервер запущен на порту", PORT));
