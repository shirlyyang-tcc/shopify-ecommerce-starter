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

### Shopify Setup
Setup your headless shop according to [document](https://edgeone.ai/document/178987340165009408)

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
edgeone pages dev
```

## Project Structure

- `/src/app` - Next.js pages and components
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and configurations
- `/public` - Static resources

## Payment
The project integrates Shopify's payment functionality (beta). To test the payment process, after clicking the checkout button, you need to enter the password: ohfrad.

For test card numbers, refer to the documentation: https://help.shopify.com/en/manual/payments/shopify-payments/testing-shopify-payments

## Environment Variables

Create a `.env` file containing the following variables:

## Deploy
[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?template=shopify-ecommerce-starter)