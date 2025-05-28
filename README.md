# 水晶电商网站

这是一个基于Next.js和EdgeOne Pages构建的水晶电商网站模板，提供了完整的产品展示、购物车、用户登录等功能。

## 技术栈

- 前端框架: Next.js (SSG)
- UI组件库: 自定义组件
- 样式: Tailwind CSS v4
- 类型系统: TypeScript
- Edge函数: EdgeOne Functions

## 功能特点

- 响应式设计，适配各种设备
- 产品列表和详情页面
- 购物车功能
- 博客系统
- 联系表单
- 用户认证 (登录/注册)

## 开始使用

### 安装依赖

```bash
npm install
```

### 运行开发服务器

前端开发服务器:

```bash
npm run dev
```

EdgeOne函数开发服务器:

```bash
npm run edge:dev
```

### 构建应用

```bash
npm run build
```

## 项目结构

- `/src/app` - Next.js 页面和组件
- `/src/components` - 可重用UI组件
- `/src/lib` - 工具函数和配置
- `/functions` - EdgeOne 函数
- `/public` - 静态资源

## 环境变量

创建一个 `.env` 文件，包含以下变量:

```
DEV=true
FRONT_END_URL_DEV=http://localhost:3000
NEXT_PUBLIC_API_URL_DEV=http://localhost:8088/
```

## 部署

此项目可以部署到EdgeOne Pages平台。

```bash
# 使用EdgeOne CLI部署
edgeone pages deploy
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
