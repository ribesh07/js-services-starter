const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  dockerUp: (dirPath) => ipcRenderer.invoke('docker-up', dirPath),
  dockerDown: (dirPath) => ipcRenderer.invoke('docker-down', dirPath),
  dockerRestart: (dirPath) => ipcRenderer.invoke('docker-restart', dirPath),
  dockerPull: (dirPath) => ipcRenderer.invoke('docker-pull', dirPath),
  dockerStatus: (dirPath) => ipcRenderer.invoke('docker-status', dirPath),
  dockerLogs: (dirPath, service) => ipcRenderer.invoke('docker-logs', dirPath, service),
  dockerLogsFollow: (dirPath, service) => ipcRenderer.invoke('docker-logs-follow', dirPath, service),
  getServices: (dirPath) => ipcRenderer.invoke('get-services', dirPath),
  openLogWindow: () => ipcRenderer.send('open-log-window'),
  onLogData: (callback) => ipcRenderer.on('log-data', (event, data) => callback(data)),
  onLogEnd: (callback) => ipcRenderer.on('log-end', (event, code) => callback(code))
});