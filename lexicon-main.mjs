import { Transliterate } from './lib/js/transliterate.mjs';
import { GitHubFunctions } from './lib/js/githubfunctions.mjs';
import './lib/js/tooltip.mjs';
import './lib/js/removehyphens.mjs';
//import createSqlWorker from './lib/js/sqlWorker.mjs';
import openDb from './lib/js/sqlite.mjs';
import { dbSchema } from './lib/debugging/abbreviations.mjs';
import startEditMode from './new/editmode.mjs';
import {formatCitations, checkCitations} from './citations.mjs';
import { makeNikantuGraphs } from './new/nikantus.mjs';

const _state = {
    dburl: './wordindex.db'
};

const init = (dburl,xmlsrc,edit=false) => {
    
    if(dburl) _state.dburl = dburl;

    checkCitations();
    const citlink = document.getElementById('citationlink');
    const url = new URL(window.location);
    citlink.textContent = url.hostname + decodeURI(url.pathname);
    citlink.href = window.location;
    
    makeNikantuGraphs();

    const recordcontainer = document.getElementById('recordcontainer');
    Transliterate.init(recordcontainer);
    
    GitHubFunctions.latestCommits();
    
    if(xmlsrc) startEditMode(Transliterate,xmlsrc);
    else {
        const islocal = ['localhost','127.0.0.1'].includes(window.location.hostname);
        const searchparams = new URLSearchParams(window.location.search);
        if(searchparams.get('noedit') === null && (searchparams.get('edit') !== null || islocal))
            startEditMode(Transliterate,xmlsrc);
    }

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

const docClick = e => {
    const details = e.target.closest('details[data-entry]');
    if(details) getEntry(details);
};

const workers = {
    local: null,
    /*full: null*/
};

const getPOS = el => {
    const grams = el.querySelectorAll('.nested-grammar span');
    for(const gram of grams) {
        const s = gram.textContent.trim();
        if(dbSchema.pos.has(s))
            return ` AND (pos = "${s}" OR pos IS NULL)`;
    }
    return '';
};

const getEntry = async targ => {
    const spinner = targ.querySelector(':scope > .spinner');
    if(!spinner) return;
    
    if(!workers.local) 
        workers.local = await openDb(_state.dburl);

    let results = {};
    if(targ.id) {
        results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, syntax, particlefunction, rootnoun, enclitic, context, citation, line, filename FROM citations WHERE islemma = ${targ.id}`);
    }
    else {
        const lemma = targ.closest('details[id]')?.id || targ.dataset.select;
        const headel = targ.closest('details');
        const form = headel.dataset.entry;
        const islemma = headel.dataset.lemma;
        const isparticle = headel.dataset.type === 'particle';
        const grammar = getPOS(headel);
        if(isparticle) {
                results = await workers.local.exec(`SELECT particlefunction, syntax, context, citation, line, filename FROM citations WHERE enclitic = "${form}"`);
        }
        else if(islemma) {
            if(lemma)
                results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, particlefunction, syntax, rootnoun, enclitic, context, citation, line, filename FROM citations WHERE islemma = "${islemma}"`);
            else
                results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, particlefunction, syntax, rootnoun, enclitic, context, citation, filename, line FROM citations WHERE form = "${islemma}"${grammar}`);
        }
        else if(lemma)
            results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, particlefunction, syntax, rootnoun, enclitic, context, citation, line, filename FROM citations WHERE form = "${form}" AND fromlemma = "${lemma}"${grammar}`);
        else
            results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, particlefunction, syntax, rootnoun, enclitic, context, citation, line, filename FROM citations WHERE form = "${form}" AND fromlemma IS NULL${grammar}`);
        if(results.length === 0) // this is a hack; will get rid of this when words a properly lemmatized
            results = await workers.local.exec(`SELECT def, pos, number, gender, nouncase, person, voice, aspect, particlefunction, syntax, rootnoun, enclitic, context, citation, line, filename FROM citations WHERE form = "${form}" AND fromlemma IS NULL${grammar}`);
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

export { init, docClick, checkCitations, makeNikantuGraphs };
