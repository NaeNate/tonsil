const socket = io()

const board = document.querySelector("#board")
const pieces = {
  P: "♙",
  N: "♘",
  B: "♗",
  R: "♖",
  Q: "♕",
  K: "♔",
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
}

for (let i = 0; i < 8; i++) {
  for (let j = 0; j < 8; j++) {
    const square = document.createElement("div")
    square.classList.add((i + j) % 2 === 0 ? "dark" : "light")
    square.classList.add("square")

    board.append(square)
  }
}

document.querySelector("#start").addEventListener("click", () => {
  const fen =
    document.querySelector("#fen").value ||
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

  socket.emit("start", {
    white: document.querySelector("#white").value,
    black: document.querySelector("#black").value,
    fen,
  })

  fen
    .split(" ")[0]
    .split("/")
    .forEach((block, row) => {
      let col = 0

      for (const char of block) {
        if (isNaN(char)) {
          const piece = document.createElement("div")
          piece.textContent = pieces[char]
          piece.classList.add("piece")

          board.children[row * 8 + col].appendChild(piece)

          col += 1
        } else {
          col += parseInt(char)
        }
      }
    })
})

const boardIndex = (coord) => {
  const file = coord[0]
  const rank = coord[1]

  const fileIndex = file.charCodeAt(0) - "a".charCodeAt(0)
  const rankIndex = 8 - parseInt(rank)

  return rankIndex * 8 + fileIndex
}

socket.on("engine", ({ side, out }) => {
  console.log(`%c${side}\n%c${out}`, "color: aquamarine", "color: inherit")

  for (const line of out.split("\n")) {
    const parts = line.split(" ")

    if (parts[0] === "bestmove") {
      const from = boardIndex(parts[1].slice(0, 2))
      const to = boardIndex(parts[1].slice(2, 4))

      const piece = board.children[from].children[0]
      board.children[from].removeChild(piece)
      board.children[to].appendChild(piece)
    }
  }
})

socket.on("checkmate", (side) => {
  document.querySelector("#win").textContent = side + " wins"
})
