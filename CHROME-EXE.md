# Bitmap Parser - Chrome-based Windows and Linux builds

This build runs the existing web parser in Google Chrome or Chromium using a small local Python HTTP server. It does not embed Chromium or Electron.

## Build on Windows

1. Install Python 3.10 or newer.
2. Run \`build-chrome-exe.bat\`.
3. Find the executable at \`dist/Bitmap Parser.exe\`.

## Build on Linux

1. Install Python 3.10 or newer.
2. Ensure Google Chrome or Chromium is installed.
3. Run \`chmod +x build-chrome-linux.sh && ./build-chrome-linux.sh\`.
4. Find the executable at \`dist/Bitmap Parser\`.

The target machine does not need Python. It does need Google Chrome or Chromium installed. Linux binaries are built for Linux; they are not interchangeable with Windows EXEs.

## Runtime behavior

- The app starts a local HTTP server bound only to \`127.0.0.1:8765\`.
- It opens the parser in a dedicated Chrome/Chromium app window.
- Closing that browser app window stops the local server and exits the launcher.
- A Windows named mutex or Linux file lock prevents a second launcher instance.
- Browser LocalStorage is persisted in a dedicated profile:
  - Windows: \`%LOCALAPPDATA%/BitmapParser/ChromeProfile\`
  - Linux: \`~/.local/share/BitmapParser/ChromeProfile\` (or \`$XDG_DATA_HOME/BitmapParser/ChromeProfile\`)
- The server does not listen on the LAN or expose the parser to other devices.

## Notes

- Port 8765 must be available. If another process is using it, the app reports an error instead of silently switching ports; this keeps the browser origin and LocalStorage stable.
- The dedicated browser profile is separate from the user's normal browser profile and from Electron's LocalStorage. Existing Electron saved settings/packets are not automatically migrated.
- GitHub Actions builds separate Windows and Linux artifacts.
