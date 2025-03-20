const { app, BrowserWindow } = require('electron')

let mainWindow

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
    },
  })

  mainWindow.setMenu(null)

  mainWindow.loadURL('http://localhost:3001')

  mainWindow.on('closed', () => {
    mainWindow = null
  })
})
