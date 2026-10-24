import {HEAD_ASSETS} from './head-assets.mjs?v=7';
import {loadBytes} from './head-loader.mjs?v=7';
const memory=new Map();let installedAI=null;
export const getInstalledAI=()=>installedAI;
export function seedHeadAssets(assets){for(const key of ['wasm','model']){const asset=HEAD_ASSETS[key],bytes=assets?.[key];if(!bytes||bytes.length!==asset.size)continue;let offset=0;for(const part of asset.parts){memory.set(new URL(part.file,import.meta.url).href,bytes.subarray(offset,offset+part.size));offset+=part.size;}}}

const aborted=()=>new DOMException('已取消','AbortError');
async function valid(bytes,part){if(bytes.length!==part.size)return false;if(!globalThis.crypto?.subtle)return true;const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')===part.sha256;}
export async function loadHeadAsset(key,{onStatus=()=>{},signal}={}){
 const asset=HEAD_ASSETS[key],label=key==='model'?'大头模型':'AI 运行文件';let cache;try{cache=await caches.open('palette-head-chunks-v7');}catch{}
 const chunks=new Array(asset.parts.length),active=new Map();let completed=0,next=0,cached=0,lastReport=0;
 const report=(force=false)=>{const now=Date.now();if(!force&&now-lastReport<150)return;lastReport=now;const received=completed+[...active.values()].reduce((a,b)=>a+b,0);onStatus(`${label}：${(received/1048576).toFixed(1)} / ${(asset.size/1048576).toFixed(1)} MB · ${Math.min(100,Math.round(received/asset.size*100))}%${cached?' · 已续传 '+cached+' 段':''}（小文件分段加载）`);};
 onStatus(`检查已保存的${label}，继续上次下载…`);
 for(let i=0;i<asset.parts.length;i++){
  if(signal?.aborted)throw aborted();const part=asset.parts[i],url=new URL(part.file,import.meta.url).href;let bytes=memory.get(url);if(!bytes&&cache){try{const hit=await cache.match(url);if(hit)bytes=new Uint8Array(await hit.arrayBuffer());}catch{}}
  if(bytes&&await valid(bytes,part)){chunks[i]=bytes;completed+=bytes.length;cached++;}else if(bytes&&cache){await cache.delete(url).catch(()=>{});}
 }
 report(true);if(cached===asset.parts.length)return assemble();
 // Reuse a previously completed full download, without issuing a network request.
 try{const response=await fetch(new URL(asset.original,import.meta.url),{cache:'only-if-cached',mode:'same-origin',signal});if(response.ok){const bytes=new Uint8Array(await response.arrayBuffer());if(await valid(bytes,asset)){for(let i=0,offset=0;i<asset.parts.length;i++){const part=asset.parts[i];chunks[i]=bytes.slice(offset,offset+part.size);offset+=part.size;await save(i,chunks[i]);}onStatus(`${label}：已复用本机缓存 · 100%`);return bytes;}}}catch(e){if(signal?.aborted)throw aborted();}
 const controller=new AbortController(),cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});
 try{await Promise.all([download(),download()]);}catch(e){controller.abort();throw e;}finally{signal?.removeEventListener('abort',cancel);}
 return assemble();
 async function save(i,bytes){const url=new URL(asset.parts[i].file,import.meta.url).href;memory.set(url,bytes);if(cache)try{await cache.put(url,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}));}catch{}}
 async function download(){while(next<asset.parts.length){const i=next++;if(chunks[i])continue;if(signal?.aborted||controller.signal.aborted)throw aborted();const part=asset.parts[i];active.set(i,0);const bytes=await loadBytes(new URL(part.file,import.meta.url),{label:`${label}第 ${i+1}/${asset.parts.length} 段`,signal:controller.signal,totalHint:part.size,onProgress:n=>{active.set(i,n);report();},onStatus:t=>{if(t.includes('重试')||t.includes('中断'))onStatus(t+'；已完成分段会保留。');}});if(!await valid(bytes,part))throw new Error('模型分段校验失败，请重试；已完成分段会保留。');chunks[i]=bytes;await save(i,bytes);active.delete(i);completed+=bytes.length;report(true);}}
 function assemble(){const all=new Uint8Array(asset.size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}return all;}
}
export async function installOfflineAI(file,{onStatus=()=>{}}={}){
 if(file.size>20*1048576)throw new Error('文件过大，请选择 Palette Lab 离线 AI 包。');
 const data=new Uint8Array(await file.arrayBuffer());if(new TextDecoder().decode(data.subarray(0,8))!=='PALT7AI!')throw new Error('不是有效的离线 AI 包。');
 const metadataSize=new DataView(data.buffer).getUint32(8,true);if(metadataSize>1000000||metadataSize+12>data.length)throw new Error('离线包格式不正确。');
 const metadata=JSON.parse(new TextDecoder().decode(data.subarray(12,12+metadataSize)));let offset=12+metadataSize;const blocks=[];
 for(const entry of metadata.assets){const asset=HEAD_ASSETS[entry.key];if(!asset||entry.size!==asset.size||entry.sha256!==asset.sha256)throw new Error('离线包版本不匹配，请下载新版。');const bytes=data.slice(offset,offset+entry.size);offset+=entry.size;if(!await valid(bytes,asset))throw new Error('离线包校验失败，请重新下载。');blocks.push({asset,bytes});}
 if(blocks.length!==2||new Set(metadata.assets.map(x=>x.key)).size!==2||offset!==data.length)throw new Error('离线包不完整。');
 installedAI=Object.fromEntries(blocks.map((b,i)=>[metadata.assets[i].key,b.bytes]));seedHeadAssets(installedAI);let cache,persistent=true;try{cache=await caches.open('palette-head-chunks-v7');}catch{persistent=false;}
 let installed=0;const total=blocks.reduce((n,b)=>n+b.bytes.length,0);for(const {asset,bytes} of blocks){let start=0;for(const part of asset.parts){const chunk=bytes.slice(start,start+part.size);start+=part.size;const url=new URL(part.file,import.meta.url).href;if(cache)try{await cache.put(url,new Response(chunk,{headers:{'Content-Type':'application/octet-stream'}}));}catch{persistent=false;}installed+=chunk.length;onStatus(`正在安装离线 AI：${Math.round(installed/total*100)}%`);}}
 onStatus('离线 AI 已安装。现在点击“一键大头抠图”，无需再下载模型。'+(persistent?'':'（本次页面有效，刷新后需重新导入）'));
}
