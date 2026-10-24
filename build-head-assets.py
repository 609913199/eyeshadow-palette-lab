from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent;manifest={}
for key,name in [('wasm','ort-wasm-simd-threaded.wasm'),('model','head-segmentation-q8.onnx')]:
 data=(root/name).read_bytes();parts=[]
 for i,start in enumerate(range(0,len(data),262144)):
  block=data[start:start+262144];filename=f'head-{key}-{i:03}.bin';(root/filename).write_bytes(block);parts.append({'file':filename,'size':len(block),'sha256':hashlib.sha256(block).hexdigest()})
 manifest[key]={'original':name,'size':len(data),'sha256':hashlib.sha256(data).hexdigest(),'parts':parts}
(root/'head-assets.mjs').write_text('export const HEAD_ASSETS='+json.dumps(manifest,separators=(',',':'))+';\n')
print({k:len(v['parts']) for k,v in manifest.items()})

# Optional portable package, imported through the cutout dialog.
import struct
meta={'assets':[{'key':k,'size':a['size'],'sha256':a['sha256']} for k,a in manifest.items()],'licenses':{n:(root/n).read_text() for n in ['MEDIAPIPE_LICENSE.txt','ONNXRUNTIME_LICENSE.txt']}}
m=json.dumps(meta,ensure_ascii=False).encode()
(root/'PaletteLab-Offline-AI.paletteai').write_bytes(b'PALT7AI!'+struct.pack('<I',len(m))+m+b''.join((root/a['original']).read_bytes() for a in manifest.values()))
