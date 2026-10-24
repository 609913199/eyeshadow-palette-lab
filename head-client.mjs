// Keep image processing off the UI thread and let the user cancel a stalled run.
export async function runHead(image,{onStatus=()=>{},signal}={}){
 if(typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined'||typeof createImageBitmap==='undefined'){
  const {extractHead}=await import('./portrait.mjs?v=6');return extractHead(image,{onStatus,signal});
 }
 const bitmap=await createImageBitmap(image);if(signal?.aborted){bitmap.close();throw new DOMException('已取消','AbortError');}
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./portrait-worker.mjs?v=6',import.meta.url),{type:'module'});let settled=false;
  const finish=(err,result)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);worker.terminate();err?reject(err):resolve(result);};
  const cancel=()=>finish(new DOMException('已取消','AbortError')),timer=setTimeout(()=>finish(new Error('处理超过 120 秒，已停止。请重试，或用“圈选大头”保留轮廓。')),120000);
  signal?.addEventListener('abort',cancel,{once:true});worker.onerror=()=>finish(new Error('当前浏览器未能启动本地 AI。请重试，或使用圈选与画笔。'));
  worker.onmessage=({data})=>{if(data.status){onStatus(data.status);return;}if(data.error){finish(new Error(data.error));return;}const make=im=>{const c=document.createElement('canvas');c.width=c.height=512;c.getContext('2d').drawImage(im,0,0);im.close();return c;};finish(null,{base:make(data.base),mask:make(data.mask)});};
  worker.postMessage({image:bitmap},[bitmap]);
 });
}
