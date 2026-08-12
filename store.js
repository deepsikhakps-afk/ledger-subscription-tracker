// ---- store.js: localStorage persistence for subscriptions ----

const Store = (() => {
  const KEY = "ledger_subscriptions";

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveAll(subs) {
    localStorage.setItem(KEY, JSON.stringify(subs));
  }

  function add(sub) {
    const subs = getAll();
    sub.id = crypto.randomUUID();
    subs.push(sub);
    saveAll(subs);
    return sub;
  }

  function update(id, updates) {
    const subs = getAll();
    const idx = subs.findIndex(s => s.id === id);
    if (idx === -1) return null;
    subs[idx] = { ...subs[idx], ...updates };
    saveAll(subs);
    return subs[idx];
  }

  function remove(id) {
    const subs = getAll().filter(s => s.id !== id);
    saveAll(subs);
  }

  return { getAll, saveAll, add, update, remove };
})();
