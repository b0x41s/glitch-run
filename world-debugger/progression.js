/* Validated local career data. No network or account is required. */
(function(root){
  'use strict';
  const MEDALS={bronze:{name:'Brons',value:1,xp:20},silver:{name:'Zilver',value:2,xp:40},gold:{name:'Goud',value:3,xp:60}};
  const BADGES={
    first:{name:'Eerste herstel',desc:'Herstel je eerste wereld.'},
    atlas:{name:'Wereldreiziger',desc:'Herstel alle zeven verschillende biomen.'},
    expedition:{name:'De balansbewaker',desc:'Voltooi een volledige campagne.'},
    flawless:{name:'Adelaarsoog',desc:'Voltooi een campagne zonder foute klik of hint.'},
    sprint:{name:'Bliksemsnel',desc:'Voltooi de Sprint zonder van modus te wisselen.'},
    survival:{name:'Overlever',desc:'Voltooi Overleving met minstens één leven.'},
    golden:{name:'Gouden atlas',desc:'Verdien goud in alle zeven biomen.'},
    night:{name:'Licht in de duisternis',desc:'Voltooi Nachtwacht zonder van modus te wisselen.'},
    daily:{name:'Dagheld',desc:'Voltooi een volledige dagmissie.'}
  };
  const ids=['alpine','desert','coral','volcano','frozen','harvest','ocean'];
  class Career {
    constructor(raw={}){
      this.xp=Number.isSafeInteger(raw?.xp)&&raw.xp>=0?Math.min(raw.xp,10000000):0;
      this.completed=Number.isSafeInteger(raw?.completed)&&raw.completed>=0?Math.min(raw.completed,1000000):0;
      this.medals={};for(const id of ids)if(Object.hasOwn(MEDALS,raw?.medals?.[id]))this.medals[id]=raw.medals[id];
      this.badges=Object.keys(BADGES).filter(id=>Array.isArray(raw?.badges)&&raw.badges.includes(id));
    }
    static parse(text){try{return new Career(JSON.parse(text));}catch{return new Career();}}
    get rank(){return Math.min(20,1+Math.floor(this.xp/300));}
    get rankName(){return this.rank>=15?'Legende':this.rank>=10?'Balansbewaker':this.rank>=5?'Boswachter':'Verkenner';}
    get nextRankXP(){return this.rank===20?0:300-this.xp%300;}
    unlock(id){if(!this.badges.includes(id)){this.badges.push(id);return id;}return null;}
    award(result){
      if(!ids.includes(result?.id)||!Object.hasOwn(MEDALS,result?.medal))return [];
      this.xp=Math.min(10000000,this.xp+MEDALS[result.medal].xp);
      if(!this.medals[result.id]||MEDALS[result.medal].value>MEDALS[this.medals[result.id]].value)this.medals[result.id]=result.medal;
      const earned=[this.unlock('first')];
      if(ids.every(id=>this.medals[id]))earned.push(this.unlock('atlas'));
      if(ids.every(id=>this.medals[id]==='gold'))earned.push(this.unlock('golden'));
      return earned.filter(Boolean);
    }
    finish(game){
      if(game.phase!=='victory'||game.results.length!==7)return [];
      this.completed=Math.min(1000000,this.completed+1);this.xp=Math.min(10000000,this.xp+100);
      const earned=[this.unlock('expedition')];
      if(game.errors===0&&game.hints===0)earned.push(this.unlock('flawless'));
      for(const mode of ['sprint','survival','night','daily'])if(game.mode===mode&&game.results.every(r=>r.mode===mode))earned.push(this.unlock(mode));
      return earned.filter(Boolean);
    }
    serialize(){return JSON.stringify({version:1,xp:this.xp,completed:this.completed,medals:this.medals,badges:this.badges});}
  }
  const api={Career,MEDALS,BADGES};if(typeof module==='object'&&module.exports)module.exports=api;else root.WorldProgression=api;
})(typeof globalThis!=='undefined'?globalThis:this);
