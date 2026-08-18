(function () {
  const output = document.getElementById('output');
  if (!output) return;

  let updating = false;

  function isIsoMode() {
    const active = document.querySelector('.mode.active');
    const mode = active?.dataset?.mode;
    return mode === 'request' || mode === 'response';
  }

  function removeNestedEmvBlock() {
    if (updating || !isIsoMode()) return;

    const text = output.textContent || '';
    if (!text.includes('  EMV/TLV:')) return;

    const lines = text.split('\n');
    const cleaned = [];
    let skip = false;

    for (const line of lines) {
      if (line.trim() === 'EMV/TLV:') {
        skip = true;
        continue;
      }

      // The nested TLV block belongs to DE55 and ends when the next DE line starts.
      if (skip && /^DE\s+\d+\s*=/.test(line.trim())) {
        skip = false;
      }

      if (!skip) cleaned.push(line);
    }

    const result = cleaned.join('\n');
    if (result !== text) {
      updating = true;
      output.textContent = result;
      updating = false;
    }
  }

  const observer = new MutationObserver(removeNestedEmvBlock);
  observer.observe(output, { childList: true, characterData: true, subtree: true });

  document.getElementById('modeRow')?.addEventListener('click', () => {
    setTimeout(removeNestedEmvBlock, 0);
  });

  removeNestedEmvBlock();
})();
