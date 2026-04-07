console.log('Starting VocalFlow Main Process...');
require('dotenv').config(); // Load .env file at the top
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { GlobalKeyboardListener } = require('node-global-key-listener');
let robot;
try {
  robot = require('robotjs');
  console.log('RobotJS loaded successfully');
} catch (err) {
  console.error('Failed to load robotjs:', err);
}

let mainWindow;
let tray;
let config;
let v; // Move to whenReady

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(data);

    // Override/Set keys from .env (process.env)
    config.DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || config.DEEPGRAM_API_KEY;
    config.GROQ_API_KEY = process.env.GROQ_API_KEY || config.GROQ_API_KEY;
    config.DEEPGRAM_PROJECT_ID = process.env.DEEPGRAM_PROJECT_ID || config.DEEPGRAM_PROJECT_ID;

    console.log('Config loaded from config.json and .env successfully');
  } catch (err) {
    console.error('Error loading config:', err);
    config = {};
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
    show: true, // Show on startup to confirm it's running
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  console.log('Main window created and file loaded');

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Settings', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Exit', click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('VocalFlow');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.show();
  });
}

function setupHotkeys() {
  let isPressed = false;
  const targetKey = config.hotkey || 'RIGHT ALT';

  v.addListener((e, down) => {
    // console.log('HOTKEY Event:', e.name, e.state); // Success! No need for noise anymore
    if (e.name.toUpperCase() === targetKey.toUpperCase()) {
      if (e.state === 'DOWN' && !isPressed) {
        isPressed = true;
        console.log('Recording started...');
        mainWindow.webContents.send('recording-status', true);
      } else if (e.state === 'UP' && isPressed) {
        isPressed = false;
        console.log('Recording stopped...');
        mainWindow.webContents.send('recording-status', false);
      }
    }
  });
}

app.whenReady().then(() => {
  console.log('App is ready, initializing components...');
  loadConfig();
  createWindow();
  createTray();

  try {
    v = new GlobalKeyboardListener();
    setupHotkeys();
    console.log('Hotkeys initialized successfully');
  } catch (err) {
    console.error('Failed to initialize GlobalKeyboardListener:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray
  }
});

// IPC for Text Injection
ipcMain.on('inject-text', (event, text) => {
  console.log('Injecting text:', text);
  // RobotJS implementation for Windows text injection
  // To avoid focus issues, we can simulate a small delay or use clipboard bypass
  robot.setKeyboardDelay(10);
  // For Windows, it's often more reliable to use clipboard for long text
  // but robot.typeString is fine for shorter snippets.
  // We'll use typeString for simplicity in this demo.
  robot.typeString(text);
});

// Get Config IPC
ipcMain.handle('get-config', () => config);
