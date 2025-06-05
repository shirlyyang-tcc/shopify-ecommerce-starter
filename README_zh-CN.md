# Shopify Ecommerce Starter

这是一个基于Next.js、Shopify Storefront API和EdgeOne Pages构建的水晶电商网站模板，提供了完整的产品展示、购物车、用户登录等功能。

## 技术栈
- 前端框架: Next.js (SSG)
- UI组件库: 自定义组件
- 样式: Shadcn-ui
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

### Shopify 设置
根据[文档](https://edgeone.cloud.tencent.com/pages/document/179443686345789440)进行设置

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

SHOPIFY_STORE_DOMAIN=yourshop.myshopify.com
SHOPIFY_API_VERSION=2025-04
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your storefront api access token
```

## Deploy
[![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?template=shopify-ecommerce-starter)
