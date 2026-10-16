const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('a RAF timestamp before fade creation cannot put audio volume outside 0–1',()=>{
 const frames=[];class Audio{constructor(){this.value=0;}get volume(){return this.value;}set volume(v){if(v<0||v>1)throw RangeError('volume');this.value=v;}}
 const context={Audio,Request,Response,performance:{now:()=>100},requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},cancelAnimationFrame(){},document:{querySelector:()=>null,addEventListener(){}},MutationObserver:class{observe(){}},console};context.window={fetch:async()=>{},addEventListener(){}};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../src/theme-music.js','file://'+__filename),'utf8'),context);
 context.fadeTo(.13,500);frames.shift()(99);assert.equal(context.window.glitchThemeMusic.volume,0);frames.shift()(350);assert.ok(context.window.glitchThemeMusic.volume>0);frames.shift()(1000);assert.equal(context.window.glitchThemeMusic.volume,.13);
 context.fadeTo(0,500);frames.shift()(99);assert.equal(context.window.glitchThemeMusic.volume,.13);frames.shift()(1000);assert.equal(context.window.glitchThemeMusic.volume,0);
});
