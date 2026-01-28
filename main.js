const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let logWindow = null;
let configPath = path.join(app.getPath('userData'), 'config.json');
let config = {
  dockerDirectory: null,
  stopOnClose: false
};

// Load config
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

// Save config
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

// Stop containers if configured
async function stopContainersOnClose() {
  if (config.stopOnClose && config.dockerDirectory) {
    try {
      await executeDockerCommand('docker-compose down', config.dockerDirectory);
      console.log('Containers stopped on app close');
    } catch (error) {
      console.error('Error stopping containers:', error);
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('index.html');
  
  // Uncomment to open DevTools by default
  // mainWindow.webContents.openDevTools();
}

function createLogWindow() {
  if (logWindow) {
    logWindow.focus();
    return;
  }

  logWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Docker Logs'
  });

  logWindow.loadFile('logs.html');

  logWindow.on('closed', () => {
    logWindow = null;
  });
}

app.whenReady().then(() => {
  loadConfig();
  createWindow();
});

app.on('before-quit', async (event) => {
  if ( config.dockerDirectory) {
    event.preventDefault();
    await stopContainersOnClose();
    
    app.quit();
  }
});

app.on('window-all-closed', async () => {
  // await stopContainersOnClose();
  if (process.platform !== 'darwin') {
    app.quit();

  }
  app.exit(0)
});


app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Helper function to execute docker-compose commands
function executeDockerCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// IPC Handlers
ipcMain.handle('get-config', async () => {
  return config;
});

ipcMain.handle('save-config', async (event, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig();
  return { success: true };
});

ipcMain.handle('select-directory', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const dirPath = result.filePaths[0];
    // Check if docker-compose.yml exists
    const composeFile = path.join(dirPath, 'docker-compose.yml');
    if (fs.existsSync(composeFile)) {
      config.dockerDirectory = dirPath;
      saveConfig();
      return { success: true, path: dirPath };
    } else {
      return { success: false, error: 'docker-compose.yml not found in selected directory' };
    }
  }
  return { success: false, error: 'No directory selected' };
});

ipcMain.handle('docker-up', async (event, dirPath) => {
  try {
    const result = await executeDockerCommand('docker-compose up -d', dirPath);
    return { success: true, output: result.stdout };
  } catch (error) {
    return { success: false, error: error.error || error.stderr };
  }
});

ipcMain.handle('docker-down', async (event, dirPath) => {
  try {
    const result = await executeDockerCommand('docker-compose down', dirPath);
    return { success: true, output: result.stdout };
  } catch (error) {
    return { success: false, error: error.error || error.stderr };
  }
});

ipcMain.handle('docker-restart', async (event, dirPath) => {
  try {
    const result = await executeDockerCommand('docker-compose restart', dirPath);
    return { success: true, output: result.stdout };
  } catch (error) {
    return { success: false, error: error.error || error.stderr };
  }
});

ipcMain.handle('docker-pull', async (event, dirPath) => {
  try {
    const result = await executeDockerCommand('docker-compose pull', dirPath);
    return { success: true, output: result.stdout };
  } catch (error) {
    return { success: false, error: error.error || error.stderr };
  }
});

ipcMain.handle('docker-status', async (event, dirPath) => {
  try {
    const result = await executeDockerCommand('docker-compose ps', dirPath);
    return { success: true, output: result.stdout };
  } catch (error) {
    return { success: false, error: error.error || error.stderr };
  }
});

ipcMain.handle('docker-logs', async (event, dirPath, service) => {
  try {
    const command = service 
      ? `docker-compose logs --tail=100 ${service}`
      : 'docker-compose logs --tail=100';
    const result = await executeDockerCommand(command, dirPath);
    return { success: true, output: result.stdout };
  } catch (error) {
    return { success: false, error: error.error || error.stderr };
  }
});

ipcMain.handle('docker-logs-follow', async (event, dirPath, service) => {
  const command = service 
    ? `docker-compose logs -f ${service}`
    : 'docker-compose logs -f';
  
  return new Promise((resolve) => {
    const process = exec(command, { cwd: dirPath });
    
    process.stdout.on('data', (data) => {
      if (logWindow) {
        logWindow.webContents.send('log-data', data.toString());
      }
    });
    
    process.stderr.on('data', (data) => {
      if (logWindow) {
        logWindow.webContents.send('log-data', data.toString());
      }
    });
    
    process.on('close', (code) => {
      if (logWindow) {
        logWindow.webContents.send('log-end', code);
      }
      resolve({ success: true });
    });
  });
});

ipcMain.on('open-log-window', () => {
  createLogWindow();
});

ipcMain.handle('get-services', async (event, dirPath) => {
  try {
    const result = await executeDockerCommand('docker-compose config --services', dirPath);
    const services = result.stdout.trim().split('\n').filter(s => s);
    return { success: true, services };
  } catch (error) {
    return { success: false, error: error.error || error.stderr };
  }
});