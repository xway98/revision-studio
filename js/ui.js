// --- INLINE TEXT EDITING ---

function enterEditMode(el) {
  if(editingEl===el)return;
  exitEditMode();
  editingEl=el;
  el.classList.add('editing');
  const inner=el.querySelector('.c-el-inner');
  inner.contentEditable='true';
  inner.focus();
  // hide sel overlay handles while editing
  const ov=document.getElementById('sel-overlay');
  ov.querySelectorAll('.sel-handle').forEach(h=>h.style.visibility='hidden');
  el.style.cursor='text';
}

// --- GLOBAL CONFIG UPDATES ---

function updateGlobal(sec,field,val){
  if(!globalConfig[sec])globalConfig[sec]={};
  globalConfig[sec][field]=val;
  pushHist();renderCanvas();
}

function toggleGlobal(){
  const t=document.getElementById('glob-toggle'),b=document.getElementById('global-body');
  t.classList.toggle('open');b.classList.toggle('open');
}

// --- PROPERTIES PANEL ---

function renderPropsPanel(){
  const empty=document.getElementById('prop-empty-state');
  const content=document.getElementById('prop-content');
  if(!sel.type){empty.style.display='flex';content.style.display='none';return;}
  empty.style.display='none';content.style.display='block';
  const fonts=getFonts();

  if(sel.type==='header'){
    const h=getCard().header;
    content.innerHTML=`
    <h3>📌 Header Properties</h3>
    <div class="prop-row"><div class="prop-lbl"><span>Font Family</span></div>
      <select onchange="getCard().header.font=this.value;pushHist();renderCanvas();">${fonts.map(f=>`<option value="${f}" ${f===h.font?'selected':''}>${f}</option>`).join('')}</select></div>
    <div class="prop-row"><div class="prop-lbl"><span>Font Size</span><span>${h.size}px</span></div>
      <input type="range" min="10" max="60" value="${h.size}" oninput="getCard().header.size=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'px';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-row"><label>Text Color</label>
      <input type="color" value="${h.color}" oninput="getCard().header.color=this.value;renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><label>Background Color</label>
      <input type="color" value="${h.bgColor}" oninput="getCard().header.bgColor=this.value;renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>BG Opacity</span><span>${h.bgAlpha}%</span></div>
      <input type="range" min="0" max="100" value="${h.bgAlpha}" oninput="getCard().header.bgAlpha=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Width</span><span>${h.width}%</span></div>
      <input type="range" min="20" max="100" value="${h.width}" oninput="getCard().header.width=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-sep"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Corner Radius</span><span>${h.borderR||8}px</span></div>
      <input type="range" min="0" max="50" value="${h.borderR||8}" oninput="getCard().header.borderR=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'px';renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><label>Border Color</label>
      <input type="color" value="${h.borderC||'#000000'}" oninput="getCard().header.borderC=this.value;renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Border Width</span><span>${h.borderW||0}px</span></div>
      <input type="range" min="0" max="10" value="${h.borderW||0}" oninput="getCard().header.borderW=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'px';renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Shadow Blur</span><span>${h.shadowBlur||0}px</span></div>
      <input type="range" min="0" max="30" value="${h.shadowBlur||0}" oninput="getCard().header.shadowBlur=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'px';renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-sep"></div>
    <div class="prop-row"><div class="fmt-btns">
      <button class="fmt-btn danger" onclick="deselectEl();renderCanvas();">Deselect</button>
    </div></div>`;
  }

  else if(sel.type==='text'){
    const t=getCard().texts[sel.idx];
    if(!t){deselectEl();return;}
    content.innerHTML=`
    <h3>📝 Text Box Properties</h3>
    <div class="prop-row"><label>Rich Formatting</label>
      <div class="fmt-btns" id="rich-toolbar">
        <button class="fmt-btn" onclick="richCmd('bold')" title="Bold"><b>B</b></button>
        <button class="fmt-btn" onclick="richCmd('italic')" title="Italic"><i>I</i></button>
        <button class="fmt-btn" onclick="richCmd('underline')" title="Underline"><u>U</u></button>
        <button class="fmt-btn" onclick="richCmd('strikeThrough')" title="Strike"><s>S</s></button>
        <button class="fmt-btn" onclick="richCmd('superscript')">x²</button>
        <button class="fmt-btn" onclick="richCmd('subscript')">x₂</button>
        <input type="color" value="#000000" class="fmt-btn" style="width:30px;padding:1px;" title="Text colour" onchange="richCmd('foreColor',this.value)">
        <input type="color" value="#ffff00" class="fmt-btn" style="width:30px;padding:1px;" title="Highlight" onchange="richCmd('hiliteColor',this.value)">
        <button class="fmt-btn danger" onclick="richCmd('removeFormat')" title="Clear">✕fmt</button>
      </div>
    </div>
    <div class="prop-row"><div class="prop-lbl"><span>Font Family</span></div>
      <select onchange="getCard().texts[${sel.idx}].font=this.value;pushHist();renderCanvas();">${fonts.map(f=>`<option value="${f}" ${f===t.font?'selected':''}>${f}</option>`).join('')}</select></div>
    <div class="prop-row"><div class="prop-lbl"><span>Font Size</span><span>${t.size}px</span></div>
      <input type="range" min="8" max="80" value="${t.size}" oninput="getCard().texts[${sel.idx}].size=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'px';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-row"><label>Base Text Color</label>
      <input type="color" value="${t.color}" oninput="getCard().texts[${sel.idx}].color=this.value;renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><label>Text Align</label>
      <div class="align-btns">
        ${['left','center','right','justify'].map(a=>`<div class="align-btn${t.align===a?' active':''}" onclick="getCard().texts[${sel.idx}].align='${a}';pushHist();renderCanvas();renderPropsPanel();">${a==='left'?'⬅':a==='center'?'⬛':a==='right'?'➡':'☰'}</div>`).join('')}
      </div></div>
    <div class="prop-row"><label>Weight</label>
      <div class="fmt-btns">
        <button class="fmt-btn${t.weight==='normal'?' active':''}" onclick="getCard().texts[${sel.idx}].weight='normal';pushHist();renderCanvas();renderPropsPanel();">Normal</button>
        <button class="fmt-btn${t.weight==='bold'?' active':''}" onclick="getCard().texts[${sel.idx}].weight='bold';pushHist();renderCanvas();renderPropsPanel();"><b>Bold</b></button>
      </div></div>
    <div class="prop-row"><div class="prop-lbl"><span>Line Spacing</span><span>${t.lineSpace}</span></div>
      <input type="range" min="1" max="3" step="0.1" value="${t.lineSpace}" oninput="getCard().texts[${sel.idx}].lineSpace=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=(+this.value).toFixed(1);renderCanvas();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Box Width</span><span>${t.width}%</span></div>
      <input type="range" min="10" max="100" value="${t.width}" oninput="getCard().texts[${sel.idx}].width=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-sep"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Position X</span><span>${t.x}%</span></div>
      <input type="range" min="0" max="100" value="${t.x}" oninput="getCard().texts[${sel.idx}].x=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Position Y</span><span>${t.y}%</span></div>
      <input type="range" min="0" max="100" value="${t.y}" oninput="getCard().texts[${sel.idx}].y=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-sep"></div>
    <div class="fmt-btns">
      <button class="fmt-btn danger" onclick="deleteSelected()">🗑 Delete Box</button>
      <button class="fmt-btn" style="margin-left:auto;" onclick="deselectEl()">Deselect</button>
    </div>`;
  }

  else if(sel.type==='img'){
    const img=getCard().imgs[sel.idx];
    if(!img){deselectEl();return;}
    content.innerHTML=`
    <h3>🖼 Image Properties</h3>
    <div class="prop-row"><label>Image URL</label>
      <input type="text" value="${img.url.startsWith('data:')?'[Embedded image]':img.url}" placeholder="Paste URL or drop image on canvas..." oninput="if(!this.value.startsWith('['))getCard().imgs[${sel.idx}].url=this.value;pushHist();renderCanvas();" style="font-size:11px;"></div>
    <div style="font-size:10px;color:#556677;margin-top:-6px;margin-bottom:8px;">💡 Drop an image file directly onto the canvas to upload automatically</div>
    <div class="prop-row"><div class="prop-lbl"><span>Width</span><span>${img.width}%</span></div>
      <input type="range" min="5" max="100" value="${img.width}" oninput="getCard().imgs[${sel.idx}].width=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Position X</span><span>${img.x}%</span></div>
      <input type="range" min="0" max="100" value="${img.x}" oninput="getCard().imgs[${sel.idx}].x=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-row"><div class="prop-lbl"><span>Position Y</span><span>${img.y}%</span></div>
      <input type="range" min="0" max="100" value="${img.y}" oninput="getCard().imgs[${sel.idx}].y=+this.value;this.previousElementSibling.querySelector('span:last-child').textContent=this.value+'%';renderCanvas();updateSelOverlay();" onchange="pushHist()"></div>
    <div class="prop-sep"></div>
    <div class="prop-row"><label>Crop Tool</label>
      <div class="fmt-btns">
        <button class="fmt-btn" style="background:#f39c12;border-color:#f39c12;" onclick="startCrop()">✂ Open Crop Tool</button>
      </div>
      <div style="font-size:10px;color:#556677;margin-top:4px;">Drag the yellow handles on the canvas to crop, then click Apply.</div>
    </div>
    <div class="prop-row"><div class="prop-lbl"><span>Crop (T/R/B/L)</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:#95a5a6;">
        <div>Top: ${(img.crop?.t||0).toFixed(0)}%</div><div>Right: ${(img.crop?.r||0).toFixed(0)}%</div>
        <div>Bottom: ${(img.crop?.b||0).toFixed(0)}%</div><div>Left: ${(img.crop?.l||0).toFixed(0)}%</div>
      </div>
      ${(img.crop?.t||img.crop?.r||img.crop?.b||img.crop?.l)?`<button class="fmt-btn danger" style="margin-top:4px;width:100%;" onclick="getCard().imgs[${sel.idx}].crop={t:0,r:0,b:0,l:0};pushHist();renderCanvas();renderPropsPanel();">✕ Reset Crop</button>`:''}
    </div>
    <div class="prop-sep"></div>
    <div class="fmt-btns">
      <button class="fmt-btn danger" onclick="deleteSelected()">🗑 Delete Image</button>
      <button class="fmt-btn" onclick="deselectEl()">Deselect</button>
    </div>`;
  }
}

// Rich text commands — apply to the currently editing element
function richCmd(cmd,val){
  let inner=null;
  if(editingEl){inner=editingEl.querySelector('.c-el-inner');}
  else if(sel.type==="text"){
    const el=getElDOM("text",sel.idx);
    if(el){enterEditMode(el);inner=el.querySelector(".c-el-inner");}
  }
  if(!inner)return;
  inner.focus();
  document.execCommand(cmd,false,val||null);
  // Sync back with sanitization to strip browser-injected font-family noise
  if(sel.type==="text"){
    const baseFont = getCard().texts[sel.idx]?.font;
    const cleaned = sanitizeRichHTML(inner.innerHTML, baseFont);
    if(cleaned !== inner.innerHTML) inner.innerHTML = cleaned;
    getCard().texts[sel.idx].text = cleaned;
    pushHist();
  }
}

// --- CARDS LIST ---

function renderCardsList(){
  const list=document.getElementById('cards-list');
  list.innerHTML=cardData.map((c,i)=>`
    <div class="card-pill${i===activeCardIdx?' active':''}" onclick="deselectEl();activeCardIdx=${i};renderAll();">
      <span class="card-pill-num">${i+1}</span>
      <span class="card-pill-title">${c.header.text||'(untitled)'}</span>
      <span class="card-pill-btns">
        <button class="cpb cpb-dup" onclick="duplicateCard(${i},event)">⧉</button>
        <button class="cpb cpb-del" onclick="deleteCard(${i},event)">✕</button>
      </span>
    </div>`).join('');
  document.getElementById('card-counter').textContent=`Card ${activeCardIdx+1} / ${cardData.length}`;
}

// --- SYNC GLOBAL SETTINGS UI ---

function syncGlobalUI(){
  const s=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v;};
  s('g-bg',globalConfig.bg.color);
  s('g-bgimg',globalConfig.bg.imgUrl||'');
  s('g-trans',globalConfig.transition?.type||'fade');
  s('g-prog',String(globalConfig.progress?.show!==false));
  s('g-font-url',globalConfig.customFont?.url||'');
  s('g-font-name',globalConfig.customFont?.name||'');
  s('g-logo-url',globalConfig.logo?.url||'');
  s('g-logo-w',globalConfig.logo?.width||25);
  document.getElementById('g-logo-w-v').textContent=(globalConfig.logo?.width||25)+'%';
  s('drive-client-id',globalConfig.drive?.clientId||'');
  s('drive-folder-id',globalConfig.drive?.folderId||'');
}
