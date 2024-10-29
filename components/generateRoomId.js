 function generateRoomId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 12 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
  }

  module.exports = generateRoomId