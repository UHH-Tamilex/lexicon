import { parse as CSVParse } from './csv-sync.js';
import { loadDoc } from '../lib/debugging/fileops.mjs';
import openDb from '../lib/js/sqlite.mjs';
import previewDoc from '../lib/debugging/preview.mjs';
import { init as lexInit, docClick} from '../lexicon-main.mjs';
import Sanscript from '../lib/js/sanscript.mjs';
import { findGrammar } from '../lib/debugging/aligner.mjs';
import { gramAbbreviations } from '../lib/debugging/abbreviations.mjs';

const _state = {
    csv: null,
    ns: 'http://www.tei-c.org/ns/1.0'
};

const init = async () => {
    const res = await fetch('../lemmaindex.csv');
    const text = await res.text();
    _state.csv = CSVParse(text,{relax_column_count_less: true});

    document.getElementById('lemmainput').addEventListener('keyup',findWord);
    document.getElementById('foundwords').addEventListener('click',startNew);
    document.getElementById('foundwords').addEventListener('mouseover',selectWord);
};

const selectWord = e => {
    const item = e.target.closest('.searchitem');
    if(!item) return;
    const allitems = document.getElementById('foundwords').querySelectorAll('.searchitem');
    for(const i of allitems) {
        if(i === item)
            i.classList.add('selected');
        else
            i.classList.remove('selected');
    }
};
const findWord = e => {
    const outbox = document.getElementById('foundwords');
    if(!e.target.value || e.key === 'Escape') {
        outbox.style.display = 'none';
        return;
    }

    if(e.key === 'Enter') {
        const item = document.querySelector('.searchitem.selected');
        if(!item) return;
        startNew({target: item});
    }

    if(e.key === 'ArrowDown') {
        const item = document.querySelector('.searchitem.selected');
        const next = item?.nextElementSibling;
        if(item && next) {
            item.classList.remove('selected');
            next.classList.add('selected');
            return;
        }
        if(!item) {
            const firstitem = document.querySelector('.searchitem');
            if(firstitem)
                firstitem.classList.add('selected');
        }
        return;
    }

    if(e.key === 'ArrowUp') {
        const item = document.querySelector('.searchitem.selected');
        const prev = item?.previousElementSibling;
        if(item && prev) {
            item.classList.remove('selected');
            prev.classList.add('selected');
        }
        return;
    }

    outbox.style.display = 'flex';
    const res = _state.csv.filter(i => i[0].startsWith(e.target.value))
                          .slice(0,10);
    outbox.innerHTML = res.map(e => {
        const dedr = e[2].indexOf('[') === -1 ? 
            e[2] :
            e[2].split('[')[1].replace(/\]$/,'').replace(/(\w)(\d)/,'$1 $2');
        return `<span class="searchitem" data-id="${e[2]}"><span class="lemma">${e[0]}</span><span class="dedr">${dedr}</span><span class="def">${e.length === 5 ? e[4] : ''}</span></span>`;
    }).join('');
};

const startNew = async e => {
    const item = e.target.closest('.searchitem');
    if(!item) return;
    
    const blurout = [
        {filter: 'blur(0)'},
        {filter: 'blur(20px)'},
    ];
    const blurtimer = {
        duration: 500,
        iterations: 1
    };

    document.querySelector('article').animate(blurout, blurtimer);
    document.querySelector('article').style.filter = 'blur(20px)';
    
    const updateWindow = makeProgressBox();
    
    document.getElementById('updateSpan1').textContent = 'Checking Tamilex database...';

    const lemma = item.dataset.id;
    const form = item.querySelector('.lemma').textContent;
    const def = item.querySelector('.def').textContent;
    const citations = _state.csv.filter(e => e[1] && e[2] === lemma);
    const citforms = citations.map(e => e[1]);

    const example = await loadDoc('example.xml');
    example.querySelector('titleStmt title').textContent = form;
    const entry = example.querySelector('entry');
    entry.setAttribute('corresp',lemma);
    entry.querySelector('form').textContent = form;
    entry.querySelector('def').textContent = def;
    const gramMap = new Map(gramAbbreviations);
    for(const citation of citations) {
        const subentry = example.createElementNS(_state.ns,'entry');
        const grammar = findGrammar(`(${citation[3]})`);
        let inner = '';
        if(grammar) {
            inner = `<gramGrp>${grammar.gram.map(e => '<gram>' + gramMap.get(e) + '</gram>').join('')}</gramGrp>`;
        }    
        inner = inner + `<form xml:lang="ta">${citation[1]}</form>`;
        subentry.innerHTML = inner;
        entry.appendChild(subentry);
    }
    
    const nikantus = await getNikantuCitations([form,...citforms]);
    if(nikantus) {
        const ncit = example.createElementNS(_state.ns,'cit');
        ncit.setAttribute('xml:lang','ta');
        ncit.setAttribute('type','nikantu-meanings');
        ncit.innerHTML = nikantus;
        entry.appendChild(ncit);
    }
    // TODO: add -tal and -ttal forms for Madras Lexicon 
    const others = await getOtherCitations([form,...citforms],example);
    for(const other of others)
        entry.appendChild(other);
        
    const previewed = await previewDoc(example);
    document.replaceChild(document.adoptNode(previewed.documentElement), document.documentElement);

    const blurin = [
        {filter: 'blur(20px)'},
        {filter: 'blur(0)'},
    ];
    document.body.animate(blurin, blurtimer);
    document.getElementById('recordcontainer').style.filter = 'blur(0)';
    document.addEventListener('click',docClick);
    lexInit('../wordindex.db',{doc: example, filename: `${form}.xml`});
    for(const det of document.querySelectorAll('.teitext > div > details'))
        det.open = 'true';

};

const makeProgressBox = () => {
    const container = document.createElement('div');
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.position = 'absolute';
    container.style.left = '0';
    container.style.top = '0';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';

    const box = document.createElement('div');
    box.id = 'updateWindow';
    box.style.width = '40ch';
    box.style.display = 'flex';
    box.style.justifyContent = 'center';
    box.style.alignItems = 'center';
    box.style.height = '10ch';
    box.style.background = 'rgba(255,255,255,0.7)';
    box.style.fontSize = '1.5rem';
    box.style.border = '1px solid black';
    box.style.borderRadius = '0.3rem';
    const span1 = document.createElement('span');
    span1.id = 'updateSpan1';
    const span2 = document.createElement('span');
    span2.id = 'updateSpan2';
    span2.style.marginLeft = '0.7rem';
    box.append(span1, span2);
    container.appendChild(box);
    document.body.appendChild(container);
    const fadeinout = [
        {opacity: '1'},
        {opacity: '0.3'},
        {opacity: '1'},
    ];
    const fadetimer = {
        duration: 1300,
        iterations: Infinity
    };

    span2.animate(fadeinout,fadetimer);
    return box;
};

const getNikantuCitations = async forms => {
    const db = await openDb('https://uhh-tamilex.github.io/Tivakaram/index.db');
    document.getElementById('updateSpan1').textContent = 'Checking Tivākaram for ';
    const updatebox = document.getElementById('updateSpan2');
    const ret = new Map();
    for(const form of forms) {
        updatebox.textContent = `${form}...`;    
        const glosses = await db.exec(`SELECT gloss, citation, line, filename FROM citations WHERE lemma = "${form}"`);
        const glossed = await db.exec(`SELECT lemma, citation, line, filename FROM citations WHERE gloss = "${form}"`);
        const all = [];
        if(glosses[0]) for(const g of glosses[0].values) all.push(g);
        if(glossed[0]) for(const g of glossed[0].values) all.push(g);
        if(all.length) {
            ret.set(form, all.map(e =>
                    `<cit><ref target="https://uhh-tamilex.github.io/Tivakaram/${e[3]}?highlight=[id%3D'${e[1]}'] .l%3Anth-of-type(${e[2]})"><title>Tivākaram</title> <num>${e[1].split(/(\d)/).slice(1).join('')}</num></ref><def>${e[0]}</def></cit>`
                )
            );
        }
    }
    if(!ret.size) return;
    return [...ret].map(r =>`<sense><form>${r[0]}</form>${r[1]}</sense>`);
};

const getOtherCitations = async (forms,doc) => {
    const url_domain = 'https://dsal.uchicago.edu';
    const url_prefix = '/cgi-bin/app/';
    const dicts = new Map([
        ['fabricius',
         {date: '1972 [1779]',
          edition: '4th edition',
          title: '<title xml:lang="en">Tamil and English Dictionary (Fabricius)</title>',
        }],
        ['winslow',
         {date: '1862',
          title: '<title xml:lang="en">A comprehensive Tamil and English dictionary (Winslow)</title>',
        }],
        ['kadirvelu',
         {date: '1928 [1902]',
          edition: '6th edition',
          title: '<title xml:lang="ta">Tamiḻmoḻiyakarāti (Katiraivēṟ Piḷḷai)</title>',
        }],
        ['tamil-lex',
         {date: '1924–1936',
          title: '<title xml:lang="en">Tamil Lexicon (University of Madras)</title>',
        }],
        ['mcalpin',
         {date: '1981',
          title: '<title xml:lang="en">A Core Vocabulary for Tamil (McAlpin)</title>'
        }],
        ['burrow',
         {date: '1984 [1961]',
          edition: '2nd edition',
          title: '<title xml:lang="en">Dravidian Etymological Dictionary</title>',
        }],
        ['crea',
         {date: '1992',
          title: '<title xml:lang="ta">Kriyāviṉ taṟkālat Tamiḻ akarāti</title>',
        }],
        ['tamil-idioms',
         {date: '1997',
          title: '<title xml:lang="ta">Taṟkālat Tamiḻ maraputtoṭar akarāti: Tamiḻ-Tamiḻ-Āṅkilam</title>'
        }]
    ]);
    const dictsort = [...dicts.keys()];
    const ret = new Map();
    document.getElementById('updateSpan1').textContent = 'Checking other lexica for';
    const updatebox = document.getElementById('updateSpan2');
    for(const form of forms) {
        const transed = Sanscript.t(form,'iast','tamil');
        updatebox.textContent = `${transed}...`;    
        const doc = await loadDoc(`https://dsal.uchicago.edu/cgi-bin/app/tamil_query.py?qs=${transed}&searchhws=yes&matchtype=exact`,'default','html');
        for(const result of doc.querySelectorAll('.hw_result')) {
            const as = result.querySelectorAll('a');
            const key = as[1].getAttribute('href').split('/')[2];
            const deets = dicts.has(key);
            if(deets) {
                let item = ret.get(key);
                if(!item) {
                    item = [];
                    ret.set(key,[[as[2].getAttribute('href'),as[2].textContent]]);
                }
                else {
                    if(!item.find(i => i[1] === as[2].textContent))
                        item.push([as[2].getAttribute('href'),as[2].textContent]);
                }
            }
            
        }
    }
    return [...ret].sort((a,b) => dictsort.indexOf(a[0]) - dictsort.indexOf(b[0])).map(i => {
        const deets = dicts.get(i[0]);
        i[1].sort((a,b) => parseInt(a[0].match(/\d+$/)[0]) - parseInt(b[0].match(/\d+$/)[0]));
        const refs = i[1].reduce((acc,cur) => acc + `<ref target="${url_domain}${cur[0]}">${cur[1]}</ref>`,'');
        const cit = doc.createElementNS(_state.ns,'cit');
        cit.setAttribute('type','lexicon');
        cit.innerHTML = `<bibl><date>${deets.date}</date>${deets.title}${refs}</bibl>`;
        return cit;
    });
};

init();
