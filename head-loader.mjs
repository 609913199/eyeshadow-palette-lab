// Stream large local assets with visible progress and a bounded stall timeout.
export async function loadBytes(url,{label,onStatus=()=>{},signal,totalHint=0}={}){
 for(let attempt=0;attempt<2;attempt++){
  const controller=new AbortController();let idle,deadline;const cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});
  const arm=()=>{clearTimeout(idle);idle=setTimeout(cancel,20000);};
  try{
   if(signal?.aborted)throw new DOMException('已取消','AbortError');arm();deadline=setTimeout(cancel,90000);onStatus(`${label}：连接中${attempt?'，正在重试':''}…`);
   const response=await fetch(url,{signal:controller.signal,cache:'force-cache'});if(!response.ok)throw new Error(`HTTP ${response.status}`);
   let bytes;if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];let received=0;const total=totalHint||Number(response.headers.get('content-length'));
    while(true){const {done,value}=await reader.read();if(done)break;arm();chunks.push(value);received+=value.length;onStatus(`${label}：${(received/1048576).toFixed(1)}${total?' / '+(total/1048576).toFixed(1):''} MB${total?' · '+Math.min(99,Math.round(received/total*100))+'%':''}`);}
    bytes=new Uint8Array(received);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   }else bytes=new Uint8Array(await response.arrayBuffer());
   if(totalHint&&bytes.length!==totalHint)throw new Error('文件下载不完整');return bytes;
  }catch(error){if(signal?.aborted)throw new DOMException('已取消','AbortError');if(attempt===1)throw new Error(`${label}加载失败或网络超时。请点击重试；也可以使用“圈选大头”。`);onStatus(`${label}连接中断，自动重试一次…`);}
  finally{clearTimeout(idle);clearTimeout(deadline);signal?.removeEventListener('abort',cancel);}
 }
}
