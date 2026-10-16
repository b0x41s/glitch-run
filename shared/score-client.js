/* Shared browser client for the verified OpenClaw /v1 API. No game waits on it. */
(function (root) {
  'use strict';
  const GAMES = [
    {id:'glitch-run',name:'Glitch Run',href:'#glitch-run',mark:'GR',color:'#39e072',metric:'Coins, afstand en combo’s',minDuration:3},
    {id:'bomber-tribe',name:'Bomber Tribe',href:'bomber-tribe/',mark:'BT',color:'#ffb65b',metric:'Arena-score per character en moeilijkheid',minDuration:5},
    {id:'metro-vice-96',name:'Metro Vice 96',href:'metro-vice-96/',mark:'MV',color:'#b28bff',metric:'Verdiende cash per rit en kaart',minDuration:5},
    {id:'contraption-lab',name:'Contraption Lab',href:'contraption-lab/',mark:'CL',color:'#67d7ff',metric:'1.000 − 50 per onderdeel − 10 per simulatieseconde',minDuration:0},
    {id:'biomes',name:'Biomes',href:'world-debugger/',mark:'BI',color:'#b9dfb0',metric:'World Debugger · records per spelmodus, perk en weergave',minDuration:3}
  ];
  const names={casper:'Casper',bas:'Bas','adult-man':'Bas',tamara:'Tamara','woman-black-dress':'Tamara',lisette:'Lisette','young-girl':'Lisette',laurens:'Laurens'};
  const modes={timed:'Expeditie',relaxed:'Vrij verkennen',sprint:'Sprint',survival:'Overleving',night:'Nachtwacht',daily:'Dagmissie'};
  const perks={none:'Pure natuur',shield:'Veldschild',focus:'Tijdanker',scout:'Spoorzoeker'};
  function characterLabel(game,id){
    if(game==='biomes'){
      const daily=id.match(/^daily-(\d{4}-\d{2}-\d{2})-(classic|diorama)$/);
      if(daily)return `Dagmissie ${daily[1]} · ${daily[2]==='classic'?'Klassiek':'3D'}`;
      const [mode,perk,style]=id.split('-');if(modes[mode]&&perks[perk])return `${modes[mode]} · ${perks[perk]} · ${style==='classic'?'Klassiek':'3D'}`;
    }
    if(game==='bomber-tribe'){const [name,level]=id.split('-');if(names[name])return names[name]+(level?' · '+({easy:'Rustig',normal:'Normaal',hard:'Chaos'}[level]||level):'');}
    return names[id]||({driver:'Bestuurder','custom-map':'Eigen kaart',builder:'Machineproef',default:'Standaard'}[id])||id;
  }
  function periodStart(period,time=Date.now()){
    const d=new Date(time);d.setUTCHours(0,0,0,0);
    if(period==='month')d.setUTCDate(1);else if(period==='week')d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);else return null;
    return d.toISOString();
  }
  class ApiError extends Error {constructor(status,detail){super(detail||'Scoreverbinding niet beschikbaar');this.status=status;}}
  function createClient(options={}){
    const config=Object.assign({},root.TEX_ARCADE_CONFIG||{},options);
    const apiUrl=String(config.apiUrl||config.scoreApiUrl||'https://scores.b0x41s.nl').replace(/\/+$/,'');
    const url=new URL(apiUrl);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw new Error('Gebruik HTTPS voor de score-API');
    if(url.username||url.password||url.search||url.hash)throw new Error('Ongeldige score-API URL');
    let storage=config.storage;try{storage=storage||root.localStorage;}catch{}
    const fetcher=config.fetch||root.fetch?.bind(root),crypto=config.crypto||root.crypto,now=config.now||Date.now;
    const listeners=new Set(),activeRuns=new Map(),authKey='tex-arcade-session-v1',queueKey='tex-arcade-pending-v1',localKey='tex-arcade-records-v1';
    const read=(key,fallback)=>{try{return JSON.parse(storage?.getItem(key)||'null')??fallback;}catch{return fallback;}};
    const write=(key,value)=>{try{storage?.setItem(key,JSON.stringify(value));return !!storage;}catch{return false;}};
    const remove=key=>{try{storage?.removeItem(key);}catch{}};
    const emit=()=>listeners.forEach(fn=>{try{fn();}catch{}});
    const validUser=u=>u&&typeof u.id==='string'&&u.id.length<=64&&typeof u.username==='string'&&/^[A-Za-z0-9_-]{3,20}$/.test(u.username);
    function session(){const s=read(authKey,null);return s?.api===apiUrl&&validUser(s.user)&&typeof s.token==='string'&&s.token.length>=20&&s.token.length<=128?s:null;}
    function clearSession(token){if(!token||session()?.token===token){remove(authKey);emit();}}
    async function request(path,{method='GET',body,token,auth=false}={}){
      const bearer=token??(auth?session()?.token:null);if(auth&&!bearer)throw new ApiError(401,'Authentication required');
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.requestTimeoutMs||4000);
      try{
        const response=await fetcher(apiUrl+'/v1'+path,{method,signal:controller.signal,credentials:'omit',cache:'no-store',headers:{...(body?{'Content-Type':'application/json'}:{}),...(bearer?{Authorization:'Bearer '+bearer}:{})},...(body?{body:JSON.stringify(body)}:{})});
        const data=response.status===204?null:await response.json();
        if(!response.ok){if(response.status===401&&auth)clearSession(bearer);throw new ApiError(response.status,typeof data?.detail==='string'?data.detail:'Ongeldige aanvraag');}
        return data;
      }catch(e){if(e instanceof ApiError)throw e;throw new ApiError(0,'Scoreverbinding niet beschikbaar');}finally{clearTimeout(timer);}
    }
    async function authenticate(kind,username,password){
      const data=await request('/auth/'+kind,{method:'POST',body:{username,password}});
      if(!validUser(data?.user)||typeof data.token!=='string')throw new ApiError(0,'Ongeldig antwoord van de score-API');
      if(!write(authKey,{api:apiUrl,user:data.user,token:data.token}))throw new ApiError(507,'Je browser kan de accountsessie niet bewaren.');emit();void flush();return data.user;
    }
    async function logout(){const s=session();clearSession();if(s)try{await request('/auth/logout',{method:'POST',token:s.token});}catch{} }
    function localRecords({game,period='all',character}={}){
      const saved=read(localKey,{}),bucket=saved[period]||{},since=periodStart(period,now());
      const records=Object.values(bucket).filter(r=>r&&typeof r.game==='string'&&typeof r.character==='string'&&Number.isSafeInteger(r.best)&&r.best>=0&&(!game||r.game===game)&&(!character||r.character===character)&&(period==='all'||r.since===since));
      // Existing local highscores are real device records, with unknown dates.
      // Never turn them into server runs, or label them as this week/month.
      function legacy(g,c,value){const best=Number(value);if(!Number.isSafeInteger(best)||best<=0||game&&g!==game||character&&c!==character)return;const r=records.find(r=>r.game===g&&r.character===c);if(r){if(best>r.best){r.best=best;r.finished_at=null;r.legacy=true;}}else records.push({game:g,character:c,best,finished_at:null,legacy:true});}
      if(period==='all')try{
        for(const id of Object.keys(names))legacy('glitch-run',id,storage?.getItem('tex-glitch-run-best-'+id));
        legacy('glitch-run','casper',storage?.getItem('tex-glitch-run-best'));
        const bomber=read('bomberTribeState',{});
        ['casper','laurens','lisette','tamara','bas'].forEach((id,i)=>legacy('bomber-tribe',id,bomber?.highscores?.[i]));
        for(let i=0;i<(storage?.length||0);i++){const key=storage.key(i);if(key?.startsWith('wd-best-v2-'))legacy('biomes',key.slice(11),storage.getItem(key));}
      }catch{}
      return records.sort((a,b)=>b.best-a.best||a.character.localeCompare(b.character));
    }
    function recordLocal(game,character,score){
      let data=read(localKey,{});if(!data||typeof data!=='object'||Array.isArray(data))data={};
      const finished_at=new Date(now()).toISOString(),key=game+'|'+character;
      for(const period of ['all','week','month']){if(!data[period]||typeof data[period]!=='object'||Array.isArray(data[period]))data[period]={};const since=periodStart(period,now()),old=data[period][key];if(!old||old.since!==since||score>old.best)data[period][key]={game,character,best:score,finished_at,since};}
      const saved=write(localKey,data);emit();return saved;
    }
    function pending(){const q=read(queueKey,[]);return Array.isArray(q)?q.filter(e=>e&&e.api===apiUrl&&/^[-a-f0-9]{36}$/.test(e.run_id)&&/^[a-f0-9]{64}$/.test(e.proof)&&Number.isSafeInteger(e.score)&&e.score>=0&&typeof e.owner==='string'&&e.expiresAt>now()).slice(-500):[];}
    async function sign(secret,message){const enc=new TextEncoder(),key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(message)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
    function handle(game,character,restored,localOnly=false){
      if(!GAMES.some(g=>g.id===game)||!/^[a-z0-9_-]{1,32}$/.test(character))throw new Error('Ongeldige game of scorevariant');
      const s=session(),owner=s?.user.id;let ticket=restored||null,finished=false,finishPromise=null;
      const run={game,character,status:'starting',receipt:null,ready:null,snapshot:()=>ticket&&!finished?{...ticket,api:apiUrl,game,character}:null};
      run.ready=(async()=>{
        if(restored){run.status=owner===restored.owner&&restored.api===apiUrl&&restored.expiresAt>now()?'ready':'local';if(run.status==='local')ticket=null;else activeRuns.set(ticket.run_id,run);return;}
        if(!s||localOnly){run.status='local';return;}
        try{
          const data=await request('/games/'+game+'/runs',{method:'POST',body:{character},token:s.token,auth:true});
          if(!data||!/^[-a-f0-9]{36}$/.test(data.run_id)||!/^[a-f0-9]{64}$/.test(data.secret)||!Number.isFinite(data.expires_in))throw new ApiError(0);
          if(session()?.user.id!==owner){run.status='local';return;}
          ticket={run_id:data.run_id,secret:data.secret,owner,expiresAt:now()+data.expires_in*1000,validAfter:now()+(GAMES.find(g=>g.id===game).minDuration*1000)};run.status='ready';activeRuns.set(ticket.run_id,run);
        }catch{run.status='local';}finally{emit();}
      })();
      run.finish=score=>{
        if(finishPromise)return finishPromise;
        if(!Number.isSafeInteger(score)||score<0)throw new Error('Ongeldige score');
        finished=true;const localSaved=recordLocal(game,character,score);
        finishPromise=(async()=>{
          await run.ready;
          let receipt={status:'local',message:'Op dit apparaat bewaard. Log in vóór je volgende ronde om online mee te doen.'};
          const finishSession=session();
          if(ticket&&finishSession?.user.id===ticket.owner&&ticket.expiresAt>now()&&now()>=ticket.validAfter){
            try{
              const entry={api:apiUrl,owner:ticket.owner,run_id:ticket.run_id,game,character,score,proof:await sign(ticket.secret,ticket.run_id+':'+score),expiresAt:ticket.expiresAt};
              try{const data=await request('/runs/'+entry.run_id+'/finish',{method:'POST',auth:true,token:finishSession.token,body:{score,proof:entry.proof}});if(data?.status!=='accepted'||data.score!==score)throw new ApiError(0);receipt={status:'accepted',message:'Online opgeslagen op je account.'};}
              catch(e){if(e.status===0||e.status===429||e.status>=500){const q=pending();if(q.length<500&&write(queueKey,[...q.filter(x=>x.run_id!==entry.run_id),entry]))receipt={status:'pending',message:'Lokaal bewaard. Online opslaan volgt zodra de verbinding terug is.'};}else receipt={status:'local',message:'Lokaal bewaard. De server heeft deze score niet bevestigd.'};}
            }catch{receipt={status:'local',message:'Lokaal bewaard. Online opslaan is niet beschikbaar.'};}
          }else if(s)receipt={status:'local',message:'Lokaal bewaard. Deze ronde heeft geen geldige online scoresessie.'};
          if(receipt.status==='local'&&!localSaved)receipt.message='Je browser kon deze score niet bewaren. De game blijft speelbaar.';
          if(ticket&&receipt.status!=='pending')activeRuns.delete(ticket.run_id);
          run.status=receipt.status;run.receipt=receipt;emit();return receipt;
        })();return finishPromise;
      };
      return run;
    }
    function beginRun(game,character='default'){return handle(game,character);}
    function restoreRun(data){
      if(!data||data.api!==apiUrl||typeof data.secret!=='string'||!/^[a-f0-9]{64}$/.test(data.secret)||!/^[-a-f0-9]{36}$/.test(data.run_id)||!Number.isFinite(data.validAfter)||!Number.isFinite(data.expiresAt)||typeof data.owner!=='string')return null;
      try{return handle(data.game,data.character,data);}catch{return null;}
    }
    let flushing=null;
    function flush(){
      if(flushing)return flushing;
      flushing=(async()=>{const s=session();if(!s)return;let q=pending();write(queueKey,q);
        for(const entry of q.filter(e=>e.owner===s.user.id)){
          if(session()?.token!==s.token)break;
          let receipt;
          try{const data=await request('/runs/'+entry.run_id+'/finish',{method:'POST',token:s.token,auth:true,body:{score:entry.score,proof:entry.proof}});if(data?.status!=='accepted'||data.score!==entry.score)break;receipt={status:'accepted',message:'Online opgeslagen op je account.'};}
          catch(e){if(e.status===0||e.status===429||e.status>=500||e.status===401)break;receipt={status:'local',message:'Lokaal bewaard. De server heeft deze score niet bevestigd.'};}
          const run=activeRuns.get(entry.run_id);if(run){run.status=receipt.status;run.receipt=receipt;activeRuns.delete(entry.run_id);}
          q=pending().filter(e=>e.run_id!==entry.run_id);write(queueKey,q);emit();
        }
      })().finally(()=>{flushing=null;});return flushing;
    }
    const query=values=>{const p=new URLSearchParams();for(const [k,v] of Object.entries(values))if(v!==undefined&&v!==null&&v!=='')p.set(k,v);return p.toString();};
    const scoresUrl=config.scoresUrl||new URL('scores/',config.arcadeBase||'https://b0x41s.github.io/glitch-run/').href;
    function mountStatus(container,run){
      if(!container||!run||!root.document)return;
      container.querySelector('.arcade-score-status')?.remove();const node=root.document.createElement('p');node.className='arcade-score-status';node.setAttribute('role','status');
      const text=root.document.createElement('span'),link=root.document.createElement('a');link.href=scoresUrl;link.textContent='Scores & account';node.append(text,' ',link);container.append(node);
      const update=()=>{text.textContent=run.receipt?.message||'Score wordt lokaal bewaard en indien mogelijk online opgeslagen.';if(!node.isConnected||run.receipt&&run.receipt.status!=='pending')listeners.delete(update);};listeners.add(update);update();
    }
    return {apiUrl,scoresUrl,GAMES,characterLabel,periodStart,session,request,beginRun,restoreRun,flush,mountStatus,
      beginLocalRun:(game,character='default')=>handle(game,character,null,true),
      localRecords,pendingCount:()=>pending().filter(e=>e.owner===session()?.user.id).length,
      onChange:fn=>{listeners.add(fn);return ()=>listeners.delete(fn);},
      login:(u,p)=>authenticate('login',u,p),register:(u,p)=>authenticate('register',u,p),logout,
      me:()=>request('/me',{auth:true}),games:()=>request('/games'),
      leaderboard:(game,options={})=>request('/games/'+encodeURIComponent(game)+'/leaderboard?'+query({period:'all',limit:100,...options})),
      records:game=>request('/games/'+encodeURIComponent(game)+'/records'),
      personal:options=>request('/me/scores?'+query(options||{}),{auth:true})
    };
  }
  let arcadeBase;try{const base=new URL('../',root.document.currentScript.src);arcadeBase=base.pathname.endsWith('/public/')?new URL('../',base).href:base.href;}catch{}
  const client=createClient({arcadeBase});client.createClient=createClient;root.ArcadeScores=client;
  root.addEventListener?.('online',()=>{void client.flush();});
  root.addEventListener?.('storage',event=>{if(event.key==='tex-arcade-session-v1'||event.key==='tex-arcade-pending-v1'){void client.flush();}});
  if(root.document)void client.flush();
})(typeof globalThis!=='undefined'?globalThis:this);
