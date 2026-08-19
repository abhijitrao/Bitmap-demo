(function () {
  const output = document.getElementById('output');
  if (!output) return;

  let updating = false;

  // Same fields as Iso.kt ignoredConvertToAsciiList.
  // When Convert ASCII is enabled, these field values must remain HEX.
  const ignoredConvertToAsciiList = new Set([
    3, 4, 6, 7, 10, 11, 12, 13, 15, 22, 24, 49, 51, 55
  ]);

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
    lines.push(`TPDU: ${parsed.tpdu}`, `MTI: ${parsed.mti}`, `Bitmap: ${parsed.bitmapHex}`, '', 'Data Elements of Bitmap');

    for (const row of rows) {
      const isLlvar = row.type === 'LLVAR' || row.type === 'LLVAR_DYNAMIC';
      const lenTag = isLlvar ? String(row.lengthInfo || '').split(' / ')[0] : '';
      const shouldConvert = convert && !ignoredConvertToAsciiList.has(row.n);
      const value = hide ? '********' : (shouldConvert ? window.__isoAscii(row.valueHex) : row.valueHex);
      const number = String(row.n).padStart(3, ' ');
      const parts = [number];
      if (showName) parts.push(`(${row.name})`);
      if (showLength) parts.push(`(${row.lengthInfo})`);
      parts.push('=', isLlvar && !hide && !convert ? `${lenTag} ${value}` : value);
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
      cleaned.push(line.replace(/^(\s*)DE\s+(\d{1,3})(\s*=)/, '$1$2$3'));
    }
    return cleaned.join('\n');
  }

  function centerText(value, width) {
    const text = String(value);
    if (text.length >= width) return text;
    const total = width - text.length;
    const left = Math.floor(total / 2);
    const right = total - left;
    return ' '.repeat(left) + text + ' '.repeat(right);
  }

  function formatBitmapColumns(text) {
    const lines = text.split('\n');
    const headerIndex = lines.findIndex(line => /^DE\s+Field Type\s+Length\s+Field Name$/.test(line.trim()) || /^DE\s+Type\s+Length\s+Field Name$/.test(line.trim()));
    if (headerIndex < 0) return text;

    const result = [...lines];
    // Compact fixed columns. Only the Length values are centered inside the Length column.
    result[headerIndex] = `${'DE'.padEnd(5, ' ')}${'Type'.padEnd(10, ' ')}${'Length'.padEnd(8, ' ')}Field Name`;

    for (let i = headerIndex + 1; i < result.length; i++) {
      const line = result[i];
      if (!line.trim() || /^Invalid packet:|^Unparsed trailing data:/.test(line.trim())) break;
      const match = line.match(/^\s*(\d{1,3})\s+(\S+)\s+(\S+)\s+(.+)$/);
      if (!match) continue;
      const [, de, type, length, name] = match;
      result[i] = `${de.padEnd(5, ' ')}${type.padEnd(10, ' ')}${centerText(length, 8)}${name}`;
    }
    return result.join('\n');
  }

  window.__isoAscii = window.__isoAscii || function (hex) {
    let out = '';
    for (let i = 0; i < hex.length; i += 2) {
      const n = parseInt(hex.slice(i, i + 2), 16);
      out += n >= 32 && n <= 126 ? String.fromCharCode(n) : '.';
    }
    return out;
  };

  window.formatIso = function (parsed) {
    return formatIsoWithLlvarLength(parsed);
  };

  function cleanIsoOutput() {
    if (updating || !isIsoMode()) return;
    const text = output.textContent || '';
    if (!text) return;
    const result = formatBitmapColumns(removeNestedTlvAndNormalize(text));
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
