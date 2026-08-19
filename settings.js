const DEFAULT_PACKET_SETTINGS = {
  request: { tpduStartIndex: 4, mtiStartIndex: 14, mtiEndIndex: 18, bitmapIndex: 18, lengthStartIndex: 0, lengthEndIndex: 4 },
  response: { tpduStartIndex: 0, mtiStartIndex: 10, mtiEndIndex: 14, bitmapIndex: 14 }
};

const SETTINGS_KEY = 'bitmap-parser-packet-settings-v1';
const DE_PARSING_DEFAULT_CHARS = ['|', '^', '\\', '~'];

function loadPacketSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      request: { ...DEFAULT_PACKET_SETTINGS.request, ...(saved.request || {}) },
      response: { ...DEFAULT_PACKET_SETTINGS.response, ...(saved.response || {}) },
      deParsingSpecialChars: Array.isArray(saved.deParsingSpecialChars) && saved.deParsingSpecialChars.length
        ? [...new Set(saved.deParsingSpecialChars.filter(v => typeof v === 'string' && v.length === 1))]
        : [...DE_PARSING_DEFAULT_CHARS]
    };
  } catch (_) {
    return {
      request: { ...DEFAULT_PACKET_SETTINGS.request },
      response: { ...DEFAULT_PACKET_SETTINGS.response },
      deParsingSpecialChars: [...DE_PARSING_DEFAULT_CHARS]
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
      <div class="settings-section">
        <h3>DE Parsing Special Characters</h3>
        <p>One character per entry. Characters are detected by their position in the input; there is no configured priority.</p>
        <div id="deSpecialCharsList" style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0"></div>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="deSpecialCharInput" type="text" maxlength="1" placeholder="Character" style="width:110px">
          <button type="button" id="deSpecialCharAdd" class="secondary">Add</button>
        </div>
      </div>
      <div class="settings-actions">
        <button type="button" id="settingsReset" class="secondary">Reset Defaults</button>
        <button type="button" id="settingsSave" class="primary">Save Settings</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  let deChars = [...settings.deParsingSpecialChars];
  const renderDeChars = () => {
    const list = modal.querySelector('#deSpecialCharsList');
    list.innerHTML = deChars.map((char, index) => `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid #d0d5dd;border-radius:7px;background:#f8fafc;font-family:ui-monospace,monospace">${escapeHtml(char)}<button type="button" class="secondary" data-remove-de-char="${index}" style="padding:2px 6px!important">×</button></span>`).join('');
    list.querySelectorAll('[data-remove-de-char]').forEach(btn => btn.onclick = () => { deChars.splice(Number(btn.dataset.removeDeChar), 1); renderDeChars(); });
  };
  renderDeChars();

  modal.querySelector('#deSpecialCharAdd').onclick = () => {
    const value = modal.querySelector('#deSpecialCharInput').value;
    if (value && !deChars.includes(value)) deChars.push(value);
    modal.querySelector('#deSpecialCharInput').value = '';
    renderDeChars();
  };
  modal.querySelector('#deSpecialCharInput').addEventListener('keydown', e => { if (e.key === 'Enter') modal.querySelector('#deSpecialCharAdd').click(); });

  modal.querySelector('#settingsClose').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  modal.querySelector('#settingsReset').onclick = () => {
    savePacketSettings({ request: { ...DEFAULT_PACKET_SETTINGS.request }, response: { ...DEFAULT_PACKET_SETTINGS.response }, deParsingSpecialChars: [...DE_PARSING_DEFAULT_CHARS] });
    modal.remove();
    if (typeof window.doParse === 'function' && document.getElementById('input')?.value.trim()) window.doParse();
  };

  modal.querySelector('#settingsSave').onclick = () => {
    const next = {
      request: {
        lengthStartIndex: numberValue('reqLengthStart', 0), lengthEndIndex: numberValue('reqLengthEnd', 4), tpduStartIndex: numberValue('reqTpduStart', 4), mtiStartIndex: numberValue('reqMtiStart', 14), mtiEndIndex: numberValue('reqMtiEnd', 18), bitmapIndex: numberValue('reqBitmap', 18)
      },
      response: {
        tpduStartIndex: numberValue('resTpduStart', 0), mtiStartIndex: numberValue('resMtiStart', 10), mtiEndIndex: numberValue('resMtiEnd', 14), bitmapIndex: numberValue('resBitmap', 14)
      },
      deParsingSpecialChars: [...deChars]
    };
    if (next.request.mtiEndIndex <= next.request.mtiStartIndex || next.request.bitmapIndex < next.request.mtiEndIndex) { alert('Invalid Request indexes. MTI End must be after MTI Start and Bitmap Start must be after MTI.'); return; }
    if (next.response.mtiEndIndex <= next.response.mtiStartIndex || next.response.bitmapIndex < next.response.mtiEndIndex) { alert('Invalid Response indexes. MTI End must be after MTI Start and Bitmap Start must be after MTI.'); return; }
    savePacketSettings(next);
    modal.remove();
    if (typeof window.doParse === 'function' && document.getElementById('input')?.value.trim()) window.doParse();
  };
}

function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
window.openPacketSettings = openPacketSettings;
window.getPacketPrefix = function(hex, response) { const all=loadPacketSettings(),cfg=response?all.response:all.request; return response?{tpdu:hex.slice(cfg.tpduStartIndex,cfg.mtiStartIndex),mti:hex.slice(cfg.mtiStartIndex,cfg.mtiEndIndex),bitmapStart:cfg.bitmapIndex}:{length:hex.slice(cfg.lengthStartIndex,cfg.lengthEndIndex),tpdu:hex.slice(cfg.tpduStartIndex,cfg.mtiStartIndex),mti:hex.slice(cfg.mtiStartIndex,cfg.mtiEndIndex),bitmapStart:cfg.bitmapIndex}; };
window.getDEParsingSpecialChars = function(){ return loadPacketSettings().deParsingSpecialChars; };
const settingsButton = document.getElementById('settingsBtn');
if (settingsButton) settingsButton.addEventListener('click', openPacketSettings);
