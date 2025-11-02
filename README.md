# Fix Your Grammar
AI-powered grammar correction tool

![App Demo](front.gif)

## Features

- **Quick Grammar Fix** - Select any text and get instant grammar corrections
- **AI-Powered** - Powered by Google Gemini AI for accurate grammar correction
- **Global Hotkey** - Press `Alt+A` from anywhere to open the app
- **Auto Paste** - Double-click to automatically copy and paste corrected text
- **Smart Positioning** - Window appears at cursor position
- **System Tray** - Runs quietly in the background with system tray icon
- **Easy Configuration** - Simple settings panel for API key management
- **Cross-Platform** - Works on Windows, macOS, and Linux

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/rafiathallah3/Fix-Your-Grammar
   cd PerbaikanGrammar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Key**
   - Create a `.env` file in the root directory
   - Add your Google Gemini API key:
     ```
     GOOGLE_API_KEY=your_api_key_here
     ```
   - Or use the Settings window (right-click system tray icon → Open Settings)

4. **Build and run**
   ```bash
   npm run build
   npm start
   ```

## Usage

### Basic Workflow

1. **Select text** in any application (browser, text editor, etc.)
2. **Press `Alt+A`** to open the grammar correction window
3. View the corrections:
   - First option: Grammar-corrected text
   - Second option: Improved text with enhancements
4. **Double-click** on a correction button to automatically paste it
5. **Press `Alt+A` again** to hide the window

### Settings

Access settings via the system tray icon:
- Right-click the tray icon → **Open Settings**
- Enter your Google Gemini API key
- Settings are saved automatically

### System Tray

The app runs in the system tray when minimized:
- **Click tray icon** → Opens settings window
- **Right-click tray icon** → Context menu with options
  - Open Settings
  - Quit

## Development

### Development Mode

```bash
npm run dev
```

### Watch Mode (Auto-rebuild TypeScript)

```bash
npm run watch
```

### Build for Distribution

```bash
npm run dist
```

This will create installers in the `dist` folder for your platform:
- **Windows**: NSIS installer
- **Linux**: AppImage

## Configuration

The app stores settings in your system's user data directory:
- **Windows**: `%APPDATA%/Fix Your Grammar/settings.json`
- **macOS**: `~/Library/Application Support/Fix Your Grammar/settings.json`
- **Linux**: `~/.config/Fix Your Grammar/settings.json`
