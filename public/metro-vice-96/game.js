(()=>{
  const root=document.getElementById('mv96');
  if(!root)return;

  const $=selector=>root.querySelector(selector);
  const canvas=$('#mvCanvas');
  const ctx=canvas.getContext('2d');
  const ui={
    menu:$('#mvMenu'),start:$('#mvStart'),pause:$('#mvPause'),sound:$('#mvSound'),
    cash:$('#mvCash'),health:$('#mvHealth'),wanted:$('#mvWanted'),speed:$('#mvSpeed'),
    missionTitle:$('#mvMissionTitle'),missionText:$('#mvMissionText'),
    joystick:$('#mvJoystick'),knob:$('#mvJoystick .knob')
  };

  const TAU=Math.PI*2;
  const ROAD_SCALE=1.15;
  const BUILDING_PADDING=15;
  const COLORS={
    land:'#173029',land2:'#1e3a31',road:'#2a3440',edge:'#111a21',lane:'rgba(247,246,246,.24)',
    water:'#071f38',water2:'#0d2a46',bank:'#123149',building:'#294151',industry:'#334a56',
    shop:'#3e5361',greenArea:'#214437',sport:'#14604e',white:'#f7f6f6',green:'#39E072',
    purple:'#9E42E7',red:'#ff5d73',blue:'#58a6ff'
  };

  const defaultMap=window.METRO_VICE_DEFAULT_MAP;
  let activeMap=JSON.parse(JSON.stringify(defaultMap));
  try{
    const saved=JSON.parse(localStorage.getItem('metroViceMap')||'null');
    if(saved&&saved.W&&saved.H&&saved.version===defaultMap.version)activeMap=saved;
  }catch(error){
    console.warn('Opgeslagen kaart kon niet worden geladen',error);
  }

  const {W,H,water,roads,labs,bld,pts}=activeMap;
  const parks=activeMap.parks||[];
  const spawnPoint=activeMap.spawn||[1295,960,0];
  const routes=(activeMap.loops||[]).map(points=>{
    const segments=[];
    let total=0;
    for(let index=0;index<points.length;index++){
      const a=points[index];
      const b=points[(index+1)%points.length];
      const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
      segments.push([a,b,length,total]);
      total+=length;
    }
    return {segments,total};
  });

  const keys={};
  const camera={x:spawnPoint[0],y:spawnPoint[1]};
  const player={
    x:spawnPoint[0],y:spawnPoint[1],a:spawnPoint[2]||0,v:0,hp:100,cash:0,heat:0,wanted:0,
    w:30,h:50,hitUntil:0
  };
  const traffic=[];
  const police=[];

  let viewWidth=960;
  let viewHeight=600;
  let lastFrame=performance.now();
  let running=false;
  let paused=false;
  let soundEnabled=true;
  let audioContext;
  let notice='';
  let noticeTime=0;
  let mission;
  let missionStage='pickup';
  let missionCount=0;
  let policeSpawnTimer=0;

  const random=(min,max)=>Math.random()*(max-min)+min;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const mix=(a,b,t)=>a+(b-a)*t;
  const distance=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);

  function pointInPolygon(x,y,polygon){
    let inside=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const xi=polygon[i][0],yi=polygon[i][1];
      const xj=polygon[j][0],yj=polygon[j][1];
      if(((yi>y)!=(yj>y))&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
    }
    return inside;
  }

  function inWater(x,y){
    return water.some(polygon=>pointInPolygon(x,y,polygon));
  }

  function inBuilding(x,y,padding=BUILDING_PADDING){
    return bld.some(building=>{
      const [bx,by,width,height]=building;
      return x>=bx-padding&&x<=bx+width+padding&&y>=by-padding&&y<=by+height+padding;
    });
  }

  function blocked(x,y,padding=BUILDING_PADDING){
    return inWater(x,y)||inBuilding(x,y,padding);
  }

  function segmentDistance(x,y,a,b){
    const vx=b[0]-a[0];
    const vy=b[1]-a[1];
    const lengthSquared=vx*vx+vy*vy;
    const t=lengthSquared?clamp(((x-a[0])*vx+(y-a[1])*vy)/lengthSquared,0,1):0;
    return distance(x,y,a[0]+vx*t,a[1]+vy*t);
  }

  function onRoad(x,y){
    let nearest=Infinity;
    let width=0;
    for(const road of roads){
      for(let index=0;index<road[2].length-1;index++){
        const current=segmentDistance(x,y,road[2][index],road[2][index+1]);
        if(current<nearest){
          nearest=current;
          width=road[1]*ROAD_SCALE;
        }
      }
    }
    return nearest<width*.54;
  }

  function routePosition(route,offset,lane=0){
    offset=((offset%route.total)+route.total)%route.total;
    const segment=route.segments.find(item=>offset>=item[3]&&offset<=item[3]+item[2])||route.segments[0];
    const t=clamp((offset-segment[3])/segment[2],0,1);
    const angle=Math.atan2(segment[1][1]-segment[0][1],segment[1][0]-segment[0][0]);
    return {
      x:mix(segment[0][0],segment[1][0],t)-Math.sin(angle)*lane,
      y:mix(segment[0][1],segment[1][1],t)+Math.cos(angle)*lane,
      a:angle
    };
  }

  function missionPoint(){
    const point=pts[Math.floor(Math.random()*pts.length)];
    return {x:point[0]+random(-8,8),y:point[1]+random(-8,8),name:point[2]};
  }

  function createMission(){
    let pickup=missionPoint();
    let delivery=missionPoint();
    while(distance(pickup.x,pickup.y,delivery.x,delivery.y)<500)delivery=missionPoint();
    return {pickup,delivery,pay:Math.round(random(22,48))*10};
  }

  function createTrafficCar(){
    const route=routes[Math.floor(Math.random()*routes.length)];
    const offset=random(0,route.total);
    const lane=Math.random()<.5?-14:14;
    const position=routePosition(route,offset,lane);
    const cruiseSpeed=random(60,96);
    const colors=['#ef476f','#ffd166','#06d6a0','#8ecae6','#f7f6f6','#9E42E7'];
    return {
      route,offset,lane,x:position.x,y:position.y,a:position.a,v:cruiseSpeed,cruiseSpeed,
      c:colors[Math.floor(Math.random()*colors.length)],w:27,h:45,collisionCooldown:0
    };
  }

  function spawnPolice(){
    const route=routes[Math.floor(Math.random()*routes.length)];
    const position=routePosition(route,random(0,route.total));
    police.push({x:position.x,y:position.y,a:position.a,v:70,s:0,w:29,h:48,cooldown:0});
    beep(420);
    setTimeout(()=>beep(620),70);
  }

  function say(text,seconds=1.6){
    notice=text;
    noticeTime=seconds;
  }

  function beep(frequency,duration=.08,type='square',volume=.02){
    if(!soundEnabled)return;
    audioContext||(audioContext=new(window.AudioContext||window.webkitAudioContext)());
    if(audioContext.state==='suspended')audioContext.resume();
    const oscillator=audioContext.createOscillator();
    const gain=audioContext.createGain();
    oscillator.type=type;
    oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(volume,audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime+duration);
  }

  function finishRun(title,text){
    running=false;
    ui.menu.hidden=false;
    root.classList.add('menu-open');
    root.querySelector('h2').innerHTML=title;
    root.querySelector('.panel p').textContent=text;
    ui.start.textContent='Opnieuw starten';
  }

  function damage(amount,message){
    const now=performance.now();
    if(now<player.hitUntil)return;
    player.hitUntil=now+240;
    player.hp=clamp(player.hp-amount,0,100);
    player.v*=-.24;
    say(message);
    beep(80,.1,'sawtooth',.04);
    if(navigator.vibrate)navigator.vibrate(18);
    if(player.hp<=0)finishRun('RIT <em>MISLUKT</em>',`Je verdiende € ${player.cash}.`);
  }

  function waterCollision(previousX,previousY){
    player.x=previousX;
    player.y=previousY;
    player.v*=-.35;
    player.hp=clamp(player.hp-16,0,100);
    say('Water, niet berijdbaar');
    beep(120,.2,'triangle',.04);
    if(navigator.vibrate)navigator.vibrate([25,35,25]);
    if(player.hp<=0)finishRun('AUTO <em>GEZONKEN</em>',`Je verdiende € ${player.cash}.`);
  }

  function buildingCollision(previousX,previousY){
    player.x=previousX;
    player.y=previousY;
    if(Math.abs(player.v)>28)damage(4,'Botsing met gebouw');
    else say('Hier staat een gebouw',.8);
    player.v*=-.28;
  }

  function updateMissionText(){
    const names=['Boulevard-run','Essendaal Grid','Oostkade Koerier','Droespolder Drop'];
    ui.missionTitle.textContent=names[missionCount%names.length];
    ui.missionText.textContent=missionStage==='pickup'
      ?`Rijd naar ${mission.pickup.name}, beloning € ${mission.pay}.`
      :`Lever af bij ${mission.delivery.name}.`;
  }

  function reset(){
    Object.assign(player,{
      x:spawnPoint[0],y:spawnPoint[1],a:spawnPoint[2]||0,v:0,hp:100,cash:0,heat:0,wanted:0,hitUntil:0
    });
    traffic.length=0;
    police.length=0;
    const trafficCount=matchMedia('(pointer:coarse)').matches?16:22;
    for(let index=0;index<trafficCount;index++)traffic.push(createTrafficCar());
    mission=createMission();
    missionStage='pickup';
    missionCount=0;
    running=true;
    paused=false;
    camera.x=player.x;
    camera.y=player.y;
    ui.menu.hidden=true;
    root.classList.remove('menu-open');
    ui.pause.textContent='Pauze';
    updateMissionText();
  }

  function updateTraffic(dt){
    for(const car of traffic){
      car.collisionCooldown=Math.max(0,car.collisionCooldown-dt);
      const currentGap=distance(car.x,car.y,player.x,player.y);
      const relativeX=player.x-car.x;
      const relativeY=player.y-car.y;
      const playerAhead=relativeX*Math.cos(car.a)+relativeY*Math.sin(car.a)>0;

      let desiredSpeed=car.cruiseSpeed;
      if(playerAhead&&currentGap<155)desiredSpeed=0;
      car.v=mix(car.v,desiredSpeed,clamp(dt*(desiredSpeed?2.7:9),0,1));

      const nextOffset=(car.offset+car.v*dt)%car.route.total;
      const next=routePosition(car.route,nextOffset,car.lane);
      const nextGap=distance(next.x,next.y,player.x,player.y);

      if((nextGap<44&&currentGap>=44)||inBuilding(next.x,next.y,10)||inWater(next.x,next.y)){
        car.v=0;
      }else{
        car.offset=nextOffset;
        car.x=next.x;
        car.y=next.y;
        car.a=next.a;
      }

      const gap=distance(car.x,car.y,player.x,player.y);
      if(gap<32){
        if(Math.abs(player.v)>38&&car.collisionCooldown<=0){
          car.collisionCooldown=.65;
          damage(clamp(Math.abs(player.v)/44,2,9),'Botsing');
          if(Math.abs(player.v)>110)player.heat=clamp(player.heat+.5,0,5.8);
        }else if(Math.abs(player.v)<18){
          car.offset=(car.offset-34+car.route.total)%car.route.total;
          const moved=routePosition(car.route,car.offset,car.lane);
          car.x=moved.x;
          car.y=moved.y;
          car.a=moved.a;
          car.v=0;
        }
      }
    }
  }

  function updatePolice(dt){
    if(player.wanted>0&&police.length<player.wanted+1&&policeSpawnTimer<=0){
      spawnPolice();
      policeSpawnTimer=Math.max(1.6,5-player.wanted*.6);
    }

    for(let index=police.length-1;index>=0;index--){
      const car=police[index];
      const targetAngle=Math.atan2(player.y-car.y,player.x-car.x);
      const difference=Math.atan2(Math.sin(targetAngle-car.a),Math.cos(targetAngle-car.a));
      car.a+=clamp(difference,-1.8*dt,1.8*dt);
      car.v=mix(car.v,(onRoad(car.x,car.y)?210:130)+player.wanted*20,1.5*dt);

      const nextX=clamp(car.x+Math.cos(car.a)*car.v*dt,16,W-16);
      const nextY=clamp(car.y+Math.sin(car.a)*car.v*dt,16,H-16);
      if(blocked(nextX,nextY,12)){
        car.a+=1.1;
        car.v*=.35;
      }else{
        car.x=nextX;
        car.y=nextY;
      }

      car.s+=dt*8;
      car.cooldown=Math.max(0,car.cooldown-dt);
      if(distance(car.x,car.y,player.x,player.y)<35&&car.cooldown<=0){
        car.cooldown=.7;
        damage(8,'Politiecontact');
      }
      if(player.wanted===0&&distance(car.x,car.y,player.x,player.y)>900)police.splice(index,1);
    }
  }

  function update(dt){
    noticeTime=Math.max(0,noticeTime-dt);
    policeSpawnTimer-=dt;

    const gas=keys.ArrowUp||keys.KeyW;
    const brake=keys.ArrowDown||keys.KeyS;
    const left=keys.ArrowLeft||keys.KeyA;
    const right=keys.ArrowRight||keys.KeyD;
    const drift=keys.Space;
    const road=onRoad(player.x,player.y);

    player.v+=(gas?1:0)*(road?235:95)*dt-(brake?1:0)*(road?170:80)*dt;
    player.v*=Math.max(0,1-(drift?3.7:road?1:2.6)*dt);
    player.v=clamp(player.v,-90,road?280:115);

    if(Math.abs(player.v)>3){
      const steer=(right?1:0)-(left?1:0);
      player.a+=steer*(drift?2.5:1.8)*clamp(Math.abs(player.v)/90,0,1.2)*dt*Math.sign(player.v);
    }

    const previousX=player.x;
    const previousY=player.y;
    const nextX=clamp(player.x+Math.cos(player.a)*player.v*dt,16,W-16);
    const nextY=clamp(player.y+Math.sin(player.a)*player.v*dt,16,H-16);

    if(inWater(nextX,nextY))waterCollision(previousX,previousY);
    else if(inBuilding(nextX,nextY))buildingCollision(previousX,previousY);
    else{
      player.x=nextX;
      player.y=nextY;
    }

    updateTraffic(dt);
    updatePolice(dt);

    if(player.heat>0){
      const nearby=police.some(car=>distance(car.x,car.y,player.x,player.y)<500);
      player.heat=Math.max(0,player.heat-(nearby?.006:.045)*dt);
      player.wanted=Math.min(5,Math.ceil(player.heat));
    }

    const target=missionStage==='pickup'?mission.pickup:mission.delivery;
    if(distance(player.x,player.y,target.x,target.y)<52){
      if(missionStage==='pickup'){
        missionStage='delivery';
        player.heat=clamp(player.heat+.7,0,5.8);
        player.wanted=Math.ceil(player.heat);
        say('Pakket opgehaald');
        beep(720);
        setTimeout(()=>beep(920,.12),90);
      }else{
        const pay=mission.pay;
        player.cash+=pay;
        player.hp=Math.min(100,player.hp+8);
        player.heat=Math.max(0,player.heat-.7);
        player.wanted=Math.ceil(player.heat);
        missionCount++;
        mission=createMission();
        missionStage='pickup';
        say(`Opdracht voltooid, € ${pay}`,2);
        beep(540,.1,'triangle');
        setTimeout(()=>beep(780,.13,'triangle'),100);
      }
      updateMissionText();
    }

    camera.x=mix(camera.x,player.x,5*dt);
    camera.y=mix(camera.y,player.y,5*dt);
    ui.cash.textContent=`€ ${player.cash}`;
    ui.health.textContent=`${Math.round(player.hp)}%`;
    ui.wanted.textContent='★'.repeat(player.wanted)+'☆'.repeat(5-player.wanted);
    ui.speed.textContent=`${Math.round(Math.abs(player.v)*.72)} km/u`;
  }

  function resize(){
    const bounds=canvas.getBoundingClientRect();
    const ratio=Math.min(2,devicePixelRatio||1);
    viewWidth=Math.max(1,Math.round(bounds.width));
    viewHeight=Math.max(1,Math.round(bounds.height));
    if(canvas.width!==viewWidth*ratio||canvas.height!==viewHeight*ratio){
      canvas.width=viewWidth*ratio;
      canvas.height=viewHeight*ratio;
    }
    ctx.setTransform(ratio,0,0,ratio,0,0);
  }

  function screenPosition(x,y){
    return {x:x-camera.x+viewWidth/2,y:y-camera.y+viewHeight/2};
  }

  function drawPath(points){
    ctx.beginPath();
    points.forEach((point,index)=>{
      const screen=screenPosition(point[0],point[1]);
      if(index)ctx.lineTo(screen.x,screen.y);
      else ctx.moveTo(screen.x,screen.y);
    });
  }

  function drawCar(car,isPlayer=false,isPolice=false){
    const screen=screenPosition(car.x,car.y);
    const length=car.h;
    const breadth=car.w;
    ctx.save();
    ctx.translate(screen.x,screen.y);
    ctx.rotate(car.a);
    ctx.fillStyle='rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.roundRect(-length/2+5,-breadth/2+5,length,breadth,6);
    ctx.fill();
    ctx.fillStyle=isPolice?COLORS.white:isPlayer?COLORS.green:car.c;
    ctx.beginPath();
    ctx.roundRect(-length/2,-breadth/2,length,breadth,6);
    ctx.fill();
    ctx.fillStyle='#09131b';
    ctx.beginPath();
    ctx.roundRect(-length*.05,-breadth*.34,length*.3,breadth*.68,3);
    ctx.fill();
    ctx.fillStyle='#fff4b3';
    ctx.fillRect(length*.38,-breadth*.34,5,7);
    ctx.fillRect(length*.38,breadth*.34-7,5,7);
    ctx.fillStyle=COLORS.red;
    ctx.fillRect(-length*.48,-breadth*.34,4,7);
    ctx.fillRect(-length*.48,breadth*.34-7,4,7);
    if(isPolice){
      ctx.fillStyle=Math.sin(car.s)>0?COLORS.blue:COLORS.red;
      ctx.fillRect(-4,-9,5,8);
      ctx.fillStyle=Math.sin(car.s)>0?COLORS.red:COLORS.blue;
      ctx.fillRect(-4,1,5,8);
    }
    if(isPlayer){
      ctx.strokeStyle=COLORS.white;
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.roundRect(-length/2,-breadth/2,length,breadth,6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMinimap(){
    const mobile=matchMedia('(pointer:coarse)').matches||viewWidth<700;
    const size=mobile?88:130;
    const x=viewWidth-size-12;
    const y=mobile?72:viewHeight-size-12;
    const scaleX=size/W;
    const scaleY=size/H;

    ctx.save();
    ctx.fillStyle='rgba(13,24,33,.82)';
    ctx.beginPath();
    ctx.roundRect(x,y,size,size,12);
    ctx.fill();
    ctx.strokeStyle='rgba(216,219,226,.16)';
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(x,y,size,size,12);
    ctx.clip();

    for(const polygon of water){
      ctx.fillStyle=COLORS.water;
      ctx.beginPath();
      polygon.forEach((point,index)=>{
        const px=x+point[0]*scaleX;
        const py=y+point[1]*scaleY;
        if(index)ctx.lineTo(px,py);else ctx.moveTo(px,py);
      });
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle='rgba(216,219,226,.14)';
    for(const road of roads){
      ctx.beginPath();
      road[2].forEach((point,index)=>{
        const px=x+point[0]*scaleX;
        const py=y+point[1]*scaleY;
        if(index)ctx.lineTo(px,py);else ctx.moveTo(px,py);
      });
      ctx.lineWidth=Math.max(1,road[1]*ROAD_SCALE*Math.min(scaleX,scaleY)*.45);
      ctx.stroke();
    }

    const target=missionStage==='pickup'?mission.pickup:mission.delivery;
    ctx.fillStyle=missionStage==='pickup'?COLORS.purple:COLORS.green;
    ctx.beginPath();
    ctx.arc(x+target.x*scaleX,y+target.y*scaleY,4,0,TAU);
    ctx.fill();
    ctx.fillStyle=COLORS.white;
    ctx.beginPath();
    ctx.arc(x+player.x*scaleX,y+player.y*scaleY,4,0,TAU);
    ctx.fill();
    for(const car of police){
      ctx.fillStyle=COLORS.blue;
      ctx.fillRect(x+car.x*scaleX-1,y+car.y*scaleY-1,3,3);
    }
    ctx.restore();
  }

  function draw(){
    resize();
    ctx.clearRect(0,0,viewWidth,viewHeight);

    for(let x=0;x<viewWidth/120+2;x++){
      for(let y=0;y<viewHeight/120+2;y++){
        ctx.fillStyle=(x+y)%2?COLORS.land:COLORS.land2;
        ctx.fillRect(x*120,y*120,120,120);
      }
    }

    for(const polygon of water){
      ctx.fillStyle=polygon===water[0]?COLORS.water:COLORS.water2;
      ctx.beginPath();
      polygon.forEach((point,index)=>{
        const screen=screenPosition(point[0],point[1]);
        if(index)ctx.lineTo(screen.x,screen.y);else ctx.moveTo(screen.x,screen.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle=COLORS.bank;
      ctx.lineWidth=7;
      ctx.stroke();
    }

    for(const park of parks){
      const screen=screenPosition(park[0],park[1]);
      ctx.fillStyle=park[4]==='sport'?COLORS.sport:park[4]==='bank'?'#183c35':COLORS.greenArea;
      ctx.fillRect(screen.x,screen.y,park[2],park[3]);
      if(park[4]==='sport'){
        ctx.strokeStyle='rgba(247,246,246,.22)';
        ctx.lineWidth=2;
        ctx.strokeRect(screen.x+10,screen.y+10,park[2]-20,park[3]-20);
        ctx.beginPath();
        ctx.moveTo(screen.x+park[2]/2,screen.y+10);
        ctx.lineTo(screen.x+park[2]/2,screen.y+park[3]-10);
        ctx.stroke();
      }
      if(park[5]){
        ctx.fillStyle='rgba(247,246,246,.75)';
        ctx.font='600 13px system-ui';
        ctx.fillText(park[5],screen.x+10,screen.y+22);
      }
    }

    ctx.lineCap='round';
    ctx.lineJoin='round';
    for(const road of roads){
      drawPath(road[2]);
      ctx.strokeStyle=COLORS.edge;
      ctx.lineWidth=road[1]*ROAD_SCALE+10;
      ctx.stroke();
    }
    for(const road of roads){
      drawPath(road[2]);
      ctx.strokeStyle=COLORS.road;
      ctx.lineWidth=road[1]*ROAD_SCALE;
      ctx.stroke();
    }
    ctx.save();
    ctx.strokeStyle=COLORS.lane;
    ctx.lineWidth=2;
    ctx.setLineDash([14,14]);
    for(const road of roads){
      drawPath(road[2]);
      ctx.stroke();
    }
    ctx.restore();

    for(const building of bld){
      const screen=screenPosition(building[0],building[1]);
      ctx.fillStyle=COLORS.edge;
      ctx.fillRect(screen.x+6,screen.y+6,building[2],building[3]);
      ctx.fillStyle=building[4]===1?COLORS.industry:building[4]===2?COLORS.shop:COLORS.building;
      ctx.fillRect(screen.x,screen.y,building[2],building[3]);
      if(building[5]){
        ctx.fillStyle='rgba(247,246,246,.72)';
        ctx.font='600 11px system-ui';
        ctx.fillText(building[5],screen.x+6,screen.y+16);
      }
    }

    ctx.save();
    ctx.fillStyle='rgba(247,246,246,.88)';
    ctx.font='600 14px system-ui';
    for(const label of labs){
      const screen=screenPosition(label[1],label[2]);
      ctx.save();
      ctx.translate(screen.x,screen.y);
      ctx.rotate(label[3]);
      ctx.fillText(label[0],0,0);
      ctx.restore();
    }
    ctx.restore();

    const target=missionStage==='pickup'?mission.pickup:mission.delivery;
    const marker=screenPosition(target.x,target.y);
    const pulse=1+Math.sin(performance.now()/260)*.12;
    ctx.save();
    ctx.translate(marker.x,marker.y);
    ctx.strokeStyle=missionStage==='pickup'?COLORS.purple:COLORS.green;
    ctx.lineWidth=5;
    ctx.globalAlpha=.35;
    ctx.beginPath();
    ctx.arc(0,0,40*pulse,0,TAU);
    ctx.stroke();
    ctx.globalAlpha=1;
    ctx.fillStyle=missionStage==='pickup'?COLORS.purple:COLORS.green;
    ctx.font='700 12px system-ui';
    ctx.textAlign='center';
    ctx.fillText(missionStage==='pickup'?'PAKKET':'LEVERING',0,-50);
    ctx.restore();

    for(const car of traffic)drawCar(car);
    for(const car of police)drawCar(car,false,true);
    drawCar(player,true,false);
    drawMinimap();

    if(noticeTime>0){
      ctx.font='700 15px system-ui';
      const width=Math.min(viewWidth-30,ctx.measureText(notice).width+34);
      const x=(viewWidth-width)/2;
      const y=viewHeight*.18;
      ctx.fillStyle='rgba(13,24,33,.9)';
      ctx.beginPath();
      ctx.roundRect(x,y,width,40,12);
      ctx.fill();
      ctx.strokeStyle='rgba(57,224,114,.45)';
      ctx.stroke();
      ctx.fillStyle=COLORS.white;
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.fillText(notice,viewWidth/2,y+20);
    }
  }

  function loop(now){
    const dt=Math.min(.033,(now-lastFrame)/1000||0);
    lastFrame=now;
    if(running&&!paused)update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function togglePause(){
    if(!running)return;
    paused=!paused;
    ui.pause.textContent=paused?'Doorgaan':'Pauze';
    ui.menu.hidden=!paused;
    root.classList.toggle('menu-open',paused);
    if(paused){
      root.querySelector('h2').innerHTML='SPEL <em>GEPAUZEERD</em>';
      root.querySelector('.panel p').textContent='Gebruik de knop hieronder om verder te gaan.';
      ui.start.textContent='Verder spelen';
    }
  }

  const joystick={id:null,max:0};
  if(ui.joystick){
    const resetJoystick=()=>{
      joystick.id=null;
      keys.ArrowLeft=false;
      keys.ArrowRight=false;
      ui.joystick.classList.remove('active');
      if(ui.knob)ui.knob.style.transform='translate(0px,0px)';
    };
    const moveJoystick=(clientX,clientY)=>{
      const bounds=ui.joystick.getBoundingClientRect();
      const centerX=bounds.left+bounds.width/2;
      const centerY=bounds.top+bounds.height/2;
      const max=bounds.width*.28;
      let dx=clientX-centerX;
      let dy=clientY-centerY;
      const magnitude=Math.hypot(dx,dy);
      joystick.max=max;
      if(magnitude>max){dx*=max/magnitude;dy*=max/magnitude;}
      if(ui.knob)ui.knob.style.transform=`translate(${dx}px,${dy}px)`;
      keys.ArrowLeft=dx<-Math.max(10,max*.18);
      keys.ArrowRight=dx>Math.max(10,max*.18);
    };
    ui.joystick.addEventListener('pointerdown',event=>{
      event.preventDefault();
      joystick.id=event.pointerId;
      ui.joystick.classList.add('active');
      try{ui.joystick.setPointerCapture(event.pointerId)}catch{}
      moveJoystick(event.clientX,event.clientY);
    },{passive:false});
    ui.joystick.addEventListener('pointermove',event=>{
      if(event.pointerId!==joystick.id)return;
      event.preventDefault();
      moveJoystick(event.clientX,event.clientY);
    },{passive:false});
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>{
      ui.joystick.addEventListener(type,event=>{
        if(joystick.id!==null&&event.pointerId!==joystick.id)return;
        event.preventDefault();
        resetJoystick();
      },{passive:false});
    });
  }

  addEventListener('keydown',event=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(event.code))event.preventDefault();
    keys[event.code]=true;
    if(event.code==='KeyP')togglePause();
    if(event.code==='KeyM'){
      soundEnabled=!soundEnabled;
      ui.sound.textContent=`Geluid ${soundEnabled?'aan':'uit'}`;
    }
  },{passive:false});
  addEventListener('keyup',event=>keys[event.code]=false);

  root.querySelectorAll('[data-k]').forEach(button=>{
    const key=button.dataset.k;
    const press=event=>{
      event.preventDefault();
      try{button.setPointerCapture(event.pointerId)}catch{}
      keys[key]=true;
      button.classList.add('is-pressed');
    };
    const release=event=>{
      event.preventDefault();
      keys[key]=false;
      button.classList.remove('is-pressed');
    };
    button.addEventListener('pointerdown',press,{passive:false});
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>button.addEventListener(type,release,{passive:false}));
  });

  root.addEventListener('contextmenu',event=>event.preventDefault());
  root.addEventListener('touchmove',event=>event.preventDefault(),{passive:false});
  addEventListener('blur',()=>{
    for(const key in keys)keys[key]=false;
    root.querySelectorAll('.is-pressed').forEach(button=>button.classList.remove('is-pressed'));
    if(ui.knob)ui.knob.style.transform='translate(0px,0px)';
  });

  ui.start.onclick=()=>{
    if(paused){
      paused=false;
      ui.menu.hidden=true;
      root.classList.remove('menu-open');
      ui.pause.textContent='Pauze';
    }else reset();
  };
  ui.pause.onclick=togglePause;
  ui.sound.onclick=()=>{
    soundEnabled=!soundEnabled;
    ui.sound.textContent=`Geluid ${soundEnabled?'aan':'uit'}`;
  };

  reset();
  running=false;
  ui.menu.hidden=false;
  root.classList.add('menu-open');
  requestAnimationFrame(loop);
})();
