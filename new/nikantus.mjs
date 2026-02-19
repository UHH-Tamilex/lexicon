import openDb from '../lib/js/sqlite.mjs';

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

const getNikantuCitations = async (forms,libdir='../lib/js/') => {
    const db = await openDb('https://uhh-tamilex.github.io/Tivakaram/index.db');
    const updatespan = document.getElementById('updateSpan1');
    if(updatespan) updatespan.textContent = 'Checking Tivākaram for ';
    const updatebox = document.getElementById('updateSpan2');
    const ret = new Map();
    for(const form of forms) {
        if(updatebox) updatebox.textContent = `${form}...`;    
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
    return [...ret].map(r =>`<sense>\n<form>${r[0]}</form>\n${r[1].join('\n')}\n</sense>`);
};

const makeNikantuGraphs = () => {

    const list = document.getElementById('nikantu-list');
    if(!list) return;

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
        span.innerHTML = `<span style="color: ${colour}">\u25A0</span> <span class="citref"><em class="title" lang="ta">${name}</em></span>`;
        legend.appendChild(span);
    }

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

export { getNikantuCitations, makeNikantuGraphs };
