const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const menu = Menu.buildFromTemplate([
    {
      label: '文件',
      submenu: [
        { label: '退出', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log('=== Electron Starting ===');
  console.log('App path:', app.getAppPath());
  console.log('User data:', app.getPath('userData'));
  console.log('Is packaged:', app.isPackaged);

  const serverPath = path.join(__dirname, '..', 'server', 'index.js');
  console.log('Starting server from:', serverPath);

  try {
    serverProcess = fork(serverPath, [], {
      stdio: 'pipe',
      env: { ...process.env, BULK_PRICING_APP_PATH: app.getAppPath() }
    });

    serverProcess.stdout.on('data', (data) => {
      console.log('[Server]', data.toString().trim());
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('[Server Error]', data.toString().trim());
    });

    serverProcess.on('error', (err) => {
      console.error('Server process error:', err);
    });

    serverProcess.on('exit', (code) => {
      console.log('Server exited with code:', code);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});