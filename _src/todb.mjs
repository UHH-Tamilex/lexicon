import Fs from 'fs';
import Path from 'path';
import Jsdom from 'jsdom';
import sqlite3 from 'better-sqlite3';

const dbops = {
    open: (f) => {
        const db = new sqlite3(f);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
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
    'Narrinai',
    'Kalittokai',
    'Ainkurunuru'
].map(s => `../../${s}/wordindex/wordindex.db`);

const go = () => {
    fulldb = dbops.open('../wordindex.db');
    fulldb.prepare('DROP TABLE IF EXISTS [dictionary]').run();
    fulldb.prepare('DROP TABLE IF EXISTS [lemmata]').run();
    fulldb.prepare('CREATE TABLE [lemmata] (lemma TEXT PRIMARY KEY, recognized INTEGER, form TEXT, formsort TEXT)').run();
    fulldb.prepare('CREATE TABLE [dictionary] ('+
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
        const db = dbops.open(path);
        console.log(path);
        const dict = db.prepare('SELECT * FROM dictionary').all();
        for(const d of dict) 
            fulldb.prepare('INSERT INTO dictionary VALUES (@form, @formsort, @islemma, @fromlemma, @def, @type, @number, @gender, @nouncase, @person, @aspect, @mood, @rootnoun, @proclitic, @enclitic, @context, @citation, @filename)').run(d);
        const lemmata = db.prepare('SELECT * from lemmata').all();
        for(const l of lemmata)
            fulldb.prepare('INSERT OR IGNORE INTO lemmata VALUES (@lemma, @recognized, @form, @formsort)').run(l);
    }
};

go();
