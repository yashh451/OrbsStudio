/*!
 * orb-dots v1.0.0 — dotted thought-orb loading indicators for AI & agent UIs
 * Zero dependencies · Canvas 2D · works in every modern browser
 * MIT License
 *
 * Concept inspired by "thinking-orbs" by Jakub Antalik & Alex Brinza.
 * This is an independent implementation.
 *
 *   <canvas data-orb="searching" data-size="24"></canvas>
 *   <script src="orb-dots.js"><\/script>          // auto-mounts [data-orb]
 *
 *   const orb = OrbDots.create(canvas, { state: 'thinking', size: 64 });
 *   orb.setState('solving'); orb.setSpeed(1.5); orb.pause(); orb.destroy();
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else root.OrbDots = factory();
}(typeof self !== 'undefined' ? self : this, function () {
'use strict';

var DOT_CONFIG = {
  "dotColor": "#ffffff",
  "accent": "#64f0d2",
  "useAccent": false,
  "structure": "sphere",
  "rings": 13,
  "density": 22,
  "rsPow": 0.5,
  "tilt": 0.38,
  "spin": 0.18,
  "roll": -0.06,
  "drift": 0.25,
  "shimmer": 1,
  "flicker": 0.45,
  "dotPx": 0,
  "cols": 13,
  "dotScale": 0.78,
  "gap": 1,
  "hex": true,
  "speed": 1,
  "softness": 1,
  "minAlpha": 0.06,
  "glow": 0.35,
  "jitter": 0,
  "theme": "dark"
};
var DOT_STATE_TINT = {"working":"#fbbf24","searching":"#5eb8ff","solving":"#a78bfa","composing":"#f472b6","shaping":"#4ade80","idle":null,"listening":"#64f0d2","thinking":"#a78bfa","processing":"#fbbf24","speaking":null,"success":"#4ade80","error":"#f87171","sleeping":"#64748b","loading":"#94a3b8"};

function dotField(state,nx,ny,r,ang,t,soft,flatEdge){
  var v=0, edge=flatEdge?1-smooth(0.62,1.0,r):1.0;
  switch(state){
    case 'idle':
      v=edge*(0.55+0.45*Math.sin(t*1.1-r*2.2));
      break;
    case 'listening':                     /* concentric intake ripples */
      v=edge*(0.42+0.58*Math.sin(r*7.5-t*3.4));
      break;
    case 'thinking':                      /* slow double-arm swirl */
      v=edge*(0.4+0.6*Math.sin(ang*2+t*2.1-r*4.4));
      break;
    case 'searching':                     /* sweeping radar beam */
      var d=Math.abs(wrapPi(ang-t*2.6));
      v=edge*(0.18+0.9*Math.exp(-d*d*2.4)*(0.55+0.45*r));
      break;
    case 'processing':                    /* orbiting comet */
      var pa=Math.abs(wrapPi(ang-t*3.4)), rr=Math.abs(r-0.62);
      v=edge*(0.16+1.05*Math.exp(-pa*pa*1.6-rr*rr*26.0));
      break;
    case 'speaking':                      /* vertical waveform bands */
      v=edge*(0.3+0.72*Math.abs(Math.sin(nx*3.1+t*3.0))*(1.0-Math.abs(ny)*0.55));
      break;
    case 'success':                       /* bloom outward, settle full */
      var w=(t*1.5)%3.0;
      v=edge*(w<1.4?smooth(w-0.35,w,r)*1.1:1.0);
      break;
    case 'error':                         /* double-flash + jitter */
      var f=(t*2.2)%2.0;
      v=edge*(f<0.22||(f>0.42&&f<0.64)?1.0:0.34);
      break;
    case 'sleeping':                      /* long shallow breath */
      v=edge*(0.14+0.3*Math.sin(t*0.55-r*1.4));
      break;
    default:                              /* loading: rotating dashes */
      v=edge*(0.22+0.85*Math.pow(Math.max(0,Math.sin(ang*3-t*3.2)),3.0));
  }
  return clamp(v*soft,0,1);
}
function smooth(a,b,x){var u=clamp((x-a)/(b-a||1e-4),0,1);return u*u*(3-2*u);}
function clamp(v,a,b){return v<a?a:(v>b?b:v);}
function wrapPi(a){while(a>Math.PI)a-=6.28318530718;while(a<-Math.PI)a+=6.28318530718;return a;}
/* Latitude-ring lattice: dots sit on rings of constant latitude with even
   angular spacing, which is what makes meridian sweeps, band scrambles and
   waveforms-through-rings readable. Each entry: [lat, lon, ringIndex, seed]. */
var _latCache={};
function latticePoints(rings,density){
  var key=rings+'x'+density;
  if(_latCache[key])return _latCache[key];
  var pts=[];
  for(var i=0;i<rings;i++){
    var lat=-Math.PI/2+Math.PI*(i+0.5)/rings;
    var cr=Math.cos(lat);
    var n=Math.max(1,Math.round(density*cr));
    for(var j=0;j<n;j++){
      var lon=2*Math.PI*j/n+((i%2)?Math.PI/n:0);
      pts.push([lat,lon,i,((i*17+j*7)*0.6180339887)%1,j,n]);
    }
  }
  return _latCache[key]=pts;
}
/* dot radius grows sub-linearly with orb size (power ~0.6), so a 20px orb
   keeps chunky readable dots while a 180px orb stays fine-grained */
function radiusScale(size,pow){return Math.pow(size/64,pow===undefined?0.6:pow);}
function wrapAng(a){while(a>Math.PI)a-=6.28318530718;while(a<-Math.PI)a+=6.28318530718;return a;}

/* ---- the six lattice behaviours ---- */
function latticeState(state,p,t,o){
  /* returns {dlon, dlat, rr, v} : longitude/latitude offsets, radial scale, brightness */
  var lat=p[0], lon=p[1], ring=p[2], sd=p[3];
  var dlon=0, dlat=0, rr=1, v=0.55;
  switch(state){
    case 'working':            /* particles riding tilted orbits */
      var orbit=(ring%3);
      dlon=t*(0.5+orbit*0.25);
      dlat=Math.sin(t*0.8+orbit*2.1)*0.10;
      v=0.30+0.70*Math.pow(Math.max(0,Math.sin(lon+dlon+orbit*2.0)),2.0);
      break;
    case 'searching':          /* a scan meridian sweeps the globe */
      var sweep=wrapAng(lon-t*1.5);
      v=0.16+0.95*Math.exp(-sweep*sweep*3.2);
      rr=1+0.05*Math.exp(-sweep*sweep*3.2);
      break;
    case 'solving':            /* bands scramble, then click back solved */
      var cyc=(t*0.45)%1, step=Math.floor(t*0.45);
      var ease=cyc<0.62?(1-Math.pow(1-cyc/0.62,3)):1;
      var target=(((ring*37+step*53)%7)-3)*(Math.PI/6);
      var prev=(((ring*37+(step-1)*53)%7)-3)*(Math.PI/6);
      dlon=prev+(target-prev)*ease;
      v=0.42+0.5*(cyc>0.62?1:ease*0.7);
      break;
    case 'listening':          /* a waveform rolls through the rings */
      var w=Math.sin(lat*3.0-t*2.2);
      rr=1+w*0.11;
      v=0.28+0.72*(0.5+0.5*w);
      break;
    case 'composing':          /* undulating multi-band sash */
      var sash=lat-Math.sin(lon*2.0+t*1.3)*0.42;
      var band=Math.abs(wrapAng(sash*2.4));
      v=0.14+0.95*Math.exp(-band*band*2.6);
      rr=1+0.04*Math.exp(-band*band*2.6);
      break;
    case 'shaping':            /* handled as an outline morph in the draw fn */
      v=0.6;
      break;
    default:
      return null;             /* fall through to the AI-state field */
  }
  return {dlon:dlon,dlat:dlat,rr:rr,v:v*o};
}
var LATTICE_STATES=['working','searching','solving','listening','composing','shaping'];
/* unit-radius outline sampler: 0 sides = circle, else regular polygon */
function polyPoint(sides,u){
  if(!sides){var a=u*6.28318530718;return [Math.cos(a),Math.sin(a)];}
  var seg=u*sides, k=Math.floor(seg), f=seg-k;
  var a1=(k/sides)*6.28318530718-Math.PI/2, a2=((k+1)/sides)*6.28318530718-Math.PI/2;
  var x1=Math.cos(a1),y1=Math.sin(a1),x2=Math.cos(a2),y2=Math.sin(a2);
  return [x1+(x2-x1)*f, y1+(y2-y1)*f];
}
function paintDot(g,x,y,rad,a,v,base,tint,cfg,light){
  if(rad<=0)return;
  var c3=tint?mixRgb(base,tint,Math.min(1,v*1.15)):base;
  var rgb=Math.round(c3[0])+','+Math.round(c3[1])+','+Math.round(c3[2]);
  if(cfg.glow>0&&v>0.3&&!light){
    g.shadowBlur=rad*3.0*cfg.glow;
    g.shadowColor='rgba('+rgb+','+(a*0.8).toFixed(3)+')';
  }else g.shadowBlur=0;
  g.fillStyle='rgba('+rgb+','+Math.min(1,a).toFixed(3)+')';
  g.beginPath();g.arc(x,y,rad,0,6.2832);g.fill();
}

function hexToRgb(h){h=h.replace('#','');
  if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function mixRgb(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
var drawDotOrb = function drawDotOrb(cv,size,time,state,cfg){
  /* guard: zero/negative/NaN size must never produce NaN geometry */
  size=Math.max(1,(typeof size==='number'&&isFinite(size))?size:1);
  var dpr=Math.min((typeof window!=='undefined'&&window.devicePixelRatio)||1,2);
  if(cv.width!==size*dpr||cv.height!==size*dpr){
    cv.width=size*dpr;cv.height=size*dpr;
    /* when the controller owns sizing (applyStyle===false) authors can render
       at one resolution and display at another (supersampling) */
    if(cfg.applyStyle!==false){cv.style.width=size+'px';cv.style.height=size+'px';}
  }
  var g=cv.getContext('2d');
  g.setTransform(dpr,0,0,dpr,0,0);
  g.clearRect(0,0,size,size);
  var R=size/2, cx=R, cy=R, t=time*cfg.speed;
  var base=hexToRgb(cfg.dotColor);
  var tintHex=cfg.useAccent?(DOT_STATE_TINT[state]||cfg.accent):null;
  var tint=tintHex?hexToRgb(tintHex):null;
  var light=cfg.theme==='light';
  g.globalCompositeOperation=light?'source-over':'lighter';

  if(cfg.structure!=='grid'){
    /* ---- lattice globe: latitude rings, tilted axis, orthographic ---- */
    var Rs=R*0.76;                                  /* sphere inset in the box */
    /* base sized so the *median painted* radius lands on the reference's
       1.34px at 64px (the depth and brightness multipliers below average ~0.7) */
    var dotPx=cfg.dotPx>0?cfg.dotPx
              :Math.max(0.34,2.3*radiusScale(size,cfg.rsPow)*cfg.dotScale);
    var rings=Math.max(3,Math.round(cfg.rings*Math.min(1,0.42+size/230)));
    var density=Math.max(3,Math.round(cfg.density*Math.min(1,0.42+size/230)));
    var pts=latticePoints(rings,density);
    var yaw=t*cfg.spin, tilt=cfg.tilt;
    var ct=Math.cos(tilt), st=Math.sin(tilt);
    var isLat=LATTICE_STATES.indexOf(state)>=0;

    if(state==='shaping'){                          /* outline morph, not a globe */
      var seg=(t*0.42)%3, phase=Math.floor(seg), fr=seg-phase;
      var ease=fr<0.55?(1-Math.pow(1-fr/0.55,3)):1;
      var sides=[0,3,4];                            /* circle, triangle, square */
      var nOut=Math.max(14,Math.round(density*2.2));
      for(var q=0;q<nOut;q++){
        var u=q/nOut;
        var pA=polyPoint(sides[phase],u), pB=polyPoint(sides[(phase+1)%3],u);
        var ox=pA[0]+(pB[0]-pA[0])*ease, oy=pA[1]+(pB[1]-pA[1])*ease;
        var rot=t*cfg.roll;
        var xr=ox*Math.cos(rot)-oy*Math.sin(rot), yr=ox*Math.sin(rot)+oy*Math.cos(rot);
        var va=0.55+0.45*Math.sin(u*6.2832*2-t*2.0);
        var aa=(cfg.minAlpha+va*0.9)*(1-cfg.flicker*0.35*(0.5+0.5*Math.sin(t*6.0+q*1.7)));
        paintDot(g,cx+xr*Rs,cy+yr*Rs,dotPx*(0.7+0.5*va),aa,va,base,tint,cfg,light);
      }
      g.shadowBlur=0;return;
    }

    for(var i=0;i<pts.length;i++){
      var p=pts[i], sd=p[3];
      var mod=isLat?latticeState(state,p,t,1):null;
      var lat=p[0]+(mod?mod.dlat:0), lon=p[1]+yaw+(mod?mod.dlon:0);
      var w=cfg.drift, sh=cfg.shimmer;
      lon+=Math.sin(t*0.9+sd*24.1)*0.06*w+Math.sin(t*37.7+sd*61.3)*0.010*sh;
      lat+=Math.cos(t*0.7+sd*17.7)*0.04*w+Math.cos(t*37.7+sd*44.9)*0.008*sh;
      var rr3=(mod?mod.rr:1);
      var cl=Math.cos(lat)*rr3, X0=cl*Math.cos(lon), Y0=Math.sin(lat)*rr3, Z0=cl*Math.sin(lon);
      /* tilt the pole toward the viewer so rings read as a globe */
      var Y1=Y0*ct-Z0*st, Z=Y0*st+Z0*ct;
      /* in-plane roll */
      var ro=t*cfg.roll, cr=Math.cos(ro), sr2=Math.sin(ro);
      var X=X0*cr-Y1*sr2, Y=X0*sr2+Y1*cr;
      var depth=(Z+1)/2;
      var v=mod?mod.v
              :dotField(state,X,Y,Math.sqrt(X*X+Y*Y),Math.atan2(Y,X),t,cfg.softness,false);
      var tw=1-cfg.flicker*0.4*(0.5+0.5*Math.sin(t*6.0+sd*39.1));
      var a=(cfg.minAlpha+v*0.95)*(0.34+0.66*depth)*tw;
      if(a<0.012)continue;
      paintDot(g,cx+X*Rs,cy+Y*Rs,dotPx*(0.6+0.4*depth)*(0.7+0.45*v),a,v,base,tint,cfg,light);
    }
    g.shadowBlur=0;
    return;
  }

  /* ---- grid mode (flat hex/square lattice) ---- */
  var maxN=Math.max(5,Math.floor(size/2.9));
  var gn=Math.max(3,Math.min(Math.round(cfg.cols),maxN));
  var step=(size*0.94)/gn;
  var rowStep=cfg.hex?step*0.866:step;
  var rows=Math.ceil(size/rowStep)+1;
  for(var row=0;row<rows;row++){
    var y=(row-(rows-1)/2)*rowStep;
    var off=(cfg.hex&&row%2)?step/2:0;
    for(var col=-Math.ceil(gn/2)-1;col<=Math.ceil(gn/2)+1;col++){
      var x=col*step+off;
      var dist=Math.sqrt(x*x+y*y)/R;
      if(dist>1.02)continue;
      var nx=x/R, ny=y/R;
      var gv=dotField(state,nx,ny,dist,Math.atan2(ny,nx),t,cfg.softness,true);
      var ga2=Math.max(cfg.minAlpha,gv);
      var jx=0,jy=0;
      if(cfg.jitter>0){
        var s=Math.sin(col*12.9898+row*78.233)*43758.5453; var rnd=s-Math.floor(s);
        jx=Math.sin(t*7+rnd*30)*cfg.jitter*step*0.22;
        jy=Math.cos(t*6.3+rnd*24)*cfg.jitter*step*0.22;
      }
      var grad=Math.max(0.35,step*0.5*cfg.dotScale*(0.55+0.65*gv)/cfg.gap);
      var gc=tint?mixRgb(base,tint,Math.min(1,gv*1.15)):base;
      var grgb=Math.round(gc[0])+','+Math.round(gc[1])+','+Math.round(gc[2]);
      if(cfg.glow>0&&gv>0.25&&!light){
        g.shadowBlur=grad*3.2*cfg.glow;
        g.shadowColor='rgba('+grgb+','+(ga2*0.85).toFixed(3)+')';
      }else g.shadowBlur=0;
      g.fillStyle='rgba('+grgb+','+ga2.toFixed(3)+')';
      g.beginPath();g.arc(cx+x+jx,cy+y+jy,grad,0,6.2832);g.fill();
    }
  }
  g.shadowBlur=0;
};


/* ------------------------------------------------------------------ *
 *  Presets: the six agent states, plus size-tuned defaults
 * ------------------------------------------------------------------ */
var STATES = ['working','searching','solving','listening','composing','shaping'];

var THEMES = {
  dark:  { dotColor: '#ffffff', glow: 0.35, minAlpha: 0.06 },
  light: { dotColor: '#0b0d12', glow: 0,    minAlpha: 0.12 }
};

/* Small orbs are a coarser globe, not a shrunken dense one. */
function sizeTune(size) {
  if (size <= 28) return { rings: 8,  density: 13 };
  if (size <= 48) return { rings: 10, density: 17 };
  return           { rings: 13, density: 22 };
}

function resolveTheme(el, pref) {
  if (pref === 'dark' || pref === 'light') return pref;
  /* walk the element's own ancestor chain — must work in detached trees and
     shadow roots, so this is not gated on a global `document` */
  var n = el;
  while (n && n.nodeType === 1) {
    var attr = n.getAttribute && n.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    if (n.classList && n.classList.contains('dark')) return 'dark';
    if (n.classList && n.classList.contains('light')) return 'light';
    n = n.parentNode || n.host || null;      /* cross shadow-root boundary */
  }
  if (typeof matchMedia === 'function' &&
      matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

function reducedMotion() {
  return typeof matchMedia === 'function' &&
         matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* ------------------------------------------------------------------ *
 *  Orb controller
 * ------------------------------------------------------------------ */
function Orb(canvas, options) {
  if (!canvas) throw new Error('OrbDots: a canvas element is required');
  var o = options || {};
  this.canvas = canvas;
  this.state = o.state || 'working';
  this.size = o.size || canvas.clientWidth || 64;
  this.speedMul = o.speed == null ? 1 : o.speed;
  this.themePref = o.theme || 'auto';
  this.paused = !!o.paused;
  this.userCfg = o.config || {};
  /* display size in CSS px; defaults to `size`, but an author-set inline size
     is respected so render-at-64 / show-at-40 supersampling keeps working */
  this.display = o.display || null;
  this._authorSized = !!(canvas.style && canvas.style.width);
  this.t = 0;
  this._last = 0;
  this._visible = true;
  this._build();

  var self = this;

  /* live theme updates */
  if (this.themePref === 'auto' && typeof MutationObserver === 'function') {
    this._mo = new MutationObserver(function () { self._build(); self._paint(); });
    var n = canvas.parentNode;
    while (n && n.nodeType === 1) {
      this._mo.observe(n, { attributes: true, attributeFilter: ['data-theme', 'class'] });
      n = n.parentNode;
    }
    if (typeof matchMedia === 'function') {
      this._mq = matchMedia('(prefers-color-scheme: light)');
      this._onMq = function () { self._build(); self._paint(); };
      if (this._mq.addEventListener) this._mq.addEventListener('change', this._onMq);
      else if (this._mq.addListener) this._mq.addListener(this._onMq);
    }
  }

  /* stop animating when scrolled out of view — saves battery on long pages */
  if (typeof IntersectionObserver === 'function') {
    this._io = new IntersectionObserver(function (e) {
      self._visible = e[0].isIntersecting;
    }, { threshold: 0 });
    this._io.observe(canvas);
  }

  this._loop = function (now) {
    self._raf = requestAnimationFrame(self._loop);
    /* a non-finite timestamp from a polyfilled rAF would poison the clock
       forever (Math.max(0, NaN) is NaN), so reject it outright */
    if (typeof now !== 'number' || !isFinite(now)) return;
    if (!self._last) self._last = now;
    var dt = (now - self._last) / 1000;
    if (!isFinite(dt)) dt = 0;
    dt = Math.max(0, Math.min(dt, 0.05));
    self._last = now;
    if (self.paused || !self._visible) return;
    self.t += dt * self.speedMul;
    self._paint();
  };
  this._raf = requestAnimationFrame(this._loop);
  this._applySize();
  this._paint();
}

Orb.prototype._build = function () {
  var theme = resolveTheme(this.canvas, this.themePref);
  var tuned = sizeTune(this.size);
  this.cfg = {};
  for (var k in DOT_CONFIG) this.cfg[k] = DOT_CONFIG[k];
  for (var k2 in THEMES[theme]) this.cfg[k2] = THEMES[theme][k2];
  for (var k3 in tuned) this.cfg[k3] = tuned[k3];
  this.cfg.theme = theme;
  for (var k4 in this.userCfg) this.cfg[k4] = this.userCfg[k4];
  this.cfg.applyStyle = false;            /* the controller sizes the canvas */
  if (reducedMotion()) { this.cfg.shimmer = 0; this.cfg.drift = 0; this.cfg.flicker = 0.1; }
  this.theme = theme;
};

Orb.prototype._applySize = function () {
  var px = this.display || (this._authorSized ? null : this.size);
  if (px && this.canvas.style) {
    this.canvas.style.width = px + 'px';
    this.canvas.style.height = px + 'px';
  }
};

Orb.prototype._paint = function () {
  drawDotOrb(this.canvas, this.size, this.t, this.state, this.cfg);
};

Orb.prototype.setState = function (s) {
  this.state = s; if (this.paused) this._paint(); return this;
};
Orb.prototype.setSize = function (px, displayPx) {
  this.size = Math.max(1, px);
  if (displayPx !== undefined) this.display = displayPx;
  this._build(); this._applySize(); this._paint(); return this;
};
Orb.prototype.setSpeed = function (m) { this.speedMul = m; return this; };
Orb.prototype.setTheme = function (t) {
  this.themePref = t; this._build(); this._paint(); return this;
};
Orb.prototype.set = function (patch) {
  for (var k in patch) this.userCfg[k] = patch[k];
  this._build(); this._paint(); return this;
};
Orb.prototype.pause  = function () { this.paused = true;  return this; };
Orb.prototype.play   = function () { this.paused = false; return this; };
Orb.prototype.toPNG  = function () { return this.canvas.toDataURL('image/png'); };
Orb.prototype.destroy = function () {
  cancelAnimationFrame(this._raf);
  if (this._mo) this._mo.disconnect();
  if (this._io) this._io.disconnect();
  if (this._mq && this._onMq) {
    if (this._mq.removeEventListener) this._mq.removeEventListener('change', this._onMq);
    else if (this._mq.removeListener) this._mq.removeListener(this._onMq);
  }
};

/* ------------------------------------------------------------------ *
 *  Public API
 * ------------------------------------------------------------------ */
function create(canvas, options) { return new Orb(canvas, options); }

/* auto-mount every <canvas data-orb="state"> on the page */
function auto(root) {
  var scope = root || (typeof document !== 'undefined' ? document : null);
  if (!scope) return [];
  var out = [];
  var nodes = scope.querySelectorAll('canvas[data-orb]');
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    if (el.__orb) continue;
    var st = el.getAttribute('data-orb') || 'working';
    var orb = new Orb(el, {
      state: st,
      size: parseInt(el.getAttribute('data-size'), 10) || el.clientWidth || 64,
      display: parseInt(el.getAttribute('data-display'), 10) || null,
      speed: parseFloat(el.getAttribute('data-speed')) || 1,
      theme: el.getAttribute('data-theme-mode') || 'auto'
    });
    if (el.setAttribute && !el.getAttribute('aria-label')) {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', st + '\u2026');
    }
    el.__orb = orb;
    out.push(orb);
  }
  return out;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', function () { auto(); });
  else auto();
}

return {
  create: create,
  auto: auto,
  Orb: Orb,
  STATES: STATES,
  defaults: DOT_CONFIG,
  draw: drawDotOrb,
  version: '1.0.0'
};
}));
