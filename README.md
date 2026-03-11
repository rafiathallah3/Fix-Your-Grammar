# Fix Your Grammar

AI-powered grammar correction tool built with Electron and Google Gemini.

![App Demo](front.gif)

## Setup

1. Install dependencies
   ```bash
   npm install
   ```

2. Add your [Gemini API key](https://makersuite.google.com/app/apikey) — either in a `.env` file:
   ```
   GOOGLE_API_KEY=your_key_here
   ```
   Or via the Settings window (system tray → Open Settings).

3. Build and run
   ```bash
   npm start
   ```

## How to Use

1. Select text anywhere
2. Press `Alt+A` (configurable in Settings)
3. Double-click a correction to paste it

## Development

```bash
npm run dev     # build + run
npm run watch   # auto-rebuild TypeScript
npm run dist    # create installer
```
