const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../popup.js'),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function setup(saved={},failRead=false){
 const listeners=[],handlers={},controls={},statuses={};let failSave=false;
 for(const key of ['enabled','hideAiMode'])controls[key]={checked:false,disabled:true,addEventListener:(name,fn)=>handlers[key]=fn};
 const local={get:async defaults=>{if(failRead)throw Error('read');return {...defaults,...saved}},set:async values=>{if(failSave)throw Error('write');const changes={};for(const key of Object.keys(values)){changes[key]={oldValue:saved[key],newValue:values[key]};saved[key]=values[key]}listeners.forEach(fn=>fn(changes,'local'))}};
 vm.runInNewContext(source,{document:{getElementById:id=>controls[id]||(statuses[id]||={textContent:''})},chrome:{storage:{local,onChanged:{addListener:fn=>listeners.push(fn)}}}});
 await tick();return {controls,statuses,saved,set failSave(v){failSave=v},change:async(key,value)=>{controls[key].checked=value;await handlers[key]()},external:changes=>listeners.forEach(fn=>fn(changes,'local'))};
}
test('AI Overviews default on; Hide AI Mode defaults off',async()=>{const p=await setup();assert.equal(p.controls.enabled.checked,true);assert.equal(p.controls.hideAiMode.checked,false);assert.match(p.statuses['ai-mode-status'].textContent,/Tab visible/)});
test('existing installations keep AI Mode visible',async()=>{const p=await setup({enabled:false});assert.equal(p.controls.enabled.checked,false);assert.equal(p.controls.hideAiMode.checked,false)});
test('saved settings restore independently',async()=>{const p=await setup({enabled:false,hideAiMode:true});assert.equal(p.controls.enabled.checked,false);assert.equal(p.controls.hideAiMode.checked,true)});
test('changing AI Mode preserves AI Overview preference',async()=>{const p=await setup({enabled:false});await p.change('hideAiMode',true);assert.equal(p.saved.hideAiMode,true);assert.equal(p.saved.enabled,false);await p.change('hideAiMode',false);assert.equal(p.saved.hideAiMode,false)});
test('changing AI Overviews preserves AI Mode preference',async()=>{const p=await setup({enabled:true,hideAiMode:true});await p.change('enabled',false);assert.equal(p.saved.enabled,false);assert.equal(p.saved.hideAiMode,true)});
test('external setting updates both controls',async()=>{const p=await setup();p.external({enabled:{newValue:false},hideAiMode:{newValue:true}});assert.equal(p.controls.enabled.checked,false);assert.equal(p.controls.hideAiMode.checked,true)});
test('deleted settings return to respective defaults',async()=>{const p=await setup({enabled:false,hideAiMode:true});p.external({enabled:{},hideAiMode:{}});assert.equal(p.controls.enabled.checked,true);assert.equal(p.controls.hideAiMode.checked,false)});
for(const key of ['enabled','hideAiMode'])test(`failed ${key} write restores prior state and permits retry`,async()=>{const p=await setup({enabled:true,hideAiMode:false});const previous=p.controls[key].checked;p.failSave=true;await p.change(key,!previous);assert.equal(p.controls[key].checked,previous);assert.equal(p.controls[key].disabled,false);assert.match(p.statuses[key==='enabled'?'status':'ai-mode-status'].textContent,/Couldn’t save/)});
test('failed reads disable both controls with explanation',async()=>{const p=await setup({},true);for(const key of ['enabled','hideAiMode'])assert.equal(p.controls[key].disabled,true);assert.match(p.statuses.status.textContent,/Couldn’t load/);assert.match(p.statuses['ai-mode-status'].textContent,/Couldn’t load/)});
