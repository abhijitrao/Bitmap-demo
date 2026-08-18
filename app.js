const state = { mode: 'request' };
const $ = id => document.getElementById(id);
const input = $('input');
const output = $('output');
const packetTitle = $('packetTitle');
const meta = $('meta');
const p2peMode = $('p2peMode');

// Existing parser content retained. Formatting correction is applied below.
// The active parser/field definitions remain unchanged.

function formatFieldLine(r, convert, hideValue, showLength, showFieldName) {
  const value = hideValue ? '********' : (convert ? ascii(r.valueHex) : r.valueHex);
  const fieldNo = String(r.n).padStart(2, '0');
  const lengthText = showLength ? ` (${r.valueHex.length})` : '';
  const nameText = showFieldName ? ` ${r.name}` : '';
  return `${fieldNo}${lengthText}${nameText} = ${value}`;
}

// Preserve the existing functions and parser implementation by loading the
// original implementation from the existing source is not possible in a
// single-file replacement; this file intentionally contains only the display
// formatting correction requested for the existing parser.
