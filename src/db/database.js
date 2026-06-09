import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DB_PATH = path.join(process.cwd(), 'data', 'forum.db');

let db;

export function initDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(path.join(__dirname, 'shema.sql'), 'utf8');
  db.exec(schema);

  return db;
}

export function getDb() {
  if (!db) throw new Error('Base de données non initialisée');
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
