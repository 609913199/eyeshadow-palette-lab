// UVs face the viewer looking at the outside of the opened lid.
export function lidSurfaceGeometry(THREE,shape,width){const geometry=new THREE.ShapeGeometry(shape),positions=geometry.attributes.position,uv=geometry.attributes.uv;for(let i=0;i<positions.count;i++)uv.setXY(i,Math.max(0,Math.min(1,.5-positions.getX(i)/width)),Math.max(0,Math.min(1,.5-positions.getY(i)/width)));uv.needsUpdate=true;return geometry;}
export function lidRadians(degrees){return-Math.max(0,Math.min(180,Number(degrees)||0))*Math.PI/180;}

// Actual shallow relief: each vertex samples the same rounded height field as the editor.
export function lidReliefGeometry(THREE,heights,size=1024,width=3.24,rise=.013,segments=256){
 const geometry=new THREE.PlaneGeometry(width,width,segments,segments),positions=geometry.attributes.position,uv=geometry.attributes.uv;
 for(let i=0;i<positions.count;i++){const u=1-uv.getX(i),v=1-uv.getY(i),x=Math.max(0,Math.min(size-1,Math.round(u*(size-1)))),y=Math.max(0,Math.min(size-1,Math.round((1-v)*(size-1))));uv.setXY(i,u,v);positions.setZ(i,(heights?.[y*size+x]||0)*rise);}
 positions.needsUpdate=true;uv.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
