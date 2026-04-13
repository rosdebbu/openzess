import { BrowserWindow, app, ipcMain, screen } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
//#region electron/main.ts
var __dirname = dirname(fileURLToPath(import.meta.url));
if (process.platform === "linux" && process.env.DISPLAY) {
	app.commandLine.appendSwitch("no-sandbox");
	app.commandLine.appendSwitch("disable-gpu");
	app.commandLine.appendSwitch("disable-dev-shm-usage");
}
process.env.DIST = join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, "../public");
var win;
var widgetWin;
var mousePollInterval = null;
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function createWindow() {
	win = new BrowserWindow({
		icon: join(process.env.VITE_PUBLIC, "favicon.ico"),
		width: 1200,
		height: 800,
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
	else win.loadFile(join(process.env.DIST, "index.html"));
}
function createWidgetWindow(vrmUrl) {
	if (widgetWin) {
		widgetWin.focus();
		if (vrmUrl) widgetWin.webContents.send("load-vrm", vrmUrl);
		return;
	}
	widgetWin = new BrowserWindow({
		width: 400,
		height: 600,
		transparent: true,
		frame: false,
		alwaysOnTop: true,
		hasShadow: false,
		resizable: true,
		webPreferences: {
			preload: join(__dirname, "preload.mjs"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (VITE_DEV_SERVER_URL) widgetWin.loadURL(`${VITE_DEV_SERVER_URL}desktop-widget`);
	else widgetWin.loadURL(`file://${join(process.env.DIST, "index.html")}#/desktop-widget`);
	widgetWin.webContents.on("did-finish-load", () => {
		if (vrmUrl) widgetWin?.webContents.send("load-vrm", vrmUrl);
	});
	widgetWin.on("closed", () => {
		widgetWin = null;
		if (mousePollInterval) {
			clearInterval(mousePollInterval);
			mousePollInterval = null;
		}
	});
	if (!mousePollInterval) mousePollInterval = setInterval(() => {
		if (widgetWin) {
			const point = screen.getCursorScreenPoint();
			const display = screen.getPrimaryDisplay();
			widgetWin.webContents.send("global-mouse-move", {
				x: point.x,
				y: point.y,
				width: display.bounds.width,
				height: display.bounds.height
			});
		}
	}, 33);
}
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});
app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.whenReady().then(createWindow);
ipcMain.on("spawn-companion", (event, url) => {
	createWidgetWindow(url);
});
ipcMain.on("close-companion", () => {
	if (widgetWin) widgetWin.close();
});
ipcMain.on("companion-speak", (event, text) => {
	if (widgetWin) widgetWin.webContents.send("agent-speak", text);
});
//#endregion
