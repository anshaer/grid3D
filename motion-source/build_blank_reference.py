import json
from pathlib import Path
import numpy as np
N=128;S=1
class Builder:
 def __init__(self):self.body=np.zeros((N,N,N),np.uint8);self.head=np.zeros_like(self.body)
 def boxgrid(self,lo,hi):
  a=np.maximum(0,np.floor(np.array(lo)*S).astype(int));b=np.minimum(N,np.ceil(np.array(hi)*S).astype(int))
  x=(np.arange(a[0],b[0])[None,None,:]+.5)/S;y=(np.arange(a[1],b[1])[None,:,None]+.5)/S;z=(np.arange(a[2],b[2])[:,None,None]+.5)/S
  return (slice(a[2],b[2]),slice(a[1],b[1]),slice(a[0],b[0])),x,y,z
 def shape(self,target,lo,hi,mask,col):
  sl,x,y,z=self.boxgrid(lo,hi);sub=getattr(self,target)[sl];m=np.broadcast_to(mask(x,y,z),sub.shape);c=col(x,y,z) if callable(col)else col;sub[m]=np.broadcast_to(c,sub.shape)[m]+1
 def ell(self,t,c,r,col,cond=None):
  self.shape(t,np.array(c)-r,np.array(c)+r,lambda x,y,z:(((x-c[0])/r[0])**2+((y-c[1])/r[1])**2+((z-c[2])/r[2])**2<=1)&(cond(x,y,z)if cond else True),col)
 def capsule(self,t,a,b,r,col):
  a=np.array(a,float);b=np.array(b,float);d=b-a;ll=float(d@d)
  def mask(x,y,z):
   tt=np.clip(((x-a[0])*d[0]+(y-a[1])*d[1]+(z-a[2])*d[2])/ll,0,1)
   return (x-a[0]-tt*d[0])**2+(y-a[1]-tt*d[1])**2+(z-a[2]-tt*d[2])**2<=r*r
  self.shape(t,np.minimum(a,b)-r,np.maximum(a,b)+r,mask,col)
 def tube(self,t,points,r,col):
  for a,b in zip(points[:-1],points[1:]):self.capsule(t,a,b,r,col)
 def shell(self,a):
  occ=a>0;inside=occ.copy()
  for axis in range(3):
   prior=np.zeros_like(occ);nxt=np.zeros_like(occ);dst=[slice(None)]*3;src=dst.copy();dst[axis]=slice(1,None);src[axis]=slice(None,-1);prior[tuple(dst)]=occ[tuple(src)];dst[axis]=slice(None,-1);src[axis]=slice(1,None);nxt[tuple(dst)]=occ[tuple(src)];inside &= prior&nxt
  a[inside]=0;del occ,inside
 def rle(self,a):
  a=a.ravel();k=np.flatnonzero(a);cut=np.ones(len(k),bool);cut[1:]=(k[1:]!=k[:-1]+1)|(a[k[1:]]!=a[k[:-1]])|(k[1:]//N!=k[:-1]//N);starts=np.flatnonzero(cut);ends=np.r_[starts[1:],len(k)]
  return [[int(k[i]),int(j-i),int(a[k[i]])-1]for i,j in zip(starts,ends)],len(k)
 def front(self,c,r):
  sl,x,y,z=self.boxgrid(np.array(c)-r,np.array(c)+r);sub=self.head[sl];skin=(sub>=1)&(sub<=3);ys=np.arange(sub.shape[1],dtype=np.int32)[None,:,None];sy=np.min(np.where(skin,ys,10000),axis=1);allY=np.min(np.where(sub>0,ys,10000),axis=1);ok=(sy<10000)&(sy==allY);yi=sy+sl[1].start;zs=np.arange(sl[0].start,sl[0].stop)[:,None];xs=np.arange(sl[2].start,sl[2].stop)[None,:]
  X=np.broadcast_to((xs+.5)/S,sy.shape);Z=np.broadcast_to((zs+.5)/S,sy.shape);keys=(zs*N+yi)*N+xs
  return X,Z,keys,ok
 def paint(self,X,Z,keys,ok,mask,col):
  m=ok&np.broadcast_to(mask,ok.shape);k=keys[m];c=col if not isinstance(col,np.ndarray)else np.broadcast_to(col,ok.shape)[m];self.head.ravel()[k]=np.asarray(c)+1
 def patch(self,keys,ok,mask,col):
  m=ok&np.broadcast_to(mask,ok.shape);k=keys[m];cs=np.broadcast_to(col,ok.shape)[m];return [[int(a),int(b)]for a,b in zip(k,cs)]



p=Path('Chibi_Studio_128');palette=['#e5e1dc','#f5f3ef','#c8c3bd','#48434b','#8a838d','#ffffff','#d6b9bc'];b=Builder()
for name in ['leftHand','leftFoot','rightHand','rightFoot']:setattr(b,name,np.zeros((N,N,N),np.uint8))
b.ell('body',[64,64,65],[14,9,18],0);b.ell('body',[64,63,83],[5,4,6],0)
for side,s in [('left',1),('right',-1)]:
 b.ell('body',[64+s*12,64,76],[5,7,6],0)
 b.capsule(side+'Hand',[64+s*16,64,77],[64+s*23,63,57],4.5,0);b.ell(side+'Hand',[64+s*24,62.5,53],[4.1,3.6,5.2],0)
 b.capsule(side+'Foot',[64+s*8,64,49],[64+s*9,63,15],4.7,0);b.ell(side+'Foot',[64+s*9,60,8],[5.5,8,4.8],0)
fc=[64,62,103];fr=[22,23,23];b.ell('head',fc,fr,0)
X,Z,KEY,OK=b.front(fc,np.array(fr)+1);ex={};half=[];closed=[]
for s in [-1,1]:
 cx=64+s*9.5;dx=(X-cx)/4.2;dz=(Z-104)/4;mask=dx*dx+dz*dz<=1
 colors=np.where(abs(dx)<.6,4,5);colors=np.where((abs(dx)<.3)&(abs(dz)<.9),3,colors);colors=np.where((dx+.27)**2+(dz-.38)**2<.07,5,colors);colors=np.where(dz>.75,3,colors)
 b.paint(X,Z,KEY,OK,mask,colors);cl=np.where(abs(Z-(103.5+.18*abs(dx)))<.55,3,0);ha=np.where(Z>104,0,colors)
 half+=b.patch(KEY,OK,mask,ha);closed+=b.patch(KEY,OK,mask,cl)
 brow=(abs(X-cx)<3.7)&(abs(Z-110.5)<.55);b.paint(X,Z,KEY,OK,brow,3)
ex['eyeHalf']=half;ex['eyeClosed']=closed
mouthRegion=((X-64)/4)**2+((Z-93.5)/3.5)**2<1.5
for mode in ['Open','Slight','Smile','Frown']:
 dx=(X-64)/3.5;dz=(Z-93.5)/3
 if mode=='Open':col=np.where(dx*dx+dz*dz<1,np.where(dz<-.3,6,3),0)
 elif mode=='Slight':col=np.where(dx*dx+(dz*2.3)**2<1,np.where(dz<0,6,3),0)
 else:
  line=93.5+(.9 if mode=='Smile'else-.9)*abs(dx)**1.5;col=np.where((abs(Z-line)<.58)&(abs(dx)<.96),3,0)
 ex['mouth'+mode]=b.patch(KEY,OK,mouthRegion,col)
 if mode=='Smile':b.paint(X,Z,KEY,OK,mouthRegion,col)
maskold=np.zeros(X.shape,bool);masknew=maskold.copy()
for s in [-1,1]:
 maskold|=(abs(X-(64+s*9.5))<3.7)&(abs(Z-110.5)<.55);masknew|=(abs(X-(64+s*9.5))<3.7)&(abs(Z-113.5)<.55)
ex['browRaised']=b.patch(KEY,OK,maskold|masknew,np.where(masknew,3,0))
for name in ['body','head','leftHand','leftFoot','rightHand','rightFoot']:b.shell(getattr(b,name))
flat=b.head.ravel();ex={name:[r for r in rows if flat[r[0]]>0]for name,rows in ex.items()}
piv={'head':[64,63,82],'leftHand':[80,64,77],'rightHand':[48,64,77],'leftFoot':[72,64,49],'rightFoot':[56,64,49]}
d={'format':'ansha-chibi-studio-v1','version':8,'references':[],'settings':{'showPivot':False},'size':128,'name':'Q版基礎素體','palette':palette,'torso':{'runs':b.rle(b.body)[0]},'parts':{name:{'runs':b.rle(getattr(b,name))[0],'pivot':v,'rotation':[0,0,0]}for name,v in piv.items()},'expressions':ex,'defaults':{'eyes':'open','mouth':'smile','brow':'normal','head':[0,0,0]},'background':'#eee8f3','editor':{'grid':False,'gridX':False,'gridY':False,'gridZ':False,'gridColor':'#b6a3c4','axes':True,'axesColor':'#d25885','fade':False,'fadeAmount':70},'design':{'base':'blank untextured mannequin, no hair, no clothing, no anatomical detail','referenceResolution':128}}
# Independent eye/brow patches, keeping character-left on positive X.
old=d['expressions'];separate={k:v for k,v in old.items()if k.startswith('mouth')}
for name,source in {'eyeLeftHalf':'eyeHalf','eyeRightHalf':'eyeHalf','eyeLeftClosed':'eyeClosed','eyeRightClosed':'eyeClosed','browLeftRaised':'browRaised','browRightRaised':'browRaised'}.items():
 separate[name]=[row for row in old[source]if(row[0]%128>=64)==('Left'in name)]
d['expressions']=separate;d['version']=9;d['defaults']={'leftEye':'open','rightEye':'open','mouth':'smile','leftBrow':'normal','rightBrow':'normal','head':[0,0,0]};d['settings']['showHeadPivot']=False
for axis,color in zip('XYZ',['#c96479','#73a386','#799ac7']):
 d['editor'].update({'grid'+axis+'Mode':'single','grid'+axis+'Color':color,'grid'+axis+'Opacity':65})
# Explicit open-eye / resting-brow states belong to their own feature group.
base=b.head.ravel()
for group,name in [('eyeLeft','eyeLeftOpen'),('eyeRight','eyeRightOpen'),('browLeft','browLeftNormal'),('browRight','browRightNormal')]:
 keys=set(row[0]for id,rows in d['expressions'].items()if id.startswith(group)for row in rows)
 d['expressions'][name]=[[int(k),int(base[k])-1]for k in sorted(keys)]
d['version']=10;d['design']['headRadii']=[22,23,23];d['editor']['hideFeatures']=False
(p/'Chibi_Reference_128.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')));print('Blank reference generated',sum(len(b.rle(getattr(b,n))[0])for n in piv))
