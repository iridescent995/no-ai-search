const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../popup.js'),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function setup(saved,failRead=false){
 const listeners=[];const handlers={};const toggle={checked:false,disabled:true,addEventListener:(name,fn)=>handlers[name]=fn};const status={textContent:''};let failSave=false;
 const local={get:async defaults=>{if(failRead)throw Error('read');return {...defaults,enabled:saved}},set:async values=>{if(failSave)throw Error('write');const old=saved;saved=values.enabled;listeners.forEach(fn=>fn({enabled:{oldValue:old,newValue:saved}},'local'))}};
 vm.runInNewContext(source,{document:{getElementById:id=>id==='enabled'?toggle:status},chrome:{storage:{local,onChanged:{addListener:fn=>listeners.push(fn)}}}});
 await tick();
 return {toggle,status,get saved(){return saved},set failSave(v){failSave=v},change:async value=>{toggle.checked=value;await handlers.change()},external:value=>listeners.forEach(fn=>fn({enabled:{newValue:value}},'local'))};
}
test('saved off preference is reflected when popup opens',async()=>{const p=await setup(false);assert.equal(p.toggle.checked,false);assert.equal(p.toggle.disabled,false);assert.match(p.status.textContent,/Off/)});
test('toggle persists on and off',async()=>{const p=await setup(false);await p.change(true);assert.equal(p.saved,true);assert.equal(p.toggle.checked,true);await p.change(false);assert.equal(p.saved,false);assert.equal(p.toggle.disabled,false)});
test('external setting updates the open popup',async()=>{const p=await setup(true);p.external(false);assert.equal(p.toggle.checked,false);assert.match(p.status.textContent,/Off/)});
test('failed write restores prior UI and permits retry',async()=>{const p=await setup(true);p.failSave=true;await p.change(false);assert.equal(p.toggle.checked,true);assert.equal(p.saved,true);assert.equal(p.toggle.disabled,false);assert.match(p.status.textContent,/Couldn’t save/)});
test('failed read leaves control disabled with explanation',async()=>{const p=await setup(true,true);assert.equal(p.toggle.disabled,true);assert.match(p.status.textContent,/Couldn’t load/)});
