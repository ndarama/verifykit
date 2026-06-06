import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'verifykit.sqlite');

let SQL: any = null;
let db: any = null;
let initialized = false;

async function initDb() {
  if (initialized) return db;
  const initSqlJs = (await import('sql.js')).default;
  SQL = await initSqlJs({ locateFile: (file: string) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm') });

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (fs.existsSync(DB_FILE)) {
    const buffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(new Uint8Array(buffer));
  } else {
    db = new SQL.Database();
    // create schema
    db.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        contact TEXT
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repName TEXT NOT NULL,
        repPosition TEXT,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        companyId INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL,
        reason TEXT,
        fileName TEXT,
        extractedData TEXT,
        companyId INTEGER
      );
    `);
    persist();
  }

  initialized = true;
  return db;
}

function persist() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

export async function createCompany(name: string, email: string, contact?: string) {
  await initDb();
  const stmt = db.prepare('INSERT INTO companies (name, email, contact) VALUES (:name, :email, :contact)');
  stmt.bind({ ':name': name, ':email': email, ':contact': contact || null });
  stmt.step();
  stmt.free();
  const res = db.exec('SELECT last_insert_rowid() AS id');
  const id = res && res[0] && res[0].values && res[0].values[0] ? res[0].values[0][0] : null;
  persist();
  return id as number;
}

export async function getCompanyByEmail(email: string) {
  await initDb();
  const stmt = db.prepare('SELECT * FROM companies WHERE email = :email');
  stmt.bind({ ':email': email });
  let row: any = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

export async function createUser(repName: string, repPosition: string, email: string, passwordHash: string, companyId: number) {
  await initDb();
  const stmt = db.prepare('INSERT INTO users (repName, repPosition, email, passwordHash, companyId) VALUES (:repName, :repPosition, :email, :passwordHash, :companyId)');
  stmt.bind({ ':repName': repName, ':repPosition': repPosition || null, ':email': email, ':passwordHash': passwordHash, ':companyId': companyId });
  stmt.step();
  stmt.free();
  const res = db.exec('SELECT last_insert_rowid() AS id');
  const id = res && res[0] && res[0].values && res[0].values[0] ? res[0].values[0][0] : null;
  persist();
  return id as number;
}

export async function getUserByEmail(email: string) {
  await initDb();
  const stmt = db.prepare('SELECT u.id as id, u.repName as repName, u.repPosition as repPosition, u.email as email, u.passwordHash as passwordHash, u.companyId as companyId, c.name as companyName, c.email as companyEmail, c.contact as companyContact FROM users u JOIN companies c ON u.companyId = c.id WHERE u.email = :email');
  stmt.bind({ ':email': email });
  let row: any = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

export async function getUserById(id: number) {
  await initDb();
  const stmt = db.prepare('SELECT u.id as id, u.repName as repName, u.repPosition as repPosition, u.email as email, u.passwordHash as passwordHash, u.companyId as companyId, c.name as companyName, c.email as companyEmail FROM users u JOIN companies c ON u.companyId = c.id WHERE u.id = :id');
  stmt.bind({ ':id': id });
  let row: any = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

export async function createRecord(record: {
  id: string;
  timestamp: string;
  status: string;
  reason?: string;
  fileName?: string;
  extractedData?: any;
  companyId?: number;
}) {
  await initDb();
  const stmt = db.prepare('INSERT INTO records (id, timestamp, status, reason, fileName, extractedData, companyId) VALUES (:id, :timestamp, :status, :reason, :fileName, :extractedData, :companyId)');
  stmt.bind({ ':id': record.id, ':timestamp': record.timestamp, ':status': record.status, ':reason': record.reason || null, ':fileName': record.fileName || null, ':extractedData': record.extractedData ? JSON.stringify(record.extractedData) : null, ':companyId': record.companyId || null });
  stmt.step();
  stmt.free();
  persist();
}

export async function getRecordsByCompanyId(companyId: number) {
  await initDb();
  const stmt = db.prepare('SELECT * FROM records WHERE companyId = :companyId ORDER BY rowid DESC');
  stmt.bind({ ':companyId': companyId });
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows.map((r: any) => ({ ...r, extractedData: r.extractedData ? JSON.parse(r.extractedData) : null }));
}

export async function getRecordsByCompanyEmail(email: string) {
  const comp = await getCompanyByEmail(email);
  if (!comp) return [];
  return getRecordsByCompanyId(comp.id);
}

export default null;
