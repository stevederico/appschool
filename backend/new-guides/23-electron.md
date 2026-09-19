# Electron - Interview Ready Guide

**1. Fundamentals** - What It Is, Architecture (Main/Renderer Processes)

**2. Basic Setup** - Project Structure, Main Process, Renderer

**3. IPC Communication** - ipcMain, ipcRenderer, contextBridge

**4. Native Features** - Menus, Dialogs, Notifications, Tray

**5. Security** - Best Practices, contextIsolation, nodeIntegration

**6. Distribution** - Building, Packaging, Auto-Updates

**7. Interview Prep** - Common Questions

---

## What It Is

Electron is a framework for building cross-platform desktop applications using web technologies (HTML, CSS, JavaScript). Created by GitHub for the Atom editor, it combines Chromium (for rendering) with Node.js (for system access).

Write once, deploy to Windows, macOS, and Linux. Apps like VS Code, Slack, Discord, Figma, and Notion are built with Electron.

---

## Architecture

```
Electron Application
├── Main Process (Node.js)
│   ├── System APIs
│   ├── File system
│   ├── Native menus
│   └── Window management
│
└── Renderer Process(es) (Chromium)
    ├── HTML/CSS/JavaScript
    ├── Web APIs
    └── UI rendering
```

**Main Process**: One per app. Controls lifecycle, creates windows, accesses system APIs.

**Renderer Process**: One per window. Runs web page, isolated for security.

**IPC (Inter-Process Communication)**: Main and renderer communicate via messages.

---

## Basic Setup

```bash
mkdir my-app && cd my-app
npm init -y
npm install electron --save-dev
```

```json
// package.json
{
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

```javascript
// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  onMessage: (channel, callback) => ipcRenderer.on(channel, callback),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});
```

---

## IPC Communication

```javascript
// main.js
const { ipcMain } = require('electron');

// Handle invoke (async, returns result)
ipcMain.handle('read-file', async (event, filePath) => {
  const fs = require('fs').promises;
  return await fs.readFile(filePath, 'utf8');
});

// Handle send (one-way)
ipcMain.on('log-message', (event, message) => {
  console.log('From renderer:', message);
  event.reply('log-response', 'Message received');
});
```

```javascript
// renderer.js (via preload)
const content = await window.electronAPI.invoke('read-file', '/path/to/file');

window.electronAPI.sendMessage('log-message', 'Hello from renderer');
window.electronAPI.onMessage('log-response', (event, data) => {
  console.log(data);
});
```

---

## Native Features

### Menus

```javascript
const { Menu } = require('electron');

const template = [
  {
    label: 'File',
    submenu: [
      { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => {} },
      { label: 'Open', accelerator: 'CmdOrCtrl+O', click: () => {} },
      { type: 'separator' },
      { role: 'quit' }
    ]
  },
  { role: 'editMenu' },
  { role: 'viewMenu' }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
```

### Dialogs

```javascript
const { dialog } = require('electron');

// Open file
const result = await dialog.showOpenDialog({
  properties: ['openFile', 'multiSelections'],
  filters: [{ name: 'Text', extensions: ['txt', 'md'] }]
});

// Save file
const { filePath } = await dialog.showSaveDialog({
  defaultPath: 'untitled.txt'
});

// Message box
await dialog.showMessageBox({
  type: 'warning',
  buttons: ['Cancel', 'Delete'],
  message: 'Are you sure?'
});
```

### Notifications

```javascript
const { Notification } = require('electron');

new Notification({
  title: 'Hello',
  body: 'World'
}).show();
```

### Tray

```javascript
const { Tray, Menu } = require('electron');

let tray = new Tray('/path/to/icon.png');
tray.setToolTip('My App');
tray.setContextMenu(Menu.buildFromTemplate([
  { label: 'Show', click: () => win.show() },
  { label: 'Quit', click: () => app.quit() }
]));
```

---

## Security Best Practices

```javascript
// Always use these settings
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,    // Isolate preload from renderer
    nodeIntegration: false,    // No Node.js in renderer
    sandbox: true,             // Enable Chromium sandbox
    preload: path.join(__dirname, 'preload.js')
  }
});
```

**Never:**
- Enable `nodeIntegration: true`
- Disable `contextIsolation`
- Load remote content in main window without sanitization

---

## Building and Distribution

```bash
npm install electron-builder --save-dev
```

```json
// package.json
{
  "build": {
    "appId": "com.example.myapp",
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  },
  "scripts": {
    "build": "electron-builder"
  }
}
```

---

## Interview Questions

**Q: What is Electron?**

A: Framework for cross-platform desktop apps using web technologies. Combines Chromium (rendering) with Node.js (system access). Write HTML/CSS/JS, deploy to Windows/macOS/Linux.

**Q: Explain main vs renderer process.**

A: Main process runs Node.js, manages app lifecycle, creates windows, accesses system APIs. One per app. Renderer process runs Chromium, displays UI. One per window. They communicate via IPC.

**Q: What are Electron security concerns?**

A: Big attack surface (Chromium + Node.js). Never enable nodeIntegration in renderer. Use contextIsolation and preload scripts. Validate all IPC messages. Don't load untrusted content. Large bundle size compared to native apps.

---

## Resources

- https://www.electronjs.org/docs
- https://www.electron.build/ (electron-builder)
