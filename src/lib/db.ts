import { openDB } from 'idb'; // Tu peux ajouter 'idb' à ton package.json

const DB_NAME = 'EcoBudgetDB';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore('transactions', { keyPath: 'id' });
      db.createObjectStore('fixedCharges', { keyPath: 'id' });
      db.createObjectStore('settings', { keyPath: 'key' });
    },
  });
}