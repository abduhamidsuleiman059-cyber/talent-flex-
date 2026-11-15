// Inatenganisha data za kila akaunti kwenye kifaa kimoja.
// Akaunti ya kwanza (ns tupu) inatumia data za zamani bila kubadilishwa.
// Akaunti nyingine zinapewa "kiambishi" kwenye localStorage na IndexedDB.

const PREFIX = 'talentflex-'
const DB_NAME = 'talentflex-db'

const ls = window.localStorage
const proto = Storage.prototype
const rawGetItem = proto.getItem
const rawSetItem = proto.setItem
const rawRemoveItem = proto.removeItem

let rawOpen = null
let rawDeleteDb = null
try {
  rawOpen = IDBFactory.prototype.open
  rawDeleteDb = IDBFactory.prototype.deleteDatabase
} catch {
  // IndexedDB haipo
}

export function rawGet(key) {
  try {
    return rawGetItem.call(ls, key)
  } catch {
    return null
  }
}

export function rawSet(key, value) {
  try {
    rawSetItem.call(ls, key, value)
  } catch {
    // hakuna cha kufanya
  }
}

export function rawRemove(key) {
  try {
    rawRemoveItem.call(ls, key)
  } catch {
    // hakuna cha kufanya
  }
}

export function listRawKeys() {
  const keys = []
  try {
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i)
      if (k) keys.push(k)
    }
  } catch {
    // hakuna cha kufanya
  }
  return keys
}

export function scopedKey(ns, key) {
  return ns && String(key).startsWith(PREFIX) ? `tfns-${ns}:${key}` : key
}

export function dbNameFor(ns, name) {
  return ns && name === DB_NAME ? `${name}-${ns}` : name
}

// Futa database ya video ya akaunti fulani
export function deleteDbFor(ns) {
  return new Promise(resolve => {
    try {
      if (!rawDeleteDb) return resolve()
      const req = rawDeleteDb.call(window.indexedDB, dbNameFor(ns, DB_NAME))
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    } catch {
      resolve()
    }
  })
}

function readJson(key, fallback) {
  try {
    const raw = rawGetItem.call(ls, key)
    if (raw == null) return fallback
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : parsed
  } catch {
    return fallback
  }
}

function computeNamespace() {
  const accounts = readJson('tfauth-accounts', [])
  const currentId = readJson('tfauth-current', null)
  const account = Array.isArray(accounts)
    ? accounts.find(a => a.id === currentId)
    : null
  return account && account.ns ? account.ns : ''
}

export const NS = computeNamespace()

if (NS) {
  proto.getItem = function (key) {
    return rawGetItem.call(this, this === ls ? scopedKey(NS, String(key)) : key)
  }
  proto.setItem = function (key, value) {
    return rawSetItem.call(this, this === ls ? scopedKey(NS, String(key)) : key, value)
  }
  proto.removeItem = function (key) {
    return rawRemoveItem.call(this, this === ls ? scopedKey(NS, String(key)) : key)
  }

  if (rawOpen) {
    IDBFactory.prototype.open = function (name, ...rest) {
      return rawOpen.call(this, dbNameFor(NS, String(name)), ...rest)
    }
  }
  if (rawDeleteDb) {
    IDBFactory.prototype.deleteDatabase = function (name, ...rest) {
      return rawDeleteDb.call(this, dbNameFor(NS, String(name)), ...rest)
    }
  }
}