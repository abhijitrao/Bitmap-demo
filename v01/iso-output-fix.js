(function () {
  const output = document.getElementById('output');
  if (!output) return;

  let updating = false;

  function isIsoMode() {
    const active = document.querySelector('.mode.active');
    const mode = active?.dataset?.mode;
    return mode === 'request' || mode === 'response';
  }

  function cleanIsoOutput() {
    if (updating || !isIsoMode()) return;

    const text = output.textContent || '';
    if (!text) return;

    const lines = text.split('\n');
    const cleaned = [];
    let skip = false;

    for (const line of lines) {
      if (line.trim() === 'EMV/TLV:') {
        skip = true;
        continue;
      }

      // Nested TLV output belongs to DE55 and is not shown in ISO result.
      if (skip && /^DE\s+\d+\s*=/.test(line.trim())) {
        skip = false;
      }

      if (skip) continue;

      // ISO result should show field number without the DE prefix.
      cleaned.push(line.replace(/^(\s*)DE\s+(\d{1,3})(\s*=)/, '$1$2$3'));
    }

    const result = cleaned.join('\n');
    if (result !== text) {
      updating = true;
      output.textContent = result;
      updating = false;
    }
  }

  const observer = new MutationObserver(cleanIsoOutput);
  observer.observe(output, { childList: true, characterData: true, subtree: true });

  document.getElementById('modeRow')?.addEventListener('click', () => {
    setTimeout(cleanIsoOutput, 0);
  });

  cleanIsoOutput();
})();
