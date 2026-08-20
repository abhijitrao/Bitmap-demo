(() => {
  const DEFAULT_CHARS = ['|', '^', '\\', '~'];
  function getSeparators() { const chars = typeof window.getDEParsingSpecialChars === 'function' ? window.getDEParsingSpecialChars() : DEFAULT_CHARS; return [...new Set((chars || []).filter(c => typeof c === 'string' && c.length === 1))]; }
  function findNextSeparator(text) { const chars = getSeparators(); for (let i = 0; i < text.length; i++) if (chars.includes(text[i])) return { index: i, separator: text[i] }; return null; }
  function parseLevel(text) { const value = String(text ?? ''); const next = findNextSeparator(value); return next ? value.split(next.separator).map(parseLevel) : value; }
  function parse(text) { return parseLevel(String(text ?? '')); }
  function getMaxIndexWidth(value, current = 1) { if (!Array.isArray(value)) return current; value.forEach((item, index) => { current = Math.max(current, String(index).length); current = getMaxIndexWidth(item, current); }); return current; }
  function rawLines(value, lines = [], level = 0, indexWidth = 1) {
    const indent = '\t'.repeat(level);
    if (!Array.isArray(value)) { lines.push(`${indent}${value}`); return lines; }
    value.forEach((item, index) => {
      // Keep bracket contents compact. Only the position before '=' is padded.
      const indexText = String(index);
      const bracketedIndex = `[${indexText}]`;
      const maxBracketWidth = indexWidth + 2;
      const equalsPadding = ' '.repeat(Math.max(1, maxBracketWidth - bracketedIndex.length + 1));
      if (Array.isArray(item)) lines.push(`${indent}${bracketedIndex}${equalsPadding}=`);
      else lines.push(`${indent}${bracketedIndex}${equalsPadding}= ${item}`);
      if (Array.isArray(item)) rawLines(item, lines, level + 1, indexWidth);
    });
    return lines;
  }
  function formatRaw(parsed) { return rawLines(parsed, [], 0, getMaxIndexWidth(parsed)).join('\n'); }
  function formatJson(parsed) { return JSON.stringify(parsed, null, 2); }
  function parseAndRender() { const input = document.getElementById('input'), output = document.getElementById('output'), jsonRadio = document.getElementById('deOutputJson'); if (!input || !output) return; try { const parsed = parse(input.value); output.textContent = jsonRadio?.checked ? formatJson(parsed) : formatRaw(parsed); } catch (error) { output.textContent = `DE Parser Error: ${error.message}`; } }
  function setDEMode(active) { const options = document.querySelector('.options'); if (options) options.style.display = active ? 'none' : ''; document.getElementById('parseBtn')?.classList.toggle('de-parser-active', active); const existing = document.getElementById('deOutputOptions'); if (existing) existing.remove(); if (!active) return; const resultHead = document.querySelector('.result-head'); if (resultHead) { const wrapper = document.createElement('div'); wrapper.id = 'deOutputOptions'; wrapper.style.cssText = 'display:flex;gap:14px;align-items:center;margin-left:auto;margin-right:12px;font-size:13px;'; wrapper.innerHTML = '<label><input type="radio" name="deOutputFormat" id="deOutputRaw" checked> Raw Format</label><label><input type="radio" name="deOutputFormat" id="deOutputJson"> JSON</label>'; resultHead.insertBefore(wrapper, document.getElementById('copyBtn')); wrapper.querySelectorAll('input').forEach(radio => radio.addEventListener('change', parseAndRender)); } }
  window.DEParser = { parse, formatRaw, formatJson, parseAndRender, setDEMode };
  window.addEventListener('DOMContentLoaded', () => { const modeRow = document.getElementById('modeRow'), tlvButton = modeRow ? [...modeRow.querySelectorAll('.mode')].find(b => b.dataset.mode === 'tlv') : null; if (!modeRow || !tlvButton || document.querySelector('[data-mode="de"]')) return; const button = document.createElement('button'); button.className = 'mode'; button.dataset.mode = 'de'; button.textContent = 'DE Parser'; modeRow.insertBefore(button, document.getElementById('clearBtn')); button.addEventListener('click', () => { modeRow.querySelectorAll('.mode').forEach(b => b.classList.remove('active')); button.classList.add('active'); setDEMode(true); parseAndRender(); }); modeRow.querySelectorAll('.mode').forEach(tab => { if (tab !== button) tab.addEventListener('click', () => setDEMode(false)); }); document.getElementById('parseBtn')?.addEventListener('click', () => { if (document.querySelector('.mode.active')?.dataset.mode === 'de') parseAndRender(); }); document.getElementById('input')?.addEventListener('input', () => { if (document.querySelector('.mode.active')?.dataset.mode === 'de') parseAndRender(); }); });
})();
