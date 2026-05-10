const STORAGE_KEY = "ledger_entries_v1";
const CATEGORY_STORAGE_KEY = "ledger_custom_categories_v1";
const ACCOUNT_STORAGE_KEY = "ledger_custom_accounts_v1";
const BUDGET_STORAGE_KEY = "ledger_budget_v1";
const CATEGORY_BUDGET_STORAGE_KEY = "ledger_category_budgets_v1";
const RECURRING_STORAGE_KEY = "ledger_recurring_v1";
const PREFS_STORAGE_KEY = "ledger_prefs_v1";
const CATEGORY_ICON_STORAGE_KEY = "ledger_category_icons_v1";
const ACHIEVEMENTS_STORAGE_KEY = "ledger_achievements_v1";
const REMINDER_STORAGE_KEY = "ledger_reminder_v1";
const UNDO_TIMEOUT_MS = 5000;
const TREND_MONTHS = 6;
const WEEKDAY_LABELS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const TAB_NAMES = ["record", "list", "chart", "report", "settings"];
const DEFAULT_TAB = "record";
const FALLBACK_ICON = "📌";
let deferredInstallPrompt = null;

const DEFAULT_CATEGORY_MAP = {
  expense: [
    "飲食", "交通", "居家", "娛樂", "醫療", "購物",
    "教育", "旅遊", "通訊", "訂閱", "寵物", "美容",
    "保險", "稅費", "禮物", "孝親", "捐贈", "運動",
    "水電瓦斯", "其他"
  ],
  income: [
    "薪資", "獎金", "投資", "退款", "兼職",
    "紅包", "利息", "租金", "禮金", "其他"
  ]
};

const DEFAULT_CATEGORY_ICONS = {
  expense: {
    "飲食": "🍱",
    "交通": "🚇",
    "居家": "🏠",
    "娛樂": "🎮",
    "醫療": "💊",
    "購物": "🛍️",
    "教育": "📚",
    "旅遊": "✈️",
    "通訊": "📱",
    "訂閱": "🔔",
    "寵物": "🐾",
    "美容": "💅",
    "保險": "🛡️",
    "稅費": "🧾",
    "禮物": "🎁",
    "孝親": "👨‍👩‍👧",
    "捐贈": "💝",
    "運動": "🏃",
    "水電瓦斯": "💡",
    "其他": "📦"
  },
  income: {
    "薪資": "💰",
    "獎金": "🏆",
    "投資": "📈",
    "退款": "↩️",
    "兼職": "💼",
    "紅包": "🧧",
    "利息": "🏦",
    "租金": "🏘️",
    "禮金": "💌",
    "其他": "📦"
  }
};

const EMOJI_GROUPS = [
  {
    name: "日常",
    emojis: ["🍱", "🍔", "🍕", "🍣", "🍜", "🍝", "🍞", "🥗", "🍰", "☕", "🍵", "🥤", "🍺", "🍷", "🍦", "🍎", "🥩", "🥬", "🥖", "🛒", "🛍️", "🧾", "🧴", "🧻", "🧼"]
  },
  {
    name: "交通",
    emojis: ["🚇", "🚌", "🚕", "🚗", "🚲", "🛵", "✈️", "🚄", "🚆", "⛽", "🅿️", "🛺", "🚉", "🛴", "🚢"]
  },
  {
    name: "娛樂",
    emojis: ["🎮", "🎬", "🎵", "🎤", "🎨", "🎲", "🎟️", "🎳", "🏀", "⚽", "🎾", "🏊", "🎢", "🎭", "📚", "🎧", "🎷", "📺", "🎯"]
  },
  {
    name: "居家",
    emojis: ["🏠", "🛋️", "🛏️", "🚿", "🪑", "💡", "💧", "🔌", "🧹", "🧺", "🪴", "🔧", "🪟", "🚪", "🪞"]
  },
  {
    name: "醫療",
    emojis: ["💊", "🏥", "🩺", "💉", "🧪", "🦷", "👓", "🩹", "🧬", "🌡️"]
  },
  {
    name: "工作",
    emojis: ["💼", "📱", "💻", "📞", "✉️", "📧", "🖨️", "📅", "✏️", "📌", "📎", "🖇️", "📂", "📊"]
  },
  {
    name: "旅遊",
    emojis: ["✈️", "🗺️", "🏖️", "🏔️", "🚢", "🎒", "🏨", "🛂", "📷", "🌏", "🗽", "🗼", "🏝️", "⛺"]
  },
  {
    name: "寵物",
    emojis: ["🐶", "🐱", "🐰", "🐢", "🐠", "🦜", "🐹", "🐭", "🐦", "🐾"]
  },
  {
    name: "收入",
    emojis: ["💰", "💵", "💴", "💶", "💷", "🏦", "🪙", "💳", "📈", "🎁", "💎", "💸", "🤝", "↩️", "📊"]
  },
  {
    name: "其他",
    emojis: ["📌", "⭐", "❤️", "🎉", "🎂", "🌸", "🌈", "☂️", "🌳", "🌙", "⚡", "🔥", "✨", "🎯", "🧧", "🪄", "🎈", "🍀"]
  }
];

const DEFAULT_ACCOUNTS = ["現金", "信用卡", "銀行"];

const QUICK_ENTRY_TEMPLATES = {
  breakfast: {
    type: "expense",
    amount: 60,
    category: "飲食",
    account: "現金",
    note: "早餐"
  },
  transit: {
    type: "expense",
    amount: 30,
    category: "交通",
    account: "現金",
    note: "捷運"
  },
  salary: {
    type: "income",
    amount: 30000,
    category: "薪資",
    account: "銀行",
    note: "薪資"
  }
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
  quickTemplates: document.querySelector("#quickTemplates"),
  categoryInput: document.querySelector("#categoryInput"),
  accountInput: document.querySelector("#accountInput"),
  customCategoryInput: document.querySelector("#customCategoryInput"),
  addCategoryBtn: document.querySelector("#addCategoryBtn"),
  customCategoryList: document.querySelector("#customCategoryList"),
  customAccountInput: document.querySelector("#customAccountInput"),
  addAccountBtn: document.querySelector("#addAccountBtn"),
  customAccountList: document.querySelector("#customAccountList"),
  dateInput: document.querySelector("#dateInput"),
  noteInput: document.querySelector("#noteInput"),
  formHint: document.querySelector("#formHint"),
  submitBtn: document.querySelector("#submitBtn"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  budgetInput: document.querySelector("#budgetInput"),
  budgetStatus: document.querySelector("#budgetStatus"),
  budgetBar: document.querySelector("#budgetBar"),
  accountBalances: document.querySelector("#accountBalances"),
  monthFilter: document.querySelector("#monthFilter"),
  typeFilter: document.querySelector("#typeFilter"),
  accountFilter: document.querySelector("#accountFilter"),
  keywordFilter: document.querySelector("#keywordFilter"),
  quickRangeBtns: document.querySelectorAll("[data-quick-range]"),
  transactionList: document.querySelector("#transactionList"),
  transactionItemTemplate: document.querySelector("#transactionItemTemplate"),
  categoryChart: document.querySelector("#categoryChart"),
  trendChart: document.querySelector("#trendChart"),
  reportContent: document.querySelector("#reportContent"),
  toggleRecurringFormBtn: document.querySelector("#toggleRecurringFormBtn"),
  recurringList: document.querySelector("#recurringList"),
  recurringForm: document.querySelector("#recurringForm"),
  recurringType: document.querySelector("#recurringType"),
  recurringAmount: document.querySelector("#recurringAmount"),
  recurringFrequency: document.querySelector("#recurringFrequency"),
  recurringDayOfMonth: document.querySelector("#recurringDayOfMonth"),
  recurringDayOfMonthLabel: document.querySelector("#recurringDayOfMonthLabel"),
  recurringDayOfWeek: document.querySelector("#recurringDayOfWeek"),
  recurringDayOfWeekLabel: document.querySelector("#recurringDayOfWeekLabel"),
  recurringCategory: document.querySelector("#recurringCategory"),
  recurringAccount: document.querySelector("#recurringAccount"),
  recurringStartDate: document.querySelector("#recurringStartDate"),
  recurringNote: document.querySelector("#recurringNote"),
  cancelRecurringBtn: document.querySelector("#cancelRecurringBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  exportJsonBtn: document.querySelector("#exportJsonBtn"),
  importJsonBtn: document.querySelector("#importJsonBtn"),
  importJsonInput: document.querySelector("#importJsonInput"),
  clearMonthBtn: document.querySelector("#clearMonthBtn"),
  toastStack: document.querySelector("#toastStack"),
  tabBar: document.querySelector("#tabBar"),
  fabBtn: document.querySelector("#fabBtn"),
  numpad: document.querySelector("#numpad"),
  numpadDisplay: document.querySelector("#numpadDisplay"),
  pickCategoryIconBtn: document.querySelector("#pickCategoryIconBtn"),
  pendingCategoryIcon: document.querySelector("#pendingCategoryIcon"),
  iconPicker: document.querySelector("#iconPicker"),
  iconPickerOverlay: document.querySelector("#iconPickerOverlay"),
  iconPickerClose: document.querySelector("#iconPickerClose"),
  iconPickerTabs: document.querySelector("#iconPickerTabs"),
  iconPickerGrid: document.querySelector("#iconPickerGrid"),
  iconPickerTitle: document.querySelector("#iconPickerTitle"),
  calendarHeatmap: document.querySelector("#calendarHeatmap"),
  calendarStatus: document.querySelector("#calendarStatus"),
  calendarStatusText: document.querySelector("#calendarStatusText"),
  calendarStatusClear: document.querySelector("#calendarStatusClear"),
  calendarDayDetail: document.querySelector("#calendarDayDetail"),
  dayDetailDate: document.querySelector("#dayDetailDate"),
  dayDetailGoto: document.querySelector("#dayDetailGoto"),
  dayDetailIncome: document.querySelector("#dayDetailIncome"),
  dayDetailExpense: document.querySelector("#dayDetailExpense"),
  dayDetailBalance: document.querySelector("#dayDetailBalance"),
  dayDetailList: document.querySelector("#dayDetailList"),
  dayDetailEmpty: document.querySelector("#dayDetailEmpty"),
  // Photo
  photoAttachBtn: document.querySelector("#photoAttachBtn"),
  photoInput: document.querySelector("#photoInput"),
  photoPreview: document.querySelector("#photoPreview"),
  photoPreviewImg: document.querySelector("#photoPreviewImg"),
  photoRemoveBtn: document.querySelector("#photoRemoveBtn"),
  photoViewer: document.querySelector("#photoViewer"),
  photoViewerOverlay: document.querySelector("#photoViewerOverlay"),
  photoViewerImg: document.querySelector("#photoViewerImg"),
  photoViewerClose: document.querySelector("#photoViewerClose"),
  // Donut
  donutChart: document.querySelector("#donutChart"),
  donutCenterAmount: document.querySelector("#donutCenterAmount"),
  donutLegend: document.querySelector("#donutLegend"),
  // Annual
  annualYearLabel: document.querySelector("#annualYearLabel"),
  annualPrevYear: document.querySelector("#annualPrevYear"),
  annualNextYear: document.querySelector("#annualNextYear"),
  annualReportContent: document.querySelector("#annualReportContent"),
  // Achievements
  achievementsList: document.querySelector("#achievementsList"),
  achievementPopup: document.querySelector("#achievementPopup"),
  achievementPopupIcon: document.querySelector("#achievementPopupIcon"),
  achievementPopupTitle: document.querySelector("#achievementPopupTitle"),
  achievementPopupDesc: document.querySelector("#achievementPopupDesc"),
  // Category Budget
  categoryBudgetList: document.querySelector("#categoryBudgetList"),
  // Reminder
  reminderToggleBtn: document.querySelector("#reminderToggleBtn"),
  reminderTimeInput: document.querySelector("#reminderTimeInput"),
  reminderStatus: document.querySelector("#reminderStatus")
};

const state = {
  entries: loadEntries(),
  customCategories: loadCustomCategories(),
  customAccounts: loadCustomAccounts(),
  budget: loadBudget(),
  recurring: loadRecurring(),
  prefs: loadPrefs(),
  categoryIcons: loadCategoryIcons(),
  month: getCurrentMonth(),
  quickRange: "month",
  type: "all",
  account: "all",
  keyword: "",
  specificDay: null,
  editingId: null,
  activeTab: DEFAULT_TAB,
  pendingCategoryIcon: FALLBACK_ICON,
  iconPickerContext: null,
  numpadActive: false,
  pendingPhoto: null,
  annualYear: new Date().getFullYear(),
  categoryBudgets: loadCategoryBudgets(),
  achievementsUnlocked: loadAchievements(),
  reminder: loadReminder()
};

migrateEntries();

function init() {
  applyTheme();

  const now = new Date();
  els.currentMonthText.textContent = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;
  els.dateInput.value = toDateInputValue(now);
  els.monthFilter.value = state.month;
  els.typeInput.value = state.prefs.lastType;
  syncCategoryOptions(state.prefs.lastType);
  syncAccountOptions(els.accountInput);
  applyLastCategoryPref();
  applyLastAccountPref();
  renderCustomCategoryList(state.prefs.lastType);
  renderCustomAccountList();
  syncAccountFilterOptions();
  syncRecurringDayOfMonthOptions();
  if (Number.isFinite(state.budget.monthlyExpense) && state.budget.monthlyExpense > 0) {
    els.budgetInput.value = state.budget.monthlyExpense;
  }
  setupInstallPrompt();
  generateRecurringEntries();

  els.entryForm.addEventListener("submit", onCreateEntry);
  els.typeInput.addEventListener("change", (event) => {
    const type = event.target.value;
    syncCategoryOptions(type);
    applyLastCategoryPref();
    renderCustomCategoryList(type);
  });

  els.amountInput.addEventListener("input", updateAmountPreview);
  els.cancelEditBtn.addEventListener("click", cancelEdit);
  els.quickTemplates.addEventListener("click", onQuickTemplateClick);

  els.addCategoryBtn.addEventListener("click", onAddCustomCategory);
  els.customCategoryInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onAddCustomCategory();
  });
  els.customCategoryList.addEventListener("click", onCustomCategoryListAction);

  els.addAccountBtn.addEventListener("click", onAddCustomAccount);
  els.customAccountInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onAddCustomAccount();
  });
  els.customAccountList.addEventListener("click", onCustomAccountListAction);

  els.budgetInput.addEventListener("input", onBudgetInput);

  els.toggleRecurringFormBtn.addEventListener("click", toggleRecurringForm);
  els.cancelRecurringBtn.addEventListener("click", () => hideRecurringForm(true));
  els.recurringFrequency.addEventListener("change", onRecurringFrequencyChange);
  els.recurringType.addEventListener("change", () => syncCategoryOptions(els.recurringType.value, "", els.recurringCategory));
  els.recurringForm.addEventListener("submit", onCreateRecurringRule);
  els.recurringList.addEventListener("click", onRecurringListAction);

  els.monthFilter.addEventListener("input", (event) => {
    state.month = event.target.value;
    state.quickRange = "customMonth";
    state.specificDay = null;
    render();
  });

  els.typeFilter.addEventListener("change", (event) => {
    state.type = event.target.value;
    render();
  });

  els.accountFilter.addEventListener("change", (event) => {
    state.account = event.target.value;
    render();
  });

  els.keywordFilter.addEventListener("input", (event) => {
    state.keyword = event.target.value.trim().toLowerCase();
    render();
  });

  for (const btn of els.quickRangeBtns) {
    btn.addEventListener("click", onQuickRangeClick);
  }

  if (els.calendarHeatmap) {
    els.calendarHeatmap.addEventListener("click", onCalendarCellClick);
  }
  if (els.calendarStatusClear) {
    els.calendarStatusClear.addEventListener("click", clearCalendarSpecificDay);
  }
  if (els.dayDetailGoto) {
    els.dayDetailGoto.addEventListener("click", () => {
      if (!state.specificDay) return;
      setActiveTab("list");
    });
  }

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

  const narrowMq = window.matchMedia("(max-width: 759px)");
  const onNarrowChange = () => renderTrendChart();
  if (typeof narrowMq.addEventListener === "function") {
    narrowMq.addEventListener("change", onNarrowChange);
  } else if (typeof narrowMq.addListener === "function") {
    narrowMq.addListener(onNarrowChange);
  }

  setupTabs();
  setupFab();
  setupNumpad();
  setupIconPicker();
  setupCategoryIconPicker();
  setupPhotoAttach();
  setupAnnualReport();
  setupCategoryBudgets();
  setupReminder();
  setupPhotoViewer();

  registerServiceWorker();
  render();
}

function onCreateEntry(event) {
  event.preventDefault();

  const type = els.typeInput.value;
  const amount = evaluateAmount(els.amountInput.value);
  const category = els.categoryInput.value;
  const account = els.accountInput.value;
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

  if (!account) {
    updateHint("請先選擇帳戶。", true);
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
        account,
        date,
        note
      };
      persistEntries();
      saveLastSelection(type, category, account);
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
    account,
    date,
    note,
    photo: state.pendingPhoto || null,
    createdAt: Date.now()
  };

  state.entries.unshift(entry);
  persistEntries();
  saveLastSelection(type, category, account);

  els.amountInput.value = "";
  els.noteInput.value = "";
  clearPendingPhoto();
  updateAmountPreview();
  updateHint("", false);
  render();
  checkAchievements();
  showToast("已加入一筆記帳。");
}

function onQuickTemplateClick(event) {
  const btn = event.target.closest("button[data-template]");
  if (!btn) return;

  const template = QUICK_ENTRY_TEMPLATES[btn.dataset.template];
  if (!template) return;

  if (state.editingId) {
    exitEditMode();
  }

  els.typeInput.value = template.type;
  syncCategoryOptions(template.type, template.category);
  renderCustomCategoryList(template.type);

  const categories = getAllCategories(template.type);
  if (categories.includes(template.category)) {
    els.categoryInput.value = template.category;
  }

  syncAccountOptions(els.accountInput);
  const accounts = getAllAccounts();
  els.accountInput.value = accounts.includes(template.account) ? template.account : DEFAULT_ACCOUNTS[0];

  els.amountInput.value = String(template.amount);
  els.dateInput.value = toDateInputValue(new Date());
  els.noteInput.value = template.note;
  updateAmountPreview();
  updateHint(`已套用「${template.note}」模板，可直接調整後送出。`, false);

  if (state.numpadActive) {
    updateNumpadDisplay();
  }
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

  setCategoryIcon(type, category, state.pendingCategoryIcon || FALLBACK_ICON);
  state.pendingCategoryIcon = FALLBACK_ICON;
  if (els.pendingCategoryIcon) els.pendingCategoryIcon.textContent = FALLBACK_ICON;

  els.customCategoryInput.value = "";
  syncCategoryOptions(type, category);
  renderCustomCategoryList(type);
  updateHint(`已新增「${category}」分類。`, false);
}

function onCustomCategoryListAction(event) {
  const iconBtn = event.target.closest("button[data-icon-category]");
  if (iconBtn) {
    const cat = iconBtn.dataset.iconCategory;
    const type = iconBtn.dataset.iconType || els.typeInput.value;
    openIconPicker({
      title: `更改「${cat}」圖示`,
      currentIcon: getCategoryIcon(type, cat),
      onPick: (emoji) => {
        setCategoryIcon(type, cat, emoji);
        renderCustomCategoryList(type);
        render();
        showToast(`已更新「${cat}」圖示。`, { duration: 1600 });
      }
    });
    return;
  }

  const target = event.target.closest("button[data-category]");
  if (!target) return;

  const type = els.typeInput.value;
  const category = target.dataset.category;
  if (!category) return;

  state.customCategories[type] = state.customCategories[type].filter((item) => item !== category);
  persistCustomCategories();
  if (state.categoryIcons[type] && state.categoryIcons[type][category]) {
    delete state.categoryIcons[type][category];
    persistCategoryIcons();
  }
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
  updateQuickRangeButtons();
  renderList(filtered);
  renderTotals(filtered);
  renderCategoryChart(filtered);
  renderDonutChart(filtered);
  renderBudget();
  renderAccountBalances();
  renderTrendChart();
  renderCalendarHeatmap();
  renderCalendarStatus();
  renderCalendarDayDetail();
  renderReport();
  renderRecurringList();
  renderAnnualReport();
  renderAchievements();
  renderCategoryBudgetList();
}

function getFilteredEntries() {
  const range = getQuickRangeBounds();
  return state.entries
    .filter((entry) => {
      if (range) {
        if (entry.date < range.start || entry.date > range.end) return false;
      } else if (state.month && !entry.date.startsWith(state.month)) {
        return false;
      }
      if (state.type !== "all" && entry.type !== state.type) return false;
      if (state.account !== "all" && (entry.account || DEFAULT_ACCOUNTS[0]) !== state.account) return false;

      if (state.keyword) {
        const haystack = `${entry.category} ${entry.account || ""} ${entry.note}`.toLowerCase();
        if (!haystack.includes(state.keyword)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt - a.createdAt;
    });
}

function getQuickRangeBounds() {
  if (state.specificDay) {
    return { start: state.specificDay, end: state.specificDay };
  }

  if (state.quickRange === "today") {
    const today = toDateInputValue(new Date());
    return { start: today, end: today };
  }

  if (state.quickRange === "week") {
    return getCurrentWeekRange();
  }

  return null;
}

function getCurrentWeekRange() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + offset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end)
  };
}

function onQuickRangeClick(event) {
  const btn = event.target.closest("button[data-quick-range]");
  if (!btn) return;

  const range = btn.dataset.quickRange;
  if (!["today", "week", "month"].includes(range)) return;

  state.specificDay = null;
  state.quickRange = range;
  if (range === "month") {
    state.month = getCurrentMonth();
    els.monthFilter.value = state.month;
  }
  render();
}

function updateQuickRangeButtons() {
  for (const btn of els.quickRangeBtns) {
    const isActive = btn.dataset.quickRange === state.quickRange;
    btn.classList.toggle("active", isActive);
    if (isActive) {
      btn.setAttribute("aria-current", "true");
    } else {
      btn.removeAttribute("aria-current");
    }
  }
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

    const account = entry.account || DEFAULT_ACCOUNTS[0];
    const icon = getCategoryIcon(entry.type, entry.category);
    const notePart = entry.note ? `・${entry.note}` : "";
    const recurringPart = entry.recurringId ? "・🔁" : "";
    meta.textContent = `${formatDate(entry.date)}・${icon} ${entry.category}・${account}${notePart}${recurringPart}`;

    editBtn.dataset.id = entry.id;
    deleteBtn.dataset.id = entry.id;

    const photoThumb = node.querySelector(".item-photo-thumb");
    if (entry.photo && photoThumb) {
      photoThumb.src = entry.photo;
      photoThumb.hidden = false;
      photoThumb.dataset.photo = entry.photo;
    }

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
    label.textContent = `${getCategoryIcon("expense", category)} ${category}`;

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

function renderReport() {
  const month = state.month || getCurrentMonth();
  const previousMonth = shiftMonth(month, -1);
  const current = getMonthSummary(month);
  const previous = getMonthSummary(previousMonth);

  els.reportContent.innerHTML = "";

  if (!current.entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = `${formatMonthLabel(month)} 尚無資料；新增幾筆後，這裡會整理本月 vs 上月、Top 5 支出與預算狀態。`;
    els.reportContent.appendChild(empty);
  }

  const summaryGrid = document.createElement("div");
  summaryGrid.className = "report-summary-grid";
  summaryGrid.appendChild(createReportMetric("收入", formatCurrency(current.income), describeDelta(current.income, previous.income, "收入")));
  summaryGrid.appendChild(createReportMetric("支出", formatCurrency(current.expense), describeDelta(current.expense, previous.expense, "支出", true)));
  summaryGrid.appendChild(createReportMetric("結餘", formatCurrency(current.balance), describeDelta(current.balance, previous.balance, "結餘")));
  els.reportContent.appendChild(summaryGrid);

  const comparisonCard = createReportCard("本月 vs 上月", `${formatMonthLabel(month)} / ${formatMonthLabel(previousMonth)}`);
  const comparisonList = document.createElement("ul");
  comparisonList.className = "report-list";
  comparisonList.appendChild(createReportListItem("收入變化", describeDelta(current.income, previous.income, "收入").text));
  comparisonList.appendChild(createReportListItem("支出變化", describeDelta(current.expense, previous.expense, "支出", true).text));
  comparisonList.appendChild(createReportListItem("結餘變化", describeDelta(current.balance, previous.balance, "結餘").text));
  comparisonCard.appendChild(comparisonList);
  els.reportContent.appendChild(comparisonCard);

  const topCard = createReportCard("Top 5 支出", "依分類統計");
  const topCategories = getTopExpenseCategories(current.entries, 5);
  if (!topCategories.length) {
    const empty = document.createElement("p");
    empty.className = "report-note";
    empty.textContent = "本月尚無支出分類可排行。";
    topCard.appendChild(empty);
  } else {
    const topList = document.createElement("div");
    topList.className = "report-top-list";
    for (const item of topCategories) {
      const row = document.createElement("div");
      row.className = "report-top-row";

      const head = document.createElement("div");
      head.className = "report-top-head";

      const label = document.createElement("span");
      label.textContent = `${getCategoryIcon("expense", item.category)} ${item.category}`;

      const value = document.createElement("span");
      value.textContent = `${formatCurrency(item.total)}・${item.ratio.toFixed(0)}%`;

      head.appendChild(label);
      head.appendChild(value);

      const track = document.createElement("div");
      track.className = "report-top-track";
      const bar = document.createElement("div");
      bar.className = "report-top-bar";
      bar.style.width = `${Math.max(item.ratio, 4).toFixed(2)}%`;
      track.appendChild(bar);

      row.appendChild(head);
      row.appendChild(track);
      topList.appendChild(row);
    }
    topCard.appendChild(topList);
  }
  els.reportContent.appendChild(topCard);

  const budgetCard = createReportCard("預算狀態", "本月支出預算");
  budgetCard.appendChild(createBudgetReportBody(current.expense));
  els.reportContent.appendChild(budgetCard);
}

function createReportMetric(label, value, delta) {
  const article = document.createElement("article");
  article.className = "report-metric";
  if (delta.tone) article.classList.add(delta.tone);

  const title = document.createElement("span");
  title.textContent = label;

  const strong = document.createElement("strong");
  strong.textContent = value;

  const small = document.createElement("small");
  small.textContent = delta.text;

  article.appendChild(title);
  article.appendChild(strong);
  article.appendChild(small);
  return article;
}

function createReportCard(title, subtitle) {
  const article = document.createElement("article");
  article.className = "report-card";

  const head = document.createElement("div");
  head.className = "report-card-head";

  const h3 = document.createElement("h3");
  h3.textContent = title;

  const p = document.createElement("p");
  p.textContent = subtitle;

  head.appendChild(h3);
  head.appendChild(p);
  article.appendChild(head);
  return article;
}

function createReportListItem(label, value) {
  const li = document.createElement("li");

  const key = document.createElement("span");
  key.textContent = label;

  const val = document.createElement("strong");
  val.textContent = value;

  li.appendChild(key);
  li.appendChild(val);
  return li;
}

function createBudgetReportBody(spent) {
  const wrapper = document.createElement("div");
  wrapper.className = "report-budget";

  const budget = state.budget.monthlyExpense || 0;
  const status = document.createElement("strong");
  const detail = document.createElement("span");
  const track = document.createElement("div");
  track.className = "report-top-track";
  const bar = document.createElement("div");
  bar.className = "report-top-bar";

  if (!budget || budget <= 0) {
    status.textContent = "尚未設定";
    detail.textContent = "到「設定」頁輸入本月預算後，報告會自動追蹤剩餘金額。";
    bar.style.width = "0%";
  } else {
    const ratio = spent / budget;
    const pct = Math.min(ratio * 100, 100);
    const remaining = budget - spent;
    bar.style.width = `${pct.toFixed(2)}%`;
    if (ratio >= 1) {
      wrapper.classList.add("over");
      bar.classList.add("over");
      status.textContent = `已超支 ${formatCurrency(spent - budget)}`;
    } else if (ratio >= 0.8) {
      wrapper.classList.add("warn");
      bar.classList.add("warn");
      status.textContent = `已用 ${(ratio * 100).toFixed(0)}%`;
    } else {
      wrapper.classList.add("safe");
      status.textContent = `已用 ${(ratio * 100).toFixed(0)}%`;
    }
    detail.textContent = `預算 ${formatCurrency(budget)}，目前支出 ${formatCurrency(spent)}，剩餘 ${formatCurrency(remaining)}。`;
  }

  track.appendChild(bar);
  wrapper.appendChild(status);
  wrapper.appendChild(detail);
  wrapper.appendChild(track);
  return wrapper;
}

function getMonthSummary(month) {
  const entries = state.entries.filter((entry) => entry.date.startsWith(month));
  let income = 0;
  let expense = 0;
  for (const entry of entries) {
    if (entry.type === "income") {
      income += entry.amount;
    } else {
      expense += entry.amount;
    }
  }
  return {
    entries,
    income,
    expense,
    balance: income - expense
  };
}

function getTopExpenseCategories(entries, limit) {
  const totals = new Map();
  let totalExpense = 0;
  for (const entry of entries) {
    if (entry.type !== "expense") continue;
    const current = totals.get(entry.category) || 0;
    totals.set(entry.category, current + entry.amount);
    totalExpense += entry.amount;
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, total]) => ({
      category,
      total,
      ratio: totalExpense > 0 ? (total / totalExpense) * 100 : 0
    }));
}

function describeDelta(current, previous, label, lowerIsBetter = false) {
  const diff = current - previous;
  if (diff === 0) {
    return { text: `與上月持平`, tone: "" };
  }

  const abs = Math.abs(diff);
  const percent = previous > 0 ? `（${((abs / previous) * 100).toFixed(0)}%）` : "";
  const verb = diff > 0 ? "增加" : "減少";
  const isGood = lowerIsBetter ? diff < 0 : diff > 0;
  return {
    text: `${label}${verb} ${formatCurrency(abs)}${percent}`,
    tone: isGood ? "safe" : "warn"
  };
}

function shiftMonth(month, delta) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month) {
  const [year, monthNumber] = month.split("-");
  return `${year} 年 ${Number(monthNumber)} 月`;
}

function syncCategoryOptions(type, preferredCategory = "", targetSelect = els.categoryInput) {
  const categories = getAllCategories(type);
  const prevValue = preferredCategory || targetSelect.value;

  targetSelect.innerHTML = "";
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = `${getCategoryIcon(type, category)} ${category}`;
    targetSelect.appendChild(option);
  }

  if (prevValue && categories.includes(prevValue)) {
    targetSelect.value = prevValue;
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

    const iconBtn = document.createElement("button");
    iconBtn.type = "button";
    iconBtn.className = "chip-icon";
    iconBtn.dataset.iconCategory = category;
    iconBtn.dataset.iconType = type;
    iconBtn.textContent = getCategoryIcon(type, category);
    iconBtn.setAttribute("aria-label", `更改 ${category} 的圖示`);

    const text = document.createElement("span");
    text.textContent = category;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "chip-delete";
    removeBtn.dataset.category = category;
    removeBtn.setAttribute("aria-label", `刪除 ${category}`);
    removeBtn.textContent = "×";

    li.appendChild(iconBtn);
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

  const rows = ["日期,類型,分類,帳戶,金額,備註"];
  for (const entry of entries) {
    rows.push([
      entry.date,
      entry.type === "income" ? "收入" : "支出",
      quoteCsv(entry.category),
      quoteCsv(entry.account || DEFAULT_ACCOUNTS[0]),
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

  if (state.activeTab !== "record") setActiveTab("record");

  state.editingId = id;
  els.typeInput.value = entry.type;
  syncCategoryOptions(entry.type, entry.category);
  syncAccountOptions(els.accountInput);

  if (![...els.categoryInput.options].some((opt) => opt.value === entry.category)) {
    const opt = document.createElement("option");
    opt.value = entry.category;
    opt.textContent = `${getCategoryIcon(entry.type, entry.category)} ${entry.category}`;
    els.categoryInput.appendChild(opt);
  }
  els.categoryInput.value = entry.category;

  const entryAccount = entry.account || DEFAULT_ACCOUNTS[0];
  if (![...els.accountInput.options].some((opt) => opt.value === entryAccount)) {
    const opt = document.createElement("option");
    opt.value = entryAccount;
    opt.textContent = entryAccount;
    els.accountInput.appendChild(opt);
  }
  els.accountInput.value = entryAccount;

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
  applyLastAccountPref();
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
    els.themeToggleBtn.textContent = theme === "dark" ? "☀️ 切換深淺色" : "🌙 切換深淺色";
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
    lastCategory: { expense: "", income: "" },
    lastAccount: "",
    activeTab: DEFAULT_TAB
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
      },
      lastAccount: typeof parsed.lastAccount === "string" ? parsed.lastAccount : "",
      activeTab: TAB_NAMES.includes(parsed.activeTab) ? parsed.activeTab : DEFAULT_TAB
    };
  } catch {
    return defaultPrefs();
  }
}

function persistPrefs() {
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(state.prefs));
}

function saveLastSelection(type, category, account) {
  state.prefs.lastType = type === "income" ? "income" : "expense";
  state.prefs.lastCategory[state.prefs.lastType] = category || "";
  if (account) state.prefs.lastAccount = account;
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

function applyLastAccountPref() {
  const last = state.prefs.lastAccount;
  if (!last) return;
  const all = getAllAccounts();
  if (all.includes(last)) {
    els.accountInput.value = last;
  }
}

function exportJson() {
  const payload = {
    schemaVersion: 3,
    exportedAt: new Date().toISOString(),
    entries: state.entries,
    customCategories: state.customCategories,
    customAccounts: state.customAccounts,
    categoryIcons: state.categoryIcons,
    budget: state.budget,
    recurring: state.recurring
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

    if (Array.isArray(data.customAccounts)) {
      const merged = sanitizeCustomCategoryList(
        [...state.customAccounts, ...data.customAccounts],
        DEFAULT_ACCOUNTS
      );
      if (JSON.stringify(merged) !== JSON.stringify(state.customAccounts)) {
        state.customAccounts = merged;
        persistCustomAccounts();
        syncAccountOptions(els.accountInput);
        syncAccountOptions(els.recurringAccount);
        syncAccountFilterOptions();
        renderCustomAccountList();
      }
    }

    if (data.categoryIcons && typeof data.categoryIcons === "object") {
      let iconsTouched = false;
      for (const t of ["expense", "income"]) {
        const incoming = data.categoryIcons[t];
        if (!incoming || typeof incoming !== "object") continue;
        state.categoryIcons[t] = state.categoryIcons[t] || {};
        for (const [name, icon] of Object.entries(incoming)) {
          if (typeof icon === "string" && icon && !state.categoryIcons[t][name]) {
            state.categoryIcons[t][name] = icon;
            iconsTouched = true;
          }
        }
      }
      if (iconsTouched) {
        persistCategoryIcons();
        syncCategoryOptions(els.typeInput.value);
        renderCustomCategoryList(els.typeInput.value);
      }
    }

    if (data.budget && typeof data.budget === "object") {
      const monthlyExpense = Number(data.budget.monthlyExpense);
      if (Number.isFinite(monthlyExpense) && monthlyExpense >= 0) {
        state.budget.monthlyExpense = monthlyExpense;
        persistBudget();
        els.budgetInput.value = monthlyExpense > 0 ? String(monthlyExpense) : "";
      }
    }

    let importedRules = 0;
    if (Array.isArray(data.recurring)) {
      const existingIds = new Set(state.recurring.map((r) => r.id));
      for (const rule of data.recurring) {
        if (isValidRecurringRule(rule) && !existingIds.has(rule.id)) {
          state.recurring.push(rule);
          importedRules++;
        }
      }
      if (importedRules > 0) {
        persistRecurring();
      }
    }

    migrateEntries();
    render();
    showToast(`匯入完成：新增 ${newEntries.length}、更新 ${updatedMap.size}${importedRules ? `、規則 ${importedRules}` : ""}`);
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

// ─── Migration ───────────────────────────────────────────────

function migrateEntries() {
  let dirty = false;
  const fallback = DEFAULT_ACCOUNTS[0];
  for (const entry of state.entries) {
    if (typeof entry.account !== "string" || !entry.account.trim()) {
      entry.account = fallback;
      dirty = true;
    }
  }
  if (dirty) persistEntries();
}

// ─── Accounts ────────────────────────────────────────────────

function loadCustomAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sanitizeCustomCategoryList(parsed, DEFAULT_ACCOUNTS);
  } catch {
    return [];
  }
}

function persistCustomAccounts() {
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(state.customAccounts));
}

function getAllAccounts() {
  return uniqueCategoryList([...DEFAULT_ACCOUNTS, ...state.customAccounts]);
}

function syncAccountOptions(targetSelect) {
  const accounts = getAllAccounts();
  const prev = targetSelect.value;
  targetSelect.innerHTML = "";
  for (const account of accounts) {
    const option = document.createElement("option");
    option.value = account;
    option.textContent = account;
    targetSelect.appendChild(option);
  }
  if (prev && accounts.includes(prev)) targetSelect.value = prev;
}

function syncAccountFilterOptions() {
  const accounts = getAllAccounts();
  const prev = state.account;
  els.accountFilter.innerHTML = "";

  const allOpt = document.createElement("option");
  allOpt.value = "all";
  allOpt.textContent = "全部帳戶";
  els.accountFilter.appendChild(allOpt);

  for (const account of accounts) {
    const option = document.createElement("option");
    option.value = account;
    option.textContent = account;
    els.accountFilter.appendChild(option);
  }

  if (prev && (prev === "all" || accounts.includes(prev))) {
    els.accountFilter.value = prev;
  } else {
    els.accountFilter.value = "all";
    state.account = "all";
  }
}

function renderCustomAccountList() {
  els.customAccountList.innerHTML = "";

  if (!state.customAccounts.length) {
    const empty = document.createElement("li");
    empty.className = "chip-empty";
    empty.textContent = "目前沒有自訂帳戶";
    els.customAccountList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const account of state.customAccounts) {
    const li = document.createElement("li");
    li.className = "chip-item";

    const text = document.createElement("span");
    text.textContent = account;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "chip-delete";
    removeBtn.dataset.account = account;
    removeBtn.setAttribute("aria-label", `刪除 ${account}`);
    removeBtn.textContent = "×";

    li.appendChild(text);
    li.appendChild(removeBtn);
    fragment.appendChild(li);
  }

  els.customAccountList.appendChild(fragment);
}

function onAddCustomAccount() {
  const account = normalizeCategoryName(els.customAccountInput.value);

  if (!account) {
    updateHint("請先輸入自訂帳戶名稱。", true);
    return;
  }
  if (account.length > 12) {
    updateHint("帳戶名稱最多 12 個字元。", true);
    return;
  }
  if (getAllAccounts().includes(account)) {
    updateHint("這個帳戶已存在。", true);
    return;
  }

  state.customAccounts.push(account);
  state.customAccounts = sanitizeCustomCategoryList(state.customAccounts, DEFAULT_ACCOUNTS);
  persistCustomAccounts();

  els.customAccountInput.value = "";
  syncAccountOptions(els.accountInput);
  syncAccountOptions(els.recurringAccount);
  syncAccountFilterOptions();
  renderCustomAccountList();
  els.accountInput.value = account;
  render();
  updateHint(`已新增「${account}」帳戶。`, false);
}

function onCustomAccountListAction(event) {
  const target = event.target.closest("button[data-account]");
  if (!target) return;
  const account = target.dataset.account;
  if (!account) return;

  const inUse = state.entries.some((entry) => (entry.account || DEFAULT_ACCOUNTS[0]) === account);
  if (inUse) {
    const yes = confirm(`「${account}」已被部分交易使用，刪除後這些交易會歸到「${DEFAULT_ACCOUNTS[0]}」。確定刪除？`);
    if (!yes) return;
    for (const entry of state.entries) {
      if ((entry.account || DEFAULT_ACCOUNTS[0]) === account) {
        entry.account = DEFAULT_ACCOUNTS[0];
      }
    }
    persistEntries();
  }

  state.customAccounts = state.customAccounts.filter((item) => item !== account);
  persistCustomAccounts();
  syncAccountOptions(els.accountInput);
  syncAccountOptions(els.recurringAccount);
  syncAccountFilterOptions();
  renderCustomAccountList();
  render();
  updateHint(`已刪除「${account}」自訂帳戶。`, false);
}

// ─── Budget ──────────────────────────────────────────────────

function loadBudget() {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (!raw) return { monthlyExpense: 0 };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { monthlyExpense: 0 };
    const monthlyExpense = Number(parsed.monthlyExpense);
    return {
      monthlyExpense: Number.isFinite(monthlyExpense) && monthlyExpense >= 0 ? monthlyExpense : 0
    };
  } catch {
    return { monthlyExpense: 0 };
  }
}

function persistBudget() {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(state.budget));
}

function onBudgetInput(event) {
  const value = Number(event.target.value);
  state.budget.monthlyExpense = Number.isFinite(value) && value >= 0 ? value : 0;
  persistBudget();
  renderBudget();
}

function renderBudget() {
  const budget = state.budget.monthlyExpense || 0;
  const month = state.month || getCurrentMonth();
  let spent = 0;
  for (const entry of state.entries) {
    if (entry.type !== "expense") continue;
    if (!entry.date.startsWith(month)) continue;
    spent += entry.amount;
  }

  if (!budget || budget <= 0) {
    els.budgetStatus.textContent = "尚未設定";
    els.budgetStatus.className = "budget-status";
    els.budgetBar.style.width = "0%";
    els.budgetBar.className = "budget-bar";
    return;
  }

  const ratio = spent / budget;
  const pct = Math.min(ratio * 100, 100);
  const remaining = budget - spent;

  els.budgetBar.style.width = `${pct.toFixed(2)}%`;
  els.budgetBar.className = "budget-bar";
  els.budgetStatus.className = "budget-status";

  if (ratio >= 1) {
    els.budgetBar.classList.add("over");
    els.budgetStatus.classList.add("over");
    els.budgetStatus.textContent = `超支 ${formatCurrency(spent - budget)}（${(ratio * 100).toFixed(0)}%）`;
  } else if (ratio >= 0.8) {
    els.budgetBar.classList.add("warn");
    els.budgetStatus.classList.add("warn");
    els.budgetStatus.textContent = `已用 ${(ratio * 100).toFixed(0)}%・剩 ${formatCurrency(remaining)}`;
  } else {
    els.budgetStatus.classList.add("safe");
    els.budgetStatus.textContent = `已用 ${(ratio * 100).toFixed(0)}%・剩 ${formatCurrency(remaining)}`;
  }
}

// ─── Account Balances ────────────────────────────────────────

function renderAccountBalances() {
  const accounts = getAllAccounts();
  const balances = new Map(accounts.map((a) => [a, 0]));

  for (const entry of state.entries) {
    const account = entry.account || DEFAULT_ACCOUNTS[0];
    const current = balances.get(account) || 0;
    const sign = entry.type === "income" ? 1 : -1;
    balances.set(account, current + sign * entry.amount);
  }

  els.accountBalances.innerHTML = "";
  const fragment = document.createDocumentFragment();
  for (const account of accounts) {
    const balance = balances.get(account) || 0;
    if (balance === 0 && !state.entries.some((e) => (e.account || DEFAULT_ACCOUNTS[0]) === account)) {
      continue;
    }
    const li = document.createElement("li");
    li.className = "account-item";

    const name = document.createElement("span");
    name.className = "account-item-name";
    name.textContent = account;

    const amount = document.createElement("span");
    amount.className = "account-item-amount";
    if (balance < 0) amount.classList.add("negative");
    amount.textContent = formatCurrency(balance);

    li.appendChild(name);
    li.appendChild(amount);
    fragment.appendChild(li);
  }

  if (!fragment.childElementCount) {
    const empty = document.createElement("li");
    empty.className = "chip-empty";
    empty.textContent = "尚無交易資料";
    els.accountBalances.appendChild(empty);
    return;
  }
  els.accountBalances.appendChild(fragment);
}

// ─── Calendar Heatmap ────────────────────────────────────────

function renderCalendarHeatmap() {
  if (!els.calendarHeatmap) return;

  const month = state.month || getCurrentMonth();
  const [year, mon] = month.split("-").map(Number);
  if (!year || !mon) {
    els.calendarHeatmap.innerHTML = "";
    return;
  }

  const firstWeekday = new Date(year, mon - 1, 1).getDay();
  const daysInMonth = new Date(year, mon, 0).getDate();
  const today = toDateInputValue(new Date());

  const dailyTotals = new Map();
  for (const entry of state.entries) {
    if (entry.type !== "expense") continue;
    if (!entry.date.startsWith(month)) continue;
    dailyTotals.set(entry.date, (dailyTotals.get(entry.date) || 0) + entry.amount);
  }
  const max = Math.max(0, ...dailyTotals.values());

  els.calendarHeatmap.innerHTML = "";

  const dowRow = document.createElement("div");
  dowRow.className = "calendar-grid calendar-dow";
  for (const dow of ["日", "一", "二", "三", "四", "五", "六"]) {
    const cell = document.createElement("div");
    cell.className = "calendar-dow-cell";
    cell.textContent = dow;
    dowRow.appendChild(cell);
  }
  els.calendarHeatmap.appendChild(dowRow);

  const grid = document.createElement("div");
  grid.className = "calendar-grid calendar-days";

  for (let i = 0; i < firstWeekday; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell calendar-blank";
    grid.appendChild(cell);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    const total = dailyTotals.get(dateStr) || 0;
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-cell";
    cell.dataset.date = dateStr;

    let level = 0;
    if (max > 0 && total > 0) {
      const ratio = total / max;
      if (ratio >= 0.75) level = 4;
      else if (ratio >= 0.5) level = 3;
      else if (ratio >= 0.25) level = 2;
      else level = 1;
    }
    cell.dataset.level = String(level);

    if (dateStr === today) cell.classList.add("calendar-today");
    if (state.specificDay === dateStr) cell.classList.add("calendar-selected");

    const dayLabel = document.createElement("span");
    dayLabel.className = "calendar-day-num";
    dayLabel.textContent = String(d);
    cell.appendChild(dayLabel);

    if (total > 0) {
      const amt = document.createElement("span");
      amt.className = "calendar-day-amount";
      amt.textContent = formatCompact(total);
      cell.appendChild(amt);
      cell.title = `${dateStr} 支出 ${formatCurrency(total)}`;
    } else {
      cell.title = `${dateStr}（無支出）`;
    }

    grid.appendChild(cell);
  }

  els.calendarHeatmap.appendChild(grid);
}

function renderCalendarStatus() {
  if (!els.calendarStatus || !els.calendarStatusText) return;
  if (state.specificDay) {
    els.calendarStatus.hidden = false;
    els.calendarStatusText.textContent = `已篩選 ${formatDate(state.specificDay)}`;
  } else {
    els.calendarStatus.hidden = true;
    els.calendarStatusText.textContent = "";
  }
}

function onCalendarCellClick(event) {
  const cell = event.target.closest("button.calendar-cell[data-date]");
  if (!cell) return;
  const date = cell.dataset.date;
  if (state.specificDay === date) {
    state.specificDay = null;
    state.quickRange = state.month ? "customMonth" : "month";
  } else {
    state.specificDay = date;
    state.quickRange = "specificDay";
  }
  render();
}

function renderCalendarDayDetail() {
  if (!els.calendarDayDetail) return;
  const date = state.specificDay;
  if (!date) {
    els.calendarDayDetail.hidden = true;
    return;
  }

  els.calendarDayDetail.hidden = false;
  if (els.dayDetailDate) els.dayDetailDate.textContent = formatDate(date);

  const dayEntries = state.entries
    .filter((entry) => entry.date === date)
    .sort((a, b) => b.createdAt - a.createdAt);

  let income = 0;
  let expense = 0;
  for (const entry of dayEntries) {
    if (entry.type === "income") income += entry.amount;
    else if (entry.type === "expense") expense += entry.amount;
  }
  if (els.dayDetailIncome) els.dayDetailIncome.textContent = formatCurrency(income);
  if (els.dayDetailExpense) els.dayDetailExpense.textContent = formatCurrency(expense);
  if (els.dayDetailBalance) els.dayDetailBalance.textContent = formatCurrency(income - expense);

  if (els.dayDetailList) {
    els.dayDetailList.innerHTML = "";
    for (const entry of dayEntries) {
      const li = document.createElement("li");
      li.className = `day-detail-item day-detail-item-${entry.type}`;

      const left = document.createElement("div");
      left.className = "day-detail-item-main";
      const cat = document.createElement("span");
      cat.className = "day-detail-item-cat";
      cat.textContent = `${getCategoryIcon(entry.type, entry.category)} ${entry.category}`;
      left.appendChild(cat);
      if (entry.note) {
        const note = document.createElement("span");
        note.className = "day-detail-item-note";
        note.textContent = entry.note;
        left.appendChild(note);
      }

      const amt = document.createElement("strong");
      amt.className = "day-detail-item-amount";
      const sign = entry.type === "income" ? "+" : "-";
      amt.textContent = `${sign}${formatCurrency(entry.amount)}`;

      li.appendChild(left);
      li.appendChild(amt);
      els.dayDetailList.appendChild(li);
    }
  }

  if (els.dayDetailEmpty) {
    els.dayDetailEmpty.hidden = dayEntries.length > 0;
  }
  if (els.dayDetailGoto) {
    els.dayDetailGoto.hidden = dayEntries.length === 0;
  }
}

function clearCalendarSpecificDay() {
  if (!state.specificDay) return;
  state.specificDay = null;
  state.quickRange = state.month ? "customMonth" : "month";
  render();
}

// ─── Trend Chart ─────────────────────────────────────────────

function renderTrendChart() {
  const months = lastNMonths(TREND_MONTHS);
  const data = months.map((m) => ({ month: m, income: 0, expense: 0 }));
  const indexByMonth = new Map(months.map((m, i) => [m, i]));

  for (const entry of state.entries) {
    const m = entry.date.slice(0, 7);
    const idx = indexByMonth.get(m);
    if (idx === undefined) continue;
    if (entry.type === "income") data[idx].income += entry.amount;
    else data[idx].expense += entry.amount;
  }

  els.trendChart.innerHTML = "";

  const hasAny = data.some((d) => d.income > 0 || d.expense > 0);
  if (!hasAny) {
    const empty = document.createElement("p");
    empty.className = "trend-empty";
    empty.textContent = "尚無資料可繪圖。";
    els.trendChart.appendChild(empty);
    return;
  }

  const max = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);
  const niceMax = niceCeil(max);

  const isNarrow = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(max-width: 759px)").matches
    : false;

  const W = 600;
  const H = isNarrow ? 150 : 220;
  const padL = 44;
  const padR = 12;
  const padT = isNarrow ? 8 : 12;
  const padB = isNarrow ? 26 : 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const groupW = innerW / data.length;
  const barW = Math.min(20, groupW * 0.36);
  const gap = 2;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "近 6 個月收入與支出趨勢");

  for (let i = 0; i <= 4; i++) {
    const ratio = i / 4;
    const y = padT + innerH - ratio * innerH;
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", padL);
    line.setAttribute("x2", W - padR);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("class", "trend-grid-line");
    svg.appendChild(line);

    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", padL - 6);
    label.setAttribute("y", y + 3);
    label.setAttribute("text-anchor", "end");
    label.setAttribute("class", "trend-tick-label");
    label.textContent = formatCompact(niceMax * ratio);
    svg.appendChild(label);
  }

  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const cx = padL + groupW * (i + 0.5);

    const incomeH = niceMax > 0 ? (d.income / niceMax) * innerH : 0;
    const expenseH = niceMax > 0 ? (d.expense / niceMax) * innerH : 0;

    const incomeRect = document.createElementNS(svgNS, "rect");
    incomeRect.setAttribute("class", "trend-bar-income");
    incomeRect.setAttribute("x", cx - barW - gap / 2);
    incomeRect.setAttribute("y", padT + innerH - incomeH);
    incomeRect.setAttribute("width", barW);
    incomeRect.setAttribute("height", incomeH);
    incomeRect.setAttribute("rx", 2);
    const incomeTitle = document.createElementNS(svgNS, "title");
    incomeTitle.textContent = `${d.month} 收入 ${formatCurrency(d.income)}`;
    incomeRect.appendChild(incomeTitle);
    svg.appendChild(incomeRect);

    const expenseRect = document.createElementNS(svgNS, "rect");
    expenseRect.setAttribute("class", "trend-bar-expense");
    expenseRect.setAttribute("x", cx + gap / 2);
    expenseRect.setAttribute("y", padT + innerH - expenseH);
    expenseRect.setAttribute("width", barW);
    expenseRect.setAttribute("height", expenseH);
    expenseRect.setAttribute("rx", 2);
    const expenseTitle = document.createElementNS(svgNS, "title");
    expenseTitle.textContent = `${d.month} 支出 ${formatCurrency(d.expense)}`;
    expenseRect.appendChild(expenseTitle);
    svg.appendChild(expenseRect);

    const monthLabel = document.createElementNS(svgNS, "text");
    monthLabel.setAttribute("x", cx);
    monthLabel.setAttribute("y", H - padB + 18);
    monthLabel.setAttribute("text-anchor", "middle");
    monthLabel.setAttribute("class", "trend-tick-label");
    monthLabel.textContent = d.month.slice(5) + "月";
    svg.appendChild(monthLabel);
  }

  els.trendChart.appendChild(svg);

  const legend = document.createElement("div");
  legend.className = "trend-legend";
  legend.innerHTML = `
    <span><span class="trend-legend-dot income"></span>收入</span>
    <span><span class="trend-legend-dot expense"></span>支出</span>
  `;
  els.trendChart.appendChild(legend);
}

function lastNMonths(n) {
  const result = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    result.push(`${y}-${m}`);
  }
  return result;
}

function niceCeil(value) {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const fraction = value / exp;
  let nice;
  if (fraction <= 1) nice = 1;
  else if (fraction <= 2) nice = 2;
  else if (fraction <= 5) nice = 5;
  else nice = 10;
  return nice * exp;
}

function formatCompact(num) {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
  return String(Math.round(num));
}

// ─── Recurring ───────────────────────────────────────────────

function loadRecurring() {
  try {
    const raw = localStorage.getItem(RECURRING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidRecurringRule);
  } catch {
    return [];
  }
}

function persistRecurring() {
  localStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(state.recurring));
}

function isValidRecurringRule(rule) {
  if (!rule || typeof rule !== "object") return false;
  if (typeof rule.id !== "string") return false;
  if (rule.type !== "income" && rule.type !== "expense") return false;
  if (typeof rule.amount !== "number" || !Number.isFinite(rule.amount) || rule.amount <= 0) return false;
  if (typeof rule.category !== "string" || !rule.category) return false;
  if (typeof rule.account !== "string" || !rule.account) return false;
  if (rule.frequency !== "monthly" && rule.frequency !== "weekly") return false;
  if (typeof rule.startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(rule.startDate)) return false;
  if (rule.frequency === "monthly") {
    if (!Number.isInteger(rule.dayOfMonth) || rule.dayOfMonth < 1 || rule.dayOfMonth > 31) return false;
  } else {
    if (!Number.isInteger(rule.dayOfWeek) || rule.dayOfWeek < 0 || rule.dayOfWeek > 6) return false;
  }
  return true;
}

function syncRecurringDayOfMonthOptions() {
  els.recurringDayOfMonth.innerHTML = "";
  for (let i = 1; i <= 31; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${i} 號`;
    els.recurringDayOfMonth.appendChild(opt);
  }
}

function toggleRecurringForm() {
  if (els.recurringForm.hidden) {
    showRecurringForm();
  } else {
    hideRecurringForm();
  }
}

function showRecurringForm() {
  syncCategoryOptions(els.recurringType.value, "", els.recurringCategory);
  syncAccountOptions(els.recurringAccount);
  els.recurringStartDate.value = toDateInputValue(new Date());
  els.recurringDayOfMonth.value = String(new Date().getDate());
  els.recurringDayOfWeek.value = String(new Date().getDay());
  els.recurringFrequency.value = "monthly";
  onRecurringFrequencyChange();
  els.recurringForm.hidden = false;
  els.toggleRecurringFormBtn.textContent = "− 收起表單";
}

function hideRecurringForm(reset = false) {
  els.recurringForm.hidden = true;
  els.toggleRecurringFormBtn.textContent = "+ 新增規則";
  if (reset) {
    els.recurringForm.reset();
  }
}

function onRecurringFrequencyChange() {
  const freq = els.recurringFrequency.value;
  els.recurringDayOfMonthLabel.hidden = freq !== "monthly";
  els.recurringDayOfWeekLabel.hidden = freq !== "weekly";
}

function onCreateRecurringRule(event) {
  event.preventDefault();

  const type = els.recurringType.value;
  const amount = Number(els.recurringAmount.value);
  const frequency = els.recurringFrequency.value;
  const category = els.recurringCategory.value;
  const account = els.recurringAccount.value;
  const startDate = els.recurringStartDate.value;
  const note = els.recurringNote.value.trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("請輸入大於 0 的金額。", { duration: 2400 });
    return;
  }
  if (!category) {
    showToast("請先選擇分類。", { duration: 2400 });
    return;
  }
  if (!account) {
    showToast("請先選擇帳戶。", { duration: 2400 });
    return;
  }
  if (!startDate) {
    showToast("請選擇開始日期。", { duration: 2400 });
    return;
  }

  const rule = {
    id: (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : `rule_${Date.now()}_${Math.random()}`,
    type,
    amount,
    category,
    account,
    note,
    frequency,
    startDate,
    lastGenerated: null,
    active: true,
    createdAt: Date.now()
  };

  if (frequency === "monthly") {
    rule.dayOfMonth = Number(els.recurringDayOfMonth.value);
  } else {
    rule.dayOfWeek = Number(els.recurringDayOfWeek.value);
  }

  state.recurring.push(rule);
  persistRecurring();
  hideRecurringForm(true);
  generateRecurringEntries({ silentNone: true });
  render();
  showToast("已新增固定收支規則。");
}

function onRecurringListAction(event) {
  const toggleBtn = event.target.closest("button.recurring-toggle[data-id]");
  if (toggleBtn) {
    toggleRecurringRule(toggleBtn.dataset.id);
    return;
  }
  const deleteBtn = event.target.closest("button.recurring-delete[data-id]");
  if (deleteBtn) {
    deleteRecurringRule(deleteBtn.dataset.id);
  }
}

function toggleRecurringRule(id) {
  const rule = state.recurring.find((r) => r.id === id);
  if (!rule) return;
  rule.active = !rule.active;
  persistRecurring();
  if (rule.active) generateRecurringEntries({ silentNone: true });
  render();
  showToast(rule.active ? "已啟用規則。" : "已停用規則。", { duration: 1800 });
}

function deleteRecurringRule(id) {
  const rule = state.recurring.find((r) => r.id === id);
  if (!rule) return;
  const yes = confirm(`確定刪除規則「${rule.note || rule.category}」？已產生的歷史交易不會被刪除。`);
  if (!yes) return;

  state.recurring = state.recurring.filter((r) => r.id !== id);
  persistRecurring();
  render();
  showToast("已刪除規則。", { duration: 1800 });
}

function renderRecurringList() {
  els.recurringList.innerHTML = "";

  if (!state.recurring.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "尚無固定收支規則。";
    els.recurringList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const rule of state.recurring) {
    const li = document.createElement("li");
    li.className = "recurring-item";
    if (!rule.active) li.classList.add("inactive");

    const info = document.createElement("div");
    info.className = "recurring-info";

    const top = document.createElement("div");
    top.className = "recurring-info-top";

    const pill = document.createElement("span");
    pill.className = `pill ${rule.type}`;
    pill.textContent = rule.type === "income" ? "收入" : "支出";

    const amount = document.createElement("strong");
    amount.textContent = formatCurrency(rule.amount);

    const ruleIcon = getCategoryIcon(rule.type, rule.category);
    const title = document.createElement("span");
    title.textContent = rule.note ? `${ruleIcon} ${rule.note}` : `${ruleIcon} ${rule.category}`;

    top.appendChild(pill);
    top.appendChild(amount);
    top.appendChild(title);

    const meta = document.createElement("p");
    meta.className = "recurring-info-meta";
    const freqLabel = rule.frequency === "monthly"
      ? `每月 ${rule.dayOfMonth} 號`
      : `每週${WEEKDAY_LABELS[rule.dayOfWeek]}`;
    meta.textContent = `${freqLabel}・${ruleIcon} ${rule.category}・${rule.account}・自 ${formatDate(rule.startDate)}`;

    info.appendChild(top);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "recurring-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "recurring-toggle";
    if (!rule.active) toggleBtn.classList.add("paused");
    toggleBtn.dataset.id = rule.id;
    toggleBtn.textContent = rule.active ? "啟用中" : "已停用";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "recurring-delete";
    deleteBtn.dataset.id = rule.id;
    deleteBtn.textContent = "刪除";

    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(info);
    li.appendChild(actions);
    fragment.appendChild(li);
  }
  els.recurringList.appendChild(fragment);
}

function generateRecurringEntries({ silentNone = false } = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let generated = 0;
  let touched = false;

  for (const rule of state.recurring) {
    if (!rule.active) continue;

    const startCursor = nextOccurrenceFrom(rule, rule.lastGenerated || prevDay(rule.startDate));
    let cursor = startCursor;
    while (cursor && cursor <= today) {
      const dateStr = toDateInputValue(cursor);
      if (dateStr >= rule.startDate) {
        const entry = {
          id: (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}_${Math.random()}`,
          type: rule.type,
          amount: rule.amount,
          category: rule.category,
          account: rule.account,
          date: dateStr,
          note: rule.note || "",
          createdAt: Date.now(),
          recurringId: rule.id
        };
        state.entries.unshift(entry);
        rule.lastGenerated = dateStr;
        generated++;
        touched = true;
      }
      cursor = nextOccurrenceAfter(rule, cursor);
    }
  }

  if (touched) {
    persistEntries();
    persistRecurring();
  }

  if (generated > 0) {
    showToast(`自動補上 ${generated} 筆固定收支。`, { duration: 3200 });
  } else if (!silentNone && state.recurring.length > 0) {
    // No-op: nothing new to generate
  }
}

function nextOccurrenceFrom(rule, fromDateStr) {
  const fromDate = new Date(`${fromDateStr}T00:00:00`);
  if (Number.isNaN(fromDate.getTime())) return null;
  return nextOccurrenceAfter(rule, fromDate);
}

function nextOccurrenceAfter(rule, afterDate) {
  if (rule.frequency === "monthly") {
    const next = new Date(afterDate.getFullYear(), afterDate.getMonth(), 1);
    for (let i = 0; i < 24; i++) {
      const lastDay = lastDayOfMonth(next.getFullYear(), next.getMonth());
      const day = Math.min(rule.dayOfMonth, lastDay);
      const candidate = new Date(next.getFullYear(), next.getMonth(), day);
      candidate.setHours(0, 0, 0, 0);
      if (candidate > afterDate) return candidate;
      next.setMonth(next.getMonth() + 1);
    }
    return null;
  }
  const next = new Date(afterDate);
  next.setHours(0, 0, 0, 0);
  do {
    next.setDate(next.getDate() + 1);
  } while (next.getDay() !== rule.dayOfWeek);
  return next;
}

function prevDay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return toDateInputValue(d);
}

function lastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Category Icons ──────────────────────────────────────

function loadCategoryIcons() {
  const blank = { expense: {}, income: {} };
  try {
    const raw = localStorage.getItem(CATEGORY_ICON_STORAGE_KEY);
    if (!raw) return blank;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return blank;
    return {
      expense: parsed.expense && typeof parsed.expense === "object" ? { ...parsed.expense } : {},
      income: parsed.income && typeof parsed.income === "object" ? { ...parsed.income } : {}
    };
  } catch {
    return blank;
  }
}

function persistCategoryIcons() {
  localStorage.setItem(CATEGORY_ICON_STORAGE_KEY, JSON.stringify(state.categoryIcons));
}

function getCategoryIcon(type, name) {
  const t = type === "income" ? "income" : "expense";
  if (state.categoryIcons[t] && state.categoryIcons[t][name]) {
    return state.categoryIcons[t][name];
  }
  if (DEFAULT_CATEGORY_ICONS[t] && DEFAULT_CATEGORY_ICONS[t][name]) {
    return DEFAULT_CATEGORY_ICONS[t][name];
  }
  return FALLBACK_ICON;
}

function setCategoryIcon(type, name, icon) {
  const t = type === "income" ? "income" : "expense";
  if (!icon) return;
  state.categoryIcons[t] = state.categoryIcons[t] || {};
  state.categoryIcons[t][name] = icon;
  persistCategoryIcons();
}

// ─── Tab navigation ──────────────────────────────────────

function setupTabs() {
  els.tabBar.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-tab-target]");
    if (!btn) return;
    setActiveTab(btn.dataset.tabTarget);
  });
  setActiveTab(state.prefs.activeTab || DEFAULT_TAB, { silent: true });

  // Keep tab bar & FAB pinned to the visual viewport bottom
  // when the browser zooms, scrolls, or the soft keyboard appears.
  if (window.visualViewport) {
    const fixTabBarPosition = () => {
      const vv = window.visualViewport;
      const offsetY = window.innerHeight - (vv.height + vv.offsetTop);
      const scale = vv.scale;
      if (Math.abs(scale - 1) > 0.01 || Math.abs(offsetY) > 1) {
        els.tabBar.style.transform = `translate3d(0, ${-offsetY}px, 0) scale(${1 / scale})`;
        els.tabBar.style.transformOrigin = "center bottom";
        els.fabBtn.style.transform = `translate3d(0, ${-offsetY}px, 0) scale(${1 / scale})`;
        els.fabBtn.style.transformOrigin = "right bottom";
      } else {
        els.tabBar.style.transform = "translate3d(0, 0, 0)";
        els.tabBar.style.transformOrigin = "";
        els.fabBtn.style.transform = "";
        els.fabBtn.style.transformOrigin = "";
      }
    };
    window.visualViewport.addEventListener("resize", fixTabBarPosition);
    window.visualViewport.addEventListener("scroll", fixTabBarPosition);
  }
}

function setActiveTab(name, { silent = false } = {}) {
  if (!TAB_NAMES.includes(name)) name = DEFAULT_TAB;
  state.activeTab = name;
  document.body.dataset.activeTab = name;
  state.prefs.activeTab = name;
  persistPrefs();

  for (const btn of els.tabBar.querySelectorAll("button[data-tab-target]")) {
    if (btn.dataset.tabTarget === name) {
      btn.setAttribute("aria-current", "page");
    } else {
      btn.removeAttribute("aria-current");
    }
  }

  if (state.numpadActive) closeNumpad();

  if (!silent) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// ─── FAB ─────────────────────────────────────────────────

function setupFab() {
  els.fabBtn.hidden = false;
  els.fabBtn.addEventListener("click", () => {
    setActiveTab("record");
    setTimeout(() => {
      els.amountInput.scrollIntoView({ behavior: "smooth", block: "center" });
      els.amountInput.focus();
    }, 80);
  });
}

// ─── Numpad ──────────────────────────────────────────────

function setupNumpad() {
  const mq = window.matchMedia ? window.matchMedia : null;
  const isMobileViewport = mq ? mq("(max-width: 759px)").matches : false;
  const isCoarse = mq ? mq("(pointer: coarse)").matches : false;
  const useCustomKeypad = isCoarse && isMobileViewport;

  if (!useCustomKeypad) {
    els.amountInput.setAttribute("inputmode", "decimal");
    els.amountInput.removeAttribute("readonly");
    return;
  }

  els.amountInput.setAttribute("inputmode", "none");
  els.amountInput.setAttribute("readonly", "readonly");

  els.amountInput.addEventListener("focus", openNumpad);
  els.amountInput.addEventListener("click", openNumpad);

  els.numpad.addEventListener("click", onNumpadClick);

  document.addEventListener("click", (event) => {
    if (!state.numpadActive) return;
    if (event.target.closest("#numpad")) return;
    if (event.target.closest("#amountInput")) return;
    if (event.target.closest("#fabBtn")) return;
    closeNumpad();
  }, true);
}

function openNumpad() {
  if (state.numpadActive) return;
  state.numpadActive = true;
  els.numpad.hidden = false;
  updateNumpadDisplay();
}

function closeNumpad() {
  if (!state.numpadActive) return;
  state.numpadActive = false;
  els.numpad.hidden = true;
}

function onNumpadClick(event) {
  const btn = event.target.closest("button[data-np]");
  if (!btn) return;
  const key = btn.dataset.np;

  if (key === "done") {
    closeNumpad();
    return;
  }
  if (key === "clear") {
    els.amountInput.value = "";
    updateAmountPreview();
    updateNumpadDisplay();
    return;
  }
  if (key === "back") {
    els.amountInput.value = els.amountInput.value.slice(0, -1);
    updateAmountPreview();
    updateNumpadDisplay();
    return;
  }
  if (key === "eq") {
    const val = evaluateAmount(els.amountInput.value);
    if (Number.isFinite(val) && val > 0) {
      els.amountInput.value = String(val);
      updateAmountPreview();
      updateNumpadDisplay();
    }
    return;
  }

  els.amountInput.value = `${els.amountInput.value || ""}${key}`;
  updateAmountPreview();
  updateNumpadDisplay();
}

function updateNumpadDisplay() {
  if (!els.numpadDisplay) return;
  const raw = els.amountInput.value || "0";
  const result = evaluateAmount(raw);
  if (Number.isFinite(result) && /[+\-*/]/.test(raw)) {
    els.numpadDisplay.innerHTML = `${escapeHtml(raw)}<span class="np-eq-result">= ${escapeHtml(formatCurrency(result))}</span>`;
  } else {
    els.numpadDisplay.textContent = raw;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

// ─── Icon Picker ─────────────────────────────────────────

function setupIconPicker() {
  els.iconPickerClose.addEventListener("click", closeIconPicker);
  els.iconPickerOverlay.addEventListener("click", closeIconPicker);
  els.iconPickerTabs.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-group-index]");
    if (!btn) return;
    renderIconPickerGrid(Number(btn.dataset.groupIndex));
    for (const tab of els.iconPickerTabs.querySelectorAll("button")) {
      tab.classList.toggle("active", tab === btn);
    }
  });
  els.iconPickerGrid.addEventListener("click", (event) => {
    const cell = event.target.closest("button[data-emoji]");
    if (!cell) return;
    const emoji = cell.dataset.emoji;
    if (state.iconPickerContext && typeof state.iconPickerContext.onPick === "function") {
      state.iconPickerContext.onPick(emoji);
    }
    closeIconPicker();
  });
}

function setupCategoryIconPicker() {
  els.pickCategoryIconBtn.addEventListener("click", () => {
    openIconPicker({
      title: "選擇新分類圖示",
      currentIcon: state.pendingCategoryIcon || FALLBACK_ICON,
      onPick: (emoji) => {
        state.pendingCategoryIcon = emoji;
        if (els.pendingCategoryIcon) els.pendingCategoryIcon.textContent = emoji;
      }
    });
  });
}

function openIconPicker({ title, currentIcon, onPick }) {
  state.iconPickerContext = { onPick, currentIcon: currentIcon || FALLBACK_ICON };
  els.iconPickerTitle.textContent = title || "選擇圖示";
  els.iconPicker.hidden = false;
  renderIconPickerTabs();
  renderIconPickerGrid(0);
}

function closeIconPicker() {
  els.iconPicker.hidden = true;
  state.iconPickerContext = null;
}

function renderIconPickerTabs() {
  els.iconPickerTabs.innerHTML = "";
  for (let i = 0; i < EMOJI_GROUPS.length; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "icon-picker-tab" + (i === 0 ? " active" : "");
    btn.dataset.groupIndex = String(i);
    btn.textContent = EMOJI_GROUPS[i].name;
    els.iconPickerTabs.appendChild(btn);
  }
}

function renderIconPickerGrid(groupIndex) {
  els.iconPickerGrid.innerHTML = "";
  const group = EMOJI_GROUPS[groupIndex];
  if (!group) return;
  const current = state.iconPickerContext ? state.iconPickerContext.currentIcon : "";
  const fragment = document.createDocumentFragment();
  for (const emoji of group.emojis) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "icon-picker-cell" + (emoji === current ? " selected" : "");
    cell.dataset.emoji = emoji;
    cell.textContent = emoji;
    fragment.appendChild(cell);
  }
  els.iconPickerGrid.appendChild(fragment);
}

init();
