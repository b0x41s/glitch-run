/* Short event sounds only: no music, loops or background soundscape. */
(function(root){
  'use strict';
  class Soundscape {
    constructor({Audio=root.AudioContext||root.webkitAudioContext}={}){this.Audio=Audio;this.enabled=false;this.ctx=null;this.master=null;this.paused=false;}
    async toggle(){
      if(!this.ctx){if(!this.Audio)return null;try{this.ctx=new this.Audio();this.master=this.ctx.createGain();this.master.gain.value=.2;this.master.connect(this.ctx.destination);}catch{return null;}}
      try{await this.ctx.resume();}catch{return null;}
      this.enabled=!this.enabled;
      if(this.enabled)this.chime('good');
      return this.enabled;
    }
    setPaused(paused){this.paused=paused;}
    tone(f,start,duration=.2,type='sine',volume=.18){if(!this.enabled||!this.ctx||this.paused)return;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),at=this.ctx.currentTime+start;osc.type=type;osc.frequency.value=f;gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);gain.connect(this.master);osc.start(at);osc.stop(at+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
    chime(kind){
      if(kind==='bad'){this.tone(120,0,.2,'triangle',.25);return;}
      if(kind==='hint'){this.tone(440,0,.25);this.tone(660,.12,.3);return;}
      if(kind==='count'){this.tone(330,0,.12,'sine',.08);return;}
      const notes=kind==='win'?[392,494,587,784]:[523,659,784];notes.forEach((n,i)=>this.tone(n,i*.09,kind==='win'?.6:.35));
    }
  }
  const api={Soundscape};if(typeof module==='object'&&module.exports)module.exports=api;else root.WorldSoundscape=api;
})(typeof globalThis!=='undefined'?globalThis:this);
