const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktopWindow',{minimize:()=>ipcRenderer.send('window-action','minimize'),close:()=>ipcRenderer.send('window-action','close')});
