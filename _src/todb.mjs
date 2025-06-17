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

var fulldb, minidb, webdb;
var dir = 'indices';
const paths = [
    'Kuruntokai',
    'Narrinai',
    'Akananuru',
    'Purananuru',
    'Ainkurunuru',
    'Patirruppattu',
    'Kalittokai',
    'TamilneriVilakkam',
    'Tirukkural',
    'Cilappatikaram',
    'Manimekalai',
    'NalayiratTivviyapPirapantam',
    'Tolkappiyam',
];

const go = async () => {
    fulldb = dbops.open('../wordindex.db');
    fulldb.prepare('DROP TABLE IF EXISTS [citations]').run();
    fulldb.prepare('DROP TABLE IF EXISTS [lemmata]').run();
    fulldb.prepare('DROP INDEX IF EXISTS idx_form').run();
    fulldb.prepare('DROP INDEX IF EXISTS idx_formsort').run();
    fulldb.prepare('CREATE TABLE [lemmata] (lemma TEXT PRIMARY KEY, recognized INTEGER, form TEXT, formsort TEXT, definition TEXT)').run();
    fulldb.prepare('CREATE TABLE [citations] ('+
        'form TEXT, '+
        'formsort TEXT, '+
        'sandhi TEXT, '+
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
        'precededby TEXT, '+
        'pregeminate INTEGER, '+
        'postgeminate INTEGER, '+
        'followedby TEXT, '+
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

    minidb = dbops.open('../lookupindex.db');
    minidb.prepare('DROP TABLE IF EXISTS [citations]').run();
    minidb.prepare('DROP INDEX IF EXISTS idx_form').run();
    minidb.prepare('CREATE TABLE [citations] ('+
        'form TEXT, '+
        'def TEXT, '+
        'pos TEXT, '+
        'number TEXT, '+
        'gender TEXT, '+
        'nouncase TEXT, '+
        'person TEXT, '+
        'aspect TEXT, '+
        'voice TEXT'+
        ')').run();

    webdb = dbops.open('../webindex.db');
    webdb.prepare('DROP TABLE IF EXISTS [citations]').run();
    webdb.prepare('DROP INDEX IF EXISTS idx_form').run();
    webdb.prepare('DROP INDEX IF EXISTS idx_formsort').run();
    webdb.prepare('CREATE TABLE [citations] ('+
        'form TEXT, '+
        'formsort TEXT, '+
        'def TEXT, '+
        'enclitic TEXT, '+
        'context TEXT, '+
        'citation TEXT, '+
        'line INTEGER, '+
        'filename TEXT'+
        ')').run();

    for(const path of paths) {
        const fullpath = `./${dir}/${path}/wordindex.db`;
        console.log(fullpath);
        const db = dbops.open(fullpath);
        const dict = db.prepare('SELECT * FROM citations').all();
        for(const d of dict)  {
            d.filename = `../${path}/${d.filename}`;
            fulldb.prepare('INSERT INTO citations VALUES (@form, @formsort, @sandhi, @islemma, @fromlemma, @def, @pos, @number, @gender, @nouncase, @person, @aspect, @voice, @precededby, @pregeminate, @postgeminate, @followedby, @syntax, @verbfunction, @particlefunction, @rootnoun, @misc, @proclitic, @enclitic, @context, @citation, @line, @filename)').run(d);
            minidb.prepare('INSERT INTO citations VALUES (@form, @def, @pos, @number, @gender, @nouncase, @person, @aspect, @voice)').run(d);
            webdb.prepare('INSERT INTO citations VALUES (@form, @formsort, @def, @enclitic, @context, @citation, @line, @filename)').run(d);
        }
        const lemmata = db.prepare('SELECT * from lemmata').all();
        for(const l of lemmata)
            fulldb.prepare('INSERT OR IGNORE INTO lemmata VALUES (@lemma, @recognized, @form, @formsort, @definition)').run(l);
    }

    fulldb.prepare('CREATE INDEX idx_form ON citations(form)').run();
    fulldb.prepare('CREATE INDEX idx_formsort ON citations(formsort)').run();
    fulldb.pragma('journal_mode = DELETE');
    fulldb.pragma('page_size = 1024');
    dbops.close(fulldb);

    minidb.prepare('CREATE INDEX idx_form ON citations(form)').run();
    minidb.pragma('journal_mode = DELETE');
    minidb.pragma('page_size = 1024');
    dbops.close(minidb);

    webdb.prepare('CREATE INDEX idx_form ON citations(form)').run();
    webdb.prepare('CREATE INDEX idx_formsort ON citations(formsort)').run();
    webdb.pragma('journal_mode = DELETE');
    webdb.pragma('page_size = 1024');
    dbops.close(webdb);
};

go();
