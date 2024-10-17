function stopPlayer() {
  const iframe = document.querySelector("iframe");

  iframe.contentWindow.postMessage({ api: "pause" }, "*");
}

function playPlayer() {
  const iframe = document.querySelector("iframe");

  iframe.contentWindow.postMessage({ api: "play" }, "*");
}

function seekPlayer(time) {
  const iframe = document.querySelector("iframe");

  iframe.contentWindow.postMessage({ api: "seek", time: time }, "*");
}

export default { stopPlayer, playPlayer, seekPlayer };
