# VocalFlow for Windows

A lightweight Windows system tray application that lets you dictate into any text field using a hold-to-record hotkey. This is a port of the original macOS VocalFlow app, built with Electron for native Windows support.

## Features

- **Hold-to-record hotkey**: Default is `Right Alt`.
- **System Tray Integration**: Minimal footprint, runs in the background.
- **Real-time STT**: Powered by Deepgram.
- **LLM Refinement**: Optional grammar and style correction via Groq.
- **Text Injection**: Automatically types the transcript into your active window.
- **Balance Monitoring**: View your Deepgram and Groq status directly in the app.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Deepgram API Key](https://console.deepgram.com/)
- [Groq API Key](https://console.groq.com/) (Optional)

## Installation

1. Clone or download this repository.
2. Navigate to the `windows-port` directory:
   ```powershell
   cd windows-port
   ```
3. Install dependencies:
   ```powershell
   npm install
   ```

## Running the App

Start the application in development mode:
```powershell
npm start
```

## Usage

1. Once the app is running, it will appear in your **System Tray**.
2. Click the icon to open the **Settings** window and check your balances.
3. To dictate:
   - Click into any text field (Notepad, Browser, Slack, etc.).
   - **Hold** the `Right Alt` key.
   - **Speak** your message.
   - **Release** the key.
4. The transcript will be processed and injected automatically at your cursor.

## Building for Production

To create a portable `.exe` installer:
```powershell
npm run build
```

---

## Troubleshooting

### Native Module Mismatch (robotjs)
If you see an error about `NODE_MODULE_VERSION`, run:
```powershell
npx electron-rebuild
```
This will recompile `robotjs` for your specific version of Electron.
