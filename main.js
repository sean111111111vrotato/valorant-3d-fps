// -------------------
// Scene & Camera
// -------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1923);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,1.6,5);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light + Floor
const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(5,10,7);
scene.add(light);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshStandardMaterial({color:0x222222}));
floor.rotation.x=-Math.PI/2;
scene.add(floor);

// Controls
const controls = new THREE.PointerLockControls(camera, renderer.domElement);
document.body.addEventListener("click", ()=>controls.lock());
scene.add(controls.getObject());

// -------------------
// Player
// -------------------
let player = {hp:100, gunName:"Vandal", ammo:25, reserve:75};

// HUD
const gunNameEl = document.getElementById("gunName");
const ammoEl = document.getElementById("ammo");
const reserveEl = document.getElementById("reserve");
const hpEl = document.getElementById("hp");
function updateHUD(){gunNameEl.textContent=player.gunName;ammoEl.textContent=player.ammo;reserveEl.textContent=player.reserve;hpEl.textContent=player.hp;}

// -------------------
// Gun mesh
// -------------------
const gunMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.2,1), new THREE.MeshStandardMaterial({color:0x333333}));
gunMesh.position.set(0.3,-0.3,-0.8);
camera.add(gunMesh);

// -------------------
// Bots
// -------------------
let bots=[];
for(let i=0;i<9;i++){
  const botMesh=new THREE.Mesh(new THREE.BoxGeometry(1,2,1), new THREE.MeshStandardMaterial({color:0xff4655}));
  botMesh.position.set(Math.random()*20-10,1,Math.random()*-20);
  scene.add(botMesh);
  bots.push({mesh:botMesh,hp:100});
}

// -------------------
// Bullets
// -------------------
let bullets=[];
function shoot(){
  if(player.ammo<=0) return;
  player.ammo--;
  updateHUD();
  const bullet=new THREE.Mesh(new THREE.SphereGeometry(0.05), new THREE.MeshBasicMaterial({color:0xffff00}));
  bullet.position.copy(camera.position);
  bullet.userData.velocity=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).multiplyScalar(2);
  scene.add(bullet);
  bullets.push(bullet);
}

// Reload
function reload(){const gun=VALORANT_GUNS[player.gunName];let need=gun.mag-player.ammo;let taken=Math.min(need,player.reserve);player.ammo+=taken;player.reserve-=taken;updateHUD();}

// Weapon switch
document.addEventListener("keydown",e=>{
  const keys=Object.keys(VALORANT_GUNS);const idx=parseInt(e.key)-1;
  if(idx>=0 && idx<keys.length){player.gunName=keys[idx];const gun=VALORANT_GUNS[player.gunName];player.ammo=gun.mag;player.reserve=gun.reserve;updateHUD();}
  if(e.key.toLowerCase()==="r") reload();
});

// Mouse click
document.addEventListener("mousedown",shoot);

// Movement
let move={forward:false,back:false,left:false,right:false};
document.addEventListener("keydown",e=>{if(e.key==="w") move.forward=true;if(e.key==="s") move.back=true;if(e.key==="a") move.left=true;if(e.key==="d") move.right=true;});
document.addEventListener("keyup",e=>{if(e.key==="w") move.forward=false;if(e.key==="s") move.back=false;if(e.key==="a") move.left=false;if(e.key==="d") move.right=false;});

// Animate
function animate(){
  requestAnimationFrame(animate);

  const speed=0.1;
  if(move.forward) controls.moveForward(speed);
  if(move.back) controls.moveForward(-speed);
  if(move.left) controls.moveRight(-speed);
  if(move.right) controls.moveRight(speed);

  bullets.forEach((b,i)=>{
    b.position.add(b.userData.velocity);
    bots.forEach(bot=>{
      if(bot.hp>0 && b.position.distanceTo(bot.mesh.position)<1){
        bot.hp -= VALORANT_GUNS[player.gunName].damage*(b.position.y>1.5?2:1);
        scene.remove(b);
        bullets.splice(i,1);
        if(bot.hp<=0) scene.remove(bot.mesh);
      }
    });
  });

  renderer.render(scene,camera);
}
animate();

// Resize
window.addEventListener("resize",()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
