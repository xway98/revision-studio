// --- CARD NAV & OPERATIONS ---

function nextCard(){if(activeCardIdx<cardData.length-1){deselectEl();activeCardIdx++;renderAll();}}
function prevCard(){if(activeCardIdx>0){deselectEl();activeCardIdx--;renderAll();}}

function addCard(){
  cardData.push({type:'revision',
    header:{text:'New Topic',font:'Arial',size:22,color:'#fff',bgColor:'#3498db',bgAlpha:100,x:50,y:7,width:90,borderW:0,borderC:'#000',borderR:8,shadowBlur:0,shadowAlpha:50,shadowColor:'#000'},
    texts:[{text:'Content here...',font:'Arial',size:17,x:50,y:44,align:'center',color:'#2c3e50',weight:'normal',lineSpace:1.5,width:85}],
    imgs:[{url:'',width:40,x:50,y:74,crop:{t:0,r:0,b:0,l:0}}]
  });
  activeCardIdx=cardData.length-1;deselectEl();pushHist();renderAll();
}

function deleteCard(ci,e){
  e&&e.stopPropagation();
  if(cardData.length===1)return alert('Must have at least one card.');
  cardData.splice(ci,1);
  if(activeCardIdx>=cardData.length)activeCardIdx=Math.max(0,cardData.length-1);
  deselectEl();pushHist();renderAll();
}

function duplicateCard(ci,e){
  e&&e.stopPropagation();
  const clone=JSON.parse(JSON.stringify(cardData[ci]));
  clone.header.text+=' (Copy)';
  cardData.splice(ci+1,0,clone);
  activeCardIdx=ci+1;deselectEl();pushHist();renderAll();
}

function addTextToActive(){
  getCard().texts.push({text:'New text box',font:'Arial',size:17,x:50,y:50,align:'center',color:'#2c3e50',weight:'normal',lineSpace:1.5,width:80});
  pushHist();renderCanvas();
  const idx=getCard().texts.length-1;
  selectEl('text',activeCardIdx,idx);
}

function addImgToActive(){
  getCard().imgs.push({url:'',width:50,x:50,y:60,crop:{t:0,r:0,b:0,l:0}});
  pushHist();renderCanvas();
  const idx=getCard().imgs.length-1;
  selectEl('img',activeCardIdx,idx);
}

function deleteSelected(){
  if(!sel.type)return;
  const card=getCard();
  if(sel.type==='text'&&card.texts.length>0)card.texts.splice(sel.idx,1);
  else if(sel.type==='img')card.imgs.splice(sel.idx,1);
  else if(sel.type==='header')card.header.text=''; // just clear
  deselectEl();pushHist();renderCanvas();
}
