(() => {
      const root=document.getElementById('mv96'), canvas=root.querySelector('#mvCanvas'), ctx=canvas.getContext('2d');
      const menu=root.querySelector('#mvMenu'), start=root.querySelector('#mvStart'), pauseBtn=root.querySelector('#mvPause'), soundBtn=root.querySelector('#mvSound');
      const cashEl=root.querySelector('#mvCash'), healthEl=root.querySelector('#mvHealth'), wantedEl=root.querySelector('#mvWanted'), speedEl=root.querySelector('#mvSpeed');
      const missionTitle=root.querySelector('#mvMissionTitle'), missionText=root.querySelector('#mvMissionText');
      const joystick=root.querySelector('#mvJoystick'), joystickKnob=joystick.querySelector('.knob');
      const WORLD=2700, GRID=300, ROAD=96, TAU=Math.PI*2, keys={};
      const C={grass:'#173029',grass2:'#1c382f',road:'#27313a',edge:'#111a21',lane:'rgba(247,246,246,.23)',building:'#16232d',roof:'#263a49',green:'#39E072',purple:'#9E42E7',white:'#f7f6f6',red:'#ff5d73',blue:'#4da3ff',yellow:'#ffd166'};
      let running=false, paused=false, last=performance.now(), time=0, sound=true, ac=null, note='', noteTime=0, spawnClock=0;
      let viewW=960,viewH=600,pixelRatio=1;
      const coarsePointer=matchMedia('(pointer:coarse)');
      function mobileMode(){return coarsePointer.matches||viewW<700}
      let missionState='pickup', missionNo=0, mission=makeMission();
      const p={x:1524,y:1500,a:-Math.PI/2,v:0,w:30,h:50,hp:100,cash:0,heat:0,wanted:0,hit:0};
      const cam={x:p.x,y:p.y,z:1};
      const traffic=[], police=[], particles=[];

      function rnd(a,b){return Math.random()*(b-a)+a}
      function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
      function lerp(a,b,t){return a+(b-a)*t}
      function d(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by)}
      function center(v){return Math.round(v/GRID)*GRID}
      function road(x,y){return Math.abs(x-center(x))<ROAD/2||Math.abs(y-center(y))<ROAD/2}
      function roadPoint(){
        const vert=Math.random()<.5,line=Math.floor(rnd(1,WORLD/GRID-1))*GRID,along=rnd(100,WORLD-100),lane=(Math.random()<.5?-1:1)*ROAD*.23;
        return vert?{x:line+lane,y:along,a:lane<0?Math.PI/2:-Math.PI/2}:{x:along,y:line+lane,a:lane<0?0:Math.PI};
      }
      function makeMission(){let a=roadPoint(),b=roadPoint();while(d(a.x,a.y,b.x,b.y)<850)b=roadPoint();return{pick:a,drop:b,reward:Math.round(rnd(180,410)/10)*10}}
      function makeCar(){const q=roadPoint(),pal=['#ef476f','#ffd166','#06d6a0','#8ecae6','#f7f6f6','#9E42E7','#ff9f1c'];return{x:q.x,y:q.y,a:q.a,v:rnd(55,100),w:27,h:45,c:pal[Math.floor(rnd(0,pal.length))],turn:rnd(0,3)}}
      function reset(){
        Object.assign(p,{x:1524,y:1500,a:-Math.PI/2,v:0,hp:100,cash:0,heat:0,wanted:0,hit:0});
        traffic.length=police.length=particles.length=0;
        for(let i=0,n=mobileMode()?18:25;i<n;i++)traffic.push(makeCar());
        cam.x=p.x;cam.y=p.y;missionState='pickup';missionNo=0;mission=makeMission();running=true;paused=false;menu.hidden=true;root.classList.remove('menu-open');pauseBtn.textContent='Pauze';updateMission();
      }
      function tone(f,dur=.08,type='square',vol=.025){
        if(!sound)return;
        if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();
        if(ac.state==='suspended')ac.resume();
        const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(vol,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+dur);
      }
      function notify(t,s=1.8){note=t;noteTime=s}
      function wanted(x){p.heat=clamp(p.heat+x,0,5.8);p.wanted=Math.min(5,Math.ceil(p.heat))}
      function burst(x,y,c,n=10){for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(30,120);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,t:rnd(.3,.7),m:.7,c})}}
      function damage(n,msg){
        const now=performance.now();if(now-p.hit<130)return;p.hit=now;p.hp=clamp(p.hp-n,0,100);p.v*=-.22;notify(msg);tone(75,.12,'sawtooth',.04);burst(p.x,p.y,C.red,8);if(navigator.vibrate)navigator.vibrate(22);
        if(p.hp<=0){running=false;menu.hidden=false;root.classList.add('menu-open');root.querySelector('h2').innerHTML='RIT <em>MISLUKT</em>';root.querySelector('.panel p').textContent=`Je verdiende € ${p.cash}. Start opnieuw voor een nieuwe poging.`;start.textContent='Opnieuw starten'}
      }
      function spawnPolice(){
        const q=roadPoint();police.push({x:q.x,y:q.y,a:Math.atan2(p.y-q.y,p.x-q.x),v:60,w:29,h:48,s:rnd(0,TAU),hit:0});tone(420);setTimeout(()=>tone(650),80)
      }
      function updateMission(){
        const names=['Nachtkoerier','Snelle levering','Onopvallend transport','Laatste ronde'];
        missionTitle.textContent=names[missionNo%names.length];
        missionText.textContent=missionState==='pickup'?`Rijd naar de paarse marker. Beloning vanaf € ${mission.reward}.`:'Breng het pakket naar de groene marker.';
      }
      function update(dt){
        time+=dt;noteTime=Math.max(0,noteTime-dt);spawnClock-=dt;
        const gas=keys.ArrowUp||keys.KeyW, back=keys.ArrowDown||keys.KeyS, left=keys.ArrowLeft||keys.KeyA, right=keys.ArrowRight||keys.KeyD, hand=keys.Space;
        const on=road(p.x,p.y),acc=on?235:115,max=on?285:150;
        if(gas)p.v+=acc*dt;if(back)p.v-=acc*.75*dt;
        p.v*=Math.max(0,1-(hand?3.6:on?1.05:2.35)*dt);p.v=clamp(p.v,-95,max);
        const steer=(right?1:0)-(left?1:0),scale=clamp(Math.abs(p.v)/85,0,1.2);
        if(Math.abs(p.v)>4)p.a+=steer*(hand?2.5:1.75)*scale*dt*Math.sign(p.v);
        p.x=clamp(p.x+Math.cos(p.a)*p.v*dt,22,WORLD-22);p.y=clamp(p.y+Math.sin(p.a)*p.v*dt,22,WORLD-22);

        for(const c of traffic){
          c.turn-=dt;
          if(Math.abs(c.x-center(c.x))<7&&Math.abs(c.y-center(c.y))<7&&c.turn<=0&&Math.random()<.035){c.a+=(Math.random()<.5?-1:1)*Math.PI/2;c.turn=2}
          c.x+=Math.cos(c.a)*c.v*dt;c.y+=Math.sin(c.a)*c.v*dt;
          if(c.x<-60)c.x=WORLD+60;if(c.x>WORLD+60)c.x=-60;if(c.y<-60)c.y=WORLD+60;if(c.y>WORLD+60)c.y=-60;
          if(d(c.x,c.y,p.x,p.y)<31){const impact=Math.abs(p.v-c.v*Math.cos(c.a-p.a));damage(clamp(impact/42,2,10),'Botsing');c.v*=.72;if(impact>115)wanted(.5)}
        }

        spawnClock-=dt;
        if(p.wanted>0&&police.length<p.wanted+1&&spawnClock<=0){spawnPolice();spawnClock=Math.max(1.7,5-p.wanted*.55)}
        for(let i=police.length-1;i>=0;i--){
          const c=police[i];c.hit-=dt;c.s+=dt*8;const target=Math.atan2(p.y-c.y,p.x-c.x),diff=Math.atan2(Math.sin(target-c.a),Math.cos(target-c.a));c.a+=clamp(diff,-1.8*dt,1.8*dt);c.v=lerp(c.v,(road(c.x,c.y)?215:145)+p.wanted*18,1.4*dt);c.x+=Math.cos(c.a)*c.v*dt;c.y+=Math.sin(c.a)*c.v*dt;
          if(d(c.x,c.y,p.x,p.y)<35&&c.hit<=0){c.hit=.75;damage(8,'Politiecontact')}
          if(p.wanted===0&&d(c.x,c.y,p.x,p.y)>900)police.splice(i,1)
        }

        if(p.heat>0){const near=police.some(c=>d(c.x,c.y,p.x,p.y)<500);p.heat=Math.max(0,p.heat-(near ? .006 : .045)*dt);p.wanted=Math.min(5,Math.ceil(p.heat))}
        const target=missionState==='pickup'?mission.pick:mission.drop;
        if(d(p.x,p.y,target.x,target.y)<52){
          if(missionState==='pickup'){missionState='drop';wanted(.65+missionNo*.08);notify('Pakket opgehaald');tone(720);setTimeout(()=>tone(940,.12),90)}
          else{p.cash+=mission.reward;p.hp=Math.min(100,p.hp+8);missionNo++;missionState='pickup';mission=makeMission();p.heat=Math.max(0,p.heat-.7);p.wanted=Math.ceil(p.heat);notify(`Opdracht voltooid, € ${mission.reward}`,2.2);burst(p.x,p.y,C.green,18);tone(540,.1,'triangle');setTimeout(()=>tone(780,.13,'triangle'),100);if(navigator.vibrate)navigator.vibrate([25,35,45])}
          updateMission()
        }
        for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.t-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.96;q.vy*=.96;if(q.t<=0)particles.splice(i,1)}
        cam.x=lerp(cam.x,p.x,5*dt);cam.y=lerp(cam.y,p.y,5*dt);
        cashEl.textContent=`€ ${p.cash}`;healthEl.textContent=`${Math.round(p.hp)}%`;wantedEl.textContent='★'.repeat(p.wanted)+'☆'.repeat(5-p.wanted);speedEl.textContent=`${Math.round(Math.abs(p.v)*.72)} km/u`;
      }
      function resize(){
        const r=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
        viewW=w;viewH=h;pixelRatio=d;
        const bw=Math.max(1,Math.round(w*d)),bh=Math.max(1,Math.round(h*d));
        if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh}
        ctx.setTransform(d,0,0,d,0,0);
      }
      function screen(x,y){return{x:(x-cam.x)*cam.z+viewW/2,y:(y-cam.y)*cam.z+viewH/2}}
      function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
      function world(){
        ctx.fillStyle=C.grass;ctx.fillRect(0,0,viewW,viewH);
        const L=cam.x-viewW/2-100,R=cam.x+viewW/2+100,T=cam.y-viewH/2-100,B=cam.y+viewH/2+100;
        for(let gx=Math.floor(L/GRID)-1;gx<=Math.ceil(R/GRID);gx++)for(let gy=Math.floor(T/GRID)-1;gy<=Math.ceil(B/GRID);gy++){
          const x=gx*GRID+ROAD/2,y=gy*GRID+ROAD/2,w=GRID-ROAD,h=GRID-ROAD,s=screen(x,y),seed=Math.abs((gx*73856093)^(gy*19349663));
          ctx.fillStyle=(gx+gy)%2?C.grass:C.grass2;ctx.fillRect(s.x,s.y,w,h);
          const ix=22+seed%20,iy=24+(seed>>2)%22,bw=w-ix-28,bh=h-iy-26,bs=screen(x+ix,y+iy);
          ctx.fillStyle=C.edge;ctx.fillRect(bs.x+8,bs.y+8,bw,bh);ctx.fillStyle=C.roof;ctx.fillRect(bs.x,bs.y,bw,bh);
          ctx.fillStyle='rgba(255,209,102,.23)';for(let wx=12;wx<bw-10;wx+=42)for(let wy=12;wy<bh-10;wy+=42)if((seed+wx+wy)%5===0)ctx.fillRect(bs.x+wx,bs.y+wy,8,8)
        }
        ctx.fillStyle=C.edge;
        for(let x=Math.floor(L/GRID)*GRID;x<=R;x+=GRID){const s=screen(x-ROAD/2-4,T);ctx.fillRect(s.x,0,ROAD+8,viewH)}
        for(let y=Math.floor(T/GRID)*GRID;y<=B;y+=GRID){const s=screen(L,y-ROAD/2-4);ctx.fillRect(0,s.y,viewW,ROAD+8)}
        ctx.fillStyle=C.road;
        for(let x=Math.floor(L/GRID)*GRID;x<=R;x+=GRID){const s=screen(x-ROAD/2,T);ctx.fillRect(s.x,0,ROAD,viewH)}
        for(let y=Math.floor(T/GRID)*GRID;y<=B;y+=GRID){const s=screen(L,y-ROAD/2);ctx.fillRect(0,s.y,viewW,ROAD)}
        ctx.strokeStyle=C.lane;ctx.lineWidth=2;ctx.setLineDash([15,15]);
        for(let x=Math.floor(L/GRID)*GRID;x<=R;x+=GRID){const s=screen(x,T);ctx.beginPath();ctx.moveTo(s.x,0);ctx.lineTo(s.x,viewH);ctx.stroke()}
        for(let y=Math.floor(T/GRID)*GRID;y<=B;y+=GRID){const s=screen(L,y);ctx.beginPath();ctx.moveTo(0,s.y);ctx.lineTo(viewW,s.y);ctx.stroke()}ctx.setLineDash([])
      }
      function marker(q,c,label){const s=screen(q.x,q.y),pulse=1+Math.sin(time*4)*.12;ctx.save();ctx.translate(s.x,s.y);ctx.strokeStyle=c;ctx.lineWidth=5;ctx.globalAlpha=.35;ctx.beginPath();ctx.arc(0,0,40*pulse,0,TAU);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=c;ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.fillText(label,0,-50);ctx.restore()}
      function car(c,player=false,cop=false){const s=screen(c.x,c.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(c.a+Math.PI/2);ctx.fillStyle='rgba(0,0,0,.35)';rr(-c.w/2+4,-c.h/2+6,c.w,c.h,6);ctx.fill();ctx.fillStyle=cop?C.white:player?C.green:c.c;rr(-c.w/2,-c.h/2,c.w,c.h,6);ctx.fill();ctx.fillStyle='#09131b';rr(-c.w*.32,-c.h*.18,c.w*.64,c.h*.34,3);ctx.fill();ctx.fillStyle=C.red;ctx.fillRect(-c.w*.28,c.h*.36,c.w*.2,4);ctx.fillRect(c.w*.08,c.h*.36,c.w*.2,4);if(cop){ctx.fillStyle=Math.sin(c.s)>0?C.blue:C.red;ctx.fillRect(-9,-4,8,5);ctx.fillStyle=Math.sin(c.s)>0?C.red:C.blue;ctx.fillRect(1,-4,8,5)}if(player){ctx.strokeStyle=C.white;ctx.lineWidth=2;rr(-c.w/2,-c.h/2,c.w,c.h,6);ctx.stroke()}ctx.restore()}
      function minimap(){
        const mobile=mobileMode(),size=mobile?88:Math.min(135,viewW*.19),x=viewW-size-12,y=mobile?72:viewH-size-12,k=size/WORLD;
        ctx.save();ctx.fillStyle='rgba(13,24,33,.82)';rr(x,y,size,size,12);ctx.fill();ctx.strokeStyle='rgba(216,219,226,.16)';ctx.stroke();ctx.beginPath();ctx.roundRect(x,y,size,size,12);ctx.clip();ctx.strokeStyle='rgba(216,219,226,.13)';ctx.lineWidth=Math.max(1,ROAD*k*.55);
        for(let i=0;i<=WORLD;i+=GRID){ctx.beginPath();ctx.moveTo(x+i*k,y);ctx.lineTo(x+i*k,y+size);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y+i*k);ctx.lineTo(x+size,y+i*k);ctx.stroke()}
        const t=missionState==='pickup'?mission.pick:mission.drop;ctx.fillStyle=missionState==='pickup'?C.purple:C.green;ctx.beginPath();ctx.arc(x+t.x*k,y+t.y*k,4,0,TAU);ctx.fill();ctx.fillStyle=C.white;ctx.beginPath();ctx.arc(x+p.x*k,y+p.y*k,4,0,TAU);ctx.fill();for(const q of police){ctx.fillStyle=C.blue;ctx.fillRect(x+q.x*k-1,y+q.y*k-1,3,3)}ctx.restore()
      }
      function draw(){
        resize();ctx.clearRect(0,0,viewW,viewH);world();const t=missionState==='pickup'?mission.pick:mission.drop;marker(t,missionState==='pickup'?C.purple:C.green,missionState==='pickup'?'PAKKET':'LEVERING');for(const c of traffic)car(c);for(const c of police)car(c,false,true);car(p,true);
        for(const q of particles){ctx.globalAlpha=clamp(q.t/q.m,0,1);ctx.fillStyle=q.c;const s=screen(q.x,q.y);ctx.fillRect(s.x,s.y,4,4)}ctx.globalAlpha=1;minimap();
        if(noteTime>0){ctx.font='700 15px system-ui';const w=Math.min(viewW-30,ctx.measureText(note).width+34),x=(viewW-w)/2,y=viewH*.18;ctx.fillStyle='rgba(13,24,33,.9)';rr(x,y,w,40,12);ctx.fill();ctx.strokeStyle='rgba(57,224,114,.45)';ctx.stroke();ctx.fillStyle=C.white;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(note,viewW/2,y+20)}
      }
      function loop(now){const dt=Math.min(.033,(now-last)/1000||0);last=now;if(running&&!paused)update(dt);draw();requestAnimationFrame(loop)}
      function togglePause(){if(!running)return;paused=!paused;pauseBtn.textContent=paused?'Doorgaan':'Pauze';menu.hidden=!paused;root.classList.toggle('menu-open',paused);if(paused){root.querySelector('h2').innerHTML='SPEL <em>GEPAUZEERD</em>';root.querySelector('.panel p').textContent='Gebruik de knop hieronder om verder te gaan.';start.textContent='Verder spelen'}}
      const joy={active:false,pointerId:null,max:0,dx:0,dy:0};
      function setSteerFromJoystick(dx,dy){
        joy.dx=dx;joy.dy=dy;
        const threshold=Math.max(10,joy.max*.18);
        keys.ArrowLeft=dx<-threshold;
        keys.ArrowRight=dx>threshold;
      }
      function resetJoystick(){
        joy.active=false;joy.pointerId=null;joy.dx=0;joy.dy=0;
        keys.ArrowLeft=false;keys.ArrowRight=false;
        joystick.classList.remove('active');
        joystickKnob.style.transform='translate(0px,0px)';
      }
      function moveJoystick(clientX,clientY){
        const rect=joystick.getBoundingClientRect();
        const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
        const max=rect.width*.28;
        joy.max=max;
        let dx=clientX-cx, dy=clientY-cy;
        const dist=Math.hypot(dx,dy);
        if(dist>max){const scale=max/dist;dx*=scale;dy*=scale}
        joystickKnob.style.transform=`translate(${dx}px,${dy}px)`;
        setSteerFromJoystick(dx,dy);
      }
      const joyStart=e=>{
        e.preventDefault();
        joy.active=true;joy.pointerId=e.pointerId;joystick.classList.add('active');
        try{joystick.setPointerCapture(e.pointerId)}catch(_){}
        moveJoystick(e.clientX,e.clientY);
      };
      const joyMove=e=>{if(!joy.active||e.pointerId!==joy.pointerId)return;e.preventDefault();moveJoystick(e.clientX,e.clientY)};
      const joyEnd=e=>{if(joy.pointerId!==null&&e.pointerId!==joy.pointerId)return;e.preventDefault();resetJoystick()};
      joystick.addEventListener('pointerdown',joyStart,{passive:false});
      joystick.addEventListener('pointermove',joyMove,{passive:false});
      joystick.addEventListener('pointerup',joyEnd,{passive:false});
      joystick.addEventListener('pointercancel',joyEnd,{passive:false});
      joystick.addEventListener('lostpointercapture',joyEnd,{passive:false});
      window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='KeyP')togglePause();if(e.code==='KeyM'){sound=!sound;soundBtn.textContent=`Geluid ${sound?'aan':'uit'}`}}, {passive:false});
      window.addEventListener('keyup',e=>keys[e.code]=false);
      root.querySelectorAll('[data-k]').forEach(b=>{
        const k=b.dataset.k;
        const on=e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}keys[k]=true;b.classList.add('is-pressed')};
        const off=e=>{e.preventDefault();keys[k]=false;b.classList.remove('is-pressed')};
        b.addEventListener('pointerdown',on,{passive:false});b.addEventListener('pointerup',off,{passive:false});b.addEventListener('pointercancel',off,{passive:false});b.addEventListener('lostpointercapture',off,{passive:false});
      });
      root.addEventListener('contextmenu',e=>e.preventDefault());
      root.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
      window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;root.querySelectorAll('.is-pressed').forEach(b=>b.classList.remove('is-pressed'));resetJoystick()});
      start.addEventListener('click',()=>{if(paused){paused=false;menu.hidden=true;root.classList.remove('menu-open');pauseBtn.textContent='Pauze'}else reset()});
      pauseBtn.addEventListener('click',togglePause);soundBtn.addEventListener('click',()=>{sound=!sound;soundBtn.textContent=`Geluid ${sound?'aan':'uit'}`});
      reset();running=false;menu.hidden=false;root.classList.add('menu-open');requestAnimationFrame(loop);
    })();