const Database = require('better-sqlite3');
const config = require('./config');

const db = new Database(config.DB_PATH);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

module.exports = db;