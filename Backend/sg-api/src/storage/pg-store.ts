import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma, withRetry } from '../prisma.js';
import type { ActivityItem, DataMap, EntityRecord, MessageItem } from '../types.js';
import type { DbUser, StorageAdapter } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', '..', 'data', 'seed.json');

interface SeedFile {
  entities: DataMap;
  activities: ActivityItem[];
  messages: MessageItem[];
  users: { email: string; name: string; role: string; password: string }[];
}

function readSeed(): SeedFile {
  return JSON.parse(fs.readFileSync(seedPath, 'utf-8')) as SeedFile;
}

function asRecord(data: unknown): EntityRecord {
  return data as EntityRecord;
}

async function seedDatabase() {
  const seed = readSeed();

  await prisma.$transaction(async (tx) => {
    await tx.entityRecord.deleteMany();
    await tx.activity.deleteMany();
    await tx.message.deleteMany();

    for (const [entity, records] of Object.entries(seed.entities)) {
      for (const record of records) {
        await tx.entityRecord.create({
          data: { entity, recordId: record.id, data: record },
        });
      }
    }

    for (const a of seed.activities) {
      await tx.activity.create({ data: a });
    }

    for (const m of seed.messages) {
      await tx.message.create({
        data: {
          sender: m.from,
          preview: m.preview,
          time: m.time,
          unread: m.unread,
        },
      });
    }

    for (const u of seed.users) {
      await tx.user.upsert({
        where: { email: u.email.toLowerCase() },
        create: {
          email: u.email.toLowerCase(),
          name: u.name,
          role: u.role,
          passwordHash: bcrypt.hashSync(u.password, 10),
        },
        update: {
          name: u.name,
          role: u.role,
          passwordHash: bcrypt.hashSync(u.password, 10),
        },
      });
    }
  });
}

export const pgStore: StorageAdapter = {
  mode: 'postgres',

  async init() {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    if (userCount === 0) await seedDatabase();
  },

  async getAllEntities() {
    const rows = await withRetry(() =>
      prisma.entityRecord.findMany({ orderBy: [{ entity: 'asc' }, { recordId: 'desc' }] })
    );
    const map: DataMap = {};
    for (const row of rows) {
      (map[row.entity] ||= []).push(asRecord(row.data));
    }
    return map;
  },

  async getEntity(entity: string) {
    const rows = await withRetry(() =>
      prisma.entityRecord.findMany({ where: { entity }, orderBy: { recordId: 'desc' } })
    );
    return rows.map((r) => asRecord(r.data));
  },

  async createRecord(entity: string, body: Omit<EntityRecord, 'id'>) {
    const max = await prisma.entityRecord.aggregate({
      where: { entity },
      _max: { recordId: true },
    });
    const nextId = (max._max.recordId ?? 0) + 1;
    const record = { ...body, id: nextId } as EntityRecord;
    await prisma.entityRecord.create({
      data: { entity, recordId: nextId, data: record },
    });
    return record;
  },

  async updateRecord(entity: string, id: number, patch: Partial<EntityRecord>) {
    const row = await prisma.entityRecord.findUnique({
      where: { entity_recordId: { entity, recordId: id } },
    });
    if (!row) return null;
    const updated = { ...asRecord(row.data), ...patch, id } as EntityRecord;
    await prisma.entityRecord.update({
      where: { entity_recordId: { entity, recordId: id } },
      data: { data: updated },
    });
    return updated;
  },

  async deleteRecord(entity: string, id: number) {
    try {
      await prisma.entityRecord.delete({
        where: { entity_recordId: { entity, recordId: id } },
      });
      return true;
    } catch {
      return false;
    }
  },

  async resetEntities() {
    const seed = readSeed();
    await prisma.$transaction(async (tx) => {
      await tx.entityRecord.deleteMany();
      await tx.activity.deleteMany();
      await tx.message.deleteMany();
      for (const [entity, records] of Object.entries(seed.entities)) {
        for (const record of records) {
          await tx.entityRecord.create({
            data: { entity, recordId: record.id, data: record },
          });
        }
      }
      for (const a of seed.activities) await tx.activity.create({ data: a });
      for (const m of seed.messages) {
        await tx.message.create({
          data: { sender: m.from, preview: m.preview, time: m.time, unread: m.unread },
        });
      }
    });
    return pgStore.getAllEntities();
  },

  async findUserById(id: number) {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return null;
    return {
      id: u.id, email: u.email, passwordHash: u.passwordHash,
      name: u.name, role: u.role,
      twoFactorSecret: u.twoFactorSecret ?? null,
      twoFactorEnabled: u.twoFactorEnabled ?? false,
    };
  },

  async findUserByEmail(email: string) {
    const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      passwordHash: u.passwordHash,
      name: u.name,
      role: u.role,
      twoFactorSecret: u.twoFactorSecret ?? null,
      twoFactorEnabled: u.twoFactorEnabled ?? false,
    };
  },

  async listUsers() {
    const rows = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    return rows.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role }));
  },

  async createUser(input) {
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) throw new Error('Email already exists');
    const u = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        name: input.name,
        role: input.role,
        passwordHash: bcrypt.hashSync(input.password, 10),
      },
    });
    return { id: u.id, email: u.email, name: u.name, role: u.role };
  },

  async updateUser(id, patch) {
    const data: { name?: string; role?: string; passwordHash?: string } = {};
    if (patch.name) data.name = patch.name;
    if (patch.role) data.role = patch.role;
    if (patch.password) data.passwordHash = bcrypt.hashSync(patch.password, 10);
    try {
      const u = await prisma.user.update({ where: { id }, data });
      return { id: u.id, email: u.email, name: u.name, role: u.role };
    } catch {
      return null;
    }
  },

  async update2fa(id, patch) {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          ...(('twoFactorSecret' in patch) ? { twoFactorSecret: patch.twoFactorSecret } : {}),
          ...(('twoFactorEnabled' in patch) ? { twoFactorEnabled: patch.twoFactorEnabled } : {}),
        },
      });
      return true;
    } catch {
      return false;
    }
  },

  async deleteUser(id) {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  async getActivities() {
    return prisma.activity.findMany({ orderBy: { id: 'asc' } });
  },

  async getMessages() {
    const rows = await prisma.message.findMany({ orderBy: { id: 'asc' } });
    return rows.map((r) => ({
      id: r.id,
      from: r.sender,
      preview: r.preview,
      time: r.time,
      unread: r.unread,
    }));
  },

  async markMessageRead(id: number) {
    try {
      await prisma.message.update({ where: { id }, data: { unread: false } });
      return true;
    } catch {
      return false;
    }
  },
};
