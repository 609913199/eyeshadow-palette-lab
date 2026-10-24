# pip install onnx numpy
# Google model license: MEDIAPIPE_LICENSE.txt (Apache-2.0).
import sys
import onnx,numpy as np
from onnx import numpy_helper,helper,TensorProto
m=onnx.load(sys.argv[1])
weights={node.input[1] for node in m.graph.node if node.op_type=='Conv'}
new=[]
for t in list(m.graph.initializer):
 if t.name not in weights: continue
 a=numpy_helper.to_array(t);axes=tuple(range(1,a.ndim));scale=np.maximum(np.max(np.abs(a),axis=axes)/127,1e-9).astype('float32');q=np.clip(np.round(a/scale.reshape((-1,)+(1,)*(a.ndim-1))),-127,127).astype('int8')
 m.graph.initializer.remove(t)
 m.graph.initializer.extend([numpy_helper.from_array(q,t.name+'_q8'),numpy_helper.from_array(scale,t.name+'_scale'),numpy_helper.from_array(np.zeros(scale.shape,dtype='int8'),t.name+'_zero')])
 new.append(helper.make_node('DequantizeLinear',[t.name+'_q8',t.name+'_scale',t.name+'_zero'],[t.name],axis=0))
original=list(m.graph.node);del m.graph.node[:];m.graph.node.extend(new+original)
onnx.checker.check_model(m);onnx.save(m,sys.argv[2])
