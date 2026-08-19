const state = { mode: 'request' };
const $ = id => document.getElementById(id);
const input = $('input');
const output = $('output');
const packetTitle = $('packetTitle');
const meta = $('meta');
const p2peMode = $('p2peMode');

const SAMPLES = {
  request: '00D360009100010800202001000081008A982003000088000036333030303030370084333531323134347E3236303431363131323433307E3236303431363131323431387E3236303431363131323433307E3236303431363131323433307E7E38337E3335363632313338303738333338347E7E7E7E7E002131375E3232333532355E31362D4170722D32303236005034413931302020426F6E7573487562202030332E30332E30312E32363033323530303134313631303830303030303030303000173134393139343733363020202020203031',
  response: '60000100910210347001000EC1A070920001000000240000000000438500618272220005460000001748530002363232353738363638343832202020202020393934343839303036333030303030373030303030303030304C433335504B0022333732303936327E323032363038313331373438353303560392001130303A417070726F7665640136303030353333333432423035353030303539333333323030353934353445323032303230323032303230323032303230323032303230323032303230323032303333333933323441353035394135303030323030303036313832373232323036324532453030303035393435344532303230323032303230323032303230323032303230323032303230323032300092307C337C35307C3030303030303030304248303030337C42485430303030337C3030303038307C3030303735347C3030303436377C564953417C7C31303332363038313330373132373438363239303230363735353933373933347C',
  tlv: '5F2A0203565F340101820219008407A00000052410109B02E8009C01009F02060000000001009F03060000000000009F0607A00000052410109F2701809F3303E0F8C89F34034203009F3501229F360202739F370436D27083'
};

const FIELDS = {
  2:['PAN / Mobile','FIXED',8], 3:['Processing Code','BCD',3], 4:['Transaction Amount','BCD',6],
  6:['DCC final amount','BCD',6], 7:['Server Transmission Date And Time','BCD',5], 10:['DCC Conversion detail','BCD',4],
  11:['STAN','BCD',3], 12:['Local Transaction Time / Date Time','BCD_DYNAMIC',0], 13:['Local Transaction Date','BCD',2],
  14:['Expiry Date','BCD',2], 15:['Settlement Date','BCD',2], 17:['Effective Date','BCD',2], 22:['POS Code','BCD',2],
  23:['Address/Application Sequence Number','BCD',3], 24:['Destination NII (Network International Identifier)','BCD',2],
  30:['Original Amount','BCD',6], 31:['Acquirer Ref No','LLVAR',1], 32:['Acquiring Institution Id Code','LLVAR',1],
  35:['Track2','LLVAR',2], 37:['Retrieval Reference Number','FIXED',12], 38:['Approval Code','FIXED',12], 39:['Response Code','FIXED',2],
  41:['TID','BYTE',8], 42:['MID','BYTE',15], 43:['Unique Txn ID','LLVAR',2], 44:['Additional Response Data','LLVAR',2],
  45:['Track1','LLVAR',2], 46:['KSN details','LLVAR',2], 47:['User Id, Customer Id','LLVAR',2], 48:['Connection code and date time stamp','LLVAR',2],
  49:['Transaction Currency Code','BCD',2], 51:['Cardholder currency code','BCD',2], 52:['Pin Block','BYTE',8],
  53:['CVV / AES PIN Block','LLVAR_DYNAMIC',0], 54:['Additional Amount','LLVAR',2], 55:['ICC Data','LLVAR',2],
  56:['Previous ROC, Date, Time in Reversal case','LLVAR_DYNAMIC',0], 57:['Track2 Encrypted','LLVAR',2],
  58:['Card Indicator and Response Message','LLVAR',2], 59:['DCC detail / RSA Key in Request, Advice in response','LLVAR',2],
  60:['Batch No','LLVAR',2], 61:['Bank Details','LLVAR',2], 62:['Invoice No','LLVAR',2], 63:['Promo Details','LLVAR',2]
};
const SPECIAL_DE56 = new Set(['982002','982004','960321']);

function cleanHex(value){ return String(value || '').replace(/\s+/g,'').replace(/0x/gi,'').toUpperCase(); }
function validHex(value){ return /^[0-9A-F]*$/.test(value) && value.length % 2 === 0; }
function hexBytes(hex){ const result=[]; for(let i=0;i<hex.length;i+=2) result.push(parseInt(hex.slice(i,i+2),16)); return result; }
function ascii(hex){ return hexBytes(hex).map(b => b>=32 && b<=126 ? String.fromCharCode(b) : '.').join(''); }
function bcd(hex){ return hex.replace(/F/gi,''); }
function bitmapBits(hex){ return hexBytes(hex).map(b=>b.toString(2).padStart(8,'0')).join(''); }
function activeFields(bitmap){ const bits=bitmapBits(bitmap); const result=[]; for(let i=0;i<bits.length;i++) if(bits[i]==='1') result.push(i+1); return result; }

function packetPrefix(hex,response){
  return response ? {length:'',tpdu:hex.slice(0,10),mti:hex.slice(10,14),bitmapStart:14}
                  : {length:hex.slice(0,4),tpdu:hex.slice(4,14),mti:hex.slice(14,18),bitmapStart:18};
}

function fieldInfo(n,request,processingCode){
  const base=FIELDS[n];
  if(!base) return [`Field ${n}`,'LLVAR',2];
  let [name,type,len]=base;
  if(n===12) return [name,'BCD',request?3:6];
  if(n===46 && !p2peMode.checked) return [name,'UNSUPPORTED',0];
  if(n===53) return [p2peMode.checked?'AES PIN Block':'CVV','LLVAR',p2peMode.checked?1:2];
  if(n===56) return [name,'LLVAR',request && !SPECIAL_DE56.has(processingCode)?1:2];
  return [name,type,len];
}

function readPacket(hex,response){
  const p=packetPrefix(hex,response); let pos=p.bitmapStart;
  if(pos+16>hex.length) throw new Error('Bitmap is incomplete');
  let bitmap=hex.slice(pos,pos+16); pos+=16;
  if(parseInt(bitmap.slice(0,2),16)&0x80){
    if(pos+16>hex.length) throw new Error('Secondary bitmap is incomplete');
    bitmap+=hex.slice(pos,pos+16); pos+=16;
  }
  return {...p,bitmapHex:bitmap,active:activeFields(bitmap),rest:hex.slice(pos)};
}

function parseFields(hex,active,response){
  let pos=0, processingCode=''; const rows=[]; let error=null;
  for(const n of active){
    if(n===1) continue;
    const [name,type,len]=fieldInfo(n,!response,processingCode);
    if(type==='UNSUPPORTED') { error=`DE ${n} is not configured in Android parser (enable P2PE for DE46)`; break; }
    let valueHex='', lengthInfo='', declaredLength=null;
    try {
      if(type==='LLVAR' || type==='LLVAR_DYNAMIC'){
        const lengthHexChars=len*2;
        if(pos+lengthHexChars>hex.length) throw new Error(`DE ${n} length is incomplete`);
        const lenTag=hex.slice(pos,pos+lengthHexChars); pos+=lengthHexChars;
        if(!/^\d+$/.test(lenTag)) throw new Error(`DE ${n} has invalid LLVAR length: ${lenTag}`);
        declaredLength=parseInt(lenTag,10);
        const valueHexChars=declaredLength*2;
        if(pos+valueHexChars>hex.length) throw new Error(`DE ${n} value is incomplete (declared ${declaredLength} bytes)`);
        valueHex=hex.slice(pos,pos+valueHexChars); pos+=valueHexChars;
        lengthInfo=valueHexChars;
      }else{
        const valueHexChars=len*2;
        if(pos+valueHexChars>hex.length) throw new Error(`DE ${n} value is incomplete`);
        valueHex=hex.slice(pos,pos+valueHexChars); pos+=valueHexChars;
        lengthInfo=valueHexChars;
      }
      rows.push({n,name,type,valueHex,lengthInfo,declaredLength});
      if(n===3) processingCode=bcd(valueHex);
    } catch(e) {
      error=e.message || String(e);
      break;
    }
  }
  return {rows,pos,remaining:hex.slice(pos),processingCode,error};
}

function parseIso(hex,response=false){
  const packet=readPacket(hex,response);
  return {...packet,...parseFields(packet.rest,packet.active,response)};
}

function parseTlv(hex,depth=0){
  const rows=[]; let pos=0;
  while(pos+4<=hex.length){
    let tag=hex.slice(pos,pos+2); pos+=2;
    if((parseInt(tag,16)&0x1F)===0x1F){ while(pos+2<=hex.length && (parseInt(hex.slice(pos-2,pos),16)&0x80)) { tag+=hex.slice(pos,pos+2); pos+=2; } }
    if(pos+2>hex.length) break;
    const first=parseInt(hex.slice(pos,pos+2),16); pos+=2; let len=first;
    if(first&0x80){ const count=first&0x7F; if(!count || pos+count*2>hex.length) break; len=parseInt(hex.slice(pos,pos+count*2),16); pos+=count*2; }
    const value=hex.slice(pos,pos+len*2); if(value.length!==len*2) break; pos+=len*2;
    rows.push({tag,length:len,value,depth});
  }
  return rows;
}

function formatIso(parsed){
  const lines=[];
  if(parsed.length) lines.push(`Length: ${parsed.length}`);
  lines.push(`TPDU: ${parsed.tpdu}`,`MTI: ${parsed.mti}`,`Bitmap: ${parsed.bitmapHex}`,'','Data Elements of Bitmap');
  const rows=$('originalOrder').checked?parsed.rows:[...parsed.rows].sort((a,b)=>a.n-b.n);
  const convert=$('convertAscii').checked;
  const showLength=$('showLength').checked;
  const showFieldName=$('showFieldName').checked;
  const hideValue=$('hideValue').checked;
  for(const r of rows){
    const value=hideValue?'********':(convert?ascii(r.valueHex):r.valueHex);
    const number=String(r.n).padEnd(4,' ');
    const fieldName=showFieldName?`(${r.name}) `:'';
    const lengthText=showLength?`(${r.lengthInfo}) `:'';
    lines.push(`${number}${fieldName}${lengthText}= ${value}`);
  }
  if(parsed.error) lines.push('',`Invalid packet: ${parsed.error}`);
  else if(parsed.remaining) lines.push('',`Unparsed trailing data: ${parsed.remaining}`);
  return lines.join('\n');
}
window.formatIso=formatIso;

function formatBitmap(parsed){
  const lines=[]; if(parsed.length) lines.push(`Length: ${parsed.length}`); lines.push(`TPDU: ${parsed.tpdu}`,`MTI: ${parsed.mti}`,`Bitmap: ${parsed.bitmapHex}`,'','Bit  Field');
  parsed.active.filter(n=>n!==1).forEach(n=>lines.push(`${String(n).padStart(3,' ')}  ${FIELDS[n]?.[0]||`Field ${n}`}`));
  return lines.join('\n');
}

function doParse(){
  const hex=cleanHex(input.value); output.classList.remove('error');
  if(!hex){ output.textContent=state.mode==='tlv'?'No TLV data.':'Please enter valid Hex code'; return; }
  if(!validHex(hex)){ output.textContent='Invalid Hex code'; output.classList.add('error'); return; }
  try{
    if(state.mode==='tlv'){ const rows=parseTlv(hex); output.textContent=rows.map(r=>`${r.tag} [${r.length}] ${$('convertAscii').checked?ascii(r.value):r.value}`).join('\n')||'No valid TLV data'; packetTitle.textContent='TLV / EMV Result'; meta.textContent=`${hex.length/2} bytes`; return; }
    if(state.mode==='other'){ output.textContent=$('convertAscii').checked?ascii(hex):hex; packetTitle.textContent='Other'; meta.textContent=`${hex.length/2} bytes`; return; }
    const parsed=parseIso(hex,state.mode==='response');
    packetTitle.textContent='ISO8583 Result';
    meta.textContent=`MTI ${parsed.mti} · ${parsed.active.filter(n=>n!==1).length} active data fields · ${hex.length/2} bytes${parsed.processingCode?' · PC '+parsed.processingCode:''}`;
    output.textContent=(state.mode==='showBitmap'||$('showBitmap').checked)?formatBitmap(parsed):formatIso(parsed);
    if(parsed.error) output.classList.add('error');
  }catch(e){ output.textContent=`Invalid packet: ${e.message||String(e)}`; output.classList.add('error'); }
}
window.doParse=doParse;
window.exactAndroidParse=doParse;
window.__androidParserVersion='partial-error-reporting';

function setMode(mode){
  state.mode=mode;
  document.querySelectorAll('.mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  if(mode==='request'||mode==='response'||mode==='tlv') input.value=SAMPLES[mode];
  doParse();
}

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $('parseBtn')?.addEventListener('click',doParse);
  $('sampleBtn')?.addEventListener('click',()=>{ input.value=SAMPLES[state.mode]||''; doParse(); });
  $('clearBtn')?.addEventListener('click',()=>{ input.value=''; output.textContent='Enter a packet and click Parse.'; });
  ['showBitmap','showFieldName','showLength','convertAscii','hideValue','originalOrder','p2peMode'].forEach(id=>$ (id)?.addEventListener('change',doParse));
});
