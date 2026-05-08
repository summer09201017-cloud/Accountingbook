# 日日記帳

一個可在手機與電腦瀏覽器使用的響應式記帳軟體，支援離線快取（PWA）。

## 特色

- 新增收入/支出（分類、日期、備註），支援自訂分類
- 月份、類型、關鍵字篩選
- 即時統計：收入、支出、結餘
- 支出分類占比圖
- 匯出 CSV
- 清空指定月份資料
- 以 `localStorage` 保存資料（不需後端）

## 使用方式

1. 直接在瀏覽器打開 `index.html`。
2. 若要完整啟用 Service Worker，建議用靜態伺服器開啟，例如：
   - `python -m http.server 8000`
   - 打開 `http://localhost:8000`

## 檔案結構

- `index.html`：頁面結構
- `styles.css`：響應式樣式與動畫
- `app.js`：記帳邏輯與資料管理
- `manifest.webmanifest`：PWA 設定
- `service-worker.js`：離線快取
- `icons/`：App 圖示


