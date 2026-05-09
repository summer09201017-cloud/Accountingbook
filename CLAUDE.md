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

`service-worker.js` has `CACHE_NAME = "ledger-pwa-vN"`. **Bump N whenever you change `index.html`, `app.js`, or `styles.css`**, otherwise installed PWAs will keep serving stale assets. The activate handler deletes any cache whose name doesn't match the current `CACHE_NAME`, so bumping is the only step needed.

## Architecture

### Single-file state machine

All runtime state lives in one `state` object at the top of `app.js`. The flow is strictly:

```
event → mutate state → persist<Slice>() → render()
```

`render()` is the only rerender entry point. It calls every sub-renderer (`renderList`, `renderTotals`, `renderCategoryChart`, `renderBudget`, `renderAccountBalances`, `renderTrendChart`, `renderCalendarHeatmap`, `renderCalendarStatus`, `renderReport`, `renderRecurringList`). Sub-renderers read from `state` and write to the DOM idempotently — no virtual DOM, no diffing.

Tab/FAB/numpad/icon-picker setup runs once in `init()` via `setupTabs()`, `setupFab()`, `setupNumpad()`, `setupIconPicker()`, `setupCategoryIconPicker()` — they wire DOM listeners and don't participate in `render()`.

When adding a new feature: add a state slice, a `load<Slice>` / `persist<Slice>` pair, a `render<Slice>` function, and call it from `render()`.

### Storage layout

Each state slice has its own localStorage key with a `_v1` (or `_v2`) suffix:

| Key                              | Holds                                                                  |
|----------------------------------|------------------------------------------------------------------------|
| `ledger_entries_v1`              | array of transactions                                                  |
| `ledger_custom_categories_v1`    | `{ expense: [...], income: [...] }` — names only, icons stored separately |
| `ledger_custom_accounts_v1`      | array of custom account names                                          |
| `ledger_category_icons_v1`       | `{ expense: { name: emoji }, income: { name: emoji } }`                |
| `ledger_budget_v1`               | `{ monthlyExpense: number }`                                           |
| `ledger_recurring_v1`            | array of recurring rules                                               |
| `ledger_prefs_v1`                | theme + last-selected type/category/account + `activeTab`              |

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

`exportJson()` writes `schemaVersion: 2`, including `entries`, `customCategories`, `customAccounts`, `budget`, `recurring`. `onImportJsonChange()` merges by ID (entries and recurring rules) and unions arrays (categories, accounts). When you add a new persisted slice, extend both export and import to include it, and bump `schemaVersion`.

### Rendering charts

`renderTrendChart` builds SVG by hand (`document.createElementNS`). There is no charting library and we do not want one — keep it dependency-free.

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
- CSV 匯出 + JSON 匯出 / 匯入（`schemaVersion: 2`）
- 深淺色主題（含跟隨系統）
- PWA：安裝、離線快取、行動版底部 tab bar、FAB、數字鍵盤
- 桌機水平導覽列

### 🚧 待做

**短期（CP 高、各 1–3 小時）**
- 長按交易一鍵複製到今天
- Hero / FAB 顯示「今日已花 $X」即時徽章
- 備註欄 `<datalist>` 自動完成（從歷史備註）
- 月份 ‹ › 鍵切換
- CSV 匯入（補對稱 — 目前只有匯出）

**中期（4–8 小時）**
- 帳戶間轉帳：新 entry type，影響餘額但不算收支
- 分類預算（不只總額）
- 訂閱 / 固定支出儀表板（聚合 `state.recurring`）
- 與上月對比指標（報告頁 △▼）
- 標籤 `#tag` 系統（橫向分類，不取代 category）

**長期 / 高成本**
- 雲端備份（Drive / OneDrive / iCloud Files）— 解決資料只在本機的最大痛點
- WebPush 帳單提醒（PWA Notification API）
- 共享記帳 / 多裝置同步
- 多幣別 + 匯率快取（旅遊用）
- OCR 發票辨識（Tesseract.js）

### ❌ 不做

- 引入第三方圖表 / UI 函式庫
- 任何破壞「純前端、零依賴、`localStorage`」原則的改動
- `eval()` / `new Function()`（金額算式請繼續用 `evaluateAmount()` 的 recursive-descent parser）
