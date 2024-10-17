const express = require("express");

const app = express();
const WSServer = require("express-ws")(app);
const aWss = WSServer.getWss();
const PORT = process.env.PORT || 5000;

function generatePassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  return password;
}

const createUser = (ws, msg) => {
  ws.id = msg.userId;
  ws.username = msg.username;
  ws.roomId = msg.roomId;

  console.log(
    `Создан новый пользователь,
    id - ${ws.id},
    username - ${ws.username}
    roomId - ${ws.roomId}
    
    `
  );
  ws.send(JSON.stringify({event: "Room connected successfully"}));
};

const createRoom = (ws, msg) => {
  const roomId = generatePassword();

  ws.id = msg.userId;
  ws.roomId = roomId;
  ws.username = msg.username;
  ws.isHost = msg.isHost;
  console.log(
    `Комната создана,
    id - ${ws.id},
    roomId = ${ws.roomId},
    username = ${ws.username},
    isHost - ${ws.isHost},`
  );
  ws.send(
    JSON.stringify({ event: "Room created successfully", roomId: roomId })
  );
};

const reqHostPLayer = (client, userId) => {
  console.log("Отправлен запрос на получение данных о плеере");

  client.send(
    JSON.stringify({
      event: "reqPlayerState",
      msg: "Запрос на получение данных о плеере",
      userId: userId,
    })
  );
};

const getHostPlayerState = (ws, msg) => {
  for (const client of aWss.clients) {
    if (client.id === msg.userId) {
      client.send(JSON.stringify(msg));
      console.log("отправили полученные от хоста данные о плеере", msg);
    }
  }
};

const connectToTheRoom = (ws, msg) => {
  for (const client of aWss.clients) {
    console.log("Подключение к комнате пользователя", client.roomId);
    if (client.isHost && client.roomId === msg.roomId) {
      createUser(ws, msg)
      // ws.send(JSON.stringify({ event: "Room connected successfully" }));
      // reqHostPLayer(client, msg.userId);
    }
  }
};



const playOtherPlayers = (ws, msg) => {
  console.log("Воспроизведение плеера");

  aWss.clients.forEach((client) => {
    console.log(
      client.roomId,
      msg.roomId,
      client.id,
      msg.userId,
      "перебираю клиентов"
    );

    if (client.roomId === msg.roomId && client.id !== msg.userId) {
      console.log("НАШЕЛ", client.id, msg.userId);

      client.send(JSON.stringify(msg));
    }
  });
};


const stopOtherPlayers = (ws, msg) => {
  console.log("Пауза плеера");

  aWss.clients.forEach((client) => {
    console.log(
      client.roomId,
      msg.roomId,
      client.id,
      msg.userId,
      "перебираю клиентов"
    );

    if (client.roomId === msg.roomId && client.id !== msg.userId) {
      console.log("НАШЕЛ", client.id, msg.userId);

      client.send(JSON.stringify(msg));
    }
  });
};

const seekOtherPlayers = (ws, msg) => {
  console.log("Перемотка плеера");

  aWss.clients.forEach((client) => {
    console.log(
      client.roomId,
      msg.roomId,
      client.id,
      msg.userId,
      "перебираю клиентов"
    );

    if (client.roomId === msg.roomId && client.id !== msg.userId) {
      console.log("НАШЕЛ", client.id, msg.userId);

      client.send(JSON.stringify(msg));
    }
  });
};
app.ws("/", (ws, req) => {
  console.log("Новый Вебсокет подключен");
  ws.on("message", (msg) => {
    msg = JSON.parse(msg);

    switch (msg.event) {
      // case "createUser":
      //   createUser(ws, msg);
      //   break;
      case "createRoom":
        createRoom(ws, msg);
        break;

      case "Connect to the room":
        connectToTheRoom(ws, msg);
        break;

      case "resHostPlayerState":
        getHostPlayerState(ws, msg);
        break;

      case "play":
        playOtherPlayers(ws, msg);
        break;

        // case "stop":
        //   stopOtherPlayers(ws, msg);
        //   break;

        //   case "seek":
        //     seekOtherPlayers(ws, msg);
        //     break;
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
