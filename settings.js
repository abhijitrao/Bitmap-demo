const DEFAULT_PACKET_SETTINGS = {
  request: { tpduStartIndex: 4, mtiStartIndex: 14, mtiEndIndex: 18, bitmapIndex: 18, lengthStartIndex: 0, lengthEndIndex: 4 },
  response: { tpduStartIndex: 0, mtiStartIndex: 10, mtiEndIndex: 14, bitmapIndex: 14 }
};

const SETTINGS_KEY = 'bitmap-parser-packet-settings-v1';

function loadPacketSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      request: { ...DEFAULT_PACKET_SETTINGS.request, ...(saved.request || {}) },
      response: { ...DEFAULT_PACKET_SETTINGS.response, ...(saved.response || {}) }
    };
  } catch (_) {
    return {
      request: { ...DEFAULT_PACKET_SETTINGS.request },
      response: { ...DEFAULT_PACKET_SETTINGS.response }
    };
  }
}

function savePacketSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {}
}

function numberValue(id, fallback) {
  const value = Number(document.getElementById(id)?.value);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function openPacketSettings() {
  const settings = loadPacketSettings();
  document.getElementById('packetSettingsModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'packetSettingsModal';
  modal.className = 'settings-modal-backdrop';
  modal.innerHTML = `
    <div class="settings-modal">
      <div class="settings-head">
        <div><h2>Packet Settings</h2><p>Configure packet indexes used by the parser.</p></div>
        <button type="button" id="settingsClose" class="secondary">Close</button>
      </div>
      <div class="settings-section">
        <h3>Request</h3>
        <div class="settings-grid">
          <label>Length Start <input id="reqLengthStart" type="number" min="0" value="${settings.request.lengthStartIndex}"></label>
          <label>Length End <input id="reqLengthEnd" type="number" min="0" value="${settings.request.lengthEndIndex}"></label>
          <label>TPDU Start <input id="reqTpduStart" type="number" min="0" value="${settings.request.tpduStartIndex}"></label>
          <label>MTI Start <input id="reqMtiStart" type="number" min="0" value="${settings.request.mtiStartIndex}"></label>
          <label>MTI End <input id="reqMtiEnd" type="number" min="0" value="${settings.request.mtiEndIndex}"></label>
          <label>Bitmap Start <input id="reqBitmap" type="number" min="0" value="${settings.request.bitmapIndex}"></label>
        </div>
      </div>
      <div class="settings-section">
        <h3>Response</h3>
        <div class="settings-grid">
          <label>TPDU Start <input id="resTpduStart" type="number" min="0" value="${settings.response.tpduStartIndex}"></label>
          <label>MTI Start <input id="resMtiStart" type="number" min="0" value="${settings.response.mtiStartIndex}"></label>
          <label>MTI End <input id="resMtiEnd" type="number" min="0" value="${settings.response.mtiEndIndex}"></label>
          <label>Bitmap Start <input id="resBitmap" type="number" min="0" value="${settings.response.bitmapIndex}"></label>
        </div>
      </div>
      <div class="settings-actions">
        <button type="button" id="settingsReset" class="secondary">Reset Defaults</button>
        <button type="button" id="settingsSave" class="primary">Save Settings</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelector('#settingsClose').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.querySelector('#settingsReset').onclick = () => {
    savePacketSettings({
      request: { ...DEFAULT_PACKET_SETTINGS.request },
      response: { ...DEFAULT_PACKET_SETTINGS.response }
    });
    modal.remove();
    if (typeof window.doParse === 'function' && document.getElementById('input')?.value.trim()) window.doParse();
  };

  modal.querySelector('#settingsSave').onclick = () => {
    const next = {
      request: {
        lengthStartIndex: numberValue('reqLengthStart', 0),
        lengthEndIndex: numberValue('reqLengthEnd', 4),
        tpduStartIndex: numberValue('reqTpduStart', 4),
        mtiStartIndex: numberValue('reqMtiStart', 14),
        mtiEndIndex: numberValue('reqMtiEnd', 18),
        bitmapIndex: numberValue('reqBitmap', 18)
      },
      response: {
        tpduStartIndex: numberValue('resTpduStart', 0),
        mtiStartIndex: numberValue('resMtiStart', 10),
        mtiEndIndex: numberValue('resMtiEnd', 14),
        bitmapIndex: numberValue('resBitmap', 14)
      }
    };

    if (next.request.mtiEndIndex <= next.request.mtiStartIndex || next.request.bitmapIndex < next.request.mtiEndIndex) {
      alert('Invalid Request indexes. MTI End must be after MTI Start and Bitmap Start must be after MTI.');
      return;
    }
    if (next.response.mtiEndIndex <= next.response.mtiStartIndex || next.response.bitmapIndex < next.response.mtiEndIndex) {
      alert('Invalid Response indexes. MTI End must be after MTI Start and Bitmap Start must be after MTI.');
      return;
    }

    savePacketSettings(next);
    modal.remove();
    if (typeof window.doParse === 'function' && document.getElementById('input')?.value.trim()) window.doParse();
  };
}

window.openPacketSettings = openPacketSettings;

// Keep the packet-prefix configuration hook compatible with the existing parser.
window.getPacketPrefix = function(hex, response) {
  const all = loadPacketSettings();
  const cfg = response ? all.response : all.request;
  return response
    ? {
        tpdu: hex.slice(cfg.tpduStartIndex, cfg.mtiStartIndex),
        mti: hex.slice(cfg.mtiStartIndex, cfg.mtiEndIndex),
        bitmapStart: cfg.bitmapIndex
      }
    : {
        length: hex.slice(cfg.lengthStartIndex, cfg.lengthEndIndex),
        tpdu: hex.slice(cfg.tpduStartIndex, cfg.mtiStartIndex),
        mti: hex.slice(cfg.mtiStartIndex, cfg.mtiEndIndex),
        bitmapStart: cfg.bitmapIndex
      };
};

// Bind directly because this script is loaded after the Settings button exists.
const settingsButton = document.getElementById('settingsBtn');
if (settingsButton) settingsButton.addEventListener('click', openPacketSettings);
