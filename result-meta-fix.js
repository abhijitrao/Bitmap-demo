(() => {
  window.addEventListener('DOMContentLoaded', () => {
    const meta = document.getElementById('meta');
    if (!meta) return;

    let lastMeta = meta.textContent || '';

    const observer = new MutationObserver(() => {
      const current = meta.textContent || '';
      if (current.trim()) {
        lastMeta = current;
      } else if (lastMeta.trim()) {
        meta.textContent = lastMeta;
      }
    });

    observer.observe(meta, { childList: true, characterData: true, subtree: true });
  });
})();
