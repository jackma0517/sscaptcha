// This might need editing depending where you're calling it from
require('dotenv').config({path:'../.env'})

var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database("./sscaptcha.sqlite")
//var db = new sqlite3.Database(process.env.SQLITE_DB)

db.serialize(function() {
    db.run('create table if not exists icons (id integer primary key,\
                                              label text not null,\
                                              filename text not null)')
});

db.serialize(function() {
    db.run('create table if not exists captchas (guid text primary key,\
                                                 solution text not null)')
});

