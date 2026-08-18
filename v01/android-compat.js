/* Android parser compatibility layer. Loaded after app.js. */
(() => {
  const ANDROID_IGNORED_ASCII = new Set(['3','4','6','7','10','11','12','13','15','22','24','49','51','55']);
  window.ANDROID_IGNORED_ASCII = ANDROID_IGNORED_ASCII;

  function hexToAscii(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
    return bytes.map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : '.').join('');
  }

  window.androidFormatValue = function(row, convertAscii, hideValue) {
    if (hideValue) return '********';
    if (!convertAscii || ANDROID_IGNORED_ASCII.has(String(row.n))) return row.valueHex;
    return hexToAscii(row.valueHex);
  };

  function renderAndroidIso(parsed) {
    const $ = id => document.getElementById(id);
    const lines = [];
    if (parsed.length) lines.push(`Length: ${parsed.length}`);
    if (parsed.tpdu) lines.push(`TPDU: ${parsed.tpdu}`);
    lines.push(`MTI: ${parsed.mti}`, `Bitmap: ${parsed.bitmapHex}`, `Processing Code: ${parsed.processingCode || '-'}`, '');

    const rows = $('originalOrder')?.checked ? parsed.rows : [...parsed.rows].sort((a,b) => a.n - b.n);
    for (const r of rows) {
      const parts = [`DE ${String(r.n).padStart(3, ' ')}`];
      if ($('showFieldName')?.checked) parts.push(`(${r.name})`);
      if ($('showLength')?.checked) parts.push(`(${r.declaredLength != null ? r.declaredLength : r.valueHex.length / 2})`);
      parts.push('=', window.androidFormatValue(r, $('convertAscii')?.checked, $('hideValue')?.checked));
      lines.push(parts.join(' '));
      if (r.n === 55 && r.valueHex && typeof window.parseTlv === 'function') {
        const tlv = window.parseTlv(r.valueHex);
        if (tlv.length) {
          lines.push('  EMV/TLV:');
          if (typeof window.formatTlv === 'function') window.formatTlv(tlv, lines, '    ');
        }
      }
      lines.push('');
    }
    if (parsed.remaining) lines.push(`Unparsed trailing data: ${parsed.remaining}`);
    return lines.join('\n');
  }

  function getMode() {
    return document.querySelector('.mode.active')?.dataset.mode || 'request';
  }

  function parseWithAndroidSettings(hex, response) {
    const defaults = {
      request: {lengthStartIndex:0,lengthEndIndex:4,tpduStartIndex:4,mtiStartIndex:14,mtiEndIndex:18,bitmapIndex:18},
      response: {tpduStartIndex:0,mtiStartIndex:10,mtiEndIndex:14,bitmapIndex:14}
    };
    const saved = JSON.parse(localStorage.getItem('bitmap-parser-packet-settings-v1') || '{}');
    const cfg = {...defaults[response ? 'response' : 'request'], ...(saved[response ? 'response' : 'request'] || {})};
    const prefix = response
      ? {tpdu:hex.slice(cfg.tpduStartIndex,cfg.mtiStartIndex),mti:hex.slice(cfg.mtiStartIndex,cfg.mtiEndIndex),bitmapStart:cfg.bitmapIndex}
      : {length:hex.slice(cfg.lengthStartIndex,cfg.lengthEndIndex),tpdu:hex.slice(cfg.tpduStartIndex,cfg.mtiStartIndex),mti:hex.slice(cfg.mtiStartIndex,cfg.mtiEndIndex),bitmapStart:cfg.bitmapIndex};

    let pos = prefix.bitmapStart;
    let bitmapHex = hex.slice(pos, pos + 16);
    if (bitmapHex.length !== 16) throw new Error('Bitmap is incomplete');
    pos += 16;
    let bits = window.bitmapBits(bitmapHex);
    if (bits[0] === '1') {
      const second = hex.slice(pos, pos + 16);
      if (second.length !== 16) throw new Error('Secondary bitmap is incomplete');
      bitmapHex += second;
      pos += 16;
      bits = window.bitmapBits(bitmapHex);
    }
    const active = [...bits].map((v,i) => v === '1' ? i + 1 : 0).filter(Boolean);
    const parsedFields = window.parseFields(hex.slice(pos), active, response);
    return {...prefix, bitmapHex, bits, active, rest:hex.slice(pos), ...parsedFields};
  }

  function install() {
    const btn = document.getElementById('parseBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const mode = getMode();
      if (mode !== 'request' && mode !== 'response') return;
      const raw = document.getElementById('input')?.value?.trim() || '';
      if (!raw) return;
      const hex = raw.replace(/\s+/g, '').replace(/0x/gi, '').toUpperCase();
      if (!/^[0-9A-F]+$/.test(hex) || hex.length % 2) return;
      try {
        const parsed = parseWithAndroidSettings(hex, mode === 'response');
        document.getElementById('output').textContent = renderAndroidIso(parsed);
      } catch (_) {
        // Original parser remains responsible for validation/error presentation.
      }
    }, true);
  }

  window.addEventListener('DOMContentLoaded', install);
})();
