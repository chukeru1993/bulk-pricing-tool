const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;
let expressServer;

function getUserDataPath() {
  return app.getPath('userData');
}

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
  try {
    const userDataPath = getUserDataPath();
    const isDev = !app.isPackaged;

    process.env.BULK_PRICING_USER_DATA = userDataPath;
    process.env.BULK_PRICING_IS_DEV = isDev ? 'true' : 'false';

    const config = require('../server/utils/config');
    config.init(userDataPath, isDev);

    const serverPath = path.join(__dirname, '..', 'server', 'index.js');
    expressServer = require(serverPath);
    console.log('Express server started');
    console.log('User data path:', userDataPath);
    console.log('Is dev:', isDev);
  } catch (err) {
    console.error('Failed to start Express server:', err);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (expressServer) {
    expressServer.close();
  }
  app.quit();
});