import Fs from 'fs';
import sqlite3 from 'better-sqlite3';
import Sanitize from 'sanitize-filename';

const order = [
    'a','ā','i','ī','u','ū','e','ē','ai','o','ō','au',
    'k','ṅ','c','ñ','ṭ','ṇ','t','n','p','m',
    'y','r','l','v',
    'ḻ','ḷ','ṟ','ṉ','ś','ṣ','h'
];

const getFirstLetter = (str) => {
    if(str[0] !== 'a') return str[0];
    if(str[1] === 'u' || str[1] === 'i') return 'a' + str[1];
    return 'a';
};

const go = () => {
    const template = Fs.readFileSync('wordindex-template.html',{encoding: 'utf-8'});
    const db = new sqlite3('../wordindex.db');

    const rows = db.prepare('SELECT lemma, form, recognized FROM lemmata ORDER BY formsort ASC').all();
    var out = '';
    const ordermap = new Map(order.map(o => [o,[]]));
    const unordered = [];

    for(const row of rows) {
        const firstletter = getFirstLetter(row.form);
        const group = ordermap.get(firstletter);
        const fname = Sanitize(row.lemma || row.form);
        const url = group ? 
            `articles/${firstletter}/${fname}.xml` :
            `articles/unsorted/${fname}.xml`;
        const outstr = `<li><a data-entry="${row.form}" href="${url}">${row.form}</a></li>\n`;

        if(group) group.push(outstr);
        else unordered.push(outstr);
    }

    const allgroups = [['',unordered],...ordermap];
    out = allgroups.filter(g => g[1].length > 0)
                   .map(g => `<div class="dict-group"><div>${g[1].join('')}</div><h2 class="dict-letter" lang="ta">${g[0]}</h2></div>`)
                   .join('\n');

    Fs.writeFileSync('../index.html',template.replace('<!-- insert list here -->',out));
};

go();
