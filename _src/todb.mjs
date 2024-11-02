import sqlite3 from 'better-sqlite3';

const dbops = {
    open: (f) => {
        const db = new sqlite3(f);
        db.pragma('journal_mode = WAL');
        return db;
    },

    close: (db) => {
        db.prepare('VACUUM').run();
        db.close();
    }
};

const dir = '../..';
var fulldb;
const paths = [
    'Kuruntokai',
    'Narrinai',
    'Akananuru',
    'Purananuru',
    'Ainkurunuru',
    'Kalittokai',
    'TamilneriVilakkam',
    'NalayiratTivviyapPirapantam',
];

const go = () => {
    fulldb = dbops.open('../wordindex.db');
    fulldb.prepare('DROP TABLE IF EXISTS [citations]').run();
    fulldb.prepare('DROP TABLE IF EXISTS [lemmata]').run();
    fulldb.prepare('CREATE TABLE [lemmata] (lemma TEXT PRIMARY KEY, recognized INTEGER, form TEXT, formsort TEXT, definition TEXT)').run();
    fulldb.prepare('CREATE TABLE [citations] ('+
        'form TEXT, '+
        'formsort TEXT, '+
        'islemma TEXT, '+
        'fromlemma TEXT, '+
        'def TEXT, '+
        'pos TEXT, '+
        'number TEXT, '+
        'gender TEXT, '+
        'nouncase TEXT, '+
        'person TEXT, '+
        'aspect TEXT, '+
        'voice TEXT, '+
        'geminateswith TEXT, '+
        'syntax TEXT, '+
        'verbfunction TEXT, '+
        'particlefunction TEXT, '+
        'rootnoun TEXT, '+
        'misc TEXT, '+
        'proclitic TEXT, ' +
        'enclitic TEXT, ' +
        'context TEXT, ' +
        'citation TEXT, ' +
        'line INTEGER, ' +
        'filename TEXT' +
        ')').run();

    for(const path of paths) {
        const fullpath = `../../${path}/wordindex.db`;
        const db = dbops.open(fullpath);
        console.log(fullpath);
        const dict = db.prepare('SELECT * FROM citations').all();
        for(const d of dict)  {
            d.filename = `../${path}/${d.filename}`;
            fulldb.prepare('INSERT INTO citations VALUES (@form, @formsort, @islemma, @fromlemma, @def, @pos, @number, @gender, @nouncase, @person, @aspect, @voice, @geminateswith, @syntax, @verbfunction, @particlefunction, @rootnoun, @misc, @proclitic, @enclitic, @context, @citation, @line, @filename)').run(d);
        }
        const lemmata = db.prepare('SELECT * from lemmata').all();
        for(const l of lemmata)
            fulldb.prepare('INSERT OR IGNORE INTO lemmata VALUES (@lemma, @recognized, @form, @formsort, @definition)').run(l);
    }

    fulldb.pragma('journal_mode = DELETE');
    fulldb.pragma('page_size = 4096');
    dbops.close(fulldb);
};

go();
