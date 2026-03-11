import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  closeApp: () => ipcRenderer.invoke('close-app'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  pilihText: (text: string) => ipcRenderer.invoke('pilih-text', text),
  onSelectedText: (callback: (text: string, status: "textDiPilih" | "textPerbaikan" | "textImprove") => void) => {
    ipcRenderer.on('selected-text', (event, text, status: "textDiPilih" | "textPerbaikan" | "textImprove") => callback(text, status));
  },
  // Settings
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (key: string) => ipcRenderer.invoke('set-api-key', key),
  resetMainWindow: () => ipcRenderer.invoke('reset-main-window'),
  getKeybind: () => ipcRenderer.invoke('get-keybind'),
  setKeybind: (keybind: string) => ipcRenderer.invoke('set-keybind', keybind),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled)
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      closeApp: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      pilihText: (text: string) => Promise<void>;
      onSelectedText: (callback: (text: string, status: "textDiPilih" | "textPerbaikan" | "textImprove") => void) => void;
      getApiKey: () => Promise<string>;
      setApiKey: (key: string) => Promise<void>;
      resetMainWindow: () => Promise<void>;
      getKeybind: () => Promise<string>;
      setKeybind: (keybind: string) => Promise<void>;
      getAutoLaunch: () => Promise<boolean>;
      setAutoLaunch: (enabled: boolean) => Promise<void>;
    };
  }
} 