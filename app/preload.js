'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('epic', {
  listSources: () => ipcRenderer.invoke('sources:list'),
  selectSource: (id, audio) => ipcRenderer.invoke('sources:select', id, audio),
  metrics: () => ipcRenderer.invoke('app:metrics'),
  flash: () => ipcRenderer.invoke('app:flash'),
  toggleMini: (enable) => ipcRenderer.invoke('window:mini', enable),
  onMiniChanged: (cb) => ipcRenderer.on('window:mini-changed', (_e, val) => cb(val)),
  version: () => ipcRenderer.invoke('app:version'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  setShortcuts: (cfg) => ipcRenderer.invoke('shortcuts:set', cfg),
  onShortcut: (cb) => ipcRenderer.on('shortcut:trigger', (_e, act) => cb(act)),
  loadAuth: () => ipcRenderer.invoke('auth:load'),
  saveAuth: (data) => ipcRenderer.invoke('auth:save', data),
  detectGame: () => ipcRenderer.invoke('game:detect'),
});
