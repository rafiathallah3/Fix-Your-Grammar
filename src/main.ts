import { app, BrowserWindow, globalShortcut, ipcMain, screen, clipboard, Menu, Tray, nativeImage } from 'electron';
import * as path from 'path';
import { exec } from 'child_process';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();
let ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

class ElectronApp {
  private windowUtama: BrowserWindow | null = null;
  private apakahBisaLihat: boolean = false;
  private textSebelumnya: string = "";
  private textSebelumnyaPerbaikan: string = "";
  private textSebelumnyaImprove: string = "";
  private tray: Tray | null = null;
  private grammarRequestId = 0;
  private windowPengaturan: BrowserWindow | null = null;
  private settingsFilePath: string = path.join(app.getPath('userData'), 'settings.json');

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    app.whenReady().then(() => {
      const apiKey = this.bacaApiKey();
      if (apiKey) {
        ai = new GoogleGenAI({
          apiKey: apiKey
        });
      }

      this.ensureSettingsFile();
      this.buatWindow();
      this.registerGlobalShortcuts();
      this.setupEventHandlers();
      this.buatTray();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.buatWindow();
      }
    });
  }

  private ensureSettingsFile(): void {
    try {
      if (!fs.existsSync(this.settingsFilePath)) {
        fs.writeFileSync(this.settingsFilePath, JSON.stringify({ geminiApiKey: '' }, null, 2), 'utf-8');
      }
    } catch (e) {
      console.error('Failed to init settings file:', e);
    }
  }

  private bacaApiKey(): string {
    try {
      const raw = fs.readFileSync(this.settingsFilePath, 'utf-8');
      const parsed = JSON.parse(raw || '{}');
      console.log("Baca!", parsed);
      return parsed.geminiApiKey;
    } catch {
      return '';
    }
  }

  private simpanApiKey(key: string): void {
    try {
      const raw = fs.existsSync(this.settingsFilePath) ? fs.readFileSync(this.settingsFilePath, 'utf-8') : '{}';
      const parsed = JSON.parse(raw || '{}');
      parsed.geminiApiKey = key;
      fs.writeFileSync(this.settingsFilePath, JSON.stringify(parsed, null, 2), 'utf-8');

      console.log("Simpan!", parsed);
      ai = new GoogleGenAI({
        apiKey: key
      });
    } catch (e) {
      console.error('Failed to save API key:', e);
    }
  }

  private buatTray(): void {
    if (this.tray) return;
    const iconPath = path.join(__dirname, 'renderer', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    this.tray = new Tray(icon);

    const menu = Menu.buildFromTemplate([
      { label: 'Open Settings', type: 'normal', click: () => this.bukaPengaturan() },
      { type: 'separator' },
      { label: 'Quit', type: 'normal', click: () => app.quit() }
    ]);
    this.tray.setToolTip('Fix Your Grammar');
    this.tray.setContextMenu(menu);
    this.tray.on('click', () => this.bukaPengaturan());
  }

  private bukaPengaturan(): void {
    if (this.windowPengaturan && !this.windowPengaturan.isDestroyed()) {
      this.windowPengaturan.focus();
      return;
    }

    this.windowPengaturan = new BrowserWindow({
      width: 380,
      height: 220,
      resizable: false,
      minimizable: false,
      maximizable: false,
      show: true,
      frame: true,
      alwaysOnTop: true,
      icon: path.join(__dirname, 'renderer', 'icon.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    this.windowPengaturan.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
    this.windowPengaturan.on('closed', () => {
      this.windowPengaturan = null;
    });
  }

  private buatWindow(): void {
    this.windowUtama = new BrowserWindow({
      width: 400,
      height: 300,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      show: false,
      frame: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      transparent: true,
      icon: path.join(__dirname, 'renderer', 'icon.png')
    });

    this.windowUtama.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    this.windowUtama.on('closed', () => {
      this.windowUtama = null;
    });

    // this.windowUtama.webContents.on('before-input-event', (event, input) => {
    //   if (input.key === 'Escape') {
    //     this.tapoinWindow();
    //     event.preventDefault();
    //   }
    // });
  }

  private resetWindowUtama(): void {
    if (this.windowUtama) {
      this.windowUtama.close();
      this.windowUtama = null;
      this.apakahBisaLihat = false;
      this.textSebelumnya = "";
      this.textSebelumnyaPerbaikan = "";
      this.textSebelumnyaImprove = "";
      this.grammarRequestId = 0;
    }
    this.buatWindow();
  }

  private registerGlobalShortcuts(): void {
    const ret = globalShortcut.register('Alt+A', () => {
      this.toggleWindow();
    });

    if (!ret) {
      console.log('Failed to register Alt+A shortcut');
    }

    // const escapeRet = globalShortcut.register('Escape', () => {
    //   this.tapoinWindow();
    // });

    // if (!escapeRet) {
    //   console.log('Failed to register Escape shortcut');
    // }
  }

  private toggleWindow(): void {
    if (!this.windowUtama) {
      this.buatWindow();
    }

    if (this.apakahBisaLihat) {
      this.tapoinWindow();
    } else {
      this.ambilTextDiPilihDanTunjuin();
    }
  }

  private ambilTextDiPilihDanTunjuin(): void {
    if (process.platform === 'win32') {
      exec('powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^c\')"', (error: any) => {
        if (error) {
          console.log('Error capturing text:', error);
        }
        setTimeout(() => {
          this.tunjuinWindowDenganTextDipilih();
        }, 100);
      });
    } else if (process.platform === 'darwin') {
      exec('osascript -e \'tell application "System Events" to keystroke "c" using command down\'', (error: any) => {
        if (error) {
          console.log('Error capturing text:', error);
        }
        setTimeout(() => {
          this.tunjuinWindowDenganTextDipilih();
        }, 100);
      });
    } else {
      exec('xdotool key ctrl+c', (error: any) => {
        if (error) {
          console.log('Error capturing text:', error);
        }
        setTimeout(() => {
          this.tunjuinWindowDenganTextDipilih();
        }, 100);
      });
    }
  }

  private tunjuinWindowDenganTextDipilih(): void {
    const textDiPilih = clipboard.readText();
    
    this.tunjuinWindow();
    
    if (textDiPilih && textDiPilih.trim()) {
      if(this.textSebelumnya !== textDiPilih) {
        this.textSebelumnya = textDiPilih;

        const requestId = ++this.grammarRequestId;
        this.perbaikiGrammar(textDiPilih, requestId);
        
        this.kirimTextKeRenderer(textDiPilih, "textDiPilih");
      } else {
        this.kirimTextKeRenderer(this.textSebelumnya, "textDiPilih");
        this.kirimTextKeRenderer(this.textSebelumnyaPerbaikan, "textPerbaikan");
        this.kirimTextKeRenderer(this.textSebelumnyaImprove, "textImprove");
      }
    }
  }

  private async perbaikiGrammar(text: string, requestId: number): Promise<void> {
    try {
      const hasil = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: text,
        config: {
          systemInstruction: "You are a grammar corrector. You will be given a text and you will need to correct the grammar of the text. You will need to return two text, the first text is the corrected text, the second text is also corrected text but with improvement and you can add a words to be more accurate but simple. Both of the text should be seperated by a new line (\\n)",
        },
      });
  
      if (requestId !== this.grammarRequestId) {
        console.log("Ignored outdated grammar result");
        return;
      }  
      
      if (hasil.text) {
        const [textPerbaikan, textImprove] = hasil.text.split('\n');
        this.textSebelumnyaPerbaikan = textPerbaikan;
        this.textSebelumnyaImprove = textImprove;
        this.kirimTextKeRenderer(textPerbaikan, "textPerbaikan");
        this.kirimTextKeRenderer(textImprove, "textImprove");
      }
    } catch (e: any) {
      console.error('Error generating grammar:', e);
      this.kirimTextKeRenderer("", "textPerbaikan");
      this.kirimTextKeRenderer("", "textImprove");
      this.kirimTextKeRenderer("Error: " + e.message, "textDiPilih");
    }
  }

  private kirimTextKeRenderer(text: string, status: "textDiPilih" | "textPerbaikan" | "textImprove"): void {
    if (this.windowUtama && !this.windowUtama.isDestroyed()) {
      this.windowUtama.webContents.send('selected-text', text, status);
    }
  }

  private tunjuinWindow(): void {
    if (this.windowUtama) {
      this.tengahinWindowDenganCursor();
      this.windowUtama.show();
      this.windowUtama.focus();
      this.apakahBisaLihat = true;
    }
  }

  private tengahinWindowDenganCursor(): void {
    if (!this.windowUtama) return;

    const cursor = screen.getCursorScreenPoint();
    const batasWindow = this.windowUtama.getBounds();
    
    const x = cursor.x - (batasWindow.width / 2);
    const y = cursor.y - (batasWindow.height / 2);
    
    this.windowUtama.setPosition(x, Math.abs(y - 150));
  }

  private tapoinWindow(): void {
    if (this.windowUtama && this.apakahBisaLihat) {
      this.kirimTextKeRenderer("", "textDiPilih");
      this.kirimTextKeRenderer("", "textImprove");
      this.kirimTextKeRenderer("", "textPerbaikan");

      this.windowUtama.hide();
      this.apakahBisaLihat = false;
    }
  }

  private setupEventHandlers(): void {
    if (this.windowUtama) {
      this.windowUtama.on('show', () => {
        this.apakahBisaLihat = true;
      });

      this.windowUtama.on('hide', () => {
        this.apakahBisaLihat = false;
      });
    }

    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });

    ipcMain.handle('close-app', () => {
      app.quit();
    });

    ipcMain.handle('minimize-window', () => {
      if (this.windowUtama) {
        this.windowUtama.minimize();
      }
    });

    ipcMain.handle('close-window', () => {
      this.tapoinWindow();
    });

    // Settings IPC
    ipcMain.handle('get-api-key', () => {
      return this.bacaApiKey();
    });

    ipcMain.handle('set-api-key', (event, key: string) => {
      this.simpanApiKey(key || '');
    });

    ipcMain.handle('reset-main-window', () => {
      this.resetWindowUtama();
    });

    ipcMain.handle("pilih-text", (event, text: string) => {
      clipboard.writeText(text);
      
      this.tapoinWindow();
      
      setTimeout(() => {
        const { exec } = require('child_process');
        
        if (process.platform === 'win32') {
          exec('powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'%{TAB}\'); Start-Sleep -Milliseconds 100; [System.Windows.Forms.SendKeys]::SendWait(\'^v\')"', (error: any) => {
            if (error) {
              console.log('Error switching focus and pasting text:', error);
            }
          });
        } else if (process.platform === 'darwin') {
          exec('osascript -e \'tell application "System Events" to keystroke tab using command down; delay 0.1; keystroke "v" using command down\'', (error: any) => {
            if (error) {
              console.log('Error switching focus and pasting text:', error);
            }
          });
        } else {
          exec('xdotool key alt+Tab; sleep 0.1; xdotool key ctrl+v', (error: any) => {
            if (error) {
              console.log('Error switching focus and pasting text:', error);
            }
          });
        }
      }, 50);
    });
  }
}

const appFolder = path.dirname(process.execPath)
const ourExeName = path.basename(process.execPath)
const stubLauncher = path.resolve(appFolder, '..', ourExeName)
app.setLoginItemSettings({
  openAtLogin: true,
  path: stubLauncher,
});

new ElectronApp(); 