// Android-compatible ISO8583 LLVAR length parsing.
// In the Android parser, IsoField.len is the number of BYTES occupied by the
// length tag. Therefore len=2 means a 4-HEX-character length tag such as 0084.
(function () {
  function parseFieldsAndroid(hex, active, response) {
    let pos = 0;
    const rows = [];
    let processingCode = '';

    for (const n of active) {
      if (n === 1) continue;

      const info = window.fieldInfo(n, !response, processingCode);
      const name = info[0];
      const type = info[1];
      const len = info[2];

      if (type === 'UNSUPPORTED') {
        throw new Error(`DE ${n} is not configured in Android parser (enable P2PE for DE46)`);
      }

      let valueHex = '';
      let lengthInfo = '';
      let declaredLength = null;

      if (type === 'FIXED' || type === 'BCD' || type === 'BYTE') {
        const hexLen = len * 2;
        if (pos + hexLen > hex.length) {
          throw new Error(`DE ${n} value is incomplete`);
        }
        valueHex = hex.slice(pos, pos + hexLen);
        pos += hexLen;
        lengthInfo = `${len} bytes`;
      } else {
        // IMPORTANT: Android len=2 => 2 bytes => 4 HEX chars.
        const lengthHexChars = len * 2;
        if (pos + lengthHexChars > hex.length) {
          throw new Error(`DE ${n} length is incomplete`);
        }

        const lenDigits = hex.slice(pos, pos + lengthHexChars);
        pos += lengthHexChars;

        if (!/^\d+$/.test(lenDigits)) {
          throw new Error(`DE ${n} has invalid LLVAR length: ${lenDigits}`);
        }

        declaredLength = parseInt(lenDigits, 10);
        const hexLen = declaredLength * 2;

        if (pos + hexLen > hex.length) {
          throw new Error(`DE ${n} value is incomplete (declared ${declaredLength} bytes)`);
        }

        valueHex = hex.slice(pos, pos + hexLen);
        pos += hexLen;
        lengthInfo = `${declaredLength} bytes (LLVAR/${lengthHexChars} hex chars)`;
      }

      rows.push({ n, name, type, valueHex, lengthInfo, declaredLength });

      if (n === 3) {
        processingCode = window.bcd(valueHex);
      }
    }

    return { rows, pos, remaining: hex.slice(pos), processingCode };
  }

  function parseIsoAndroid(hex, response) {
    const packet = window.readBitmapPacket(hex, response);
    return {
      ...packet,
      ...parseFieldsAndroid(packet.rest, packet.active, response)
    };
  }

  function parseAndroidCompatible() {
    const raw = window.cleanHex(input.value);
    if (!raw) {
      output.textContent = 'Enter a packet and click Parse.';
      return;
    }

    if (!window.validHex(raw)) {
      output.textContent = 'Invalid HEX input.';
      output.className = 'output error';
      return;
    }

    try {
      if (state.mode === 'tlv') {
        const rows = window.parseTlv(raw);
        output.textContent = window.formatTlv(rows).join('\n');
        packetTitle.textContent = 'TLV Parser';
        meta.textContent = `${rows.length} top-level tag(s)`;
        output.className = 'output ok';
        return;
      }

      if (state.mode === 'bitmap') {
        const parsed = window.readBitmapPacket(raw, false);
        output.textContent = window.formatBitmap(parsed);
        packetTitle.textContent = 'Bitmap';
        meta.textContent = `${parsed.active.length} active field(s)`;
        output.className = 'output ok';
        return;
      }

      if (state.mode === 'other') {
        output.textContent = window.ascii(raw);
        packetTitle.textContent = 'ASCII';
        meta.textContent = `${raw.length / 2} bytes`;
        output.className = 'output ok';
        return;
      }

      const response = state.mode === 'response';
      const parsed = parseIsoAndroid(raw, response);
      output.textContent = window.formatIso(parsed);
      packetTitle.textContent = parsed.processingCode
        ? `COMMON_API_${parsed.processingCode.slice(-1)} (ProcessingCode:${parsed.processingCode}), MTI: ${parsed.mti}`
        : `MTI: ${parsed.mti}`;
      meta.textContent = `Total Packet Size : ${raw.length / 2}`;
      output.className = 'output ok';
    } catch (e) {
      output.textContent = e.message || String(e);
      output.className = 'output error';
      packetTitle.textContent = 'Parse Error';
      meta.textContent = '';
    }
  }

  window.androidCompatibleParse = parseAndroidCompatible;
  window.addEventListener('DOMContentLoaded', function () {
    const controls = [
      document.getElementById('parseBtn'),
      document.getElementById('showBitmap'),
      document.getElementById('showFieldName'),
      document.getElementById('showLength'),
      document.getElementById('convertAscii'),
      document.getElementById('hideValue'),
      document.getElementById('originalOrder'),
      document.getElementById('p2peMode')
    ].filter(Boolean);

    controls.forEach(control => {
      control.addEventListener('click', function (event) {
        event.stopImmediatePropagation();
        window.androidCompatibleParse();
      }, true);
    });
  });
})();
