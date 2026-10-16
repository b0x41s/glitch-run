/* Animation layers for the rendered dioramas. Coordinates follow their artwork.
   No scene animation changes hit targets or the expedition clock. */
(function(root){
  'use strict';
  const TAU=Math.PI*2;
  const WATER_MASKS={
    ocean:[[.13,.355],[.53,.613],[.904,.355],[.904,.728],[.53,.974],[.13,.674]],
    coral:[[.56,.475],[.925,.51],[.925,.675],[.522,.953],[.313,.733],[.313,.655]]
  };
  function fishPose(x,y,time,phase){return {x:x+Math.sin(time*.65+phase)*.035,y:y+Math.cos(time*.85+phase)*.014,facing:Math.cos(time*.65+phase)>=0?1:-1};}
  function tailOffset(u,phase){const bend=Math.max(0,(.27-u)/.27);return Math.sin(phase)*bend*bend;}

  function sharkPose(index,time){
    const phase=time*(index?.29:.23)+(index?1.8:.55),center=index?.70:.34,radius=index?.105:.09;
    const x=center+Math.cos(phase)*radius;
    return {x,y:(index?.625:.61)+(index?-.42:.42)*(x-center)+Math.sin(phase)*.021,
      facing:Math.tanh(-Math.sin(phase)*4),roll:Math.sin(time*1.5+index)*.035,tail:Math.sin(time*5+index*2)*.12};
  }
  function fitScene(width,height){const w=Math.min(width,height*1.5);return {width:w,height:w/1.5,x:(width-w)/2,y:(height-w/1.5)/2};}
  class BiomeMotion {
    constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.id='alpine';this.enabled=true;this.time=0;this.width=0;this.height=0;this.dirty=true;this.shark=null;this.sharkLayers=[];}
    set(id,enabled=true){this.id=id;this.enabled=enabled;this.time=0;this.dirty=true;}
    setShark(image){this.shark=image;this.dirty=true;}
    draw(dt,running=true,reduced=false){
      const b=this.canvas.getBoundingClientRect(),w=Math.round(b.width),h=Math.round(b.height);if(!w||!h||!this.ctx)return;
      const ratio=Math.min(root.devicePixelRatio||1,1.5);
      if(w!==this.width||h!==this.height){this.width=w;this.height=h;this.canvas.width=w*ratio;this.canvas.height=h*ratio;this.dirty=true;}
      if(running&&!reduced&&this.enabled)this.time+=Math.max(0,dt);
      if(!this.dirty&&(!running||reduced||!this.enabled))return;
      this.dirty=false;const c=this.ctx;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,w,h);if(!this.enabled)return;
      const fit=fitScene(w,h);c.save();c.translate(fit.x,fit.y);this.w=fit.width;this.h=fit.height;
      if(this.id==='ocean')this.ocean();
      if(this.id==='coral')this.coral();
      if(this.id==='desert')this.ripples(.54,.47,.075,.027);
      if(this.id==='frozen'){this.aurora();this.ripples(.49,.55,.055,.018);this.sparkles([[.27,.56],[.42,.68],[.72,.39]],'#d7f5ff');}
      if(this.id==='alpine')this.alpine();
      if(this.id==='volcano')this.volcano();
      if(this.id==='harvest')this.harvest();
      c.restore();
    }
    polygon(points){const c=this.ctx;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x*this.w,y*this.h):c.moveTo(x*this.w,y*this.h));c.closePath();}
    ripples(x,y,rx,ry){
      const c=this.ctx,t=this.time;for(let i=0;i<3;i++){const p=(t*.22+i/3)%1;c.save();c.globalAlpha=(1-p)*.25;c.strokeStyle='#d9fcff';c.lineWidth=Math.max(.6,this.w*.001);c.beginPath();c.ellipse(x*this.w,y*this.h,rx*this.w*p,ry*this.h*p,0,0,TAU);c.stroke();c.restore();}
    }
    sparkles(points,color='#e4ffff'){
      const c=this.ctx;for(let i=0;i<points.length;i++){const [x,y]=points[i],a=Math.max(0,Math.sin(this.time*1.8+i*2.1));c.save();c.globalAlpha=a*.45;c.strokeStyle=color;c.lineWidth=.8;const r=(1+a)*this.w*.0025;c.beginPath();c.moveTo(x*this.w-r,y*this.h);c.lineTo(x*this.w+r,y*this.h);c.moveTo(x*this.w,y*this.h-r);c.lineTo(x*this.w,y*this.h+r);c.stroke();c.restore();}
    }
    fish(x,y,size,phase,color='#ffcd55'){
      const c=this.ctx,p=fishPose(x,y,this.time,phase);
      c.save();c.translate(p.x*this.w,p.y*this.h);c.scale(p.facing,1);c.globalAlpha=.83;
      c.fillStyle=color;c.beginPath();c.ellipse(0,0,size*this.w,size*this.w*.47,0,0,TAU);c.fill();
      c.fillStyle='#e99529';c.beginPath();c.moveTo(-size*this.w*.8,0);c.lineTo(-size*this.w*1.6,-size*this.w*.65);c.lineTo(-size*this.w*1.6,size*this.w*.65);c.closePath();c.fill();
      c.fillStyle='#fff1b0';c.beginPath();c.moveTo(-size*this.w*.5,-size*this.w*.27);c.lineTo(size*this.w*.7,-size*this.w*.27);c.lineTo(0,0);c.closePath();c.fill();
      c.fillStyle='#122b36';c.beginPath();c.arc(size*this.w*.6,-size*this.w*.12,Math.max(.55,size*this.w*.13),0,TAU);c.fill();c.restore();
    }
    sharkDraw(index){
      if(!this.shark)return;const c=this.ctx,p=sharkPose(index,this.time),img=this.shark;
      const dw=this.w*(index?.175:.185),dh=dw*img.height/img.width;
      // A side-view sprite should retain its body volume while turning.
      const direction=p.facing<0?-1:1,turnScale=.74+.26*Math.abs(p.facing);
      c.save();c.translate(p.x*this.w,p.y*this.h);c.rotate(p.roll);c.scale(direction*turnScale,1);c.globalAlpha=.85;
      // Composite the warped sprite once, so translucent strip edges do not
      // leave stripes across the body. The torso remains one uncut image.
      let layer=this.sharkLayers[index];
      if(!layer&&this.canvas.ownerDocument){layer=this.canvas.ownerDocument.createElement('canvas');this.sharkLayers[index]=layer;}
      if(layer){
        const lw=Math.ceil(dw*2),lh=Math.ceil(dh*2.4);
        if(layer.width!==lw||layer.height!==lh){layer.width=lw;layer.height=lh;}
        const paint=layer.getContext('2d');paint.setTransform(1,0,0,1,0,0);paint.clearRect(0,0,lw,lh);paint.setTransform(2,0,0,2,lw/2,lh/2);
        this.sharkSprite(paint,img,dw,dh,index);c.drawImage(layer,-lw/4,-lh/4,lw/2,lh/2);
      }else this.sharkSprite(c,img,dw,dh,index);
      c.restore();
    }

    sharkSprite(c,img,dw,dh,index){
      const root=.27,phase=this.time*5+index*2;
      c.drawImage(img,root*img.width,0,(1-root)*img.width,img.height,-dw/2+root*dw,-dh/2,dw*(1-root),dh);
      for(let n=0;n<10;n++){
        const u=n*root/10,v=(n+1)*root/10,width=(v-u)*dw;
        const y0=tailOffset(u,phase)*dh*.065,y1=tailOffset(v,phase)*dh*.065;
        const pad=.6,left=Math.max(0,u-pad/dw),right=Math.min(root+.001,v+pad/dw);
        c.save();c.translate(-dw/2+u*dw,y0);c.transform(1,(y1-y0)/width,0,1,0,0);
        c.drawImage(img,left*img.width,0,(right-left)*img.width,img.height,(left-u)*dw,-dh/2,(right-left)*dw,dh);c.restore();
      }
    }
    ocean(){
      const c=this.ctx;c.save();this.polygon(WATER_MASKS.ocean);c.clip();
      this.sharkDraw(0);this.sharkDraw(1);
      this.caustics();
      for(let i=0;i<8;i++)this.fish(.27+(i%4)*.11,.64+Math.floor(i/4)*.065,.006,i*.85,i%2?'#ffc34b':'#ffb960');
      for(let i=0;i<10;i++){const p=(this.time*.14+i*.31)%1,x=.24+(i%5)*.12,y=.78-p*.24;c.globalAlpha=Math.sin(p*Math.PI)*.32;c.strokeStyle='#d9ffff';c.lineWidth=.7;c.beginPath();c.arc(x*this.w,y*this.h,this.w*.0025*(1+p),0,TAU);c.stroke();}
      c.restore();this.ripples(.56,.38,.07,.018);this.sparkles([[.35,.36],[.55,.43],[.75,.39],[.45,.5]]);
    }
    coral(){
      const c=this.ctx;c.save();this.polygon(WATER_MASKS.coral);c.clip();
      for(let i=0;i<6;i++)this.fish(.57+i*.045,.83-i*.03,.0055,i*1.2,i%2?'#ffcd55':'#71ccee');
      for(let i=0;i<6;i++){const p=(this.time*.12+i/6)%1;c.save();c.globalAlpha=Math.sin(p*Math.PI)*.25;c.strokeStyle='#e6ffff';c.lineWidth=.7;c.beginPath();c.arc((.61+i*.043)*this.w,(.86-p*.24)*this.h,this.w*.002*(1+p),0,TAU);c.stroke();c.restore();}c.restore();
      this.ripples(.73,.58,.065,.022);this.sparkles([[.66,.57],[.78,.54],[.63,.65]]);
    }
    caustics(){
      const c=this.ctx;c.save();c.globalAlpha=.075;c.strokeStyle='#c5fcff';c.lineWidth=Math.max(.6,this.w*.001);
      for(let row=0;row<4;row++){c.beginPath();for(let col=0;col<13;col++){const x=.17+col*.055+Math.sin(this.time*.45+row+col*.7)*.008,y=.61+row*.052+Math.sin(this.time*.65+col*1.6+row)*.012;if(col===0)c.moveTo(x*this.w,y*this.h);else c.lineTo(x*this.w,y*this.h);}c.stroke();}c.restore();
    }
    aurora(){
      const c=this.ctx;c.save();c.lineCap='round';c.shadowBlur=this.w*.015;
      for(let band=0;band<3;band++){
        c.globalAlpha=.065;c.strokeStyle=['#85f3cc','#9fbdfc','#c3a2f7'][band];c.shadowColor=c.strokeStyle;c.lineWidth=this.h*.009;
        // The open sky beside the ice peaks keeps light off the terrain.
        for(const start of [.10,.75]){c.beginPath();for(let i=0;i<=24;i++){const x=start+i*.006,y=.035+band*.011+Math.sin(x*14+this.time*.18+band*.4)*.012;if(i===0)c.moveTo(x*this.w,y*this.h);else c.lineTo(x*this.w,y*this.h);}c.stroke();}
      }c.restore();
    }
    smoke(x,y,color,size=.026){
      const c=this.ctx;for(let i=0;i<7;i++){const p=(this.time*.19+i/7)%1,dx=Math.sin(p*3+i)*.013,puff=size*(.55+p);c.save();c.globalAlpha=Math.sin(p*Math.PI)*.19;c.fillStyle=color;c.beginPath();c.ellipse((x+dx+p*.018)*this.w,(y-p*.13)*this.h,puff*this.w,puff*this.h*.8,0,0,TAU);c.fill();c.restore();}
    }
    alpine(){
      const c=this.ctx;this.smoke(.278,.215,'#e5e9ee',.019);
      // Flowing highlights follow the existing waterfall instead of shifting the island.
      for(let i=0;i<10;i++){const p=(this.time*.46+i/10)%1,x=.395+(i%3)*.012,y=.725+p*.16;c.save();c.globalAlpha=Math.sin(p*Math.PI)*.35;c.strokeStyle='#eeffff';c.lineWidth=Math.max(.8,this.w*.0015);c.beginPath();c.moveTo(x*this.w,y*this.h);c.quadraticCurveTo((x-.003)*this.w,(y+.017)*this.h,(x+.004)*this.w,(y+.039)*this.h);c.stroke();c.restore();}
      this.ripples(.416,.884,.045,.013);this.sparkles([[.52,.47],[.49,.56],[.42,.69]]);
    }
    volcano(){
      const c=this.ctx;this.smoke(.53,.13,'#afa5b1',.025);
      const glow=c.createRadialGradient(.531*this.w,.203*this.h,0,.531*this.w,.203*this.h,.055*this.w);glow.addColorStop(0,'rgba(255,177,61,'+(.09+.06*Math.sin(this.time*2))+')');glow.addColorStop(1,'rgba(255,80,0,0)');c.fillStyle=glow;c.fillRect(.475*this.w,.135*this.h,.112*this.w,.155*this.h);
      const flows=[[[.52,.24],[.48,.34],[.47,.48],[.34,.61],[.31,.72]],[[.57,.24],[.62,.37],[.67,.47],[.78,.61],[.81,.76]]];
      for(const path of flows)for(let i=0;i<5;i++){const p=(this.time*.22+i/5)%1,at=p*(path.length-1),n=Math.floor(at),u=at-n,a=path[n],b=path[Math.min(n+1,path.length-1)];c.save();c.globalAlpha=.35*Math.sin(p*Math.PI);c.fillStyle='#ffd466';c.beginPath();c.arc((a[0]+(b[0]-a[0])*u)*this.w,(a[1]+(b[1]-a[1])*u)*this.h,Math.max(1,this.w*.002),0,TAU);c.fill();c.restore();}
    }
    harvest(){
      const c=this.ctx;c.save();c.translate(.710*this.w,.215*this.h);c.scale(1,.82);
      for(let i=0;i<4;i++){c.save();c.rotate(this.time*.36+i*Math.PI/2-.7);const inner=this.w*.013,length=this.w*.11,width=this.w*.023;c.fillStyle='#b57636';c.fillRect(inner,-width*.53,length,width);c.fillStyle='#f5efe0';for(let j=0;j<4;j++)c.fillRect(inner+length*(.12+j*.21),-width*.34,length*.17,width*.65);c.strokeStyle='#e1a650';c.lineWidth=Math.max(1,this.w*.002);c.strokeRect(inner,-width*.53,length,width);c.restore();}
      c.fillStyle='#b47c37';c.beginPath();c.arc(0,0,this.w*.013,0,TAU);c.fill();c.fillStyle='#e8b666';c.beginPath();c.arc(0,0,this.w*.006,0,TAU);c.fill();c.restore();
      this.smoke(.484,.075,'#e0e9e4',.012);
    }
  }
  const api={BiomeMotion,sharkPose,fitScene,WATER_MASKS,tailOffset,fishPose};if(typeof module==='object'&&module.exports)module.exports=api;else root.WorldBiomeMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this);
