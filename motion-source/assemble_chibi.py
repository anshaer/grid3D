from pathlib import Path
import json
p=Path(__file__).resolve().parent;d=json.loads((p/'Chibi_Reference_128.json').read_text());ex=d['expressions'];
if 'leftHalf'in ex:ex['eyeHalf']=ex.pop('leftHalf')+ex.pop('rightHalf')
if 'leftClosed'in ex:ex['eyeClosed']=ex.pop('leftClosed')+ex.pop('rightClosed')
(p/'Chibi_Reference_128.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')))
def safe(d):return json.dumps(d,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
vmc=(p/'vmc_source.json').read_text()
core='\n'.join((p/f).read_text()for f in ['voxel.js','core.js','gpu.js'])
for maker,name in [(True,'Chibi_Studio_128.html'),(False,'Chibi_Character_128.html')]:
 s=(p/'template.html').read_text()
 for k,v in [('STYLE',(p/'style.css').read_text()),('PROJECT',safe(d)),('REFERENCE',safe(d)if maker else'null'),('VMC',vmc),('CORE',core),('APP',(p/'app.js').read_text())]:s=s.replace('/*'+k+'*/',v)
 if not maker:
  s=s.replace('data-mode="maker"','data-mode="player"',1)
  title=d.get('export',{}).get('tabTitle')or'3D格子角色'
  import html
  s=s.replace('<title>3D格子角色</title>','<title>'+html.escape(title)+'</title>',1)
 (p/name).write_text(s)
print('assembled studio and player')
