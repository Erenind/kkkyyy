const {app, BrowserWindow, nativeTheme, ipcMain, powerMonitor} = require('electron')
const fs = require('fs')
const path = require('path')
const os = require('os')

const DATA_DIR = path.join(os.homedir(), '.local/share/kkkyyy')
const DATA_FILE = path.join(DATA_DIR, 'code-time.json')
const HEARTBEAT_INTERVAL = 30000
const STALE_THRESHOLD = 120000

let win = null
let heartbeatTimer = null

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true})
  }
}

function readData() {
  ensureDataDir()
  if (!fs.existsSync(DATA_FILE)) {
    const empty = {sessions: [], activeStart: null, lastHeartbeat: null}
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2), 'utf-8')
    return empty
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  if (data.activeStart && data.lastHeartbeat && Date.now() - data.lastHeartbeat > STALE_THRESHOLD) {
    data.sessions.push({start: data.activeStart, end: data.lastHeartbeat})
    data.activeStart = null
    data.lastHeartbeat = null
    writeData(data)
  }
  return data
}

function writeData(data) {
  ensureDataDir()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

function endActiveSession() {
  const data = readData()
  if (!data.activeStart) return null
  data.sessions.push({start: data.activeStart, end: Date.now()})
  data.activeStart = null
  data.lastHeartbeat = null
  writeData(data)
  return data
}

function startHeartbeat() {
  if (heartbeatTimer) return
  heartbeatTimer = setInterval(() => {
    const data = readData()
    if (data.activeStart) {
      data.lastHeartbeat = Date.now()
      writeData(data)
    }
  }, HEARTBEAT_INTERVAL)
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

ipcMain.handle('read-code-time', async () => {
  return readData()
})

ipcMain.handle('start-session', async () => {
  const data = readData()
  if (data.activeStart) return data
  data.activeStart = Date.now()
  data.lastHeartbeat = Date.now()
  writeData(data)
  startHeartbeat()
  return data
})

ipcMain.handle('end-session', async () => {
  const result = endActiveSession()
  if (!result) return readData()
  return result
})

const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark'
  createWindow()
  startHeartbeat()
})

powerMonitor.on('suspend', () => {
  endActiveSession()
  if (win && !win.isDestroyed()) {
    win.webContents.send('auto-end-session')
  }
})

app.on('will-quit', () => {
  stopHeartbeat()
  endActiveSession()
})
