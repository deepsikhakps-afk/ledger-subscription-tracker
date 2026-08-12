// ---- app.js: UI wiring for Ledger subscription tracker ----

const addBtn = document.getElementById("addBtn");
const modalOverlay = document.getElementById("modalOverlay");
const subForm = document.getElementById("subForm");
const modalTitle = document.getElementById("modalTitle");
const cancelBtn = document.getElementById("cancelBtn");
const deleteBtn = document.getElementById("deleteBtn");
const subIdField = document.getElementById("subId");
const subList = document.getElementById("subList");
const emptyState = document.getElementById("emptyState");
const sortSelect = document.getElementById("sortSelect");
const toast = document.getElementById("toast");
const categoryChart = document.getElementById("categoryChart");
const chartLegend = document.getElementById("chartLegend");

const monthlyTotalEl = document.getElementById("monthlyTotal");
const yearlyTotalEl = document.getElementById("yearlyTotal");
const activeCountEl = document.getElementById("activeCount");
const nextRenewalEl = document.getElementById("nextRenewal");

// ---------- Modal open/close ----------
function openModal(sub = null) {
  subForm.reset();
  if (sub) {
    modalTitle.textContent = "Edit subscription";
    subIdField.value = sub.id;
    document.getElementById("subName").value = sub.name;
    document.getElementById("subPrice").value = sub.price;
    document.getElementById("subCycle").value = sub.cycle;
    document.getElementById("subCategory").value = sub.category;
    document.getElementById("subDate").value = sub.nextRenewal;
    document.getElementById("subReminder").checked = !!sub.reminder;
    deleteBtn.classList.remove("hidden");
  } else {
    modalTitle.textContent = "Add subscription";
    subIdField.value = "";
    deleteBtn.classList.add("hidden");
    document.getElementById("subDate").value = new Date().toISOString().split("T")[0];
  }
  modalOverlay.classList.add("show");
}

function closeModal() {
  modalOverlay.classList.remove("show");
}

addBtn.addEventListener("click", () => openModal());
cancelBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeModal(); });

subForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById("subName").value.trim(),
    price: parseFloat(document.getElementById("subPrice").value),
    cycle: document.getElementById("subCycle").value,
    category: document.getElementById("subCategory").value,
    nextRenewal: document.getElementById("subDate").value,
    reminder: document.getElementById("subReminder").checked
  };

  const id = subIdField.value;
  if (id) {
    Store.update(id, data);
    showToast("Subscription updated");
  } else {
    Store.add(data);
    showToast("Subscription added");
    if (data.reminder) requestNotificationPermission();
  }

  closeModal();
  render();
});

deleteBtn.addEventListener("click", () => {
  const id = subIdField.value;
  if (id && confirm("Delete this subscription?")) {
    Store.remove(id);
    showToast("Subscription deleted");
    closeModal();
    render();
  }
});

// ---------- Sorting ----------
sortSelect.addEventListener("change", render);

function sortSubs(subs) {
  const mode = sortSelect.value;
  const sorted = [...subs];
  if (mode === "renewal") sorted.sort((a, b) => new Date(a.nextRenewal) - new Date(b.nextRenewal));
  else if (mode === "price-desc") sorted.sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a));
  else if (mode === "price-asc") sorted.sort((a, b) => monthlyEquivalent(a) - monthlyEquivalent(b));
  else if (mode === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}

// ---------- Calculations ----------
function monthlyEquivalent(sub) {
  if (sub.cycle === "monthly") return sub.price;
  if (sub.cycle === "yearly") return sub.price / 12;
  if (sub.cycle === "weekly") return sub.price * 4.345;
  return sub.price;
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

// ---------- Rendering ----------
function render() {
  const subs = Store.getAll();

  // Summary stats
  const monthlyTotal = subs.reduce((sum, s) => sum + monthlyEquivalent(s), 0);
  monthlyTotalEl.textContent = `$${monthlyTotal.toFixed(2)}`;
  yearlyTotalEl.textContent = `$${(monthlyTotal * 12).toFixed(2)}`;
  activeCountEl.textContent = subs.length;

  if (subs.length) {
    const next = [...subs].sort((a, b) => new Date(a.nextRenewal) - new Date(b.nextRenewal))[0];
    const days = daysUntil(next.nextRenewal);
    nextRenewalEl.textContent = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d — ${next.name}`;
  } else {
    nextRenewalEl.textContent = "—";
  }

  // Chart
  const byCategory = {};
  subs.forEach(s => {
    byCategory[s.category] = (byCategory[s.category] || 0) + monthlyEquivalent(s);
  });
  const entries = drawCategoryChart(categoryChart, byCategory);
  chartLegend.innerHTML = "";
  entries.forEach(([cat]) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `<span class="legend-swatch" style="background:${CATEGORY_COLORS[cat] || '#8a8b9a'}"></span>${cat}`;
    chartLegend.appendChild(item);
  });

  // List
  subList.innerHTML = "";
  const sorted = sortSubs(subs);
  emptyState.classList.toggle("show", subs.length === 0);

  sorted.forEach(sub => {
    const li = document.createElement("li");
    li.className = "sub-item";
    const days = daysUntil(sub.nextRenewal);
    const soonBadge = days <= 3 ? `<span class="badge-soon">${days <= 0 ? "due" : days + "d left"}</span>` : "";

    li.innerHTML = `
      <div class="sub-color" style="background:${CATEGORY_COLORS[sub.category] || '#8a8b9a'}"></div>
      <div class="sub-info">
        <div class="sub-name">${escapeHtml(sub.name)} ${soonBadge}</div>
        <div class="sub-meta">${sub.category} · renews ${formatDate(sub.nextRenewal)}</div>
      </div>
      <div>
        <div class="sub-price">$${sub.price.toFixed(2)}</div>
        <div class="sub-cycle">${sub.cycle}</div>
      </div>
    `;
    li.addEventListener("click", () => openModal(sub));
    subList.appendChild(li);
  });

  checkDueReminders(subs);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------- Browser notifications ----------
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function checkDueReminders(subs) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const notified = JSON.parse(sessionStorage.getItem("ledger_notified") || "[]");

  subs.forEach(sub => {
    if (!sub.reminder) return;
    const days = daysUntil(sub.nextRenewal);
    if (days === 2 && !notified.includes(sub.id)) {
      new Notification("Upcoming renewal", {
        body: `${sub.name} renews in 2 days ($${sub.price.toFixed(2)})`
      });
      notified.push(sub.id);
      sessionStorage.setItem("ledger_notified", JSON.stringify(notified));
    }
  });
}

render();
