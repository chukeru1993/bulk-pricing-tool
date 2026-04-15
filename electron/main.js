const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function getLogFile() {
  const userDataPath = app.getPath('userData');
  const logDir = path.join(userDataPath, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return path.join(logDir, 'electron.log');
}

function writeLog(msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `${timestamp} - ${msg}\n`;
  const logFile = getLogFile();
  try {
    fs.appendFileSync(logFile, logMsg);
  } catch (e) {}
  console.log(msg);
}

app.whenReady().then(() => {
  writeLog('=== Electron Starting ===');
  writeLog('App path: ' + app.getAppPath());
  writeLog('User data: ' + app.getPath('userData'));
  writeLog('Is packaged: ' + app.isPackaged);

  const serverPath = path.join(__dirname, '..', 'server', 'index.js');
  writeLog('Server path: ' + serverPath);

  try {
    serverProcess = fork(serverPath, [], {
      stdio: 'inherit',
      env: {
        ...process.env,
        BULK_PRICING_APP_PATH: app.getAppPath(),
        BULK_PRICING_USER_DATA: app.getPath('userData'),
        BULK_PRICING_IS_PACKAGED: app.isPackaged ? 'true' : 'false'
      }
    });

    serverProcess.on('error', (err) => {
      writeLog('Server fork error: ' + err.message);
    });

    serverProcess.on('exit', (code) => {
      writeLog('Server exited with code: ' + code);
    });

  } catch (err) {
    writeLog('Failed to fork server: ' + err.message);
    writeLog(err.stack);
  }

  createWindow();
});

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
    writeLog('Window shown');
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

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});