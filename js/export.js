// --- LOAD FILE ---

function loadHTML(e){
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=ev=>{
    const doc=new DOMParser().parseFromString(ev.target.result,'text/html');
    const meta=doc.getElementById('studio-save-data');
    if(meta){
      try{
        const data=JSON.parse(decodeURIComponent(atob(meta.getAttribute('content'))));
        cardData=data.cardData.map(c=>{
          if(c.img&&!c.imgs){c.imgs=[c.img];delete c.img;}
          c.imgs=c.imgs.map(i=>({crop:{t:0,r:0,b:0,l:0},...i}));
          return c;
        });
        globalConfig={bg:{color:'#fff',imgUrl:''},progress:{show:true},transition:{type:'fade'},customFont:{url:'',name:''},logo:{url:'',width:25,x:50,y:92},drive:{clientId:'',folderId:''},...data.globalConfig};
        if(globalConfig.customFont?.url)applyFontLink(globalConfig.customFont.url);
        activeCardIdx=0;hist=[];histIdx=-1;deselectEl();renderAll();
        alert('Loaded successfully!');
      }catch(err){alert('Error parsing file.');}
    }else alert('No save data found.');
  };
  reader.readAsText(file);e.target.value='';
}

// --- GENERATE & DOWNLOAD HTML ---

function downloadHTML(){
  const saved={cardData,globalConfig};
  const enc=btoa(encodeURIComponent(JSON.stringify(saved)));

  // ── Sanitize all rich text before export to strip browser-injected font noise ──
  const proc=cardData.map(c=>{
    const nc=JSON.parse(JSON.stringify(c));
    nc.imgs.forEach(i=>{i.url=convDrive(i.url);});
    // Clean each text layer's HTML
    nc.texts=nc.texts.map(t=>({...t, text: sanitizeRichHTML(t.text, t.font)}));
    return nc;
  });

  const lUrl=convDrive(globalConfig.logo.url);
  const logoBlk=lUrl?`<div class="element" style="left:${globalConfig.logo.x}%;top:${globalConfig.logo.y}%;width:${globalConfig.logo.width}%;z-index:10;"><img style="width:100%;height:auto;display:block;" src="${lUrl}"></div>`:'';
  const bgUrl=convDrive(globalConfig.bg.imgUrl);
  const bgStyle=bgUrl?`background-image:url('${bgUrl}');background-size:cover;background-position:center;`:`background-color:${globalConfig.bg.color};`;
  const progBlk=globalConfig.progress.show?'<div id="prog"></div>':'';
  const trans=globalConfig.transition?.type||'fade';
  // ── Build a comprehensive font link covering every font actually used ──
  const fontLinks=buildFontLink();

  const code=`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Revision Card</title><meta id="studio-save-data" content="${enc}">
${fontLinks}
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;outline:none;}
body{width:100vw;height:100vh;height:100dvh;overflow:hidden;background:#1a1a1a;user-select:none;}
#canvas{position:absolute;left:50%;top:50%;width:375px;height:667px;${bgStyle}transform-origin:center;overflow:hidden;box-shadow:0 0 30px rgba(0,0,0,.6);transform:translate(-50%,-50%);}
#lt,#rt{position:absolute;top:0;height:100%;width:50%;z-index:100;cursor:pointer;}
#lt{left:0;}#rt{right:0;}
.el{position:absolute;transform:translate(-50%,-50%);}
img{display:block;width:100%;height:auto;}
#prog{position:absolute;top:0;left:0;height:6px;background:#3498db;transition:width .3s;z-index:200;}
#cc{position:absolute;inset:0;}
@keyframes aF{from{opacity:0}to{opacity:1}}
@keyframes aSR{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes aSL{from{transform:translateX(-100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes aZ{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
.tf{animation:aF .35s ease forwards;}
.tsr{animation:aSR .3s ease forwards;}
.tsl{animation:aSL .3s ease forwards;}
.tz{animation:aZ .3s ease forwards;}
</style></head><body>
<div id="canvas">
${progBlk}<div id="lt" onclick="p()"></div><div id="rt" onclick="n()"></div>
${logoBlk}<div id="cc"></div></div>
<script>
const D=${JSON.stringify(proc)},T='${trans}';
let i=0,d='r';
const cc=document.getElementById('cc'),pb=document.getElementById('prog');
function resize(){const s=Math.min(innerWidth/375,innerHeight/667);document.getElementById('canvas').style.transform='translate(-50%,-50%) scale('+s+')';}
window.addEventListener('resize',resize);resize();
function h2r(h,a){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return'rgba('+r+','+g+','+b+','+(a/100)+')';}
function render(){
  const c=D[i];if(pb)pb.style.width=((i+1)/D.length*100)+'%';
  let html='';
  if(c.header&&c.header.text){
    const bg=h2r(c.header.bgColor,c.header.bgAlpha);
    const sw=(c.header.shadowBlur||0)>0?'box-shadow:0 4px '+c.header.shadowBlur+'px '+h2r(c.header.shadowColor||'#000',c.header.shadowAlpha||50)+';':'';
    const bd=(c.header.borderW||0)>0?'border:'+c.header.borderW+'px solid '+(c.header.borderC||'#000')+';':'';
    html+='<div class="el" style="left:'+c.header.x+'%;top:'+c.header.y+'%;width:'+c.header.width+'%;background:'+bg+';color:'+c.header.color+';font-family:\\''+c.header.font+'\\';font-size:'+c.header.size+'px;font-weight:bold;text-align:center;padding:10px 14px;border-radius:'+(c.header.borderR||8)+'px;'+bd+sw+'z-index:15;word-break:break-word;">'+c.header.text+'</div>';
  }
  if(c.texts)c.texts.forEach(t=>{html+='<div class="el" style="width:'+(t.width||85)+'%;left:'+t.x+'%;top:'+t.y+'%;font-family:\\''+t.font+'\\';font-size:'+t.size+'px;font-weight:'+t.weight+';color:'+t.color+';text-align:'+t.align+';line-height:'+t.lineSpace+';word-break:break-word;">'+t.text+'</div>';});
  if(c.imgs)c.imgs.forEach(img=>{if(!img.url)return;const cr=img.crop||{t:0,r:0,b:0,l:0};const cp='inset('+cr.t+'% '+cr.r+'% '+cr.b+'% '+cr.l+'%)';html+='<div class="el" style="left:'+img.x+'%;top:'+img.y+'%;width:'+img.width+'%;"><img src="'+img.url+'" style="clip-path:'+cp+';border-radius:6px;"></div>';});
  cc.className='';cc.innerHTML=html;void cc.offsetWidth;
  const cls=T==='none'?'':T==='fade'?'tf':T==='slide'?(d==='r'?'tsr':'tsl'):'tz';
  if(cls)cc.className=cls;
}
function n(){if(i<D.length-1){d='r';i++;render();}}
function p(){if(i>0){d='l';i--;render();}}
render();
<\/script></body></html>`;

  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([code],{type:'text/html'}));
  a.download='Revision_Card_Final.html';a.click();
}
