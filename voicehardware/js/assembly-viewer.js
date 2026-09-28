import * as T from 'three';
import {OrbitControls} from '../vendor/three/OrbitControls.js';
import {buildModel} from './hardware-models.js';
const clamp=T.MathUtils.clamp, smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
window.hardwareViewers=[];
class Viewer{
 async init(el){
  this.el=el;this.kind=el.dataset.device;this.stage=el.querySelector('.stage');this.range=el.querySelector('input');this.play=el.querySelector('.play');this.progress=1;this.playing=false;this.active=true;this.selected=null;
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x142127,1);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.85;
  this.stage.prepend(this.renderer.domElement);this.renderer.domElement.tabIndex=0;this.renderer.domElement.setAttribute('aria-label','Rotate '+this.kind+' model: drag or arrow keys; plus and minus to zoom');
  this.scene=new T.Scene();this.scene.add(new T.HemisphereLight(0xffffff,0x53616c,2.3));for(const [x,y,z,p]of [[-100,80,180,2.8],[160,-60,80,1.8],[-80,-60,-140,1.2]]){let l=new T.DirectionalLight(0xffffff,p);l.position.set(x,y,z);this.scene.add(l);}
  this.camera=new T.PerspectiveCamera(34,1,.1,2000);this.camera.up.set(0,1,0);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=false;this.controls.enablePan=false;this.controls.minDistance=20;this.controls.maxDistance=800;
  const m=await buildModel(this.kind);Object.assign(this,m);this.camera.near=this.size*.08;this.camera.far=this.size*40;this.camera.updateProjectionMatrix();this.scene.add(this.root);this.meshes=[];this.root.traverse(o=>{if(o.isMesh)this.meshes.push(o);});this.ray=new T.Raycaster();this.labels=[];
  this.svg=this.stage.querySelector('svg');const layer=this.stage.querySelector('.labels');
  for(const p of this.parts){const b=document.createElement('button');b.className='callout';b.textContent=p.label;b.dataset.part=p.id;b.hidden=true;b.onclick=()=>this.select(p.id);layer.append(b);const line=document.createElementNS('http://www.w3.org/2000/svg','line');this.svg.append(line);const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r','3');this.svg.append(dot);this.labels.push({p,b,line,dot});const button=document.createElement('button');button.textContent=p.label;button.dataset.part=p.id;button.onclick=()=>this.select(p.id);el.querySelector('.parts').append(button);}
  this.range.addEventListener('input',()=>{this.playing=false;this.progress=Number(this.range.value)/100;this.update();});
  this.play.onclick=()=>{if(this.progress>=1)this.progress=0;this.playing=!this.playing;this.update();};
  el.querySelector('.reset').onclick=()=>{this.playing=false;this.progress=1;this.selected=null;this.home();this.select(null);this.update();};
  el.querySelector('.explode').onclick=()=>{this.playing=false;this.progress=0;this.update();};
  this.renderer.domElement.addEventListener('keydown',e=>{const step=.12;let v=this.camera.position.clone().sub(this.controls.target);if(e.key==='ArrowLeft'||e.key==='ArrowRight')v.applyAxisAngle(new T.Vector3(0,1,0),e.key==='ArrowLeft'?step:-step);else if(e.key==='ArrowUp'||e.key==='ArrowDown')v.applyAxisAngle(new T.Vector3(1,0,0),e.key==='ArrowUp'?step:-step);else if(e.key==='+'||e.key==='=')v.multiplyScalar(.9);else if(e.key==='-')v.multiplyScalar(1.1);else return;e.preventDefault();this.camera.position.copy(this.controls.target).add(v);this.controls.update();});
  let down;this.renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);this.renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);let hit=this.ray.intersectObjects(this.meshes,false)[0];if(hit)this.select(hit.object.userData.part);});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.stage);new IntersectionObserver(es=>{this.active=es[0].isIntersecting;},{rootMargin:'100px'}).observe(this.stage);
  this.home();this.resize();this.update();this.stage.querySelector('.loading').remove();el.dataset.ready='true';this.last=performance.now();this.tick(this.last);
 }
 home(){this.controls.target.set(0,0,0);this.camera.position.set(this.size*.95,-this.size*1.1,this.size*2.6);this.fit();}
 fit(){if(!this.root)return;const box=new T.Box3().setFromObject(this.root),sphere=box.getBoundingSphere(new T.Sphere());const dir=this.camera.position.clone().sub(this.controls.target).normalize();const half=Math.atan(Math.tan(T.MathUtils.degToRad(this.camera.fov/2))*Math.min(1,this.camera.aspect));const distance=sphere.radius/Math.sin(half)*1.16;this.controls.target.copy(sphere.center);this.camera.position.copy(sphere.center).addScaledVector(dir,distance);this.controls.maxDistance=distance*3;this.controls.minDistance=distance*.45;this.controls.update();}
 resize(){const w=this.stage.clientWidth,h=this.stage.clientHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);this.fit();}
 update(){
  // Every transform is an absolute pure function of the scrub value. No integrated deltas.
  const t=this.progress;
  for(const p of this.parts){let end=p.id==='board'?.5:p.id==='audio'?.55:p.id==='display'?.78:1;let f=1-smooth(t/end);p.group.position.copy(p.base).addScaledVector(p.offset,f);p.group.quaternion.copy(p.quaternion);if(this.kind==='397'&&p.id==='board'){const angle=Math.PI*(1-smooth(t/.45));p.group.rotateX(angle);p.group.rotateZ(angle);}}
  this.root.updateMatrixWorld(true);this.fit();this.range.value=String(Math.round(t*100));this.play.textContent=this.playing?'Pause':'Play assembly';this.play.setAttribute('aria-pressed',String(this.playing));this.el.querySelector('.stage-name').textContent=t===1?'Assembled':t<.2?'Exploded':t<.5?'Seat the electronics':t<.78?'Seat the display':'Close the enclosure';this.el.querySelector('output').value=Math.round(t*100)+'%';
 }
 select(id){this.selected=id;const p=this.parts.find(p=>p.id===id);this.el.querySelector('.selection').textContent=p?p.description:'Select a visible part or a component name to inspect. Hidden parts stay hidden; explode the model to reveal them.';for(const o of this.meshes){if(o.material.emissive)o.material.emissive.setHex(o.userData.part===id?0x613015:0);else if(o.material.isMeshBasicMaterial)o.material.color.setHex(o.userData.part===id?0xffb985:0xffffff);}this.el.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.part===id)));}
 projectLabels(){
  const w=this.stage.clientWidth,h=this.stage.clientHeight,used=[];this.visibleLabels=[];
  this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld();
  for(const {p,b,line,dot}of this.labels){b.hidden=true;line.style.display=dot.style.display='none';
   if((p.id==='board'&&this.progress>.8)||(p.id==='audio'&&this.progress>.75))continue;
   // Shoot toward several actual mesh surface candidates. Show only the nearest visible hit
   // belonging to this part. Never label through a shell or point to empty screen coordinates.
   const box=new T.Box3().setFromObject(p.anchor);const center=box.getCenter(new T.Vector3());const s=box.getSize(new T.Vector3());let hit=null;
   for(const [dx,dy]of [[0,0],[-.35,-.35],[.35,.35],[-.35,.35],[.35,-.35]]){const target=center.clone().add(new T.Vector3(s.x*dx,s.y*dy,0));this.ray.set(this.camera.position,target.sub(this.camera.position).normalize());const first=this.ray.intersectObjects(this.meshes,false)[0];if(first&&first.object.userData.part===p.id){hit=first;break;}}
   if(!hit)continue;const v=hit.point.clone().project(this.camera);if(v.z<-1||v.z>1)continue;const x=(v.x+1)*w/2,y=(1-v.y)*h/2;if(x<8||x>w-8||y<36||y>h-20)continue;
   b.hidden=false;const bw=b.offsetWidth,bh=b.offsetHeight;let placed;
   for(const [dx,dy]of [[22,-bh-14],[-bw-22,14],[22,18],[-bw-22,-bh-14],[18,-bh-65],[-bw-18,65]]){const left=clamp(x+dx,8,w-bw-8),top=clamp(y+dy,42,h-bh-12);const r={left,top,right:left+bw,bottom:top+bh};if(!used.some(a=>r.left<a.right+8&&r.right>a.left-8&&r.top<a.bottom+8&&r.bottom>a.top-8)){placed=r;break;}}
   if(!placed){b.hidden=true;continue;}used.push(placed);b.style.left=placed.left+'px';b.style.top=placed.top+'px';line.setAttribute('x1',x);line.setAttribute('y1',y);line.setAttribute('x2',clamp(x,placed.left,placed.right));line.setAttribute('y2',clamp(y,placed.top,placed.bottom));dot.setAttribute('cx',x);dot.setAttribute('cy',y);line.style.display=dot.style.display='';this.visibleLabels.push({id:p.id,x,y,hitPart:hit.object.userData.part,rect:placed});
  }
 }
 tick(now){const dt=Math.min((now-this.last)/1000,.1);this.last=now;if(this.active&&!document.hidden){if(this.playing){this.progress=Math.min(1,this.progress+dt/12);if(this.progress===1)this.playing=false;this.update();}this.controls.update();this.projectLabels();this.renderer.render(this.scene,this.camera);}requestAnimationFrame(n=>this.tick(n));}
 snapshot(){return {kind:this.kind,progress:this.progress,playing:this.playing,selected:this.selected,parts:this.parts.map(p=>({id:p.id,position:p.group.position.toArray(),quaternion:p.group.quaternion.toArray()})),labels:this.visibleLabels,camera:this.camera.position.toArray(),meshes:this.meshes.length};}
}
for(const el of document.querySelectorAll('[data-device]')){const v=new Viewer();window.hardwareViewers.push(v);v.init(el).catch(e=>{console.error(e);el.querySelector('.loading').textContent='3D unavailable: '+e.message+'. Try a WebGL-enabled browser; source and film previews remain available.';});}
