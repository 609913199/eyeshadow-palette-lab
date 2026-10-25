// A rounded shallow foil profile derived from the painted alpha mask.
// Pure pixel math, shared by the editor shading and actual 3D surface height.
export function foilRelief(mask,{bevel=3.5}={}){
 const {width:w,height:h,data:src}=mask,n=w*h,dist=new Float32Array(n),heights=new Float32Array(n),rgba=new Uint8ClampedArray(n*4),heightRGBA=new Uint8ClampedArray(n*4),root2=Math.SQRT2;
 let occupied=false;for(let i=0;i<n;i++){const inside=src[i*4+3]>100;dist[i]=inside?1e6:0;if(inside)occupied=true;}
 if(!occupied)return{width:w,height:h,rgba,heightRGBA,heights};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!dist[i])continue;let d=dist[i];if(x)d=Math.min(d,dist[i-1]+1);else d=1;if(y)d=Math.min(d,dist[i-w]+1);else d=1;if(x&&y)d=Math.min(d,dist[i-w-1]+root2);if(x<w-1&&y)d=Math.min(d,dist[i-w+1]+root2);dist[i]=d;}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(!dist[i])continue;let d=dist[i];if(x<w-1)d=Math.min(d,dist[i+1]+1);else d=1;if(y<h-1)d=Math.min(d,dist[i+w]+1);else d=1;if(x<w-1&&y<h-1)d=Math.min(d,dist[i+w+1]+root2);if(x&&y<h-1)d=Math.min(d,dist[i+w-1]+root2);dist[i]=d;}
 const radius=Math.max(.5,bevel*w/1024);for(let i=0;i<n;i++){if(!src[i*4+3])continue;const t=Math.min(1,dist[i]/radius);heights[i]=Math.sqrt(Math.max(0,1-(1-t)*(1-t)))*(src[i*4+3]/255);const value=Math.round(heights[i]*255),k=i*4;heightRGBA[k]=heightRGBA[k+1]=heightRGBA[k+2]=value;heightRGBA[k+3]=255;}
 const stops=[[0,110],[.17,238],[.29,130],[.43,204],[.51,249],[.61,119],[.79,225],[1,159]];
 const hx=-.266,hy=-.384,hz=.884;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,k=i*4;if(!src[k+3])continue;
  const dx=(heights[y*w+Math.min(w-1,x+1)]-heights[y*w+Math.max(0,x-1)])*.5,dy=(heights[Math.min(h-1,y+1)*w+x]-heights[Math.max(0,y-1)*w+x])*.5;
  let nx=-dx*4.5,ny=-dy*4.5,nz=1,length=Math.hypot(nx,ny,nz);nx/=length;ny/=length;nz/=length;
  const diffuse=Math.max(0,nx*-.44+ny*-.64+nz*.63),specular=Math.pow(Math.max(0,nx*hx+ny*hy+nz*hz),22),u=Math.max(0,Math.min(1,x/w*.43+y/h*.57));let band=190;for(let j=1;j<stops.length;j++)if(u<=stops[j][0]){const a=stops[j-1],b=stops[j],t=(u-a[0])/(b[0]-a[0]);band=a[1]+(b[1]-a[1])*t;break;}
  const value=Math.max(43,Math.min(255,band*(.43+diffuse*.67)+specular*158));rgba[k]=Math.round(value*.98);rgba[k+1]=Math.round(value*.995);rgba[k+2]=Math.round(Math.min(255,value*1.025));rgba[k+3]=src[k+3];
 }
 return{width:w,height:h,rgba,heightRGBA,heights};
}
