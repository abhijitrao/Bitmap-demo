/* Saved packet history - browser-local equivalent of the Android saved packet list. */
(function () {
  const KEY = 'bitmap-parser-saved-packets-v1';
  const $ = id => document.getElementById(id);

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }
  function saveAll(items) { localStorage.setItem(KEY, JSON.stringify(items)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function ensureStyles() {
    if ($('savedPacketStyles')) return;
    const style = document.createElement('style');
    style.id = 'savedPacketStyles';
    style.textContent = `.saved-overlay{position:fixed;inset:0;background:rgba(15,23,42,.35);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}.saved-dialog{background:#fff;width:min(760px,100%);max-height:80vh;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden}.saved-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e5e7eb}.saved-head h3{margin:0;font-size:18px}.saved-list{padding:10px;overflow:auto;max-height:60vh}.saved-empty{padding:35px;text-align:center;color:#64748b}.saved-item{display:flex;gap:12px;align-items:center;padding:12px;border:1px solid #e5e7eb;border-radius:10px;margin:8px 0}.saved-main{flex:1;min-width:0}.saved-name{font-weight:600}.saved-meta{font-size:12px;color:#64748b;margin-top:4px}.saved-preview{font-family:monospace;font-size:11px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:5px}.saved-actions{display:flex;gap:6px}.saved-actions button{padding:7px 10px;border:1px solid #cbd5e1;background:#fff;border-radius:7px;cursor:pointer}.saved-actions .load{background:#0f172a;color:#fff;border-color:#0f172a}.saved-footer{padding:12px 20px;border-top:1px solid #e5e7eb;text-align:right}`;
    document.head.appendChild(style);
  }

  function close() { $('savedOverlay')?.remove(); }

  function open() {
    ensureStyles();
    close();
    const items = loadAll();
    const overlay = document.createElement('div'); overlay.id = 'savedOverlay'; overlay.className = 'saved-overlay';
    overlay.innerHTML = `<div class="saved-dialog"><div class="saved-head"><h3>Saved Packets</h3><button id="savedClose">✕</button></div><div class="saved-list" id="savedList"></div><div class="saved-footer"><button id="savedClose2">Close</button></div></div>`;
    document.body.appendChild(overlay);
    $('savedClose').onclick = close; $('savedClose2').onclick = close;
    const list = $('savedList');
    if (!items.length) { list.innerHTML = '<div class="saved-empty">No saved packets.</div>'; return; }
    list.innerHTML = items.map((x,i) => `<div class="saved-item"><div class="saved-main"><div class="saved-name">${esc(x.name)}</div><div class="saved-meta">${esc(x.mode)} · ${new Date(x.createdAt).toLocaleString()}</div><div class="saved-preview">${esc(x.packet)}</div></div><div class="saved-actions"><button class="load" data-load="${i}">Load</button><button data-delete="${i}">Delete</button></div></div>`).join('');
    list.querySelectorAll('[data-load]').forEach(btn => btn.onclick = () => {
      const item = items[Number(btn.dataset.load)];
      if (!item) return;
      const input = $('input'); if (input) input.value = item.packet;
      document.querySelectorAll('.mode').forEach(b => b.classList.toggle('active', b.dataset.mode === item.mode));
      if (window.state) window.state.mode = item.mode;
      close();
      if (typeof window.doParse === 'function') window.doParse();
      else if (typeof window.exactAndroidParse === 'function') window.exactAndroidParse();
    });
    list.querySelectorAll('[data-delete]').forEach(btn => btn.onclick = () => {
      const index = Number(btn.dataset.delete); const current = loadAll(); current.splice(index,1); saveAll(current); open();
    });
  }

  function saveCurrent() {
    const input = $('input'); const packet = (input?.value || '').replace(/\s+/g,'').toUpperCase();
    if (!packet) { alert('Enter a packet before saving.'); return; }
    const mode = window.state?.mode || document.querySelector('.mode.active')?.dataset.mode || 'request';
    const defaultName = `${mode.toUpperCase()} - ${packet.slice(0, 16)}`;
    const name = prompt('Packet name:', defaultName);
    if (name === null) return;
    const cleanName = name.trim() || defaultName;
    const items = loadAll();
    items.unshift({ id: Date.now().toString(36), name: cleanName, mode, packet, createdAt: Date.now() });
    saveAll(items.slice(0, 100));
  }

  function init() {
    const top = document.querySelector('.topbar-actions');
    if (!top || $('savedPacketsBtn')) return;
    const saveBtn = document.createElement('button'); saveBtn.id='savePacketBtn'; saveBtn.className='secondary'; saveBtn.textContent='Save Packet'; saveBtn.onclick=saveCurrent;
    const listBtn = document.createElement('button'); listBtn.id='savedPacketsBtn'; listBtn.className='secondary'; listBtn.textContent='Saved Packets'; listBtn.onclick=open;
    top.insertBefore(saveBtn, top.firstChild); top.insertBefore(listBtn, saveBtn.nextSibling);
  }
  window.addEventListener('DOMContentLoaded', init);
})();
