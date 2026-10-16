(function(root){
  'use strict';
  function fitWorld(width,height,zoom=1){
    const scale=Math.max(1,Math.min(2.4,Number.isFinite(zoom)?zoom:1));
    const w=Math.max(0,Math.min(width,height*1.5))*scale,h=w/1.5;
    return {width:w,height:h,top:Math.max(0,(height-h)/2),zoom:scale};
  }
  const api={fitWorld};if(typeof module==='object'&&module.exports)module.exports=api;else root.WorldCamera=api;
})(typeof globalThis!=='undefined'?globalThis:this);
