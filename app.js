const state = { mode: 'request' };

const $ = id => document.getElementById(id);
const input = $('input');
const output = $('output');
const packetTitle = $('packetTitle');
const meta = $('meta');

const SAMPLES = {
  request: '00D360009100010800202001000081008A982003000088000036333030303030370084333531323134347E3236303431363131323433307E3236303431363131323431387E3236303431363131323433307E3236303431363131323433307E7E38337E3335363632313338303738333338347E7E7E7E7E002131375E3232333532355E31362D4170722D32303236005034413931302020426F6E7573487562202030332E30332E30312E32363033323530303134313631303830303030303030303000173134393139343733363020202020203031',
  response: '600001000204103020010002C102549200010000000086680013010002303036333030303031303030303030303030304C43333531360022313839313731307E323032333131303231393237313501385F2A0203565F340100820239008407A0000000041010950504400480009A032311029B02E8009C01009F02060000000086689F03060000000000009F0607A00000000410109F1A0203569F260848F62634320FD64D9F2701809F3303E0F8C89F34034203009F3501229F36020E4E9F3704ED63B109F10120110A00001220000000000000000000000FF0007535543434553530060307C317C35307C3437303030303039393331323039387C33393239333231347C3030303030317C3030303032377C3030303030347C564953417C',
  tlv: '5F2A0203565F340101820219008407A00000052410109B02E8009C01009F02060000000001009F03060000000000009F0607A00000052410109F2701809F3303E0F8C89F34034203009F3501229F360202739F370436D27083'
};

const TAGS = {
  '4F':'Application Identifier (AID) – card','50':'Application Label','57':'Track 2 Equivalent Data','5A':'Application Primary Account Number (PAN)','5F20':'Cardholder Name','5F24':'Application Expiration Date','5F25':'Application Effective Date','5F28':'Issuer Country Code','5F2A':'Transaction Currency Code','5F2D':'Language Preference','5F30':'Service Code','5F34':'PAN Sequence Number','5F36':'Transaction Currency Exponent','61':'Application Template','6F':'FCI Template','70':'Read Record Response Message Template','77':'Response Message Template Format 2','80':'Response Message Template Format 1','82':'Application Interchange Profile','84':'Dedicated File Name','8A':'Authorisation Response Code','8C':'CDOL1','8D':'CDOL2','8E':'CVM List','8F':'CA Public Key Index','90':'Issuer Public Key Certificate','92':'Issuer Public Key Remainder','93':'Signed Static Application Data','94':'Application File Locator (AFL)','95':'Terminal Verification Results','9A':'Transaction Date','9B':'Transaction Status Information','9C':'Transaction Type','9F01':'Acquirer Identifier','9F02':'Amount, Authorised (Numeric)','9F03':'Amount, Other (Numeric)','9F06':'Application Identifier (AID) – terminal','9F07':'Application Usage Control','9F08':'Application Version Number','9F09':'Application Version Number (Terminal)','9F0D':'Issuer Action Code – Default','9F0E':'Issuer Action Code – Denial','9F0F':'Issuer Action Code – Online','9F10':'Issuer Application Data','9F12':'Application Preferred Name','9F13':'Last Online ATC','9F15':'Merchant Category Code','9F16':'Merchant Identifier','9F17':'PIN Try Counter','9F1A':'Terminal Country Code','9F1B':'Terminal Floor Limit','9F1C':'Terminal Identification','9F1E':'IFD Serial Number','9F21':'Transaction Time','9F23':'Upper Consecutive Offline Limit','9F26':'Application Cryptogram','9F27':'Cryptogram Information Data','9F33':'Terminal Capabilities','9F34':'CVM Results','9F35':'Terminal Type','9F36':'Application Transaction Counter (ATC)','9F37':'Unpredictable Number','9F38':'PDOL','9F39':'POS Entry Mode','9F40':'Additional Terminal Capabilities','9F41':'Transaction Sequence Counter','9F42':'Application Currency Code','9F43':'Application Reference Currency Exponent','9F44':'Application Currency Exponent','9F45':'Data Authentication Code','9F46':'ICC Public Key Certificate','9F47':'ICC Public Key Exponent','9F48':'ICC Public Key Remainder','9F49':'DDOL','9F4A':'Static Data Authentication Tag List','9F4B':'Signed Dynamic Application Data','9F4C':'ICC Dynamic Number','9F4D':'Log Entry','9F4E':'Merchant Name and Location','9F66':'Terminal Transaction Qualifiers (TTQ)','9F6B':'Track 2 Data','9F7C':'Merchant Custom Data','DF7C':'Vendor-specific / custom data'
};

const FIELDS = {
  2:['PAN / Mobile','LLVAR'],3:['Processing Code','BCD:3'],4:['Transaction Amount','BCD:6'],6:['DCC final amount','BCD:6'],7:['Server Transmission Date And Time','BCD:5'],10:['DCC Conversion detail','BCD:4'],11:['STAN','BCD:3'],12:['Local Transaction Time / Date Time','BCD:3/6'],13:['Local Transaction Date','BCD:2'],14:['Expiry Date','BCD:2'],15:['Settlement Date','BCD:2'],17:['Effective Date','BCD:2'],22:['POS Code','BCD:2'],23:['Application Sequence Number','BCD:3'],24:['Destination NII','BCD:2'],30:['Original Amount','BCD:6'],31:['Acquirer Ref No','LLVAR'],32:['Acquiring Institution Id Code','LLVAR'],35:['Track2','LLVAR'],37:['Retrieval Reference Number','FIXED:12'],38:['Approval Code','FIXED:12'],39:['Response Code','FIXED:2'],41:['TID','ASCII:8'],42:['MID','ASCII:15'],43:['Unique Txn ID','LLVAR'],44:['Additional Response Data','LLVAR'],45:['Track1','LLVAR'],46:['KSN details','LLVAR'],47:['User Id, Customer Id','LLVAR'],48:['Connection code and date time stamp','LLVAR'],49:['Transaction Currency Code','BCD:2'],51:['Cardholder currency code','BCD:2'],52:['Pin Block','BYTES:8'],53:['CVV / AES PIN Block','LLVAR'],54:['Additional Amount','LLVAR'],55:['ICC Data','LLVAR'],56:['Previous ROC, Date, Time in Reversal case','LLVAR'],57:['Track2 Encrypted','LLVAR'],58:['Card Indicator and Response Message','LLVAR'],59:['DCC detail / RSA Key in Request, Advice in response','LLVAR'],60:['Batch No','LLVAR'],61:['Bank Details','LLVAR'],62:['Invoice No','LLVAR'],63:['Promo Details','LLVAR']
};

function cleanHex(s){ return s.replace(/\s+/g,'').replace(/0x/gi,'').toUpperCase(); }
function validHex(s){ return /^[0-9A-F]*$/.test(s) && s.length % 2 === 0; }
function bytes(hex){ const a=[]; for(let i=0;i<hex.length;i+=2)a.push(parseInt(hex.slice(i,i+2),16)); return a; }
function ascii(hex){ return bytes(hex).map(b => b>=32 && b<=126 ? String.fromCharCode(b) : '.').join(''); }
function bcd(hex){ return hex.replace(/F/gi,''); }
function printable(hex){ return ascii(hex); }
function bitmapBits(hex){ let bits=''; for(const b of bytes(hex)) bits += b.toString(2).padStart(8,'0'); return bits; }
function fieldInfo(n){ return FIELDS[n] || [`Field ${n}`,'LLVAR']; }

function readBitmapPacket(hex, response=false){
  let pos=0;
  const mti=hex.slice(pos,pos+4); pos+=4;
  let bitmapHex=hex.slice(pos,pos+16); pos+=16;
  let bits=bitmapBits(bitmapHex);
  if(bits[0]==='1'){ bitmapHex+=hex.slice(pos,pos+16); pos+=16; bits=bitmapBits(bitmapHex); }
  const active=[]; [...bits].forEach((v,i)=>v==='1'&&active.push(i+1));
  return {mti,bitmapHex,bits,active,rest:hex.slice(pos),prefix:pos};
}

function parseFields(hex, active, response=false){
  let pos=0; const rows=[];
  for(const n of active){ if(n===1) continue; const [name,type]=fieldInfo(n); let valueHex='', lengthInfo='';
    if(type.startsWith('FIXED:')||type.startsWith('ASCII:')||type.startsWith('BYTES:')||type.startsWith('BCD:')){
      const len=parseInt(type.split(':')[1]); const hexLen=len*2; valueHex=hex.slice(pos,pos+hexLen); pos+=hexLen; lengthInfo=`${len} bytes`;
    } else {
      const digits=type==='LLVAR'?2:3; const lenChars=digits; const lenDigits=hex.slice(pos,pos+lenChars); pos+=lenChars;
      const len=parseInt(lenDigits,10); valueHex=hex.slice(pos,pos+len*2); pos+=len*2; lengthInfo=`${len} bytes (LLVAR)`;
    }
    if(valueHex.length < (lengthInfo.includes('bytes') ? parseInt(lengthInfo) * 2 : 0)) { /* keep partial data for diagnostics */ }
    rows.push({n,name,type,valueHex,lengthInfo});
  }
  return {rows,pos};
}

function parseIso(hex,response=false){
  const packet=readBitmapPacket(hex,response); const parsed=parseFields(packet.rest,packet.active,response);
  return {...packet,...parsed};
}

function parseTlv(hex, depth=0){
  const rows=[]; let pos=0;
  while(pos+4<=hex.length){
    const start=pos; let tag=hex.slice(pos,pos+2); pos+=2;
    if((parseInt(tag,16)&0x1F)===0x1F){ tag+=hex.slice(pos,pos+2); pos+=2; while((parseInt(hex.slice(pos-2,pos),16)&0x80)!==0){tag+=hex.slice(pos,pos+2);pos+=2;}}
    if(pos+2>hex.length) break;
    const l0=parseInt(hex.slice(pos,pos+2),16); pos+=2; let len=l0; let lengthHex=hex.slice(pos-2,pos);
    if(l0&0x80){ const count=l0&0x7F; lengthHex+=hex.slice(pos,pos+count); len=parseInt(hex.slice(pos,pos+count),16); pos+=count; }
    const value=hex.slice(pos,pos+len*2); pos+=len*2;
    const row={tag,tagName:TAGS[tag],length:len,lengthHex,value,depth}; rows.push(row);
    if(['61','6F','70','77','80'].includes(tag) || TAGS[tag]?.includes('Template')){ const nested=parseTlv(value,depth+1); if(nested.length) row.children=nested; }
    if(pos<=start) break;
  }
  return rows;
}

function formatTlv(rows, lines=[], indent=''){
  for(const r of rows){ lines.push(`${indent}${r.tag}${r.tagName?'  '+r.tagName:''}  [${r.length}]  ${$('hideValue').checked?'********':r.value}${r.tagName?'  ('+ascii(r.value)+')':''}`); if(r.children)formatTlv(r.children,lines,indent+'  '); }
  return lines;
}

function formatIso(parsed){
  const lines=[]; lines.push(`MTI: ${parsed.mti}`); lines.push(`Bitmap: ${parsed.bitmapHex}`); lines.push(`Active fields: ${parsed.active.filter(n=>n!==1).join(', ')}`); lines.push('');
  const rows=$('originalOrder').checked?parsed.rows:[...parsed.rows].sort((a,b)=>a.n-b.n);
  for(const r of rows){
    const hide=$('hideValue').checked; let value=r.valueHex;
    const asciiMode=$('convertAscii').checked || r.type.startsWith('ASCII:');
    let display=hide?'********':(asciiMode?printable(value):value);
    const parts=[`DE ${String(r.n).padStart(2,'0')}`]; if($('showFieldName').checked)parts.push(r.name); parts.push('='); parts.push(display); if($('showLength').checked)parts.push(`[${r.lengthInfo}]`); lines.push(parts.join(' '));
    if(r.n===55 && value){ const tlv=parseTlv(value); if(tlv.length){ lines.push('  EMV/TLV:'); formatTlv(tlv,lines,'    '); }}
  }
  return lines.join('\n');
}

function formatBitmap(parsed){
  const lines=[`MTI: ${parsed.mti}`,`Bitmap: ${parsed.bitmapHex}`,'','Bit  Field']; parsed.active.forEach(n=>lines.push(`${String(n).padStart(3,' ')}  ${fieldInfo(n)[0]}`)); return lines.join('\n');
}

function doParse(){
  const hex=cleanHex(input.value); output.classList.remove('error');
  if(!hex){ output.textContent=state.mode==='tlv'?'No TLV data.':'Please enter valid Hex code'; return; }
  if(!validHex(hex)){ output.textContent='Invalid Hex code'; output.classList.add('error'); return; }
  try{
    if(state.mode==='tlv'){ const rows=parseTlv(hex); output.textContent=formatTlv(rows).join('\n') || 'No valid TLV data'; packetTitle.textContent='TLV / EMV Result'; meta.textContent=`${hex.length/2} bytes`; return; }
    if(state.mode==='other'){ output.textContent=$('convertAscii').checked?ascii(hex):hex; packetTitle.textContent='Other'; meta.textContent=`${hex.length/2} bytes`; return; }
    const parsed=parseIso(hex,state.mode==='response'); packetTitle.textContent=`${parsed.mti ? 'ISO8583' : 'Packet'} Result`; meta.textContent=`MTI ${parsed.mti} · ${parsed.active.length-1} active data fields · ${hex.length/2} bytes`;
    output.textContent=$('showBitmap').checked?formatBitmap(parsed):formatIso(parsed);
  }catch(e){ output.textContent=`Invalid packet: ${e.message}`; output.classList.add('error'); }
}

document.querySelectorAll('.mode').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.mode').forEach(x=>x.classList.remove('active'));btn.classList.add('active');state.mode=btn.dataset.mode;$('parseBtn').textContent='Parse';if(SAMPLES[state.mode])input.value=SAMPLES[state.mode];doParse();}));
$('parseBtn').addEventListener('click',doParse);
$('sampleBtn').addEventListener('click',()=>{input.value=SAMPLES[state.mode]||'';doParse();});
$('clearBtn').addEventListener('click',()=>{input.value='';output.textContent='Enter a packet and click Parse.';packetTitle.textContent='Result';meta.textContent='';});
$('copyBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.textContent);$('copyBtn').textContent='Copied';setTimeout(()=>$('copyBtn').textContent='Copy',900);}catch{}});
['showBitmap','showFieldName','showLength','convertAscii','hideValue','originalOrder'].forEach(id=>$(id).addEventListener('change',doParse));

input.value=SAMPLES.request; doParse();
