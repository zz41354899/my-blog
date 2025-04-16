# 開發前預檢系統 (Pre-Dev Check)

這個預檢系統會在每次運行 `npm run dev` 前自動檢查和修正常見的高風險錯誤，提高開發效率。

## 自動檢查的問題

1. **Next.js Params 解包錯誤** - 自動修正 `params.id` 的使用方式，避免 `An unsupported type was passed to use(): [object Object]` 錯誤。

2. **Supabase 圖片處理問題** - 檢查 `coverUrl` 和 `cover_url` 命名一致性，確保值不為 `undefined`。

3. **Slug 安全性問題** - 確認 slug 生成過程中使用了 `slugify()` 函數，保證 URL 安全。

4. **ESLint 錯誤** - 自動修復可修復的 ESLint 錯誤。

## 使用方法

### 自動執行

每次運行 `npm run dev` 時，預檢系統會自動執行：

```bash
npm run dev
```

### 手動執行檢查

如果您想單獨運行預檢，不啟動開發服務器：

```bash
npm run check
```

## 預檢配置

預檢系統的配置存儲在項目根目錄的 `pre-dev-check.json` 文件中，可以根據項目需要進行調整。

## 預檢輸出

預檢系統會在終端輸出結果：

- 🔍 掃描的文件和檢查的問題類型
- ⚠️ 發現的潛在問題
- ✅ 已自動修正的問題
- 🛠️ 預檢完成匯總（修復項數量）

## 開發者須知

### 新增檢查項

如需增加新的檢查項目，請修改 `pre-dev-check.js` 文件，添加新的檢查函數，並在 `runAllChecks()` 中調用。

### 依賴項

此預檢系統依賴於：
- Node.js
- glob (用於文件匹配)
- ESLint (用於代碼格式檢查) 