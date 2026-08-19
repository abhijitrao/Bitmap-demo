(() => {
  const DEFAULT_CHARS = ['|', '^', '\\', '~'];

  function getSeparators() {
    const chars = typeof window.getDEParsingSpecialChars === 'function' ? window.getDEParsingSpecialChars() : DEFAULT_CHARS;
    return [...new Set((chars || []).filter(c => typeof c === 'string' && c.length === 1))];
  }

  // At every level, the first configured delimiter encountered in the input wins.
  // Configuration order is never used as priority.
  function findNextSeparator(text) {
    const chars = getSeparators();
    let found = -1;
    let separator = null;
    for (let i = 0; i < text.length; i++) {
      if (chars.includes(text[i])) {
        found = i;
        separator = text[i];
        break;
      }
    }
    return found < 0 ? null : { index: found, separator };
  }

  function parseLevel(text) {
    const value = String(text ?? '');
    const next = findNextSeparator(value);
    if (!next) return value;

    const parts = value.split(next.separator);
    return parts.map(part => parseLevel(part));
  }

  function parse(text) {
    const input = String(text ?? '');
    return parseLevel(input);
  }

  function rawLines(value, lines = [], level = 0, root = false) {
    const indent = '\t'.repeat(level);
    if (!Array.isArray(value)) {
      lines.push(`${indent}${value}`);
      return lines;
    }
    value.forEach((item, index) => {
      if (Array.isArray(item)) {
        lines.push(`${indent}(${index}) =`);
        rawLines(item, lines, level + 1, false);
      } else {
        lines.push(`${indent}(${index}) = ${item}`);
      }
    });
    return lines;
  }

  function formatRaw(parsed) {
    return rawLines(parsed).join('\n');
  }

  function formatJson(parsed) {
    return JSON.stringify(parsed, null, 2);
  }

  function parseAndRender() {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const jsonRadio = document.getElementById('deOutputJson');
    if (!input || !output) return;
    try {
      const parsed = parse(input.value);
      output.textContent = jsonRadio?.checked ? formatJson(parsed) : formatRaw(parsed);
    } catch (error) {
      output.textContent = `DE Parser Error: ${error.message}`;
    }
  }

  function setDEMode(active) {
    const options = document.querySelector('.options');
    if (options) options.style.display = active ? 'none' : '';
    document.getElementById('parseBtn')?.classList.toggle('de-parser-active', active);
    const existing = document.getElementById('deOutputOptions');
    if (existing) existing.remove();
    if (!active) return;

    const resultHead = document.querySelector('.result-head');
    if (resultHead) {
      const wrapper = document.createElement('div');
      wrapper.id = 'deOutputOptions';
      wrapper.style.cssText = 'display:flex;gap:14px;align-items:center;margin-left:auto;margin-right:12px;font-size:13px;';
      wrapper.innerHTML = '<label><input type="radio" name="deOutputFormat" id="deOutputRaw" checked> Raw Format</label><label><input type="radio" name="deOutputFormat" id="deOutputJson"> JSON</label>';
      resultHead.insertBefore(wrapper, document.getElementById('copyBtn'));
      wrapper.querySelectorAll('input').forEach(radio => radio.addEventListener('change', parseAndRender));
    }
  }

  window.DEParser = { parse, formatRaw, formatJson, parseAndRender, setDEMode };

  window.addEventListener('DOMContentLoaded', () => {
    const modeRow = document.getElementById('modeRow');
    const tlvButton = modeRow ? [...modeRow.querySelectorAll('.mode')].find(b => b.dataset.mode === 'tlv') : null;
    if (!modeRow || !tlvButton || document.querySelector('[data-mode="de"]')) return;
    const button = document.createElement('button');
    button.className = 'mode';
    button.dataset.mode = 'de';
    button.textContent = 'DE Parser';
    modeRow.insertBefore(button, document.getElementById('clearBtn'));

    button.addEventListener('click', () => {
      modeRow.querySelectorAll('.mode').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      setDEMode(true);
      parseAndRender();
    });

    modeRow.querySelectorAll('.mode').forEach(tab => {
      if (tab === button) return;
      tab.addEventListener('click', () => setDEMode(false));
    });

    document.getElementById('parseBtn')?.addEventListener('click', () => {
      if (document.querySelector('.mode.active')?.dataset.mode === 'de') parseAndRender();
    });

    document.getElementById('input')?.addEventListener('input', () => {
      if (document.querySelector('.mode.active')?.dataset.mode === 'de') parseAndRender();
    });
  });
})();
