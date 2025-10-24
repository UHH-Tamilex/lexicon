import { loadDoc, saveAs } from '../lib/debugging/fileops.mjs';
import { init as cmWrapper } from '../lib/debugging/cmwrapper.mjs';
import previewDoc from '../lib/debugging/preview.mjs';
import { checkCitations } from '../citations.mjs';

const _state = {
  Transliterator: null,
  curDoc: null,
  NS: null,
  filename: null,
  cms: []
};

const startEditMode = async (Transliterator,xml) => {
  _state.Transliterator = Transliterator;
  injectCSS();
  revealButtons();
  addEditButtons();
  _state.curDoc = xml ? xml.doc : await loadDoc(window.location.pathname);
  _state.NS = _state.curDoc.documentElement.namespaceURI;
  _state.filename = xml ? xml.filename : window.location.pathname.split('/').pop();
  document.getElementById('button_savebutton')?.addEventListener('click',saveAs.bind(null,_state.filename, _state.curDoc));
};

const injectCSS = () => {
  const style = document.createElement('style');
  style.append(`
#topbar {
  background: linear-gradient(rgb(255,255,248) 60%, rgba(255,255,255,0));
  height: auto;
  top: 0;
  padding-top: 1em;
  padding-bottom: 2em;
  z-index: 7;
  backdrop-filter: blur(1px);
  flex-direction: row;
}

#topbar.hidebuttons {
  padding-bottom: 0;
  padding-top: 0;
}

#topbar > button {
  display: block;
}

#topbar.hidebuttons button {
  display: none;
}

#buttoncontainer {
  top: auto;
}
.minibutton {
    position: absolute;
    left: -0.5rem;
    padding: 0.3rem 0.3rem 0 0.4rem;
}
.buttonrow {
    /*margin: 0 1em 1em 0;*/
    align-self: flex-end;
    padding-right: 0.2em;
    visibility: hidden;
}
.multi-item:hover .buttonrow {
    visibility: visible;
}
@media (hover: none) {
    .buttonrow {
        visibility: visible;
    }
}

.buttonrow button {
    background: rgba(0,0,0,0);
    border: none;
}
.buttonrow button[disabled] svg {
    fill: rgba(1,1,1,0.1);
}

.buttonrow button svg {
    fill: rgba(1,1,1,0.4);
}

.buttonrow button[disabled]:hover svg {
    fill: rgba(1,1,1,0.1);
}

.buttonrow button:hover svg {
    /*fill: black;*/
    fill: #ff9900;
}
.buttonrow button:not([disabled]):hover {
    filter: drop-shadow(2px 2px 1px rgba(0,0,0,0.2));
}
.multiple {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-right: 1rem;
}
.multi-item {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    flex-grow: 1;
    width: 100%;
    max-width: 100% !important;
    background: rgba(0,0,0,0.1);
    margin-bottom: 0.5rem;
    border-radius: 0.3rem;
    padding: 0.5rem;
    gap: 1rem;
}

.multi-item > div {
  display: grid;
  grid-template-columns: 5rem 1fr;
  width: 100%;
  gap: 2rem;
}

.multiple div.plusbutton {
    width: 100%;
    text-align: center;
    display: block;
    background: #ddd;
    border: 0.1rem solid #ddd;
    padding: 0 0.5rem 0 0.5rem;
    margin-right: 1em;
    margin-right: 1em;
    border-radius: 0.3rem;
    font-weight: bold;
    font-family: et-book;
    flex-grow: 1;
}
.multi-item div.plusbutton {
    width: unset;
}
.multiple div.plusbutton svg {
    fill: rgba(1,1,1,0.4);
}
.multiple div.plusbutton:hover svg {
    fill: #ddd;
    filter: drop-shadow(2px 2px 1px rgba(0,0,0,0.2));
}

.multiple div.plusbutton:hover {
    background: #ff9900;
    border: 0.1rem solid #ff9900;
    color: #ddd;
}
.CodeMirror {
    flex-grow: 1;
    display: block;
    border: 1px solid #ddd;
    resize: vertical;
    border-radius: 0.3rem;
    font-family: inherit;
    font-size: 1.4rem;
    width: 100%;
}

.CodeMirror-empty { /*outline: 1px solid #c22;*/ }
.CodeMirror-empty.CodeMirror-focused { outline: none; }
.CodeMirror pre.CodeMirror-placeholder { color: #999; }
.CodeMirror-required { outline: 1px dashed red; }

.edited {padding: 20px;}

`);
  document.head.appendChild(style);
};

const revealButtons = () => {
    const topbar = document.getElementById('topbar');
    topbar.classList.remove('hidebuttons');
};

const addEditButton = par => {
    const button = document.createElement('button');
    button.addEventListener('click',openEditForm);
    button.className = 'minibutton';
    button.dataset.anno = 'Edit definition';
    button.append('\u{1F589}');
    par.before(button);
    return button;
};

const addEditButtons = () => {
  for(const sense of document.querySelectorAll('div.sense'))
    addEditButton(sense);

  const listsense = document.getElementById('list_sense');
  const addli = document.createElement('li');
  const addbutton = document.createElement('button');
  addbutton.className = 'plusbutton';
  addbutton.style.width = '100%';
  addbutton.dataset.anno = 'Add new sense';
  addbutton.innerHTML = '<svg height="32px" width="32px" xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="width: 20px; height: 20px;"><g transform="translate(0,-952.36218)"><path d="m 50,978.36217 c -2.7615,0 -5,2.2386 -5,5 l 0,14 -14,0 c -2.7614,0 -5,2.2385 -5,5.00003 0,2.7615 2.2386,5 5,5 l 14,0 0,14 c 0,2.7614 2.2385,5 5,5 2.7615,0 5,-2.2386 5,-5 l 0,-14 14,0 c 2.7614,0 5,-2.2385 5,-5 0,-2.76153 -2.2386,-5.00003 -5,-5.00003 l -14,0 0,-14 c 0,-2.7614 -2.2385,-5 -5,-5 z" style="text-indent:0;text-transform:none;direction:ltr;block-progression:tb;baseline-shift:baseline;enable-background:accumulate;" fill-opacity="1" stroke="none" marker="none" display="inline" overflow="visible"></path></g></svg>';
  addli.appendChild(addbutton);
  listsense.appendChild(addli);
  addbutton.addEventListener('click',newSense);
};

const openEditForm = e => {
  document.getElementById('topbar').classList.add('hidebuttons');
  const nextsib = e.target.nextElementSibling;
  if(nextsib.classList.contains('sense')) {
    editSense(nextsib);
    e.target.style.display = 'none';
  }
};

const editSense = el => {
  const li = el.closest('li');
  const ol = li.closest('ol');
  const senses = [..._state.curDoc.querySelector('text > body > entry').querySelectorAll('sense')];
  let xmlitem, n;
  for(n=0;n<ol.children.length;n++) {
    if(ol.children.item(n) === li) {
      xmlitem = senses[n];
      break;
    }
  }
  const def = xmlitem.querySelector('def');
  const usg = xmlitem.querySelector('usg');
  const cits = xmlitem.querySelectorAll('cit');
  const notes = xmlitem.querySelectorAll('note');
  const editbox = document.createElement('div');
  editbox.className = 'multi-item';
  editbox.innerHTML = `
<div>
  <label>Definition</label>
  <textarea name="def" rows="3"></textarea>
</div>
<div>
  <label>Usage</label>
  <textarea name="usg" rows="3"></textarea>
</div>
<div>
  <label>Citations</label>
  <textarea name="cits" rows="10"></textarea>
</div>
<div>
  <label>Notes</label>
  <textarea name="notes" rows="10"></textarea>
</div>
<div style="display: flex; justify-content: center">
  <button name="preview" data-type="sense" data-n="${n}">Preview</button>
</div>
`;

  while(el.firstChild)
    el.removeChild(el.firstChild);
  el.appendChild(editbox);
  for(const ta of editbox.querySelectorAll('textarea')) {
    const cm = cmWrapper(ta);
    if(ta.name === 'cits')
      cm.setValue([...cits].map(c => serialize(c)).join('\n'));
    else if(ta.name === 'notes') {
      if(notes.length === 0)
          cm.setValue('<note xml:lang="en">\n</note>');
      else
        cm.setValue([...notes].map(c => serialize(c)).join('\n'));
      }
    else if(ta.name === 'def') {
      if(!def)
          cm.setValue('<def xml:lang="en">\n</def>');
      else
        cm.setValue(serialize(def));
    }
    else if(ta.name === 'usg') {
      if(!usg)
          cm.setValue('<usg xml:lang="en">\n</usg>');
      else
        cm.setValue(serialize(usg));
    }
    _state.cms.push(cm);
  }
  editbox.querySelector('button[name="preview"]').addEventListener('click',preview);
};

const newSense = () => {
  const senses = [..._state.curDoc.querySelectorAll('text > body > entry > sense')];
  const lastsense = senses[senses.length-1];
  const newsense = _state.curDoc.createElementNS(_state.NS,'sense');
  lastsense.after(newsense);
  const lastli = document.getElementById('list_sense').lastElementChild;
  const newli = document.createElement('li');
  const newsenseel = document.createElement('div');
  newsenseel.className = 'sense';
  newli.appendChild(newsenseel);
  lastli.before(newli);
  const editbutton = addEditButton(newsenseel);
  editbutton.click();
};

const NSCleaner = (() => {
  const Sheet = (new DOMParser()).parseFromString(`
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:tei="http://www.tei-c.org/ns/1.0" exclude-result-prefixes="tei">
  <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="*">
    <xsl:element name="{local-name()}">
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates/>
    </xsl:element>
  </xsl:template>
</xsl:stylesheet>
  `,'text/xml');
  const xproc = new XSLTProcessor();
  xproc.importStylesheet(Sheet);
  return xproc;
})();

const serializer = new XMLSerializer();

const serialize = el => {
  const newdoc = NSCleaner.transformToFragment(el,_state.curDoc);
  return serializer.serializeToString(newdoc);
};

const preview = e => {
  const par = e.target.closest('.multi-item');
  if(par.querySelector('.cm-error, .CodeMirror-lint-mark-error, .CodeMirror-lint-marker-error')) {
    alert('Please fix XML errors first.');
    return;
  }

  if(e.target.dataset.type === 'sense')
    previewSense(e.target);

  document.getElementById('topbar').classList.remove('hidebuttons');
};
const previewSense = async button => {
  const n = button.dataset.n;
  const el = _state.curDoc.querySelector('text > body > entry').querySelectorAll('sense')[n];
  for(const cm of _state.cms) cm.toTextArea();
  _state.cms = [];
  while(el.firstChild) el.removeChild(el.firstChild);
  const newstr = [...button.closest('.multi-item').querySelectorAll('textarea')].map(t => t.value).join('');
  el.innerHTML = newstr;
  const previewed = (await previewDoc(_state.curDoc)).querySelectorAll('div.sense')[n];
  const htmlsense = document.querySelectorAll('div.sense')[n];
  htmlsense.replaceWith(document.adoptNode(previewed));
  previewed.classList.add('edited');
  previewed.parentNode.querySelector('button.minibutton').style.display = 'block';
  _state.Transliterator.refreshCache(previewed);
  checkCitations(previewed, _state.curDoc);
};

export default startEditMode;
