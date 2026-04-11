let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	spawnCompanion: (url) => electron.ipcRenderer.send("spawn-companion", url),
	closeCompanion: () => electron.ipcRenderer.send("close-companion"),
	companionSpeak: (text) => electron.ipcRenderer.send("companion-speak", text),
	onLoadVrm: (callback) => {
		electron.ipcRenderer.on("load-vrm", (_event, url) => callback(url));
	},
	onAgentSpeak: (callback) => {
		electron.ipcRenderer.on("agent-speak", (_event, text) => callback(text));
	},
	onGlobalMouseMove: (callback) => {
		electron.ipcRenderer.on("global-mouse-move", (_event, data) => callback(data));
	}
});
//#endregion
