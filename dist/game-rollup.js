!function(){class e{constructor(t,e,i,s){this.WIDTH=t,this.HEIGHT=e,this.PAGESIZE=this.WIDTH*this.HEIGHT,this.PAGES=s,this.atlas=i,this.SCREEN=0,this.PAGE_1=this.PAGESIZE,this.PAGE_2=2*this.PAGESIZE,this.PAGE_3=3*this.PAGESIZE,this.PAGE_4=4*this.PAGESIZE,this.cursorX=0,this.cursorY=0,this.cursorColor=23,this.cursorColor2=25,this.stencil=!1,this.stencilSource=this.PAGE_2,this.stencilOffset=0,this.colors=this.atlas.slice(0,64),this.palDefault=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63],this.c=document.createElement("canvas"),this.c.width=this.WIDTH,this.c.height=this.HEIGHT,this.ctx=this.c.getContext("2d"),this.renderTarget=0,this.renderSource=this.PAGESIZE,this.fontString="ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_!@#.'\"?/<()",this.fontBitmap="11111100011111110001100011111010001111101000111110111111000010000100000111111100100101000110001111101111110000111001000011111111111000011100100001000011111100001011110001111111000110001111111000110001111110010000100001001111111111000100001010010111101000110010111001001010001100001000010000100001111110001110111010110001100011000111001101011001110001011101000110001100010111011110100011001011100100000111010001100011001001111111101000111110100011000101111100000111000001111101111100100001000010000100100011000110001100010111010001100011000101010001001000110001101011010101110100010101000100010101000110001010100010000100001001111100010001000100011111001000110000100001000111001110100010001000100111111111000001001100000111110100101001011111000100001011111100001111000001111100111110000111101000101110111110000100010001000010001110100010111010001011100111010001011110000101110011101000110001100010111000000000000000000000111110010000100001000000000100111111000110111101011011101010111110101011111010100000000000000000000000100001100001000100000000000011011010011001000000000000111010001001100000000100000010001000100010001000000010001000100000100000100001000100001000010000010",this.pal=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64],this.dither=[65535,65527,65015,65013,62965,62901,58805,58789,42405,42401,42145,42144,41120,40992,32800,32768,0,63903,1632,63624],this.pat=65535,this.ctx.imageSmoothingEnabled=!1,this.imageData=this.ctx.getImageData(0,0,this.WIDTH,this.HEIGHT),this.buf=new ArrayBuffer(this.imageData.data.length),this.buf8=new Uint8Array(this.buf),this.data=new Uint32Array(this.buf),this.ram=new Uint8Array(this.WIDTH*this.HEIGHT*this.PAGES),this.brightness=[];for(let t=0;6>t;t++)for(let e=0;64>e;e++)this.brightness[64*t+e]=this.colors.indexOf(this.atlas[64*t+e])}setPen(t,e,i=0){this.cursorColor=t,this.cursorColor2=e,this.pat=i}clr(t,e){this.ram.fill(t,e,e+this.PAGESIZE)}pset(t,e,i,s=64){t|=0,e|=0,i=this.stencil?this.pget(t,e,this.stencilSource)+this.stencilOffset:(0|i)%64;let r=this.pat&Math.pow(2,e%4*4+t%4)?i:s;64!=r&&(0>t|t>this.WIDTH-1||0>e|e>this.HEIGHT-1||(this.ram[this.renderTarget+e*this.WIDTH+t]=r))}pget(t,e,i=0){return this.ram[i+(t|=0)+(e|=0)*this.WIDTH]}line(t,e,i,s,r){var a,n,o=(s|=0)-(e|=0),h=(i|=0)-(t|=0);if(0>o?(o=-o,n=-1):n=1,0>h?(h=-h,a=-1):a=1,o<<=1,h<<=1,this.pset(t,e,r),h>o)for(var l=o-(h>>1);t!=i;)0>l||(e+=n,l-=h),l+=o,this.pset(t+=a,e,r);else for(l=h-(o>>1);e!=s;)0>l||(t+=a,l-=o),l+=h,this.pset(t,e+=n,r)}tline(t,e,i,s,r=0,a=0,n=0){var o,h,l=(s|=0)-(e|=0),d=(i|=0)-(t|=0);0>l?(l=-l,h=-1):h=1,0>d?(d=-d,o=-1):o=1;for(var c=t,u=e,f=(l<<=1)-((d<<=1)>>1);c!=i;)0>f||(u+=h,f-=d),f+=l,this.pset(c+=o,u,this.pget(c-r,u-a,this.renderSource)+n)}circle(t,e,i,s){t|=0,e|=0,s|=0;var r=-(i|=0),a=0,n=2-2*i;do{this.pset(t-r,e+a,s),this.pset(t-a,e-r,s),this.pset(t+r,e-a,s),this.pset(t+a,e+r,s),(i=n)>a||(n+=2*++a+1),(i>r||n>a)&&(n+=2*++r+1)}while(0>r)}fillCircle(t,e,i,s){if(t|=0,e|=0,s|=0,(i|=0)>=0){t|=0,e|=0;var r=-(i|=0),a=0,n=2-2*i;do{this.line(t-r,e-a,t+r,e-a,s),this.line(t-r,e+a,t+r,e+a,s),(i=n)>a||(n+=2*++a+1),(i>r||n>a)&&(n+=2*++r+1)}while(0>r)}}tfillCircle(t,e,i,s=0){if(t|=0,e|=0,i|=0,offX=t-mw,offY=e-mh,i>=0){t|=0,e|=0;var r=-(i|=0),a=0,n=2-2*i;do{this.tline(t-r,e-a,t+r,e-a,offX,offY,s),this.tline(t-r,e+a,t+r,e+a,offX,offY,s),(i=n)>a||(n+=2*++a+1),(i>r||n>a)&&(n+=2*++r+1)}while(0>r)}}rect(t,e,i,s,r){let a=0|t,n=0|e,o=t+i|0,h=e+s|0;this.line(a,n,o,n,r|=this.cursorColor),this.line(o,n,o,h,r),this.line(a,h,o,h,r),this.line(a,n,a,h,r)}fillRect(t,e,i,s,r){let a=0|t,n=0|e,o=(t+i|0)-1,h=(e+s|0)-1;r=r;var l=Math.abs(h-n);if(this.line(a,n,o,n,r),l>0)for(;--l;)this.line(a,n+l,o,n+l,r);this.line(a,h,o,h,r)}sspr(t=0,e=0,i=16,s=16,r=0,a=0,n=32,o=32,h=!1,l=!1){var d=i/n,c=s/o;this.pat=this.dither[0];for(var u=0;o>u;u++)for(var f=0;n>f;f++)px=f*d|0,py=u*c|0,e=l?s-py-u:e,t=h?i-px-f:t,source=this.pget(t+px,e+py,this.renderSource),source>0&&this.pset(r+f,a+u,source)}outline(t,e,i,s,r,a){for(let t=0;this.WIDTH>=t;t++)for(let e=0;this.HEIGHT>=e;e++){let n=t-1+e*this.WIDTH,o=t+1+e*this.WIDTH,h=t+(e+1)*this.WIDTH,l=t+(e-1)*this.WIDTH;this.ram[this.renderSource+(t+e*this.WIDTH)]&&(64==this.ram[this.renderSource+n]&&(this.ram[this.renderTarget+n]=i),64==this.ram[this.renderSource+o]&&(this.ram[this.renderTarget+o]=r),64==this.ram[this.renderSource+l]&&(this.ram[this.renderTarget+l]=s),64==this.ram[this.renderSource+h]&&(this.ram[this.renderTarget+h]=a))}}triangle(t,e,i,s){this.line(t.x,t.y,e.x,e.y,s),this.line(e.x,e.y,i.x,i.y,s),this.line(i.x,i.y,t.x,t.y,s)}strokePolygon(t,e,i,s,r=0,a="white"){s=s||Math.floor(240*i)+16;for(let n=0;s>n;n++){let o=n/s*6.283185,h=(n+1)/s*6.283185;this.line(t+Math.cos(o+r)*i,e+Math.sin(o+r)*i,t+Math.cos(h+r)*i,e+Math.sin(h+r)*i,a)}}fillTriangle(t,e,i,s){let r=[Object.assign({},t),Object.assign({},e),Object.assign({},i)].sort((t,e)=>t.y-e.y),a=r[0],n=r[1],o=r[2],h=0,l=0,d=0,c={},u={};if(n.y-a.y>0&&(h=(n.x-a.x)/(n.y-a.y)),o.y-a.y>0&&(l=(o.x-a.x)/(o.y-a.y)),o.y-n.y>0&&(d=(o.x-n.x)/(o.y-n.y)),Object.assign(c,a),Object.assign(u,a),h>l){for(;n.y>=c.y;c.y++,u.y++,c.x+=l,u.x+=h)this.line(c.x,c.y,u.x,c.y,s);for(u=n;o.y>=c.y;c.y++,u.y++,c.x+=l,u.x+=d)this.line(c.x,c.y,u.x,c.y,s)}else{for(;n.y>=c.y;c.y++,u.y++,c.x+=h,u.x+=l)this.line(c.x,c.y,u.x,c.y,s);for(c=n;o.y>=c.y;c.y++,u.y++,c.x+=d,u.x+=l)this.line(c.x,c.y,u.x,c.y,s)}}imageToRam(t,e){let i=document.createElement("canvas");i.width=WIDTH,i.height=HEIGHT;let s=i.getContext("2d");s.drawImage(t,0,0);var r=s.getImageData(0,0,WIDTH,HEIGHT);let a=new Uint32Array(r.data.buffer);for(var n=0;a.length>n;n++)ram[e+n]=colors.indexOf(a[n])}render(){for(var t=this.PAGESIZE;t--;)t>0&&(this.data[t]=this.colors[this.pal[this.ram[t]]]);this.imageData.data.set(this.buf8),this.c.width=this.c.width,this.ctx.putImageData(this.imageData,0,0)}textLine(t){let e=t[0].length;for(var i=0;e>i;i++){let e=this.getCharacter(t[0].charAt(i));for(var s=0;5>s;s++)for(var r=0;5>r;r++)1==e[5*s+r]&&(1==t[4]?this.pset(t[1]+r*t[4]+(5*t[4]+t[3])*i,t[2]+s*t[4]|0,t[5]):this.fillRect(t[1]+r*t[4]+(5*t[4]+t[3])*i,t[2]+s*t[4]|0,t[4],t[4],t[5]))}}text(t){let e=5*t[7],i=t[0].split("\n"),s=i.slice(0),r=i.length,a=s.sort((t,e)=>e.length-t.length)[0],n=a.length*e+(a.length-1)*t[3],o=r*e+(r-1)*t[4];t[5]||(t[5]="left"),t[6]||(t[6]="bottom");var h=t[1],l=t[2],d=t[1]+n,c=t[2]+o;"center"==t[5]?(h=t[1]-n/2,d=t[1]+n/2):"right"==t[5]&&(h=t[1]-n,d=t[1]),"center"==t[6]?(l=t[2]-o/2,c=t[2]+o/2):"bottom"==t[6]&&(l=t[2]-o,c=t[2]);for(var u=h+n/2,f=l+o/2,y=0;r>y;y++){let s=i[y],r=s.length*e+(s.length-1)*t[3],a=t[1],n=t[2]+(e+t[4])*y;"center"==t[5]?a=t[1]-r/2:"right"==t[5]&&(a=t[1]-r),"center"==t[6]?n-=o/2:"bottom"==t[6]&&(n-=o),this.textLine([s,a,n,t[3],t[7],t[8]])}return{sx:h,sy:l,cx:u,cy:f,ex:d,ey:c,width:n,height:o}}getCharacter(t){let e=this.fontString.indexOf(t);return this.fontBitmap.substring(25*e,25*e+25).split("")}}var i=function(){var t,e,i,s,r,a=t=>Math.sin(6.283184*t),n=t=>.003959503758*2**((t-128)/12),o=(t,e,i)=>{var s,r,a,o,l,d,c=h[t.i[0]],u=t.i[1],f=t.i[3]/32,y=h[t.i[4]],w=t.i[5],g=t.i[8]/32,p=t.i[9],m=t.i[10]*t.i[10]*4,x=t.i[11]*t.i[11]*4,v=t.i[12]*t.i[12]*4,E=1/v,T=-t.i[13]/16,I=t.i[14],A=i*2**(2-t.i[15]),C=new Int32Array(m+x+v),D=0,b=0;for(s=0,r=0;m+x+v>s;s++,r++)0>r||(r-=A,l=n(e+(15&(I=I>>8|(255&I)<<4))+t.i[2]-128),d=n(e+(15&I)+t.i[6]-128)*(1+8e-4*t.i[7])),a=1,m>s?a=s/m:m+x>s||(a=(1-(a=(s-m-x)*E))*3**(T*a)),o=c(D+=l*a**f)*u,o+=y(b+=d*a**g)*w,p&&(o+=(2*Math.random()-1)*p),C[s]=80*o*a|0;return C},h=[a,t=>.5>t%1?1:-1,t=>t%1*2-1,t=>{var e=t%1*4;return 2>e?e-1:3-e}];this.init=a=>{t=a,i=0,s=a.rowLen*a.patternLen*((e=a.endPattern)+1)*2,r=new Int32Array(s)},this.generate=()=>{var n,l,d,c,u,f,y,w,g,p,m,x,v,E,T=new Int32Array(s),I=t.songData[i],A=t.rowLen,C=t.patternLen,D=0,b=0,H=!1,S=[];for(d=0;e>=d;++d)for(y=I.p[d],c=0;C>c;++c){var G=y?I.c[y-1].f[c]:0;G&&(I.i[G-1]=I.c[y-1].f[c+C]||0,17>G&&(S=[]));var M=h[I.i[16]],R=I.i[17]/512,W=2**(I.i[18]-9)/A,L=I.i[19],P=I.i[20],O=135.82764118168*I.i[21]/44100,N=1-I.i[22]/255,k=1e-5*I.i[23],U=I.i[24]/32,B=I.i[25]/512,X=6.283184*2**(I.i[26]-9)/A,j=I.i[27]/255,Z=I.i[28]*A&-2;for(m=(d*C+c)*A,u=0;4>u;++u)if(f=y?I.c[y-1].n[c+u*C]:0){S[f]||(S[f]=o(I,f,A));var _=S[f];for(l=0,n=2*m;_.length>l;l++,n+=2)T[n]+=_[l]}for(l=0;A>l;l++)(p=T[w=2*(m+l)])||H?(x=O,L&&(x*=M(W*w)*R+.5),b+=(x=1.5*Math.sin(x))*(v=N*(p-b)-(D+=x*b)),p=3==P?b:1==P?v:D,k&&(p=1>(p*=k)?p>-1?a(.25*p):-1:1,p/=k),H=(p*=U)*p>1e-5,E=p*(1-(g=Math.sin(X*w)*B+.5)),p*=g):E=0,Z>w||(E+=T[w-Z+1]*j,p+=T[w-Z]*j),T[w]=0|E,T[w+1]=0|p,r[w]+=0|E,r[w+1]+=0|p}return++i/t.numChannels},this.createAudioBuffer=t=>{for(var e=t.createBuffer(2,s/2,44100),i=0;2>i;i++)for(var a=e.getChannelData(i),n=i;s>n;n+=2)a[n>>1]=r[n]/65536;return e},this.createWave=()=>{var t=44+2*s-8,e=t-36,i=new Uint8Array(44+2*s);i.set([82,73,70,70,255&t,t>>8&255,t>>16&255,t>>24&255,87,65,86,69,102,109,116,32,16,0,0,0,1,0,2,0,68,172,0,0,16,177,2,0,4,0,16,0,100,97,116,97,255&e,e>>8&255,e>>16&255,e>>24&255]);for(var a=0,n=44;s>a;++a){var o=r[a];i[n++]=255&(o=-32767>o?-32767:o>32767?32767:o),i[n++]=o>>8&255}return i},this.getData=(t,e)=>{for(var i=2*Math.floor(44100*t),s=Array(e),a=0;2*e>a;a+=1){var n=i+a;s[a]=t>0&&r.length>n?r[n]/32768:0}return s}},s={songData:[{i:[2,100,128,0,3,201,128,0,0,0,5,6,58,0,0,0,0,195,6,1,2,135,0,0,32,147,6,28,6],p:[1],c:[{n:[147,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,152,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,154],f:[]}]}],rowLen:5088,patternLen:32,endPattern:0,numChannels:1},a={songData:[{i:[2,100,128,0,3,201,128,0,0,0,5,6,58,0,0,0,0,195,6,1,2,135,0,0,32,147,6,55,6],p:[1],c:[{n:[151,151,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,154,154,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,159,159,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,135,135],f:[]}]}],rowLen:6014,patternLen:32,endPattern:0,numChannels:1};function n(t,e,i){return t+(e-t)*i}function o(t,e=1,i=0,s=.5,r=!1){var a=window.audioCtx.createBufferSource(),n=window.audioCtx.createGain(),o=window.audioCtx.createStereoPanner();return a.buffer=t,a.connect(o),o.connect(n),n.connect(audioMaster),a.playbackRate.value=e,a.loop=r,n.gain.value=s,o.pan.value=i,a.start(),{volume:n,sound:a}}const l={_pressed:{},_released:{},LEFT:37,UP:38,RIGHT:39,DOWN:40,SPACE:32,ONE:49,TWO:50,THREE:51,FOUR:52,a:65,c:67,w:87,s:83,d:68,z:90,x:88,f:70,p:80,r:82,m:77,h:72,isDown(t){return this._pressed[t]},justReleased(t){return this._released[t]},onKeydown(t){this._pressed[t.keyCode]=!0},onKeyup(t){this._released[t.keyCode]=!0,delete this._pressed[t.keyCode]},update(){this._released={}}};class d{constructor(t,e,i,s){this.x=t,this.y=e,this.lifeMax=i,this.life=i,this.alive=!0,this.color=s}draw(){r.pat=r.dither[15-Math.floor(this.life/this.lifeMax*15)];for(let t=Math.floor(this.life/10);t>0;t--)r.circle(this.x-view.x,this.y-view.y,this.lifeMax-this.life-t,this.color);r.circle(this.x-view.x,this.y-view.y,this.lifeMax-this.life,this.color),r.pat=r.dither[0]}update(){this.alive&&(this.life>0?this.life-=1:this.alive=!1)}}800>innerWidth?(screenFactor=2,w=innerWidth/2,h=innerHeight/2):(screenFactor=4,w=Math.floor(innerWidth/4),h=Math.floor(innerHeight/4)),view={x:0,y:0},cursor={x:0,y:0,isDown:!1},viewTarget={x:0,y:0},window.t=1,splodes=[],window.player=new class{constructor(t,e){this.x=t,this.y=e,this.width=8,this.height=16,this.speed={x:2,y:2},this.velocity={x:0,y:0},this.drag={x:.8,y:.8},this.target={x:0,y:0,distance:0},this.alive=!0}draw(){r.fillRect(this.x-view.x,this.y-view.y,this.width,this.height,22)}update(){this.x+=this.velocity.x,this.y+=this.velocity.y;let t=this.target.x-this.x,e=this.target.y-this.y;return this.target.distance=Math.sqrt(t*t+e*e),5>this.target.distance&&(this.velocity.x*=this.drag.x,this.velocity.y*=this.drag.y),0}move(t,e){this.target.x=t,this.target.y=e;let i=Math.atan2(this.target.y-this.y,this.target.x-this.x);this.velocity.x=Math.cos(i)*this.speed.x,this.velocity.y=Math.sin(i)*this.speed.y,playSound(sounds.tada)}}(100,100),screenCenterX=w/2,screenCenterY=h/2,gamestate=0,paused=!1,started=!1,sounds={},soundsReady=0,totalSounds=2,audioTxt="",debugText="";const c=document.createElement("style");function u(){switch(gamestate){case 0:r.clr(0,r.SCREEN),r.text([audioTxt,w/2-2,100,1,3,"center","top",1,22]),audioTxt="CLICK TO INITIALIZE\nGENERATION SEQUENCE",soundsReady==totalSounds?audioTxt="ALL SOUNDS RENDERED.\nTAP OR CLICK TO CONTINUE":started?audioTxt="SOUNDS RENDERING... "+soundsReady:audioTxt="CLICK TO INITIALIZE\nGENERATION SEQUENCE",cursor.isDown&&soundsReady==totalSounds&&(gamestate=1),r.render();break;case 1:t+=1,splodes.push(new d(Math.random()*w,Math.random()*h,30*Math.random(),Math.floor(64*Math.random()))),splodes.forEach(t=>t.update()),(t=>{for(let e=0;t.length>e;e++)t[e].alive||t.splice(e,1)})(splodes),player.update(),viewTarget.x=player.x-screenCenterX,viewTarget.y=player.y-screenCenterY,view.x=n(view.x,viewTarget.x,.1),view.y=n(view.y,viewTarget.y,.1),l.justReleased(l.r)&&(window.t=1,splodes=[],gamestate=1),r.clr(2,r.SCREEN),splodes.forEach(t=>t.draw()),player.draw(),r.render();break;case 2:(()=>{(l.justReleased(l.UP)||l.justReleased(l.w)||l.justReleased(l.z))&&(gamestate=1),r.clr(14,r.SCREEN);let t=Math.ceil(w/32),e=Math.ceil(h/32);for(let e=0;t>e;e++)r.line(32*e,0,32*e,r.HEIGHT,2);for(let t=0;e>t;t++)r.line(0,32*t,r.WIDTH,32*t,2);let i="TITLE SCREEN";r.text([i,w/2-2,100,2,3,"center","top",3,22]),i="CLICK TO BEGIN",r.text([i,w/2-2,120,1,3,"center","top",1,22]),r.render()})()}l.update(),requestAnimationFrame(u)}function f(t){let e=Math.floor(t.pageX/screenFactor),i=Math.floor(t.pageY/screenFactor)+view.y,s=e+view.x;player.move(s,i)}c.type="text/css",c.innerText="\n  canvas {display: inline-block; height:100%; width:100%;  image-rendering: pixelated;\n    image-rendering: crisp-edges; background-color: black;}\n\n  * {\n    overflow: hidden;\n    background-color: black;\n    margin: 0;\n    }\n",document.head.appendChild(c),atlasImage=new Image,atlasImage.src="data:image/webp;base64,UklGRgYBAABXRUJQVlA4TPkAAAAvPwAAAAmAIPx/e4jof2oBEIT/bw8R/U/BbQAAZBPbrG0bm77naNt2L3FjAQCpfJvZtdk21m7QhbpU769xtW3XZicCAJBRmm1G6wHry3sBv3oJ2TaTzQgMgykOw60sEIPJ/NfmfEb0m+KfSWGWH/i/u8auMllLp0n52cfoLvVtXVYKFAcUZfWj5j87X4mHi8bzX1l8HrX3pPYcTlvOVVr9qo3Lavb/rXmB1LJcpoDHLXpMG3GbpNff9Hvj+WI8GbdW+8mBP7FawBlU3S655I2Sr7TX+Qybu3urf71W96O6lRfDTjcaDs1JZ6CujZezdr8z65838/1hdwAA",atlasImage.onload=function(){let t=document.createElement("canvas");t.width=64,t.height=64;let i=t.getContext("2d");i.drawImage(this,0,0),atlas=new Uint32Array(i.getImageData(0,0,64,64).data.buffer),window.r=new e(w,h,atlas,10),window.playSound=o,gamebox=document.getElementById("game"),gamebox.appendChild(r.c),u()},window.addEventListener("keyup",t=>{l.onKeyup(t)},!1),window.addEventListener("keydown",t=>{l.onKeydown(t)},!1),window.addEventListener("blur",()=>{paused=!0},!1),window.addEventListener("focus",()=>{paused=!1},!1),window.addEventListener("mousemove",t=>{cursor.isDown&&f(t)},!1),window.addEventListener("mousedown",t=>{cursor.isDown=!0,f(t)},!1),window.addEventListener("mouseup",()=>{cursor.isDown=!1},!1),window.addEventListener("touchstart",t=>{(gamestate=0)?onWindowInteraction(t):(cursor.isDown=!0,f(t))},!1),onWindowInteraction=t=>{switch(x=t.pageX,y=t.pageY,paused=!1,gamestate){case 0:0!=soundsReady||started||(audioCtx=new AudioContext,audioMaster=audioCtx.createGain(),compressor=audioCtx.createDynamicsCompressor(),compressor.threshold.setValueAtTime(-60,audioCtx.currentTime),compressor.knee.setValueAtTime(40,audioCtx.currentTime),compressor.ratio.setValueAtTime(12,audioCtx.currentTime),compressor.attack.setValueAtTime(0,audioCtx.currentTime),compressor.release.setValueAtTime(.25,audioCtx.currentTime),audioMaster.connect(compressor),compressor.connect(audioCtx.destination),sndData=[{name:"cellComplete",data:s},{name:"tada",data:a}],totalSounds=sndData.length,soundsReady=0,sndData.forEach(t=>{const e=new i;e.init(t.data);let s=!1;setInterval(()=>{if(!s&&(s=1==e.generate(),soundsReady+=s,s)){let i=e.createWave().buffer;audioCtx.decodeAudioData(i,e=>{sounds[t.name]=e})}},0)}),started=!0);break;case 2:case 1:break;case GAMEOVER:}},onclick=t=>{onWindowInteraction(t)},ontouchstart=t=>{onWindowInteraction(t)}}();
