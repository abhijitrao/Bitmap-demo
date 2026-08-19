// Android-compatible TLV / EMV parser.
// Based on Bitmap-parser's TLVParser.kt: 1-2 byte tag + 1 byte length + value.
// Adds safe validation and nested parsing for EMV templates without changing ISO parsing.
(function () {
  const TEMPLATE_TAGS = new Set(['61', '6F', '70', '77', '80', 'A5', 'BF0C']);

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
      // Preserve the exact original HEX length byte for display.
      const lengthHex = hex.slice(index, index + 2);
      const length = parseInt(lengthHex, 16);
      index += 2;

      if (!Number.isFinite(length)) throw new Error(`Invalid length ${lengthHex} for tag ${tag}`);
      const valueHexLength = length * 2;
      if (index + valueHexLength > hex.length) {
        throw new Error(`Tag ${tag} declares ${length} bytes but only ${Math.max(0, (hex.length - index) / 2)} remain`);
      }

      const value = hex.slice(index, index + valueHexLength);
      index += valueHexLength;

      const tagName = (typeof TAGS !== 'undefined' && TAGS[tag]) || '';
      const row = {
        tag,
        tagName,
        length,
        lengthHex,
        value,
        depth,
        offset: tagStart
      };

      if (TEMPLATE_TAGS.has(tag) && value) {
        try {
          const children = parseAndroidTlv(value, depth + 1);
          if (children.length) row.children = children;
        } catch (_) {
          // Keep the outer TLV visible when a proprietary template isn't valid TLV.
        }
      }

      rows.push(row);
    }

    return rows;
  }

  function formatAndroidTlv(rows, lines = [], indent = '') {
    for (const row of rows) {
      const value = row.value;
      const name = row.tagName ? `  ${row.tagName}` : '';
      // Display the original HEX length byte, not the decimal length.
      lines.push(`${indent}${row.tag}${name}  [${row.lengthHex}]  ${value}`);
      if (row.children && row.children.length) {
        formatAndroidTlv(row.children, lines, indent + '  ');
      }
    }
    return lines;
  }

  window.parseTlv = parseAndroidTlv;
  window.formatTlv = formatAndroidTlv;
})();
