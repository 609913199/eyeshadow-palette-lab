const SIZE=1024;
export function validateLidArt(state){
 if(!state)return{strokes:[]};if(!Array.isArray(state.strokes)||state.strokes.length>3000)throw Error('盖背绘画数据无效');let total=0;
 const strokes=state.strokes.map(s=>{if(!['silver','pixel','erase'].includes(s.style)||!Number.isFinite(s.size)||s.size<1||s.size>120||!Array.isArray(s.points)||s.points.length>30000)throw Error('盖背笔触无效');total+=s.points.length;if(total>250000)throw Error('盖背笔触过多');return{style:s.style,size:s.size,points:s.points.map(p=>{if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>SIZE||p.y<0||p.y>SIZE)throw Error('盖背坐标无效');return{x:p.x,y:p.y};})};});return{strokes};
}
export function createLidArt({editor,preview,onChange=()=>{}}){
 const make=()=>{const c=document.createElement('canvas');c.width=c.height=SIZE;return c;};const silver=make(),pixel=make(),composite=make(),foil=make();let strokes=[],redo=[],current=null,style='silver',brushSize=12,activePointer=null,framePending=false;
 editor.width=editor.height=SIZE;
 function render(){for(const c of[silver,pixel])c.getContext('2d').clearRect(0,0,SIZE,SIZE);
  for(const s of [...strokes,...(current?[current]:[])]){
   for(const [kind,layer] of[['silver',silver],['pixel',pixel]]){if(s.style!=='erase'&&s.style!==kind)continue;const c=layer.getContext('2d');c.save();c.globalCompositeOperation=s.style==='erase'?'destination-out':'source-over';c.fillStyle=c.strokeStyle='#ffffff';c.lineWidth=s.size;c.lineCap=c.lineJoin='round';
    if(kind==='pixel'&&s.style!=='erase'){const unit=8,side=Math.max(unit,Math.round(s.size/unit)*unit);for(let i=0;i<s.points.length;i++){const a=s.points[Math.max(0,i-1)],b=s.points[i],steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/(unit*.45)));for(let j=0;j<=steps;j++){const x=Math.floor((a.x+(b.x-a.x)*j/steps)/unit)*unit,y=Math.floor((a.y+(b.y-a.y)*j/steps)/unit)*unit;c.fillRect(x-Math.floor(side/unit/2)*unit,y-Math.floor(side/unit/2)*unit,side,side);}}}
    else if(s.points.length){c.beginPath();c.moveTo(s.points[0].x,s.points[0].y);for(const p of s.points)c.lineTo(p.x,p.y);c.stroke();if(s.points.length===1){c.beginPath();c.arc(s.points[0].x,s.points[0].y,s.size/2,0,Math.PI*2);c.fill();}}c.restore();}
  }
  const c=composite.getContext('2d');c.clearRect(0,0,SIZE,SIZE);const f=foil.getContext('2d');f.globalCompositeOperation='source-over';f.clearRect(0,0,SIZE,SIZE);f.drawImage(silver,0,0);f.globalCompositeOperation='source-in';let g=f.createLinearGradient(50,0,950,1024);for(const [t,color]of[[0,'#707780'],[.18,'#ffffff'],[.27,'#939ca8'],[.44,'#e7eef6'],[.51,'#ffffff'],[.57,'#77808d'],[.76,'#f9fcff'],[1,'#a3acb7']])g.addColorStop(t,color);f.fillStyle=g;f.fillRect(0,0,SIZE,SIZE);c.save();c.shadowColor='#000b';c.shadowBlur=2;c.shadowOffsetY=3;c.drawImage(foil,0,0);c.restore();c.drawImage(pixel,0,0);
  const e=editor.getContext('2d');e.clearRect(0,0,SIZE,SIZE);e.drawImage(composite,0,0);if(preview){const p=preview.getContext('2d');p.clearRect(0,0,preview.width,preview.height);p.drawImage(composite,0,0,preview.width,preview.height);}
 }
 function commit(){render();onChange();}
 function schedule(){if(framePending)return;framePending=true;requestAnimationFrame(()=>{framePending=false;render();});}
 function point(e){const b=editor.getBoundingClientRect();return{x:Math.max(0,Math.min(SIZE,(e.clientX-b.left)/b.width*SIZE)),y:Math.max(0,Math.min(SIZE,(e.clientY-b.top)/b.height*SIZE))};}
 editor.onpointerdown=e=>{if(activePointer!==null||strokes.length>=3000)return;e.preventDefault();activePointer=e.pointerId;editor.setPointerCapture(e.pointerId);current={style,size:brushSize,points:[point(e)]};render();};
 editor.onpointermove=e=>{if(e.pointerId!==activePointer||!current)return;const p=point(e),last=current.points.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)>2&&current.points.length<30000){current.points.push(p);schedule();}};
 function end(e){if(e.pointerId!==activePointer)return;activePointer=null;if(current){strokes.push(current);current=null;redo=[];commit();}}
 editor.onpointerup=end;editor.onpointercancel=end;
 return{silver,pixel,composite,render,hasArt:()=>{for(const layer of[silver,pixel]){const data=layer.getContext('2d').getImageData(0,0,SIZE,SIZE).data;for(let i=3;i<data.length;i+=4)if(data[i])return true;}return false;},setBrush:(s,size)=>{style=s;brushSize=size;},getState:()=>({strokes:structuredClone(strokes)}),setState:s=>{strokes=validateLidArt(s).strokes;redo=[];current=null;commit();},undo:()=>{if(strokes.length){redo.push(strokes.pop());commit();}},redo:()=>{if(redo.length){strokes.push(redo.pop());commit();}},clear:()=>{if(strokes.length){strokes.push({style:'erase',size:120,points:Array.from({length:22},(_,i)=>({x:i%2?1024:0,y:Math.floor(i/2)*102.4}))});redo=[];commit();}},
  stamp:kind=>{const points=[];if(kind==='heart'){for(let i=0;i<=120;i++){const t=i/120*Math.PI*2;points.push({x:512+Math.pow(Math.sin(t),3)*190,y:480-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*13});}}else if(kind==='frame'){for(const [x,y]of[[112,160],[160,112],[864,112],[912,160],[912,864],[864,912],[160,912],[112,864],[112,160]])points.push({x,y});}else{for(let i=0;i<=8;i++){const t=i/8*Math.PI*2-Math.PI/2,r=i%2?48:180;points.push({x:512+Math.cos(t)*r,y:512+Math.sin(t)*r});}}strokes.push({style,size:brushSize,points});redo=[];commit();}};
}
