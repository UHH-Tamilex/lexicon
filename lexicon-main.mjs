import { Transliterate } from './lib/js/transliterate.mjs';
import { GitHubFunctions } from './lib/js/githubfunctions.mjs';
import './lib/js/tooltip.mjs';
import './lib/js/removehyphens.mjs';
//import createSqlWorker from './lib/js/sqlWorker.mjs';
import openDb from './lib/js/sqlite.mjs';
import { loadDoc } from './lib/debugging/fileops.mjs';
import Citer from './lib/debugging/cite.mjs';

const init = () => {
    
    checkCitations();
    const citlink = document.getElementById('citationlink');
    const url = new URL(window.location);
    citlink.textContent = url.hostname + decodeURI(url.pathname);
    citlink.href = window.location;
    
    makeNikantuGraphs();

    const recordcontainer = document.getElementById('recordcontainer');
    Transliterate.init(recordcontainer);
    
    GitHubFunctions.latestCommits();

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

const tamilSort = (aa,bb,dir='asc') => {
    const order = 'aāiīuūṛṝeēoōkgṅcjñṭḍṇtdnpbmyrlvḻḷṟṉśṣsh'.split('').reverse();
    const ordermap = new Map();
    for(const [i,v] of order.entries()) {
        ordermap.set(v,i);
    }
    const a = aa[0];
    const b = bb[0];
    const minlen = Math.min(a.length,b.length);
    let n = 0;
    while(n < minlen) {
        const achar = a.charAt(n).toLowerCase();
        const bchar = b.charAt(n).toLowerCase();
        if(achar === bchar) {
            n++;
        } else {
            
            const aindex = ordermap.get(achar) || -1;
            const bindex = ordermap.get(bchar) || -1;
            return dir === 'asc' ? aindex < bindex : aindex > bindex;
            
            //return order.indexOf(achar) < order.indexOf(bchar);
        }
    }
    return dir === 'asc' ? a.length > b.length : a.length < b.length;
};
const makeNikantuGraphs = () => {

    const colours = ['#66c2a5','#fc8d62','#8da0cb'];
    
    const textnames =  new Set([...document.querySelectorAll('.citation-nikantu .reftitle')].map(el => el.textContent));

    const colourMap = new Map();
    for(const [i,name] of [...textnames].entries()) {
        colourMap.set(name, colours[i]);
    }
    
    const legend = document.createElement('div');
    legend.id = 'nikantu-legend';
    for(const [name, colour] of [...colourMap]) {
        const span = document.createElement('span');
        span.innerHTML = `<span style="color: ${colour}">\u25A0</span> <span class="citref"><em class="title">${name}</em></span>`;
        legend.appendChild(span);
    }

    const list = document.getElementById('nikantu-list');
    list.parentNode.insertBefore(legend,list);

    const makeNikantuGraph = el => {
        const form = el.querySelector('.nikantu-form').textContent;
        const nikantus = el.querySelectorAll('li');
        const rows = new Map();
        for(const nikantu of nikantus) {
            const citref = nikantu.querySelector('.citref');
            const name = citref.querySelector('.reftitle').textContent;
            const target = citref.querySelector('.verseid').textContent;
            const words = nikantu.querySelectorAll('.nikantu-meanings > span');
            for(const word of words) {
                const wordtext = word.textContent;
                const row = rows.get(wordtext);
                if(row)
                    row.push([name,citref.innerHTML,target]);
                else
                    rows.set(wordtext,[[name,citref.innerHTML,target]]);
            }
        }

        const table = document.createElement('table');
        table.lang = 'ta';
        const titlerow = document.createElement('tr');
        const title = document.createElement('th');
        title.className = 'nikantu-form';
        title.append(form);
        title.colSpan = 2;
        titlerow.appendChild(title);
        table.appendChild(titlerow);
        const sortedrows = [...rows].toSorted(tamilSort);
        for(const row of sortedrows) {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.append(row[0]);
            th.className = 'graph-header';
            tr.appendChild(th);
            const td = document.createElement('td');
            for(const nikantu of row[1]) {
                const span = document.createElement('a');
                span.append('\u25A0');
                span.style.color = colourMap.get(nikantu[0]);
                span.className = 'graph-bar';
                span.href = nikantu[2];
                span.dataset.anno = '';
                const anno = document.createElement('span');
                anno.className = 'anno-inline';
                anno.innerHTML = nikantu[1];
                span.appendChild(anno);
                td.appendChild(span);
            }
            tr.appendChild(td);
            table.appendChild(tr);
        }
        el.replaceWith(table);
    };

    const cits = [...document.querySelectorAll('.citation-nikantu')].forEach(
        el => makeNikantuGraph(el)
    );
};

const checkCitation = async (thisxml,el) => {
    const url = URL.parse(el.dataset.source,window.location);
    const xml = await loadDoc(url.href,'default');
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
    span.className = 'warning';
    span.append('!');
    span.dataset.anno = 'Citation differs from the edition cited.';
    el.prepend(span);
    el.style.listStyle = 'none';
};

const checkCitations = async () => {
    const thisdoc = await loadDoc(window.location,'default');
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
        const isparticle = targ.closest('details').dataset.type === 'particle';
        if(isparticle) {
                results = await workers.local.exec(`SELECT particlefunction, syntax, context, citation, line, filename FROM citations WHERE enclitic = "${form}"`);
        }
        else if(islemma) {
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
    if(!results[0]) {
        spinner.remove();
        return;
    }
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

export { init, docClick };
