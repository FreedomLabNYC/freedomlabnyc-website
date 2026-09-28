import * as T from 'three';
import {GLTFLoader} from '../vendor/three/GLTFLoader.js';
const mat=(c,metalness=0)=>new T.MeshStandardMaterial({color:c,roughness:.62,metalness});
const colors={shell:0xd4d7d3, dark:0x17262b, pcb:0x074661, ink:0x18262a, orange:0xe36d38, metal:0xa9b6ba, gold:0xb8a060};
function path(w,h,r,x=0,y=0){const s=new T.Shape();s.moveTo(x-w/2+r,y-h/2);s.lineTo(x+w/2-r,y-h/2);s.quadraticCurveTo(x+w/2,y-h/2,x+w/2,y-h/2+r);s.lineTo(x+w/2,y+h/2-r);s.quadraticCurveTo(x+w/2,y+h/2,x+w/2-r,y+h/2);s.lineTo(x-w/2+r,y+h/2);s.quadraticCurveTo(x-w/2,y+h/2,x-w/2,y+h/2-r);s.lineTo(x-w/2,y-h/2+r);s.quadraticCurveTo(x-w/2,y-h/2,x-w/2+r,y-h/2);return s;}
function solid(g,name,w,h,r,d,x,y,z,color,holes=[]){const s=path(w,h,r);s.holes=holes;const o=new T.Mesh(new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:12}),mat(color));o.position.set(x,y,z);o.name=name;g.add(o);return o;}
function disc(g,name,r,d,x,y,z,color){const o=new T.Mesh(new T.CylinderGeometry(r,r,d,32),mat(color));o.rotation.x=Math.PI/2;o.position.set(x,y,z+d/2);o.name=name;g.add(o);return o;}
function labelTexture(title,lines,w,h){const c=document.createElement('canvas');c.width=800;c.height=Math.round(800*h/w);const q=c.getContext('2d');q.fillStyle='#d6d8c9';q.fillRect(0,0,c.width,c.height);q.fillStyle='#20302d';q.font='bold 40px sans-serif';q.fillText(title,45,75);q.fillRect(45,99,710,3);q.font='32px sans-serif';lines.forEach((x,i)=>q.fillText(x,45,165+i*62));q.font='22px monospace';q.fillText('INTERFACE STUDY',45,c.height-35);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map:t});}
function screen(g,w,h,x,y,z,title,lines){solid(g,'Display carrier',w+2,h+3,1,1,x,y,z-1,colors.dark);const o=new T.Mesh(new T.PlaneGeometry(w,h),labelTexture(title,lines,w,h));o.position.set(x,y,z+.02);o.name='Reflective display';g.add(o);return o;}
function part(root,id,label,description,offset){const group=new T.Group();group.name=id;root.add(group);return {id,label,description,group,offset:new T.Vector3(...offset),anchor:null};}
export async function buildModel(kind){
 const root=new T.Group();let parts=[],size;
 if(kind==='stick'){
  size=42;
  const rear=part(root,'rear','Original back','K150 product envelope: 48 × 24 × 15 mm. Existing magnetic case, not a new enclosure.',[-8,-4,-14]);
  rear.anchor=solid(rear.group,'Graphite back',24,48,2.5,1.2,0,0,0,colors.dark);
  solid(rear.group,'Case perimeter',24,48,2.5,11.6,0,0,1.2,colors.dark,[path(21,45,1.2)]);
  const board=part(root,'board','Internal carrier','Approximate interior envelope, not a teardown. Manufacturer documents PICO-1, ES8311, MEMS microphone and speaker. Battery dimensions and wiring are not modeled.',[0,0,15]);
  board.anchor=solid(board.group,'Approximate internal carrier',20,41,1,1,0,0,9,colors.pcb);
  const display=part(root,'display','1.14″ LCD','135 × 240 color TFT, not e-paper. Active area 14.864 × 24.912 mm from the manufacturer replacement display specification.',[4,2,32]);
  display.anchor=screen(display.group,14.864,24.912,0,5,13.3,'STICK S3',['Wi-Fi','Voice study']);
  const front=part(root,'front','Front + button','Source-photo graphite case and blue front button. Software PTT mapping is a proposal, not a verified voice integration.',[8,4,49]);
  front.anchor=solid(front.group,'Original front frame',24,48,2.5,2.2,0,0,12.8,colors.dark,[path(15.5,25.5,.7,0,5),path(11,2.5,1,0,-14)]);
  solid(front.group,'Blue front button',10.5,2,1,1,0,-14,14.5,0x0787dd);
  for(const y of [-17,16])solid(rear.group,'Side key',1,5,.5,4,-12,y,5,0x263337);
  // External connector faces from manufacturer photographs, no invented cable routes.
  const bottom=new T.Group();bottom.rotation.x=Math.PI/2;bottom.position.set(0,-24,7);rear.group.add(bottom);
  solid(bottom,'USB-C shell',9,3,1,.3,0,0,0,colors.metal);solid(bottom,'USB-C opening',7.5,1.8,.7,.4,0,0,.3,0x030606);
  const top=new T.Group();top.rotation.x=-Math.PI/2;top.position.set(0,24,4);rear.group.add(top);
  solid(top,'Hat2 16-pin header',21,5,.2,.2,0,0,0,0x080c0c);
  for(let x=0;x<8;x++)for(let y=0;y<2;y++)solid(top,'Header recess',1.8,1.8,.1,.1,-8.89+x*2.54,-1.27+y*2.54,.2,0x000000);
  parts=[rear,board,display,front];
 }else if(kind==='397'){
  const gltf=await new GLTFLoader().loadAsync('assets/models/voice397.glb');
  // The exporter preserves Blender millimetre coordinates (export_yup=false).
  root.add(gltf.scene);gltf.scene.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(gltf.scene);const scale=112/bounds.getSize(new T.Vector3()).x;gltf.scene.scale.multiplyScalar(scale);gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(o.isMesh&&o.material){const n=o.material.name.toLowerCase();if(n.includes('graphite'))o.material.color.setHex(0x17282d);if(n.includes('ptt burnt'))o.material.color.setHex(0xdf682b);}});
  const defs=[['01','rear','Rear shell','Proposed hollow 112 × 84 × 23 mm case. Not fit-tested.',[-24,-12,-27],'Rear shell / hollow solid'],['02','board','99.5 × 60 PCB','Sourced board outline. Packages and heights are photo-estimated.',[0,4,12],'PCB outline EXACT'],['03','display','3.97″ e-paper','Sourced active area 86.4 × 51.84 mm. UI is illustrative.',[8,4,49],'Active area EXACT'],['04','front','Fascia + PTT','Original EEVEE fascia with real apertures; orange actuator is a concept.',[22,8,86],'Front fascia through-cut solid'],['05','audio','Audio concept','Illustrative speaker chamber and PTT reservation; not validated wiring.',[-23,-23,19],'Concept speaker enclosure']];
  for(const [prefix,id,label,description,offset,anchorName] of defs){let group;gltf.scene.traverse(o=>{if(o.name.startsWith(prefix))group=o;});let anchor;group.traverse(o=>{if(o.name.replace(/[^a-z0-9]/gi,'').startsWith(anchorName.replace(/[^a-z0-9]/gi,'')))anchor=o;});parts.push({id,label,description,group,offset:new T.Vector3(...offset).divideScalar(scale),anchor:anchor||group.children.find(o=>o.isMesh)});}
  size=112;
 }else{
  const note=kind==='note4',w=note?97:39.8,h=note?97:53,d=note?8.75:16.9,r=note?5:4.5;size=w;
  const rear=part(root,'rear',note?'Magnetic back':'Rear cover',note?'97 × 97 × 8.75 mm complete product envelope, including magnetic back. Interior surfaces approximate.':'39.8 × 53 × 16.9 mm manufacturer enclosure envelope. Internal depths approximate.',[-w*.16,-h*.05,-w*.3]);
  rear.anchor=solid(rear.group,'Back panel',w,h,r,1.2,0,0,0,colors.shell);
  solid(rear.group,'Hollow perimeter',w,h,r,d-3,0,0,1.2,colors.shell,[path(w-3,h-3,r-1)]);
  const board=part(root,'board',note?'Interior envelope':'V2 PCB',note?'Approximate interior envelope only: no public mechanical board layout verified. No battery or wiring modeled.':'Photo-based V2 component arrangement, not PCB CAD. ESP32-S3-PICO-1-N8R8, ES8311, TF and USB-C; package sizes approximate.',[0,0,w*.3]);
  if(note){
   board.anchor=solid(board.group,'Unresolved internal carrier',87,78,3,.8,0,1,4,colors.dark);
   // Deliberately no fabricated chips, battery or wiring for undisclosed NOTE4 internals.
  }else{
   board.anchor=solid(board.group,'V2 board photo-estimated outline',36,47,2,1.2,0,0,8,colors.pcb);
   // Photograph rotated to match portrait enclosure; source HW image component anchors.
   for(const [name,x,y,cw,ch,dep,col] of [['PICO-1',-4,5,7,7,1.5,colors.ink],['ES8311',6,4,3,3,1,colors.ink],['TF socket',-4,-10,14,14,1.5,colors.metal],['USB-C',16,0,5,9,3,colors.metal],['BOOT',5,-22,4,2,2,colors.metal],['PWR',14,-22,4,2,2,colors.metal],['SPK connector',-8,20,6,4,3,0xd8d4b8],['BAT connector',12,20,6,4,3,0xd8d4b8],['Microphone',15,12,3,3,1.2,colors.metal],['SHTC3',16,-9,2,3,1,colors.ink]])solid(board.group,name,cw,ch,.3,dep,x,y,9.2,col);
   solid(board.group,'USB-C mouth',.2,6,.1,1.5,18.55,0,10,colors.ink);
   solid(board.group,'2 × 6 header',15.24,5.1,.2,3,0,20,9.2,colors.ink);
   for(let x=0;x<6;x++)for(let y=0;y<2;y++)solid(board.group,'Header socket',1.4,1.4,.1,.1,-6.35+x*2.54,18.73+y*2.54,12.22,0x040707);
   for(const x of [-15,15])for(const y of [-20,20]){disc(board.group,'Mount annulus',1.6,.15,x,y,9.2,colors.gold);disc(board.group,'Mount bore',.8,.18,x,y,9.25,colors.ink);}
   solid(board.group,'Side speaker envelope',3,15,1,3,-16,0,10,colors.metal);
  }
  const display=part(root,'display',note?'4.2″ e-paper':'1.54″ e-paper',note?'400 × 300 manufacturer specification; visible area estimated from product photograph, not a panel drawing.':'200 × 200 display; 27.8 × 27.8 mm visible aperture from manufacturer dimension drawing.',[w*.08,h*.03,w*.7]);
  const sw=note?84:27.8,sh=note?63:27.8,sy=note?11:1.7;
  display.anchor=screen(display.group,sw,sh,0,sy,d-1.7,note?'NOTE4 / HEARTH':'VOICE',note?['Voice in.','A quiet reply on screen.']:['Ready.']);
  const front=part(root,'front',note?'Original enclosure':'Front bezel',note?'Existing NOTE4 shape: white rounded case, landscape screen, lower-left grille and round lower-right button. Not a proposed replacement shell.':'Manufacturer enclosure shape. Side buttons are developer controls; a PTT mapping is not proven.',[w*.16,h*.06,w*1.1]);
  const holes=[path(sw+.8,sh+.8,note?2:.5,0,sy)];
  if(note){for(let y=0;y<3;y++)for(let x=0;x<6;x++){let a=new T.Path();a.absarc(-38+x*2.8,-38+y*2.2,.5,0,Math.PI*2);holes.push(a);}let a=new T.Path();a.absarc(38,-38,5.4,0,Math.PI*2);holes.push(a);}
  front.anchor=solid(front.group,'Front through-cut frame',w,h,r,1.8,0,0,d-1.8,colors.shell,holes);
  if(note){disc(front.group,'Round front button',4.8,1,38,-38,d-.9,colors.shell);disc(front.group,'Indicator',.6,.05,27,-38,d+.01,colors.metal);for(let y of [-20,-33])solid(front.group,'Right side key',1,10,.4,2,w/2,y,3,colors.shell);}
  else {for(let y of [-8,-18])solid(front.group,'Side control',1,4,.4,4,w/2,y,6,colors.shell);for(const x of [-14,14])disc(rear.group,'Rear screw',1.5,.3,x,21,-.3,colors.metal);}
  parts=[rear,board,display,front];
 }
 root.updateMatrixWorld(true);
 for(const p of parts){p.base=p.group.position.clone();p.quaternion=p.group.quaternion.clone();p.group.traverse(o=>{if(o.isMesh){o.userData.part=p.id;if(o.material){o.material=o.material.clone();o.material.side=T.DoubleSide;}}});}
 return {root,parts,size};
}
