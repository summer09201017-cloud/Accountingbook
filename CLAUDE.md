# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A pure-frontend PWA personal accounting app (日日記帳) targeting Traditional Chinese users. No build system, no dependencies, no tests — just `index.html` + `app.js` + `styles.css` + service worker. UI strings are in zh-Hant; currency is TWD.

## Running locally

```
python -m http.server 8000
# open http://localhost:8000
```

A static server is required for the service worker to register (opening `index.html` from `file://` disables PWA install and offline cache). Any equivalent static server works.

## Sanity-checking changes

There is no test runner or linter. After editing `app.js`, run:

```
node --check app.js
```

For UI changes, the only meaningful verification is opening the page in a browser and exercising the affected feature.

## Service worker cache versioning

`service-worker.js` has `CACHE_NAME = "ledger-pwa-vN"`. **Bump N whenever you change `index.html`, `app.js`, or `styles.css`**, otherwise installed PWAs will keep serving stale assets. The activate handler deletes any cache whose name doesn't match the current `CACHE_NAME`, so bumping is the only step needed. Current version: **v13**.

## Architecture

### Single-file state machine

All runtime state lives in one `state` object at the top of `app.js`. The flow is strictly:

```
event → mutate state → persist<Slice>() → render()
```

`render()` is the only rerender entry point. It calls every sub-renderer (`renderList`, `renderTotals`, `renderCategoryChart`, `renderDonutChart`, `renderBudget`, `renderAccountBalances`, `renderTrendChart`, `renderCalendarHeatmap`, `renderCalendarStatus`, `renderReport`, `renderRecurringList`, `renderAnnualReport`, `renderAchievements`, `renderCategoryBudgetList`). Sub-renderers read from `state` and write to the DOM idempotently — no virtual DOM, no diffing.

Tab/FAB/numpad/icon-picker setup runs once in `init()` via `setupTabs()`, `setupFab()`, `setupNumpad()`, `setupIconPicker()`, `setupCategoryIconPicker()`, `setupPhotoAttach()`, `setupAnnualReport()`, `setupCategoryBudgets()`, `setupReminder()`, `setupPhotoViewer()` — they wire DOM listeners and don't participate in `render()`.

When adding a new feature: add a state slice, a `load<Slice>` / `persist<Slice>` pair, a `render<Slice>` function, and call it from `render()`.

### Storage layout

Each state slice has its own localStorage key with a `_v1` (or `_v2`) suffix:

| Key                              | Holds                                                                  |
|----------------------------------|------------------------------------------------------------------------|
| `ledger_entries_v1`              | array of transactions (may include `photo` as base64 data URI)         |
| `ledger_custom_categories_v1`    | `{ expense: [...], income: [...] }` — names only, icons stored separately |
| `ledger_custom_accounts_v1`      | array of custom account names                                          |
| `ledger_category_icons_v1`       | `{ expense: { name: emoji }, income: { name: emoji } }`                |
| `ledger_budget_v1`               | `{ monthlyExpense: number }`                                           |
| `ledger_category_budgets_v1`     | per-category budget map `{ categoryName: number }`                     |
| `ledger_recurring_v1`            | array of recurring rules                                               |
| `ledger_prefs_v1`                | theme + last-selected type/category/account + `activeTab`              |
| `ledger_achievements_v1`         | set of unlocked achievement IDs                                        |
| `ledger_reminder_v1`             | `{ enabled: boolean, time: "HH:MM" }`                                 |

The `_vN` suffix is reserved for future schema migration. Don't change a key's shape silently — bump the suffix and write a migration.

Category icons are kept in a sibling key rather than fattening `ledger_custom_categories_v1` so existing user data keeps working without a destructive schema change. Defaults still come from `DEFAULT_CATEGORY_ICONS` in `app.js`.

### Schema migration

`migrateEntries()` runs at module load (after `state` is constructed, before `init()`). It currently backfills the `account` field on legacy entries. Add new migrations there — keep them idempotent.

### Recurring transactions

Rules live in `state.recurring`. Each rule tracks `lastGenerated`. On every app open, `generateRecurringEntries()` walks each active rule from `lastGenerated + 1` up to today via `nextOccurrenceAfter()` and creates the missing entries, tagging each generated entry with `recurringId`. The generated entries are normal entries — they appear in the list, are editable, and are deletable. Deleting a generated entry does **not** rewind the rule (the next open won't regenerate it).

Frequencies supported: `monthly` (with `dayOfMonth`, clamped to month length) and `weekly` (with `dayOfWeek` 0–6, Sunday = 0).

### Theme system

`<html data-theme="light|dark">` is set by `applyTheme()`. Light/dark CSS variable sets are defined in `:root` and `:root[data-theme="dark"]` in `styles.css`. The pref is stored as `light` / `dark` / `null` (= follow `prefers-color-scheme`). When changing styles, prefer the existing CSS variables (`--surface`, `--surface-soft`, `--surface-strong`, `--card`, `--ink-*`, `--brand-*`, etc.) over hardcoded colors so dark mode keeps working.

### Math expression parser

`evaluateAmount()` in `app.js` is a hand-rolled recursive-descent parser for `+ - * / ( )` and decimals. **Do not replace it with `eval()` or `new Function()`** — the original implementation deliberately avoids them. The amount field is `type="text"` (not `type="number"`) precisely so users can type `75+85`.

### JSON backup schema

`exportJson()` writes `schemaVersion: 3`, including `entries`, `customCategories`, `customAccounts`, `categoryIcons`, `budget`, `recurring`. `onImportJsonChange()` merges by ID (entries and recurring rules) and unions arrays (categories, accounts). When you add a new persisted slice, extend both export and import to include it, and bump `schemaVersion`.

### Rendering charts

`renderTrendChart` and `renderDonutChart` build SVG by hand (`document.createElementNS`). There is no charting library and we do not want one — keep it dependency-free. The donut chart is an interactive SVG with hover/click support and a centre label showing total expenditure.

### Photo attachment

Entries can optionally include a `photo` field containing a base64 data URI (captured via `<input type="file" accept="image/*" capture="environment">`). Photos are stored inline in the entry inside localStorage. The `setupPhotoAttach()` function handles capture, `setupPhotoViewer()` wires the full-screen viewer overlay. **Be aware of localStorage's ~5–10 MB limit** — heavy photo usage will hit it.

### Annual report

`renderAnnualReport()` aggregates all entries for a given year (controlled by `state.annualYear`) and displays 12-month summary, income/expense trend, and top categories. Year navigation uses `setupAnnualReport()` which wires the `◀ ▶` buttons.

### Achievement system

A gamification layer that tracks milestones (e.g. consecutive daily usage, total entries, budget adherence). Unlocked achievements are stored in `ledger_achievements_v1`. `checkAchievements()` runs after each new entry is created. Newly unlocked achievements trigger a popup overlay (`#achievementPopup`).

### Category budgets

In addition to the global monthly expense budget, users can set per-category budgets via `setupCategoryBudgets()`. These are stored in `ledger_category_budgets_v1`. `renderCategoryBudgetList()` displays each category's spend vs. budget with progress bars.

### Push reminder

`setupReminder()` requests Notification permission and uses `setTimeout`-based scheduling (not Push API) to fire a local notification at the user-configured time each day. Settings are stored in `ledger_reminder_v1`.

### Mobile tab bar fix

The mobile bottom tab bar uses a 3-layer defense against disappearing on pinch-to-zoom:
1. Viewport meta: `maximum-scale=1, user-scalable=no`
2. CSS: GPU-composited `translate3d`, `touch-action: none`, high z-index
3. JS: `visualViewport` API listener dynamically adjusts tab bar and FAB position/scale

## Conventions

- All form messages use either inline `updateHint()` (form-local errors) or `showToast()` (global confirmations). `confirm()` is used only for destructive operations (clear month, delete recurring rule, delete account-in-use).
- Default categories and accounts are constants at the top of `app.js` (`DEFAULT_CATEGORY_MAP`, `DEFAULT_ACCOUNTS`). User customizations are additive — defaults can't be deleted.
- `entry.id` is `crypto.randomUUID()` when available, falling back to `${Date.now()}_${Math.random()}`. Keep this fallback — the app must work in old browsers.
- Date strings are always `YYYY-MM-DD`. Month strings are `YYYY-MM`. Use `toDateInputValue()` / `formatDate()` rather than locale string methods so filters keep working.

## Roadmap

Updated 2026-05-10. When you finish something here, move it from 待做 to 已完成 (don't just delete it — the diff is the audit trail).

### ✅ 已完成

- 多帳戶 + 各帳戶結餘
- 月支出預算 + 進度條
- 自訂分類 / 自訂帳戶（emoji 圖示，30 個內建預設分類：20 支出 + 10 收入）
- 固定收支（每月 / 每週，自動回填遺漏期）
- 6 個月趨勢圖（手寫 SVG，手機自動壓扁）
- 分類占比圖
- 本月文字報告 + 洞察 templates
- 快速時間範圍篩選（今日 / 本週 / 本月）
- 當月日曆熱力圖 + 點日跳明細（`state.specificDay`）
- 算式金額（`75+85`）
- CSV 匯出 + JSON 匯出 / 匯入（`schemaVersion: 3`）
- 深淺色主題（含跟隨系統）
- PWA：安裝、離線快取、行動版底部 tab bar、FAB、數字鍵盤
- 桌機水平導覽列
- 📅 年度報表（12 個月收支總覽 + 年度趨勢分析）
- 🏆 記帳成就系統（遊戲化徽章、解鎖彈窗）
- 📸 拍照 / 選圖附件（base64 存入 entry，含全螢幕檢視器）
- 🎯 分類預算（各分類個別上限 + 進度條）
- 📊 互動式 SVG 甜甜圈圖（可點擊分類展開明細）
- 🔔 記帳提醒（Notification API 每日定時提醒）
- 🔧 手機版 tab bar 消失修復（viewport + CSS + visualViewport JS 三層防護）

### 🚧 待做

**短期（CP 高、各 1–3 小時）**
- 長按交易一鍵複製到今天
- Hero / FAB 顯示「今日已花 $X」即時徽章
- 備註欄 `<datalist>` 自動完成（從歷史備註）
- 月份 ‹ › 鍵切換
- CSV 匯入（補對稱 — 目前只有匯出）

**中期（4–8 小時）**
- 帳戶間轉帳：新 entry type，影響餘額但不算收支
- 訂閱 / 固定支出儀表板（聚合 `state.recurring`）
- 與上月對比指標（報告頁 △▼）
- 標籤 `#tag` 系統（橫向分類，不取代 category）
- 🔐 PIN 碼鎖（開啟 App 需輸入 4 位 PIN，localStorage 存 hash）

**長期 / 高成本**
- 雲端備份（Drive / OneDrive / iCloud Files）— 解決資料只在本機的最大痛點
- 共享記帳 / 多裝置同步
- 多幣別 + 匯率快取（旅遊用）
- OCR 發票辨識（Tesseract.js）
- IndexedDB 升級 — 突破 localStorage ~5–10 MB 容量限制
- 📤 分享月報圖片（渲染成圖片可下載或分享到社群）
- 🤖 AI 語音記帳（Web Speech API → 解析成記帳資料）

### ❌ 不做

- 引入第三方圖表 / UI 函式庫
- 任何破壞「純前端、零依賴、`localStorage`」原則的改動
- `eval()` / `new Function()`（金額算式請繼續用 `evaluateAmount()` 的 recursive-descent parser）

---

## Walkthrough — 功能分析與建議

> 以下摘自 2026-05-10 的功能審查。

### ✅ 優點

| 項目 | 說明 |
|------|------|
| **離線可用（PWA）** | 使用 Service Worker，安裝後不需網路即可使用 |
| **純前端零後端** | 資料存 localStorage，不需伺服器、無隱私疑慮 |
| **分類系統完善** | 預設 20+ 分類 + 自訂分類 + emoji 圖示選擇 |
| **快速記帳模板** | 一鍵套用「早餐/捷運/薪資」等常用模板 |
| **計算機鍵盤** | 支援金額運算式（如 `75+85`），手機體驗佳 |
| **多帳戶管理** | 現金/信用卡/銀行 + 自訂帳戶 |
| **豐富的圖表** | 分類占比（甜甜圈圖）、月度趨勢、支出熱力圖 |
| **自動報告** | 月報告 + 年度報表，含 Top 5 支出、同比分析、預算狀態 |
| **固定收支** | 支援每月/每週的定期自動入帳 |
| **資料備份** | CSV 匯出 + JSON 備份/還原（schemaVersion: 3） |
| **深色模式** | 支援手動切換 + 系統偏好自動跟隨 |
| **介面精美** | 玻璃擬態 + 漸變色 + 微動畫，質感極佳 |
| **成就系統** | 遊戲化徽章激勵持續記帳 |
| **照片附件** | 拍照 / 選圖附加收據到交易紀錄 |
| **分類預算** | 各分類可設個別上限，超支時提醒 |
| **記帳提醒** | Notification API 每日定時推播提醒 |

### ❌ 已知限制

| 項目 | 說明 |
|------|------|
| **資料不能跨裝置同步** | 純 localStorage，換手機資料就沒了 |
| **無密碼保護** | 任何人打開瀏覽器就能看到帳目 |
| **無多幣種** | 僅支援單一貨幣 |
| **localStorage 容量限制** | 約 5–10 MB，大量照片附件可能溢出 |
| **無標籤系統** | 不能對同一筆交易加多個標籤 |

### 🚀 建議新增功能（依 CP 值排序）

| # | 功能 | CP值 | 開發時間 | 說明 |
|---|------|------|----------|------|
| 1 | **🔐 密碼鎖/PIN 碼** | ★★★★★ | 2~3 小時 | 開啟 App 需輸入 4 位 PIN，localStorage 存 hash |
| 2 | **🏷️ 標籤系統** | ★★★★★ | 3~4 小時 | 每筆交易可加多個標籤，支援標籤篩選 |
| 3 | **💱 多幣種支援** | ★★★★☆ | 3~4 小時 | 選擇記帳幣種，匯率手動輸入 |
| 4 | **📥 拆帳/AA 計算器** | ★★★★☆ | 3~4 小時 | 輸入總金額和人數，計算每人應付 |
| 5 | **☁️ 雲端同步** | ★★★☆☆ | 6~8 小時 | Google Sheets API 當資料庫，跨裝置同步 |
| 6 | **🤖 AI 語音記帳** | ★★★☆☆ | 4~6 小時 | Web Speech API 語音輸入 → 解析成記帳資料 |
| 7 | **🧮 資產負債表** | ★★★☆☆ | 4~5 小時 | 追蹤各帳戶餘額變化趨勢 |
| 8 | **🌐 IndexedDB 升級** | ★★☆☆☆ | 4~6 小時 | 突破 localStorage 容量限制 |
