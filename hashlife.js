document.body.innerHTML = `
  <style>
    body, input, button { text-align: center; font-family: monospace; }
    #canvas { border: 1px solid black; }
    #key { width: 40em; }
  </style>
  
  <h3>HASHLIFE</h3>
  <canvas id="canvas" width=256 height=256></canvas>
  <p>
    <input type="text" id="key" placeholder='32Byte Hex String'>
    <br/><br/>
    <button id="keygen">random</button>
  </p>
  <details>
    <summary>why?</summary>
    Digital identites usually come as 32byte keys.<br/>
    They're very hard for humans to read.<br/><br/> There are
    many algorithms that attempt to represent them as something
    meaningful but none have stuck so far.<br/>
    Some providers choose to abstract your key away using
    central registries, but that's the opposite of fun.<br/>
    So here's one more algo to throw onto the pile! :)<br/>
    - <a href="https://github.com/telamon/hashlife">@telamon</a>
  </details>
`

const BS = 16

// Take one step in the game of life
function step (grid) {
  // Calculate neighbor counts for each cell
  const n = []
  for (let x = 0; x < BS; x++) {
    n[x] = []
    for (let y = 0; y < BS; y++) {
      let count = 0
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i !== 0 || j !== 0) {
            count += grid[(x + i + BS) % BS][(y + j + BS) % BS]
          }
        }
      }
      n[x][y] = count
    }
  }

  // Generate the next state of the grid
  const newGrid = []
  for (let x = 0; x < BS; x++) {
    newGrid[x] = []
    for (let y = 0; y < BS; y++) {
      newGrid[x][y] = n[x][y] === 3 || (grid[x][y] && n[x][y] === 2) ? 1 : 0
    }
  }
  return newGrid
}

// Initialize the board using the 256 bits of the 32-byte key
function toBoard (key) {
  if (key.length !== 32) throw new Error('Key must be 32 bytes')
  const board = []
  for (let i = 0; i < BS; i++) {
    board[i] = []
    for (let j = 0; j < BS; j++) {
      const byteIndex = Math.floor((i * BS + j) / 8)
      const bitIndex = 7 - ((i * BS + j) % 8)
      board[i][j] = (key[byteIndex] >> bitIndex) & 1
    }
  }
  return board
}

function toU8 (hex) {
  if (hex.length % 2 !== 0) throw new Error('Uneven length')
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return arr
}
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

// Draw the board on the canvas
function draw (board, p = null, mix = 1) {
  const cellSize = canvas.width / BS
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (let x = 0; x < BS; x++) {
    for (let y = 0; y < BS; y++) {
      const v = !p
        ? board[x][y]
        : p[x][y] * (1.0 - mix) + board[x][y] * mix
      // fail-mix: this just looks like lcd-ghosting to me :/
      const c = Math.round((1 - v) * 255)
      ctx.fillStyle = `rgb(${c}, ${c}, ${c})`
      //ctx.fillRect(y * cellSize, x * cellSize, cellSize, cellSize)
      ctx.beginPath(); // Start a new path
      ctx.arc(y * cellSize + cellSize / 2, x * cellSize + cellSize / 2, cellSize / 2, 0, Math.PI * 2); // Draw a circle
      ctx.fill(); // Fill the circle
    }
  }
}

// Init / main
let board = toBoard(new Uint8Array(32))
let previous = null

document.getElementById('keygen').addEventListener('click', async () => {
  const key = await window.crypto.getRandomValues(new Uint8Array(32))
  const hex = Array.from(key).map(byte => byte.toString(16).padStart(2, '0')).join('')
  document.getElementById('key').value = hex
  board = toBoard(key)
})
document.getElementById('key').addEventListener('change', () => {
  board = toBoard(toU8(document.getElementById('key').value))                                                               
})
document.getElementById('canvas').addEventListener('click', () => {
  board = toBoard(toU8(document.getElementById('key').value)) 
})

let ptime = 0
let prog = 0
function loop (time) {
  prog += (time - ptime) / 50
  ptime = time
  if (prog > 1) {
    previous = board
    board = step(board)
    prog = 0
  }
  draw(board, previous, prog) 
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
