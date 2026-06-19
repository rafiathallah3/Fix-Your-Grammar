import { ElectronApp } from '../src/main';
import { clipboard } from 'electron';

// Mock variables we can control
let mockClipboardText = '';
let mockGenerateContent = jest.fn();

// Mock console.error to avoid test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

jest.mock('electron', () => {
  const mWebContents = {
    send: jest.fn(),
  };
  const mBrowserWindow = jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    on: jest.fn(),
    show: jest.fn(),
    focus: jest.fn(),
    close: jest.fn(),
    getBounds: () => ({ x: 0, y: 0, width: 400, height: 300 }),
    setPosition: jest.fn(),
    minimize: jest.fn(),
    isDestroyed: () => false,
    webContents: mWebContents,
  }));
  (mBrowserWindow as any).getAllWindows = () => [];

  return {
    app: {
      getPath: jest.fn().mockReturnValue('mock-path'),
      whenReady: jest.fn().mockReturnValue({
        then: (cb: () => void) => {
          cb();
          return { catch: jest.fn() };
        }
      }),
      on: jest.fn(),
      quit: jest.fn(),
      getVersion: jest.fn().mockReturnValue('1.0.0'),
      setLoginItemSettings: jest.fn(),
    },
    BrowserWindow: mBrowserWindow,
    globalShortcut: {
      register: jest.fn().mockReturnValue(true),
      unregisterAll: jest.fn(),
    },
    ipcMain: {
      handle: jest.fn(),
    },
    screen: {
      getCursorScreenPoint: jest.fn().mockReturnValue({ x: 100, y: 100 }),
      getDisplayNearestPoint: jest.fn().mockReturnValue({
        workArea: { x: 0, y: 0, width: 1920, height: 1080 }
      }),
    },
    clipboard: {
      readText: jest.fn().mockImplementation(() => mockClipboardText),
      writeText: jest.fn().mockImplementation((text) => { mockClipboardText = text; }),
    },
    Menu: {
      buildFromTemplate: jest.fn().mockReturnValue({}),
    },
    Tray: jest.fn().mockImplementation(() => ({
      setToolTip: jest.fn(),
      setContextMenu: jest.fn(),
      on: jest.fn(),
    })),
    nativeImage: {
      createFromPath: jest.fn().mockReturnValue({
        resize: jest.fn().mockReturnThis(),
      }),
    },
  };
});

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: (...args: any[]) => mockGenerateContent(...args),
      },
    })),
  };
});

jest.mock('fs', () => {
  return {
    existsSync: jest.fn().mockReturnValue(true),
    readFileSync: jest.fn().mockReturnValue(JSON.stringify({
      geminiApiKey: 'test-api-key',
      keybind: 'Alt+A',
      autoLaunch: true,
      provider: 'gemini',
    })),
    writeFileSync: jest.fn(),
  };
});

jest.mock('child_process', () => {
  return {
    exec: jest.fn().mockImplementation((cmd, cb) => {
      cb(null);
    }),
  };
});

describe('ElectronApp Retry on Reopen After Error', () => {
  let appInstance: ElectronApp;

  beforeEach(() => {
    mockClipboardText = '';
    mockGenerateContent.mockReset();
    
    // Spy and mock setTimeout to execute synchronously
    jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
      cb();
      return {} as any;
    });

    appInstance = new ElectronApp();
    // Align grammarRequestId to 1 so direct calls using requestId = 1 match
    (appInstance as any).grammarRequestId = 1;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should successfully get grammar corrections and set lastRequestWasError to false', async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        corrected: 'He goes to school.',
        improved: 'He is going to school.'
      })
    });

    const promise = (appInstance as any).perbaikiGrammar('he go to school', 1);
    await promise;

    expect((appInstance as any).lastRequestWasError).toBe(false);
    expect((appInstance as any).textSebelumnyaPerbaikan).toBe('He goes to school.');
    expect((appInstance as any).textSebelumnyaImprove).toBe('He is going to school.');
  });

  test('should set lastRequestWasError to true if the request fails after all retries', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Network Error'));

    const promise = (appInstance as any).perbaikiGrammar('he go to school', 1);
    await promise;

    expect((appInstance as any).lastRequestWasError).toBe(true);
  });

  test('should retry if lastRequestWasError is true, even if selected text is identical', async () => {
    // 1. Force the first request to fail
    mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));
    await (appInstance as any).perbaikiGrammar('incorrect text', 1);

    expect((appInstance as any).lastRequestWasError).toBe(true);

    // 2. Set up next request to succeed
    mockGenerateContent.mockReset();
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        corrected: 'Corrected text',
        improved: 'Improved text'
      })
    });

    // Set clipboard to the same text
    mockClipboardText = 'incorrect text';
    (appInstance as any).textSebelumnya = 'incorrect text';

    // 3. Re-trigger through tunjuinWindowDenganTextDipilih
    (appInstance as any).tunjuinWindowDenganTextDipilih();

    // Ensure lastRequestWasError was reset to false when launching retry
    expect((appInstance as any).lastRequestWasError).toBe(false);

    // Wait for the new async perbaikiGrammar call to complete
    await new Promise(resolve => process.nextTick(resolve));

    expect((appInstance as any).textSebelumnyaPerbaikan).toBe('Corrected text');
    expect((appInstance as any).textSebelumnyaImprove).toBe('Improved text');
    expect((appInstance as any).lastRequestWasError).toBe(false);
  });

  test('should NOT retry if lastRequestWasError is false and selected text is identical', async () => {
    // Set up cache with successful request
    (appInstance as any).textSebelumnya = 'identical text';
    (appInstance as any).textSebelumnyaPerbaikan = 'fixed';
    (appInstance as any).textSebelumnyaImprove = 'polished';
    (appInstance as any).lastRequestWasError = false;

    // Set clipboard to same text
    mockClipboardText = 'identical text';

    // Call tunjuinWindowDenganTextDipilih
    (appInstance as any).tunjuinWindowDenganTextDipilih();

    // Expect generateContent to not be called because we used cache
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});
