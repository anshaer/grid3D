'use strict';
const fs=require('node:fs'),path=require('node:path');
const APP_FILES=Object.freeze(['main.cjs','preload.cjs','index.html','assets/cube.png','assets/cube.ico','assets/cube.svg']);
function copyFile(source,target){
 if(!fs.lstatSync(source).isFile())throw Error('Application payload must be a regular file: '+source);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);
}
function verifyPayload(target){
 const allowed=new Set([...APP_FILES,'package.json']);
 function walk(dir,prefix=''){
  for(const item of fs.readdirSync(dir,{withFileTypes:true})){
   const name=prefix+item.name;
   if(item.isDirectory())walk(path.join(dir,item.name),name+'/');
   else if(!item.isFile()||!allowed.delete(name))throw Error('Unexpected application payload: '+name);
  }
 }
 walk(target);if(allowed.size)throw Error('Missing application payload: '+[...allowed].join(', '));
}
function build(source,destination,platform=process.platform){
 const mac=platform==='darwin';
 if(!['win32','darwin'].includes(platform))throw Error('Only Windows and macOS folder builds are supported');
 if(!fs.existsSync(path.join(source,mac?'Electron.app/Contents/MacOS/Electron':'electron.exe')))throw Error('Matching Electron runtime not found');
 const src=path.resolve(source),dst=path.resolve(destination),appSource=path.resolve(__dirname);
 const inside=(a,b)=>a===b||a.startsWith(b+path.sep);
 if(dst===path.parse(dst).root||inside(src,dst)||inside(dst,src)||inside(appSource,dst))throw Error('Unsafe build destination');
 // Start with an empty output so stale files cannot leak into a new artifact.
 fs.rmSync(dst,{recursive:true,force:true});
 // Only copy the official Electron runtime, never this repository or desktop/ wholesale.
 fs.mkdirSync(destination,{recursive:true});fs.cpSync(source,destination,{recursive:true,dereference:false,verbatimSymlinks:true});
 const target=path.join(destination,mac?'Electron.app/Contents/Resources/app':'resources/app');
 // Remove stale application payload so an old or accidental EX/ cannot survive a rebuild.
 fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});
 for(const file of APP_FILES)copyFile(path.join(__dirname,file),path.join(target,file));
 const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'package.json'),'utf8'));
 fs.writeFileSync(path.join(target,'package.json'),JSON.stringify({name:pkg.name,version:pkg.version,main:'main.cjs'},null,2)+'\n');
 verifyPayload(target);
 fs.writeFileSync(path.join(destination,'START-HERE.txt'),mac?'Open Electron.app. Keep this folder intact. Source: https://github.com/anshaer/grid3D\n':'Run electron.exe. Keep all files together. Page: resources/app/index.html\r\nSource: https://github.com/anshaer/grid3D\r\n');
 console.log('Folder app ready:',destination);
 return target;
}
if(require.main===module)build(path.join(path.dirname(require.resolve('electron/package.json')),'dist'),path.join(__dirname,'dist','VoxelCharacter'));
module.exports=build;module.exports.APP_FILES=APP_FILES;module.exports.verifyPayload=verifyPayload;
