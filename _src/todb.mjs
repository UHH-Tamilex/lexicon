import Fs from 'fs';
import Path from 'path';
import Jsdom from 'jsdom';
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
    'Akananuru',
    'Purananuru',
    'Kuruntokai',
    'Narrinai',
    'Ainkurunuru',
    'Kalittokai',
];

const go = () => {
    fulldb = dbops.open('../wordindex.db');
    fulldb.prepare('DROP TABLE IF EXISTS [citations]').run();
    fulldb.prepare('DROP TABLE IF EXISTS [lemmata]').run();
    fulldb.prepare('CREATE TABLE [lemmata] (lemma TEXT PRIMARY KEY, recognized INTEGER, form TEXT, formsort TEXT)').run();
    fulldb.prepare('CREATE TABLE [citations] ('+
        'form TEXT, '+
        'formsort TEXT, '+
        'islemma TEXT, '+
        'fromlemma TEXT, '+
        'def TEXT, '+
        'type TEXT, '+
        'number TEXT, '+
        'gender TEXT, '+
        'nouncase TEXT, '+
        'person TEXT, '+
        'aspect TEXT, '+
        'voice TEXT, '+
        'mood TEXT, '+
        //'misc TEXT, '+
        'rootnoun TEXT, '+
        'proclitic TEXT, ' +
        'enclitic TEXT, ' +
        'context TEXT, ' +
        'citation TEXT, ' +
        'filename TEXT' +
        ')').run();

    for(const path of paths) {
        const fullpath = `../../${path}/wordindex.db`;
        const db = dbops.open(fullpath);
        console.log(fullpath);
        const dict = db.prepare('SELECT * FROM citations').all();
        for(const d of dict)  {
            d.filename = `../${path}/${d.filename}`;
            fulldb.prepare('INSERT INTO citations VALUES (@form, @formsort, @islemma, @fromlemma, @def, @type, @number, @gender, @nouncase, @person, @voice, @aspect, @mood, @rootnoun, @proclitic, @enclitic, @context, @citation, @filename)').run(d);
        }
        const lemmata = db.prepare('SELECT * from lemmata').all();
        for(const l of lemmata)
            fulldb.prepare('INSERT OR IGNORE INTO lemmata VALUES (@lemma, @recognized, @form, @formsort)').run(l);
    }

    fulldb.pragma('journal_mode = DELETE');
    fulldb.pragma('page_size = 1024');
    dbops.close(fulldb);
};

go();
