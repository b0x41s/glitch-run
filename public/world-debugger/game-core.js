/* Pure game rules. The UI and tests share this state machine. */
(function(root){
  'use strict';
  const BIOMES = [
    {id:'alpine',name:'Alpine Valley',tag:'HET BERGLAND',color:'#b9dfb0',desc:'Waar de rivier de bergen wakker maakt.',habitat:'Dennen, bergweiden en koud stromend water.',objects:['cactus','palm'],weather:'motes',positions:[[.29,.58],[.61,.70],[.72,.62]]},
    {id:'desert',name:'Desert Oasis',tag:'DE WOESTIJN',color:'#f5c982',desc:'Een verborgen oase in een zee van goud.',habitat:'Warm zand, palmen en een zonovergoten oase.',objects:['pine','snowman'],weather:'dust',positions:[[0.31,0.66],[0.57,0.79],[0.73,0.7]]},
    {id:'coral',name:'Coral Coast',tag:'DE TROPISCHE KUST',color:'#8fe5df',desc:'Een wereld tussen zand en turquoise.',habitat:'Tropische palmen, warm zeewater en koraal.',objects:['penguin','iceblock'],weather:'motes',positions:[[0.28,0.53],[0.41,0.57],[0.5,0.51]]},
    {id:'volcano',name:'Volcanic Forge',tag:'HET VUURLAND',color:'#ffa77e',desc:'De aarde gloeit. De wereld ademt vuur.',habitat:'Hete lava, basalt en vulkanische as.',objects:['palm','iceblock'],weather:'embers',positions:[[0.28,0.57],[0.43,0.7],[0.6,0.72]]},
    {id:'frozen',name:'Frozen Frontier',tag:'HET POOLGEBIED',color:'#a4d9ef',desc:'Onder het noorderlicht staat de tijd stil.',habitat:'Poolijs, sneeuw en een ijskoud klimaat.',objects:['cactus'],weather:'snow',positions:[[0.27,0.6],[0.42,0.7],[0.62,0.75]]},
    {id:'harvest',name:'Harvest Plains',tag:'HET PLATTELAND',color:'#e3df9b',desc:'De laatste zon over de gouden oogst.',habitat:'Gematigde akkers, graslanden en boerderijen.',objects:['palm','icepeak'],weather:'motes',positions:[[0.3,0.6],[0.405,0.7],[0.5,0.8]]},
    {id:'ocean',name:'Open Water',tag:'DE OPEN ZEE',color:'#a1d0f1',desc:'Voorbij de horizon begint het avontuur.',habitat:'Zout water, kustrotsen en het leven van de zee.',objects:['barn','cactus'],weather:'mist',positions:[[.30,.39],[.56,.51],[.73,.42]]}
  ];
  const PROPS = {
    cactus:{name:'Cactus',cell:0,size:94,home:'de droge woestijn'},
    snowman:{name:'Sneeuwpop',cell:1,size:86,home:'een besneeuwde omgeving'},
    penguin:{name:'Pinguïn',cell:2,size:70,home:'de koude poolkust'},
    palm:{name:'Tropische palm',cell:3,size:136,home:'een warm tropisch klimaat'},
    iceberg:{name:'IJsberg',cell:4,size:112,home:'het ijskoude poolgebied'},
    barn:{name:'Boerderij',cell:5,size:88,home:'het platteland'},
    pine:{name:'Dennenboom',cell:6,size:72,home:'een koel bosgebied'},
    iceblock:{name:'IJsblok',cell:7,size:65,home:'een ijskoude omgeving'},
    icepeak:{name:'IJsberg',cell:4,size:90,home:'het poolgebied'},
    stone:{name:'Rots',cell:8,size:58,home:'rotsachtig terrein'}
  };
  const FOREIGN={
    alpine:['cactus','palm','penguin'],
    desert:['pine','snowman','penguin','iceblock','icepeak'],
    coral:['penguin','iceblock','icepeak','snowman'],
    volcano:['palm','iceblock','snowman','penguin','pine'],
    frozen:['cactus','palm'],
    harvest:['palm','icepeak','penguin','iceblock'],
    ocean:['barn','cactus','snowman']
  };
  const NATIVE={alpine:['pine'],desert:['cactus','palm'],coral:['palm','stone'],volcano:['stone'],frozen:['penguin','iceblock','icepeak'],harvest:['barn','pine'],ocean:['stone']};
  // Continuous ground patches spread across each island. These are terrain
  // regions, not the three old object anchors; surface clipping keeps feet on the tile.
  const SEARCH_AREAS={
    alpine:[[.16,.49,.22,.56],[.24,.55,.34,.63],[.29,.64,.37,.68],[.40,.35,.46,.41],[.58,.43,.64,.49],[.62,.57,.69,.64],[.56,.70,.64,.77],[.71,.62,.79,.69],[.80,.54,.86,.61]],
    desert:[[.16,.53,.23,.61],[.22,.64,.34,.72],[.34,.71,.43,.77],[.43,.77,.53,.82],[.58,.70,.67,.78],[.72,.66,.81,.73],[.78,.56,.87,.63],[.65,.46,.72,.53],[.45,.65,.53,.71]],
    coral:[[.16,.47,.24,.53],[.22,.56,.31,.64],[.33,.60,.41,.67],[.40,.53,.48,.60],[.48,.46,.55,.53],[.30,.40,.37,.46],[.42,.35,.48,.41],[.59,.42,.65,.48],[.20,.38,.27,.45],[.12,.48,.17,.54],[.66,.39,.72,.43],[.48,.30,.54,.35]],
    volcano:[[.17,.49,.26,.58],[.24,.60,.32,.66],[.32,.67,.40,.73],[.42,.73,.50,.80],[.54,.69,.63,.75],[.67,.62,.76,.68],[.78,.53,.85,.59],[.24,.43,.31,.48],[.68,.44,.75,.50]],
    frozen:[[.12,.47,.20,.53],[.20,.55,.29,.61],[.28,.60,.35,.66],[.34,.66,.42,.72],[.43,.70,.51,.76],[.52,.77,.61,.82],[.63,.71,.70,.76],[.69,.64,.76,.69],[.79,.51,.86,.57]],
    harvest:[[.24,.57,.29,.61],[.26,.53,.30,.57],[.26,.60,.33,.67],[.33,.67,.40,.73],[.40,.75,.48,.81],[.51,.70,.58,.76],[.66,.58,.73,.64],[.72,.55,.78,.60],[.20,.64,.26,.69],[.54,.78,.60,.83],[.44,.79,.51,.84]],
    ocean:[[.17,.35,.25,.41],[.27,.40,.36,.46],[.38,.47,.47,.53],[.50,.53,.59,.59],[.63,.44,.72,.50],[.76,.34,.84,.40],[.71,.29,.78,.35],[.26,.28,.34,.34],[.36,.23,.42,.29]]
  };
  const CLASSIC_AREAS=[[.21,.42,.28,.49],[.27,.50,.34,.56],[.37,.55,.45,.62],[.47,.64,.54,.69],[.58,.53,.66,.59],[.70,.43,.78,.48],[.57,.30,.65,.35],[.38,.31,.45,.36]];
  const SURFACES={
    alpine:[[.11,.49],[.55,.18],[.91,.49],[.558,.825]],
    desert:[[.08,.53],[.50,.21],[.93,.52],[.50,.88]],
    coral:[[.11,.48],[.54,.19],[.93,.50],[.53,.87]],
    volcano:[[.11,.51],[.50,.24],[.89,.51],[.50,.885]],
    frozen:[[.08,.50],[.49,.18],[.92,.49],[.50,.875]],
    harvest:[[.08,.51],[.50,.21],[.92,.51],[.50,.90]],
    ocean:[[.12,.34],[.50,.04],[.91,.35],[.52,.62]]
  };
  function onSurface(biome,x,y,variation='diorama'){
    const polygon=variation==='classic'?[[.117,.463],[.5,.168],[.883,.463],[.5,.758]]:SURFACES[biome];
    function inside(px,py){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [ax,ay]=polygon[i],[bx,by]=polygon[j];if((ay>py)!==(by>py)&&px<(bx-ax)*(py-ay)/(by-ay)+ax)result=!result;}return result;}
    // Keep feet away from the front cliff and the image boundary.
    return [[0,0],[-.015,0],[.015,0],[0,-.015],[0,.015]].every(([dx,dy])=>inside(x+dx,y+dy));
  }
  const nativeCount=index=>2+Math.floor(index/3);
  function propBounds(t){const width=Math.max(.08,PROPS[t.type].size*t.scale/1000),height=width*1.5;return {left:t.x-width/2,right:t.x+width/2,top:t.y-height*.87,bottom:t.y+height*.13};}
  function boxesOverlap(x,y){return x.left<y.right+.008&&x.right+.008>y.left&&x.top<y.bottom+.008&&x.bottom+.008>y.top;}
  function propsOverlap(a,b){return boxesOverlap(propBounds(a),propBounds(b));}
  function placeProps(props,biome,rng,variation='diorama',previous=[]){
    const areas=variation==='classic'?CLASSIC_AREAS:SEARCH_AREAS[biome];
    const ordered=[...props].sort((a,b)=>PROPS[b.type].size*b.scale-PROPS[a.type].size*a.scale);
    // Prefer distance from the previous search spots. Relax that preference
    // in dense scenes while keeping surface and sprite separation mandatory.
    // Backtrack rather than placing a final object on top of another one.
    for(let pass=0;pass<5;pass++){
      const domains=ordered.map(prop=>{
        const points=areas.flatMap(([l,t,r,b])=>[
          ...Array.from({length:12},()=>({x:l+rng()*(r-l),y:t+rng()*(b-t)})),
          ...[[.15,.15],[.15,.85],[.85,.15],[.85,.85],[.5,.5]].map(([x,y])=>({x:l+x*(r-l),y:t+y*(b-t)}))
        ]);
        const sites=shuffle([...new Map(points.filter(p=>onSurface(biome,p.x,p.y,variation)&&(prop.id.startsWith('native-')||previous.every(old=>Math.hypot(old.x-p.x,old.y-p.y)>=[.12,.09,.06,.035,0][pass]))).map(p=>[p.x+','+p.y,p])).values()],rng).map(p=>({...p,bounds:propBounds({...prop,...p})}));
        return {prop,sites};
      });
      let attempts=0;const chosen=new Map();
      function place(remaining){
        if(!remaining.length)return true;
        if(++attempts>3000)return false;
        // Place the most constrained object next and prune occupied positions
        // immediately, instead of searching combinations that cannot fit.
        const [current,...others]=[...remaining].sort((a,b)=>a.sites.length-b.sites.length);
        for(const site of current.sites){
          const next=others.map(domain=>({prop:domain.prop,sites:domain.sites.filter(p=>!boxesOverlap(site.bounds,p.bounds))}));
          if(next.some(domain=>!domain.sites.length))continue;
          chosen.set(current.prop,site);
          if(place(next))return true;
        }
        chosen.delete(current.prop);return false;
      }
      if(place(domains)){for(const [prop,site] of chosen){prop.x=site.x;prop.y=site.y;}return;}

    }
    throw new Error('No separated terrain layout for '+biome);
  }
  const shuffle=(list,rng)=>{const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};
  const MODES={
    timed:{name:'Expeditie',base:60,step:4,min:12,lives:null},
    relaxed:{name:'Vrij verkennen',base:60,step:0,min:60,lives:null},
    sprint:{name:'Sprint',base:35,step:2,min:12,lives:null},
    survival:{name:'Overleving',base:60,step:4,min:12,lives:3},
    night:{name:'Nachtwacht',base:75,step:3,min:30,lives:null},
    daily:{name:'Dagmissie',base:60,step:4,min:12,lives:null}
  };
  function seeded(seed){let value=seed>>>0||1;return ()=>{value^=value<<13;value^=value>>>17;value^=value<<5;return (value>>>0)/4294967296;};}
  function dailyMission(day){
    if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return null;
    const date=new Date(day+'T00:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==day)return null;
    let seed=2166136261;for(const char of 'world-debugger-v1-'+day)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
    return {day,seed,first:BIOMES[seed%BIOMES.length].id};
  }
  const PERKS={
    none:{name:'Pure natuur',desc:'Zonder hulp. Vertrouw op je ogen.'},
    shield:{name:'Veldschild',desc:'Vangt één verkeerde klik op per expeditie.'},
    focus:{name:'Tijdanker',desc:'Zet de leveltimer één keer 8 seconden stil. Druk op E.'},
    scout:{name:'Spoorzoeker',desc:'De eerste hint in elk level kost geen punten.'}
  };
  function readHistory(raw){
    try{if(typeof raw==='string')raw=JSON.parse(raw);}catch{return {};}
    const out={};if(raw?.version!==1||!raw.layouts||typeof raw.layouts!=='object')return out;
    for(const variation of ['diorama','classic'])for(const b of BIOMES){
      const key=variation+'-'+b.id,items=raw.layouts[key],pool=variation==='classic'?b.objects:FOREIGN[b.id];
      if(!Array.isArray(items)||items.length!==b.objects.length||new Set(items.map(t=>t?.type)).size!==items.length)continue;
      if(items.some(t=>!t||!pool.includes(t.type)||!Number.isFinite(t.x)||!Number.isFinite(t.y)||!onSurface(b.id,t.x,t.y,variation)))continue;
      out[key]=items.map(({type,x,y})=>({type,x,y}));
    }
    return out;
  }
  class Expedition {
    constructor({rng=Math.random,now=()=>performance.now(),history=null}={}){this.rng=rng;this.now=now;this.layoutHistory=readHistory(history);this.reset();}
    historyJSON(){return JSON.stringify({version:1,layouts:this.layoutHistory});}
    rememberLayout(){if(!this.dailyDate&&this.biome)this.layoutHistory[this.variation+'-'+this.biome.id]=this.targets.map(({type,x,y})=>({type,x,y}));}
    reset(){this.layoutVersion=2;this.variation='diorama';this.nativeProps=[];this.dailyDate=null;this.dailySeed=null;this.levelRng=null;this.phase='menu';this.mode='timed';this.perk='none';this.perkUsed=false;this.freezeRemaining=0;this.errors=0;this.lastPenalty=25;this.lastProtected=false;this.lastHintCost=40;this.failure='time';this.score=0;this.total=0;this.mistakes=0;this.hints=0;this.combo=0;this.maxCombo=0;this.index=0;this.order=[];this.targets=[];this.limit=60;this.remaining=60;this.countdownRemaining=3;this.pausedFrom=null;this.elapsed=0;this.missionElapsed=0;this.bonus=0;this.lastTick=null;this.lastMiss=-Infinity;this.results=[];return this;}
    get timed(){return this.mode!=='relaxed';}
    get lives(){return MODES[this.mode].lives===null?null:Math.max(0,MODES[this.mode].lives-this.mistakes);}
    get biome(){return BIOMES.find(b=>b.id===this.order[this.index]);}
    start(first='alpine',mode='timed',perk='none',day=new Date().toISOString().slice(0,10),variation='diorama'){
      if(!['menu','victory','gameover'].includes(this.phase))return false;
      if(!BIOMES.some(b=>b.id===first)||!Object.hasOwn(MODES,mode)||!Object.hasOwn(PERKS,perk)||!['classic','diorama'].includes(variation))return false;
      const daily=mode==='daily'?dailyMission(day):null;if(mode==='daily'&&!daily)return false;
      this.reset();this.variation=variation;this.mode=mode;this.perk=mode==='daily'?'none':perk;this.dailyDate=daily?.day||null;this.dailySeed=daily?.seed||null;
      if(daily)first=daily.first;
      this.order=[first,...shuffle(BIOMES.filter(b=>b.id!==first).map(b=>b.id),daily?seeded(daily.seed):this.rng)];this.loadMission();return true;
    }
    loadMission(){
      this.levelRng=this.dailyDate?seeded(this.dailySeed^Math.imul(this.index+1,2654435761)):this.rng;
      const count=this.biome.objects.length;
      const pool=this.variation==='classic'?this.biome.objects:FOREIGN[this.biome.id];
      const previous=this.dailyDate?[]:this.layoutHistory[this.variation+'-'+this.biome.id]||[];
      const types=shuffle(pool,this.levelRng).slice(0,count);
      if(previous.length&&pool.length>count&&types.slice().sort().join(',')===previous.map(t=>t.type).sort().join(',')){const alternatives=pool.filter(type=>!types.includes(type));types[Math.floor(this.levelRng()*count)]=alternatives[Math.floor(this.levelRng()*alternatives.length)];}
      const make=(type,i,native=false)=>({id:`${native?'native-':''}${this.biome.id}-${type}-${native?i:''}`.replace(/-$/,''),type,x:0,y:0,scale:this.variation==='diorama'?.92+this.levelRng()*.16:1,found:false,hinted:false});
      this.targets=types.map((type,i)=>make(type,i));this.nativeProps=[];this.layoutVersion=2;
      if(this.variation==='classic')placeProps(this.targets,this.biome.id,this.levelRng,'classic',previous);
      else{
        for(let i=0;i<nativeCount(this.index);i++){const pool=NATIVE[this.biome.id].filter(type=>(PROPS[type].size<=100&&type!=='barn')||!this.nativeProps.some(p=>PROPS[p.type].size>100||p.type==='barn'));this.nativeProps.push(make(pool[Math.floor(this.levelRng()*pool.length)],i,true));}
        placeProps([...this.targets,...this.nativeProps],this.biome.id,this.levelRng,'diorama',previous);
      }
      this.rememberLayout();
      this.levelErrors=this.errors;this.levelHints=this.hints;this.freezeRemaining=0;
      this.limit=this.nextLimit;this.remaining=this.limit;this.missionElapsed=0;this.combo=0;this.bonus=0;this.lastMiss=-Infinity;this.lastTick=this.now();this.phase='playing';
    }
    tick(){
      if(!['playing','countdown','ready'].includes(this.phase))return false;
      const now=this.now(),dt=Math.max(0,(now-this.lastTick)/1000);this.lastTick=now;
      if(this.phase==='ready'){this.countdownRemaining=Math.max(0,this.countdownRemaining-dt);if(this.countdownRemaining<.000001){this.countdownRemaining=0;}if(this.countdownRemaining===0){this.phase='playing';return true;}return false;}
      if(this.phase==='countdown'){this.countdownRemaining=Math.max(0,this.countdownRemaining-dt);if(this.countdownRemaining===0){this.index++;this.loadMission();return true;}return false;}
      // Do not truncate lag: backgrounding cannot extend the deadline.
      this.elapsed+=dt;this.missionElapsed+=dt;
      const frozen=Math.min(dt,this.freezeRemaining);this.freezeRemaining=Math.max(0,this.freezeRemaining-dt);
      if(this.timed){this.remaining=Math.max(0,this.remaining-(dt-frozen));if(this.remaining===0){this.failure='time';this.phase='gameover';this.combo=0;return true;}}
      return false;
    }
    find(id){
      if(this.phase!=='playing')return null;
      this.tick();if(this.phase!=='playing')return null;
      const target=this.targets.find(t=>t.id===id);if(!target||target.found)return null;
      target.found=true;this.total++;this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);
      const points=100+(this.combo-1)*25;this.score+=points;
      if(this.targets.every(t=>t.found)){
        this.bonus=this.timed?Math.ceil(this.remaining)*2:0;this.score+=this.bonus;
        const errors=this.errors-this.levelErrors,hints=this.hints-this.levelHints;
        const medal=errors>0?'bronze':hints===0&&(!this.timed||this.remaining>=this.limit*.5)?'gold':'silver';
        this.results.push({id:this.biome.id,time:this.missionElapsed,bonus:this.bonus,medal,errors,hints,mode:this.mode,perk:this.perk,day:this.dailyDate});this.phase=this.index===this.order.length-1?'victory':'cleared';
      }
      return {target,points,phase:this.phase,bonus:this.bonus};
    }
    miss(){
      if(this.phase!=='playing')return false;
      this.tick();if(this.phase!=='playing'||this.now()-this.lastMiss<700)return false;
      this.lastMiss=this.now();this.errors++;this.combo=0;this.lastProtected=this.perk==='shield'&&!this.perkUsed;
      this.lastPenalty=this.lastProtected?0:25;
      if(this.lastProtected)this.perkUsed=true;
      else{this.score=Math.max(0,this.score-25);this.mistakes++;if(this.lives===0){this.failure='lives';this.phase='gameover';}}
      return true;
    }
    hint(){
      if(this.phase!=='playing')return null;
      this.tick();if(this.phase!=='playing')return null;
      const target=shuffle(this.targets.filter(t=>!t.found&&!t.hinted),this.levelRng)[0];if(!target)return null;
      this.lastHintCost=this.perk==='scout'&&this.hints===this.levelHints?0:40;
      target.hinted=true;this.hints++;this.combo=0;this.score=Math.max(0,this.score-this.lastHintCost);return target;
    }
    activatePerk(){if(this.phase!=='playing'||this.perk!=='focus'||this.perkUsed||!this.timed)return false;this.tick();if(this.phase!=='playing')return false;this.perkUsed=true;this.freezeRemaining=8;return true;}
    pause(){if(!['playing','countdown','ready'].includes(this.phase))return false;this.tick();if(!['playing','countdown','ready'].includes(this.phase))return false;this.pausedFrom=this.phase;this.phase='paused';return true;}
    resume(){if(this.phase!=='paused')return false;this.phase=this.pausedFrom||'playing';this.pausedFrom=null;this.lastTick=this.now();return true;}
    beginStartCountdown(){if(this.phase!=='playing'||this.index!==0||this.total!==0||this.missionElapsed!==0)return false;this.phase='ready';this.countdownRemaining=3.6;this.lastTick=this.now();return true;}
    beginCountdown(){if(this.phase!=='cleared')return false;this.phase='countdown';this.countdownRemaining=3;this.lastTick=this.now();return true;}
    skipCountdown(){if(this.phase!=='countdown')return false;this.countdownRemaining=0;this.index++;this.loadMission();return true;}
    get nextLimit(){const m=MODES[this.mode];return Math.max(m.min,m.base-this.total*m.step);}
    next(){if(this.phase!=='cleared')return false;this.index++;this.loadMission();return true;}
    retry(){if(this.phase!=='gameover')return false;this.score=0;this.total=0;this.mistakes=0;this.errors=0;this.hints=0;this.elapsed=0;this.index=0;this.maxCombo=0;this.perkUsed=false;this.failure='time';this.results=[];this.loadMission();return true;}
    continueRelaxed(){if(this.phase!=='gameover')return false;this.mode='relaxed';this.freezeRemaining=0;this.phase='playing';this.lastTick=this.now();return true;}
    snapshot(){
      if(!['playing','paused','countdown','cleared','ready'].includes(this.phase))return null;
      const out={version:1,resumePhase:this.phase==='paused'?this.pausedFrom:this.phase,...this.snapshotFields(this)};
      return JSON.parse(JSON.stringify(out));
    }
    restore(raw){
      // Reject damaged saves before changing a live expedition.
      if(!raw||raw.version!==1||!Object.hasOwn(MODES,raw.mode)||!Object.hasOwn(PERKS,raw.perk)||!['classic','diorama'].includes(raw.variation)||!['playing','countdown','cleared','ready'].includes(raw.resumePhase))return false;
      const ids=BIOMES.map(b=>b.id),integers=['score','total','mistakes','errors','hints','combo','maxCombo','index','bonus','levelErrors','levelHints'];
      if(integers.some(k=>!Number.isSafeInteger(raw[k])||raw[k]<0||raw[k]>1000000))return false;
      if(['limit','remaining','countdownRemaining','elapsed','missionElapsed','freezeRemaining'].some(k=>!Number.isFinite(raw[k])||raw[k]<0||raw[k]>31536000))return false;
      if(raw.index>6||raw.limit<12||raw.limit>75||raw.remaining>raw.limit||raw.countdownRemaining>(raw.resumePhase==='ready'?3.6:3)||raw.freezeRemaining>8||typeof raw.perkUsed!=='boolean')return false;
      if(!Array.isArray(raw.order)||raw.order.length!==7||new Set(raw.order).size!==7||raw.order.some(id=>!ids.includes(id)))return false;
      const biome=BIOMES.find(b=>b.id===raw.order[raw.index]),layoutVersion=raw.layoutVersion??1;if(![1,2].includes(layoutVersion))return false;
      const validLocation=t=>layoutVersion===1?biome.positions.some(([x,y])=>Math.abs(x-t.x)<=.012001&&Math.abs(y-t.y)<=.008001):onSurface(biome.id,t.x,t.y,raw.variation)&&(raw.variation==='classic'?CLASSIC_AREAS:SEARCH_AREAS[biome.id]).some(([l,u,r,b])=>t.x>=l&&t.x<=r&&t.y>=u&&t.y<=b);
      const validProp=t=>t&&Object.hasOwn(PROPS,t.type)&&typeof t.id==='string'&&Number.isFinite(t.x)&&Number.isFinite(t.y)&&t.x>.05&&t.x<.95&&t.y>.05&&t.y<.95&&Number.isFinite(t.scale)&&t.scale>=.92&&t.scale<=1.08&&typeof t.found==='boolean'&&typeof t.hinted==='boolean'&&validLocation(t);
      if(!Array.isArray(raw.targets)||raw.targets.length!==biome.objects.length||raw.targets.some(t=>!validProp(t)||t.id!==biome.id+'-'+t.type||!(raw.variation==='classic'?biome.objects:FOREIGN[biome.id]).includes(t.type))||new Set(raw.targets.map(t=>t.id)).size!==raw.targets.length)return false;
      if(!Array.isArray(raw.nativeProps)||raw.nativeProps.length!==(raw.variation==='classic'?0:layoutVersion===1?3-raw.targets.length:nativeCount(raw.index))||raw.nativeProps.some(t=>!validProp(t)||!t.id.startsWith('native-'+biome.id+'-')||!NATIVE[biome.id].includes(t.type)))return false;
      if(new Set([...raw.targets,...raw.nativeProps].map(t=>t.id)).size!==raw.targets.length+raw.nativeProps.length)return false;
      if(layoutVersion===2){const all=[...raw.targets,...raw.nativeProps];if(all.some((t,i)=>all.slice(0,i).some(other=>propsOverlap(t,other))))return false;}
      if(!Array.isArray(raw.results)||raw.results.length!==(['playing','ready'].includes(raw.resumePhase)?raw.index:raw.index+1))return false;
      if(raw.results.some((r,i)=>!r||r.id!==raw.order[i]||!['bronze','silver','gold'].includes(r.medal)||!Number.isFinite(r.time)||r.time<0||r.time>31536000||!Number.isSafeInteger(r.bonus)||r.bonus<0||r.bonus>150||!Object.hasOwn(MODES,r.mode)||!Object.hasOwn(PERKS,r.perk)))return false;
      const found=raw.targets.filter(t=>t.found).length,completed=raw.results.reduce((n,r)=>n+BIOMES.find(b=>b.id===r.id).objects.length,0);
      if(raw.total!==(['playing','ready'].includes(raw.resumePhase)?completed+found:completed)||raw.total>13||raw.errors<raw.mistakes||raw.levelErrors>raw.errors||raw.levelHints>raw.hints)return false;
      if(raw.resumePhase==='playing'&&(found===raw.targets.length||raw.mode!=='relaxed'&&raw.remaining===0)||!['playing','ready'].includes(raw.resumePhase)&&found!==raw.targets.length||raw.resumePhase==='countdown'&&(raw.index===6||raw.mode==='relaxed')||raw.resumePhase==='cleared'&&raw.index===6)return false;
      if(raw.resumePhase==='ready'&&(raw.index!==0||raw.total!==0||raw.missionElapsed!==0||raw.remaining!==raw.limit||raw.targets.some(t=>t.found||t.hinted)))return false;
      const daily=raw.dailyDate===null?null:dailyMission(raw.dailyDate);if(raw.dailyDate!==null&&!daily||raw.mode==='daily'&&(!daily||raw.perk!=='none'))return false;
      const copy=JSON.parse(JSON.stringify(raw));copy.layoutVersion=layoutVersion;this.reset();for(const key of Object.keys(this.snapshotFields(copy)))this[key]=copy[key];
      this.dailySeed=daily?.seed||null;this.phase=raw.resumePhase==='cleared'?'cleared':'paused';this.pausedFrom=this.phase==='paused'?raw.resumePhase:null;this.lastTick=this.now();this.lastMiss=this.now();this.levelRng=this.rng;this.rememberLayout();return true;
    }
    snapshotFields(raw){const fields=['layoutVersion','mode','perk','variation','dailyDate','score','total','mistakes','errors','hints','combo','maxCombo','index','order','targets','nativeProps','limit','remaining','countdownRemaining','elapsed','missionElapsed','bonus','results','perkUsed','freezeRemaining','levelErrors','levelHints'];return Object.fromEntries(fields.map(key=>[key,raw[key]]));}
    get found(){return this.targets.filter(t=>t.found).length;}
  }
  const api={BIOMES,PROPS,MODES,PERKS,FOREIGN,NATIVE,SEARCH_AREAS,CLASSIC_AREAS,onSurface,nativeCount,propsOverlap,Expedition,dailyMission};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.WorldDebugger=api;
})(typeof globalThis!=='undefined'?globalThis:this);
