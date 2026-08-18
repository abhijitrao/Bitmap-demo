(function () {
  const output = document.getElementById('output');
  if (!output) return;

  let updating = false;

  function isIsoMode() {
    const active = document.querySelector('.mode.active');
    const mode = active?.dataset?.mode;
    return mode === 'request' || mode === 'response';
  }

  function formatIsoWithLlvarLength(parsed) {
    const showName = document.getElementById('showFieldName')?.checked;
    const showLength = document.getElementById('showLength')?.checked;
    const convert = document.getElementById('convertAscii')?.checked;
    const hide = document.getElementById('hideValue')?.checked;
    const original = document.getElementById('originalOrder')?.checked;

    const rows = original ? parsed.rows : [...parsed.rows].sort((a, b) => a.n - b.n);
    const lines = [];

    if (parsed.length) lines.push(`Length: ${parsed.length}`);
    lines.push(`TPDU: ${parsed.tpdu}`, `MTI: ${parsed.mti}`, `Bitmap: ${parsed.bitmapHex}`, `Processing Code: ${parsed.processingCode || '-'}`, '');

    for (const row of rows) {
      const isLlvar = row.type === 'LLVAR' || row.type === 'LLVAR_DYNAMIC';
      const lenTag = isLlvar ? String(row.lengthInfo || '').split(' / ')[0] : '';
      let value = hide ? '********' : (convert ? window.__isoAscii(row.valueHex) : row.valueHex);

      // LLVAR is displayed as: <length> <packet data>.
      // Parsing itself remains unchanged and is still based on HEX characters.
      if (isLlvar && !hide) value = `${lenTag} ${value}`;

      const parts = [String(row.n).padStart(2, '0')];
      if (showName) parts.push(row.name);
      parts.push('=', value);
      if (showLength) parts.push(`[${row.lengthInfo}]`);
      lines.push(parts.join(' '));
    }

    if (parsed.remaining) lines.push('', `Unparsed trailing data: ${parsed.remaining}`);
    return lines.join('\n');
  }

  function removeNestedTlvAndNormalize(text) {
    const lines = text.split('\n');
    const cleaned = [];
    let skip = false;

    for (const line of lines) {
      if (line.trim() === 'EMV/TLV:') {
        skip = true;
        continue;
      }
      if (skip && /^DE\s+\d+\s*=/.test(line.trim())) skip = false;
      if (skip) continue;

      // ISO result should show field number without the DE prefix.
      cleaned.push(line.replace(/^(\s*)DE\s+(\d{1,3})(\s*=)/, '$1$2$3'));
    }
    return cleaned.join('\n');
  }

  // app.js owns parsing. This file only controls ISO result presentation.
  window.__isoAscii = window.__isoAscii || function (hex) {
    let out = '';
    for (let i = 0; i < hex.length; i += 2) {
      const n = parseInt(hex.slice(i, i + 2), 16);
      out += n >= 32 && n <= 126 ? String.fromCharCode(n) : '.';
    }
    return out;
  };

  const originalFormatIso = window.formatIso;
  if (typeof originalFormatIso === 'function') {
    window.formatIso = function (parsed) {
      return formatIsoWithLlvarLength(parsed);
    };
  }

  function cleanIsoOutput() {
    if (updating || !isIsoMode()) return;
    const text = output.textContent || '';
    if (!text) return;

    const result = removeNestedTlvAndNormalize(text);
    if (result !== text) {
      updating = true;
      output.textContent = result;
      updating = false;
    }
  }

  const observer = new MutationObserver(cleanIsoOutput);
  observer.observe(output, { childList: true, characterData: true, subtree: true });

  document.getElementById('modeRow')?.addEventListener('click', () => setTimeout(cleanIsoOutput, 0));
  cleanIsoOutput();
})();
