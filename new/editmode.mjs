import { loadDoc, saveAs } from '../lib/debugging/fileops.mjs';
import { init as cmWrapper } from '../lib/debugging/cmwrapper.mjs';
import previewDoc from '../lib/debugging/preview.mjs';
import { checkCitations } from '../citations.mjs';
import { getNikantuCitations, makeNikantuGraphs } from './nikantus.mjs';

const _state = {
  Transliterator: null,
  curDoc: null,
  NS: null,
  filename: null,
  cms: []
};

const plusSVG = '<svg height="32px" width="32px" xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="width: 20px; height: 20px;"><g transform="translate(0,-952.36218)"><path d="m 50,978.36217 c -2.7615,0 -5,2.2386 -5,5 l 0,14 -14,0 c -2.7614,0 -5,2.2385 -5,5.00003 0,2.7615 2.2386,5 5,5 l 14,0 0,14 c 0,2.7614 2.2385,5 5,5 2.7615,0 5,-2.2386 5,-5 l 0,-14 14,0 c 2.7614,0 5,-2.2385 5,-5 0,-2.76153 -2.2386,-5.00003 -5,-5.00003 l -14,0 0,-14 c 0,-2.7614 -2.2385,-5 -5,-5 z" style="text-indent:0;text-transform:none;direction:ltr;block-progression:tb;baseline-shift:baseline;enable-background:accumulate;" fill-opacity="1" stroke="none" marker="none" display="inline" overflow="visible"></path></g></svg>';

const startEditMode = async (Transliterator,xml) => {
  _state.Transliterator = Transliterator;
  injectCSS();
  revealButtons();
  addEditButtons();
  _state.curDoc = xml ? xml.doc : await loadDoc(window.location.pathname);
  _state.NS = _state.curDoc.documentElement.namespaceURI;
  _state.filename = xml ? xml.filename : decodeURIComponent(window.location.pathname.split('/').pop());
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

#topbar.hidebuttons button, .hidden {
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
.refreshbutton {
  font-size: 1.4rem;
  padding: 0.3rem 0.3rem 0.2rem 0.5rem;
  margin-top: -3rem;
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

li:has(.plusbutton) {
  list-style-type: none;
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
    if(par.querySelector('.plusbutton')) return null;
    const button = document.createElement('button');
    button.addEventListener('click',openEditForm);
    button.className = 'minibutton';
    const type = par.classList.contains('sense') ? 'definition' :
                 par.classList.contains('commentary') ? 'commentary' :
                 par.id === 'entry_gramGrp' ? 'grammar' :
                  '';
    button.dataset.anno = `Edit ${type}`;
    button.append('\u{1F589}');
    par.before(button);
    return button;
};

const addRefreshButton = par => {
    const button = document.createElement('button');
    button.addEventListener('click',refreshCitations);
    button.className = 'minibutton refreshbutton';
    const type = par.id === 'list_nikantus' ? 'Nikaṇṭu' :
                  '';
    button.dataset.anno = `Refresh ${type} citations`;
    button.append('\u{27F3}');
    par.prepend(button);
    return button;
};

const addPlusButton = (par,fn,tagname='li') => {
  const comms = par.querySelectorAll(tagname);
  const lastli = comms[comms.length-1];
  const commli = lastli && lastli.textContent.trim() === '' ? lastli : document.createElement(tagname);
  const commadd = document.createElement('button');
  commadd.className = 'plusbutton';
  commadd.style.width = '100%';
  commadd.dataset.anno = 'Add new sense';
  commadd.innerHTML = plusSVG;
  commli.appendChild(commadd);
  if(lastli !== commli) par.appendChild(commli);
  commadd.addEventListener('click',fn);
};

const addEditButtons = () => {
  const listsense = document.getElementById('list_sense');
  const addli = document.createElement('li');
  const addbutton = document.createElement('button');
  addbutton.className = 'plusbutton';
  addbutton.style.width = '100%';
  addbutton.dataset.anno = 'Add new sense';
  addbutton.innerHTML = plusSVG;
  addli.appendChild(addbutton);
  listsense.appendChild(addli);
  addbutton.addEventListener('click',newSense);

  let commslist = document.getElementById('list_commentary');
  if(!commslist) {
    const commsdet = document.createElement('details');
    commsdet.innerHTML = '<summary style="font-size: 1.5rem;font-style italic" lang="en">Commentarial glosses</summary><ul id="list_commentary"></ul>';
    document.getElementById('list_sense').after(commsdet);
    commslist = document.getElementById('list_commentary');
  }
  addPlusButton(commslist,newCommentary);
  let bibllist = document.getElementById('list_bibliography');
  if(!bibllist) {
    const bibldet = document.createElement('details');
    bibldet.id = 'list_bibliography';
    bibldet.innerHTML = '<summary style="font-size: 1.5rem;font-style italic" lang="en">Additional Bibliography</summary>';
    document.getElementById('list_nikantucitations').after(bibldet);
    bibllist = document.getElementById('list_commentary');
  }
  addPlusButton(bibllist,newBibliography,'p');
/*
  const comms = commslist.querySelectorAll('li');
  const lastli = comms[comms.length-1];
  const commli = lastli && lastli.textContent.trim() === '' ? lastli : document.createElement('li');
  const commadd = document.createElement('button');
  commadd.className = 'plusbutton';
  commadd.style.width = '100%';
  commadd.dataset.anno = 'Add new sense';
  commadd.innerHTML = plusSVG;
  commli.appendChild(commadd);
  if(lastli !== commli) commslist.appendChild(commli);
  commadd.addEventListener('click',newCommentary);
*/
  for(const sense of document.querySelectorAll('div.sense, div.commentary, p.bibliography, #entry_gramGrp'))
    addEditButton(sense);
   
  const nikantus = document.getElementById('list_nikantus');
  addRefreshButton(nikantus);
};

const hideButtons = () => {
  document.getElementById('topbar').classList.add('hidebuttons');
  for(const button of document.querySelectorAll('.minibutton, .plusbutton')) {
    button.classList.add('hidden');
  }
};
const showButtons = () => {
  document.getElementById('topbar').classList.remove('hidebuttons');
  for(const button of document.querySelectorAll('.minibutton, .plusbutton')) {
    button.classList.remove('hidden');
  }
};

const openEditForm = e => {
  hideButtons();
  const nextsib = e.target.nextElementSibling;
  if(nextsib.classList.contains('sense'))
    editSense(nextsib);
  else if(nextsib.id === 'entry_gramGrp')
    editGrammar(nextsib);
  else if(nextsib.classList.contains('commentary'))
    editCommentary(nextsib);
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
  const notes = xmlitem.querySelectorAll(':scope > note');
  const editbox = document.createElement('div');
  editbox.className = 'multi-item';
  editbox.innerHTML = `
<div>
  <label>Definition</label>
  <textarea name="def" data-schema="def" rows="3"></textarea>
</div>
<div>
  <label>Usage</label>
  <textarea name="usg" data-schema="usg" rows="3"></textarea>
</div>
<div>
  <label>Citations</label>
  <textarea name="cits" data-schema="cit" rows="10"></textarea>
</div>
<div>
  <label>Notes</label>
  <textarea name="notes" data-schema="note" rows="10"></textarea>
</div>
<div style="display: flex; justify-content: center">
  <button name="preview" data-type="sense" data-n="${n}">Preview</button>
  <button name="cancel" data-type="sense" data-n="${n}">Cancel</button>
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
    cm.save(); // save original to restore if editing is cancelled
    _state.cms.push(cm);
  }
  editbox.querySelector('button[name="preview"]').addEventListener('click',preview);
  editbox.querySelector('button[name="cancel"]').addEventListener('click',cancel);
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

const newBibliography = e => {};

const newCommentary = e => {
  const comms = [..._state.curDoc.querySelectorAll('text > body > entry > cit[type="commentary"]')];
  const lastcomm = comms[comms.length-1];
  const newcomm = _state.curDoc.createElementNS(_state.NS,'cit');
  newcomm.setAttribute('type','commentary');
  /*
  newcomm.innerHTML = `<ref target="link here"><!--title, poem number, line number--></ref>
<q xml:lang="ta"><!--Tamil quote--></q>
<q xml:lang="en"><!--English translation--></q>`;
  */
  if(lastcomm)
    lastcomm.after(newcomm);
  else
    _state.curDoc.querySelector('text > body > entry').appendChild(newcomm);
  
  const lastli = e.target.closest('li');
  const newli = document.createElement('li');
  const newcommel = document.createElement('div');
  newcommel.className = 'commentary';
  newli.appendChild(newcommel);
  lastli.before(newli);
  const editbutton = addEditButton(newcommel);
  editbutton.click();
};

const editGrammar = el => {
  const editbox = document.createElement('div');
  editbox.className = 'multi-item';
  editbox.innerHTML = `
<div>
  <label>Grammar</label>
  <textarea name="entry_gramGrp" data-schema="gramGrp" rows="3"></textarea>
</div>
<div style="display: flex; justify-content: center">
  <button name="preview" data-type="entry_gramGrp">Preview</button>
  <button name="cancel" data-type="entry_gramGrp">Cancel</button>
</div>
`;

  while(el.firstChild)
    el.removeChild(el.firstChild);
  el.appendChild(editbox);

  const gramGrp = _state.curDoc.querySelector('text > body > entry > gramGrp');
  const ta = editbox.querySelector('textarea');
  const cm = cmWrapper(ta);
  if(gramGrp && gramGrp.innerHTML.trim() !== '') {
    const val = [...gramGrp.childNodes].map(c => {
      if(c.nodeType === '3')
        return c.data;
      else
        return serialize(c);
    }).join('');
    cm.setValue(val);
  }
  else
    cm.setValue('<gram></gram>');
  cm.save()
  _state.cms.push(cm);
  editbox.querySelector('button[name="preview"]').addEventListener('click',preview);
  editbox.querySelector('button[name="cancel"]').addEventListener('click',cancel);
};

const editCommentary = el => {
  const li = el.closest('li');
  const ul = li.closest('ul');
  const comms = [..._state.curDoc.querySelectorAll('text > body > entry > cit[type="commentary"]')];
  let xmlitem, n;
  for(n=0;n<ul.children.length;n++) {
    if(ul.children.item(n) === li) {
      xmlitem = comms[n];
      break;
    }
  }
  const editbox = document.createElement('div');
  editbox.className = 'multi-item';
  editbox.innerHTML = `
<div>
  <label>Citation</label>
  <textarea name="citation" data-schema="citinner" rows="6"></textarea>
</div>
<div style="display: flex; justify-content: center">
  <button name="preview" data-type="commentary" data-n="${n}">Preview</button>
  <button name="cancel" data-type="commentary" data-n="${n}">Cancel</button>
</div>
`;

  while(el.firstChild)
    el.removeChild(el.firstChild);
  el.appendChild(editbox);
  const ta = editbox.querySelector('textarea');
  const cm = cmWrapper(ta);
  if(xmlitem && xmlitem.innerHTML.trim() !== '') {
    const val = [...xmlitem.childNodes].map(c => {
      if(c.nodeType === '3')
        return c.data;
      else
        return serialize(c);
    }).join('');
    cm.setValue(val);
    cm.save();
  }
  else cm.setValue(`<ref target="link here">title, poem number, line number</ref>
<q xml:lang="ta">Tamil quote</q>
<q xml:lang="en">English translation</q>`);

  _state.cms.push(cm);
  editbox.querySelector('button[name="preview"]').addEventListener('click',preview);
  editbox.querySelector('button[name="cancel"]').addEventListener('click',cancel);
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

const cancel = e => {
  preview(e,true);
};

const preview = (e,cancel=false) => {
  if(!cancel) {
    const par = e.target.closest('.multi-item');
    if(par.querySelector('.cm-error, .CodeMirror-lint-mark-error, .CodeMirror-lint-marker-error')) {
      alert('Please fix XML errors first.');
      return;
    }
  }

  if(e.target.dataset.type === 'sense')
    previewField(e.target,'body > entry > sense','div.sense',cancel);
  
  else if(e.target.dataset.type === 'entry_gramGrp')
    previewField(e.target,'body > entry > gramGrp','#entry_gramGrp',cancel);

  else if(e.target.dataset.type === 'commentary')
    previewField(e.target,'body > entry > cit[type="commentary"]','div.commentary',cancel);
  
  showButtons();
};

const previewField = async (button,xmlsel,htmlsel,cancel) => {
  const n = button.dataset.n;
  const el = n ? _state.curDoc.querySelectorAll(xmlsel)[n] :
                 _state.curDoc.querySelector(xmlsel);

  for(const cm of _state.cms) {
    if(cancel) cm.setValue(cm.getTextArea().value);
    cm.toTextArea();
  }
  _state.cms = [];

  const newstr = [...button.closest('.multi-item').querySelectorAll('textarea')].map(t => t.value).join('\n');
  const tempel = _state.curDoc.createElementNS(_state.NS,'text');
  tempel.innerHTML = newstr;
  if(tempel.textContent.trim() === '') {
    el.remove();
    const oldel = n ? document.querySelectorAll(htmlsel)[n] :
                      document.querySelector(htmlsel);
    if(oldel.parentNode.tagName === 'LI')
      oldel.parentNode.remove();
    else
      oldel.remove();
  }
  else {
    while(el.firstChild) el.removeChild(el.firstChild);
    el.innerHTML = newstr;
    const res = await previewDoc(_state.curDoc);
    const newel = n ? res.querySelectorAll(htmlsel)[n] :
                          res.querySelector(htmlsel);
    const oldel = n ? document.querySelectorAll(htmlsel)[n] :
                          document.querySelector(htmlsel);
    oldel.replaceWith(document.adoptNode(newel));
    if(!cancel) newel.classList.add('edited');
    //newel.parentNode.querySelector('button.minibutton').style.display = 'block';
    _state.Transliterator.refreshCache(newel);
    checkCitations(newel, _state.curDoc);
  }
};

const refreshCitations = async button => {
  const forms = [...document.querySelectorAll('details[data-entry]')].map(h => h.dataset.entry);
  const res = await getNikantuCitations(forms,'./lib/js/');
  const curcit = _state.curDoc.querySelector('cit[type="nikantu-meanings');
  if(curcit) curcit.innerHTML = res.join('\n');
  else {
      const newcit = _state.curDoc.createElementNS(_state.NS,'cit');
      newcit.setAttribute('type','nikantu-meanings');
      newcit.setAttribute('xml:lang','ta');
      newcit.innerHTML = res.join('\n');
      _state.curDoc.querySelector('body entry').appendChild(newcit);
    }
    const newdoc = await previewDoc(_state.curDoc);
    const summary = document.getElementById('list_nikantus').querySelector('summary');
    while(summary.nextSibling)
      summary.nextSibling.remove();
    const newsummary = newdoc.getElementById('list_nikantus').querySelector('summary');
    while(newsummary.nextSibling)
      summary.after(document.adoptNode(newsummary.nextSibling));
    makeNikantuGraphs();
};
export default startEditMode;
