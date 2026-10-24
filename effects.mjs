// Line-screen printing: luminance controls the width of curved diagonal ink strokes.
export function waveScreen(imageData,{background,ink,intensity=75,detail=6}){
 const {data:p,width:w,height:h}=imageData,hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),paper=hex(background),paint=hex(ink),amount=intensity/100,period=(2.8+detail*.34)*w/512,contrast=.65+amount*1.8,aa=Math.min(.32,.6/period);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;if(!p[i+3])continue;
  const luminance=(p[i]*.299+p[i+1]*.587+p[i+2]*.114)/255,tone=Math.max(0,Math.min(1,(luminance-.5)*contrast+.5)),shadow=1-tone,along=(x-y)*Math.SQRT1_2,bend=.72*Math.sin(along/(period*9)*Math.PI*2),phase=(x+y)*Math.SQRT1_2/period+bend,distance=Math.abs((phase-Math.floor(phase))-.5)*2,coverage=shadow<.015?0:shadow>.985?1:.015+shadow*.97;
  let edge=coverage===0?0:coverage===1?1:Math.max(0,Math.min(1,(coverage-distance)/aa+.5));edge=edge*edge*(3-2*edge);
  for(let c=0;c<3;c++)p[i+c]=Math.round(paper[c]*(1-edge)+paint[c]*edge);
 }
 return imageData;
}
