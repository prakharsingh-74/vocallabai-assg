const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onRecordingStatus: (callback) => ipcRenderer.on('recording-status', (_event, value) => callback(value)),
  injectText: (text) => ipcRenderer.send('inject-text', text),
  getConfig: () => ipcRenderer.invoke('get-config')
});
