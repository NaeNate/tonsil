const socket = io()

document.querySelector("#start").addEventListener("click", () => {
  socket.emit("start", {
    white: document.querySelector("#white").value,
    black: document.querySelector("#black").value,
  })
})
