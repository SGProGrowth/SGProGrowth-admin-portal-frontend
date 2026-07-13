import type { ActivityItem, DataMap, EntityRecord, MessageItem } from '../types.js';

export interface DbUser {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  twoFactorSecret?: string | null;
  twoFactorEnabled?: boolean;
}

export interface StorageAdapter {
  mode: 'postgres' | 'json';
  init(): Promise<void>;
  getAllEntities(): Promise<DataMap>;
  getEntity(entity: string): Promise<EntityRecord[]>;
  createRecord(entity: string, body: Omit<EntityRecord, 'id'>): Promise<EntityRecord>;
  updateRecord(entity: string, id: number, patch: Partial<EntityRecord>): Promise<EntityRecord | null>;
  deleteRecord(entity: string, id: number): Promise<boolean>;
  resetEntities(): Promise<DataMap>;
  findUserByEmail(email: string): Promise<DbUser | null>;
  findUserById(id: number): Promise<DbUser | null>;
  listUsers(): Promise<Omit<DbUser, 'passwordHash'>[]>;
  createUser(input: { email: string; name: string; role: string; password: string }): Promise<Omit<DbUser, 'passwordHash'>>;
  updateUser(id: number, patch: Partial<{ name: string; role: string; password: string }>): Promise<Omit<DbUser, 'passwordHash'> | null>;
  update2fa(id: number, patch: { twoFactorSecret?: string | null; twoFactorEnabled?: boolean }): Promise<boolean>;
  deleteUser(id: number): Promise<boolean>;
  getActivities(): Promise<ActivityItem[]>;
  appendActivity(item: ActivityItem): Promise<void>;
  getMessages(): Promise<MessageItem[]>;
  appendMessage(item: Omit<MessageItem, 'id'>): Promise<MessageItem>;
  markMessageRead(id: number): Promise<boolean>;
}
