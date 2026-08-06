const { contextBridge, ipcRenderer } = require('electron');

// Expose các hàm gọi từ UI (Renderer) xuống Main Process
contextBridge.exposeInMainWorld('electronAPI', {
  saveNote: (text, url) => ipcRenderer.send('save-note', text, url),
  saveKhanScore: (scoreData) => ipcRenderer.send('save-khan-score', scoreData)
});
