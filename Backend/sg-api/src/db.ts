import { jsonStore } from './storage/json-store.js';
import { pgStore } from './storage/pg-store.js';
import type { StorageAdapter } from './storage/types.js';

let store: StorageAdapter = jsonStore;
let dbMode: 'postgres' | 'json' = 'json';

export function getDbMode() {
  return dbMode;
}

export async function initDb() {
  if (process.env.DB_MODE === 'json') {
    store = jsonStore;
    dbMode = 'json';
    await store.init();
    console.log('Storage: JSON file (DB_MODE=json)');
    return;
  }

  try {
    await pgStore.init();
    store = pgStore;
    dbMode = 'postgres';
    console.log('Storage: PostgreSQL');
  } catch (err) {
    console.warn('PostgreSQL unavailable — falling back to JSON file storage.');
    console.warn(String(err));
    store = jsonStore;
    dbMode = 'json';
    await store.init();
  }
}

export const getAllEntities = () => store.getAllEntities();
export const getEntity = (entity: string) => store.getEntity(entity);
export const createRecord = (entity: string, body: Parameters<StorageAdapter['createRecord']>[1]) =>
  store.createRecord(entity, body);
export const updateRecord = (
  entity: string,
  id: number,
  patch: Parameters<StorageAdapter['updateRecord']>[2],
) => store.updateRecord(entity, id, patch);
export const deleteRecord = (entity: string, id: number) => store.deleteRecord(entity, id);
export const resetEntities = () => store.resetEntities();
export const findUserByEmail = (email: string) => store.findUserByEmail(email);
export const findUserById = (id: number) => store.findUserById(id);
export const listUsers = () => store.listUsers();
export const createUser = (input: Parameters<StorageAdapter['createUser']>[0]) => store.createUser(input);
export const updateUser = (id: number, patch: Parameters<StorageAdapter['updateUser']>[1]) =>
  store.updateUser(id, patch);
export const update2fa = (id: number, patch: Parameters<StorageAdapter['update2fa']>[1]) =>
  store.update2fa(id, patch);
export const deleteUser = (id: number) => store.deleteUser(id);
export const getActivities = () => store.getActivities();
export const appendActivity = (item: Parameters<StorageAdapter['appendActivity']>[0]) =>
  store.appendActivity(item);
export const getMessages = () => store.getMessages();
export const appendMessage = (item: Parameters<StorageAdapter['appendMessage']>[0]) =>
  store.appendMessage(item);
export const markMessageRead = (id: number) => store.markMessageRead(id);
