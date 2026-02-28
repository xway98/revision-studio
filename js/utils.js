// --- HELPERS ---

function hexToRgba(h,a){let r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgba(${r},${g},${b},${a/100})`;}
function convDrive(url){if(!url)return'';if(url.startsWith('data:'))return url;if(url.includes('drive.google.com')){const m=url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)||url.match(/\/d\/([a-zA-Z0-9_-]+)/)||url.match(/id=([a-zA-Z0-9_-]+)/);if(m&&m[1])return`https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;}return url;}
function getFonts(){const f=[...DEFAULT_FONTS];if(globalConfig.customFont?.name&&!f.includes(globalConfig.customFont.name))f.push(globalConfig.customFont.name);return f;}
function getCard(){return cardData[activeCardIdx];}

function applyFontLink(url){
  if(!url)return;
  let el=document.getElementById('cf-link');
  if(!el){el=document.createElement('link');el.id='cf-link';el.rel='stylesheet';document.head.appendChild(el);}
  el.href=url;
}

// --- FONT UTILITIES ---

// Google Fonts name → URL param mapping
const GFONT_MAP = {
  'Roboto':        'Roboto:wght@400;700',
  'Montserrat':    'Montserrat:wght@400;700;900',
  'Poppins':       'Poppins:wght@400;700;900',
  'Oswald':        'Oswald:wght@400;700',
  'Lora':          'Lora:ital,wght@0,400;0,700;1,400;1,700',
  'Comic Neue':    'Comic+Neue:wght@400;700',
  'Courier Prime': 'Courier+Prime:wght@400;700'
};

// Fonts that are system fonts — no Google Fonts loading needed
const SYSTEM_FONTS = new Set(['Arial','Helvetica','Times New Roman','Times','Georgia','Verdana',
  'Trebuchet MS','Impact','Courier New','Courier','monospace','sans-serif','serif']);

/**
 * Scan all cardData and extract every font name that is actually used,
 * including any font-family references buried inside rich text innerHTML.
 */
function collectAllUsedFonts() {
  const fonts = new Set();
  const addFont = f => { if(f) fonts.add(f.trim().replace(/['"]/g,'')); };

  cardData.forEach(card => {
    addFont(card.header?.font);
    card.texts?.forEach(t => {
      addFont(t.font);
      // Also scan rich text HTML for any inline font-family / <font face> tags
      if (t.text) {
        const tmp = document.createElement('div');
        tmp.innerHTML = t.text;
        tmp.querySelectorAll('[face]').forEach(el => addFont(el.getAttribute('face')));
        tmp.querySelectorAll('[style]').forEach(el => {
          const fm = el.style.fontFamily;
          if (fm) fm.split(',').forEach(f => addFont(f));
        });
      }
    });
  });

  if (globalConfig.customFont?.name) addFont(globalConfig.customFont.name);
  return fonts;
}

/**
 * Build a single Google Fonts <link> tag covering all fonts used in the project.
 * Falls back to the full default set so nothing is ever missing.
 */
function buildFontLink() {
  const used = collectAllUsedFonts();

  // Always include the full default set as a safety net
  const defaultFamilies = Object.values(GFONT_MAP);
  const familyParams = new Set(defaultFamilies);

  // Add any custom Google Font
  if (globalConfig.customFont?.url) {
    // Return two link tags: one for defaults, one for custom
    const base = `https://fonts.googleapis.com/css2?${[...familyParams].map(f=>'family='+f).join('&')}&display=swap`;
    return `<link href="${base}" rel="stylesheet">\n    <link href="${globalConfig.customFont.url}" rel="stylesheet">`;
  }

  const base = `https://fonts.googleapis.com/css2?${[...familyParams].map(f=>'family='+f).join('&')}&display=swap`;
  return `<link href="${base}" rel="stylesheet">`;
}

/**
 * Sanitize raw innerHTML from contentEditable before storing or exporting.
 *
 * Problems this fixes:
 * 1. Chrome auto-wraps text in <span style="font-family:Arial;font-size:17px;color:...">
 *    when you apply bold/colour — those inline font-family values override the parent.
 * 2. document.execCommand generates <font face="..."> tags instead of CSS.
 * 3. Inline font-size and color styles that duplicate the base text box settings.
 *
 * Strategy: strip font-family from inline styles when it matches the base font
 * (browser auto-inserted), and convert <font face> to proper CSS spans.
 * Intentional font-family changes (different from base) are preserved.
 */
function sanitizeRichHTML(html, baseFont) {
  if (!html) return html;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  // 1. Convert all <font face="X"> to <span style="font-family:'X'">
  tmp.querySelectorAll('font[face]').forEach(el => {
    const span = document.createElement('span');
    const face = el.getAttribute('face');
    // Copy existing inline style if any
    let styleStr = el.getAttribute('style') || '';
    // Prepend font-family
    styleStr = `font-family:'${face}';${styleStr}`;
    span.setAttribute('style', styleStr);
    while (el.firstChild) span.appendChild(el.firstChild);
    // Copy other <font> attributes like size/color
    if (el.getAttribute('color')) span.style.color = el.getAttribute('color');
    el.replaceWith(span);
  });

  // 2. Remove auto-inserted font-family that matches the base font (or is a generic fallback)
  //    and remove auto-inserted font-size that duplicates the parent.
  const normalise = f => (f||'').toLowerCase().replace(/['"]/g,'').trim().split(',')[0].trim();
  const baseNorm = normalise(baseFont);

  tmp.querySelectorAll('[style]').forEach(el => {
    const fm = el.style.fontFamily;
    if (fm) {
      const fmNorm = normalise(fm);
      // Remove if it's the same as base (browser-injected noise) OR if it's a generic keyword
      const genericFallbacks = ['inherit','initial','unset','-webkit-standard','times new roman','times'];
      if (fmNorm === baseNorm || genericFallbacks.includes(fmNorm)) {
        el.style.removeProperty('font-family');
      }
      // If it differs from base, keep it — user intentionally changed font inline
    }
    // Remove auto-injected font-size if it's the only thing left and it duplicates parent
    // (we can't know the exact px here so we leave font-size alone — only clean font-family)

    // Clean up empty style attributes
    if (!el.getAttribute('style') || el.getAttribute('style').trim() === '') {
      el.removeAttribute('style');
    }
  });

  // 3. Remove empty <span> wrappers that do nothing (browser litter)
  tmp.querySelectorAll('span:not([style]):not([class])').forEach(el => {
    while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
    el.remove();
  });

  return tmp.innerHTML;
}

function exitEditMode(){
  if(!editingEl)return;
  const inner=editingEl.querySelector('.c-el-inner');
  if(!inner)return;
  inner.contentEditable='false';
  // Save text back to data
  const type=editingEl.dataset.type, idx=parseInt(editingEl.dataset.idx)||0;
  const card=cardData[activeCardIdx];
  if(type==='text'&&card.texts[idx]!==undefined){
    // Sanitize: strip browser-injected font-family noise before storing
    card.texts[idx].text = sanitizeRichHTML(inner.innerHTML, card.texts[idx].font);
    // Update the DOM to reflect cleaned HTML
    inner.innerHTML = card.texts[idx].text;
    pushHist();
  }
  else if(type==='header'){card.header.text=inner.textContent;pushHist();}
  editingEl.classList.remove('editing');
  editingEl.style.cursor='move';
  editingEl=null;
  // Restore sel overlay
  document.getElementById('sel-overlay').querySelectorAll('.sel-handle').forEach(h=>h.style.visibility='');
  // No full re-render needed since DOM already has the content
  renderCardsList();
}
