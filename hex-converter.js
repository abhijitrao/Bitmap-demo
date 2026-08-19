(() => {
  function injectStyles() {
    if (document.getElementById('hexConverterStyles')) return;
    const style = document.createElement('style');
    style.id = 'hexConverterStyles';
    style.textContent = `
      .hex-converter-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:1100;padding:20px}
      .hex-converter-modal.open{display:flex}
      .hex-converter-card{width:min(520px,100%);background:#fff;border-radius:14px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25)}
      .hex-converter-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:16px}
      .hex-converter-head h2{margin:0}
      .hex-converter-head p{margin:4px 0 0;color:#667085;font-size:12px}
      .hex-converter-label{display:block;font-size:12px;font-weight:700;color:#475467;margin-bottom:6px}
      .hex-converter-input{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid #ccd2d8;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase}
      .hex-converter-result{margin-top:14px;padding:14px;border-radius:8px;background:#f8fafc;border:1px solid #e1e5e9;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;min-height:20px}
      .hex-converter-detail{margin-top:10px;color:#667085;font-size:12px;line-height:1.5}
      .hex-converter-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
    `;
    document.head.appendChild(style);
  }

  function hexToDecimal(hex) {
    const value = String(hex || '').trim().replace(/^0x/i, '');
    if (!value || !/^[0-9a-f]+$/i.test(value)) return null;
    return BigInt(`0x${value}`).toString(10);
  }

  function openConverter() {
    injectStyles();
    let modal = document.getElementById('hexConverterModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hexConverterModal';
      modal.className = 'hex-converter-modal';
      modal.innerHTML = `
        <div class="hex-converter-card">
          <div class="hex-converter-head">
            <div><h2>HEX to Decimal</h2><p>Convert HEX value to decimal.</p></div>
            <button id="hexConverterClose" class="secondary">Close</button>
          </div>
          <label class="hex-converter-label" for="hexConverterInput">HEX Value</label>
          <input id="hexConverterInput" class="hex-converter-input" placeholder="e.g. 10" autocomplete="off" spellcheck="false">
          <div id="hexConverterResult" class="hex-converter-result">Enter a HEX value.</div>
          <div id="hexConverterDetail" class="hex-converter-detail"></div>
          <div class="hex-converter-actions"><button id="hexConverterClear" class="secondary">Clear</button><button id="hexConverterConvert" class="primary">Convert</button></div>
        </div>`;
      document.body.appendChild(modal);
      const input = modal.querySelector('#hexConverterInput');
      const result = modal.querySelector('#hexConverterResult');
      const detail = modal.querySelector('#hexConverterDetail');
      const convert = () => {
        const hex = input.value.trim().replace(/^0x/i, '').toUpperCase();
        const decimal = hexToDecimal(hex);
        if (decimal === null) {
          result.textContent = hex ? 'Invalid HEX value.' : 'Enter a HEX value.';
          detail.textContent = '';
          return;
        }
        result.textContent = decimal;
        detail.textContent = `${hex} (HEX) = ${decimal} (Decimal)`;
      };
      input.addEventListener('input', convert);
      modal.querySelector('#hexConverterConvert').onclick = convert;
      modal.querySelector('#hexConverterClear').onclick = () => { input.value = ''; result.textContent = 'Enter a HEX value.'; detail.textContent = ''; input.focus(); };
      modal.querySelector('#hexConverterClose').onclick = () => modal.classList.remove('open');
      modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') convert(); if (e.key === 'Escape') modal.classList.remove('open'); });
    }
    modal.classList.add('open');
    modal.querySelector('#hexConverterInput')?.focus();
  }

  window.addEventListener('DOMContentLoaded', () => {
    const actions = document.querySelector('.topbar-actions');
    if (!actions) return;
    const isoFields = [...actions.querySelectorAll('button')].find(button => button.textContent.trim() === 'ISO Fields');
    if (!isoFields || document.getElementById('hexConverterBtn')) return;
    const button = document.createElement('button');
    button.id = 'hexConverterBtn';
    button.className = 'secondary';
    button.textContent = 'Conversion';
    button.onclick = openConverter;
    actions.insertBefore(button, isoFields);
  });
})();
