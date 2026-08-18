// Android-compatible ISO8583 parser override.
// IMPORTANT: this file overrides the original app.js doParse() so the
// Android-compatible parser is the one used by the existing UI buttons.
(function () {
  const FIELD_NAMES = {
    3:'Processing Code', 11:'STAN', 17:'Effective Date', 24:'Destination NII (Network International Identifier)',
    41:'TID', 42:'MID', 43:'Unique Txn ID', 44:'Additional Response Data', 45:'Track1', 46:'KSN details',
    47:'User Id, Customer Id', 48:'Connection code and date time stamp', 49:'Transaction Currency Code',
    51:'Cardholder currency code', 52:'Pin Block', 53:'CVV / AES PIN Block', 54:'Additional Amount', 55:'ICC Data',
    56:'Previous ROC, Date, Time in Reversal case', 57:'Track2 Encrypted', 58:'Card Indicator and Response Message',
    59:'DCC detail / RSA Key in Request, Advice in response', 60:'Batch No', 61:'Bank Details', 62:'Invoice No', 63:'Promo Details'
  };
  const FIXED = {3:3,11:3,12:3,13:2,14:2,15:2,17:2,22:2,23:3,24:2,30:6,37:12,38:12,39:2,41:8,42:15,49:2,51:2,52:8};
  const LLVAR = {31:1,32:1,35:2,43:2,44:2,45:2,46:2,47:2,48:2,53:2,54:2,55:2,57:2,58:2,59:2,60:2,61:2,62:2,63:2};
  const BYTE = new Set([41,42,52]);
  const IGNORED_ASCII = new Set(['3','4','6','7','10','11','12','13','15','22','24','49','51','55']);
  const SPECIAL_DE56 = new Set(['982002','982004','960321']);

  const clean = s => String(s || '').replace(/\s+/g,'').replace(/0x/gi,'').toUpperCase();
  const valid = s => /^[0-9A-F]*$/.test(s) && s.length % 2 === 0;
  const ascii = hex => { let o=''; for(let i=0;i<hex.length;i+=2){const n=parseInt(hex.slice(i,i+2),16);o += n>=32&&n<=126?String.fromCharCode(n):'.';} return o; };
  const bcd = hex => hex;

  function bitmapFields(bitmap) {
    const out=[];
    for(let byteIndex=0; byteIndex<bitmap.length/2; byteIndex++) {
      const b=parseInt(bitmap.slice(byteIndex*2,byteIndex*2+2),16);
      for(let bit=0;bit<8;bit++) if(b & (1 << (7-bit))) out.push(byteIndex*8+bit+1);
    }
    return out;
  }

  function prefix(hex,response) {
    return response
      ? {length:'',tpdu:hex.slice(0,10),mti:hex.slice(10,14),bitmapStart:14}
      : {length:hex.slice(0,4),tpdu:hex.slice(4,14),mti:hex.slice(14,18),bitmapStart:18};
  }

  function fieldSpec(n,request,processingCode) {
    if(n===12) return {name:'Local Transaction Time / Date Time',type:'FIXED',len:request?3:6};
    if(n===53) return {name:FIELD_NAMES[n],type:'LLVAR',len:document.getElementById('p2peMode')?.checked?1:2};
    if(n===56) return {name:FIELD_NAMES[n],type:'LLVAR',len:request && !SPECIAL_DE56.has(processingCode)?1:2};
    if(FIXED[n]) return {name:FIELD_NAMES[n] || `Field ${n}`,type:BYTE.has(n)?'BYTE':'FIXED',len:FIXED[n]};
    if(LLVAR[n]) return {name:FIELD_NAMES[n] || `Field ${n}`,type:'LLVAR',len:LLVAR[n]};
    return {name:FIELD_NAMES[n] || `Field ${n}`,type:'UNDEFINED',len:0};
  }

  function parse(hex,response) {
    const p=prefix(hex,response);
    let pos=p.bitmapStart;
    if(pos+16>hex.length) throw new Error('Bitmap is incomplete');
    let bitmap=hex.slice(pos,pos+16); pos+=16;
    if(parseInt(bitmap.slice(0,2),16)&0x80) {
      if(pos+16>hex.length) throw new Error('Secondary bitmap is incomplete');
      bitmap += hex.slice(pos,pos+16); pos+=16;
    }
    const active=bitmapFields(bitmap).filter(n=>n!==1);
    const rows=[]; let processingCode='';
    for(const n of active) {
      const spec=fieldSpec(n,!response,processingCode);
      if(spec.type==='UNDEFINED') { rows.push({n,name:spec.name,type:spec.type,valueHex:'',lengthInfo:'undefined'}); continue; }
      let valueHex='', lengthInfo='', declaredLength=null;
      if(spec.type==='LLVAR') {
        // Android: field.len is BYTES occupied by LLVAR length tag.
        // Therefore len=2 means 4 HEX characters: 0084.
        const tagHexChars=spec.len*2;
        if(pos+tagHexChars>hex.length) throw new Error(`DE ${n} length tag is incomplete`);
        const lenTag=hex.slice(pos,pos+tagHexChars); pos+=tagHexChars;
        if(!/^\d+$/.test(lenTag)) throw new Error(`DE ${n} has invalid LLVAR length: ${lenTag}`);
        declaredLength=parseInt(lenTag,10);
        const valueHexChars=declaredLength*2;
        if(pos+valueHexChars>hex.length) throw new Error(`DE ${n} value is incomplete (declared ${declaredLength} bytes)`);
        valueHex=hex.slice(pos,pos+valueHexChars); pos+=valueHexChars;
        lengthInfo=`${declaredLength} bytes (LLVAR/${spec.len} bytes length tag)`;
      } else {
        const valueHexChars=spec.len*2;
        if(pos+valueHexChars>hex.length) throw new Error(`DE ${n} value is incomplete`);
        valueHex=hex.slice(pos,pos+valueHexChars); pos+=valueHexChars;
        lengthInfo=`${spec.len} bytes`;
      }
      rows.push({n,name:spec.name,type:spec.type,valueHex,lengthInfo,declaredLength});
      if(n===3) processingCode=bcd(valueHex);
    }
    return {...p,bitmapHex:bitmap,active,rows,processingCode,remaining:hex.slice(pos)};
  }

  function format(parsed) {
    const $=id=>document.getElementById(id);
    const showName=$('showFieldName')?.checked;
    const showLen=$('showLength')?.checked;
    const convert=$('convertAscii')?.checked;
    const hide=$('hideValue')?.checked;
    const original=$('originalOrder')?.checked;
    const rows=original?parsed.rows:[...parsed.rows].sort((a,b)=>a.n-b.n);
    const lines=[];
    if(parsed.length) lines.push(`Length: ${parsed.length}`);
    lines.push(`TPDU: ${parsed.tpdu}`,`MTI: ${parsed.mti}`,`Bitmap: ${parsed.bitmapHex}`,`Processing Code: ${parsed.processingCode||'-'}`,'');
    for(const r of rows) {
      let value=hide?'********':r.valueHex;
      if(convert && !IGNORED_ASCII.has(String(r.n))) value=ascii(r.valueHex);
      else if(r.type==='BYTE' && !hide) value=ascii(r.valueHex);
      const parts=[`DE ${String(r.n).padStart(2,'0')}`];
      if(showName) parts.push(r.name);
      parts.push('=',value);
      if(showLen) parts.push(`[${r.lengthInfo}]`);
      lines.push(parts.join(' '));
    }
    if(parsed.remaining) lines.push('',`Unparsed trailing data: ${parsed.remaining}`);
    return lines.join('\n');
  }

  function run() {
    const input=document.getElementById('input'), output=document.getElementById('output');
    if(!input||!output) return;
    const raw=clean(input.value);
    if(!raw) { output.textContent='Enter a packet and click Parse.'; return; }
    if(!valid(raw)) { output.textContent='Invalid HEX input.'; return; }
    try {
      const mode=document.querySelector('.mode.active')?.dataset.mode || 'request';
      if(mode==='bitmap') {
        const p=prefix(raw,false); let pos=p.bitmapStart; const bitmap=raw.slice(pos,pos+16);
        output.textContent=`Length: ${p.length}\nTPDU: ${p.tpdu}\nMTI: ${p.mti}\nBitmap: ${bitmap}\n\nActive fields: ${bitmapFields(bitmap).join(', ')}`; return;
      }
      const response=mode==='response';
      const parsed=parse(raw,response);
      output.textContent=format(parsed);
      const title=document.getElementById('packetTitle');
      if(title) title.textContent=parsed.processingCode ? `COMMON_API_3 (ProcessingCode:${parsed.processingCode}), MTI: ${parsed.mti}` : `MTI: ${parsed.mti}`;
      const meta=document.getElementById('meta');
      if(meta) meta.textContent=`MTI ${parsed.mti} • ${parsed.active.length-1} active data fields • ${raw.length/2} bytes`;
      output.className='output ok';
    } catch(e) { output.textContent=e.message||String(e); output.className='output error'; }
  }

  // Replace the original global doParse used by app.js button handlers.
  window.doParse = run;
  window.exactAndroidParse = run;
  window.__androidParserVersion = '5';

  // Also intercept the Parse/options buttons in capture phase as a fallback.
  window.addEventListener('DOMContentLoaded',()=>{
    ['parseBtn','showBitmap','showFieldName','showLength','convertAscii','hideValue','originalOrder','p2peMode'].forEach(id=>{
      document.getElementById(id)?.addEventListener('click',e=>{e.stopImmediatePropagation();run();},true);
    });
  });
})();
