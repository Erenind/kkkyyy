const {app, BrowserWindow, nativeTheme, ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')
const os = require('os')

const DATA_DIR = path.join(os.homedir(), '.local/share/kkkyyy')
const DATA_FILE = path.join(DATA_DIR, 'code-time.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true})
  }
}

function readData() {
  ensureDataDir()
  if (!fs.existsSync(DATA_FILE)) {
    const empty = {sessions: [], activeStart: null}
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2), 'utf-8')
    return empty
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
}

function writeData(data) {
  ensureDataDir()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

ipcMain.handle('read-code-time', async () => {
  return readData()
})

ipcMain.handle('start-session', async () => {
  const data = readData()
  if (data.activeStart) return data
  data.activeStart = Date.now()
  writeData(data)
  return data
})

ipcMain.handle('end-session', async () => {
  const data = readData()
  if (!data.activeStart) return data
  const session = {start: data.activeStart, end: Date.now()}
  data.sessions.push(session)
  data.activeStart = null
  writeData(data)
  return data
})

const createWindow = () => {
  const win = new BrowserWindow({
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
})

app.on('will-quit', () => {
  const data = readData()
  if (data.activeStart) {
    data.sessions.push({start: data.activeStart, end: Date.now()})
    data.activeStart = null
    writeData(data)
  }
})
