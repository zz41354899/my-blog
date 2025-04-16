# 我的部落格

这是一个使用 Next.js 14、Tailwind CSS 和 Supabase 构建的博客项目。

## 功能

- 文章发布和管理
- 用户认证和授权
- 管理员面板
- 响应式设计

## 技术栈

- Next.js 14
- React
- Tailwind CSS
- Supabase (认证和数据存储)

## 本地开发

1. 克隆此仓库
2. 安装依赖：`npm install`
3. 复制 `.env.example` 到 `.env.local` 并填入所需的环境变量
4. 启动开发服务器：`npm run dev`
5. 在浏览器中访问：`http://localhost:3000`

## 项目结构

- `/src/app` - Next.js 应用程序路由
- `/src/components` - React 组件
- `/src/lib` - 实用函数和 API 客户端
- `/public` - 静态资源

## 许可

MIT

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

1. 克隆這個專案
   ```bash
   git clone <repository-url>
   cd my_blog
   ```

2. 安裝依賴
   ```bash
   npm install
   ```

3. 設置環境變數
   - 複製 `.env.example` 到 `.env.local`
   - 從 Supabase 項目設置中獲取並填入您的 Supabase URL 和匿名鍵

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. 啟動開發服務器
```bash
npm run dev
```

5. 訪問 http://localhost:3000 查看您的部落格
   - 首頁：http://localhost:3000
   - 管理頁面：http://localhost:3000/admin

## 專案結構

- `src/app/` - Next.js 應用路由和頁面
- `src/components/` - 可重用的 UI 組件
- `src/lib/` - 工具函數和 API 客戶端
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
