# Shopify Ecommerce Starter

This is a Shopify ecommerce website template built with Next.js, Shopify Storefront API, and EdgeOne Pages, offering complete features such as product display, shopping cart, user login, and more.

## Technology Stack
- Frontend Framework: Next.js (SSG)
- UI Component Library: Custom components
- Style: Shadcn-ui
- Type System: TypeScript
- Edge Function: EdgeOne Functions

## Key Features

- Responsive design, adaptable to various devices
- Product list and detail pages
- Shopping cart functionality
- Blog system
- Contact form
- User authentication (login/register)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

Frontend development server:

```bash
npm run dev
```

EdgeOne function development server:

```bash
npm run edge:dev
```

### Build Application

```bash
npm run build
```

## Project Structure

- `/src/app` - Next.js pages and components
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and configurations
- `/functions` - EdgeOne functions
- `/public` - Static resources

## Environment Variables

Create a `.env` file containing the following variables:

```
DEV=true
FRONT_END_URL_DEV=http://localhost:3000
NEXT_PUBLIC_API_URL_DEV=http://localhost:8088/

SHOPIFY_STORE_DOMAIN=yourshop.myshopify.com
SHOPIFY_API_VERSION=2025-04
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your storefront api access token
```
