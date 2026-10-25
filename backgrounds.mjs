export function paintBackground(ctx,size,{pattern='solid',background='#2839ad',ink='#fff0dc',neutral=false}){
 const low=neutral?'#555555':background,high=neutral?'#bbbbbb':ink;ctx.fillStyle=pattern==='solid'?(neutral?'#888888':background):low;ctx.fillRect(0,0,size,size);
 if(pattern==='gradient'){const g=ctx.createLinearGradient(0,0,size,size);g.addColorStop(0,low);g.addColorStop(1,high);ctx.fillStyle=g;ctx.fillRect(0,0,size,size);}
 if(pattern==='radial'){const g=ctx.createRadialGradient(size*.4,size*.35,0,size*.5,size*.5,size*.7);g.addColorStop(0,high);g.addColorStop(1,low);ctx.fillStyle=g;ctx.fillRect(0,0,size,size);}
 if(pattern==='checker'){ctx.fillStyle=high;const step=size/8;for(let y=0;y<8;y++)for(let x=0;x<8;x++)if((x+y)%2)ctx.fillRect(x*step,y*step,step,step);}
}
