import openDb from './lib/js/sqlite.mjs';
import SqlString from './SqlString.js';
import { Sanscript } from './lib/js/sanscript.mjs';
import Hypher from './lib/js/hypher.mjs';
import { hyphenation_ta } from './lib/js/ta.mjs';

const _state = {
    db: null,
    hyphenator: new Hypher(hyphenation_ta)
};

const getCits = async (word,select,taml) => {
    const pre = 'SELECT form, def, enclitic, context, citation, line, filename FROM citations WHERE ';
    const query = pre + (taml ? 'formsort ' : 'form ');
    let res;
    switch (select) { 
        case 0:
            return _state.db.exec(query + 'LIKE ' + SqlString.escape(`%${word}%`));
        case 1:
            return _state.db.exec(query + '= ' + SqlString.escape(word));
        case 2:
            return _state.db.exec(query + 'LIKE ' + SqlString.escape(`${word}%`));
        case 3:
            return _state.db.exec(query + 'LIKE ' + SqlString.escape(`%${word}`));
    }
};

const queryDb = async (word,select,taml) => {
    const cits = await getCits(word,select,taml);
    if(!cits || cits.length === 0) return;
    return cits;

};

const go = async str => {
    document.getElementById('recent').style.display = 'none';
    const index = document.getElementById('index');
    $('#index').DataTable().clear();
    $('#index').DataTable().destroy();
    index.style.visibility = 'hidden';
    const spinner = document.getElementById('spinnerdiv');
    const noresult = document.getElementById('noresult');
    noresult.style.visibility = 'hidden';
    spinner.style.display = 'flex';
    const TamlRange = /[\u0b80-\u0bff]/u;
    const detected = str.match(TamlRange);
    const Trans = s => Sanscript.t(s,'iast','tamil');
    const select = document.getElementById('ftsselect').selectedIndex;
    const res = await queryDb(str,select,detected);
    spinner.style.display = 'none';
    if(!res) {
        document.getElementById('noresulttext').textContent = str;
        noresult.style.visibility = 'visible';
        return;
    }
    index.style.visibility = 'visible';
    const data = res[0].values.map(obj => {
        
        const word = detected ? Trans(obj[0]) : obj[0];
        const enclitic = !obj[2] ? null :
            detected ? Trans(obj[2]) : obj[2];
        const scriptline = detected ? 'script=Taml&' : '';
        const citation = obj[5] ? 
            `<a href="${obj[6]}?${scriptline}highlight=` +
                encodeURIComponent(`[id="${obj[4]}"] .l:nth-of-type(${obj[5]})`) +
                `">${obj[4]}, line ${obj[5]}</a>` :
            `<a href="${obj[6]}">${obj[4]}</a>`;
        const hyphenated = _state.hyphenator.hyphenateText(obj[3]);
        const context = detected ? Trans(hyphenated) : hyphenated;
        const gloss = obj[1];
     
        return [word, enclitic, citation, context, gloss];
    });
    const ftstable = new DataTable('#index', {
        searchable: true,
        language: {search: 'Filter: '},
        paging: true,
        pageLength: 100,
        fixedHeader: true,
        lengthMenu: [
            [25, 50, 100, -1],
            [25, 50, 100, 'All']
        ],
        sortable: true,
        data: data,
        columns: [
            { title: 'word', type: !detected ? 'tamil' : '' },
            { title: 'enclitic', type: !detected ? 'tamil': '' },
            { title: 'citation' },
            { title: 'context', type: !detected ? 'tamil': '' },
            { title: 'gloss', type: !detected ? 'tamil': '' },

        ],
        responsive: {
            details: {
                type: 'inline'
            }
        }
    });
    newPage(str,select);
};

const init = async () => {
    const spinner = document.getElementById('spinnerdiv');
    spinner.style.display = 'flex';
    _state.db = await openDb('webindex.db');
    const container = document.getElementById('ftsdiv');
    const inputbox = document.getElementById('ftsinput');
    const urlParams = new URLSearchParams(window.location.search);
    const select = urlParams.get('s');
    if(select) {
        document.getElementById('ftsselect').selectedIndex = select;
    }
    const query = urlParams.get('q');
    if(query) {
        inputbox.value = query;
        await go(query);
    }
    inputbox.addEventListener('keyup', e => {
        if(e.keyCode !== 13) return;
        const val = inputbox.value.trim();
        if(val !== '') go(val);
    });
    document.getElementById('ftsbutton').addEventListener('click', e => {
        const val = inputbox.value.trim();
        if(val !== '') go(val);
    });
    spinner.style.display = 'none';
    ftsdiv.style.visibility = 'visible';
};

const newPage = (val,select) => {
    const url = new URL(window.location.href);
    url.searchParams.set('q',val);
    url.searchParams.set('s',select);
    window.history.pushState(null,'',url.toString());
};

window.addEventListener('DOMContentLoaded',init);
