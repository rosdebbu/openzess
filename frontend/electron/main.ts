import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// When running inside a headless Linux environment (like WSL + Xvfb)
// Electron will fatally crash without these flags
if (process.platform === 'linux' && process.env.DISPLAY) {
  app.commandLine.appendSwitch('no-sandbox')
  app.commandLine.appendSwitch('disable-gpu')
  app.commandLine.appendSwitch('disable-dev-shm-usage')
  app.commandLine.appendSwitch('disable-software-rasterizer')
}

process.env.DIST = join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, '../public')

let win: BrowserWindow | null
let widgetWin: BrowserWindow | null
let mousePollInterval: NodeJS.Timeout | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
  })

  // By default, open Openzess Dashboard
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(process.env.DIST, 'index.html'))
  }
}

function createWidgetWindow(vrmUrl?: string) {
  if (widgetWin) {
    widgetWin.focus()
    if (vrmUrl) {
       widgetWin.webContents.send('load-vrm', vrmUrl);
    }
    return;
  }

  widgetWin = new BrowserWindow({
    width: 400,
    height: 600,
    transparent: true, // Breaks the 4th wall!
    frame: false,      // No title bar
    alwaysOnTop: true, // Floats above other apps
    hasShadow: false, 
    resizable: true,
    webPreferences: {
      preload: join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
  })

  if (VITE_DEV_SERVER_URL) {
    widgetWin.loadURL(`${VITE_DEV_SERVER_URL}desktop-widget`)
  } else {
    // In production we use hash routing or handle specific file loads, default to a param trick
    widgetWin.loadURL(`file://${join(process.env.DIST, 'index.html')}#/desktop-widget`)
  }

  widgetWin.webContents.on('did-finish-load', () => {
    if (vrmUrl) {
       widgetWin?.webContents.send('load-vrm', vrmUrl)
    }
  })

  widgetWin.on('closed', () => {
    widgetWin = null
    if (mousePollInterval) {
        clearInterval(mousePollInterval)
        mousePollInterval = null
    }
  })

  // Start Global Mouse Polling for Gaze Tracking
  if (!mousePollInterval) {
    mousePollInterval = setInterval(() => {
        if (widgetWin) {
            const point = screen.getCursorScreenPoint()
            const display = screen.getPrimaryDisplay()
            widgetWin.webContents.send('global-mouse-move', {
                x: point.x,
                y: point.y,
                width: display.bounds.width,
                height: display.bounds.height
            })
        }
    }, 33) // ~30 FPS tracking
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

// IPC Handlers
ipcMain.on('spawn-companion', (event, url) => {
   createWidgetWindow(url)
})

ipcMain.on('close-companion', () => {
   if (widgetWin) {
      widgetWin.close()
   }
})

ipcMain.on('companion-speak', (event, text) => {
   if (widgetWin) {
      widgetWin.webContents.send('agent-speak', text)
   }
})
