import { app, BrowserWindow, Menu, shell, ipcMain, dialog, nativeTheme } from 'electron';
import { join } from 'path';
import { spawn, ChildProcess } from 'child_process';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';

// Store for app settings
const store = new Store();

// Global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
let n8nProcess: ChildProcess | null = null;
let n8nPort = 5678;

// macOS-specific settings
const isMac = process.platform === 'darwin';

// Development mode detection
const isDev = process.env.NODE_ENV === 'development';

class N8nDesktopApp {
  private n8nPath: string;
  private n8nDataPath: string;

  constructor() {
    this.n8nPath = join(__dirname, '..', '..', 'packages', 'cli', 'bin', 'n8n');
    this.n8nDataPath = join(app.getPath('userData'), 'n8n-data');
    
    this.setupApp();
  }

  private setupApp(): void {
    // Handle app events
    app.whenReady().then(() => this.createWindow());
    app.on('window-all-closed', () => this.handleAllWindowsClosed());
    app.on('activate', () => this.handleActivate());
    app.on('before-quit', () => this.handleBeforeQuit());

    // Setup auto-updater
    this.setupAutoUpdater();

    // Setup IPC handlers
    this.setupIpcHandlers();

    // Setup native menu
    this.setupMenu();
  }

  private async createWindow(): Promise<void> {
    // Create the browser window
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      show: false,
      titleBarStyle: isMac ? 'hiddenInset' : 'default',
      trafficLightPosition: { x: 20, y: 20 },
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: join(__dirname, 'preload.js')
      },
      icon: join(__dirname, '..', 'assets', 'icon.png'),
      backgroundColor: '#1a1a1a'
    });

    // Load the app
    if (isDev) {
      await mainWindow.loadURL('http://localhost:8080');
      mainWindow.webContents.openDevTools();
    } else {
      await mainWindow.loadFile(join(__dirname, '..', '..', 'packages', 'frontend', 'editor-ui', 'dist', 'index.html'));
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
      mainWindow?.show();
      this.startN8nServer();
    });

    // Handle window events
    mainWindow.on('closed', () => {
      mainWindow = null;
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  private async startN8nServer(): Promise<void> {
    try {
      // Set environment variables for n8n
      const env = {
        ...process.env,
        N8N_USER_FOLDER: this.n8nDataPath,
        N8N_PORT: n8nPort.toString(),
        N8N_HOST: 'localhost',
        N8N_PROTOCOL: 'http',
        NODE_ENV: 'production',
        N8N_DISABLE_UI: 'false',
        N8N_DISABLE_PRODUCTION_MAIN_PROCESS: 'true'
      };

      // Start n8n process
      n8nProcess = spawn(this.n8nPath, ['start'], {
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Handle n8n process events
      n8nProcess.on('error', (error) => {
        console.error('Failed to start n8n:', error);
        this.showErrorDialog('Failed to start n8n server', error.message);
      });

      n8nProcess.on('exit', (code) => {
        console.log(`n8n process exited with code ${code}`);
        if (code !== 0 && mainWindow) {
          this.showErrorDialog('n8n server stopped unexpectedly', `Exit code: ${code}`);
        }
      });

      // Log n8n output
      n8nProcess.stdout?.on('data', (data) => {
        console.log('n8n stdout:', data.toString());
      });

      n8nProcess.stderr?.on('data', (data) => {
        console.error('n8n stderr:', data.toString());
      });

    } catch (error) {
      console.error('Error starting n8n:', error);
      this.showErrorDialog('Failed to start n8n', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private setupAutoUpdater(): void {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      dialog.showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Available',
        message: 'A new version of n8n Desktop is available.',
        detail: `Version ${info.version} is ready to download.`,
        buttons: ['Download', 'Later'],
        defaultId: 0
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox(mainWindow!, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded successfully.',
        detail: 'The app will restart to install the update.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });

    autoUpdater.on('error', (error) => {
      console.error('Auto-updater error:', error);
    });

    // Check for updates on startup
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 5000);
  }

  private setupIpcHandlers(): void {
    // Handle theme changes
    ipcMain.handle('get-theme', () => {
      return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    });

    ipcMain.handle('set-theme', (_, theme: 'light' | 'dark' | 'system') => {
      nativeTheme.themeSource = theme;
      store.set('theme', theme);
    });

    // Handle n8n server status
    ipcMain.handle('get-n8n-status', () => {
      return {
        running: n8nProcess !== null && !n8nProcess.killed,
        port: n8nPort,
        url: `http://localhost:${n8nPort}`
      };
    });

    // Handle app settings
    ipcMain.handle('get-settings', () => {
      return store.store;
    });

    ipcMain.handle('set-setting', (_, key: string, value: any) => {
      store.set(key, value);
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'n8n Desktop',
        submenu: [
          {
            label: 'About n8n Desktop',
            role: 'about'
          },
          { type: 'separator' },
          {
            label: 'Preferences...',
            accelerator: 'Cmd+,',
            click: () => {
              // Open preferences window
            }
          },
          { type: 'separator' },
          {
            label: 'Services',
            role: 'services',
            submenu: []
          },
          { type: 'separator' },
          {
            label: 'Hide n8n Desktop',
            accelerator: 'Cmd+H',
            role: 'hide'
          },
          {
            label: 'Hide Others',
            accelerator: 'Cmd+Alt+H',
            role: 'hideothers'
          },
          {
            label: 'Show All',
            role: 'unhide'
          },
          { type: 'separator' },
          {
            label: 'Quit n8n Desktop',
            accelerator: 'Cmd+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'File',
        submenu: [
          {
            label: 'New Workflow',
            accelerator: 'Cmd+N',
            click: () => {
              mainWindow?.webContents.send('new-workflow');
            }
          },
          {
            label: 'Open Workflow...',
            accelerator: 'Cmd+O',
            click: () => {
              this.openWorkflowFile();
            }
          },
          { type: 'separator' },
          {
            label: 'Close Window',
            accelerator: 'Cmd+W',
            role: 'close'
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'Cmd+Z', role: 'undo' },
          { label: 'Redo', accelerator: 'Shift+Cmd+Z', role: 'redo' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'Cmd+X', role: 'cut' },
          { label: 'Copy', accelerator: 'Cmd+C', role: 'copy' },
          { label: 'Paste', accelerator: 'Cmd+V', role: 'paste' },
          { label: 'Select All', accelerator: 'Cmd+A', role: 'selectall' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { label: 'Reload', accelerator: 'Cmd+R', role: 'reload' },
          { label: 'Force Reload', accelerator: 'Cmd+Shift+R', role: 'forceReload' },
          { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
          { type: 'separator' },
          { label: 'Actual Size', accelerator: 'Cmd+0', role: 'resetZoom' },
          { label: 'Zoom In', accelerator: 'Cmd+Plus', role: 'zoomIn' },
          { label: 'Zoom Out', accelerator: 'Cmd+-', role: 'zoomOut' },
          { type: 'separator' },
          { label: 'Toggle Full Screen', accelerator: 'Ctrl+Cmd+F', role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { label: 'Minimize', accelerator: 'Cmd+M', role: 'minimize' },
          { label: 'Close', accelerator: 'Cmd+W', role: 'close' }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'n8n Documentation',
            click: () => {
              shell.openExternal('https://docs.n8n.io');
            }
          },
          {
            label: 'Community Forum',
            click: () => {
              shell.openExternal('https://community.n8n.io');
            }
          },
          { type: 'separator' },
          {
            label: 'About n8n',
            click: () => {
              shell.openExternal('https://n8n.io');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private async openWorkflowFile(): Promise<void> {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'n8n Workflows', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      mainWindow?.webContents.send('open-workflow-file', result.filePaths[0]);
    }
  }

  private showErrorDialog(title: string, message: string): void {
    if (mainWindow) {
      dialog.showErrorBox(title, message);
    }
  }

  private handleAllWindowsClosed(): void {
    if (!isMac) {
      app.quit();
    }
  }

  private handleActivate(): void {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  }

  private async handleBeforeQuit(): Promise<void> {
    // Stop n8n process gracefully
    if (n8nProcess && !n8nProcess.killed) {
      n8nProcess.kill('SIGTERM');
      
      // Wait for process to terminate
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (n8nProcess && !n8nProcess.killed) {
            n8nProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        n8nProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  }
}

// Initialize the app
new N8nDesktopApp();