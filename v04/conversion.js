(() => {
  function injectStyles() {
    if (document.getElementById('conversionStyles')) return;
    const style = document.createElement('style');
    style.id = 'conversionStyles';
    style.textContent = `.conversion-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:1100;padding:20px}.conversion-modal.open{display:flex}.conversion-card{width:min(430px,100%);background:#fff;border-radius:14px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25)}.conversion-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.conversion-head h2{margin:0}.conversion-input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #d0d5dd;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}.conversion-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.conversion-result{margin-top:18px;padding:14px;border-radius:10px;background:#f8fafc;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}.conversion-error{color:#b42318;font-size:12px;margin-top:8px}`;
    document.head.appendChild(style);
  }

  function openConversion() {
    injectStyles();
    let modal = document.getElementById('conversionModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'conversionModal';
      modal.className = 'conversion-modal';
      modal.innerHTML = `<div class="conversion-card"><div class="conversion-head"><h2>HEX to Decimal</h2><button id="conversionClose" class="secondary">Close</button></div><input id="conversionInput" class="conversion-input" placeholder="Enter HEX value e.g. 10" autocomplete="off" spellcheck="false"><div id="conversionError" class="conversion-error"></div><div class="conversion-actions"><button id="conversionClear" class="secondary">Clear</button><button id="conversionConvert" class="primary">Convert</button></div><div id="conversionResult" class="conversion-result">Enter a HEX value to convert.</div></div>`;
      document.body.appendChild(modal);
      const input = modal.querySelector('#conversionInput');
      const convert = () => {
        const raw = input.value.trim().replace(/^0x/i, '');
        const error = modal.querySelector('#conversionError');
        const result = modal.querySelector('#conversionResult');
        error.textContent = '';
        if (!raw) { result.textContent = 'Enter a HEX value to convert.'; return; }
        if (!/^[0-9a-fA-F]+$/.test(raw)) { error.textContent = 'Invalid HEX value.'; result.textContent = ''; return; }
        try {
          const decimal = BigInt(`0x${raw}`).toString(10);
          result.innerHTML = `${raw.toUpperCase()} (HEX) = <strong>${decimal}</strong> (Decimal)`;
        } catch (_) { error.textContent = 'Unable to convert this HEX value.'; }
      };
      modal.querySelector('#conversionConvert').onclick = convert;
      input.addEventListener('keydown', e => { if (e.key === 'Enter') convert(); });
      modal.querySelector('#conversionClear').onclick = () => { input.value = ''; modal.querySelector('#conversionError').textContent = ''; modal.querySelector('#conversionResult').textContent = 'Enter a HEX value to convert.'; input.focus(); };
      modal.querySelector('#conversionClose').onclick = () => modal.classList.remove('open');
      modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
    }
    modal.classList.add('open');
    modal.querySelector('#conversionInput').focus();
  }

  window.addEventListener('DOMContentLoaded', () => {
    const actions = document.querySelector('.topbar-actions');
    const settingsBtn = document.getElementById('settingsBtn');
    if (!actions || !settingsBtn) return;
    const button = document.createElement('button');
    button.id = 'conversionBtn';
    button.className = 'secondary';
    button.textContent = 'Conversion';
    button.title = 'HEX to Decimal conversion';
    button.onclick = openConversion;
    actions.insertBefore(button, settingsBtn);
  });
})();
