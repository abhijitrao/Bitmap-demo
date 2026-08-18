const DEFAULT_PACKET_SETTINGS = {
  request: { tpduStartIndex: 4, mtiStartIndex: 14, mtiEndIndex: 18, bitmapIndex: 18, lengthStartIndex: 0, lengthEndIndex: 4 },
  response: { tpduStartIndex: 0, mtiStartIndex: 10, mtiEndIndex: 14, bitmapIndex: 14 }
};

const SETTINGS_KEY = 'bitmap-parser-packet-settings-v1';

function loadPacketSettings() {
  try {
    return { ...DEFAULT_PACKET_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch (_) {
    return { ...DEFAULT_PACKET_SETTINGS };
  }
}

function savePacketSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function numberValue(id, fallback) {
  const value = Number(document.getElementById(id)?.value);
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function openPacketSettings() {
  const settings = loadPacketSettings();
  const existing = document.getElementById('packetSettingsModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'packetSettingsModal';
  modal.className = 'settings-modal-backdrop';
  modal.innerHTML = `
    <div class="settings-modal">
      <div class="settings-head">
        <div><h2>Packet Settings</h2><p>Configure packet indexes used by the parser.</p></div>
        <button id="settingsClose" class="secondary">Close</button>
      </div>
      <div class="settings-section">
        <h3>Request</h3>
        <div class="settings-grid">
          <label>Length Start <input id="reqLengthStart" type="number" min="0" value="${settings.request?.lengthStartIndex ?? 0}"></label>
          <label>Length End <input id="reqLengthEnd" type="number" min="0" value="${settings.request?.lengthEndIndex ?? 4}"></label>
          <label>TPDU Start <input id="reqTpduStart" type="number" min="0" value="${settings.request?.tpduStartIndex ?? 4}"></label>
          <label>MTI Start <input id="reqMtiStart" type="number" min="0" value="${settings.request?.mtiStartIndex ?? 14}"></label>
          <label>MTI End <input id="reqMtiEnd" type="number" min="0" value="${settings.request?.mtiEndIndex ?? 18}"></label>
          <label>Bitmap Start <input id="reqBitmap" type="number" min="0" value="${settings.request?.bitmapIndex ?? 18}"></label>
        </div>
      </div>
      <div class="settings-section">
        <h3>Response</h3>
        <div class="settings-grid">
          <label>TPDU Start <input id="resTpduStart" type="number" min="0" value="${settings.response?.tpduStartIndex ?? 0}"></label>
          <label>MTI Start <input id="resMtiStart" type="number" min="0" value="${settings.response?.mtiStartIndex ?? 10}"></label>
          <label>MTI End <input id="resMtiEnd" type="number" min="0" value="${settings.response?.mtiEndIndex ?? 14}"></label>
          <label>Bitmap Start <input id="resBitmap" type="number" min="0" value="${settings.response?.bitmapIndex ?? 14}"></label>
        </div>
      </div>
      <div class="settings-actions">
        <button id="settingsReset" class="secondary">Reset Defaults</button>
        <button id="settingsSave" class="primary">Save Settings</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('settingsClose').onclick = () => modal.remove();
  document.getElementById('settingsReset').onclick = () => {
    savePacketSettings(DEFAULT_PACKET_SETTINGS);
    modal.remove();
    alert('Packet settings reset.');
  };
  document.getElementById('settingsSave').onclick = () => {
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
    if (typeof doParse === 'function' && document.getElementById('input')?.value.trim()) doParse();
  };
}

// Android's PacketModel values are character/hex indexes. Replace the default prefix reader
// without changing the parser engine, so the web version remains configurable like SettingActivity.
const originalGetPacketPrefix = window.getPacketPrefix;
window.getPacketPrefix = function(hex, response) {
  const all = loadPacketSettings();
  const cfg = response ? all.response : all.request;
  const prefix = response
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
  return prefix;
};

window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('settingsBtn');
  if (button) button.addEventListener('click', openPacketSettings);
});
