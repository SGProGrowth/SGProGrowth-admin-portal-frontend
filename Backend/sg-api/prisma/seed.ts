import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, '..', 'data', 'seed.json');

interface SeedFile {
  entities: Record<string, Record<string, string | number>[]>;
  activities: { user: string; action: string; time: string }[];
  messages: { from: string; preview: string; time: string; unread: boolean }[];
  users: { email: string; name: string; role: string }[];
}

async function main() {
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8')) as SeedFile;

  await prisma.entityRecord.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.message.deleteMany();

  for (const [entity, records] of Object.entries(seed.entities)) {
    for (const record of records) {
      await prisma.entityRecord.create({
        data: { entity, recordId: Number(record.id), data: record },
      });
    }
  }

  for (const a of seed.activities) {
    await prisma.activity.create({ data: a });
  }

  for (const m of seed.messages) {
    await prisma.message.create({
      data: {
        sender: m.from,
        preview: m.preview,
        time: m.time,
        unread: m.unread,
      },
    });
  }

  for (const u of seed.users) {
    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!seedPassword) {
      throw new Error(
        `ADMIN_SEED_PASSWORD env var is not set. Set it before seeding (e.g. in .env) — required to seed user "${u.email}".`,
      );
    }
    await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      create: {
        email: u.email.toLowerCase(),
        name: u.name,
        role: u.role,
        passwordHash: bcrypt.hashSync(seedPassword, 10),
      },
      update: {
        name: u.name,
        role: u.role,
        passwordHash: bcrypt.hashSync(seedPassword, 10),
      },
    });
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
