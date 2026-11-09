#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

python3 -m pip install --user --upgrade -r requirements-build.txt
python3 -m PyInstaller --noconfirm --clean --onefile --name "Bitmap Parser" \
  --add-data "index.html:." \
  --add-data "app-version.js:." \
  --add-data "styles.css:." \
  --add-data "app.js:." \
  --add-data "custom-fields.js:." \
  --add-data "settings.js:." \
  --add-data "saved-packets.js:." \
  --add-data "tlv-parser.js:." \
  --add-data "iso-output-fix.js:." \
  --add-data "copy-fix.js:." \
  --add-data "hex-converter.js:." \
  --add-data "de-parser.js:." \
  --add-data "result-meta-fix.js:." \
  launcher.py

chmod +x "dist/Bitmap Parser"
echo "Build completed: dist/Bitmap Parser"
