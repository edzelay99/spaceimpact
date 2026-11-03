'use strict';
// All art is procedural. Replace the draw methods to use sprite sheets later.
const W=480,H=270, canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a);
const hit=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.y-b.y)<(a.h+b.h)/2;
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function label(s,x,y,c='#dff',size=7){ctx.fillStyle=c;ctx.font=`${size}px monospace`;ctx.fillText(s,x,y)}
// Ship balance and palettes are centralized for future additions.
const SHIPS={
 falcon:{name:'AX-01 FALCON',color:'#71e7ff',hull:'#267cae',wing:'#468bd0',speed:115,rate:.16,power:'SOBRECARGA',description:'Láser cian · Equilibrada. Sobrecarga: dispara al doble de velocidad durante 5 s.'},
 nova:{name:'NX-02 NOVA',color:'#ffb760',hull:'#b95938',wing:'#f08653',speed:105,rate:.20,power:'PULSO SOLAR',description:'Plasma naranja · Golpes de 2 de daño. Pulso: destruye proyectiles y daña enemigos.'},
 spectre:{name:'VX-03 SPECTRE',color:'#d1a0ff',hull:'#7054ad',wing:'#b47de4',speed:140,rate:.18,power:'VELO ENERGÉTICO',description:'Láser violeta · Alta movilidad. Velo: barrera de 6 s y reparación de 20 puntos.'}
};
class AudioManager{
 constructor(){this.muted=false;this.context=null;}
 unlock(){try{this.context??=new(window.AudioContext||window.webkitAudioContext)();this.context.resume();}catch{}}
 play(type){if(this.muted||!this.context)return;const ac=this.context,o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;
 const specs={laser:[760,200,.055],boom:[120,25,.25],hurt:[180,55,.2],power:[450,1100,.25],warning:[220,440,.6],win:[520,1040,.6],lose:[250,50,.7]};const [a,b,d]=specs[type]||specs.laser;
 o.type=type==='boom'?'sawtooth':'square';o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(b,t+d);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d);}
}
class Particle{constructor(x,y,color){Object.assign(this,{x,y,color,vx:rand(-85,85),vy:rand(-85,85),life:rand(.2,.8),w:2,h:2});}update(dt){this.life-=dt;this.x+=this.vx*dt;this.y+=this.vy*dt;}draw(){rect(this.x,this.y,2,2,this.color);}}
class Bullet{constructor(x,y,vx,vy,hostile=false){Object.assign(this,{x,y,vx,vy,hostile,w:hostile?5:10,h:hostile?5:3,dead:false,color:'#acffff',damage:1});}update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;if(this.x< -30||this.x>510||this.y<0||this.y>H)this.dead=true;}draw(){rect(this.x-this.w/2-2,this.y-3,this.w+4,6,this.hostile?'#81344d':this.color+'55');rect(this.x-this.w/2,this.y-1,this.w,3,this.hostile?'#ff858b':this.color);}}
class Player{
 constructor(shipId='falcon'){this.shipId=SHIPS[shipId]?shipId:'falcon';this.ship=SHIPS[this.shipId];Object.assign(this,{powerCooldown:0,overload:0,x:65,y:130,w:24,h:14,speed:115,shield:100,lives:3,inv:2,cool:0,dash:0,dashTime:0,weapon:0,weaponTime:0,barrier:0});this.speed=this.ship.speed;}
 update(dt,g){for(const k of ['inv','cool','dash','dashTime','weaponTime','barrier','powerCooldown','overload'])this[k]=Math.max(0,this[k]-dt);if(!this.weaponTime)this.weapon=0;
 let dx=+(g.pressed('KeyD')||g.pressed('ArrowRight'))-+(g.pressed('KeyA')||g.pressed('ArrowLeft')),dy=+(g.pressed('KeyS')||g.pressed('ArrowDown'))-+(g.pressed('KeyW')||g.pressed('ArrowUp'));
 if(g.stick.x||g.stick.y){dx=g.stick.x;dy=g.stick.y;}
 if((g.pressed('ShiftLeft')||g.pressed('ShiftRight'))&&!this.dash){this.dash=3;this.dashTime=.2;g.burst(this.x-12,this.y,'#7dfaff',8);}
 const norm=Math.max(1,Math.hypot(dx,dy)),s=this.speed*(this.dashTime?2.8:1);this.x=clamp(this.x+dx/norm*s*dt,18,450);this.y=clamp(this.y+dy/norm*s*dt,39,235);
 if(g.pressed('KeyE'))this.activatePower(g);
 if(g.pressed('Space')&&!this.cool){this.cool=this.ship.rate*(this.overload?.5:1);const angles=this.weapon===2?[-.23,0,.23]:this.weapon===1?[0,0]:[0];angles.forEach((a,i)=>{const bullet=new Bullet(this.x+16,this.y+(this.weapon===1?(i?4:-4):0),260*Math.cos(a),260*Math.sin(a));bullet.color=this.overload?'#ffffff':this.ship.color;bullet.damage=this.shipId==='nova'?2:1;g.bullets.push(bullet);});g.audio.play('laser');}}
 activatePower(g){
  if(g.state!=='PLAYING'||this.powerCooldown)return false;
  this.powerCooldown=12;g.audio.play('power');g.burst(this.x,this.y,this.ship.color,35);
  if(this.shipId==='falcon')this.overload=5;
  else if(this.shipId==='nova'){
   g.bullets=g.bullets.filter(b=>!b.hostile);g.shake=5;
   for(const enemy of g.enemies){enemy.hp-=8;if(!enemy.dead&&enemy.hp<=0)g.destroy(enemy);}
   if(g.boss&&!g.boss.dead){g.boss.hp-=35;if(g.boss.hp<=0){g.boss.dead=true;g.deathTimer=2.5;g.shake=8;g.bullets=[];g.audio.play('boom');}}
   g.pulse=.6;
  }else{this.barrier=Math.max(this.barrier,6);this.shield=Math.min(100,this.shield+20);}
  return true;
 }
 damage(n,g){if(this.inv||this.barrier||g.state!=='PLAYING')return;this.shield-=n;this.inv=1.4;g.shake=4;g.audio.play('hurt');g.burst(this.x,this.y,'#75dfff',15);if(this.shield<=0){this.lives--;if(this.lives<=0){this.shield=0;g.end(false);return;}this.shield=100;this.x=65;this.y=130;this.inv=3;}}
 draw(t){if(this.inv&&Math.floor(t*14)%2)return;const x=this.x,y=this.y;rect(x-23,y-3,rand(7,13),6,'#42cfec');rect(x-19,y-1,10,2,'#f8fbc1');rect(x-11,y-5,22,10,this.ship.hull);rect(x-5,y-9,9,18,'#25476c');rect(x-2,y-7,9,14,this.ship.wing);rect(x,y-4,15,8,this.ship.color);rect(x+5,y-3,7,3,'#dbffff');rect(x+13,y-1,5,2,'#e8fcff');rect(x-10,y+4,7,2,'#152b50');if(this.shipId==='nova'){rect(x-11,y-12,15,4,this.ship.wing);rect(x-11,y+8,15,4,this.ship.wing);}if(this.shipId==='spectre'){rect(x-16,y-11,5,22,this.ship.wing);rect(x+6,y-1,16,2,this.ship.color);}if(this.overload){rect(x-13,y-12,28,1,'#ffffff');}if(this.barrier){ctx.strokeStyle='#87ffe4';ctx.beginPath();ctx.arc(x,y,23,0,Math.PI*2);ctx.stroke();}}
}
class Enemy{
 constructor(type,y){Object.assign(this,{type,x:500,y,baseY:y,w:type===2?25:22,h:type===2?22:15,hp:[2,4,7][type],age:0,shot:rand(1.4,3),dead:false});}
 update(dt,g){this.age+=dt;this.x-=[49,72,29][this.type]*dt;if(this.type===1)this.y=this.baseY+Math.sin(this.age*3)*25;if(this.type>0){this.shot-=dt;if(this.shot<=0){this.shot=this.type===2?2.5:2;const a=Math.atan2(g.player.y-this.y,g.player.x-this.x);g.bullets.push(new Bullet(this.x-12,this.y,Math.cos(a)*83,Math.sin(a)*83,true));}}if(this.x< -35)this.dead=true;}
 draw(){const x=this.x,y=this.y,c=['#f15d75','#a279ed','#657f91'][this.type];rect(x-11,y-6,22,12,'#263147');rect(x-8,y-8,13,16,c);rect(x-15,y-3,11,6,c);rect(x-11,y-2,6,3,'#ffe5e9');rect(x+7,y-3,5,6,'#ffb56d');if(this.type===2){rect(x-14,y+8,28,5,'#213346');rect(x-15,y-9,17,4,'#9cb5c0');}}
}
class PowerUp{constructor(x,y,type){Object.assign(this,{x,y,type,w:15,h:15,age:0,dead:false});}update(dt){this.x-=35*dt;this.age+=dt;if(this.x< -20)this.dead=true;}draw(){const c=['#61e4ff','#d198ff','#83ffcc','#ffc979'][this.type];rect(this.x-7,this.y-7,14,14,'#102e43');ctx.strokeStyle=c;ctx.strokeRect(Math.round(this.x)-7,Math.round(this.y)-7,14,14);label(['II','III','O','+'][this.type],this.x-5,this.y+3,c,8);}apply(p,g){if(this.type<2){p.weapon=this.type+1;p.weaponTime=16;}else if(this.type===2)p.barrier=12;else p.shield=Math.min(100,p.shield+40);g.audio.play('power');this.dead=true;}}
class Obstacle{
 constructor(){this.x=505;this.y=239;this.w=22;this.h=20;}
 update(dt){this.x-=29*dt;}
 draw(){rect(this.x-11,this.y-6,22,16,'#224f67');rect(this.x-6,this.y-13,9,22,'#46b4c2');rect(this.x-3,this.y-11,3,17,'#adfff1');}
}
class Boss{
 constructor(){Object.assign(this,{x:535,y:132,w:92,h:78,hp:460,maxHp:460,age:0,shot:2.5,dead:false});}
 update(dt,g){this.age+=dt;this.x=Math.max(397,this.x-30*dt);const enraged=this.hp<=this.maxHp/2;this.y=135+Math.sin(this.age*(enraged?1.6:.85))*52;this.shot-=dt;if(this.shot<=0&&this.x<440){this.shot=enraged?1.25:1.8;const a=Math.atan2(g.player.y-this.y,g.player.x-this.x);for(const offset of(enraged?[-.4,-.2,0,.2,.4]:[-.13,.13]))g.bullets.push(new Bullet(this.x-45,this.y,Math.cos(a+offset)*92,Math.sin(a+offset)*92,true));if(enraged){for(const y of[-26,26])g.bullets.push(new Bullet(this.x-44,this.y+y,-105,0,true));}}}
 draw(){const x=this.x,y=this.y;rect(x-32,y-34,67,68,'#182437');rect(x-43,y-22,83,44,'#35465d');rect(x-37,y-32,18,64,'#5b6b7c');rect(x-49,y-27,28,8,'#99a3ad');rect(x-49,y+19,28,8,'#99a3ad');rect(x+27,y-25,18,15,'#ff875f');rect(x+27,y+10,18,15,'#ff875f');rect(x-20,y-17,32,34,'#101b2c');rect(x-15,y-12,22,24,this.hp<=230?'#ffbd61':'#ff466c');rect(x-10,y-7,12,14,'#ffe5d0');for(let i=0;i<4;i++)rect(x+14,y-25+i*16,7,3,'#ff6179');}
}
class Background{
 constructor(){this.time=0;}update(dt){this.time+=dt;}draw(){const t=this.time;const gradient=ctx.createLinearGradient(0,0,0,H);gradient.addColorStop(0,'#12506a');gradient.addColorStop(.55,'#5dc5cc');gradient.addColorStop(1,'#bad5cf');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#a4eed9';ctx.beginPath();ctx.arc(355,61,30,0,7);ctx.fill();rect(327,63,59,2,'#75c6c5');
 for(let i=0;i<7;i++){let x=((i*99-t*5)%650+650)%650-90;rect(x,53+i%3*17,58,3,'#a5ddd455');rect(x+13,49+i%3*17,32,4,'#a5ddd444');}
 const mountain=(x,y,width,height,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width*.32,y-height*.7);ctx.lineTo(x+width*.48,y-height);ctx.lineTo(x+width*.62,y-height*.55);ctx.lineTo(x+width,y);ctx.fill();};
 for(let i=0;i<7;i++){const x=((i*110-t*10)%770+770)%770-130;mountain(x,215,160,80+i%3*18,'#655b92');mountain(x+10,215,100,60,'#796caa');}
 for(let i=0;i<9;i++){const x=((i*84-t*23)%756+756)%756-90;mountain(x,253,100,35+i%3*19,'#2b677f');rect(x+35,220-i%3*12,13,42,'#327b91');rect(x+37,217-i%3*12,4,28,'#74ede0');}
 rect(0,251,480,19,'#122e43');rect(0,251,480,3,'#316578');for(let i=0;i<17;i++){const x=((i*35-t*40)%595+595)%595-40;rect(x,258,22,2,'#294d61');if(i%3===0){rect(x,245,13,8,'#254353');rect(x+3,245,5,2,'#74e8cc');}}
 for(let i=0;i<23;i++)rect(((i*67-t*(12+i%3))%490+490)%490,35+(i*37)%204,1,1,'#bcfff3');}}
class UI{
 constructor(g){this.g=g;this.overlay=document.getElementById('overlay');}
 show(state){document.body.dataset.state=state;const g=this.g;this.overlay.classList.toggle('hidden',state==='PLAYING');if(state==='PLAYING')return;if(state==='HANGAR'){this.hangar();return;}
 const menu=state==='MENU',paused=state==='PAUSED';this.overlay.innerHTML=`<div class="panel"><p class="tag">${menu?'PLANETA 01 / AETHER':paused?'SISTEMA EN ESPERA':'MISIÓN / AETHER'}</p>${menu?'<h1>GALAXY<br><em>IMPACT</em></h1><p class="subtitle">DEFEND THE GALAXY</p>':`<h2>${paused?'PAUSA':state==='VICTORY'?'AETHER LIBERADO':'GAME OVER'}</h2>`}<p class="story">${menu?'OMEGA ha tomado el planeta.<br>Pilota la AX–01 FALCON. Recupera nuestro futuro.':paused?'La galaxia puede esperar un momento.':`PUNTUACIÓN ${String(g.score).padStart(6,'0')} · RÉCORD ${g.best}`}</p><button class="primary" id="start">${menu?'INICIAR JUEGO →':paused?'CONTINUAR →':'REINTENTAR →'}</button><button id="secondary">${menu?'CONTROLES':'VOLVER AL MENÚ'}</button>${menu?'<button id="hangar">HANGAR / CAMBIAR NAVE</button>':''}<p class="story" id="help"></p></div>`;
 if(menu)document.getElementById('hangar').onclick=()=>{g.state='HANGAR';this.show('HANGAR');};document.getElementById('start').onclick=()=>{g.audio.unlock();if(paused){g.state='PLAYING';this.show(g.state);}else g.start();};document.getElementById('secondary').onclick=()=>{if(menu)document.getElementById('help').textContent='Teclado: WASD / flechas, Espacio, Shift y P. Celular: joystick analógico + DISPARAR; IMPULSO, PODER y PAUSA. E: poder especial (recarga 12 s). · Enter: iniciar';else{g.state='MENU';this.show('MENU');}};}
 hangar(){
  const g=this.g;
  this.overlay.innerHTML=`<div class="panel hangar-panel"><p class="tag">FLOTA / HANGAR</p><h2>ELIGE TU NAVE</h2><div class="ship-grid">${Object.entries(SHIPS).map(([id,ship])=>`<button class="ship-card ${id===g.selectedShip?'selected':''}" data-ship="${id}" aria-pressed="${id===g.selectedShip}" style="--ship-color:${ship.color}"><span class="ship-icon ${id}"></span><strong>${ship.name}</strong><span>${ship.description}</span><b>${id===g.selectedShip?'EQUIPADA':'ELEGIR NAVE'}</b></button>`).join('')}</div><button class="primary" id="launch">JUGAR CON ${SHIPS[g.selectedShip].name}</button><button id="back-menu">VOLVER AL MENÚ</button></div>`;
  this.overlay.querySelectorAll('[data-ship]').forEach(button=>button.onclick=()=>{g.selectedShip=button.dataset.ship;try{localStorage.setItem('galaxy-impact-ship',g.selectedShip);}catch{}g.player=new Player(g.selectedShip);this.hangar();});
  document.getElementById('launch').onclick=()=>{g.audio.unlock();g.start();};
  document.getElementById('back-menu').onclick=()=>{g.state='MENU';this.show('MENU');};
 }
 draw(){const g=this.g,p=g.player;if(g.state==='MENU')return;rect(0,0,W,30,'#071a2be8');label('ESCUDO',10,10,'#82b6c9',6);rect(10,15,70,4,'#2d4256');rect(10,15,70*p.shield/100,4,'#79f4ce');label('VIDAS '+p.lives,90,17);label(String(g.score).padStart(6,'0'),190,17,'#fff',10);label('RÉCORD '+g.best,280,17,'#9ec4d1');label('AETHER',427,12,'#8eead9',6);rect(0,28,W*Math.min(1,g.elapsed/150),2,'#62dacb');label(g.elapsed<60?'01 / LLEGADA':g.elapsed<150?'02 / INVASIÓN':'03 / DESTRUCTOR OMEGA',10,40,'#d3f7f0',6);
 if(p.weaponTime)label(['','DOBLE','TRIPLE'][p.weapon]+' '+Math.ceil(p.weaponTime)+'s',10,238,'#e1beff');if(p.barrier)label('BARRERA '+Math.ceil(p.barrier)+'s',110,238,'#8cffde');label(p.ship.power+' '+(p.powerCooldown?Math.ceil(p.powerCooldown)+'s':'LISTO'),170,263,p.ship.color,6);label(p.dash?'IMPULSO '+p.dash.toFixed(1)+'s':'IMPULSO LISTO',10,263,'#9bd8e5',6);
 if(g.boss){rect(145,44,190,5,'#263249');rect(145,44,190*g.boss.hp/g.boss.maxHp,5,'#ff6583');label('DESTRUCTOR OMEGA',190,41,'#ffbdc8',6);}if(g.elapsed>=150&&g.elapsed<155){rect(30,107,420,37,'#32162b');label('WARNING — OMEGA SIGNATURE DETECTED',49,130,'#ffb1b1',10);}}
}
class Game{
 constructor(){this.keys=new Set();this.touchKeys=new Set();this.stick={x:0,y:0};this.audio=new AudioManager();this.background=new Background();this.selectedShip='falcon';try{const saved=localStorage.getItem('galaxy-impact-ship');if(SHIPS[saved])this.selectedShip=saved;}catch{}this.best=0;try{this.best=Number(localStorage.getItem('galaxy-impact-best'))||0;}catch{}this.state='MENU';this.reset();this.ui=new UI(this);this.ui.show('MENU');
 window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Escape'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.repeat)return;if(e.code==='Enter'&&['MENU','GAME_OVER','VICTORY'].includes(this.state)){this.audio.unlock();this.start();}if(['KeyP','Escape'].includes(e.code))this.pause();});window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>{this.keys.clear();if(this.state==='PLAYING')this.pause();});
 document.getElementById('sound').onclick=()=>{this.audio.unlock();this.audio.muted=!this.audio.muted;document.getElementById('sound').textContent='SONIDO: '+(this.audio.muted?'OFF':'ON');};this.setupTouch();this.setupMobileLayout();
 const fullscreen=document.getElementById('fullscreen');
 fullscreen.hidden=!document.documentElement.requestFullscreen;
 fullscreen.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{fullscreen.textContent='PANTALLA NO DISPONIBLE';}};
 document.addEventListener('fullscreenchange',()=>{fullscreen.textContent=document.fullscreenElement?'SALIR DE PANTALLA':'⛶ PANTALLA';});
 this.last=0;requestAnimationFrame(t=>this.frame(t));}
 reset(){this.player=new Player(this.selectedShip);this.enemies=[];this.obstacles=[];this.bullets=[];this.particles=[];this.powerups=[];this.boss=null;this.elapsed=0;this.score=0;this.wave=2;this.shake=0;this.kills=0;this.deathTimer=0;this.warning=false;this.pulse=0;}
 pressed(code){return this.keys.has(code)||this.touchKeys.has(code);}
 setupMobileLayout(){
  const root=document.documentElement,toggle=document.getElementById('touch-mode');
  let manual=null;
  const sync=()=>{
   const viewport=window.visualViewport;
   root.style.setProperty('--screen-width',(viewport?.width||innerWidth)+'px');
   root.style.setProperty('--screen-height',(viewport?.height||innerHeight)+'px');
   const detected=navigator.maxTouchPoints>0||matchMedia('(any-pointer: coarse)').matches||Math.min(innerWidth,innerHeight)<=600;
   const enabled=manual??detected;
   root.classList.toggle('mobile-mode',enabled);
   toggle.setAttribute('aria-pressed',String(enabled));
   toggle.textContent=enabled?'CONTROLES TÁCTILES: ON':'ACTIVAR CONTROLES TÁCTILES';
  };
  toggle.onclick=()=>{manual=!root.classList.contains('mobile-mode');this.clearTouch();sync();};
  window.addEventListener('touchstart',()=>{if(manual===null){manual=true;sync();}},{once:true,passive:true});
  window.addEventListener('resize',sync);
  window.addEventListener('orientationchange',()=>{sync();setTimeout(sync,250);});
  window.visualViewport?.addEventListener('resize',sync);
  sync();
 }
 setupTouch(){
  const pointers=new Map();
  const refresh=()=>{this.touchKeys.clear();for(const {button,key} of pointers.values())this.touchKeys.add(key);document.querySelectorAll('[data-key]').forEach(b=>b.classList.toggle('held',this.touchKeys.has(b.dataset.key)));};
  // Capture one thumb; keep action-button pointers independent.
  const stick=document.getElementById('joystick');let stickPointer=null;
  const resetStick=()=>{stickPointer=null;this.stick.x=0;this.stick.y=0;stick.classList.remove('active');stick.style.setProperty('--stick-x','0px');stick.style.setProperty('--stick-y','0px');};
  const moveStick=e=>{
   const box=stick.getBoundingClientRect(),radius=box.width*.28;
   let x=(e.clientX-box.left-box.width/2)/radius,y=(e.clientY-box.top-box.height/2)/radius;
   const distance=Math.hypot(x,y),scale=Math.max(1,distance);x/=scale;y/=scale;
   const strength=clamp((Math.min(distance,1)-.12)/.88,0,1),angle=Math.atan2(y,x);
   this.stick.x=Math.cos(angle)*strength;this.stick.y=Math.sin(angle)*strength;
   stick.style.setProperty('--stick-x',x*radius+'px');stick.style.setProperty('--stick-y',y*radius+'px');
  };
  stick.addEventListener('pointerdown',e=>{e.preventDefault();if(this.state!=='PLAYING'||stickPointer!==null)return;stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);stick.classList.add('active');moveStick(e);});
  stick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer){e.preventDefault();moveStick(e);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,e=>{if(e.pointerId===stickPointer)resetStick();});
  stick.addEventListener('contextmenu',e=>e.preventDefault());
  this.clearTouch=()=>{pointers.clear();resetStick();refresh();};
  document.querySelectorAll('[data-key]').forEach(button=>{
   button.addEventListener('pointerdown',e=>{e.preventDefault();if(this.state!=='PLAYING')return;this.audio.unlock();if(button.dataset.key==='KeyE')this.player.activatePower(this);if(button.dataset.key==='ShiftLeft'&&!this.player.dash){this.player.dash=3;this.player.dashTime=.2;this.burst(this.player.x-12,this.player.y,'#7dfaff',8);}button.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{button,key:button.dataset.key});refresh();});
   const release=e=>{pointers.delete(e.pointerId);refresh();};
   for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
   button.addEventListener('contextmenu',e=>e.preventDefault());
  });
  document.getElementById('touch-pause').onclick=()=>this.pause();
  window.addEventListener('blur',()=>this.clearTouch());
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.clearTouch();this.keys.clear();if(this.state==='PLAYING')this.pause();}});
  window.addEventListener('resize',()=>{this.clearTouch();this.keys.clear();if(this.state==='PLAYING')this.pause();});
 }
 start(){this.clearTouch?.();this.reset();this.keys.clear();this.state='PLAYING';this.ui.show(this.state);}
 pause(){if(!['PLAYING','PAUSED'].includes(this.state))return;this.state=this.state==='PLAYING'?'PAUSED':'PLAYING';this.clearTouch?.();this.keys.clear();this.ui.show(this.state);}
 burst(x,y,c,n){for(let i=0;i<n&&this.particles.length<240;i++)this.particles.push(new Particle(x,y,c));}
 end(win){this.clearTouch?.();this.state=win?'VICTORY':'GAME_OVER';if(win)this.score+=5000+this.player.lives*1000;this.best=Math.max(this.best,this.score);try{localStorage.setItem('galaxy-impact-best',String(this.best));}catch{}this.audio.play(win?'win':'lose');this.ui.show(this.state);}
 destroy(e){e.dead=true;this.kills++;this.score+=[100,200,300][e.type];this.audio.play('boom');this.burst(e.x,e.y,'#ffb175',20);if(e.type===2)this.shake=3;if(this.kills===3||Math.random()<.24)this.powerups.push(new PowerUp(e.x,clamp(e.y,52,225),this.kills===3?0:Math.floor(rand(0,4))));}
 update(dt){if(this.state!=='PLAYING')return;this.background.update(dt);this.pulse=Math.max(0,this.pulse-dt);this.shake=Math.max(0,this.shake-dt*12);if(this.deathTimer){this.deathTimer-=dt;this.burst(this.boss.x+rand(-40,40),this.boss.y+rand(-30,30),'#ffcd9a',4);if(this.deathTimer<=0)this.end(true);this.particles.forEach(p=>p.update(dt));this.particles=this.particles.filter(p=>p.life>0);return;}
 this.elapsed+=dt;this.player.update(dt,this);this.wave-=dt;if(this.elapsed<150&&this.wave<=0){this.wave=this.elapsed<60?3.1:2.1;const type=this.elapsed<60?0:(Math.random()<.3?2:1);this.enemies.push(new Enemy(type,type===2?235:rand(65,195)));if(this.elapsed>30&&Math.random()<.22)this.obstacles.push(new Obstacle());}
 if(this.elapsed>=150&&!this.warning){this.warning=true;this.audio.play('warning');this.enemies=[];this.bullets=this.bullets.filter(b=>!b.hostile);}if(this.elapsed>=155&&!this.boss)this.boss=new Boss();
 this.obstacles.forEach(o=>{o.update(dt);if(hit(o,this.player))this.player.damage(25,this);});this.obstacles=this.obstacles.filter(o=>o.x> -30);this.enemies.forEach(e=>e.update(dt,this));if(this.boss)this.boss.update(dt,this);this.bullets.forEach(b=>b.update(dt));this.powerups.forEach(p=>p.update(dt));
 for(const b of this.bullets){if(b.dead)continue;if(b.hostile){if(hit(b,this.player)){b.dead=true;this.player.damage(20,this);}}else{const target=this.enemies.find(e=>!e.dead&&hit(b,e))|| (this.boss&&!this.boss.dead&&hit(b,this.boss)?this.boss:null);if(target){b.dead=true;target.hp-=b.damage;this.burst(b.x,b.y,'#afffff',3);if(target.hp<=0){if(target===this.boss){target.dead=true;this.deathTimer=2.5;this.shake=8;this.bullets.forEach(b=>b.dead=true);this.audio.play('boom');}else this.destroy(target);}}}}
 for(const e of this.enemies)if(!e.dead&&hit(e,this.player)){this.player.damage(35,this);e.dead=true;this.burst(e.x,e.y,'#ffaa87',12);}if(this.boss&&!this.boss.dead&&hit(this.boss,this.player))this.player.damage(40,this);
 for(const p of this.powerups)if(hit(p,this.player))p.apply(this.player,this);
 this.particles.forEach(p=>p.update(dt));this.enemies=this.enemies.filter(e=>!e.dead);this.bullets=this.bullets.filter(b=>!b.dead);this.powerups=this.powerups.filter(p=>!p.dead);this.particles=this.particles.filter(p=>p.life>0);}
 draw(){ctx.save();if(this.shake)ctx.translate(rand(-this.shake,this.shake),rand(-this.shake,this.shake));this.background.draw();if(this.pulse){ctx.fillStyle='#ffb76044';ctx.fillRect(0,30,W,H-30);}this.obstacles.forEach(o=>o.draw());this.powerups.forEach(p=>p.draw());this.enemies.forEach(e=>e.draw());if(this.boss)this.boss.draw();this.bullets.forEach(b=>b.draw());this.particles.forEach(p=>p.draw());if(this.state==='MENU'){const old=this.player.y;this.player.y=143+Math.sin(this.background.time*2)*5;this.player.draw(this.background.time);this.player.y=old;}else this.player.draw(this.elapsed);ctx.restore();this.ui.draw();}
 frame(t){const dt=Math.min((t-this.last)/1000,.033);this.last=t;if(this.state==='MENU')this.background.update(dt);this.update(dt);this.draw();requestAnimationFrame(t=>this.frame(t));}
}
const game=new Game();
