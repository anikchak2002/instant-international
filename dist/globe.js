/* A lightweight, locally drawn globe. No external runtime or tracking requests. */
(() => {
  'use strict';
  const canvas = document.getElementById('chemistry-globe');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const stage = canvas.closest('.globe-stage');
  const toggle = stage.querySelector('.globe-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches;
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let rotation = -1.12;
  let orbitTime = 0;
  let size = 600;
  // Simplified geographic outlines, sampled as dots rather than filled map shapes.
  const continents = [
    [[-168,71],[-150,70],[-139,60],[-129,53],[-125,42],[-117,32],[-110,29],[-105,21],[-98,17],[-89,21],[-83,10],[-77,8],[-83,23],[-81,27],[-80,32],[-75,35],[-67,45],[-58,48],[-56,54],[-66,60],[-81,62],[-94,73],[-117,72],[-135,69]],
    [[-81,12],[-70,11],[-61,9],[-51,4],[-35,-6],[-39,-17],[-45,-23],[-49,-28],[-54,-35],[-64,-54],[-71,-55],[-75,-42],[-72,-30],[-77,-15],[-81,-5]],
    [[-53,60],[-43,60],[-20,72],[-21,82],[-41,84],[-61,78]],
    [[-17,36],[-5,36],[11,37],[24,33],[33,30],[35,22],[43,12],[51,11],[42,0],[39,-10],[33,-26],[22,-35],[17,-29],[12,-16],[9,3],[-2,5],[-9,5],[-17,15]],
    [[-10,36],[-9,43],[-2,48],[-5,51],[3,54],[6,58],[10,56],[8,63],[19,71],[31,70],[29,60],[41,56],[40,45],[30,41],[27,36],[19,40],[14,45],[11,44],[17,39],[15,37],[7,44],[0,42]],
    [[28,70],[54,74],[84,77],[112,73],[140,72],[178,66],[178,55],[163,60],[151,56],[141,47],[133,43],[128,37],[122,31],[122,23],[113,19],[108,11],[105,6],[101,2],[98,11],[94,19],[87,22],[81,8],[77,7],[72,20],[66,25],[58,24],[55,16],[46,13],[40,29],[35,35],[42,43],[48,49],[40,57]],
    [[112,-11],[127,-12],[134,-11],[137,-15],[145,-14],[154,-26],[151,-36],[143,-39],[135,-35],[128,-32],[115,-35],[113,-26]],
    [[47,-13],[51,-16],[49,-25],[44,-25],[43,-19]],
    [[130,32],[136,34],[142,41],[145,44],[143,35],[137,31]],
    [[96,5],[103,1],[106,-6],[114,-8],[115,-5],[108,-2],[104,4]],
    [[109,7],[118,7],[120,-2],[114,-4],[109,0]],
    [[120,18],[124,15],[126,6],[122,6],[119,12]],
    [[130,-3],[142,-3],[151,-7],[146,-10],[135,-6]],
    [[166,-34],[178,-38],[174,-43],[167,-47],[165,-43],[172,-39]],
    [[-8,50],[-3,50],[1,52],[-3,59],[-6,58]],
    [[-25,63],[-14,64],[-16,67],[-23,67]]
  ];
  function inside(lon, lat, polygon) {
    let hit = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];
      if ((a[1] > lat) !== (b[1] > lat) && lon < (b[0] - a[0]) * (lat - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
    }
    return hit;
  }
  const dots = [];
  const rad = Math.PI / 180;
  for (let lat = -57; lat <= 82; lat += 2.5) {
    const step = 2.5 / Math.max(.22, Math.cos(lat * rad));
    for (let lon = -180; lon < 180; lon += step) {
      if (continents.some(polygon => inside(lon, lat, polygon))) dots.push({lat:lat * rad,lon:lon * rad});
    }
  }
  function project(lat, lon, radius) {
    const x = Math.cos(lat) * Math.sin(lon + rotation);
    const y = -Math.sin(lat);
    const z = Math.cos(lat) * Math.cos(lon + rotation);
    const tilt = -.12;
    return {x:size / 2 + radius * (x * Math.cos(tilt) - y * Math.sin(tilt)), y:size / 2 + radius * (x * Math.sin(tilt) + y * Math.cos(tilt)), z};
  }
  function drawOrbital(radius, angle, squish, phase, foreground) {
    ctx.beginPath();
    let begun = false;
    for (let i = 0; i <= 180; i++) {
      const t = i / 180 * Math.PI * 2;
      const front = Math.sin(t) >= 0;
      if (front !== foreground) { begun = false; continue; }
      const x = Math.cos(t) * radius, y = Math.sin(t) * radius * squish;
      const px = size / 2 + x * Math.cos(angle) - y * Math.sin(angle);
      const py = size / 2 + x * Math.sin(angle) + y * Math.cos(angle);
      if (!begun) { ctx.moveTo(px,py); begun = true; } else ctx.lineTo(px,py);
    }
    ctx.strokeStyle = foreground ? 'rgba(223,151,38,.65)' : 'rgba(108,152,199,.16)';
    ctx.lineWidth = size / 650;
    ctx.stroke();
    const t = phase + orbitTime;
    if ((Math.sin(t) >= 0) === foreground) {
      const x = Math.cos(t) * radius, y = Math.sin(t) * radius * squish;
      const px = size / 2 + x * Math.cos(angle) - y * Math.sin(angle);
      const py = size / 2 + x * Math.sin(angle) + y * Math.cos(angle);
      const glow = ctx.createRadialGradient(px,py,0,px,py,size*.021);
      glow.addColorStop(0,'rgba(245,174,52,.45)'); glow.addColorStop(1,'rgba(245,174,52,0)');
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(px,py,size*.021,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=foreground?'#e8a132':'#a6bdd7';ctx.beginPath();ctx.arc(px,py,size*.0042,0,Math.PI*2);ctx.fill();
    }
  }
  function draw() {
    ctx.clearRect(0,0,size,size);
    const radius = size * .322;
    const cx = size / 2, cy = size / 2;
    const halo=ctx.createRadialGradient(cx,cy,radius*.55,cx,cy,radius*1.27);
    halo.addColorStop(0,'rgba(205,226,249,.08)');halo.addColorStop(.78,'rgba(204,225,249,.18)');halo.addColorStop(1,'rgba(220,235,251,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,radius*1.27,0,Math.PI*2);ctx.fill();
    drawOrbital(radius*1.27,-.38,.32,.3,false);
    drawOrbital(radius*1.13,.75,.3,2.7,false);
    const sphere=ctx.createRadialGradient(cx-radius*.35,cy-radius*.3,radius*.05,cx,cy,radius);
    sphere.addColorStop(0,'rgba(250,253,255,.8)');sphere.addColorStop(.8,'rgba(221,236,253,.4)');sphere.addColorStop(1,'rgba(188,213,242,.28)');
    ctx.fillStyle=sphere;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(67,123,182,.12)';ctx.lineWidth=.7;ctx.stroke();
    // Faint graticule establishes the sphere without competing with its continents.
    ctx.lineWidth=.55;
    for(let lat=-60;lat<=60;lat+=30){
      ctx.beginPath();let started=false;
      for(let lon=-180;lon<=180;lon+=3){const p=project(lat*rad,lon*rad,radius);if(p.z<0){started=false;continue;}if(!started){ctx.moveTo(p.x,p.y);started=true;}else ctx.lineTo(p.x,p.y);}
      ctx.strokeStyle='rgba(55,111,172,.10)';ctx.stroke();
    }
    for(let lon=-180;lon<180;lon+=30){
      ctx.beginPath();let started=false;
      for(let lat=-90;lat<=90;lat+=3){const p=project(lat*rad,lon*rad,radius);if(p.z<0){started=false;continue;}if(!started){ctx.moveTo(p.x,p.y);started=true;}else ctx.lineTo(p.x,p.y);}
      ctx.strokeStyle='rgba(55,111,172,.09)';ctx.stroke();
    }
    for(const point of dots){
      const p=project(point.lat,point.lon,radius);
      const opacity=p.z<0?.055:.26+.66*Math.pow(p.z,.45);
      ctx.fillStyle=`rgba(28,93,165,${opacity})`;
      ctx.beginPath();ctx.arc(p.x,p.y,size*(p.z<0?.0015:.00205+.00065*p.z),0,Math.PI*2);ctx.fill();
    }
    // Fixed geographic nodes rotate with the earth; these are visual connections, not office claims.
    for(const [lat,lon] of [[19,73],[31,32],[51,0],[1,104],[-23,-46],[35,139]]){
      const p=project(lat*rad,lon*rad,radius);
      if(p.z<.06)continue;
      ctx.strokeStyle=`rgba(230,155,37,${.3+p.z*.4})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,size*.011,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#eca12e';ctx.beginPath();ctx.arc(p.x,p.y,size*.004,0,Math.PI*2);ctx.fill();
    }
    drawOrbital(radius*1.27,-.38,.32,.3,true);
    drawOrbital(radius*1.13,.75,.3,2.7,true);
  }
  function stop(){cancelAnimationFrame(frame);frame=0;lastTime=0;}
  function animate(time){
    if(paused||!visible||document.hidden){stop();return;}
    const dt=lastTime?Math.min((time-lastTime)/1000,.06):0;
    lastTime=time;rotation+=dt*.075;orbitTime+=dt*.15;draw();frame=requestAnimationFrame(animate);
  }
  function sync(){
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.setAttribute('aria-label',paused?'Play globe animation':'Pause globe animation');
    toggle.querySelector('span:first-child').textContent=paused?'▷':'Ⅱ';
    toggle.querySelector('.toggle-label').textContent=paused?'Play motion':'Pause motion';
    stop();if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(animate);
  }
  function resize(){
    size=canvas.getBoundingClientRect().width;
    if(!size)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(size*dpr);canvas.height=Math.round(size*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  toggle.addEventListener('click',()=>{paused=!paused;sync();});
  reducedMotion.addEventListener('change',event=>{paused=event.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(stage);
  resize();sync();
})();
