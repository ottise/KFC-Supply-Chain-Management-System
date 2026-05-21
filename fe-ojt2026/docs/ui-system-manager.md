# KFC Warehouse Manager - UI System Documentation

> **Version:** 1.0.0
> **Last Updated:** 2026-04-02
> **Module:** Warehouse Manager (Warehouse Keeper)
> **Tech Stack:** Next.js 16.1.6 + React 19.2.3 + TypeScript 5 + Tailwind CSS 4

---

## Table of Contents

1. [Design Language](#1-design-language)
2. [Layout System](#2-layout-system)
3. [CSS Patterns & Conventions](#3-css-patterns--conventions)
4. [Component Architecture](#4-component-architecture)
5. [API-to-App Flow](#5-api-to-app-flow)
6. [State Management](#6-state-management)
7. [Accessibility Guidelines](#7-accessibility-guidelines)
8. [Performance Guidelines](#8-performance-guidelines)

---

## 1. Design Language

### 1.1 Brand Colors (KFC)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#E4002B` | KFC Red - Primary actions, active states, accents |
| `primary-dark` | `#B8001F` | Hover states on primary |
| `primary-light` | `#FF4D6A` | Light backgrounds, subtle accents |
| `primary-subtle` | `rgba(228,0,43,0.1)` | Shadow effects, backgrounds |

### 1.2 Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `gray-50` | `#F9FAFB` | Page background |
| `gray-100` | `#F3F4F6` | Borders, subtle backgrounds |
| `gray-200` | `#E5E7EB` | Disabled states, dividers |
| `gray-400` | `#9CA3AF` | Placeholder text |
| `gray-600` | `#4B5563` | Secondary text |
| `gray-700` | `#374151` | Body text |
| `gray-900` | `#111827` | Primary headings |

### 1.3 Semantic Colors

| Status | Background | Text | Border |
|--------|------------|------|--------|
| `success` | `bg-green-100/50` | `text-green-700` | `border-green-200` |
| `warning` | `bg-orange-100/50` | `text-orange-700` | `border-orange-200` |
| `info` | `bg-blue-100/50` | `text-blue-700` | `border-blue-200` |
| `draft` | `bg-gray-100/50` | `text-gray-600` | `border-gray-200` |

### 1.4 Typography

**Font Family:** `Inter` (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
```

**Type Scale:**

| Element | Size | Weight | Transform | Letter Spacing |
|---------|------|--------|-----------|----------------|
| Page Title | `text-2xl` | `font-black` (900) | `uppercase` | `tracking-tight` |
| Page Subtitle | `text-[10px]` | `font-black` (900) | `uppercase` | `tracking-[0.2em]` |
| Section Heading | `text-lg` | `font-bold` (700) | `capitalize` | - |
| Body | `text-sm` | `font-bold` (700) | - | - |
| Labels | `text-[10px]` | `font-black` (900) | `uppercase` | `tracking-widest` |
| Button | `text-[11px]` | `font-black` (900) | `uppercase` | `tracking-widest` |

### 1.5 Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `page-padding` | `p-8` | Main content area |
| `card-padding` | `p-6` to `p-8` | Card interiors |
| `section-gap` | `mb-8` to `mb-10` | Between sections |
| `element-gap` | `gap-4` | Between form elements |
| `container-max` | `max-w-[1600px]` | Maximum content width |

### 1.6 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `card` | `rounded-[2.5rem]` | Main containers |
| `filter-section` | `rounded-[2rem]` | Filter bars |
| `table` | `rounded-4xl` | Table containers |
| `button` | `rounded-2xl` | Buttons, inputs |
| `badge` | `rounded-xl` | Status badges |

### 1.7 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `card` | `shadow-sm` | Default cards |
| `table` | `shadow-[0_10px_25px_-5px_rgba(228,0,43,0.1)]` | Table containers |
| `button` | `shadow-lg shadow-red-100` | Primary buttons |
| `modal` | `shadow-2xl` | Modal dialogs |

---

## 2. Layout System

### 2.1 Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  WAREHOUSE NAVBAR (Fixed Top)                                   │
│  h-20 | bg-white | border-b | shadow-sm                         │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                     │
│  SIDEBAR   │  MAIN CONTENT                                      │
│  (Fixed)   │  flex-1 | pt-25 | p-8 | min-h-screen               │
│            │                                                     │
│  Collapsed │  ┌─────────────────────────────────────────────┐  │
│  w-20      │  │  PAGE HEADER                                 │  │
│            │  │  Title + Subtitle + Actions                  │  │
│  Expanded  │  └─────────────────────────────────────────────┘  │
│  w-64      │                                                     │
│            │  ┌─────────────────────────────────────────────┐  │
│  h-[calc   │  │  FILTER BAR                                  │  │
│  (100vh-   │  │  Search | Dropdowns | Action Buttons        │  │
│   5rem)]   │  └─────────────────────────────────────────────┘  │
│            │                                                     │
│  Sticky    │  ┌─────────────────────────────────────────────┐  │
│  below     │  │  DATA TABLE / CONTENT                        │  │
│  navbar    │  │  Cards, Charts, or Tables                    │  │
│            │  └─────────────────────────────────────────────┘  │
│            │                                                     │
│            │  ┌─────────────────────────────────────────────┐  │
│            │  │  PAGINATION                                  │  │
│            │  └─────────────────────────────────────────────┘  │
└────────────┴────────────────────────────────────────────────────┘
```

### 2.2 Layout Grid

**Sidebar Behavior:**
- **Collapsed:** `ml-20` main content margin-left
- **Expanded:** `ml-64` main content margin-left
- **Transition:** `transition-all duration-500`

**Responsive Breakpoints:**

| Breakpoint | Sidebar | Content |
|------------|---------|---------|
| `>= 1440px` | Expanded by default | Full width |
| `1024px - 1439px` | Collapsed by default | Adapted |
| `768px - 1023px` | Overlay mode | Full width |
| `< 768px` | Hidden, hamburger menu | Full width |

### 2.3 Sidebar Structure

```
Sidebar
├── Logo (when expanded)
├───────────────────────
│ Dashboard Group
│   ├── Reporting (icon)
│─────────────────────
│ Inventory Group
│   ├── Replenishment (Nhập Kho)
│   ├── Stock Operations (Xuất Kho)
│   ├── Stock Transfer (Điều Chuyển)
│   ├── Inventory Adjustment (Kiểm Kê)
│   ├── Scrap (Loại Bỏ)
│─────────────────────
│ Master Data Group
│   ├── Warehouse (Kho)
│   ├── Stock Locations (Vị trí)
│   ├── Products (Sản phẩm)
│   ├── Product Lot (Số Lô)
│   ├── Vendor (Nhà cung cấp)
│   ├── Customer (Khách hàng)
│─────────────────────
│ Settings Group
│   ├── Profile
│   ├── Settings
│   ├── Unit of Measure
│   ├── Human Resources
│─────────────────────
│ [Profile Dropdown]
```

### 2.4 Page Header Pattern

```tsx
<div className="flex justify-between items-end mb-10">
  {/* Left: Title Block */}
  <div>
    <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
      Heading <span className="text-[#E4002B]">Accent</span>
    </h1>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
      Subtitle description
    </p>
  </div>

  {/* Right: Action Buttons */}
  <div className="flex gap-3">
    <button className="...">Primary</button>
    <button className="...">Secondary</button>
  </div>
</div>
```

---

## 3. CSS Patterns & Conventions

### 3.1 Tailwind Classes Organization

**File Structure Pattern:**
```
src/components/warehouse_manager/
├── layout/
│   ├── WarehouseNavbar.tsx
│   └── WarehouseSidebar.tsx
├── {feature}/
│   ├── {Feature}Dashboard.tsx    # Main container (business logic)
│   ├── {Feature}Table.tsx        # Table display
│   ├── {Feature}Filter.tsx      # Filter bar
│   ├── {Feature}Pagination.tsx   # Pagination
│   ├── {Feature}DetailModal.tsx  # Detail modal
│   └── {Feature}Form.tsx         # Create/Edit form
└── profile/
```

### 3.2 Component CSS Classes

**Card Container:**
```tsx
// Main container
<div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100">

// Filter section
<div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8">

// Table container
<div className="bg-white rounded-4xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(228,0,43,0.1)]">
```

**Primary Button:**
```tsx
<button className="
  px-6 py-3.5
  bg-[#E4002B]
  text-white
  text-[11px] font-black uppercase tracking-widest
  rounded-2xl
  shadow-lg shadow-red-100
  hover:scale-105 active:scale-95
  transition-all duration-200
  cursor-pointer
">
```

**Secondary Button:**
```tsx
<button className="
  px-5 py-2.5
  bg-white
  border border-gray-200
  text-gray-700 text-xs font-bold
  rounded-xl
  hover:bg-gray-50
  cursor-pointer
">
```

**Icon Button:**
```tsx
<button className="
  w-11 h-11
  flex items-center justify-center
  rounded-2xl
  hover:bg-red-50 hover:text-[#E4002B]
  transition-colors duration-200
  cursor-pointer
">
```

**Input Field:**
```tsx
<input className="
  border border-gray-200
  rounded-2xl
  px-4 py-3
  focus:outline-none
  focus:border-[#E4002B]
  focus:ring-4 focus:ring-[#E4002B]/10
  placeholder:text-gray-400
">
```

**Odoo-Style Dropdown:**
```tsx
<div className="
  bg-gray-50
  border-2 border-transparent
  focus-within:border-red-100
  rounded-2xl
  transition-colors duration-200
">
```

### 3.3 Table Styles

**Table Container:**
```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm text-left table-fixed border-separate border-spacing-0">
```

**Table Header:**
```tsx
<thead className="sticky top-0 z-20 shadow-sm bg-gray-50">
  <tr>
    <th className="w-[18%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
      Header
    </th>
  </tr>
</thead>
```

**Table Row:**
```tsx
<tr
  onClick={() => onRowClick(item)}
  className="group hover:bg-gray-50/80 cursor-pointer transition-colors duration-150"
>
  <td className="px-6 py-6 text-gray-900">Content</td>
</tr>
```

**Table Body Dividers:**
```tsx
<tbody className="divide-y divide-gray-50/80">
```

### 3.4 Modal Styles

**Overlay:**
```tsx
<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 animate-in fade-in duration-300" />
```

**Modal Container:**
```tsx
<div className="fixed inset-0 z-40 flex items-center justify-center p-4">
  <div className="bg-white rounded-2xl shadow-2xl max-w-[1100px] w-full max-h-[92vh] flex flex-col">
```

**Modal Header:**
```tsx
<div className="bg-[#E4002B] text-white px-8 py-5 rounded-t-2xl">
  <h2 className="text-lg font-bold">Title</h2>
</div>
```

**Modal Footer:**
```tsx
<div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-end gap-3">
```

### 3.5 Loading States

**Full Screen Loader:**
```tsx
<div className="flex items-center justify-center min-h-screen bg-gray-50 fixed inset-0 z-[9999]">
  <div className="w-12 h-12 border-4 border-red-100 border-t-[#E4002B] rounded-full animate-spin" />
</div>
```

**Table Loading Overlay:**
```tsx
<div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
  <div className="w-8 h-8 border-4 border-[#E4002B] border-t-transparent rounded-full animate-spin" />
</div>
```

**Inline Spinner:**
```tsx
<div className="w-5 h-5 border-2 border-[#E4002B] border-t-transparent rounded-full animate-spin" />
```

### 3.6 Status Badges

```tsx
// Draft
<span className="px-3 py-1 bg-gray-100/50 text-gray-600 border border-gray-200 rounded-xl text-[10px] font-bold uppercase">
  Draft
</span>

// Completed
<span className="px-3 py-1 bg-green-100/50 text-green-700 border border-green-200 rounded-xl text-[10px] font-bold uppercase">
  Completed
</span>

// In Progress
<span className="px-3 py-1 bg-orange-100/50 text-orange-700 border border-orange-200 rounded-xl text-[10px] font-bold uppercase">
  In Progress
</span>

// Ready
<span className="px-3 py-1 bg-blue-100/50 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-bold uppercase">
  Ready
</span>
```

### 3.7 Animation Standards

| Animation | Duration | Easing | Property |
|-----------|----------|--------|----------|
| Micro-interactions | `duration-200` | `ease-out` | opacity, color, transform |
| Page transitions | `duration-700` | - | fade-in, slide-in |
| Sidebar collapse | `duration-500` | `ease-in-out` | width, margin |
| Hover scale | - | - | `hover:scale-105 active:scale-95` |
| Reduced motion | - | - | `prefers-reduced-motion: reduce` |

---

## 4. Component Architecture

### 4.1 Component Hierarchy

```
Page Component (src/app/warehouse_manager/{feature}/page.tsx)
│
└── {Feature}Dashboard (src/components/warehouse_manager/{feature}/{Feature}Dashboard.tsx)
    │
    ├── {Feature}Filter (Search, Dropdowns, Filters)
    │
    ├── {Feature}Table (Data Display)
    │   └── {Feature}Row (Individual Row)
    │
    ├── {Feature}Pagination (Page Navigation)
    │
    ├── {Feature}DetailModal (View/Edit Modal)
    │   └── {Feature}Form (Create/Edit Form)
    │
    └── {Feature}StatusSteps (Progress Indicator)
```

### 4.2 Dashboard Component Pattern

```tsx
// {Feature}Dashboard.tsx
interface {Feature}DashboardProps {
  onTotalUpdate?: (total: number) => void;
}

export default function {Feature}Dashboard({ onTotalUpdate }: {Feature}DashboardProps) {
  // State
  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<Category | null>(null);

  // Modal state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch data
  const fetchData = useCallback(async (page: number, search?: string, filter?: any) => {
    setLoading(true);
    try {
      const result = await api.getItems({ page, search, filter });
      setData(result.Items);
      setPagination({ currentPage: result.Page, totalPages: result.TotalPages, totalItems: result.TotalItems });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchData(pagination.currentPage, searchTerm, selectedFilter);
  }, [fetchData, pagination.currentPage, searchTerm, selectedFilter]);

  // Handlers
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRowClick = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <{Feature}Filter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        onAddClick={() => {/* open create modal */}}
      />

      {/* Data Table */}
      <div className="bg-white rounded-4xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(228,0,43,0.1)] relative">
        {loading && <LoadingOverlay />}
        <{Feature}Table
          data={data}
          onRowClick={handleRowClick}
        />
        <{Feature}Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedItem && (
        <{Feature}DetailModal
          item={selectedItem}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
```

### 4.3 Filter Component Pattern

```tsx
interface {Feature}FilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedFilter: Category | null;
  onFilterChange: (category: Category | null) => void;
  onAddClick?: () => void;
}

export default function {Feature}Filter({
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  onAddClick
}: {Feature}FilterProps) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
      {/* Top Row: Search + Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="px-6 py-3.5 bg-[#E4002B] text-white ...">
            + Add New
          </button>
        </div>
      </div>

      {/* Bottom Row: Filter Dropdowns */}
      <div className="flex flex-wrap gap-4 items-center">
        <OdooDropdown<Category>
          items={categories}
          value={selectedFilter}
          onChange={(item) => onFilterChange(item)}
          displayField="Name"
          placeholder="All Categories"
          className="w-full max-w-xs"
          portal
        />

        <OdooDropdown<Status>
          items={statuses}
          value={selectedStatus}
          onChange={(item) => onStatusChange(item)}
          displayField="Label"
          placeholder="All Status"
          className="w-full max-w-xs"
          portal
        />
      </div>
    </div>
  );
}
```

### 4.4 Modal with Portal Pattern

```tsx
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
}

export default function {Feature}DetailModal({ isOpen, onClose, item }: ModalProps) {
  if (!isOpen || !item) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-[1100px] w-full max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#E4002B] text-white px-8 py-5 rounded-t-2xl flex justify-between items-center">
            <h2 className="text-lg font-bold">Detail: {item.name}</h2>
            <button onClick={onClose} className="hover:opacity-80">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 px-8 py-6 overflow-y-auto">
            {/* Content here */}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-end gap-3">
            <button onClick={onClose} className="...">Cancel</button>
            <button className="...">Save</button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
```

---

## 5. API-to-App Flow

### 5.1 API Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PAGES                                    │
│  src/app/warehouse_manager/{feature}/page.tsx                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ renders
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DASHBOARD                                    │
│  src/components/warehouse_manager/{feature}/{Feature}Dashboard   │
│  - Business logic                                                │
│  - State management (useState)                                   │
│  - Data transformation                                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ calls
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HOOKS                                       │
│  src/hooks/useWarehouse.ts                                      │
│  - useWarehouseProducts()                                       │
│  - useReplenishment()                                           │
│  - useStockLocations()                                          │
│  - Encapsulates data fetching logic                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │ calls
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVICES                                  │
│  src/lib/api/warehouse/                                        │
│  ├── productsApi.ts                                             │
│  ├── purchaseOrderApi.ts                                        │
│  ├── stockDocumentsApi.ts                                       │
│  └── ...                                                        │
│  - Axios calls with typed parameters                            │
│  - Returns typed responses                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │ http requests
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AXIOS CLIENT                                  │
│  src/lib/axios.ts                                               │
│  - Base URL configuration                                       │
│  - Request interceptor (attach token)                          │
│  - Response interceptor (handle 401)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Axios Client Configuration

```typescript
// src/lib/axios.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Attach auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      window.location.href = '/sign_in?reason=session_expired';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 5.3 API Service Pattern

```typescript
// src/lib/api/warehouse/productsApi.ts
const PRODUCTS_API_PREFIX = "/api/v1/inventory/products";

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  categoryId?: number;
}

export interface Product {
  Id: number;
  Name: string;
  Code: string;
  Category: string;
  UnitOfMeasure: string;
  IsActive: boolean;
  CreatedAt: string;
}

export interface PaginatedResponse<T> {
  Items: T[];
  Page: number;
  PageSize: number;
  TotalItems: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
}

export const productsApi = {
  getProducts: async (params: GetProductsParams): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>(PRODUCTS_API_PREFIX, { params });
    return response.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`${PRODUCTS_API_PREFIX}/${id}`);
    return response.data;
  },

  createProduct: async (data: CreateProductRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(PRODUCTS_API_PREFIX, data);
    return response.data;
  },

  updateProduct: async (id: number, data: UpdateProductRequest): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(`${PRODUCTS_API_PREFIX}/${id}`, data);
    return response.data;
  },

  softDeleteProduct: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`${PRODUCTS_API_PREFIX}/${id}`);
    return response.data;
  },
};
```

### 5.4 Data Fetching Hook Pattern

```typescript
// src/hooks/useWarehouse.ts
export const useWarehouseProducts = (
  initialPage = 1,
  pageSize = 10,
  searchTerm = '',
  isActive?: boolean,
  categoryId?: number
) => {
  const { isAuthenticated, isAuthReady } = useAuthContext();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 1,
    totalItems: 0,
  });

  const fetchData = useCallback(async (
    page: number,
    search?: string,
    active?: boolean,
    catId?: number
  ) => {
    if (!isAuthReady || !isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const data = await productsApi.getProducts({
        page,
        pageSize,
        search,
        isActive: active,
        categoryId: catId,
      });

      setProducts(data.Items);
      setPagination({
        currentPage: data.Page,
        totalPages: data.TotalPages,
        totalItems: data.TotalItems,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [pageSize, isAuthReady, isAuthenticated]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      fetchData(1, term, isActive, categoryId);
    }, 300),
    [fetchData, isActive, categoryId]
  );

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (isAuthReady) {
      fetchData(pagination.currentPage, searchTerm, isActive, categoryId);
    }
  }, [isAuthReady, pagination.currentPage]);

  // Handle search with debounce
  const handleSearch = (term: string) => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    debouncedSearch(term);
  };

  const changePage = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const refresh = () => {
    fetchData(pagination.currentPage, searchTerm, isActive, categoryId);
  };

  return {
    products,
    loading,
    error,
    pagination,
    changePage,
    handleSearch,
    refresh,
  };
};
```

### 5.5 Complete Data Flow Example

```
User clicks "Search" button
         │
         ▼
Filter component calls onSearchChange("keyword")
         │
         ▼
Dashboard receives search term, triggers debounced search
         │
         ▼
useWarehouseProducts.handleSearch("keyword")
         │
         ▼
Debounce waits 300ms, then calls fetchData(1, "keyword", ...)
         │
         ▼
productsApi.getProducts({ page: 1, search: "keyword" })
         │
         ▼
Axios makes GET /api/v1/inventory/products?page=1&search=keyword
         │
         ▼
Server returns PaginatedResponse<Product>
         │
         ▼
fetchData updates state: { products, loading, pagination }
         │
         ▼
Dashboard re-renders with new data
         │
         ▼
Table displays updated product list
```

---

## 6. State Management

### 6.1 Local State (useState)

Used for:
- Component-specific UI state (modals, dropdowns)
- Form inputs
- Filter values
- Pagination

```tsx
const [isModalOpen, setIsModalOpen] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
```

### 6.2 Derived State (useMemo)

Used for:
- Filtered/sorted data
- Computed values
- Debounced values

```tsx
const filteredData = useMemo(() => {
  return data.filter(item => item.name.includes(searchTerm));
}, [data, searchTerm]);
```

### 6.3 Auth Context (useAuthContext)

```tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthReady: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const { user, isAuthenticated, isAuthReady } = useAuthContext();
```

### 6.4 Toast Notifications

```tsx
import { useToast } from '@/components/ui/ToastProvider';

const { showToast } = useToast();

// Success
showToast({ type: 'success', message: 'Product created successfully' });

// Error
showToast({ type: 'error', message: 'Failed to create product' });
```

---

## 7. Accessibility Guidelines

### 7.1 Keyboard Navigation

| Element | Tab Order | Enter | Escape |
|---------|-----------|-------|--------|
| Modal | Focus trapped inside | Activate | Close |
| Dropdown | Tab to navigate | Select item | Close |
| Table Row | Tab to row | Open detail | - |
| Button | Natural | Click | - |

### 7.2 Focus States

```tsx
// All interactive elements must have visible focus
button:focus-visible,
input:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid #E4002B;
  outline-offset: 2px;
}
```

### 7.3 Screen Reader Support

```tsx
// Icon-only buttons must have aria-label
<button aria-label="Close modal">
  <X className="w-6 h-6" />
</button>

// Tables should have proper headers
<table role="table">
  <thead>
    <tr>
      <th scope="col">Column Name</th>
    </tr>
  </thead>
</table>
```

### 7.4 Color Contrast

- Normal text: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- UI components: Minimum 3:1 ratio

---

## 8. Performance Guidelines

### 8.1 Code Splitting

```tsx
// Lazy load modals
const ProductDetailModal = dynamic(() =>
  import('@/components/warehouse_manager/product/ProductDetailModal').then(mod => mod.default)
);

// Usage
{isOpen && <ProductDetailModal item={item} onClose={() => {}} />}
```

### 8.2 Memoization

```tsx
// Memoize expensive computations
const processedData = useMemo(() => {
  return largeArray.filter(...).map(...).sort(...);
}, [largeArray, filter, sortKey]);

// Memoize callbacks passed to children
const handleRowClick = useCallback((item: Item) => {
  setSelectedItem(item);
}, []);
```

### 8.3 Virtualization

For large lists (>100 items), consider using `react-virtual` or `tanstack virtual`:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: data.length,
  getScrollElement: () => tableContainerRef.current,
  estimateSize: () => 73, // row height
});
```

### 8.4 Image Optimization

```tsx
// Next.js Image component
import Image from 'next/image';

<Image
  src="/product-image.jpg"
  alt={product.name}
  width={64}
  height={64}
  className="rounded-lg object-cover"
/>
```

---

## Appendix: File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Page | `page.tsx` | `replenishment/page.tsx` |
| Dashboard | `{Feature}Dashboard.tsx` | `ReplenishmentDashboard.tsx` |
| Table | `{Feature}Table.tsx` | `ReplenishmentTable.tsx` |
| Filter | `{Feature}Filter.tsx` | `ReplenishmentFilter.tsx` |
| Modal | `{Feature}Modal.tsx` | `ReceiptDetailModal.tsx` |
| Form | `{Feature}Form.tsx` | `ProductCreateForm.tsx` |
| API | `{feature}Api.ts` | `productsApi.ts` |
| Hook | `use{Feature}.ts` | `useWarehouseProducts.ts` |
| Type | `{feature}.types.ts` | `masterData.types.ts` |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-02 | Claude | Initial documentation |
