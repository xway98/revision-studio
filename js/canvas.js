// --- CANVAS SCALE ---

function getScale() {
  const area = document.getElementById('canvas-area');
  return Math.min((area.clientWidth-40)/375,(area.clientHeight-40)/667);
}

function resizeCanvas() {
  const wrap = document.getElementById('canvas-wrap');
  const s = getScale();
  wrap.style.transform = `scale(${s})`;
}
window.addEventListener('resize',()=>{resizeCanvas();updateSelOverlay();});

function clientToCanvas(cx,cy) {
  const rect = document.getElementById('live-canvas').getBoundingClientRect();
  const s = getScale();
  return { x:(cx-rect.left)/s, y:(cy-rect.top)/s };
}

// --- SELECTION ---

function selectEl(type,ci,idx){
  exitEditMode();
  sel={type,ci,idx};
  document.querySelectorAll('.c-el').forEach(el=>el.classList.remove('selected'));
  const el=getElDOM(type,idx);
  if(el){el.classList.add('selected');updateSelOverlay();}
  renderPropsPanel();
}

function deselectEl(){
  exitEditMode();
  sel={type:null,ci:null,idx:null};
  document.querySelectorAll('.c-el').forEach(el=>el.classList.remove('selected'));
  document.getElementById('sel-overlay').classList.remove('visible');
  renderPropsPanel();
}

function getElDOM(type,idx){
  if(type==='header')return document.querySelector('.c-el[data-type="header"]');
  if(type==='text')return document.querySelector(`.c-el[data-type="text"][data-idx="${idx}"]`);
  if(type==='img')return document.querySelector(`.c-el[data-type="img"][data-idx="${idx}"]`);
  return null;
}

function updateSelOverlay(){
  if(!sel.type)return;
  const el=getElDOM(sel.type,sel.idx);
  if(!el){document.getElementById('sel-overlay').classList.remove('visible');return;}
  const canvas=document.getElementById('live-canvas');
  const cr=canvas.getBoundingClientRect(), er=el.getBoundingClientRect();
  const s=getScale();
  const ov=document.getElementById('sel-overlay');
  ov.style.left=((er.left-cr.left)/s)+'px';
  ov.style.top=((er.top-cr.top)/s)+'px';
  ov.style.width=(er.width/s)+'px';
  ov.style.height=(er.height/s)+'px';
  ov.classList.add('visible');
}

// --- CANVAS DRAG (MOVE) — for elements ---

let moveDrag={active:false,type:null,idx:null,el:null,ox:0,oy:0,startData:{x:0,y:0}};

function startMove(e,type,idx,el){
  if(e.target.classList.contains('sel-handle')||e.target.classList.contains('crop-handle'))return;
  if(editingEl)return;
  e.preventDefault();
  e.stopPropagation();
  selectEl(type,activeCardIdx,idx);
  const canvas=document.getElementById('live-canvas');
  const rect=canvas.getBoundingClientRect();
  const s=getScale();
  const item=getItem(type,idx);
  moveDrag={active:true,type,idx,el,
    ox:e.clientX,oy:e.clientY,
    startData:{x:parseFloat(item.x)||50,y:parseFloat(item.y)||50},
    cW:375,cH:667
  };
}

document.addEventListener('mousemove',e=>{
  if(moveDrag.active){
    const s=getScale();
    const dx=(e.clientX-moveDrag.ox)/s/375*100;
    const dy=(e.clientY-moveDrag.oy)/s/667*100;
    const nx=Math.max(0,Math.min(100,moveDrag.startData.x+dx));
    const ny=Math.max(0,Math.min(100,moveDrag.startData.y+dy));
    moveDrag.el.style.left=nx+'%';
    moveDrag.el.style.top=ny+'%';
    updateSelOverlay();
  }
  if(resizeDrag.active) handleResizeDrag(e);
  if(cropDrag.active) handleCropDragMove(e);
});

document.addEventListener('mouseup',e=>{
  if(moveDrag.active){
    const s=getScale();
    const dx=(e.clientX-moveDrag.ox)/s/375*100;
    const dy=(e.clientY-moveDrag.oy)/s/667*100;
    const nx=Math.round(Math.max(0,Math.min(100,moveDrag.startData.x+dx)));
    const ny=Math.round(Math.max(0,Math.min(100,moveDrag.startData.y+dy)));
    setItemPos(moveDrag.type,moveDrag.idx,nx,ny);
    moveDrag.active=false;
    pushHist();renderPropsPanel();updateSelOverlay();
  }
  if(resizeDrag.active){resizeDrag.active=false;pushHist();renderPropsPanel();updateSelOverlay();}
  if(cropDrag.active){cropDrag.active=false;}
});

function getItem(type,idx){
  const card=getCard();
  if(type==='header')return card.header;
  if(type==='text')return card.texts[idx];
  if(type==='img')return card.imgs[idx];
}

function setItemPos(type,idx,x,y){
  const item=getItem(type,idx);
  if(item){item.x=x;item.y=y;}
}

// --- RESIZE DRAG ---

let resizeDrag={active:false,handle:'',startW:0,startX:0,startMouseX:0};

document.getElementById('sel-overlay').querySelectorAll('.sel-handle').forEach(h=>{
  h.addEventListener('mousedown',e=>{
    e.stopPropagation();e.preventDefault();
    if(!sel.type)return;
    const item=getItem(sel.type,sel.idx);
    resizeDrag={active:true,handle:h.dataset.h,startW:parseFloat(item.width)||80,startX:parseFloat(item.x)||50,startMouseX:e.clientX};
  });
});

function handleResizeDrag(e){
  if(!resizeDrag.active||!sel.type)return;
  const s=getScale();
  const dx=(e.clientX-resizeDrag.startMouseX)/s/375*100;
  const item=getItem(sel.type,sel.idx);
  const h=resizeDrag.handle;
  let newW=resizeDrag.startW;
  if(h.includes('e'))newW=Math.max(10,Math.min(100,resizeDrag.startW+dx*2));
  else if(h.includes('w'))newW=Math.max(10,Math.min(100,resizeDrag.startW-dx*2));
  else if(h==='se'||h==='sw'||h==='ne'||h==='nw')newW=Math.max(10,Math.min(100,resizeDrag.startW+dx*2));
  item.width=Math.round(newW);
  // Update DOM directly for responsiveness
  const el=getElDOM(sel.type,sel.idx);
  if(el)el.style.width=item.width+'%';
  updateSelOverlay();
}

// --- CROP ---

let cropState={ci:null,idx:null,t:0,r:0,b:0,l:0,imgRect:{x:0,y:0,w:0,h:0}};
let cropDrag={active:false,handle:'',startT:0,startR:0,startB:0,startL:0,startMX:0,startMY:0};

function startCrop(){
  if(sel.type!=='img')return;
  const card=getCard();
  const img=card.imgs[sel.idx];
  const el=getElDOM('img',sel.idx);
  if(!el)return;
  const s=getScale();
  const canvas=document.getElementById('live-canvas');
  const cr=canvas.getBoundingClientRect(), er=el.getBoundingClientRect();
  const x=(er.left-cr.left)/s, y=(er.top-cr.top)/s;
  const w=er.width/s, h=er.height/s;
  cropState={ci:activeCardIdx,idx:sel.idx,
    t:img.crop?.t||0,r:img.crop?.r||0,b:img.crop?.b||0,l:img.crop?.l||0,
    imgRect:{x,y,w,h}};
  positionCropOverlay();
  document.getElementById('crop-overlay').classList.add('active');
}

function positionCropOverlay(){
  const {t,r,b,l,imgRect:{x,y,w,h}}=cropState;
  const region=document.getElementById('crop-region');
  const co=document.getElementById('crop-overlay');
  co.style.left=x+'px'; co.style.top=y+'px'; co.style.width=w+'px'; co.style.height=h+'px';
  region.style.left=(l/100*w)+'px'; region.style.top=(t/100*h)+'px';
  region.style.width=((1-(l+r)/100)*w)+'px'; region.style.height=((1-(t+b)/100)*h)+'px';
}

document.querySelectorAll('.crop-handle').forEach(ch=>{
  ch.addEventListener('mousedown',e=>{
    e.stopPropagation();e.preventDefault();
    cropDrag={active:true,handle:ch.dataset.ch,
      startT:cropState.t,startR:cropState.r,startB:cropState.b,startL:cropState.l,
      startMX:e.clientX,startMY:e.clientY};
  });
});

function handleCropDragMove(e){
  const s=getScale();
  const {imgRect:{w,h}}=cropState;
  const dx=(e.clientX-cropDrag.startMX)/s/w*100;
  const dy=(e.clientY-cropDrag.startMY)/s/h*100;
  const ch=cropDrag.handle;
  if(ch.includes('n'))cropState.t=Math.max(0,Math.min(90,cropDrag.startT+dy));
  if(ch.includes('s'))cropState.b=Math.max(0,Math.min(90,cropDrag.startB-dy));
  if(ch.includes('w'))cropState.l=Math.max(0,Math.min(90,cropDrag.startL+dx));
  if(ch.includes('e'))cropState.r=Math.max(0,Math.min(90,cropDrag.startR-dx));
  positionCropOverlay();
}

function confirmCrop(){
  const {ci,idx,t,r,b,l}=cropState;
  cardData[ci].imgs[idx].crop={t,r,b,l};
  document.getElementById('crop-overlay').classList.remove('active');
  pushHist();renderCanvas();updateSelOverlay();
}

function cancelCrop(){
  document.getElementById('crop-overlay').classList.remove('active');
}

// --- RENDER CANVAS ---

function renderCanvas(){
  const lc=document.getElementById('live-canvas');
  // Background
  const bgUrl=convDrive(globalConfig.bg.imgUrl);
  if(bgUrl){lc.style.backgroundImage=`url('${bgUrl}')`;lc.style.backgroundSize='cover';lc.style.backgroundPosition='center';}
  else{lc.style.backgroundImage='none';lc.style.backgroundColor=globalConfig.bg.color;}

  const cont=document.getElementById('canvas-elements');
  cont.innerHTML='';

  const card=getCard();

  // Progress bar
  if(globalConfig.progress.show){
    const p=document.createElement('div');
    p.style.cssText=`position:absolute;top:0;left:0;height:6px;background:#3498db;z-index:200;width:${((activeCardIdx+1)/cardData.length)*100}%;pointer-events:none;`;
    cont.appendChild(p);
  }

  // Logo
  const lUrl=convDrive(globalConfig.logo.url);
  if(lUrl){
    const ld=document.createElement('div');
    ld.style.cssText=`position:absolute;left:${globalConfig.logo.x}%;top:${globalConfig.logo.y}%;width:${globalConfig.logo.width}%;transform:translate(-50%,-50%);z-index:10;pointer-events:none;`;
    ld.innerHTML=`<img src="${lUrl}" style="width:100%;height:auto;display:block;">`;
    cont.appendChild(ld);
  }

  // Header
  if(card.header){
    const h=card.header;
    const bg=hexToRgba(h.bgColor,h.bgAlpha);
    const shadow=(h.shadowBlur||0)>0?`box-shadow:0 4px ${h.shadowBlur}px ${hexToRgba(h.shadowColor||'#000',h.shadowAlpha||50)};`:'';
    const border=(h.borderW||0)>0?`border:${h.borderW}px solid ${h.borderC||'#000'};`:'';
    const el=makeEl('header',-1);
    el.style.cssText+=`left:${h.x}%;top:${h.y}%;width:${h.width}%;z-index:15;`;
    el.querySelector('.c-el-inner').style.cssText=`background:${bg};color:${h.color};font-family:'${h.font}';font-size:${h.size}px;font-weight:bold;text-align:center;padding:10px 14px;border-radius:${h.borderR||8}px;${border}${shadow}line-height:1.3;word-break:break-word;`;
    el.querySelector('.c-el-inner').textContent=h.text;
    cont.appendChild(el);
  }

  // Text boxes
  card.texts.forEach((t,i)=>{
    const el=makeEl('text',i);
    el.style.cssText+=`left:${t.x}%;top:${t.y}%;width:${t.width||85}%;z-index:5;`;
    const inner=el.querySelector('.c-el-inner');
    inner.style.cssText=`font-family:'${t.font}';font-size:${t.size}px;font-weight:${t.weight};color:${t.color};text-align:${t.align};line-height:${t.lineSpace};word-break:break-word;`;
    inner.innerHTML=t.text;
    cont.appendChild(el);
  });

  // Images
  card.imgs.forEach((img,i)=>{
    if(!img.url)return;
    const el=makeEl('img',i);
    el.style.cssText+=`left:${img.x}%;top:${img.y}%;width:${img.width}%;z-index:8;`;
    const crop=img.crop||{t:0,r:0,b:0,l:0};
    const inner=el.querySelector('.c-el-inner');
    inner.style.cssText=`overflow:hidden;border-radius:6px;`;
    const clipPath=`inset(${crop.t}% ${crop.r}% ${crop.b}% ${crop.l}%)`;
    inner.innerHTML=`<img src="${convDrive(img.url)}" style="width:100%;height:auto;display:block;clip-path:${clipPath};border-radius:6px;">`;
    cont.appendChild(el);
  });

  // Re-apply selection
  if(sel.type){
    setTimeout(()=>{
      const el=getElDOM(sel.type,sel.idx);
      if(el){el.classList.add('selected');updateSelOverlay();}
    },0);
  }
}

function makeEl(type,idx){
  const el=document.createElement('div');
  el.className='c-el';
  el.dataset.type=type;
  el.dataset.idx=idx;
  el.innerHTML='<div class="c-el-inner"></div>';

  // Click = select
  el.addEventListener('mousedown',e=>{
    if(e.target.classList.contains('sel-handle'))return;
    if(editingEl&&editingEl!==el){exitEditMode();}
    if(!editingEl){
      selectEl(type,activeCardIdx,idx);
      startMove(e,type,idx,el);
    }
  });

  // Double-click = edit text
  el.addEventListener('dblclick',e=>{
    if(type==='img'){startCrop();return;}
    enterEditMode(el);
  });

  // Prevent canvas-click from deselecting when clicking element
  el.addEventListener('click',e=>e.stopPropagation());

  return el;
}

// Click canvas background = deselect
document.getElementById('canvas-elements').addEventListener('mousedown',e=>{
  if(e.target===document.getElementById('canvas-elements')||e.target===document.getElementById('live-canvas')){deselectEl();}
});
