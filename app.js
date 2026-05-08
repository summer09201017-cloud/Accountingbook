const STORAGE_KEY = "ledger_entries_v1";
const CATEGORY_STORAGE_KEY = "ledger_custom_categories_v1";
const PREFS_STORAGE_KEY = "ledger_prefs_v1";
const UNDO_TIMEOUT_MS = 5000;
let deferredInstallPrompt = null;

const DEFAULT_CATEGORY_MAP = {
  expense: ["飲食", "交通", "居家", "娛樂", "醫療", "購物", "其他"],
  income: ["薪資", "獎金", "投資", "退款", "兼職", "其他"]
};

const els = {
  currentMonthText: document.querySelector("#currentMonthText"),
  installAppBtn: document.querySelector("#installAppBtn"),
  installTip: document.querySelector("#installTip"),
  themeToggleBtn: document.querySelector("#themeToggleBtn"),
  entryForm: document.querySelector("#entryForm"),
  typeInput: document.querySelector("#typeInput"),
  amountInput: document.querySelector("#amountInput"),
  amountPreview: document.querySelector("#amountPreview"),
  categoryInput: document.querySelector("#categoryInput"),
  customCategoryInput: document.querySelector("#customCategoryInput"),
  addCategoryBtn: document.querySelector("#addCategoryBtn"),
  customCategoryList: document.querySelector("#customCategoryList"),
  dateInput: document.querySelector("#dateInput"),
  noteInput: document.querySelector("#noteInput"),
  formHint: document.querySelector("#formHint"),
  submitBtn: document.querySelector("#submitBtn"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  monthFilter: document.querySelector("#monthFilter"),
  typeFilter: document.querySelector("#typeFilter"),
  keywordFilter: document.querySelector("#keywordFilter"),
  transactionList: document.querySelector("#transactionList"),
  transactionItemTemplate: document.querySelector("#transactionItemTemplate"),
  categoryChart: document.querySelector("#categoryChart"),
  exportBtn: document.querySelector("#exportBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  importJsonBtn: document.querySelector("#importJsonBtn"),
  importJsonInput: document.querySelector("#importJsonInput"),
  clearMonthBtn: document.querySelector("#clearMonthBtn"),
  toastStack: document.querySelector("#toastStack")
};

const state = {
  entries: loadEntries(),
  customCategories: loadCustomCategories(),
  prefs: loadPrefs(),
  month: getCurrentMonth(),
  type: "all",
  keyword: "",
  editingId: null
};

function init() {
  applyTheme();

  const now = new Date();
  els.currentMonthText.textContent = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;
  els.dateInput.value = toDateInputValue(now);
  els.monthFilter.value = state.month;
  els.typeInput.value = state.prefs.lastType;
  syncCategoryOptions(state.prefs.lastType);
  applyLastCategoryPref();
  renderCustomCategoryList(state.prefs.lastType);
  setupInstallPrompt();

  els.entryForm.addEventListener("submit", onCreateEntry);
  els.typeInput.addEventListener("change", (event) => {
    const type = event.target.value;
    syncCategoryOptions(type);
    applyLastCategoryPref();
    renderCustomCategoryList(type);
  });

  els.amountInput.addEventListener("input", updateAmountPreview);
  els.cancelEditBtn.addEventListener("click", cancelEdit);

  els.addCategoryBtn.addEventListener("click", onAddCustomCategory);
  els.customCategoryInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onAddCustomCategory();
  });
  els.customCategoryList.addEventListener("click", onCustomCategoryListAction);

  els.monthFilter.addEventListener("input", (event) => {
    state.month = event.target.value;
    render();
  });

  els.typeFilter.addEventListener("change", (event) => {
    state.type = event.target.value;
    render();
  });

  els.keywordFilter.addEventListener("input", (event) => {
    state.keyword = event.target.value.trim().toLowerCase();
    render();
  });

  els.transactionList.addEventListener("click", onListAction);
  els.exportBtn.addEventListener("click", exportCsv);
  els.exportJsonBtn.addEventListener("click", exportJson);
  els.importJsonBtn.addEventListener("click", () => {
    els.importJsonInput.value = "";
    els.importJsonInput.click();
  });
  els.importJsonInput.addEventListener("change", onImportJsonChange);
  els.clearMonthBtn.addEventListener("click", clearMonthEntries);
  els.themeToggleBtn.addEventListener("click", toggleTheme);

  const darkMq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSchemeChange = () => {
    if (state.prefs.theme === null) applyTheme();
  };
  if (typeof darkMq.addEventListener === "function") {
    darkMq.addEventListener("change", onSchemeChange);
  } else if (typeof darkMq.addListener === "function") {
    darkMq.addListener(onSchemeChange);
  }

  registerServiceWorker();
  render();
}

function onCreateEntry(event) {
  event.preventDefault();

  const type = els.typeInput.value;
  const amount = evaluateAmount(els.amountInput.value);
  const category = els.categoryInput.value;
  const date = els.dateInput.value;
  const note = els.noteInput.value.trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    updateHint("請輸入大於 0 的金額。", true);
    return;
  }

  if (!category) {
    updateHint("請先選擇分類。", true);
    return;
  }

  if (!date) {
    updateHint("請選擇日期。", true);
    return;
  }

  if (state.editingId) {
    const idx = state.entries.findIndex((entry) => entry.id === state.editingId);
    if (idx !== -1) {
      state.entries[idx] = {
        ...state.entries[idx],
        type,
        amount,
        category,
        date,
        note
      };
      persistEntries();
      saveLastSelection(type, category);
      exitEditMode();
      els.amountInput.value = "";
      els.noteInput.value = "";
      updateAmountPreview();
      updateHint("", false);
      render();
      showToast("已更新一筆記帳。");
      return;
    }
    exitEditMode();
  }

  const entry = {
    id: (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`,
    type,
    amount,
    category,
    date,
    note,
    createdAt: Date.now()
  };

  state.entries.unshift(entry);
  persistEntries();
  saveLastSelection(type, category);

  els.amountInput.value = "";
  els.noteInput.value = "";
  updateAmountPreview();
  updateHint("", false);
  render();
  showToast("已加入一筆記帳。");
}

function onAddCustomCategory() {
  const type = els.typeInput.value;
  const category = normalizeCategoryName(els.customCategoryInput.value);

  if (!category) {
    updateHint("請先輸入自訂分類名稱。", true);
    return;
  }

  if (category.length > 12) {
    updateHint("分類名稱最多 12 個字元。", true);
    return;
  }

  const allCategories = getAllCategories(type);
  if (allCategories.includes(category)) {
    updateHint("這個分類已存在。", true);
    return;
  }

  state.customCategories[type].push(category);
  state.customCategories[type] = uniqueCategoryList(state.customCategories[type]);
  persistCustomCategories();

  els.customCategoryInput.value = "";
  syncCategoryOptions(type, category);
  renderCustomCategoryList(type);
  updateHint(`已新增「${category}」分類。`, false);
}

function onCustomCategoryListAction(event) {
  const target = event.target.closest("button[data-category]");
  if (!target) return;

  const type = els.typeInput.value;
  const category = target.dataset.category;
  if (!category) return;

  state.customCategories[type] = state.customCategories[type].filter((item) => item !== category);
  persistCustomCategories();
  syncCategoryOptions(type);
  renderCustomCategoryList(type);
  updateHint(`已刪除「${category}」自訂分類。`, false);
}

function onListAction(event) {
  const editBtn = event.target.closest("button.edit-btn[data-id]");
  if (editBtn) {
    startEditEntry(editBtn.dataset.id);
    return;
  }

  const deleteBtn = event.target.closest("button.delete-btn[data-id]");
  if (deleteBtn) {
    deleteEntryWithUndo(deleteBtn.dataset.id);
  }
}

function render() {
  const filtered = getFilteredEntries();
  renderList(filtered);
  renderTotals(filtered);
  renderCategoryChart(filtered);
}

function getFilteredEntries() {
  return state.entries
    .filter((entry) => {
      if (state.month && !entry.date.startsWith(state.month)) return false;
      if (state.type !== "all" && entry.type !== state.type) return false;

      if (state.keyword) {
        const haystack = `${entry.category} ${entry.note}`.toLowerCase();
        if (!haystack.includes(state.keyword)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    });
}

function renderList(entries) {
  els.transactionList.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "目前沒有符合條件的紀錄。";
    els.transactionList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const entry of entries) {
    const node = els.transactionItemTemplate.content.firstElementChild.cloneNode(true);
    const pill = node.querySelector(".pill");
    const amount = node.querySelector(".item-amount");
    const meta = node.querySelector(".item-meta");
    const editBtn = node.querySelector(".edit-btn");
    const deleteBtn = node.querySelector(".delete-btn");

    pill.textContent = entry.type === "income" ? "收入" : "支出";
    pill.classList.add(entry.type);

    if (entry.id === state.editingId) {
      node.classList.add("editing");
    }

    const signed = entry.type === "income" ? "+" : "-";
    amount.textContent = `${signed}${formatCurrency(entry.amount)}`;

    const notePart = entry.note ? `・${entry.note}` : "";
    meta.textContent = `${formatDate(entry.date)}・${entry.category}${notePart}`;

    editBtn.dataset.id = entry.id;
    deleteBtn.dataset.id = entry.id;
    fragment.appendChild(node);
  }

  els.transactionList.appendChild(fragment);
}

function renderTotals(entries) {
  let income = 0;
  let expense = 0;

  for (const entry of entries) {
    if (entry.type === "income") {
      income += entry.amount;
    } else {
      expense += entry.amount;
    }
  }

  const balance = income - expense;

  els.incomeTotal.textContent = formatCurrency(income);
  els.expenseTotal.textContent = formatCurrency(expense);
  els.balanceTotal.textContent = formatCurrency(balance);
  els.balanceTotal.style.color = balance < 0 ? "var(--expense-500)" : "var(--income-500)";
}

function renderCategoryChart(entries) {
  const expenseEntries = entries.filter((entry) => entry.type === "expense");
  els.categoryChart.innerHTML = "";

  if (!expenseEntries.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "尚無支出資料可統計。";
    els.categoryChart.appendChild(empty);
    return;
  }

  const totalsByCategory = new Map();
  let grandTotal = 0;

  for (const entry of expenseEntries) {
    const curr = totalsByCategory.get(entry.category) || 0;
    totalsByCategory.set(entry.category, curr + entry.amount);
    grandTotal += entry.amount;
  }

  const ordered = [...totalsByCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  for (const [category, total] of ordered) {
    const ratio = grandTotal > 0 ? (total / grandTotal) * 100 : 0;

    const row = document.createElement("div");
    row.className = "category-row";

    const head = document.createElement("div");
    head.className = "category-row-head";

    const label = document.createElement("span");
    label.textContent = category;

    const value = document.createElement("span");
    value.textContent = `${formatCurrency(total)} (${ratio.toFixed(1)}%)`;

    head.appendChild(label);
    head.appendChild(value);

    const track = document.createElement("div");
    track.className = "category-track";

    const bar = document.createElement("div");
    bar.className = "category-bar";
    bar.style.width = `${ratio.toFixed(2)}%`;

    track.appendChild(bar);
    row.appendChild(head);
    row.appendChild(track);
    els.categoryChart.appendChild(row);
  }
}

function syncCategoryOptions(type, preferredCategory = "") {
  const categories = getAllCategories(type);
  const prevValue = preferredCategory || els.categoryInput.value;

  els.categoryInput.innerHTML = "";
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryInput.appendChild(option);
  }

  if (prevValue && categories.includes(prevValue)) {
    els.categoryInput.value = prevValue;
  }
}

function renderCustomCategoryList(type) {
  const categories = state.customCategories[type] || [];
  els.customCategoryList.innerHTML = "";

  if (!categories.length) {
    const empty = document.createElement("li");
    empty.className = "chip-empty";
    empty.textContent = "目前沒有自訂分類";
    els.customCategoryList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const category of categories) {
    const li = document.createElement("li");
    li.className = "chip-item";

    const text = document.createElement("span");
    text.textContent = category;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "chip-delete";
    removeBtn.dataset.category = category;
    removeBtn.setAttribute("aria-label", `刪除 ${category}`);
    removeBtn.textContent = "×";

    li.appendChild(text);
    li.appendChild(removeBtn);
    fragment.appendChild(li);
  }

  els.customCategoryList.appendChild(fragment);
}

function getAllCategories(type) {
  return uniqueCategoryList([
    ...DEFAULT_CATEGORY_MAP[type],
    ...(state.customCategories[type] || [])
  ]);
}

function uniqueCategoryList(list) {
  const seen = new Set();
  const output = [];

  for (const raw of list) {
    const normalized = normalizeCategoryName(raw);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

function normalizeCategoryName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function exportCsv() {
  const entries = getFilteredEntries();
  if (!entries.length) {
    updateHint("目前沒有可匯出的資料。", true);
    return;
  }

  const rows = ["日期,類型,分類,金額,備註"];
  for (const entry of entries) {
    rows.push([
      entry.date,
      entry.type === "income" ? "收入" : "支出",
      quoteCsv(entry.category),
      entry.amount,
      quoteCsv(entry.note)
    ].join(","));
  }

  const blob = new Blob([`\uFEFF${rows.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `ledger_${state.month || "all"}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);

  showToast("CSV 匯出完成。");
}

function clearMonthEntries() {
  if (!state.month) {
    updateHint("請先在篩選器指定月份。", true);
    return;
  }

  const yes = confirm(`確定清空 ${state.month} 的資料嗎？此動作無法復原。`);
  if (!yes) return;

  state.entries = state.entries.filter((entry) => !entry.date.startsWith(state.month));
  persistEntries();
  if (state.editingId && !state.entries.some((entry) => entry.id === state.editingId)) {
    exitEditMode(true);
  }
  render();
  showToast(`已清空 ${state.month} 的資料。`);
}

function quoteCsv(text) {
  const safe = String(text || "").replace(/"/g, '""');
  return `"${safe}"`;
}

function updateHint(message, isError) {
  els.formHint.textContent = message;
  els.formHint.style.color = isError ? "var(--expense-500)" : "var(--ink-500)";
}

function formatCurrency(num) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0
  }).format(num);
}

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${y}/${m}/${d}`;
}

function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry) => {
      return entry && typeof entry === "object" && typeof entry.id === "string";
    });
  } catch {
    return [];
  }
}

function loadCustomCategories() {
  const initial = { expense: [], income: [] };

  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) return initial;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return initial;

    return {
      expense: sanitizeCustomCategoryList(parsed.expense, DEFAULT_CATEGORY_MAP.expense),
      income: sanitizeCustomCategoryList(parsed.income, DEFAULT_CATEGORY_MAP.income)
    };
  } catch {
    return initial;
  }
}

function sanitizeCustomCategoryList(list, defaultList) {
  if (!Array.isArray(list)) return [];

  const defaults = new Set(defaultList);
  return uniqueCategoryList(list).filter((category) => !defaults.has(category));
}

function persistEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function persistCustomCategories() {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(state.customCategories));
}

function setupInstallPrompt() {
  if (els.installAppBtn) {
    els.installAppBtn.addEventListener("click", onInstallApp);
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    renderInstallCta();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    renderInstallCta("已安裝到主畫面，可直接當 App 開啟。");
  });

  const displayMode = window.matchMedia("(display-mode: standalone)");
  if (typeof displayMode.addEventListener === "function") {
    displayMode.addEventListener("change", () => renderInstallCta());
  } else if (typeof displayMode.addListener === "function") {
    displayMode.addListener(() => renderInstallCta());
  }

  renderInstallCta();
}

async function onInstallApp() {
  if (isStandaloneMode()) {
    renderInstallCta("已安裝到主畫面，可直接當 App 開啟。");
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;

    if (outcome === "accepted") {
      renderInstallCta("安裝要求已送出，完成後會出現在主畫面。");
    } else {
      renderInstallCta("你可以稍後再安裝，按鈕會保留在這裡。");
    }
    return;
  }

  renderInstallCta(getInstallHelpMessage());
}

function renderInstallCta(message = "") {
  const isStandalone = isStandaloneMode();
  const shouldShowButton = shouldShowInstallButton();

  if (els.installAppBtn) {
    els.installAppBtn.hidden = !shouldShowButton || isStandalone;
    els.installAppBtn.textContent = getInstallButtonLabel();
  }

  if (els.installTip) {
    const text = isStandalone ? "已安裝到主畫面，可直接當 App 開啟。" : message;
    els.installTip.hidden = !text;
    els.installTip.textContent = text;
  }
}

function shouldShowInstallButton() {
  if (isStandaloneMode()) return false;
  if (deferredInstallPrompt) return true;
  return isMobileDevice();
}

function getInstallButtonLabel() {
  if (isIosDevice()) return "加入主畫面";
  return "安裝 App";
}

function getInstallHelpMessage() {
  if (location.protocol === "file:") {
    return "請改用 http://localhost 或 HTTPS 開啟，瀏覽器才會提供安裝功能。";
  }

  if (isIosDevice()) {
    if (isSafariBrowser()) {
      return "在 Safari 點分享按鈕，再選「加入主畫面」，就能安裝成 App。";
    }
    return "iPhone 或 iPad 請改用 Safari 開啟，才能加入主畫面。";
  }

  return "目前這個瀏覽器還沒提供安裝提示，可改用 Chrome 或 Samsung Internet 試試。";
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isMobileDevice() {
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent) || window.innerWidth < 760;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isSafariBrowser() {
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch {
    // Ignore registration errors so app remains usable.
  }
}

function evaluateAmount(input) {
  const expr = String(input || "").replace(/\s+/g, "");
  if (!expr) return NaN;
  if (!/^[\d+\-*/().]+$/.test(expr)) return NaN;

  try {
    const tokens = tokenizeExpr(expr);
    const result = parseExpr(tokens);
    if (tokens.length > 0) return NaN;
    if (!Number.isFinite(result)) return NaN;
    return Math.round(result * 100) / 100;
  } catch {
    return NaN;
  }
}

function tokenizeExpr(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if ("+-*/()".includes(c)) {
      tokens.push(c);
      i++;
      continue;
    }
    if (/[\d.]/.test(c)) {
      let num = "";
      let dotSeen = false;
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        if (expr[i] === ".") {
          if (dotSeen) throw new Error("invalid number");
          dotSeen = true;
        }
        num += expr[i++];
      }
      const value = parseFloat(num);
      if (!Number.isFinite(value)) throw new Error("invalid number");
      tokens.push(value);
      continue;
    }
    throw new Error("invalid char");
  }
  return tokens;
}

function parseExpr(tokens) {
  let value = parseTerm(tokens);
  while (tokens[0] === "+" || tokens[0] === "-") {
    const op = tokens.shift();
    const right = parseTerm(tokens);
    value = op === "+" ? value + right : value - right;
  }
  return value;
}

function parseTerm(tokens) {
  let value = parseFactor(tokens);
  while (tokens[0] === "*" || tokens[0] === "/") {
    const op = tokens.shift();
    const right = parseFactor(tokens);
    if (op === "/" && right === 0) throw new Error("divide by zero");
    value = op === "*" ? value * right : value / right;
  }
  return value;
}

function parseFactor(tokens) {
  const tok = tokens.shift();
  if (tok === "+") return parseFactor(tokens);
  if (tok === "-") return -parseFactor(tokens);
  if (tok === "(") {
    const value = parseExpr(tokens);
    if (tokens.shift() !== ")") throw new Error("missing )");
    return value;
  }
  if (typeof tok === "number") return tok;
  throw new Error("invalid factor");
}

function updateAmountPreview() {
  const raw = els.amountInput.value.trim();
  if (!raw || /^-?\d+(\.\d+)?$/.test(raw)) {
    els.amountPreview.hidden = true;
    els.amountPreview.textContent = "";
    els.amountPreview.classList.remove("invalid");
    return;
  }

  const value = evaluateAmount(raw);
  if (Number.isFinite(value) && value > 0) {
    els.amountPreview.hidden = false;
    els.amountPreview.textContent = `= ${formatCurrency(value)}`;
    els.amountPreview.classList.remove("invalid");
  } else {
    els.amountPreview.hidden = false;
    els.amountPreview.textContent = "無法計算";
    els.amountPreview.classList.add("invalid");
  }
}

function startEditEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;

  state.editingId = id;
  els.typeInput.value = entry.type;
  syncCategoryOptions(entry.type, entry.category);

  if (![...els.categoryInput.options].some((opt) => opt.value === entry.category)) {
    const opt = document.createElement("option");
    opt.value = entry.category;
    opt.textContent = entry.category;
    els.categoryInput.appendChild(opt);
  }
  els.categoryInput.value = entry.category;
  els.amountInput.value = String(entry.amount);
  els.dateInput.value = entry.date;
  els.noteInput.value = entry.note || "";
  renderCustomCategoryList(entry.type);
  updateAmountPreview();

  els.entryForm.dataset.mode = "edit";
  els.submitBtn.textContent = "更新記帳";
  els.cancelEditBtn.hidden = false;
  updateHint(`編輯中：${formatDate(entry.date)} ${entry.category}`, false);

  render();
  els.entryForm.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => {
    els.amountInput.focus();
    els.amountInput.select();
  }, 200);
}

function exitEditMode(silent = false) {
  if (!state.editingId) return;
  state.editingId = null;
  els.entryForm.dataset.mode = "create";
  els.submitBtn.textContent = "加入記帳";
  els.cancelEditBtn.hidden = true;
  if (!silent) updateHint("", false);
}

function cancelEdit() {
  if (!state.editingId) return;
  exitEditMode();
  els.amountInput.value = "";
  els.noteInput.value = "";
  els.dateInput.value = toDateInputValue(new Date());
  els.typeInput.value = state.prefs.lastType;
  syncCategoryOptions(state.prefs.lastType);
  applyLastCategoryPref();
  renderCustomCategoryList(state.prefs.lastType);
  updateAmountPreview();
  render();
  showToast("已取消編輯。", { duration: 1800 });
}

function deleteEntryWithUndo(id) {
  const idx = state.entries.findIndex((entry) => entry.id === id);
  if (idx === -1) return;

  const removed = state.entries[idx];
  state.entries.splice(idx, 1);
  persistEntries();

  if (state.editingId === id) {
    exitEditMode();
    els.amountInput.value = "";
    els.noteInput.value = "";
  }

  render();

  const label = `${removed.type === "income" ? "收入" : "支出"} ${removed.category}`;
  showToast(`已刪除 ${label}`, {
    actionLabel: "復原",
    duration: UNDO_TIMEOUT_MS,
    onAction: () => {
      state.entries.push(removed);
      persistEntries();
      render();
      showToast("已復原。", { duration: 1800 });
    }
  });
}

function showToast(message, options = {}) {
  const toast = document.createElement("div");
  toast.className = "toast";

  const text = document.createElement("span");
  text.textContent = message;
  toast.appendChild(text);

  let timeoutId = 0;
  const dismiss = () => {
    if (toast.classList.contains("toast-out")) return;
    clearTimeout(timeoutId);
    toast.classList.add("toast-out");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  };

  if (options.actionLabel && typeof options.onAction === "function") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast-action";
    btn.textContent = options.actionLabel;
    btn.addEventListener("click", () => {
      options.onAction();
      dismiss();
    });
    toast.appendChild(btn);
  }

  els.toastStack.appendChild(toast);
  timeoutId = setTimeout(dismiss, options.duration || 2400);
  return { dismiss };
}

function loadEffectiveTheme() {
  if (state.prefs.theme === "dark" || state.prefs.theme === "light") {
    return state.prefs.theme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme() {
  const theme = loadEffectiveTheme();
  document.documentElement.dataset.theme = theme;
  if (els.themeToggleBtn) {
    els.themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
    els.themeToggleBtn.setAttribute(
      "aria-label",
      theme === "dark" ? "切換為淺色模式" : "切換為深色模式"
    );
  }
}

function toggleTheme() {
  const next = loadEffectiveTheme() === "dark" ? "light" : "dark";
  state.prefs.theme = next;
  persistPrefs();
  applyTheme();
}

function defaultPrefs() {
  return {
    theme: null,
    lastType: "expense",
    lastCategory: { expense: "", income: "" }
  };
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultPrefs();

    const lastCategory = parsed.lastCategory && typeof parsed.lastCategory === "object" ? parsed.lastCategory : {};
    return {
      theme: parsed.theme === "dark" || parsed.theme === "light" ? parsed.theme : null,
      lastType: parsed.lastType === "income" ? "income" : "expense",
      lastCategory: {
        expense: typeof lastCategory.expense === "string" ? lastCategory.expense : "",
        income: typeof lastCategory.income === "string" ? lastCategory.income : ""
      }
    };
  } catch {
    return defaultPrefs();
  }
}

function persistPrefs() {
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(state.prefs));
}

function saveLastSelection(type, category) {
  state.prefs.lastType = type === "income" ? "income" : "expense";
  state.prefs.lastCategory[state.prefs.lastType] = category || "";
  persistPrefs();
}

function applyLastCategoryPref() {
  const type = els.typeInput.value;
  const last = state.prefs.lastCategory[type];
  if (!last) return;
  const all = getAllCategories(type);
  if (all.includes(last)) {
    els.categoryInput.value = last;
  }
}

function exportJson() {
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    entries: state.entries,
    customCategories: state.customCategories
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `ledger_backup_${toDateInputValue(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("已備份 JSON。");
}

async function onImportJsonChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data || typeof data !== "object" || !Array.isArray(data.entries)) {
      throw new Error("invalid format");
    }

    const validEntries = data.entries.filter(isValidImportEntry);
    const existingIds = new Set(state.entries.map((entry) => entry.id));
    const newEntries = [];
    const updatedMap = new Map();

    for (const entry of validEntries) {
      if (existingIds.has(entry.id)) {
        updatedMap.set(entry.id, entry);
      } else {
        newEntries.push(entry);
      }
    }

    if (updatedMap.size > 0) {
      state.entries = state.entries.map((entry) => {
        const replacement = updatedMap.get(entry.id);
        return replacement ? { ...entry, ...replacement } : entry;
      });
    }
    if (newEntries.length > 0) {
      state.entries = state.entries.concat(newEntries);
    }
    if (updatedMap.size > 0 || newEntries.length > 0) {
      persistEntries();
    }

    if (data.customCategories && typeof data.customCategories === "object") {
      const before = JSON.stringify(state.customCategories);
      state.customCategories = {
        expense: sanitizeCustomCategoryList(
          [...state.customCategories.expense, ...(Array.isArray(data.customCategories.expense) ? data.customCategories.expense : [])],
          DEFAULT_CATEGORY_MAP.expense
        ),
        income: sanitizeCustomCategoryList(
          [...state.customCategories.income, ...(Array.isArray(data.customCategories.income) ? data.customCategories.income : [])],
          DEFAULT_CATEGORY_MAP.income
        )
      };
      if (JSON.stringify(state.customCategories) !== before) {
        persistCustomCategories();
        syncCategoryOptions(els.typeInput.value);
        renderCustomCategoryList(els.typeInput.value);
      }
    }

    render();
    showToast(`匯入完成：新增 ${newEntries.length}、更新 ${updatedMap.size}`);
  } catch {
    showToast("匯入失敗：請確認是備份過的 JSON。", { duration: 3600 });
  } finally {
    event.target.value = "";
  }
}

function isValidImportEntry(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.id === "string" &&
    (entry.type === "income" || entry.type === "expense") &&
    typeof entry.amount === "number" &&
    Number.isFinite(entry.amount) &&
    entry.amount > 0 &&
    typeof entry.category === "string" &&
    entry.category.trim().length > 0 &&
    typeof entry.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
  );
}

init();
