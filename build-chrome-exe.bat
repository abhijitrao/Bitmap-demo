@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if errorlevel 1 (
  echo Python launcher was not found. Install Python 3.10 or newer first.
  pause
  exit /b 1
)

py -3 -m pip install --upgrade -r requirements-build.txt
if errorlevel 1 (
  echo Failed to install build dependencies.
  pause
  exit /b 1
)

py -3 -m PyInstaller --noconfirm --clean --onefile --windowed --name "Bitmap Parser" ^
  --add-data "index.html;." ^
  --add-data "styles.css;." ^
  --add-data "app.js;." ^
  --add-data "custom-fields.js;." ^
  --add-data "settings.js;." ^
  --add-data "saved-packets.js;." ^
  --add-data "tlv-parser.js;." ^
  --add-data "iso-output-fix.js;." ^
  --add-data "copy-fix.js;." ^
  --add-data "hex-converter.js;." ^
  --add-data "de-parser.js;." ^
  --add-data "result-meta-fix.js;." ^
  launcher.py

if errorlevel 1 (
  echo EXE build failed.
  pause
  exit /b 1
)

echo.
echo Build completed: dist\Bitmap Parser.exe
pause
