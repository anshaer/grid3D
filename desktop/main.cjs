const path=require('node:path');
const {app,BrowserWindow,powerSaveBlocker,session,ipcMain}=require('electron');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
let win,block;
app.whenReady().then(()=>{
 block=powerSaveBlocker.start('prevent-app-suspension');
 session.defaultSession.setPermissionRequestHandler((contents,permission,callback)=>callback(contents===win?.webContents&&permission==='media'));
 win=new BrowserWindow({width:1100,height:850,transparent:true,frame:false,hasShadow:false,resizable:false,backgroundColor:'#00000000',icon:path.join(__dirname,'assets','cube.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),backgroundThrottling:false,nodeIntegration:false,contextIsolation:true,sandbox:true}});
 if(process.platform==='darwin')app.dock?.setIcon(path.join(__dirname,'assets','cube.png'));
 ipcMain.on('window-action',(event,action)=>{if(event.sender!==win.webContents)return;if(action==='minimize')win.minimize();if(action==='close')win.close();});
 win.removeMenu();win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',event=>event.preventDefault());
 win.loadFile('index.html',{query:{desktop:'1'}});
});
app.on('window-all-closed',()=>{if(block!==undefined&&powerSaveBlocker.isStarted(block))powerSaveBlocker.stop(block);app.quit();});
