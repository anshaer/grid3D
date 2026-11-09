/* WebGL 1 opaque voxel renderer: resident vertex buffers, rigid-head shader, depth buffer.
   All data/programs are local. No framework or runtime download. */
(function(root){'use strict';
const VERTEX=`precision highp float;
attribute vec3 position; attribute vec3 normal; attribute vec3 color;
uniform vec3 pivot; uniform vec3 center; uniform vec3 right; uniform vec3 up; uniform vec3 direction;
uniform vec2 clipScale; uniform vec2 pan; uniform vec2 turn; uniform vec2 tilt; uniform float head; uniform float headScale; uniform float unitScale;
uniform mat4 rigMatrix; uniform mat3 rigNormal;
varying vec3 vColor; varying vec2 vGrid;
void main(){
 vGrid=abs(normal.x)>0.5?position.yz:abs(normal.y)>0.5?position.xz:position.xy;
 vec3 p=position/unitScale,n=normal;
 if(head>0.5){p=(p-pivot)*headScale;p.yz=vec2(p.y*tilt.x+p.z*tilt.y,-p.y*tilt.y+p.z*tilt.x);p.xy=vec2(p.x*turn.x-p.y*turn.y,p.x*turn.y+p.y*turn.x);p+=pivot;n.yz=vec2(n.y*tilt.x+n.z*tilt.y,-n.y*tilt.y+n.z*tilt.x);n.xy=vec2(n.x*turn.x-n.y*turn.y,n.x*turn.y+n.y*turn.x);}
 p=(rigMatrix*vec4(p,1.0)).xyz;n=rigNormal*n;
 p-=center;
 gl_Position=vec4(dot(p,right)*clipScale.x+pan.x,dot(p,up)*clipScale.y+pan.y,-dot(p,direction)/2048.0,1.0);
 float light=max(0.0,min(1.0,dot(n,vec3(-0.35,-0.55,0.8))));vColor=color*(0.78+0.22*light);
}`;
const FRAGMENT=`precision highp float;varying vec3 vColor;varying vec2 vGrid;uniform float modelGrid;uniform float gridWidth;uniform vec3 gridColor;void main(){vec2 d=abs(fract(vGrid+0.5)-0.5);float edge=1.0-smoothstep(gridWidth*0.35,gridWidth,min(d.x,d.y));gl_FragColor=vec4(mix(vColor,gridColor,modelGrid*edge*0.65),1.0);}`;
function packFaces(faces,palette){const data=new Float32Array(faces.length*6*9);let j=0;for(const f of faces){const hex=palette[f.color]||'#ff00ff',col=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),norm=[0,0,0];norm[f.axis]=f.sign;for(const i of [0,1,2,0,2,3]){const p=f.p[i];data.set(p,j);data.set(norm,j+3);data.set(col,j+6);j+=9;}}return data;}
class VoxelGL{
 constructor(canvas){this.canvas=canvas;const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});if(!gl)throw Error('WebGL 無法啟用');this.gl=gl;this.cache=new Map();this.palette='';this.lost=false;
 const shader=(type,src)=>{const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const info=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw Error(info||'Shader compile failed');}return sh;};
 const vs=shader(gl.VERTEX_SHADER,VERTEX),fs=shader(gl.FRAGMENT_SHADER,FRAGMENT),program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'Shader link failed');this.program=program;
 this.locations={};for(const name of ['position','normal','color'])this.locations[name]=gl.getAttribLocation(program,name);for(const name of ['pivot','center','right','up','direction','clipScale','pan','turn','tilt','rigMatrix','rigNormal','head','headScale','unitScale','modelGrid','gridWidth','gridColor'])this.locations[name]=gl.getUniformLocation(program,name);
 gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.onLost?.();});canvas.addEventListener('webglcontextrestored',()=>{this.lost=true;this.onLost?.();});
 }
 reset(){for(const item of this.cache.values())this.gl.deleteBuffer(item.buffer);this.cache.clear();}
 buffer(faces,palette){const gl=this.gl;let item=this.cache.get(faces);if(item)return item;const data=packFaces(faces,palette),buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);item={buffer,count:data.length/9};this.cache.set(faces,item);if(this.cache.size>18){const first=this.cache.keys().next().value;gl.deleteBuffer(this.cache.get(first).buffer);this.cache.delete(first);}return item;}
 render(parts,options){if(this.lost)throw Error('WebGL context lost');const {palette,camera,pivot,yaw,pitch=0,headScale,unitScale,W,H,DPR,scale}=options,gl=this.gl,L=this.locations,key=palette.join(',');if(key!==this.palette){this.reset();this.palette=key;}
 const w=Math.max(1,Math.round(W*DPR)),h=Math.max(1,Math.round(H*DPR));if(this.canvas.width!==w)this.canvas.width=w;if(this.canvas.height!==h)this.canvas.height=h;gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
 const ct=Math.cos(camera.theta),st=Math.sin(camera.theta),ce=Math.cos(camera.elev),se=Math.sin(camera.elev),a=yaw*Math.PI/180;
 gl.uniform3fv(L.pivot,pivot.map(v=>v/unitScale));gl.uniform3fv(L.center,camera.center);gl.uniform3f(L.right,ct,st,0);gl.uniform3f(L.up,-st*se,ct*se,ce);gl.uniform3f(L.direction,st*ce,-ct*ce,se);gl.uniform2f(L.clipScale,2*scale/W,2*scale/H);gl.uniform2f(L.pan,2*camera.panX/W,-2*camera.panY/H);gl.uniform2f(L.turn,Math.cos(a),Math.sin(a));gl.uniform2f(L.tilt,Math.cos(pitch*Math.PI/180),Math.sin(pitch*Math.PI/180));gl.uniform1f(L.headScale,headScale);gl.uniform1f(L.unitScale,unitScale);
 gl.uniform1f(L.modelGrid,options.modelGrid?1:0);gl.uniform1f(L.gridWidth,Math.min(.28,.55*unitScale/scale));gl.uniform3fv(L.gridColor,[1,3,5].map(i=>parseInt((options.gridColor||'#b6a3c4').slice(i,i+2),16)/255));
 let count=0;for(const part of parts){if(!part.faces.length)continue;const item=this.buffer(part.faces,palette);gl.bindBuffer(gl.ARRAY_BUFFER,item.buffer);for(const [i,name]of ['position','normal','color'].entries()){gl.enableVertexAttribArray(L[name]);gl.vertexAttribPointer(L[name],3,gl.FLOAT,false,36,i*12);}const r=part.matrix?.r||[1,0,0,0,1,0,0,0,1],t=part.matrix?.t||[0,0,0];gl.uniformMatrix4fv(L.rigMatrix,false,[r[0],r[3],r[6],0,r[1],r[4],r[7],0,r[2],r[5],r[8],0,t[0]/unitScale,t[1]/unitScale,t[2]/unitScale,1]);gl.uniformMatrix3fv(L.rigNormal,false,[r[0],r[3],r[6],r[1],r[4],r[7],r[2],r[5],r[8]]);gl.uniform1f(L.head,part.head?1:0);gl.drawArrays(gl.TRIANGLES,0,item.count);count+=item.count/6;}return count;
 }
}
root.VoxelGL=VoxelGL;root.VoxelGLShaders={vertex:VERTEX,fragment:FRAGMENT};root.packVoxelFaces=packFaces;
if(typeof module!=='undefined')module.exports={VoxelGL,VERTEX,FRAGMENT,packFaces};
})(typeof window==='undefined'?globalThis:window);
