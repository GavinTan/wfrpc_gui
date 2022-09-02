const {
  app,
  ipcMain,
  shell,
  dialog,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
} = require('electron');

const { spawn } = require('child_process');
const path = require('path');
const ini = require('js-ini');
const fs = require('fs');
const homedir = require('os').homedir();

let runWfrpc;
let configData = { common: {} };
const sysData = { x64: 'amd64', ia32: '386', win32: 'windows' };
const sysPlatform = sysData[process.platform] || process.platform;

const wfrpcBasePath = path.join(homedir, '/.wfrpc');
const wfrpcConfigFile = path.join(wfrpcBasePath, 'wfrpc.ini');
const wfrpcBinName = sysPlatform === 'windows' ? 'wfrpc.exe' : 'wfrpc';
const wfrpcBin = app.isPackaged ? path.join(process.resourcesPath, wfrpcBinName) : path.join('wfrpc', sysPlatform, wfrpcBinName);

const handleStartWfrpc = (event) => {
  const webContents = event.sender;

  if (!runWfrpc) {
    runWfrpc = spawn(wfrpcBin, ['-n']);

    runWfrpc.stdout.on('data', (data) => {
      webContents.send('wfrpc:log', data.toString('utf8'));
    });

    runWfrpc.stderr.on('data', (data) => {
      webContents.send('wfrpc:log', data.toString('utf8'));
    });

    webContents.send('wfrpc:config', configData);
  }
};

const handleStopWfrpc = (event) => {
  const webContents = event.sender;
  webContents.send('wfrpc:config', {});
  runWfrpc?.kill();
  runWfrpc = null;
};

const handleWfrpcConfig = (event, data) => {
  if (fs.existsSync(wfrpcConfigFile)) {
    configData = ini.parse(fs.readFileSync(wfrpcConfigFile, 'utf-8'));
  }

  Object.keys(data).forEach((i) => {
    if (i === 'serverConfig') {
      const { serverConfig } = data;

      if (Object.prototype.hasOwnProperty.call(configData, 'common')) {
        Object.keys(serverConfig).forEach((sk) => {
          configData.common[sk] = serverConfig[sk];
        });
      } else {
        configData.common = serverConfig;
      }
    }

    if (i === 'forwardConfig') {
      const { forwardConfig } = data;

      Object.keys(forwardConfig).forEach((fn) => {
        if (Object.prototype.hasOwnProperty.call(configData, fn)) {
          Object.keys(forwardConfig[fn]).forEach((fk) => {
            configData[fn][fk] = forwardConfig[fn][fk];
          });
        } else {
          configData[fn] = forwardConfig[fn];
        }
      });

      if (runWfrpc) {
        runWfrpc.kill();
        runWfrpc = null;

        handleStartWfrpc(event);
      }
    }
  });

  const iniData = ini.stringify(configData, { spaceBefore: true, spaceAfter: true }).trim();

  fs.mkdirSync(wfrpcBasePath, { recursive: true });
  fs.writeFileSync(wfrpcConfigFile, iniData);
};

const mainWindow = () => {
  const win = new BrowserWindow({
    width: 600,
    height: 550,
    minWidth: 600,
    minHeight: 550,
    title: 'wfrpc',
    icon: path.join(__dirname, 'app/static/img/logo.ico'),
    webPreferences: {
      spellcheck: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'app/index.html'));
  // win.webContents.openDevTools()

  win.on('close', () => {
    runWfrpc?.kill();
  });

  win.on('minimize', (event) => {
    event.preventDefault();
    win.hide();
    win.setSkipTaskbar(true);
    if (sysPlatform === 'darwin') app.dock.hide();
    // new Notification({ body: 'wfrpc已经后台运行' }).show();
  });

  win.on('ready-to-show', () => {
    let config = {
      server_addr: 'nb33.3322.org',
      server_port: '7000',
      token: '',
    };

    if (fs.existsSync(wfrpcConfigFile)) {
      configData = ini.parse(fs.readFileSync(wfrpcConfigFile, 'utf-8'));

      if (Object.prototype.hasOwnProperty.call(configData, 'common')) {
        config = configData.common;
      }
    }

    win.webContents.send('wfrpc:loadconfig', config);
  });

  win.removeMenu();

  const tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'app/static/img/tray.png')));
  tray.setToolTip('wfrpc');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开',
      click: () => {
        win.setSkipTaskbar(false);
        win.show();
        if (sysPlatform === 'darwin') app.dock.show();
      },
    },
    {
      label: '退出',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (!win.isVisible()) {
      win.show();
      win.setSkipTaskbar(false);
      if (sysPlatform === 'darwin') app.dock.show();
    }
  });
};

app.whenReady().then(() => {
  ipcMain.on('addConfig', handleWfrpcConfig);
  ipcMain.handle('startWfrpc', handleStartWfrpc);
  ipcMain.handle('stopWfrpc', handleStopWfrpc);
  ipcMain.handle('editWfrpc', () => shell.openPath(wfrpcConfigFile));
  ipcMain.handle('clearWfrpc', (event) => {
    fs.truncateSync(wfrpcConfigFile);
    dialog.showMessageBox(BrowserWindow.fromWebContents(event.sender), { message: '配置文件已清空', type: 'info' });
  });

  mainWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
