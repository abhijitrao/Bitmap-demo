// Exact ISO parser aligned with Bitmap-parser's IsoDataReader.parseFields().
// LLVAR: field.len is the number of bytes used by the length tag.
// Example: len=2 => 4 HEX chars, "0084" => 84 data bytes.
(function () {
  const FIELD_NAMES = {
    3:'Processing Code', 11:'STAN', 24:'Destination NII (Network International Identifier)',
    41:'TID', 42:'MID', 43:'Unique Txn ID', 44:'Additional Response Data',
    45:'Track1', 46:'KSN details', 47:'User Id, Customer Id',
    48:'Connection code and date time stamp', 49:'Transaction Currency Code',
    51:'Cardholder currency code', 52:'Pin Block', 53:'CVV / AES PIN Block',
    54:'Additional Amount', 55:'ICC Data', 56:'Previous ROC, Date, Time in Reversal case',
    57:'Track2 Encrypted', 58:'Card Indicator and Response Message',
    59:'DCC detail / RSA Key in Request, Advice in response', 60:'Batch No',
    61:'Bank Details', 62:'Invoice No', 63:'Promo Details'
  };

  const FIXED = {
    3:3, 11:3, 24:2, 41:8, 42:15, 49:2, 51:2, 52:8,
    12:3, 13:2, 14:2, 15:2, 17:2, 22:2, 23:3, 30:6,
    37:12, 38:12, 39:2
  };

  const LLVAR = {
    31:1, 32:1, 35:2, 43:2, 44:2, 45:2, 46:2, 47:2,
    48:2, 53:2, 54:2, 55:2, 57:2, 58:2, 59:2, 60:2,
    61:2, 62:2, 63:2
  };

  const BYTE = new Set([41,42,52]);
  const IGNORED_ASCII = new Set(['3','4','6','7','10','11','12','13','15','22','24','49','51','55']);

  function clean(s) { return String(s || '').replace(/\s+/g,'').replace(/0x/gi,'').toUpperCase(); }
  function valid(s) { return /^[0-9A-F]*$/.test(s) && s.length % 2 === 0; }
  function ascii(hex) {
    let out='';
    for(let i=0;i<hex.length;i+=2){ const n=parseInt(hex.slice(i,i+2),16); out += n>=32&&n<=126?String.fromCharCode(n):'.'; }
    return out;
  }
  function bitmapFields(bitmap) {
    const out=[];
    for(let i=0;i<bitmap.length;i+=2){
      const b=parseInt(bitmap.slice(i,i+2),16);
      for(let bit=0;bit<8;bit++) if(b & (1 << (7-bit))) out.push(i*4+bit+1);
    }
    return out;
  }

  function prefix(hex,response) {
    return response
      ? {length:'',tpdu:hex.slice(0,10),mti:hex.slice(10,14),bitmapStart:14}
      : {length:hex.slice(0,4),tpdu:hex.slice(4,14),mti:hex.slice(14,18),bitmapStart:18};
  }

  function fieldSpec(n, request, processingCode) {
    if(n===12) return {name:'Local Transaction Time / Date Time',type:'FIXED',len:request?3:6};
    if(n===53) return {name:FIELD_NAMES[n],type:'LLVAR',len:document.getElementById('p2peMode')?.checked?1:2};
    if(n===56) {
      const two = !request || ['982002','982004','960321'].includes(processingCode);
      return {name:FIELD_NAMES[n],type:'LLVAR',len:two?2:1};
    }
    if(FIXED[n]) return {name:FIELD_NAMES[n] || `Field ${n}`,type:BYTE.has(n)?'BYTE':'FIXED',len:FIXED[n]};
    if(LLVAR[n]) return {name:FIELD_NAMES[n] || `Field ${n}`,type:'LLVAR',len:LLVAR[n]};
    return {name:FIELD_NAMES[n] || `Field ${n}`,type:'UNDEFINED',len:0};
  }

  function parse(hex,response) {
    const p=prefix(hex,response);
    let pos=p.bitmapStart;
    if(pos+16>hex.length) throw new Error('Bitmap is incomplete');
    let bitmap=hex.slice(pos,pos+16); pos+=16;
    if(parseInt(bitmap.slice(0,2),16)&0x80){
      if(pos+16>hex.length) throw new Error('Secondary bitmap is incomplete');
      bitmap+=hex.slice(pos,pos+16); pos+=16;
    }
    const active=bitmapFields(bitmap).filter(n=>n!==1);
    const rows=[]; let processingCode='';

    for(const n of active){
      const spec=fieldSpec(n,!response,processingCode);
      if(spec.type==='UNDEFINED') {
        // Match Android's default IsoField(): zero-length/undefined field.
        rows.push({n,name:spec.name,type:spec.type,valueHex:'',lengthInfo:'undefined',declaredLength:null});
        continue;
      }
      let valueHex='', declaredLength=null, lengthInfo='';
      if(spec.type==='LLVAR') {
        const tagChars=spec.len*2;
        if(pos+tagChars>hex.length) throw new Error(`DE ${n} length tag is incomplete`);
        const lenTag=hex.slice(pos,pos+tagChars); pos+=tagChars;
        if(!/^\d+$/.test(lenTag)) throw new Error(`DE ${n} has invalid LLVAR length: ${lenTag}`);
        declaredLength=Number(lenTag);
        const valueChars=declaredLength*2;
        if(pos+valueChars>hex.length) throw new Error(`DE ${n} value is incomplete (declared ${declaredLength} bytes)`);
        valueHex=hex.slice(pos,pos+valueChars); pos+=valueChars;
        lengthInfo=`${declaredLength} bytes`;
      } else {
        const valueChars=spec.len*2;
        if(pos+valueChars>hex.length) throw new Error(`DE ${n} value is incomplete`);
        valueHex=hex.slice(pos,pos+valueChars); pos+=valueChars;
        lengthInfo=`${spec.len} bytes`;
      }
      rows.push({n,name:spec.name,type:spec.type,valueHex,lengthInfo,declaredLength});
      if(n===3) processingCode=valueHex;
    }
    return {...p,bitmapHex:bitmap,active,rows,processingCode,remaining:hex.slice(pos),consumed:pos};
  }

  function format(parsed) {
    const showName=document.getElementById('showFieldName')?.checked;
    const showLen=document.getElementById('showLength')?.checked;
    const convert=document.getElementById('convertAscii')?.checked;
    const hide=document.getElementById('hideValue')?.checked;
    const original=document.getElementById('originalOrder')?.checked;
    const rows=original?parsed.rows:[...parsed.rows].sort((a,b)=>a.n-b.n);
    const lines=[];
    if(parsed.length) lines.push(`Length: ${parsed.length}`);
    lines.push(`TPDU: ${parsed.tpdu}`,`MTI: ${parsed.mti}`,`Bitmap: ${parsed.bitmapHex}`,`Processing Code: ${parsed.processingCode||'-'}`,'');
    for(const r of rows){
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
    const input=document.getElementById('input'); const output=document.getElementById('output');
    if(!input||!output) return;
    const raw=clean(input.value);
    if(!raw){ output.textContent='Enter a packet and click Parse.'; return; }
    if(!valid(raw)){ output.textContent='Invalid HEX input.'; return; }
    try {
      const response=(window.state?.mode||'request')==='response';
      const parsed=parse(raw,response);
      output.textContent=format(parsed);
      const title=parsed.processingCode ? `COMMON_API_3 (ProcessingCode:${parsed.processingCode}), MTI: ${parsed.mti}` : `MTI: ${parsed.mti}`;
      const pt=document.getElementById('packetTitle'); if(pt) pt.textContent=title;
      const meta=document.getElementById('meta'); if(meta) meta.textContent=`Total Packet Size : ${raw.length}`;
      output.className='output ok';
    } catch(e) {
      output.textContent=e.message || String(e); output.className='output error';
    }
  }

  window.exactAndroidParse=run;
  window.addEventListener('DOMContentLoaded',()=>{
    const ids=['parseBtn','showBitmap','showFieldName','showLength','convertAscii','hideValue','originalOrder','p2peMode'];
    ids.forEach(id=>document.getElementById(id)?.addEventListener('click',e=>{e.stopImmediatePropagation();run();},true));
  });
})();
