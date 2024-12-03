import { Chess } from "chess.js"
import { spawn } from "child_process"
import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"

const app = express()
const server = createServer(app)
const io = new Server(server)

const write = (engine, input) => engine.stdin.write(input + "\n")
const reset = (fen) => {
  chess = fen ? new Chess(fen) : new Chess()
  sides = { white: null, black: null }
  log = ["position", "startpos", "moves"]
  ready = false
}

let chess, sides, log, ready
reset()

io.on("connection", (socket) => {
  socket.on("start", ({ white, black, fen }) => {
    reset(fen)

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

  socket.on("stop", () => {
    if (sides.white) write(sides.white, "quit")
    if (sides.black) write(sides.black, "quit")
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

      if (ready) {
        write(sides.white, "position startpos")
        write(sides.white, "go")
      } else {
        ready = true
      }
    } else if (command === "bestmove") {
      chess.move(parts[1])

      if (chess.isCheckmate()) {
        write(sides.white, "quit")
        write(sides.black, "quit")

        io.emit("checkmate", side)
      } else {
        log.push(parts[1])

        let other = side === "white" ? "black" : "white"

        setTimeout(() => {
          write(sides[other], log.join(" "))
          write(sides[other], "go")
        }, 1000)
      }
    }
  })

  io.emit("engine", { side, out })
}

app.use(express.static("public"))
server.listen(3000)
