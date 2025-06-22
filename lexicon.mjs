import { Transliterate } from './lib/js/transliterate.mjs';
//import createSqlWorker from './lib/js/sqlWorker.mjs';
import openDb from './lib/js/sqlite.mjs';
import { loadDoc } from './lib/debugging/fileops.mjs';
import Citer from './lib/debugging/cite.mjs';

const init = () => {
    
    checkCitations();

    const loc = window.location.hash;
    if(!loc) return;

    const word = decodeURI(loc.replace(/^#/,''));
    const details = document.querySelector(`details[data-entry='${word}']`);
    const pardetails = details.parentNode.closest('details');
    if(pardetails) {
        docClick({target: pardetails});
        pardetails.open = true;
    }
    docClick({target: details});
    details.scrollIntoView({behavior: 'smooth', block: 'center'});
    details.open = true;
};

let citationProcessor = null;

const checkCitation = async (thisxml,el) => {
    const url = URL.parse(el.dataset.source,window.location);
    const xml = await loadDoc(url.href);
    if(!xml) {
        markDifferent(el);
        return;
    }
    
    const id = url.searchParams.get('id');
    const indices = url.searchParams.get('w').split(',').map(n => parseInt(n));
    const cit = Citer.makeCitation(xml, id, indices);
    const q = thisxml.querySelector(`cit[source="${el.dataset.source}"] q[*|lang^="ta"]`);
    let w1 = q.firstElementChild;
    let w2 = cit.documentElement.firstElementChild;
    while(w1 && w2) {
        if(w1.innerHTML.replaceAll(/ xmlns="http:\/\/www.tei-c.org\/ns\/1.0"/g,'') !== w2.innerHTML) {
            console.log(w1.innerHTML);
            console.log(w2.innerHTML);
            markDifferent(el);
            break;
        }
        w1 = w1.nextElementSibling;
        w2 = w2.nextElementSibling;
    }
};

const markDifferent = el => {
    const span = document.createElement('span');
    span.style.color = 'red';
    span.append('! ');
    span.dataset.anno = 'Citation differs from the edition cited.';
    el.prepend(span);
};

const checkCitations = async () => {
    const thisdoc = await loadDoc(window.location);
    const cits = document.querySelectorAll('li[data-source]');
    for(const cit of cits) {
        checkCitation(thisdoc, cit);
    }
};

const formatCitations = (citations) => {
    return '<table><tbody>' + citations.map(c => {
        const link = c.line ?
            c.filename + '?highlight=' + encodeURIComponent(`[id="${c.siglum}"] .l:nth-of-type(${c.line})`) :
            c.filename;
    return `<tr>
    <td><span class="msid" lang="en"><a href="https://uhh-tamilex.github.io/${link}">${c.siglum}</a></span></td>
    <td><q lang="ta">${c.context}</q></td>
    <td>${c.translation ? '<span class="context-translation">'+c.translation+'</span>':''}</td>
    <td>${c.syntax ? ' <span class="syntax">'+c.syntax+'</span>':''}</td>
</tr>`;}).join('\n') + '</tbody></table>';
};

const docClick = e => {
    const details = e.target.closest('details[data-entry]');
    if(details) getEntry(details);
};

const workers = {
    local: null,
    /*full: null*/
};

const getEntry = async targ => {
    const spinner = targ.querySelector(':scope > .spinner');
    if(!spinner) return;
    
    if(!workers.local) 
        workers.local = await openDb('./wordindex.db');

    let results = {};
    if(targ.id) {
        results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, syntax, particlefunction, rootnoun, enclitic, context, citation, line, filename FROM citations WHERE islemma = ${targ.id}`);
    }
    else {
        const lemma = targ.closest('details[id]')?.id || targ.dataset.select;
        const form = targ.closest('details').dataset.entry;
        const islemma = targ.closest('details').dataset.lemma;
        if(islemma) {
            if(lemma)
                results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, particlefunction, syntax, rootnoun, enclitic, context, citation, line, filename FROM citations WHERE islemma = "${islemma}"`);
            else
                results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, particlefunction, syntax, rootnoun, enclitic, context, citation, filename, line FROM citations WHERE form = "${islemma}"`);
        }
        else if(lemma)
            results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, particlefunction, syntax, rootnoun, enclitic, context, citation, line, filename FROM citations WHERE form = "${form}" AND fromlemma = "${lemma}"`);
        else
            results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, particlefunction, syntax, rootnoun, enclitic, context, citation, line, filename FROM citations WHERE form = "${form}" AND fromlemma IS NULL`);
        if(results.length === 0) // this is a hack; will get rid of this when words a properly lemmatized
            results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, particlefunction, syntax, rootnoun, enclitic, context, citation, line, filename FROM citations WHERE form = "${form}" AND fromlemma IS NULL`);
    }
    
    const entry = {
        translations: new Set(),
        grammar: new Set(),
        citations: []
    };
    
    const cols = new Map(results[0].columns.map((e,i) => [e,i]));
    for(const result of results[0].values) {
        if(result[cols.get('def')]) entry.translations.add(result[cols.get('def')]);
        if(result[cols.get('pos')]) entry.grammar.add(result[cols.get('pos')]);
        if(result[cols.get('number')]) entry.grammar.add(result[cols.get('number')]);
        if(result[cols.get('gender')]) entry.grammar.add(result[cols.get('gender')]);
        if(result[cols.get('nouncase')]) entry.grammar.add(result[cols.get('nouncase')]);
        if(result[cols.get('person')]) entry.grammar.add(result[cols.get('person')]);
        if(result[cols.get('aspect')]) entry.grammar.add(result[cols.get('aspect')]);
        if(result[cols.get('citation')]) entry.citations.push({
            siglum: result[cols.get('citation')],
            filename: result[cols.get('filename')],
            context: result[cols.get('context')],
            line: result[cols.get('line')],
            translation: result[cols.get('def')],
            syntax: result[cols.get('syntax')] || result[cols.get('rootnoun')] || results.particlefunction,
        });
    }
    let frag =
`<div lang="en">
<div>${[...entry.grammar].join(', ')}</div>
</div>`;
    if(entry.translations.size > 0) {
        frag = frag + 
`<div>
<h4 lang="en">translations in context</h4>
<div class="dict-definitions">${[...entry.translations].join(', ')}</div>`;
    }
    if(entry.citations.length > 0) {
        frag = frag + 
`<h4 lang="en">citations</h4>
<div class="dict-citations">
${formatCitations(entry.citations)}
</div>`;
    }
    const range = document.createRange();
    range.selectNode(targ);
    const docfrag = range.createContextualFragment(frag);
    const par = spinner.parentNode;
    spinner.replaceWith(docfrag);
    Transliterate.refreshCache(par);
    if(document.getElementById('transbutton').lang === 'en')
        Transliterate.activate(par);
};

document.addEventListener('click',docClick);
window.addEventListener('load',init);
