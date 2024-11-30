import { Chess } from "chess.js"
import { spawn } from "child_process"
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"

const app = express()
const server = createServer(app)
const io = new Server(server)

let chess = null
let sides = { white: null, black: null }
let start = false
let log = ["position", "startpos", "moves"]

io.on("connection", (socket) => {
  socket.on("start", ({ white, black, fen }) => {
    chess = new Chess(fen)
    sides = { white: null, black: null }

    for (const [index, path] of [white, black].entries()) {
      if (path) {
        const engine = spawn(path)
        const side = index ? "black" : "white"

        engine.stdout.on("data", (out) => handle(side, out.toString()))
        write(engine, "uci")
        engine.stderr.on("data", (err) => console.log(err.toString()))

        sides[side] = engine
      }
    }
  })
})

const handle = (side, out) => {
  out = out.trim()

  out.split("\n").forEach((line) => {
    const parts = line.split(" ")
    const command = parts[0]

    if (command === "uciok") {
      write(sides[side], "isready")
    } else if (command === "readyok") {
      write(sides[side], "ucinewgame")

      start
        ? (write(sides.white, "position startpos"), write(sides.white, "go"))
        : (start = true)
    } else if (command === "bestmove") {
      chess.move(parts[1])
      log.push(parts[1])

      let other = side === "white" ? "black" : "white"
      write(sides[other], log.join(" "))
      write(sides[other], "go")
    }
  })

  io.emit("engine", { side, out })
}

const write = (engine, input) => engine.stdin.write(input + "\n")

app.use(express.static("public"))
server.listen(3000)
