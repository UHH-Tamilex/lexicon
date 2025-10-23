import Citer from './lib/debugging/cite.mjs';
import { loadDoc } from './lib/debugging/fileops.mjs';

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

const checkCitations = async (doc = document, thisdoc = null) => {
    const cits = doc.querySelectorAll('li[data-source]');
    if(cits.length === 0) return;

    if(!thisdoc) thisdoc = await loadDoc(window.location,'default');
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

export {checkCitations, formatCitations};
