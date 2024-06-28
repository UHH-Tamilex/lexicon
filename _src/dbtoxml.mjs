import Fs from 'fs';
import Jsdom from 'jsdom';
import sqlite3 from 'better-sqlite3';
import Sanitize from 'sanitize-filename';
import Beautify from 'beautify';
import {Sanscript} from '../lib/js/sanscript.mjs';

const order = new Set([
    'a','ā','i','ī','u','ū','e','ē','ai','o','ō','au',
    'k','ṅ','c','ñ','ṭ','ṇ','t','n','p','m',
    'y','r','l','v',
    'ḻ','ḷ','ṟ','ṉ','ś','ṣ','h'
]);

const getFirstLetter = (str) => {
    if(str[0] !== 'a') return str[0];
    if(str[1] === 'u' || str[1] === 'i') return 'a' + str[1];
    return 'a';
};

const loadTemplate = () => {
    const text = Fs.readFileSync('article-template.xml',{encoding: 'utf-8'});
    const dom = new Jsdom.JSDOM('');
    const parser = new dom.window.DOMParser();
    return parser.parseFromString(text,'text/xml');
};

const go = () => {
    const ns = 'http://www.tei-c.org/ns/1.0';
    const template = loadTemplate();
    const dom = new Jsdom.JSDOM('');
    const serializer = new (new Jsdom.JSDOM('')).window.XMLSerializer();

    const db = new sqlite3('../wordindex.db');
    const outdir = '../articles';
    for(const letter of order)
        Fs.mkdirSync(`${outdir}/${letter}`,{recursive: true});
        Fs.mkdirSync(`${outdir}/unsorted`,{recursive: true});

    const rows = db.prepare('SELECT lemma, form, definition FROM lemmata ORDER BY formsort ASC').all();

    for(const row of rows) {
        const clone = template.cloneNode(true);
        clone.querySelector('title > title').append(row.form);
        const entry = clone.querySelector('entry');
        entry.setAttribute('corresp', row.lemma || row.form);
        entry.querySelector('form').append(row.form);
        if(row.definition) {
            const defs = row.definition.split(';');
            for(const def of defs) {
                const senseel = clone.createElementNS(ns,'sense');
                const defel = clone.createElementNS(ns,'def');
                defel.setAttribute('xml:lang','en');
                defel.append(def);
                senseel.append(defel);
                entry.append(senseel);
            }
        }
        
        const lemcits = db.prepare('SELECT type, number, gender, nouncase, person, voice, aspect, mood FROM citations where islemma = ?').all(row.lemma || row.form);
        const gramGrp = entry.querySelector('gramGrp');
        const gramset = new Set();
        for(const lemcit of lemcits) {
            for(const grammar in lemcit)
                if(lemcit.hasOwnProperty(grammar) && lemcit[grammar])
                    gramset.add(lemcit[grammar]);
        }
        for(const gramname of gramset) {
            const gram = clone.createElementNS(ns,'gram'); 
            gram.append(gramname);
            gramGrp.append(gram);
        }

        const madras = clone.createElementNS(ns,'cit'); 
        madras.setAttribute('type','lexicon');
        madras.innerHTML = `<title xml:lang="en">University of Madras Tamil Lexicon</title>\n<ref target="https://dsal.uchicago.edu/cgi-bin/app/tamil-lex_query.py?qs=${Sanscript.t(row.form,'iast','tamil')}&amp;searchhws=yes&amp;matchtype=exact">p. ??</ref>`;
        const dedr = clone.createElementNS(ns,'cit');
        dedr.setAttribute('type','lexicon');
        dedr.innerHTML = `<title xml:lang="en">Dravidian Etymological Dictionary</title>\n<ref target="https://dsal.uchicago.edu/cgi-bin/app/burrow_query.py?qs=${row.form}&amp;searchhws=yes">p. ??</ref>`;
        entry.append(madras);
        entry.append(dedr);
        const forms = db.prepare('SELECT DISTINCT form FROM citations WHERE fromlemma = ? ORDER BY formsort ASC').all(row.lemma);

        for(const f of forms) {
            const subentry = clone.createElementNS(ns,'entry');
            subentry.setAttribute('corresp',f.form);
            const subform = clone.createElementNS(ns,'form');
            subform.setAttribute('xml:lang','ta');
            subform.append(f.form);
            subentry.appendChild(subform);
            entry.appendChild(subentry);
        }

        const fname = Sanitize(row.lemma || row.form);
        const outf = Beautify(serializer.serializeToString(clone),{format: 'xml'});
        const initial = getFirstLetter(row.form);
        if(order.has(initial)) 
            Fs.writeFileSync(`${outdir}/${initial}/${fname}.xml`,outf);
        else
            Fs.writeFileSync(`${outdir}/unsorted/${fname}.xml`,outf);
    }
};

go();
