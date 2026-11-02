# Project Architecture & Workflow Documentation

> **Project:** POS & Admin Dashboard (`dashboard-admin/admin`)  
> **Tech Stack:** React 19, TypeScript, Vite, TanStack Query, TanStack Table, TanStack Form,Zod, Axios, Tailwind CSS (v4), Base UI / Shadcn UI, i18n

---

## Table of Contents
1. [Full Folder Structure](#1-full-folder-structure)
2. [Folder & File Roles](#2-folder--file-roles)
3. [Architecture & Data Flow](#3-architecture--data-flow)
4. [TanStack + Axios + TypeScript Workflow](#4-tanstack--axios--typescript-workflow)
   - [Layer 1: TypeScript Models & Contracts (`src/types`)](#layer-1-typescript-models--contracts-srctypes)
   - [Layer 2: Axios Central Client & Interceptors (`src/services/lib`)](#layer-2-axios-central-client--interceptors-srcserviceslib)
   - [Layer 3: HTTP API Services (`src/services`)](#layer-3-http-api-services-srcservices)
   - [Layer 4: TanStack Query Custom Hooks (`src/hooks`)](#layer-4-tanstack-query-custom-hooks-srchooks)
   - [Layer 5: TanStack Form & Zod Validation (`src/components/...`)](#layer-5-tanstack-form--zod-validation-srccomponents)
   - [Layer 6: TanStack Table (`src/components/data-table`)](#layer-6-tanstack-table-srccomponentsdata-table)
   - [Layer 7: Routed Page Assembly (`src/pages`)](#layer-7-routed-page-assembly-srcpages)
5. [Step-by-Step Guide: Adding a New Feature](#5-step-by-step-guide-adding-a-new-feature)
6. [Authentication & Session Flow](#6-authentication--session-flow)

---

## 1. Full Folder Structure

```
dashboard-admin/admin/
├── public/                         # Static assets served directly by Vite
│   ├── flag/                       # Flag icons for i18n language switcher (en.svg, kh.svg)
│   ├── i18n/                       # Static translation dictionaries (en.json, kh.json)
│   ├── img/                        # POS & UI illustration images (pos.svg)
│   └── logo/                       # Brand and POS logos (placeholder-logo.svg)
│
├── src/
│   ├── api/                        # General API helpers, resource adapter, and utility stubs
│   ├── assets/                     # Bundled SVG/media assets, fonts, and i18n provider
│   ├── components/                 # UI components (Atomic, Features, Primitives)
│   │   ├── auth/                   # Authentication forms (Login-form.tsx)
│   │   ├── category/               # Category module (CategoryForm, Columns, ConfirmDelete)
│   │   ├── data-table/             # Generic TanStack Table wrapper (data-table.tsx)
│   │   ├── loading/                # Spinner and skeleton loaders (Spinner.tsx, TableSkeleton.tsx)
│   │   ├── products/               # Product module (ProductForm, Columns, ImagePreviewModal)
│   │   ├── test-category/          # Sandbox / testing category components (TestCategory.tsx)
│   │   ├── ui/                     # UI primitives (button, dialog, input, select, table)
│   │   ├── app-sidebar.tsx         # Collapsible admin navigation sidebar
│   │   ├── LanguageSwitcher.tsx    # Language switcher dropdown (English / Khmer)
│   │   ├── ThemeToggle.tsx         # Dark / Light mode toggle
│   │   ├── TotalVisitorsChart.tsx  # Dashboard revenue & order volume chart
│   │   └── UserDropdown.tsx        # Profile header menu, API sign-in modal & logout button
│   │
│   ├── hooks/                      # TanStack Query custom hooks (Read/Write cache)
│   │   ├── use-auth.ts             # Auth mutations (login, register, profile)
│   │   ├── use-category.ts         # Category useQuery & useMutation hooks
│   │   ├── use-customer.ts         # Customer, Address & Role data hooks
│   │   ├── use-dashboard.ts        # Dashboard statistics & analytics queries
│   │   ├── use-mobile.ts           # Media-query hook for responsive layout
│   │   ├── use-product.ts          # Product CRUD, variant & image upload/delete mutations
│   │   ├── use-resource.ts         # Generic resource table TanStack Query hooks
│   │   ├── useOrder.ts             # Order & Cart management hooks
│   │   └── usePayment.ts           # Payment processing hooks
│   │
│   ├── layouts/                    # Layout wrappers matching application modes
│   │   ├── Dashboard.tsx           # Active workspace router & state container
│   │   ├── DashboardLayout.tsx     # Admin shell (Sidebar + Topbar + Content)
│   │   ├── MainLayout.tsx          # Public wrapper for unauthenticated routes (/login)
│   │   ├── Sidebar.tsx             # Sidebar wrapper exporting AppSidebar
│   │   └── Topbar.tsx              # Header bar composing LanguageSwitcher, ThemeToggle, UserDropdown
│   │
│   ├── lib/                        # Third-party configurations & utilities
│   │   ├── i18n.ts                 # i18n configuration & dictionary exports
│   │   ├── sonner.ts               # Toast notification dispatcher
│   │   ├── tanstack-form.tsx       # Reactive form state & validator adapter
│   │   ├── tanstack-query.tsx      # QueryClient, useQuery, useMutation, cache invalidation
│   │   ├── tanstack-table.tsx      # Headless table model & flexRender
│   │   ├── use-debounce.ts         # Debounced value hook
│   │   ├── utils.ts                # Tailwind CSS class merging helper (cn)
│   │   └── zod.ts                  # Schema validation builder
│   │
│   ├── pages/                      # Page components corresponding to routes
│   │   ├── Category.tsx            # Categories management
│   │   ├── Customer.tsx            # Customers management
│   │   ├── Dashboard.tsx           # Dashboard overview + Popular products
│   │   ├── LoginPage.tsx           # Admin login page
│   │   ├── Orders.tsx              # Orders management
│   │   ├── Payments.tsx            # Payments management
│   │   ├── PosPage.tsx             # Point of Sale terminal
│   │   ├── Product.tsx             # Products management
│   │   ├── Settings.tsx            # Store & security settings
│   │   └── test-category.tsx       # Sandbox category table view
│   │
│   ├── services/                   # Pure HTTP API calls using Axios
│   │   ├── lib/
│   │   │   └── axios.ts            # Central Axios instance with Interceptors
│   │   ├── auth.service.ts         # /auth/* & /auth/profile/*
│   │   ├── category.service.ts     # /category/*
│   │   ├── customer.service.ts     # /auth/getData, /address/*, /role/*, /user-role/*
│   │   ├── dashboard.service.ts    # /order/admin/report & /order/admin/report/export
│   │   ├── order.service.ts        # /order/* & /cart/*
│   │   ├── payment.service.ts      # /payment/*
│   │   └── product.service.ts      # /product/*, variants, images & reviews
│   │
│   ├── types/                      # TypeScript interfaces and type definitions
│   │   ├── aba-payway.d.ts         # External ABA PayWay gateway declarations
│   │   ├── auth-login.tsx          # Login payload and authentication response types
│   │   ├── cart.tsx                # POS cart item and order structure
│   │   ├── category.tsx            # Category entity and CategoryPayload
│   │   ├── order.tsx               # Order, OrderItem, and OrderReport types
│   │   ├── payment.tsx             # Payment entity and checkout types
│   │   ├── product.tsx             # Product entity, ProductPayload, IProductImage
│   │   └── user.tsx                # User, UserProfile, Role, and Address types
│   │
│   ├── utils/                      # Helper utility modules
│   │   ├── currency.ts             # Currency formatter ($ / ៛)
│   │   ├── date.ts                 # Date formatters (date-fns compatible format)
│   │   ├── settings.ts             # App and POS local configuration storage
│   │   └── tokenStorage.ts         # Cookie-based JWT storage, expiry, and payload parser
│   │
│   ├── App.tsx                     # Top-level QueryClientProvider & Dashboard shell
│   ├── main.tsx                    # Application entry point with StrictMode and Suspense
│   ├── App.css                     # App-level styling rules
│   └── index.css                   # Root layout reset
│
├── .env                            # Environment variables (VITE_API_URL=http://localhost:3000)
├── package.json                    # Project metadata, dependencies, scripts
├── tsconfig.json                   # Base TypeScript config with path aliases
├── tsconfig.app.json               # Application-specific TypeScript compilation rules
└── vite.config.ts                  # Vite bundler config with path alias (@ -> src)
```

---

## 2. Folder & File Roles

| Folder / File | Responsibility | Rule / Convention |
| :--- | :--- | :--- |
| `src/types/` | Data contracts (Payloads, Entities, DTOs) | Pure TypeScript declarations. No React code or runtime logic. |
| `src/services/` | REST endpoint communication via Axios | Pure async functions returning promises. No React hooks or state here. |
| `src/services/lib/axios.ts` | Centralized Axios instance | Manages `baseURL`, JWT token injection via request interceptor, and response unwrapping. |
| `src/hooks/` | TanStack Query (`useQuery`, `useMutation`) | Bridges services with React components. Handles caching, queries, and invalidation. |
| `src/components/ui/` | Reusable atomic UI elements | Presentational components (`Button`, `Dialog`, `Input`, `Select`, `Table`). |
| `src/components/<feature>/` | Feature-specific components | Forms, custom modal dialogs, and table column definitions (`Columns.tsx`). |
| `src/components/data-table/`| Generic TanStack Table component | Agnostic table component accepting typed `columns` and `data`. |
| `src/pages/` | Top-level view for each route | Orchestrates hooks, filters, modals, and passes data to components. |
| `src/layouts/` | Page wrappers | Houses persistent UI like navigation bars, sidebars, theme toggles, and content views. |
| `src/utils/` | Stateless utility functions | Cookie/JWT token management, date formatting, currency conversions, settings persistence. |
