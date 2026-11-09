/* grid3D coordinate contract: integer [1,N], X right / Y back / Z up.
   HTML face-rig extension: two voxel models and surface-color expression patches. */
(function(root){'use strict';
const key=(x,y,z,N=128)=>(z-1)*N*N+(y-1)*N+x-1;
const point=(k,N=128)=>[k%N+1,Math.floor(k/N)%N+1,Math.floor(k/(N*N))+1];
function decode(runs,N=128,paletteSize=256){if(!Array.isArray(runs)||runs.length>1200000)throw Error('方格資料過多或格式錯誤');const m=new Map();for(const r of runs){if(!Array.isArray(r)||r.length!==3||r.some(v=>!Number.isInteger(v))||r[0]<0||r[1]<1||r[0]+r[1]>N**3||r[2]<0||r[2]>=paletteSize||Math.floor(r[0]/N)!==Math.floor((r[0]+r[1]-1)/N))throw Error('方格連續資料超出範圍');for(let i=0;i<r[1];i++){const k=r[0]+i;if(m.has(k))throw Error('方格座標重複');m.set(k,r[2]);}if(m.size>1200000)throw Error('單層最多 120 萬格');}return m;}
function encode(m,N=128){const runs=[];let r;for(const [k,c]of [...m].sort((a,b)=>a[0]-b[0])){if(r&&c===r[2]&&k===r[0]+r[1]&&Math.floor(k/N)===Math.floor(r[0]/N))r[1]++;else{r=[k,1,c];runs.push(r);}}return runs;}
function validate(d){if(!d||!['ansha-voxel-face-v1','ansha-voxel-face-v2'].includes(d.format)||![128,256,512].includes(d.size)||d.origin!==1||d.axes!=='X-right_Y-back_Z-up')throw Error('請使用本製作器的 128／256／512 方格角色專案');if(typeof d.name!=='string'||d.name.length>100||!Array.isArray(d.palette)||!d.palette.length||d.palette.length>256||d.palette.some(c=>!/^#[0-9a-f]{6}$/i.test(c)))throw Error('名稱或色盤格式錯誤');if(!Array.isArray(d.pivot)||d.pivot.length!==3||d.pivot.some(v=>!Number.isFinite(v)||v<0||v>d.size))throw Error('頭部旋轉中心錯誤');if(d.defaults){const s=d.defaults;if(s.yaw!==undefined&&(!Number.isFinite(s.yaw)||Math.abs(s.yaw)>45))throw Error('轉頭預設值錯誤');if(s.pitch!==undefined&&(!Number.isFinite(s.pitch)||Math.abs(s.pitch)>30))throw Error('抬頭低頭預設值錯誤');if(s.eyes!==undefined&&!['open','closed','left','right'].includes(s.eyes))throw Error('眼睛預設值錯誤');if(s.mouth!==undefined&&!['closed','slight','open'].includes(s.mouth))throw Error('嘴巴預設值錯誤');if(s.headScale!==undefined&&(!Number.isFinite(s.headScale)||s.headScale<.7||s.headScale>2))throw Error('頭部縮放預設值錯誤');if(s.background!==undefined&&!/^#[0-9a-f]{6}$/i.test(s.background))throw Error('背景色錯誤');}const body=decode(d.body?.runs,d.size,d.palette.length),head=decode(d.head?.runs,d.size,d.palette.length);if(!head.size&&!body.size)throw Error('角色是空的');const ex={};for(const id of ['leftClosed','rightClosed','mouthOpen','mouthSlight']){const pairs=d.expressions?.[id]||(id==='mouthSlight'?[]:null);if(!Array.isArray(pairs)||pairs.length>200000)throw Error('表情資料缺少或過多');const m=new Map();for(const row of pairs){if(!Array.isArray(row)||row.length!==2||!Number.isInteger(row[0])||row[0]<0||row[0]>=d.size**3||!Number.isInteger(row[1])||row[1]<-1||row[1]>=d.palette.length||m.has(row[0]))throw Error('表情方格資料錯誤');m.set(row[0],row[1]);}ex[id]=m;}const parts=Object.create(null),simpleParts=Object.create(null);if(d.rig){if(d.rig.version!==1||!['head','wrists','full'].includes(d.rig.mode)||!d.rig.parts||Object.keys(d.rig.parts).length>80)throw Error('綁定資料格式錯誤');for(const [id,v]of Object.entries(d.rig.parts)){if(!/^[a-zA-Z][a-zA-Z0-9]*$/.test(id)||!Array.isArray(v.pivot)||v.pivot.length!==3||v.pivot.some(x=>!Number.isFinite(x)||x<0||x>d.size))throw Error('部位支點格式錯誤');parts[id]=decode(v.runs,d.size,d.palette.length);if(v.simpleRuns)simpleParts[id]=decode(v.simpleRuns,d.size,d.palette.length);}for(const id of Object.keys(parts)){const seen=new Set();let at=id;while(at){if(seen.has(at)||!Object.hasOwn(parts,at))throw Error('骨骼階層有循環或遺失父部位');seen.add(at);at=d.rig.parts[at].parent;}}}return{body,head,expressions:ex,parts,simpleParts};}
function compose(head,ex,eyes,mouth){const m=new Map(head);for(const id of [...(eyes==='closed'||eyes==='left'?['leftClosed']:[]),...(eyes==='closed'||eyes==='right'?['rightClosed']:[]),...(mouth==='open'?['mouthOpen']:mouth==='slight'?['mouthSlight']:[])])for(const [k,c]of ex[id]){if(c===-1)m.delete(k);else m.set(k,c);}return m;}
// Merge coplanar, adjacent exposed unit-cell faces only. Geometry still follows the exact voxel boundary.
function mesh(m,N=128,options={}){
 const faces=[],strides=[1,N,N*N];
 // Sparse, exposed-face masks: no N³ scan or 512³ Uint16 allocation.
 for(let axis=0;axis<3;axis++){const u=(axis+1)%3,v=(axis+2)%3;
  for(const sign of [-1,1]){const planes=new Map();
   for(const [k,c]of (options.only?Array.from(options.only,k=>[k,m.get(k)]):m)){if(c===undefined||options.exclude?.has(k))continue;const p=point(k,N).map(x=>x-1),neighborInside=p[axis]+sign>=0&&p[axis]+sign<N;if(neighborInside&&m.has(k+sign*strides[axis]))continue;
    const slice=p[axis]+(sign>0?1:0);let mask=planes.get(slice);if(!mask){mask=new Map();planes.set(slice,mask);}mask.set(p[u]+p[v]*N,c);
   }
   for(const [slice,mask]of planes){for(const pos of [...mask.keys()].sort((a,b)=>a-b)){if(!mask.has(pos))continue;const c=mask.get(pos),i=pos%N,j=Math.floor(pos/N);let w=1;while(i+w<N&&mask.get(pos+w)===c)w++;let h=1;
    outer:while(j+h<N){for(let x=0;x<w;x++)if(mask.get(pos+h*N+x)!==c)break outer;h++;}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)mask.delete(pos+y*N+x);
    const p=[0,0,0];p[axis]=slice;p[u]=i;p[v]=j;const b=p.slice(),cc=p.slice(),dd=p.slice();b[u]+=w;cc[u]+=w;cc[v]+=h;dd[v]+=h;faces.push({p:[p,b,cc,dd],axis,sign,color:c,u,v,w,h});
   }}
  }
 }
 return faces;
}
function rotate(p,angle,pivot){const a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),x=p[0]-pivot[0],y=p[1]-pivot[1];return[pivot[0]+x*c-y*s,pivot[1]+x*s+y*c,p[2]];}
// Positive pitch raises the face. Apply local X tilt, then world Z yaw.
function rotateHead(p,yaw,pitch,pivot){const a=(Number(pitch)||0)*Math.PI/180,cp=Math.cos(a),sp=Math.sin(a),y=p[1]-pivot[1],z=p[2]-pivot[2];return rotate([p[0],pivot[1]+y*cp+z*sp,pivot[2]-y*sp+z*cp],yaw,pivot);}
// MediaPipe camera pose -> avatar controls. Camera coordinates face the avatar;
// reverse both signed axes here, leaving manual controls and VMC unchanged.
function cameraPose(m){if(!m||m.length<16||![m[8],m[9],m[10]].every(Number.isFinite))return null;return{yaw:(-Math.atan2(m[8],m[10])/.7)||0,pitch:(Math.atan2(m[9],Math.hypot(m[8],m[10]))/.7)||0};}
function parseGrid(d){if(!d||d.format!=='voxel-editor-v1'||![128,256,512].includes(d.size)||d.origin!==1||d.axes!=='X-right_Y-back_Z-up'||!Array.isArray(d.voxels)||d.voxels.length>1200000)throw Error('請匯入 grid3D 的 128／256／512 單模型 JSON（最多 120 萬格）');const m=new Map();for(const v of d.voxels){if(!Array.isArray(v.position)||v.position.length!==3||v.position.some(x=>!Number.isInteger(x)||x<1||x>d.size)||!/^#[0-9a-f]{6}$/i.test(v.color)||(v.opacity!==undefined&&v.opacity!==1))throw Error('此版僅接受不透明、軸對齊單色方格');const k=key(...v.position,d.size);if(m.has(k))throw Error('匯入方格座標重複');m.set(k,v.color.toLowerCase());}return m;}
function surface(m,N=128){const out=new Map(),strides=[1,N,N*N];for(const [k,c]of m){const p=point(k,N);if(p.some(v=>v===1||v===N)||strides.some(s=>!m.has(k-s)||!m.has(k+s)))out.set(k,c);}return out;}
function flatten(body,head,yaw,pivot,N=128,pitch=0){const out=new Map(body);for(const [k,c]of head){const p=point(k,N).map(v=>v-.5),r=rotateHead(p,yaw,pitch,pivot).map(v=>Math.floor(v)+1);if(r.every(v=>v>=1&&v<=N))out.set(key(...r,N),c);}return surface(out,N);}
const api={key,point,decode,encode,validate,compose,mesh,rotate,rotateHead,cameraPose,parseGrid,surface,flatten};root.VoxelCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
