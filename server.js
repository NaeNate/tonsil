import { spawn } from "child_process"
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"

const app = express()
const server = createServer(app)
const io = new Server(server)

let engines = []

io.on("connection", (socket) => {
  socket.on("start", ({ white, black }) => {
    engines = []

    if (white) {
      engines[0] = spawn(white)
    }

    if (black) {
      engines[1] = spawn(black)
    }
  })
})

app.use(express.static("public"))
server.listen(3000)
