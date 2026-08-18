/*
 * Display-only conversion fix.
 * ISO parsing always stays in raw HEX. The Convert ASCII checkbox controls
 * only how parsed values are displayed.
 */
(() => {
  const originalFormatIso = window.formatIso;
  if (typeof originalFormatIso !== 'function') return;

  window.formatIso = function (parsed) {
    const convert = document.getElementById('convertAscii')?.checked === true;

    if (!convert) {
      const rawRows = parsed.rows.map(row =>
        row.type === 'BYTE' ? { ...row, type: 'RAW' } : row
      );
      return originalFormatIso({ ...parsed, rows: rawRows });
    }

    return originalFormatIso(parsed);
  };
})();
