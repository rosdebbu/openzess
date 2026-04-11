import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  spawnCompanion: (url: string) => ipcRenderer.send('spawn-companion', url),
  closeCompanion: () => ipcRenderer.send('close-companion'),
  companionSpeak: (text: string) => ipcRenderer.send('companion-speak', text),
  onLoadVrm: (callback: (url: string) => void) => {
    ipcRenderer.on('load-vrm', (_event, url) => callback(url))
  },
  onAgentSpeak: (callback: (text: string) => void) => {
    ipcRenderer.on('agent-speak', (_event, text) => callback(text))
  },
  onGlobalMouseMove: (callback: (coords: {x: number, y: number, width: number, height: number}) => void) => {
    ipcRenderer.on('global-mouse-move', (_event, data) => callback(data))
  }
})
