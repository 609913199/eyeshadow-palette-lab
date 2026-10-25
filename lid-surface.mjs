// UVs face the viewer looking at the outside of the opened lid.
export function lidSurfaceGeometry(THREE,shape,width){const geometry=new THREE.ShapeGeometry(shape),positions=geometry.attributes.position,uv=geometry.attributes.uv;for(let i=0;i<positions.count;i++)uv.setXY(i,Math.max(0,Math.min(1,.5-positions.getX(i)/width)),Math.max(0,Math.min(1,.5-positions.getY(i)/width)));uv.needsUpdate=true;return geometry;}
export function lidRadians(degrees){return-Math.max(0,Math.min(180,Number(degrees)||0))*Math.PI/180;}
