import {loadBytes} from './head-loader.mjs?v=6';
// Google MediaPipe multiclass selfie segmentation, bundled locally and run on CPU.
// Labels: 0 background, 1 hair, 2 body skin, 3 face skin, 4 clothes, 5 accessories.
let taskPromise;
const makeCanvas=(w,h=w)=>{if(typeof document==='undefined')return new OffscreenCanvas(w,h);const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
async function task(onStatus,signal){
 if(!taskPromise){taskPromise=(async()=>{
  onStatus('准备本地 AI，首次加载可随时取消；照片不会上传。');
  const ort=await import('./ort.wasm.min.mjs');ort.env.wasm.numThreads=1;ort.env.wasm.initTimeout=20000;ort.env.wasm.wasmPaths=new URL('.',import.meta.url).href;
  const wasm=await loadBytes(new URL('./ort-wasm-simd-threaded.wasm',import.meta.url),{label:'加载 AI 运行文件',onStatus,signal,totalHint:11210254});
  ort.env.wasm.wasmBinary=wasm;
  const model=await loadBytes(new URL('./head-segmentation-q8.onnx',import.meta.url),{label:'加载轻量大头模型',onStatus,signal,totalHint:4418696});
  onStatus('文件已加载，正在初始化本地 AI…');
  const session=await ort.InferenceSession.create(model,{executionProviders:['wasm']});return{ort,session};
 })().catch(e=>{taskPromise=null;throw e;});}
 return taskPromise;
}
async function segmentation({ort,session},input){
 const c=makeCanvas(256),ctx=c.getContext('2d');ctx.drawImage(input,0,0,256,256);const rgba=ctx.getImageData(0,0,256,256).data,data=new Float32Array(256*256*3);for(let i=0;i<256*256;i++)for(let j=0;j<3;j++)data[i*3+j]=rgba[i*4+j]/255;
 const tensor=new ort.Tensor('float32',data,[1,256,256,3]),result=await session.run({[session.inputNames[0]]:tensor}),out=result[session.outputNames[0]],logits=out.data,cat=new Uint8Array(256*256),probability=new Float32Array(cat.length);
 for(let i=0;i<cat.length;i++){let max=-Infinity,label=0;for(let j=0;j<6;j++)if(logits[i*6+j]>max){max=logits[i*6+j];label=j;}cat[i]=label;let sum=0;for(let j=0;j<6;j++)sum+=Math.exp(logits[i*6+j]-max);probability[i]=(Math.exp(logits[i*6+1]-max)+Math.exp(logits[i*6+3]-max)+(label===2?Math.exp(logits[i*6+2]-max):0))/sum;}
 tensor.dispose();for(const value of Object.values(result))value.dispose();return{cat,w:256,h:256,probability};
}
function mainHead({cat,w,h}){
 const total=w*h,raw=new Uint8Array(total),visited=new Uint8Array(total),queue=new Int32Array(total);for(let i=0;i<total;i++)raw[i]=cat[i]===1||cat[i]===3?1:0;
 // Close one-pixel cracks between hair and forehead, then select the component
 // with the most face pixels. Hands, torso and unrelated background people are excluded.
 const dilated=new Uint8Array(total),closed=new Uint8Array(total);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let k=y*w+x;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(raw[k+dy*w+dx])dilated[k]=1;}
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let k=y*w+x,on=1;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!dilated[k+dy*w+dx])on=0;closed[k]=on;}
 let best=[],bestScore=-1,faceCount=0;
 for(let start=0;start<total;start++){if(!closed[start]||visited[start])continue;let head=0,tail=0,faces=0;queue[tail++]=start;visited[start]=1;while(head<tail){let k=queue[head++],x=k%w,y=Math.floor(k/w);if(cat[k]===3)faces++;for(const j of[x>0?k-1:-1,x<w-1?k+1:-1,y>0?k-w:-1,y<h-1?k+w:-1])if(j>=0&&closed[j]&&!visited[j]){visited[j]=1;queue[tail++]=j;}}let score=faces*20+tail;if(faces>0&&score>bestScore){bestScore=score;faceCount=faces;best=Array.from(queue.subarray(0,tail));}}
 if(faceCount<Math.max(8,total*.00008))throw new Error('没有识别到清晰人脸，请换一张正面照片，或用“圈选大头”手动保留轮廓。');
 const selected=new Uint8Array(total);let fx0=w,fy0=h,fx1=0,fy1=0;
 for(const k of best){selected[k]=1;if(cat[k]===3){const x=k%w,y=Math.floor(k/w);fx0=Math.min(fx0,x);fx1=Math.max(fx1,x);fy0=Math.min(fy0,y);fy1=Math.max(fy1,y);}}
 // Keep ear skin next to the face, stopping at the chin so the neck stays out.
 const earMargin=(fx1-fx0)*.12;for(let y=fy0;y<=fy0+(fy1-fy0)*.72;y++)for(let x=Math.max(0,Math.floor(fx0-earMargin));x<=Math.min(w-1,Math.ceil(fx1+earMargin));x++)if(cat[y*w+x]===2&&(x<fx0+(fx1-fx0)*.16||x>fx1-(fx1-fx0)*.16))selected[y*w+x]=1;
 // Fill enclosed facial details (eyes, lips, glasses), without filling the exterior.
 const outside=new Uint8Array(total);let head=0,tail=0;const add=k=>{if(!selected[k]&&!outside[k]){outside[k]=1;queue[tail++]=k;}};for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}while(head<tail){let k=queue[head++],x=k%w,y=Math.floor(k/w);if(x>0)add(k-1);if(x<w-1)add(k+1);if(y>0)add(k-w);if(y<h-1)add(k+w);}for(let i=0;i<total;i++)if(!outside[i])selected[i]=1;
 let x0=w,y0=h,x1=0,y1=0;for(let i=0;i<total;i++)if(selected[i]){let x=i%w,y=Math.floor(i/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return{selected,raw,x0,y0,x1,y1,w,h};
}
export async function extractHead(image,{onStatus=()=>{},signal}={}){
 const segmenter=await task(onStatus,signal);onStatus('识别人脸与头发，移除背景、手和衣服…');await new Promise(r=>setTimeout(r,0));
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height,ratio=Math.min(1,768/Math.max(iw,ih)),initial=makeCanvas(Math.round(iw*ratio),Math.round(ih*ratio));initial.getContext('2d').drawImage(image,0,0,initial.width,initial.height);
 const coarse=mainHead(await segmentation(segmenter,initial)),bw=(coarse.x1-coarse.x0+1)/coarse.w*iw,bh=(coarse.y1-coarse.y0+1)/coarse.h*ih,sx=Math.max(0,coarse.x0/coarse.w*iw-bw*.17),sy=Math.max(0,coarse.y0/coarse.h*ih-bh*.15),sw=Math.min(iw-sx,bw*1.34),sh=Math.min(ih-sy,bh*1.3);
 const scale=512/Math.max(sw,sh),input=makeCanvas(Math.max(1,Math.round(sw*scale)),Math.max(1,Math.round(sh*scale)));input.getContext('2d').drawImage(image,sx,sy,sw,sh,0,0,input.width,input.height);onStatus('细化头发边缘，生成透明大头…');await new Promise(r=>setTimeout(r,0));
 const precise=await segmentation(segmenter,input),head=mainHead(precise),alpha=makeCanvas(precise.w,precise.h),ac=alpha.getContext('2d'),pixels=ac.createImageData(alpha.width,alpha.height);
 for(let i=0;i<head.selected.length;i++){let a=0;if(head.selected[i]){let probability=precise.probability?precise.probability[i]:1;if(!head.raw[i])probability=Math.max(probability,.9);a=Math.max(0,Math.min(1,(probability-.10)/.75));}pixels.data[i*4]=255;pixels.data[i*4+1]=255;pixels.data[i*4+2]=255;pixels.data[i*4+3]=Math.round(a*255);}ac.putImageData(pixels,0,0);
 const base=makeCanvas(512),mask=makeCanvas(512),dx=(512-input.width)/2,dy=(512-input.height)/2;base.getContext('2d').drawImage(input,dx,dy);let ctx=mask.getContext('2d');ctx.drawImage(input,dx,dy);ctx.globalCompositeOperation='destination-in';ctx.drawImage(alpha,dx,dy,input.width,input.height);ctx.globalCompositeOperation='source-over';return{base,mask};
}
