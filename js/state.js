// --- STATE ---

const DEFAULT_FONTS = ['Arial','Roboto','Montserrat','Poppins','Oswald','Lora','Comic Neue','Courier Prime'];
const ALIGNS = ['left','center','right','justify'];

let activeCardIdx = 0;
let sel = { type:null, ci:null, idx:null }; // selected element
let editingEl = null; // DOM element currently in text-edit mode

let globalConfig = {
  bg:{color:'#ffffff',imgUrl:''},
  progress:{show:true},
  transition:{type:'fade'},
  customFont:{url:'',name:''},
  logo:{url:'',width:25,x:50,y:92},
  drive:{clientId:'',folderId:''}
};

let cardData = [{
  type:'revision',
  header:{text:'Electrochemistry',font:'Arial',size:22,color:'#ffffff',bgColor:'#3498db',bgAlpha:100,x:50,y:7,width:90,borderW:0,borderC:'#000',borderR:8,shadowBlur:0,shadowAlpha:50,shadowColor:'#000'},
  texts:[{text:'Tap to edit this text box',font:'Arial',size:17,x:50,y:44,align:'center',color:'#2c3e50',weight:'normal',lineSpace:1.5,width:85}],
  imgs:[{url:'',width:40,x:50,y:74,crop:{t:0,r:0,b:0,l:0}}]
}];

// --- UNDO / REDO ---

let hist=[], histIdx=-1, histTimer=null;

function pushHist() {
  clearTimeout(histTimer);
  histTimer = setTimeout(()=>{
    hist = hist.slice(0,histIdx+1);
    hist.push(JSON.parse(JSON.stringify({cardData,globalConfig})));
    if(hist.length>60)hist.shift();
    histIdx = hist.length-1;
    updUndoBtns();
  },350);
}

function undo() {
  clearTimeout(histTimer);
  if(histIdx===hist.length-1){hist.push(JSON.parse(JSON.stringify({cardData,globalConfig})));histIdx=hist.length-1;}
  if(histIdx>0){histIdx--;const s=hist[histIdx];cardData=JSON.parse(JSON.stringify(s.cardData));globalConfig=JSON.parse(JSON.stringify(s.globalConfig));if(activeCardIdx>=cardData.length)activeCardIdx=Math.max(0,cardData.length-1);deselectEl();renderAll();}
  updUndoBtns();
}

function redo() {
  clearTimeout(histTimer);
  if(histIdx<hist.length-1){histIdx++;const s=hist[histIdx];cardData=JSON.parse(JSON.stringify(s.cardData));globalConfig=JSON.parse(JSON.stringify(s.globalConfig));deselectEl();renderAll();}
  updUndoBtns();
}

function updUndoBtns() {
  document.getElementById('btn-undo').disabled=histIdx<=0;
  document.getElementById('btn-redo').disabled=histIdx>=hist.length-1;
}
