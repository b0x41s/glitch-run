(function(){
  'use strict';
  const client=window.ArcadeScores,$=s=>document.querySelector(s),games=client.GAMES;
  const params=new URLSearchParams(location.search);
  let game=games.some(g=>g.id===params.get('game'))?params.get('game'):games[0].id,period=['all','week','month'].includes(params.get('period'))?params.get('period'):'all',character=params.get('character')||'',authMode='login',loading=0;
  const periodNames={all:'All-time',week:'Deze week',month:'Deze maand'},fmt=n=>Number(n).toLocaleString('nl-NL');
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=value=>{try{return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(value));}catch{return '—';}};
  const label=id=>client.characterLabel(game,id);
  function setUrl(){const p=new URLSearchParams({game,period});if(character)p.set('character',character);history.replaceState(null,'',location.pathname+'?'+p);}
  function headings(){
    const g=games.find(g=>g.id===game);document.documentElement.style.setProperty('--game',g.color);$('#boardTitle').textContent=g.name;$('#gameMetric').textContent=g.metric;$('#playGame').href=new URL('../'+g.href,location.href).href;
    $('#gameFilters').innerHTML=games.map(g=>`<button class="game-tab" data-game="${g.id}" aria-pressed="${g.id===game}" style="--tab-color:${g.color}"><span class="game-mark" aria-hidden="true">${g.mark}</span><strong>${g.name}</strong></button>`).join('');
    document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.period===period)));
    document.querySelectorAll('.personal-period,#recordPeriod').forEach(el=>el.textContent=periodNames[period]);setUrl();
  }
  function recordList(rows,{publicRecords=false,device=false}={}){
    if(!rows.length)return '<p class="subtle">Nog geen records voor deze selectie. Tijd voor een nieuwe ronde.</p>';
    return '<ul class="record-list">'+rows.map(r=>`<li><div><strong>${esc(label(r.character))}</strong><small>${publicRecords?esc(r.username):device?(r.legacy?'Eerder op dit apparaat':date(r.finished_at)+' · dit apparaat'):(fmt(r.runs)+' bevestigde rondes')}</small></div><b>${fmt(r.score??r.best)}</b></li>`).join('')+'</ul>';
  }
  function local(){const rows=client.localRecords({game,period,character:character||undefined});$('#deviceRecords').innerHTML=recordList(rows,{device:true});const count=client.pendingCount();$('#pendingArea').hidden=!count;$('#pendingMessage').textContent=`${count} ${count===1?'score wacht':'scores wachten'} op online bevestiging.`;}
  function account(){const s=client.session();$('#authArea').hidden=!!s;$('#signedIn').hidden=!s;$('#accountTitle').textContent=s?'Klaar voor een record?':'Neem je records mee.';$('#accountIntro').hidden=!!s;$('#playerName').textContent=s?.user.username||'';local();}
  function errorText(error){if(authMode==='register'&&error.status===403)return 'De aanmeldcode klopt niet.';if(authMode==='register'&&error.status===503)return 'Account maken is tijdelijk niet beschikbaar.';return ({0:'De scoreverbinding is niet beschikbaar. Je kunt wel blijven spelen.',401:'Spelersnaam of wachtwoord klopt niet, of je sessie is verlopen.',403:'Deze actie is tijdelijk niet beschikbaar.',409:'Die spelersnaam is al in gebruik.',422:'Controleer je spelersnaam en wachtwoord.',429:'Te veel pogingen. Wacht even en probeer opnieuw.',507:'Je browser kan de accountsessie niet bewaren. Sta browseropslag toe en probeer opnieuw.'})[error.status]||'De scoreverbinding gaf een fout. Probeer later opnieuw.';}
  async function load(){
    const serial=++loading;headings();local();$('#refreshScores').disabled=true;$('#boardResults').setAttribute('aria-busy','true');$('#boardResults').innerHTML='<p class="empty-state">Scores laden…</p>';$('#connectionStatus').textContent='Online scores controleren…';$('#connectionStatus').dataset.online='false';
    const signed=!!client.session();
    const [board,records,personal]=await Promise.allSettled([client.leaderboard(game,{period,character:character||undefined}),client.records(game),signed?client.personal({game,period}):Promise.resolve(null)]);
    if(serial!==loading)return;
    $('#refreshScores').disabled=false;$('#boardResults').setAttribute('aria-busy','false');
    if(board.status==='fulfilled'&&Array.isArray(board.value.entries)){
      $('#connectionStatus').textContent='Online · bevestigde scores';$('#connectionStatus').dataset.online='true';
      const entries=board.value.entries.filter(r=>Number.isSafeInteger(r.score)&&r.score>=0&&typeof r.username==='string'&&typeof r.character==='string');
      const username=client.session()?.user.username;
      $('#boardResults').innerHTML=entries.length?'<table class="rank-table"><thead><tr><th scope="col">Plek</th><th scope="col">Speler / variant</th><th scope="col" class="date-cell">Gespeeld</th><th scope="col">Score</th></tr></thead><tbody>'+entries.map(r=>`<tr class="${r.username===username?'own-row':''}"><td class="rank">${fmt(r.rank)}</td><td><div class="player-cell"><span class="avatar" aria-hidden="true">${esc(r.username.slice(0,2).toUpperCase())}</span><div><strong>${esc(r.username)}${r.username===username?' · jij':''}</strong><small>${esc(label(r.character))}</small></div></div></td><td class="date-cell">${esc(date(r.finished_at))}</td><td class="score">${fmt(r.score)}</td></tr>`).join('')+'</tbody></table>':`<div class="empty-state"><strong>Het speelveld ligt open.</strong>Nog geen bevestigde scores voor deze selectie.<br><a href="${esc($('#playGame').href)}">Speel een ronde en zet je record neer.</a></div>`;
    }else{
      $('#connectionStatus').textContent='Online scores niet beschikbaar';$('#connectionStatus').dataset.online='false';
      $('#boardResults').innerHTML='<div class="empty-state"><strong>De scorekamer is even offline.</strong>Je games blijven speelbaar en je lokale records staan hiernaast. Online scores verschijnen zodra de verbinding beschikbaar is.</div>';
    }
    const chars=records.status==='fulfilled'&&Array.isArray(records.value.records?.[period])?records.value.records[period]:[];
    const filtered=character?chars.filter(r=>r.character===character):chars;
    $('#characterRecords').innerHTML=records.status==='fulfilled'?recordList(filtered,{publicRecords:true}):'<p class="subtle">Online characterrecords zijn nog niet beschikbaar.</p>';
    const options=[...new Set([...chars.map(r=>r.character),...client.localRecords({game,period}).map(r=>r.character),...(character?[character]:[])])].sort((a,b)=>label(a).localeCompare(label(b)));
    $('#characterFilter').innerHTML='<option value="">Alle personages / varianten</option>'+options.map(id=>`<option value="${esc(id)}">${esc(label(id))}</option>`).join('');$('#characterFilter').value=character;
    if(!client.session())$('#personalRecords').innerHTML='<p class="subtle">Log in om je scores van alle apparaten te zien.</p>';
    else if(personal.status==='fulfilled'&&Array.isArray(personal.value))$('#personalRecords').innerHTML=recordList(personal.value.filter(r=>!character||r.character===character));
    else $('#personalRecords').innerHTML='<p class="subtle">Je accountrecords konden niet worden geladen. Je lokale records blijven hieronder beschikbaar.</p>';
    account();
  }
  $('#gameFilters').addEventListener('click',event=>{const button=event.target.closest('[data-game]');if(button){game=button.dataset.game;character='';void load();}});
  $('#periodFilters').addEventListener('click',event=>{const button=event.target.closest('[data-period]');if(button){period=button.dataset.period;void load();}});
  $('#characterFilter').addEventListener('change',event=>{character=event.target.value;void load();});$('#refreshScores').addEventListener('click',()=>void load());
  function authTab(mode){authMode=mode;$('#loginMode').setAttribute('aria-pressed',String(mode==='login'));$('#registerMode').setAttribute('aria-pressed',String(mode==='register'));$('#authSubmit').textContent=mode==='login'?'Inloggen':'Account maken';$('#password').autocomplete=mode==='login'?'current-password':'new-password';$('#registrationCodeField').hidden=mode!=='register';$('#registrationCode').disabled=mode!=='register';$('#registrationCode').required=mode==='register';$('#registrationCode').value='';$('#authMessage').textContent='';}
  $('#loginMode').addEventListener('click',()=>authTab('login'));$('#registerMode').addEventListener('click',()=>authTab('register'));
  $('#accountForm').addEventListener('submit',async event=>{event.preventDefault();$('#authSubmit').disabled=true;$('#authMessage').classList.remove('error');$('#authMessage').textContent='Verbinding maken…';try{await client[authMode]($('#username').value,$('#password').value,...(authMode==='register'?[$('#registrationCode').value]:[]));$('#authMessage').textContent='Je bent ingelogd. Nieuwe rondes worden aan je account gekoppeld.';await load();}catch(error){$('#authMessage').classList.add('error');$('#authMessage').textContent=errorText(error);}finally{$('#password').value='';$('#registrationCode').value='';$('#authSubmit').disabled=false;}});
  $('#logout').addEventListener('click',async()=>{await client.logout();$('#authMessage').textContent='Uitgelogd op dit apparaat.';void load();});
  $('#retryPending').addEventListener('click',async()=>{$('#retryPending').disabled=true;try{await client.flush();await load();}finally{$('#retryPending').disabled=false;}});
  client.onChange(account);window.addEventListener('storage',event=>{if(event.key?.startsWith('tex-arcade-')){account();void load();}});window.addEventListener('online',()=>void load());
  account();void load();if(client.session())void client.me().then(account).catch(account);
})();
