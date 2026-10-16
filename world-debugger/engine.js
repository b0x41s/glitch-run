(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const {BIOMES,PROPS,MODES,PERKS,Expedition,dailyMission}=window.WorldDebugger;
  const {Career,MEDALS,BADGES}=window.WorldProgression;
  const {BiomeMotion}=window.WorldBiomeMotion;
  const {fitWorld}=window.WorldCamera;let cameraZoom=1,cameraSize=null;
  const icon=id=>`<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let selected='alpine',mode='timed',perk='none',graphics='diorama',busy=false,modal='',shownPhase='',generation=0,lastAnnouncement=Infinity,awarded=0,finished=false,newBadges=[];
  let dailyDay=new Date().toISOString().slice(0,10),freeStart=selected,lastCount=0;
  const storage={get(key,fallback){try{return localStorage.getItem(key)??fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem(key,String(value));return true;}catch{return false;}},remove(key){try{localStorage.removeItem(key);}catch{}}};
  const game=new Expedition({history:storage.get('wd-layout-history-v1','{}')});
  function savedCampaign(){
    try{const data=JSON.parse(storage.get('wd-expedition-v1','null'));if(!data||data.version!==1||!['classic','diorama'].includes(data.graphics)||data.run?.variation!==data.graphics||!new Expedition().restore(data.run))return null;return data;}catch{return null;}
  }
  function resumeMenu(){const saved=savedCampaign();$('#btnContinue').hidden=!saved;if(saved){const b=BIOMES.find(b=>b.id===saved.run.order[saved.run.index]);$('#resumeSummary').textContent=`${MODES[saved.run.mode].name} · ${b.name} · wereld ${saved.run.index+1}/7 · ${saved.run.score} punten`;}}
  function saveCampaign(){
    storage.set('wd-layout-history-v1',game.historyJSON());
    const run=game.snapshot();if(run){const ok=storage.set('wd-expedition-v1',JSON.stringify({version:1,graphics,run}));resumeMenu();return ok;}
    if(['victory','gameover'].includes(game.phase)){storage.remove('wd-expedition-v1');resumeMenu();}return false;
  }
  function continueCampaign(){
    if(busy)return;const saved=savedCampaign();if(!saved){resumeMenu();return;}graphics=saved.graphics;mode=saved.run.mode;perk=saved.run.perk;selected=saved.run.order[0];dailyDay=saved.run.dailyDate||new Date().toISOString().slice(0,10);document.documentElement.dataset.graphics=graphics;document.querySelectorAll('.graphics-button').forEach(b=>{b.classList.toggle('selected',b.dataset.graphics===graphics);b.setAttribute('aria-pressed',String(b.dataset.graphics===graphics));});document.querySelectorAll('.mode-button').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===mode);b.setAttribute('aria-pressed',String(b.dataset.mode===mode));});
    loading(()=>{if(!game.restore(saved.run))return;awarded=game.results.length;finished=false;newBadges=[];},saved.run.order[saved.run.index],true);
  }
  const career=Career.parse(storage.get('wd-career-v1','{}'));
  const recordKey=()=>mode==='daily'?`wd-best-v2-daily-${dailyDay}-${graphics}`:`wd-best-v2-${mode}-${perk}-${graphics}`;
  const gameRecordKey=()=>game.mode==='daily'?`wd-best-v2-daily-${game.dailyDate}-${graphics}`:`wd-best-v2-${game.mode}-${game.perk}-${graphics}`;
  const medalMarkup=(medal,label='')=>`<span class="medal ${medal||'locked'}" role="img" aria-label="${medal?MEDALS[medal].name:'Nog geen medaille'}${label?' · '+label:''}"><span aria-hidden="true">✦</span></span>`;
  function careerMenu(){
    $('#careerRank').textContent=`${career.rankName} · rang ${career.rank}`;
    $('#careerSummary').textContent=`${Object.keys(career.medals).length} / 7 medailles · ${career.xp} XP`;
    $('#selectedPerk').textContent=mode==='daily'?'Pure natuur · vast':PERKS[perk].name;
    $('#btnLoadout').disabled=mode==='daily';
    $('#dailyBriefing').hidden=mode!=='daily';
    $('#dailyBriefing').textContent=`DAGMISSIE ${dailyDay} · dezelfde route en objectposities · ${graphics==='classic'?'klassiek':'3D'} record · zonder perks · nieuwe missie om 00:00 UTC`;
  }
  function rewards(){
    while(awarded<game.results.length){newBadges.push(...career.award(game.results[awarded]));awarded++;}
    if(game.phase==='victory'&&!finished){newBadges.push(...career.finish(game));finished=true;}
    storage.set('wd-career-v1',career.serialize());careerMenu();
  }
  const loaded=new Map();let pendingLoad=null;
  function loadImage(src){
    if(loaded.has(src))return loaded.get(src);
    const promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{loaded.delete(src);reject(new Error(src));};img.src=src;});loaded.set(src,promise);return promise;
  }
  function preview(id,scope){const file=['ocean','harvest'].includes(id)&&['menu','stage'].includes(scope)?id+'-live':id;return graphics==='classic'?sceneMarkup(id,scope):`<img class="diorama-render" src="assets/biomes/${file}.webp" alt="">`;}
  function objectElement(id){return $('#targetLayer [data-id="'+id+'"]')||$('#worldImage [data-id="'+id+'"]');}
  function sceneMarkup(id,scope){
    const host=document.createElement('div');host.innerHTML=window.BIOMES[id].svg;
    const ids=new Map();host.querySelectorAll('[id]').forEach(el=>{const old=el.id;el.id=scope+'-'+old;ids.set(old,el.id);});
    host.querySelectorAll('*').forEach(el=>{for(const attr of Array.from(el.attributes)){let value=attr.value;for(const [old,id] of ids){value=value.replaceAll('url(#'+old+')','url(#'+id+')');if(value==='#'+old)value='#'+id;}if(value!==attr.value)el.setAttribute(attr.name,value);}});
    if(scope!=='stage')host.querySelectorAll('g.asset[data-foreign="1"]').forEach(g=>{if(!(id==='frozen'&&g.dataset.asset==='sailboat'))g.setAttribute('visibility','hidden');});
    return host.innerHTML;
  }
  function say(text,type=''){const msg=$('#msg');msg.textContent=text;msg.className=type;}
  function menuBest(){resumeMenu();const best=Number(storage.get(recordKey(),0));$('#bestMenu').textContent=best?`PERSOONLIJK RECORD: ${best}`:'JOUW AVONTUUR BEGINT HIER';careerMenu();$('#btnStart').firstChild.textContent=mode==='relaxed'?'Begin met verkennen ':`Start ${MODES[mode].name.toLowerCase()} `;}
  const sound=new window.WorldSoundscape.Soundscape();
  async function toggleSound(){
    const enabled=await sound.toggle();if(enabled===null){say('Geluid is niet beschikbaar in deze browser.');return;}
    document.querySelectorAll('.sound-button').forEach(btn=>{btn.setAttribute('aria-pressed',String(enabled));btn.setAttribute('aria-label',enabled?'Geluid uitzetten':'Geluid aanzetten');});
  }
  class Atmosphere {
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.type='motes';this.particles=[];this.time=0;this.width=0;this.height=0;this.visible=true;}
    set(type){this.type=type;this.particles=Array.from({length:type==='snow'?65:type==='embers'?45:32},()=>({x:Math.random(),y:Math.random(),s:Math.random()*1.7+.4,v:Math.random()*.018+.006,a:Math.random()*.35+.15,w:Math.random()*6}));}
    draw(dt,animate){
      const box=this.canvas.getBoundingClientRect();if(!box.width||!box.height)return;
      const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(box.width),h=Math.round(box.height);
      if(w!==this.width||h!==this.height){this.width=w;this.height=h;this.canvas.width=w*dpr;this.canvas.height=h*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);}
      const c=this.ctx;c.clearRect(0,0,w,h);if(!animate||reduced.matches)return;
      this.time+=dt;
      for(const p of this.particles){
        const up=this.type==='embers';p.y=(p.y+(up?-1:1)*p.v*dt+1)%1;p.x=(p.x+Math.sin(this.time*.35+p.w)*dt*.002+1)%1;
        c.globalAlpha=p.a;c.fillStyle=up?'#ffc878':this.type==='snow'?'#eff8ff':this.type==='dust'?'#efd3a2':'#f5f2c1';
        c.beginPath();c.arc(p.x*w,p.y*h,p.s,0,Math.PI*2);c.fill();
      }
      c.globalAlpha=1;
    }
  }
  const menuAtmos=new Atmosphere($('#menuParticles')),worldAtmos=new Atmosphere($('#worldParticles'));
  menuAtmos.set('motes');
  const worldMotion=new BiomeMotion($('#sceneMotion'));let menuMotion=null,sharkAsset=null;
  loadImage('assets/shark.webp').then(img=>{sharkAsset=img;worldMotion.setShark(img);if(menuMotion)menuMotion.setShark(img);}).catch(()=>{});
  function picker(){
    $('#biomePicker').innerHTML=BIOMES.map((b,i)=>`<button class="biome-card ${selected===b.id?'selected':''}" data-biome="${b.id}" ${mode==='daily'?'disabled':''} aria-label="Vertrek vanuit ${b.name}" aria-pressed="${selected===b.id}"><div class="biome-mini" aria-hidden="true">${preview(b.id,'picker')}</div><span class="biome-number">0${i+1}</span><span class="biome-name">${b.name}</span>${selected===b.id?'<span class="selected-mark">'+icon('check')+'</span>':''}</button>`).join('');
  }
  function selectWorld(id){
    if(busy||game.phase!=='menu'||mode==='daily'&&id!==dailyMission(dailyDay).first)return;selected=id;const b=BIOMES.find(b=>b.id===id);
    picker();$('#featuredName').textContent=b.name;$('#featuredDesc').textContent=b.desc;$('#featuredTag').textContent=`0${BIOMES.indexOf(b)+1} / ${b.tag}`;menuAtmos.set(b.weather);
    $('#menuArt').innerHTML='<div class="menu-diorama">'+preview(id,'menu')+'</div>';
    $('#menuArt').dataset.biome=id;
    const canvas=document.createElement('canvas');canvas.className='scene-motion';canvas.setAttribute('aria-hidden','true');$('#menuArt .menu-diorama').appendChild(canvas);menuMotion=new BiomeMotion(canvas);menuMotion.set(id,graphics==='diorama');if(sharkAsset)menuMotion.setShark(sharkAsset);
  }
  function drawTargets(){
    $('#targetLayer').replaceChildren();worldMotion.set(game.biome.id,graphics==='diorama');
    $('#worldStage').classList.toggle('rendered',graphics==='diorama');
    if(graphics==='diorama'){
      $('#worldImage').innerHTML=preview(game.biome.id,'stage');
      $('#targetLayer').innerHTML=[...game.targets,...game.nativeProps].map(t=>{
        const p=PROPS[t.type],col=p.cell%3,row=Math.floor(p.cell/3);
        return `<button class="target ${t.id.startsWith('native-')?'native-prop':''}" data-id="${t.id}" data-asset="${t.type}" style="left:${t.x*100}%;top:${t.y*100}%;--sprite-size:${p.size*(t.scale||1)/10}cqw;--size:max(8cqw,var(--sprite-size));--sprite-x:${col*50}%;--sprite-y:${row*50}%" aria-label="${p.name}"><span class="prop"></span></button>`;
      }).join('');return;
    }
    $('#worldImage').innerHTML=sceneMarkup(game.biome.id,'stage');
    $('#worldImage').querySelectorAll('g.asset').forEach(g=>{
      const type=g.dataset.asset;g.dataset.id=game.biome.id+'-'+type;
      g.setAttribute('role','button');g.setAttribute('tabindex','0');
      g.setAttribute('aria-label',PROPS[type]?.name||type.replace(/\d+$/,''));
      const box=g.getBBox(),rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
      const target=game.targets.find(t=>t.type===type);
      if(target&&game.layoutVersion===2){
        const [, ,width,height]=g.ownerSVGElement.getAttribute('viewBox').trim().split(/\s+/).map(Number);
        g.setAttribute('transform',`translate(${target.x*width-box.x-box.width/2} ${target.y*height-box.y-box.height})`);
        // A moved object must stay above native artwork and its hit areas.
        g.parentNode.appendChild(g);
      }
      for(const [key,value] of Object.entries({x:box.x-Math.max(2,(24-box.width)/2),y:box.y-Math.max(2,(24-box.height)/2),width:Math.max(24,box.width+4),height:Math.max(24,box.height+4),class:'hit-area'}))rect.setAttribute(key,value);
      g.prepend(rect);
    });
    if(reduced.matches)$('#worldImage').querySelectorAll('animate,animateTransform,animateMotion').forEach(el=>el.remove());
  }
  function campaign(){
    $('#campaignProgress').textContent=`${game.results.length} / 7 HERSTELD`;
    $('#campaignTrack').innerHTML=game.order.map((id,i)=>{const b=BIOMES.find(b=>b.id===id);const complete=i<game.results.length;return `<div class="campaign-stop ${i===game.index?'current':''} ${complete?'complete':''}" aria-label="${b.name}, ${complete?'hersteld':i===game.index?'huidige wereld':'nog te verkennen'}"><div class="campaign-mini" aria-hidden="true">${preview(id,'campaign')}</div><span><small>${complete?'HERSTELD':`0${i+1}`}</small>${b.name}</span>${complete?icon('check'):''}</div>`;}).join('');
  }
  function hud(){
    sound.setPaused(game.phase==='paused');
    const scene=$('#worldImage svg');if(scene?.pauseAnimations){if(game.phase==='playing')scene.unpauseAnimations();else scene.pauseAnimations();}
    $('#stRound').innerHTML=`0${game.index+1} <span>/ 07</span>`;
    $('#stScore').textContent=String(game.score).padStart(4,'0');
    $('#stBugs').textContent=`${game.found} / ${game.targets.length}`;
    $('#foundPips').innerHTML=Array.from({length:game.targets.length},(_,i)=>`<span class="found-pip ${i<game.found?'found':''}">${icon('check')}</span>`).join('');
    $('#foundPips').setAttribute('aria-label',`${game.found} van de ${game.targets.length} gevonden`);
    $('#falseCount').textContent=game.lives===null?`${game.mistakes} ${game.mistakes===1?'fout':'fouten'}`:`${'♥'.repeat(game.lives)}${'♡'.repeat(3-game.lives)} · ${game.lives} levens`;
    $('#falseCount').classList.toggle('lives',game.lives!==null);
    $('#btnPerk').hidden=game.perk!=='focus';$('#btnPerk').disabled=game.phase!=='playing'||game.perkUsed||!game.timed;
    $('#btnPerk').innerHTML=game.perkUsed?'Tijdanker gebruikt':'Tijdanker <kbd>E</kbd>';
    $('#perkStatus').hidden=!['shield','scout'].includes(game.perk);
    $('#perkStatus').textContent=game.perk==='shield'?(game.perkUsed?'Schild verbruikt':'Schild klaar'):game.hints===game.levelHints?'Gratis hint klaar':'Gratis hint gebruikt';
    $('#hintCost').textContent=game.perk==='scout'&&game.hints===game.levelHints?'GRATIS':'−40';
    $('#btnHint').disabled=game.phase!=='playing'||game.targets.every(t=>t.found||t.hinted);
    $('#btnPause').disabled=game.phase!=='playing';
    $('#comboBox').hidden=game.combo<2;$('#comboText').textContent=`${game.combo}×`;
    $('#timerLabel').textContent=game.timed?'RESTERENDE TIJD':'VERSTREKEN TIJD';
    $('.hud-mission .tiny-label').textContent=MODES[game.mode].name.toUpperCase();
    updateTimer();
  }
  function updateTimer(){
    const time=game.timed?Math.ceil(game.remaining):Math.floor(game.elapsed);
    $('#stTime').textContent=fmt(time);$('#timerArc').style.strokeDashoffset=game.timed?106.815*(1-game.remaining/game.limit):0;
    $('#timerBox').classList.toggle('urgent',game.timed&&game.remaining<=15&&game.freezeRemaining===0);
    $('#timerBox').classList.toggle('frozen',game.freezeRemaining>0);
    $('#worldStage').classList.toggle('anchored',game.freezeRemaining>0);
    $('#timerLabel').textContent=game.freezeRemaining>0?`TIJDANKER · ${Math.ceil(game.freezeRemaining)} SEC`:game.timed?'RESTERENDE TIJD':'VERSTREKEN TIJD';
    if(game.phase==='playing'&&game.timed&&time<=10&&time>0&&time<lastAnnouncement){lastAnnouncement=time;if(time===10||time===5)say(`Nog ${time} seconden. Blijf scherp!`,'bad');}
  }
  function enterWorld(){
    const b=game.biome;$('#menu').hidden=true;$('#play').hidden=false;document.documentElement.style.setProperty('--world',b.color);
    $('#worldImage').setAttribute('aria-label',`${b.name}: ${b.habitat}`);$('#worldStage').dataset.biome=b.id;$('#worldName').textContent=b.name;$('#worldTag').textContent=b.tag;
    worldAtmos.set(b.weather);$('#worldViewport').scrollLeft=0;$('#feedbackLayer').replaceChildren();lastAnnouncement=Infinity;shownPhase='playing';
    $('#nightShade').hidden=game.mode!=='night';$('#worldStage').classList.toggle('night-watch',game.mode==='night');lightAt(.5,.5);
    $('#worldStage').classList.remove('world-arrival');void $('#worldStage').offsetWidth;$('#worldStage').classList.add('world-arrival');
    drawTargets();for(const target of game.targets){if(target.found)markFound(target);else if(target.hinted)objectElement(target.id).classList.add('hinted');}updateCamera(true);campaign();hud();say(`${b.habitat} Vind de ${game.targets.length} buitenbeentjes.${game.mode==='night'?' Zoek met muis, vinger of pijltjestoetsen in de lichtbundel.':''}`);
    $('#worldViewport').focus({preventScroll:true});
  }
  async function loading(action,id,restoring=false){
    if(busy)return;busy=true;pendingLoad={action,id,restoring};$('#loadingScreen').hidden=false;
    try{if(graphics==='diorama')await Promise.all([...BIOMES.map(b=>loadImage(`assets/biomes/${b.id}.webp`)),loadImage('assets/biomes/ocean-live.webp'),loadImage('assets/biomes/harvest-live.webp'),loadImage('assets/shark.webp'),loadImage('assets/diorama-props.webp')]);action();if((document.hidden||!document.hasFocus())&&['playing','countdown','ready'].includes(game.phase))game.pause();closeDialog();enterWorld();if(game.phase!=='playing'){shownPhase=game.phase;showDialog(game.phase==='paused'?'pause':game.phase);}saveCampaign();pendingLoad=null;}
    catch{showDialog('error');}finally{busy=false;$('#loadingScreen').hidden=true;}
  }
  function start(){if(mode==='daily'){dailyDay=new Date().toISOString().slice(0,10);selectWorld(dailyMission(dailyDay).first);menuBest();}loading(()=>{awarded=0;finished=false;newBadges=[];game.start(selected,mode,perk,dailyDay,graphics);game.beginStartCountdown();},selected);}
  function next(){const id=game.order[game.index+1];if(game.phase==='cleared'&&id)loading(()=>game.next(),id);}
  function home(){
    saveCampaign();game.reset();if(mode==='daily'){dailyDay=new Date().toISOString().slice(0,10);selectWorld(dailyMission(dailyDay).first);}sound.setPaused(false);shownPhase='';generation++;closeDialog();$('#play').hidden=true;$('#menu').hidden=false;menuBest();$('#btnStart').focus({preventScroll:true});window.scrollTo(0,0);
  }
  function pop(x,y,text,bad=false){
    const node=document.createElement('span');node.className='feedback-pop'+(bad?' bad':'');node.textContent=text;node.style.left=x*100+'%';node.style.top=y*100+'%';
    const ring=document.createElement('span');ring.className='feedback-ring'+(bad?' bad':'');ring.style.left=x*100+'%';ring.style.top=y*100+'%';
    $('#feedbackLayer').append(node,ring);setTimeout(()=>{node.remove();ring.remove();},1200);
  }
  function markFound(target){
    const btn=objectElement(target.id),prop=PROPS[target.type];btn.classList.add('found');btn.classList.remove('hinted');btn.setAttribute('aria-disabled','true');btn.setAttribute('tabindex','-1');btn.setAttribute('aria-label',`${prop.name}, gevonden`);if(graphics==='diorama'){btn.disabled=true;btn.insertAdjacentHTML('beforeend','<span class="target-check">'+icon('check')+'</span>');}else{const box=btn.getBBox(),ns='http://www.w3.org/2000/svg',mark=document.createElementNS(ns,'circle');for(const [k,v] of Object.entries({cx:box.x+box.width/2,cy:box.y+box.height/2,r:Math.max(box.width,box.height)/2+5,class:'asset-confirm'}))mark.setAttribute(k,v);btn.appendChild(mark);}
  }
  function chooseTarget(id){
    if(busy||game.phase!=='playing')return;
    const target=game.targets.find(t=>t.id===id);
    if(!target){const btn=objectElement(id);const rect=btn.getBoundingClientRect(),stage=$('#worldStage').getBoundingClientRect();miss((rect.x+rect.width/2-stage.x)/stage.width,(rect.y+rect.height/2-stage.y)/stage.height);return;}
    const result=game.find(id);if(!result){phaseChange();return;}
    const asset=objectElement(id),r=asset.getBoundingClientRect(),sr=$('#worldStage').getBoundingClientRect();const feedbackX=(r.x+r.width/2-sr.x)/sr.width,feedbackY=(r.y+r.height/2-sr.y)/sr.height;
    const prop=PROPS[target.type];say(`${prop.name} hoort bij ${prop.home}. Goed gezien! +${result.points} punten.`,'good');pop(feedbackX,feedbackY,result.points>100?`+${result.points} · COMBO`:`+${result.points}`);sound.chime('good');
    markFound(target);
    hud();campaign();phaseChange();saveCampaign();
  }
  function miss(x=.5,y=.5){
    if(busy)return;
    if(game.miss()){
      const lifeMessage=game.lives===null?'':` Je verliest een leven; nog ${game.lives} ${game.lives===1?'leven':'levens'} over.`;
      say(game.lastProtected?'Je veldschild vangt deze fout op. Schild verbruikt.':'Dit hoort bij de wereld. Zoek iets dat niet in deze omgeving past. −25 punten.'+lifeMessage,game.lastProtected?'':'bad');
      pop(x,y,game.lastProtected?'SCHILD':game.lives===null?'−25':'−1 LEVEN',!game.lastProtected);sound.chime(game.lastProtected?'hint':'bad');hud();
    }
    phaseChange();saveCampaign();
  }
  function hint(){
    if(busy)return;const target=game.hint();if(!target){phaseChange();return;}
    const btn=objectElement(target.id);btn.classList.add('hinted');btn.scrollIntoView({block:'nearest',inline:'center',behavior:reduced.matches?'instant':'smooth'});
    illuminate(btn);
    say(`Een buitenbeentje licht op. Bekijk dat object eens goed. ${game.lastHintCost?'−40 punten.':'Gratis met Spoorzoeker.'}`);sound.chime('hint');hud();phaseChange();saveCampaign();
  }
  function activatePerk(){if(busy)return;if(game.activatePerk()){sound.chime('hint');say('Tijdanker actief: de leveltimer staat 8 seconden stil.');hud();}phaseChange();saveCampaign();}
  function closeDialog(){if($('#overlay').open)$('#overlay').close();modal='';}
  function dialogContent({symbol='cross',label,title,text,body='',buttons='',footnote='',closable=false,closeAction='close'}){
    const closeButton=closable?`<button class="dialog-close" data-action="${closeAction}" aria-label="Sluiten">${icon('close')}</button>`:'';
    return `<div class="dialog-content">${closeButton}${icon(symbol)}<div class="eyebrow">${label}</div><h2 id="overlayTitle" tabindex="-1">${title}</h2><p>${text}</p>${body}${buttons?`<div class="dialog-actions">${buttons}</div>`:''}${footnote?`<div class="dialog-footnote">${footnote}</div>`:''}</div>`;
  }

  const button=(action,text,primary=true)=>`<button class="${primary?'primary-button':'secondary-button'}" data-action="${action}">${text}${primary?icon('arrow'):''}</button>`;
  function showDialog(kind){
    modal=kind;let content;
    if(kind==='loadout')content=dialogContent({symbol:'hint',closable:true,closeAction:'dismiss-menu',label:'UITRUSTING',title:'Kies je voordeel.',text:'Neem één perk mee voor de hele reis. Records worden apart bijgehouden voor iedere combinatie van modus en perk.',body:`<div class="perk-grid">${Object.entries(PERKS).map(([id,p])=>`<button class="perk-card ${perk===id?'selected':''}" data-perk="${id}" aria-pressed="${perk===id}"><strong>${p.name}</strong><span>${p.desc}</span>${perk===id?'<small>UITGERUST</small>':'<small>KIEZEN</small>'}</button>`).join('')}</div>`,buttons:button('close-menu','Klaar voor vertrek'),footnote:'In Vrij verkennen is Tijdanker niet nodig: daar loopt geen deadline.'});
    if(kind==='career')content=dialogContent({symbol:'check',closable:true,closeAction:'dismiss-menu',label:'JOUW VELDGIDS',title:`${career.rankName} · rang ${career.rank}`,text:`${career.xp} XP · ${career.completed} campagnes voltooid${career.nextRankXP?' · '+career.nextRankXP+' XP tot de volgende rang':''}`,body:`<div class="medal-atlas">${BIOMES.map(b=>`<div>${medalMarkup(career.medals[b.id],b.name)}<strong>${b.name}</strong><small>${career.medals[b.id]?MEDALS[career.medals[b.id]].name:'Nog te verdienen'}</small></div>`).join('')}</div><p class="medal-rules">Brons: wereld hersteld. Zilver: geen foute klik. Goud: ook geen hints en minstens de helft van je tijd over; in Vrij verkennen vervalt de tijdseis.</p><div class="badge-list">${Object.entries(BADGES).map(([id,b])=>`<div class="badge ${career.badges.includes(id)?'earned':''}"><span aria-hidden="true">${career.badges.includes(id)?'✦':'◇'}</span><div><strong>${b.name}</strong><small>${b.desc}</small></div><small>${career.badges.includes(id)?'BEHAALD':'GESLOTEN'}</small></div>`).join('')}</div>`,buttons:button('close-menu','Terug naar het kamp'),footnote:'Je veldgids wordt op dit apparaat bewaard. Je hoogste medaille per wereld blijft behouden.'});
    if(kind==='how')content=dialogContent({symbol:'cross',label:'VELDGIDS',title:'Kijk. Ontdek. Herstel.',text:'In elke wereld staan objecten uit een andere omgeving. Klik ze aan om de balans te herstellen. In 3D verschijnen ze verspreid over het terrein. Latere levels hebben meer passende afleiders.',body:'<ol class="how-list"><li><b>01</b><span>Vind de buitenbeentjes. De eerste vondst geeft 100 punten; de tweede goede vondst op rij geeft 125.</span></li><li><b>02</b><span>Een verkeerde klik kost 25 punten en verbreekt je reeks. Een hint kost 40 punten.</span></li><li><b>03</b><span>In Expeditie begin je met 60 seconden. Iedere goede vondst maakt het volgende level 4 seconden korter, tot minimaal 12 seconden. Tussen levels telt het spel 3–2–1 af.</span></li><li><b>04</b><span>Sprint start met 35 seconden en wordt 2 seconden korter per vondst (minimaal 12). Overleving geeft drie levens voor de hele reis. Vrij verkennen heeft geen deadline. Nachtwacht start met 75 seconden en gebruikt een zoeklicht. De dagmissie heeft een vaste route en geen perks.</span></li><li><b>05</b><span>Kies een perk voor vertrek. Tijdanker zet met E de timer 8 seconden stil, Veldschild vangt één fout op en Spoorzoeker geeft één gratis hint per level.</span></li><li><b>06</b><span>Verdien brons voor herstel, zilver zonder fouten, en goud zonder fouten of hints met minstens de helft van de tijd over. Je medailles, XP en badges vind je in de veldgids.</span></li></ol>',buttons:button('close','Ik ben er klaar voor'),closable:true,footnote:'E · TIJDANKER &nbsp; / &nbsp; H · HINT &nbsp; / &nbsp; ESC · PAUZE &nbsp; / &nbsp; F · VOLLEDIG SCHERM<br>Op je telefoon: zoom in en veeg om rond te kijken.'});
    if(kind==='ready')content=dialogContent({symbol:'cross',label:'MAAK JE KLAAR',title:'De zoektocht begint.',text:`${game.biome.name} · ${MODES[game.mode].name}`,body:'<div class="start-countdown countdown-pop" id="startCountdown" role="status" aria-live="assertive">3</div>',footnote:'Je zoektijd begint pas na GO!'});
    if(kind==='countdown'){const next=BIOMES.find(b=>b.id===game.order[game.index+1]);const result=game.results.at(-1);content=dialogContent({symbol:'check',label:`${game.biome.name.toUpperCase()} HERSTELD`,title:'Volgend level',text:next.name,body:`<div class="level-medal">${medalMarkup(result.medal)}<span>${MEDALS[result.medal].name} · +${MEDALS[result.medal].xp} XP</span></div><div class="level-countdown" id="levelCountdown" role="timer">${Math.ceil(game.countdownRemaining)}</div><div class="next-time">${game.nextLimit} SECONDEN · DE UITDAGING WORDT GROTER</div><div class="countdown-meter"><span id="countdownMeter"></span></div>`,buttons:button('skip-countdown','Meteen door')+button('pause-countdown','Even pauzeren',false),footnote:`+${game.bonus} tijdbonus · score ${game.score}`});}
    if(kind==='pause')content=dialogContent({symbol:'pause',label:'EVEN OP ADEM KOMEN',title:'De wereld wacht.',text:'Je expeditie is gepauzeerd. De tijd loopt pas weer als je verdergaat.',buttons:button('resume','Verder verkennen')+button('quit','Terug naar het startmenu',false),footnote:'ESC · VERDERGAAN'});
    if(kind==='cleared')content=dialogContent({symbol:'check',label:`WERELD 0${game.index+1} / 07 HERSTELD`,title:'De balans is terug.',text:`Alle buitenbeentjes in ${game.biome.name} zijn gevonden. De volgende wereld wacht op je.`,body:`<div class="level-medal">${medalMarkup(game.results.at(-1).medal)}<span>${MEDALS[game.results.at(-1).medal].name} · +${MEDALS[game.results.at(-1).medal].xp} XP</span></div><div class="result-grid"><div><strong>${game.found} / ${game.targets.length}</strong><span>GEVONDEN</span></div><div><strong>+${game.bonus}</strong><span>TIJDBONUS</span></div><div><strong>${game.score}</strong><span>TOTALE SCORE</span></div></div>`,buttons:button('next','Naar de volgende wereld')+button('quit','Terug naar het startmenu',false)});
    if(kind==='victory'){
      const key=gameRecordKey(),best=Number(storage.get(key,0)),isBest=game.score>best;if(isBest)storage.set(key,game.score);
      const title=game.errors===0&&game.hints===0?'Een feilloze expeditie.':'Alle werelden in balans.';
      content=dialogContent({symbol:'check',label:'EXPEDITIE VOLTOOID',title,text:'Van bergtoppen tot de open zee: je hebt alle 13 buitenbeentjes gevonden.',body:`${isBest?'<div class="new-best">NIEUW PERSOONLIJK RECORD</div>':''}<div class="result-grid"><div><strong>${game.score}</strong><span>PUNTEN</span></div><div><strong>${fmt(game.elapsed)}</strong><span>SPEELTIJD</span></div><div><strong>${game.mistakes}</strong><span>FOUTEN</span></div></div><div class="run-medals">${game.results.map(r=>medalMarkup(r.medal,BIOMES.find(b=>b.id===r.id).name)).join('')}</div><p class="career-reward">+100 campagne-XP · ${career.rankName} rang ${career.rank}</p>${newBadges.length?`<div class="new-badges">${newBadges.map(id=>`<span>✦ ${BADGES[id].name}</span>`).join('')}</div>`:''}`,buttons:button('home','Een nieuw avontuur'),footnote:`${game.hints} hints gebruikt · beste reeks ${game.maxCombo} · ${MODES[game.mode].name} · ${PERKS[game.perk].name}`});sound.chime('win');
    }
    if(kind==='gameover')content=dialogContent({symbol:'cross',label:game.failure==='lives'?'GEEN LEVENS MEER':'DE TIJD IS VOORBIJ',title:'De wereld blijft mysterieus.',text:`Je vond ${game.found} van de ${game.targets.length} buitenbeentjes in ${game.biome.name}. Probeer de expeditie opnieuw, of verken rustig zonder tijdslimiet. Je verdiende medailles blijven bewaard.`,body:`<div class="result-grid"><div><strong>${game.total}</strong><span>VONDSTEN</span></div><div><strong>${game.score}</strong><span>SCORE</span></div><div><strong>${game.results.length}</strong><span>WERELDEN HERSTELD</span></div></div>`,buttons:button('retry','Expeditie opnieuw starten')+button('relaxed','Verder in Vrij verkennen',false)+button('home','Naar het startmenu',false)});
    if(kind==='quit')content=dialogContent({symbol:'home',label:'EXPEDITIE VERLATEN',title:'Terug naar het kamp?',text:saveCampaign()?'Je expeditie wordt lokaal bewaard. Kies straks Hervat om verder te spelen. Een nieuw avontuur vervangt de bewaarde sessie.':'Dit apparaat kon je expeditie niet bewaren. Als je naar het kamp gaat, verlies je deze sessie. Je kunt ook verder spelen.',buttons:button('home','Terug naar het startmenu')+button('back','Verder met de expeditie',false)});
    if(kind==='error')content=dialogContent({symbol:'cross',label:'WERELD NIET GELADEN',title:'Nog even geduld.',text:'Een afbeelding kon niet worden geladen. Open de volledige gamemap, inclusief de map assets, en probeer opnieuw.',buttons:(pendingLoad?.restoring?'':button('fallback','Open de klassieke wereld'))+button('error-close','Terug',false)});
    const overlay=$('#overlay');overlay.classList.toggle('menu-dialog',['career','loadout','how'].includes(kind));overlay.classList.toggle('countdown-dialog',kind==='countdown');
    $('#overlayBody').innerHTML=content;if(!overlay.open)overlay.showModal();
    // Native dialog autofocus otherwise jumps to a button below a long atlas.
    const initialFocus=kind==='countdown'?overlay.querySelector('.dialog-actions button'):$('#overlayTitle');
    initialFocus.focus({preventScroll:true});overlay.scrollTop=0;
  }
  function updateCountdown(){
    if(!$('#levelCountdown'))return;
    const count=Math.ceil(game.countdownRemaining);if(game.phase==='countdown'&&count>0&&count!==lastCount){sound.chime('count');lastCount=count;}
    $('#levelCountdown').textContent=Math.ceil(game.countdownRemaining);
    $('#countdownMeter').style.width=(game.countdownRemaining/3*100)+'%';
  }
  function updateStartCountdown(){
    const node=$('#startCountdown');if(!node||game.phase!=='ready')return;
    const text=game.countdownRemaining>.600001?String(Math.ceil(game.countdownRemaining-.600001)):'GO!';
    if(node.textContent!==text){node.textContent=text;node.classList.remove('countdown-pop');void node.offsetWidth;node.classList.add('countdown-pop');sound.chime(text==='GO!'?'good':'count');}
  }
  function phaseChange(){
    if(game.phase===shownPhase)return;
    if(['cleared','victory'].includes(game.phase))rewards();
    if(game.phase==='cleared'&&game.timed){game.beginCountdown();lastCount=0;}
    const previous=shownPhase;shownPhase=game.phase;
    if(game.phase==='playing'){closeDialog();if(previous==='ready'){hud();$('#worldViewport').focus({preventScroll:true});}else enterWorld();saveCampaign();return;}
    if(['cleared','countdown','victory','gameover','ready'].includes(game.phase)){hud();campaign();showDialog(game.phase);}saveCampaign();
  }
  function pause(){if(busy)return;if(game.pause()){hud();saveCampaign();showDialog('pause');}else phaseChange();}
  function resume(){
    if(!game.resume())return;if(sound.enabled&&sound.ctx)sound.ctx.resume().catch(()=>{});shownPhase=game.phase;hud();
    if(game.phase==='countdown'){showDialog('countdown');updateCountdown();}
    else if(game.phase==='ready'){showDialog('ready');updateStartCountdown();}
    else{closeDialog();$('#worldViewport').focus({preventScroll:true});}saveCampaign();
  }
  function onAction(action){
    if(busy)return;
    if(action==='dismiss-menu')action='close-menu';
    if(action==='close'){closeDialog();$('#btnHow').focus();}
    if(action==='close-menu'){const target=modal==='career'?'#btnCareer':'#btnLoadout';closeDialog();$(target).focus();}
    if(action==='resume')resume();
    if(action==='pause-countdown')pause();
    if(action==='skip-countdown'&&game.skipCountdown()){phaseChange();saveCampaign();$('#worldViewport').focus({preventScroll:true});}
    if(action==='quit')showDialog('quit');
    if(action==='back')showDialog(game.phase==='paused'?'pause':game.phase);
    if(action==='home')home();
    if(action==='next')next();
    if(action==='retry')loading(()=>{awarded=0;finished=false;newBadges=[];game.retry();game.beginStartCountdown();},game.order[0]);
    if(action==='relaxed'){
      // Continue this world without losing earned points or completed worlds.
      if(!game.continueRelaxed())return;$('#nightShade').hidden=true;$('#worldStage').classList.remove('night-watch');shownPhase='playing';closeDialog();hud();say('Vrij verkennen: neem rustig de tijd om de laatste buitenbeentjes te vinden.');saveCampaign();
    }
    if(action==='fallback'){graphics='classic';document.documentElement.dataset.graphics=graphics;const pending=pendingLoad;closeDialog();if(pending)loading(pending.action,pending.id);else home();}
    if(action==='error-close'){closeDialog();if(game.phase==='menu')$('#btnStart').focus();else showDialog(game.phase==='cleared'?'cleared':'pause');}
  }
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else say('Volledig scherm is niet beschikbaar.');}catch{say('Volledig scherm is niet beschikbaar in deze browser.');}}
  function updateCamera(reset=false){
    if($('#play').hidden)return;
    const viewport=$('#worldViewport'),box=viewport.getBoundingClientRect(),width=viewport.clientWidth||box.width,height=viewport.clientHeight||box.height;
    if(!width||!height)return;
    const old=cameraSize,centerX=old?(viewport.scrollLeft+width/2)/old.width:.5,centerY=old?(viewport.scrollTop+height/2-old.top)/old.height:.5;
    const size=fitWorld(width,height,cameraZoom);cameraSize=size;const stage=$('#worldStage');stage.style.width=size.width+'px';stage.style.height=size.height+'px';stage.style.marginTop=size.top+'px';stage.style.marginBottom=size.top+'px';
    viewport.scrollLeft=reset?0:Math.max(0,centerX*size.width-width/2);viewport.scrollTop=reset?0:Math.max(0,centerY*size.height+size.top-height/2);
    $('#cameraZoom').textContent=Math.round(cameraZoom*100)+'%';$('#btnZoomOut').disabled=cameraZoom<=1;$('#btnZoomIn').disabled=cameraZoom>=2.4;
    $('#cameraHelp').textContent=cameraZoom===1?'De hele wereld in beeld. Zoom in voor details.':'Sleep of veeg om rond te kijken.';
  }
  function zoomCamera(amount){if(busy||!['playing','paused'].includes(game.phase))return;cameraZoom=Math.max(1,Math.min(2.4,amount===0?1:Math.round((cameraZoom+amount)*100)/100));updateCamera(amount===0);}
  $('#btnZoomIn').addEventListener('click',()=>zoomCamera(.35));$('#btnZoomOut').addEventListener('click',()=>zoomCamera(-.35));$('#btnCameraFit').addEventListener('click',()=>zoomCamera(0));
  if(window.ResizeObserver)new ResizeObserver(()=>updateCamera()).observe($('#worldViewport'));else window.addEventListener('resize',()=>updateCamera());
  let drag=null,suppressClickUntil=0,beamX=.5,beamY=.5;
  function lightAt(x,y){beamX=Math.max(0,Math.min(1,x));beamY=Math.max(0,Math.min(1,y));$('#nightShade').style.setProperty('--light-x',`${Math.max(0,Math.min(1,x))*100}%`);$('#nightShade').style.setProperty('--light-y',`${Math.max(0,Math.min(1,y))*100}%`);}
  function illuminate(element){if(game.mode!=='night'||!element)return;const box=element.getBoundingClientRect(),stage=$('#worldStage').getBoundingClientRect();lightAt((box.left+box.width/2-stage.left)/stage.width,(box.top+box.height/2-stage.top)/stage.height);}
  $('#worldStage').addEventListener('pointermove',e=>{if(game.mode!=='night'||game.phase!=='playing')return;const box=$('#worldStage').getBoundingClientRect();lightAt((e.clientX-box.left)/box.width,(e.clientY-box.top)/box.height);});
  $('#worldStage').addEventListener('pointerdown',e=>{if(game.mode!=='night'||game.phase!=='playing')return;const box=$('#worldStage').getBoundingClientRect();lightAt((e.clientX-box.left)/box.width,(e.clientY-box.top)/box.height);});
  $('#worldStage').addEventListener('focusin',e=>illuminate(e.target.closest('g.asset,.target')));
  const viewport=$('#worldViewport');
  viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0&&!e.target.closest('g.asset,.target')&&(viewport.scrollWidth>viewport.clientWidth||viewport.scrollHeight>viewport.clientHeight)){drag={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false,id:e.pointerId};}});
  viewport.addEventListener('pointermove',e=>{if(!drag)return;const delta=e.clientX-drag.x;if(Math.abs(delta)>5||Math.abs(drag.y-e.clientY)>5)drag.moved=true;if(drag.moved){viewport.scrollLeft=drag.left-delta;viewport.scrollTop=drag.top+(drag.y-e.clientY);suppressClickUntil=performance.now()+250;}});
  window.addEventListener('pointerup',()=>drag=null);window.addEventListener('pointercancel',()=>drag=null);
  // Touch dragging scrolls natively; a touch scroll never becomes a false-positive click.
  viewport.addEventListener('scroll',()=>{suppressClickUntil=performance.now()+180;});
  $('#worldStage').addEventListener('click',e=>{
    // Keyboard activation has detail 0; focusing an offscreen object can scroll
    // the viewport just before Enter or Space activates it.
    if(game.phase!=='playing'||e.detail!==0&&performance.now()<suppressClickUntil)return;
    const target=e.target.closest('g.asset,.target');if(target){if(!target.classList.contains('found'))chooseTarget(target.dataset.id);return;}
    const rect=$('#worldStage').getBoundingClientRect();miss((e.clientX-rect.left)/rect.width,(e.clientY-rect.top)/rect.height);
  });
  $('#worldImage').addEventListener('keydown',e=>{const g=e.target.closest('g.asset');if(g&&['Enter',' '].includes(e.key)){e.preventDefault();if(!g.classList.contains('found'))chooseTarget(g.dataset.id);}});
  document.querySelectorAll('.graphics-button').forEach(btn=>btn.addEventListener('click',()=>{if(busy||game.phase!=='menu')return;graphics=btn.dataset.graphics;document.documentElement.dataset.graphics=graphics;document.querySelectorAll('.graphics-button').forEach(b=>{b.classList.toggle('selected',b===btn);b.setAttribute('aria-pressed',String(b===btn));});selectWorld(selected);}));
  $('#biomePicker').addEventListener('click',e=>{const btn=e.target.closest('[data-biome]');if(btn)selectWorld(btn.dataset.biome);});
  document.querySelectorAll('.mode-button').forEach(btn=>btn.addEventListener('click',()=>{if(busy||game.phase!=='menu')return;const wasDaily=mode==='daily';if(btn.dataset.mode==='daily'&&!wasDaily)freeStart=selected;mode=btn.dataset.mode;if(mode==='daily'){dailyDay=new Date().toISOString().slice(0,10);selectWorld(dailyMission(dailyDay).first);}else selectWorld(wasDaily?freeStart:selected);document.querySelectorAll('.mode-button').forEach(b=>{b.classList.toggle('selected',b===btn);b.setAttribute('aria-pressed',String(b===btn));});menuBest();}));
  $('#btnLoadout').addEventListener('click',()=>{if(mode!=='daily'&&game.phase==='menu')showDialog('loadout');});$('#btnCareer').addEventListener('click',()=>showDialog('career'));$('#btnPerk').addEventListener('click',activatePerk);
  document.querySelectorAll('.sound-button').forEach(btn=>btn.addEventListener('click',toggleSound));
  $('#btnStart').addEventListener('click',start);$('#btnContinue').addEventListener('click',continueCampaign);$('#btnHint').addEventListener('click',hint);$('#btnHow').addEventListener('click',()=>showDialog('how'));$('#btnPause').addEventListener('click',pause);$('#btnFull').addEventListener('click',fullscreen);
  $('#overlay').addEventListener('click',e=>{const card=e.target.closest('[data-perk]');if(card&&modal==='loadout'){perk=card.dataset.perk;menuBest();showDialog('loadout');$('#overlay [data-perk="'+perk+'"]').focus();return;}const action=e.target.closest('[data-action]');if(action)onAction(action.dataset.action);});
  $('#overlay').addEventListener('cancel',e=>{e.preventDefault();if(busy)return;if(['career','loadout'].includes(modal))onAction('close-menu');else if(modal==='how'||modal==='error'){onAction(modal==='error'?'error-close':'close');}else if(modal==='pause')resume();else if(['countdown','ready'].includes(modal))pause();else if(modal==='quit')onAction('back');});
  document.addEventListener('keydown',e=>{
    if(e.repeat||busy||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==='Escape'&&!$('#overlay').open&&game.phase==='playing'){e.preventDefault();pause();}
    if($('#overlay').open||game.phase!=='playing')return;
    if(game.mode==='night'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();lightAt(beamX+(e.key==='ArrowRight'?.06:e.key==='ArrowLeft'?-.06:0),beamY+(e.key==='ArrowDown'?.06:e.key==='ArrowUp'?-.06:0));}
    if(['+','=','-','0'].includes(e.key)){e.preventDefault();zoomCamera(e.key==='0'?0:e.key==='-'?-.35:.35);}
    if(e.key.toLowerCase()==='h'){e.preventDefault();hint();}
    if(e.key.toLowerCase()==='f'){e.preventDefault();fullscreen();}
    if(e.key.toLowerCase()==='e'){e.preventDefault();activatePerk();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&['playing','countdown','ready'].includes(game.phase))pause();});
  window.addEventListener('blur',()=>{if(['playing','countdown','ready'].includes(game.phase))pause();});
  let lastFrame=performance.now(),lastDraw=0,nextDailyCheck=0,nextSave=0;
  function frame(now){
    const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
    if(!document.hidden){
      if(!$('#menu').hidden&&mode==='daily'&&now>=nextDailyCheck){nextDailyCheck=now+1000;const today=new Date().toISOString().slice(0,10);if(today!==dailyDay){dailyDay=today;selectWorld(dailyMission(dailyDay).first);menuBest();}}
      if(['playing','countdown','ready'].includes(game.phase)){game.tick();updateTimer();updateCountdown();updateStartCountdown();phaseChange();if(now>=nextSave){nextSave=now+1000;saveCampaign();}}
      if(now-lastDraw>=32){const paintDelta=Math.min(.1,(now-lastDraw)/1000);lastDraw=now;if(!$('#menu').hidden){menuAtmos.draw(paintDelta,true);if(menuMotion)menuMotion.draw(paintDelta,true,reduced.matches);}else{worldAtmos.draw(paintDelta,game.phase==='playing');worldMotion.draw(paintDelta,game.phase==='playing',reduced.matches);}}
    }
    requestAnimationFrame(frame);
  }
  document.documentElement.dataset.graphics=graphics;selectWorld(selected);menuBest();requestAnimationFrame(frame);
  // The selected scene and sprites are ready before its countdown begins.

  window.addEventListener('pagehide',()=>{if(sound.ctx)sound.ctx.suspend().catch(()=>{});});
})();
