# 我的部落格

這是一個使用 Next.js 14、Tailwind CSS 和 Supabase 建立的部落格專案。

## 功能

- 文章發布與管理
- 使用者認證和授權
- 管理員面板
- 響應式設計

## 技術堆疊

- Next.js 14
- React
- Tailwind CSS
- Supabase (認證與資料儲存)

## 本機開發

1. 克隆此倉庫
2. 安裝依賴：`npm install`
3. 複製 `.env.example` 到 `.env.local` 並填入所需的環境變量
4. 啟動開發伺服器：`npm run dev`
5. 在瀏覽器中造訪：`http://localhost:3000`

## 專案結構

- `/src/app` - Next.js 應用程式路由
- `/src/components` - React 元件
- `/src/lib` - 實用函數和 API 用戶端
- `/public` - 靜態資源


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next theapp.

1. 克隆這個項目
 『`bash
 git clone <repository-url>
 cd my_blog
 ```

2. 安裝依賴
 『`bash
 npm install
 ```

3. 設置環境變數
 - 複製 `.env.example` 到 `.env.local`
 - 從 Supabase 項目設定中取得並填入您的 Supabase URL 和匿名鍵

 ```
 NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
 NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
 ```

4. 啟動開發服務器
『`bash
npm run dev
```

5. 造訪 http://localhost:3000 查看您的博客
 - 首頁：http://localhost:3000
 - 管理頁面：http://localhost:3000/admin

## 項目結構

- `src/app/` - Next.js 應用路由和頁面
- `src/components/` - 可重複使用的 UI 元件
- `src/lib/` - 工具函數與 API 用戶端
- `src/types/` - TypeScript 類型定義

## 未來可能的擴展

- 用戶認證系統
- Markdown 支持
- 圖片上傳功能
- 標籤和分類功能
- 評論系統
- SEO 優化

## 許可
MIT
