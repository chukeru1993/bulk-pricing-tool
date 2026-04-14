const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;
let expressServer;

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
  console.log('=== BulkPricingTool Starting ===');
  console.log('App path:', app.getAppPath());
  console.log('isPackaged:', app.isPackaged);

  try {
    const serverPath = path.join(__dirname, '..', 'server', 'index.js');
    console.log('Loading server from:', serverPath);
    expressServer = require(serverPath);
    console.log('Server started successfully');
  } catch (err) {
    console.error('Failed to start server:', err);
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (expressServer) {
    expressServer.close();
  }
  app.quit();
});