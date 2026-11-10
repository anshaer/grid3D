'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
// Work in a sandbox containing realistic files that must not be shipped.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'grid3d-package-'));
try{
 const root=path.join(temp,'repo'),desktop=path.join(root,'desktop');fs.mkdirSync(desktop,{recursive:true});
 for(const name of [...require('./build-folder.cjs').APP_FILES,'package.json','build-folder.cjs']){
  const target=path.join(desktop,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(__dirname,name),target);
 }
 for(const file of ['EX/sample.json','examples/base.json','motion-source/app.js','README.md','character-builder.html','desktop/EX/accidental.json','desktop/node_modules/unused.json','desktop/README.md','desktop/extra.json']){
  const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,'must-not-ship');
 }
 const build=require(path.join(desktop,'build-folder.cjs'));
 for(const platform of ['win32','darwin']){
  const runtime=path.join(temp,platform+'-runtime'),dest=path.join(temp,platform+'-output');
  const executable=platform==='win32'?'electron.exe':'Electron.app/Contents/MacOS/Electron';
  fs.mkdirSync(path.dirname(path.join(runtime,executable)),{recursive:true});fs.writeFileSync(path.join(runtime,executable),'official-runtime-bytes');
  fs.writeFileSync(path.join(runtime,'LICENSE'),'runtime-license');
  if(platform==='darwin'&&process.platform!=='win32'){
   const dir=path.join(runtime,'Electron.app/Contents/Frameworks/Example.framework');fs.mkdirSync(path.join(dir,'Versions/A'),{recursive:true});
   fs.writeFileSync(path.join(dir,'Versions/A/Example'),'framework-bytes');fs.symlinkSync('A',path.join(dir,'Versions/Current'),'dir');fs.symlinkSync('Versions/Current/Example',path.join(dir,'Example'),'file');
  }
  const target=build(runtime,dest,platform);build.verifyPayload(target);
  const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');assert.equal(sha(path.join(runtime,executable)),sha(path.join(dest,executable)));
  const expected=[...build.APP_FILES,'package.json'].sort();const payload=[];
  function walk(dir,rel=''){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const name=rel+ent.name;if(ent.isDirectory())walk(path.join(dir,ent.name),name+'/');else payload.push(name);}}
  walk(target);assert.deepEqual(payload.sort(),expected);assert(!fs.existsSync(path.join(dest,'EX')));
  const pkg=JSON.parse(fs.readFileSync(path.join(target,'package.json')));assert.equal(pkg.version,JSON.parse(fs.readFileSync(path.join(desktop,'package.json'))).version);assert(!pkg.devDependencies);
  if(platform==='darwin'&&process.platform!=='win32')assert.equal(fs.readlinkSync(path.join(dest,'Electron.app/Contents/Frameworks/Example.framework/Versions/Current')),'A');
  fs.mkdirSync(path.join(target,'EX'));fs.writeFileSync(path.join(target,'EX/stale.json'),'stale');
  assert.throws(()=>build.verifyPayload(target));build(runtime,dest,platform);build.verifyPayload(target);assert(!fs.existsSync(path.join(target,'EX')));
  console.log('PASS',platform,': exact allowlist, root/desktop EX excluded, stale payload cleared, runtime unchanged, symlinks retained');
 }
}finally{fs.rmSync(temp,{recursive:true,force:true});}
