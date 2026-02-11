import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize SQLite database
const db = new Database('todos.db');

// Enable foreign keys and WAL mode for better concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Read and execute schema
const schemaPath = join(__dirname, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');
db.exec(schema);

console.log('✅ Database initialized');

export default db;
