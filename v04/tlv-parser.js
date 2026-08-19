// Android-compatible TLV / EMV parser.
// Based on Bitmap-parser's TLVParser.kt: 1-2 byte tag + 1 byte length + value.
// Keeps the original HEX length bytes for display.
(function () {
  const TEMPLATE_TAGS = new Set(['61', '6F', '70', '77', '80', 'A5', 'BF0C']);
  let normalizing = false;

  function parseAndroidTlv(data, depth = 0) {
    const hex = String(data || '').replace(/\s+/g, '').toUpperCase();
    const rows = [];
    let index = 0;

    while (index < hex.length) {
      const tagStart = index;
      if (index + 2 > hex.length) throw new Error(`Incomplete TLV tag at HEX offset ${index}`);

      let tag = hex.slice(index, index + 2);
      index += 2;
      if ((parseInt(tag, 16) & 0x1F) === 0x1F) {
        if (index + 2 > hex.length) throw new Error(`Incomplete TLV tag ${tag}`);
        tag += hex.slice(index, index + 2);
        index += 2;
      }

      if (index + 2 > hex.length) throw new Error(`Incomplete length for tag ${tag}`);
      const firstLengthHex = hex.slice(index, index + 2);
      const firstLength = parseInt(firstLengthHex, 16);
      index += 2;

      let length = firstLength;
      let lengthHex = firstLengthHex;
      if (firstLength & 0x80) {
        const count = firstLength & 0x7F;
        if (!count || index + count * 2 > hex.length) throw new Error(`Invalid long-form length for tag ${tag}`);
        lengthHex += hex.slice(index, index + count * 2);
        length = parseInt(hex.slice(index, index + count * 2), 16);
        index += count * 2;
      }

      const valueHexLength = length * 2;
      if (index + valueHexLength > hex.length) {
        throw new Error(`Tag ${tag} declares ${length} bytes but only ${Math.max(0, (hex.length - index) / 2)} remain`);
      }

      const value = hex.slice(index, index + valueHexLength);
      index += valueHexLength;
      const tagName = (typeof TAGS !== 'undefined' && TAGS[tag]) || '';
      const row = { tag, tagName, length, lengthHex, value, depth, offset: tagStart };

      if (TEMPLATE_TAGS.has(tag) && value) {
        try {
          const children = parseAndroidTlv(value, depth + 1);
          if (children.length) row.children = children;
        } catch (_) {}
      }
      rows.push(row);
    }
    return rows;
  }

  function formatAndroidTlv(rows, lines = [], indent = '') {
    for (const row of rows) {
      const name = row.tagName ? `  ${row.tagName}` : '';
      lines.push(`${indent}${row.tag}${name}  [${row.lengthHex}]  ${row.value}`);
      if (row.children && row.children.length) formatAndroidTlv(row.children, lines, indent + '  ');
    }
    return lines;
  }

  function normalizeAppTlvOutput() {
    if (normalizing) return;
    const active = document.querySelector('.mode.active');
    if (active?.dataset?.mode !== 'tlv') return;
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    if (!input || !output || !input.value.trim()) return;

    try {
      const rows = parseAndroidTlv(input.value);
      const convert = document.getElementById('convertAscii')?.checked;
      const ascii = hex => {
        let out = '';
        for (let i = 0; i < hex.length; i += 2) {
          const n = parseInt(hex.slice(i, i + 2), 16);
          out += n >= 32 && n <= 126 ? String.fromCharCode(n) : '.';
        }
        return out;
      };
      const lines = [];
      for (const row of rows) {
        const value = convert ? ascii(row.value) : row.value;
        lines.push(`${row.tag} [${row.lengthHex}] ${value}`);
      }
      const text = lines.join('\n') || 'No valid TLV data';
      if (output.textContent !== text) {
        normalizing = true;
        output.textContent = text;
        normalizing = false;
      }
    } catch (_) {
      // Keep app.js error/result output unchanged when the input is incomplete.
    }
  }

  window.parseTlv = parseAndroidTlv;
  window.formatTlv = formatAndroidTlv;

  window.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const modeRow = document.getElementById('modeRow');
    if (output) new MutationObserver(normalizeAppTlvOutput).observe(output, { childList: true, characterData: true, subtree: true });
    modeRow?.addEventListener('click', () => setTimeout(normalizeAppTlvOutput, 0));
    document.getElementById('input')?.addEventListener('input', () => setTimeout(normalizeAppTlvOutput, 350));
  });
})();
