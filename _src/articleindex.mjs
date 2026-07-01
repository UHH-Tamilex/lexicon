import Fs from 'fs';
import Path from 'path';
import Jsdom from 'jsdom';
import CSV from '../lib/debugging/matrix-editor/lib/csv.mjs';

const order = [
    'a','ā','i','ī','u','ū','e','ē','ai','o','ō','au',
    'k','ṅ','c','ñ','ṭ','ṇ','t','n','p','m',
    'y','r','l','v',
    'ḻ','ḷ','ṟ','ṉ','ś','ṣ','h'
];
const getFirstLetter = str => {
    if(str[0] !== 'a') return str[0];
    if(str[1] === 'u' || str[1] === 'i') return 'a' + str[1];
    return 'a';
};

const DOM = new Jsdom.JSDOM('');
const DOMParser = new DOM.window.DOMParser();

const findArticles = () => {
  const ret = new Map();
  const dirs = order.map(l => `../${l}/`);
  for(const dir of dirs) {
    if(!Fs.existsSync(dir) || !Fs.lstatSync(dir).isDirectory()) continue;
    const fnames = Fs.readdirSync(dir);
    for(const fname of fnames) {
      if(!fname.endsWith('.xml')) continue;
      const file = Fs.readFileSync(dir + fname,{encoding: 'utf-8'});
      const doc = DOMParser.parseFromString(file,'text/xml');
      const lemma = doc.querySelector('titleStmt > title').textContent;
      const id = doc.querySelector('text > body > entry[corresp]').getAttribute('corresp');
      const grammar = [...doc.querySelectorAll('text > body > entry[corresp] > gramGrp > gram')].map(el => el.textContent).join(', ');
      const firstletter = getFirstLetter(lemma);
      ret.set(id,{lemma: lemma, grammar: grammar, path: firstletter + '/' + fname});
    }
  }
  return ret;
};

const go = () => {
  const template = Fs.readFileSync('../lib/_indexer/wordindex-template.html',{encoding: 'utf-8'});
  const lemmaindex = Fs.readFileSync('../lemmaindex.csv',{encoding: 'utf-8'});
  const csvarr = CSV.parse(lemmaindex,{delimiter: ','}).filter(r => r[0] !== null).map(r => [r[0],r[2]]);
  csvarr.shift();
  const articles = findArticles();

  const ordermap = new Map(order.map(o => [o,[]]));
  const unordered = [];
  let prevlemma = {form: '', num: 1};
  for(const row of csvarr) {
    const article = articles.get(row[1]);
    if(article) {
      let lemmastr = '';
      if(prevlemma.form === article.lemma) {
        prevlemma.num = prevlemma.num + 1;
        lemmastr = article.lemma + `<sup>${prevlemma.num}</sup>`;
      }
      else {
        lemmastr = article.lemma;
        prevlemma.form = article.lemma;
        prevlemma.num = 0;
      }
      const formstr = `<hr/><div class="dictrow" data-entry="${row[1]}"><a href="${article.path}" class="lemma-name">${lemmastr}</a> <span class="lemma-grammar" lang="en">${article.grammar}</span></div>`;
      const group = ordermap.get(getFirstLetter(article.lemma));
      if(group) group.push(formstr);
      else unordered.push(formstr);
    }
    else {
      const formstr = `<hr class="newentry"/><div class="dictrow newentry" data-entry="${row[1]}"><a href="new/index.html?lemma=${row[1]}" class="lemma-name">${row[0]}</a> <span class="lemma-id" lang="en">${row[1]}</span></div>`;

      const group = ordermap.get(getFirstLetter(row[0]));
      if(group) group.push(formstr);
      else unordered.push(formstr);
      if(prevlemma.form === row[0]) prevlemma.num = prevlemma.num + 1;
      else {
        prevlemma.form = row[0];
        prevlemma.num = 0;
      } 
    }
  }

  const allgroups = [['',unordered],...ordermap];
  const out = allgroups.filter(g => g[1].length > 0)
                 .map(g => `<div class="dict-group"><div>${g[1].join('')}</div><h2 class="dict-letter" lang="ta">${g[0]}</h2></div>`)
                 .join('\n');
  const outtext = template.replace('<!-- insert title here -->','Tamilex articles')
                          .replace('<span lang="ta"><!-- insert title here --></span> word index','<span lang="en">Tamilex articles</span>')
                          .replace('<!-- insert list here -->',out);
  Fs.writeFileSync('../articles.html',outtext);
}

go();
