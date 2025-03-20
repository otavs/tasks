const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let backend

app.whenReady().then(() => {
  backend = spawn('node', ['todo/back/src/server.ts'], {
    cwd: path.join(__dirname, '..'),
    detached: false,
    stdio: 'inherit',
  })

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
    },
  })

  mainWindow.setMenu(null)

  mainWindow.loadURL('http://localhost:3006')

  mainWindow.on('closed', () => {
    mainWindow = null
    backend.kill()
  })
})

app.on('before-quit', () => {
  if (backend) {
    backend.kill()
  }
})
