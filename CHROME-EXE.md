# Bitmap Parser - Chrome-based Windows EXE

This build runs the existing web parser in Google Chrome using a small local Python HTTP server. It does not embed Chromium or Electron.

## Build

1. Install Python 3.10 or newer on the build machine.
2. Run \`build-chrome-exe.bat\`.
3. Find the generated executable at \`dist/Bitmap Parser.exe\`.

The target machine does not need Python. It does need Google Chrome installed.

## Runtime behavior

- The EXE starts a local HTTP server bound only to \`127.0.0.1:8765\`.
- It opens the parser in a dedicated Chrome app window.
- Closing that Chrome app window stops the local server and exits the EXE.
- A Windows named mutex prevents a second copy from starting.
- Chrome LocalStorage is persisted in \`%LOCALAPPDATA%\BitmapParser\ChromeProfile\`.
- The server does not listen on the LAN or expose the parser to other devices.

## Notes

- Port 8765 must be available. If another process is using it, the app displays an error instead of silently switching ports; this keeps the browser origin and LocalStorage stable.
- This Chrome profile is separate from the user's normal Chrome profile and from Electron's LocalStorage. Existing Electron saved settings/packets are not automatically migrated.
- The executable is built on Windows. Build artifacts are written to \`dist/\`.
