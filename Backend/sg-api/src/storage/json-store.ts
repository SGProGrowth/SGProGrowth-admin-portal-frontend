import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import type { ActivityItem, DataMap, EntityRecord, MessageItem } from '../types.js';
import type { DbUser, StorageAdapter } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'data', 'seed.json');
const dbPath = path.resolve(config.jsonDbPath);

interface SeedFile {
  entities: DataMap;
  activities: ActivityItem[];
  messages: MessageItem[];
  users: { email: string; name: string; role: string; password: string }[];
}

interface JsonDb {
  entities: DataMap;
  activities: ActivityItem[];
  messages: (MessageItem & { id: number })[];
  users: DbUser[];
  nextUserId: number;
}

function readSeed(): SeedFile {
  return JSON.parse(fs.readFileSync(seedPath, 'utf-8')) as SeedFile;
}

function buildInitial(): JsonDb {
  const seed = readSeed();
  return {
    entities: structuredClone(seed.entities),
    activities: structuredClone(seed.activities),
    messages: seed.messages.map((m, i) => ({ ...m, id: i + 1 })),
    users: seed.users.map((u, i) => ({
      id: i + 1,
      email: u.email.toLowerCase(),
      name: u.name,
      role: u.role,
      passwordHash: bcrypt.hashSync(u.password, 10),
    })),
    nextUserId: seed.users.length + 1,
  };
}

let db: JsonDb;

function persist() {
  persistDb(db);
}

function load(): JsonDb {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    const initial = buildInitial();
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }

  const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf-8')) as Record<string, unknown>;
  return normalizeDb(parsed);
}

function normalizeUsers(raw: unknown): DbUser[] {
  const rows = Array.isArray(raw) ? raw : [];
  return rows.map((row, i) => {
    const u = row as Record<string, unknown>;
    const email = String(u.email ?? '').toLowerCase();
    const name = String(u.name ?? '');
    const role = String(u.role ?? 'admin');
    const id = typeof u.id === 'number' ? u.id : i + 1;
    const existingHash = (u.passwordHash ?? u.password_hash) as string | undefined;
    const plain = u.password as string | undefined;
    const passwordHash =
      existingHash ??
      (plain ? bcrypt.hashSync(plain, 10) : bcrypt.hashSync('Growth$108@1610', 10));
    return { id, email, name, role, passwordHash };
  });
}

function normalizeDb(parsed: Record<string, unknown>): JsonDb {
  const seed = readSeed();
  const users = normalizeUsers(parsed.users);
  const rawMessages = Array.isArray(parsed.messages) ? parsed.messages : seed.messages;
  const messages = rawMessages.map((m, i) => {
    const msg = m as MessageItem & { id?: number };
    return { ...msg, id: msg.id ?? i + 1 };
  });

  const db: JsonDb = {
    entities: (parsed.entities as DataMap) ?? structuredClone(seed.entities),
    activities: (parsed.activities as ActivityItem[]) ?? structuredClone(seed.activities),
    messages,
    users,
    nextUserId:
      typeof parsed.nextUserId === 'number' ? parsed.nextUserId : Math.max(...users.map((u) => u.id), 0) + 1,
  };

  persistDb(db);
  return db;
}

function persistDb(data: JsonDb) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export const jsonStore: StorageAdapter = {
  mode: 'json',

  async init() {
    db = load();
  },

  async getAllEntities() {
    return structuredClone(db.entities);
  },

  async getEntity(entity: string) {
    return structuredClone(db.entities[entity] ?? []);
  },

  async createRecord(entity: string, body: Omit<EntityRecord, 'id'>) {
    const rows = db.entities[entity] ?? [];
    const nextId = rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const record = { ...body, id: nextId } as EntityRecord;
    db.entities[entity] = [record, ...rows];
    persist();
    return record;
  },

  async updateRecord(entity: string, id: number, patch: Partial<EntityRecord>) {
    const rows = db.entities[entity] ?? [];
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const updated = { ...rows[idx], ...patch, id } as EntityRecord;
    rows[idx] = updated;
    db.entities[entity] = rows;
    persist();
    return updated;
  },

  async deleteRecord(entity: string, id: number) {
    const rows = db.entities[entity] ?? [];
    const next = rows.filter((r) => r.id !== id);
    if (next.length === rows.length) return false;
    db.entities[entity] = next;
    persist();
    return true;
  },

  async resetEntities() {
    const seed = readSeed();
    db.entities = structuredClone(seed.entities);
    db.activities = structuredClone(seed.activities);
    db.messages = seed.messages.map((m, i) => ({ ...m, id: i + 1 }));
    persist();
    return structuredClone(db.entities);
  },

  async findUserByEmail(email: string) {
    return db.users.find((u) => u.email === email.toLowerCase()) ?? null;
  },

  async findUserById(id: number) {
    return db.users.find((u) => u.id === id) ?? null;
  },

  async listUsers() {
    return db.users.map(({ passwordHash: _, ...u }) => u);
  },

  async createUser(input) {
    if (db.users.some((u) => u.email === input.email.toLowerCase())) {
      throw new Error('Email already exists');
    }
    const user: DbUser = {
      id: db.nextUserId++,
      email: input.email.toLowerCase(),
      name: input.name,
      role: input.role,
      passwordHash: bcrypt.hashSync(input.password, 10),
    };
    db.users.push(user);
    persist();
    const { passwordHash: _, ...safe } = user;
    return safe;
  },

  async updateUser(id, patch) {
    const user = db.users.find((u) => u.id === id);
    if (!user) return null;
    if (patch.name) user.name = patch.name;
    if (patch.role) user.role = patch.role;
    if (patch.password) user.passwordHash = bcrypt.hashSync(patch.password, 10);
    persist();
    const { passwordHash: _, ...safe } = user;
    return safe;
  },

  async update2fa(id, patch) {
    const user = db.users.find((u) => u.id === id);
    if (!user) return false;
    if ('twoFactorSecret' in patch) user.twoFactorSecret = patch.twoFactorSecret ?? undefined;
    if ('twoFactorEnabled' in patch) user.twoFactorEnabled = patch.twoFactorEnabled;
    persist();
    return true;
  },

  async deleteUser(id) {
    const before = db.users.length;
    db.users = db.users.filter((u) => u.id !== id);
    if (db.users.length === before) return false;
    persist();
    return true;
  },

  async getActivities() {
    return structuredClone(db.activities);
  },

  async getMessages() {
    return db.messages.map(({ id, from, preview, time, unread }) => ({
      id,
      from,
      preview,
      time,
      unread,
    }));
  },

  async markMessageRead(id: number) {
    const msg = db.messages.find((m) => m.id === id);
    if (!msg) return false;
    msg.unread = false;
    persist();
    return true;
  },
};
