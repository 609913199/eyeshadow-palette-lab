import {getInstalledAI} from './head-assets-loader.mjs?v=7';
// Keep image processing off the UI thread and let the user cancel a stalled run.
export async function runHead(image,{onStatus=()=>{},signal}={}){
 if(typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined'){
  const {extractHead}=await import('./portrait.mjs?v=7');return extractHead(image,{onStatus,signal});
 }
 const bitmap=await createImageBitmap(image);if(signal?.aborted){bitmap.close();throw new DOMException('已取消','AbortError');}
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./portrait-worker.mjs?v=7',import.meta.url),{type:'module'});let settled=false,timer;
  const finish=(err,result)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);worker.terminate();err?reject(err):resolve(result);};
  const cancel=()=>finish(new DOMException('已取消','AbortError'));const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>finish(new Error('连接长时间无响应，已停止。请点击重试，会从已完成的分段继续。')),65000);};arm();
  signal?.addEventListener('abort',cancel,{once:true});worker.onerror=()=>finish(new Error('当前浏览器未能启动本地 AI。请重试，或使用圈选与画笔。'));
  worker.onmessage=({data})=>{if(data.status){arm();onStatus(data.status);return;}if(data.error){finish(new Error(data.error));return;}const make=im=>{const c=document.createElement('canvas');c.width=c.height=512;c.getContext('2d').drawImage(im,0,0);im.close();return c;};finish(null,{base:make(data.base),mask:make(data.mask)});};
  worker.postMessage({image:bitmap,offline:getInstalledAI()},[bitmap]);
 });
}
