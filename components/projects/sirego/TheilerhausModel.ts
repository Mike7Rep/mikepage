import * as THREE from "three"

type Point = [number, number, number]
// Illustrative reconstruction from exterior photographs and the supplied section/plan.
// Proportions are architectural approximations, not an as-built BIM survey.
export function createTheilerhausModel() {
  const model = new THREE.Group()
  model.name = "Theilerhaus Zug – historic brick building"
  const materials = {
    wall: new THREE.MeshStandardMaterial({color: 0xc0b89d, roughness: 0.94}),
    brick: new THREE.MeshStandardMaterial({color: 0xd5c29c, roughness: 0.88}),
    brickLight: new THREE.MeshStandardMaterial({color: 0xe1d0ae, roughness: 0.89}),
    terracotta: new THREE.MeshStandardMaterial({color: 0xa56d50, roughness: 0.9}),
    stone: new THREE.MeshStandardMaterial({color: 0xd4d6d0, roughness: 0.9}),
    frame: new THREE.MeshStandardMaterial({color: 0x353a3b, roughness: 0.65}),
    glass: new THREE.MeshStandardMaterial({color: 0x91a4af, roughness: 0.3, metalness: 0.35}),
    roof: new THREE.MeshStandardMaterial({color: 0x727d83, roughness: 0.75, metalness: 0.15, side: THREE.DoubleSide}),
    trim: new THREE.MeshStandardMaterial({color: 0x9aa3a6, roughness: 0.6, metalness: 0.4}),
  }
  type Material = keyof typeof materials
  const parts = Object.fromEntries(Object.keys(materials).map(key => [key, [] as THREE.Matrix4[]])) as Record<Material, THREE.Matrix4[]>
  const surfaces = Object.fromEntries(Object.keys(materials).map(key => [key, [] as number[]])) as Record<Material, number[]>
  const transform = new THREE.Object3D()
  function box(material: Material, x: number, y: number, z: number, w: number, h: number, d: number) {
    transform.position.set(x,y,z); transform.scale.set(w,h,d); transform.rotation.set(0,0,0); transform.updateMatrix()
    parts[material].push(transform.matrix.clone())
  }
  function beam(material: Material, a: Point, b: Point, thickness: number) {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from)
    transform.position.copy(from).add(to).multiplyScalar(0.5); transform.scale.set(thickness,delta.length(),thickness)
    transform.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()); transform.updateMatrix()
    parts[material].push(transform.matrix.clone())
  }
  function surface(material: Material, points: Point[]) {
    for (let i=1;i<points.length-1;i++) surfaces[material].push(...points[0],...points[i],...points[i+1])
  }
  // Three-storey central hall and slightly projecting four-storey end pavilions.
  box("stone",0,0.38,0,20,0.76,6.6)
  box("wall",0,4.58,0,12,7.66,6.4)
  for (const x of [-8,8]) {
    box("stone",x,0.38,0,4,0.76,7)
    box("wall",x,5.08,0,4,8.66,7)
  }
  function facade(cx: number, cz: number, angle: number, length: number, height: number, wing: boolean, end = false) {
    const frame = new THREE.Matrix4().makeRotationY(angle); frame.setPosition(cx,0,cz)
    function part(material: Material, u: number, y: number, depth: number, w: number, h: number, d: number, tilt=0) {
      transform.position.set(u,y,depth); transform.scale.set(w,h,d); transform.rotation.set(0,0,tilt); transform.updateMatrix()
      parts[material].push(new THREE.Matrix4().multiplyMatrices(frame, transform.matrix))
    }
    // Alternating stretcher courses are geometry, so no supplied image is used as a texture.
    const pitch = 0.235, rowHeight = 0.096
    for(let row=0;row<Math.floor((height-0.78)/rowHeight);row++) {
      const y=0.80+row*rowHeight
      for(let col=0;col<Math.ceil(length/pitch);col++) {
        const u=-length/2+pitch/2+col*pitch+(row%2)*pitch/2
        if(u+pitch/2>length/2) continue
        part((row+col*3)%7===0?"brickLight":"brick",u,y,0.016,pitch-0.012,rowHeight-0.013,0.035)
      }
    }
    for(const y of [0.81,3.01,5.35,7.57]) part("terracotta",0,y,0.046,length,0.058,0.065)
    function window(u: number,y: number,w: number,h: number,arched=false) {
      part("frame",u,y,0.079,w+0.10,h+0.10,0.11)
      part("glass",u,y,0.146,w-0.075,h-0.095,0.035)
      part("frame",u,y,0.17,0.035,h,0.035)
      part("frame",u,y+0.18,0.173,w,0.032,0.03)
      part("stone",u,y-h/2-0.055,0.18,w+0.23,0.075,0.27)
      if(!arched) {
        part("frame",u,y+h/2-0.075,0.18,w+0.03,0.16,0.05)
        // Shallow segmental red-brick lintel, with radial joints.
        const radius=w*1.12, halfAngle=Math.asin((w/2+0.07)/radius)
        for(let i=0;i<11;i++) {
          const theta=-halfAngle+(i+0.5)*halfAngle*2/11
          part("terracotta",u+Math.sin(theta)*radius,y+h/2+Math.cos(theta)*radius-radius+0.14,0.13,0.09,0.20,0.105,-theta)
        }
      }
    }
    for(let floor=0;floor<3;floor++) {
      const count=end?3:wing?2:floor===1?5:10
      for(let i=0;i<count;i++) {
        const u=-length/2+(i+0.5)*length/count
        window(u,1.86+floor*2.22,wing||end?0.70:floor===1?0.73:0.67,1.31)
      }
    }
    if(wing) {
      part("stone",0,9.20,0.075,length,0.27,0.11)
      const count=end?3:2
      for(let i=0;i<count;i++) window(-length/2+(i+0.5)*length/count,8.35,0.76,1.36)
    } else {
      // Three semi-circular attic windows on each long elevation.
      for(const u of [-3.7,0,3.7]) {
        const radius=0.47, base=7.71
        const points: Point[]=[[u,base,0.13]]
        for(let i=0;i<=24;i++) points.push([u+Math.cos(i*Math.PI/24)*radius,base+Math.sin(i*Math.PI/24)*radius,0.13])
        const mapped=points.map(p=>new THREE.Vector3(...p).applyMatrix4(frame).toArray() as Point)
        surface("glass",mapped)
        for(let i=0;i<17;i++) {
          const theta=(i+0.5)*Math.PI/17
          part("terracotta",u+Math.cos(theta)*(radius+0.09),base+Math.sin(theta)*(radius+0.09),0.14,0.10,0.20,0.12,theta-Math.PI/2)
        }
        part("frame",u,base+0.23,0.17,0.035,0.45,0.035)
        part("frame",u,base+0.17,0.17,0.87,0.027,0.03)
        part("stone",u,base-0.04,0.18,1.16,0.085,0.23)
      }
    }
    // Slim downpipes at the pavilion corners, cellar openings below the brickwork.
    for(const u of [-length/2+0.11,length/2-0.11]) part("trim",u,height/2,0.13,0.048,height-0.15,0.06)
    if(wing) for(const u of [-length/4,length/4]) {
      part("frame",u,0.39,0.06,0.37,0.47,0.05)
      for(const dx of [-0.1,0,0.1]) part("trim",u+dx,0.39,0.1,0.015,0.45,0.02)
    }
  }
  for(const side of [-1,1]) {
    facade(0,side*3.2,side>0?0:Math.PI,12,8.4,false)
    for(const x of [-8,8]) facade(x,side*3.5,side>0?0:Math.PI,4,9.4,true)
    facade(side*10,0,side*Math.PI/2,7,9.4,true,true)
  }
  function hippedRoof(cx:number,halfX:number,halfZ:number,eave:number,rise:number) {
    const a:Point=[cx-halfX,eave,-halfZ],b:Point=[cx+halfX,eave,-halfZ],c:Point=[cx+halfX,eave,halfZ],d:Point=[cx-halfX,eave,halfZ]
    const ridgeHalf=Math.max(0.2,halfZ-halfX*0.7)
    const p:Point=[cx,eave+rise,-ridgeHalf],q:Point=[cx,eave+rise,ridgeHalf]
    surface("roof",[a,b,p]);surface("roof",[b,c,q,p]);surface("roof",[c,d,q]);surface("roof",[d,a,p,q])
    for(const [start,finish] of [[a,b],[b,c],[c,d],[d,a],[p,q],[a,p],[b,p],[c,q],[d,q]] as [Point,Point][]) beam("trim",start,finish,0.045)
    // Horizontal slate courses follow each of the four roof planes.
    for(let i=1;i<12;i++) {
      const t=i/12, y=eave+rise*t+0.012
      const corners=[a,b,c,d].map((v,index)=>new THREE.Vector3(...v).lerp(new THREE.Vector3(...(index<2?p:q)),t))
      for(let j=0;j<4;j++) {
        const k=(j+1)%4;beam("trim",[corners[j].x,y,corners[j].z],[corners[k].x,y,corners[k].z],0.012)
      }
    }
  }
  // Lower central pitched roof, with the raised pavilions capping both ends.
  surface("roof",[[-6,8.48,3.6],[6,8.48,3.6],[6,9.38,0],[-6,9.38,0]])
  surface("roof",[[-6,9.38,0],[6,9.38,0],[6,8.48,-3.6],[-6,8.48,-3.6]])
  for(const side of [-1,1]) {
    box("frame",0,8.38,side*3.43,12.1,0.16,0.41)
    for(let i=0;i<=12;i++) beam("trim",[-6,8.48+i*0.075,side*(3.6-i*0.3)],[6,8.48+i*0.075,side*(3.6-i*0.3)],0.015)
  }
  for(const x of [-8,8]) {
    box("frame",x,9.42,0,4.5,0.18,7.5)
    hippedRoof(x,2.28,3.79,9.53,1.16)
    // Shallow projecting eaves at the old roof line.
    box("roof",x,7.48,0,4.5,0.11,7.5)
    box("wall",x,10.40,-1.3,0.46,1.08,0.47)
    box("trim",x,10.96,-1.3,0.61,0.075,0.62)
    for(const z of [-3.49,3.49]) for(let u=-1.9;u<2;u+=0.29) box("frame",x+u,9.28,z,0.075,0.12,0.41)
  }
  // North entrance canopy and external stair, plus the modest rear kitchen extension.
  box("frame",-10.07,1.63,0,0.13,1.78,0.92)
  box("glass",-10.15,1.65,0,0.03,1.57,0.74)
  surface("glass",[[-10.0,2.95,-1.18],[-11.24,2.81,-1.18],[-11.24,2.81,1.18],[-10.0,2.95,1.18]])
  for(const z of [-1.18,1.18]) beam("frame",[-10,2.95,z],[-11.24,2.81,z],0.05)
  box("stone",-10.8,0.65,0,1.6,0.19,2.5)
  for(let i=0;i<6;i++) box("stone",-10.8,0.59-i*0.10,1.42+i*0.22,1.6,0.12,0.28)
  for(let i=0;i<9;i++) box("trim",-11.59,1.03,-1.1+i*0.29,0.025,0.69,0.025)
  beam("trim",[-11.59,1.39,-1.24],[-11.59,1.39,1.27],0.035)
  box("stone",2.7,1.31,-5.18,4.6,2.6,3.7)
  box("roof",2.7,2.67,-5.18,4.77,0.13,3.86)
  box("frame",2.0,1.38,-7.045,0.67,1.0,0.06)
  box("glass",2.0,1.38,-7.085,0.56,0.89,0.025)

  for(const material of Object.keys(materials) as Material[]) {
    if(surfaces[material].length) {
      const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(surfaces[material],3));geometry.computeVertexNormals()
      const mesh=new THREE.Mesh(geometry,materials[material]);mesh.castShadow=true;mesh.receiveShadow=true;model.add(mesh)
    }
    if(!parts[material].length) continue
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),materials[material],parts[material].length)
    parts[material].forEach((matrix,index)=>mesh.setMatrixAt(index,matrix))
    mesh.name=material;mesh.castShadow=material!=="brick"&&material!=="brickLight";mesh.receiveShadow=true;mesh.computeBoundingSphere();model.add(mesh)
  }
  return model
}

export function frameTheilerhausCamera(camera:THREE.OrthographicCamera,width:number,height:number) {
  const aspect=Math.max(1,width)/Math.max(1,height),span=Math.max(22,29/aspect)
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2
  camera.position.set(-23,16,29);camera.lookAt(0,4.7,-0.6)
  camera.updateProjectionMatrix();camera.updateMatrixWorld()
}
