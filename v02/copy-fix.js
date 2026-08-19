(() => {
  function copyResult() {
    const output = document.getElementById('output');
    const button = document.getElementById('copyBtn');
    const text = output?.textContent || '';
    if (!text) return;
    const done = () => {
      if (!button) return;
      const old = button.textContent;
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = old; }, 1000);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback(text, done));
    } else {
      fallback(text, done);
    }
  }

  function fallback(text, done) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    try {
      if (document.execCommand('copy')) done();
    } finally {
      area.remove();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('copyBtn');
    if (!button) return;
    button.replaceWith(button.cloneNode(true));
    document.getElementById('copyBtn').addEventListener('click', copyResult);
  });
})();
