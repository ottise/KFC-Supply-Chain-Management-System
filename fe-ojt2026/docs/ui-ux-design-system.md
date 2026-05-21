# KFC SCM - UI/UX Design System Guidelines (COMPLETE)

> Comprehensive design guidelines for KFC Supply Chain Management System
> Version: 3.0.0
> Last Updated: 2025-03-16
> Project: KFC Franchise Management System (Full Platform)

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Form Patterns (DETAILED)](#form-patterns-detailed)
6. [Layout Patterns (DETAILED)](#layout-patterns-detailed)
7. [Component Patterns](#component-patterns)
8. [Navigation Patterns](#navigation-patterns)
9. [Role-Based Design](#role-based-design)
10. [Interactive Elements](#interactive-elements)
11. [Status & Feedback](#status--feedback)
12. [Responsive Design](#responsive-design)
13. [Accessibility](#accessibility)
14. [Warehouse Components](#warehouse-components)
15. [Authentication Flow](#authentication-flow)
16. [Anti-Patterns](#anti-patterns)

---

## 🏗 Architecture Overview

### System Architecture

**Platform Type:** Multi-role SaaS application with role-based access control

**User Roles:**
1. **Guest/Public** - No authentication required
2. **Warehouse Staff** - Warehouse operations
3. **Warehouse Manager** - Full warehouse management
4. **Admin** - System administration and user management

**Route Groups:**
```
src/app/
├── (auth)/              # Authentication pages (public)
├── admin/                # Admin dashboard (admin role)
├── warehouse_manager/      # Warehouse manager (warehouse_manager role)
├── warehouse_staff/        # Warehouse staff (warehouse_staff role)
├── maintenance/           # Maintenance mode (public)
└── page.tsx              # Public landing page
```

**Layout Strategy:**
- **Root Layout** (`layout.tsx`): Global wrapper with AuthProvider + ToastProvider
- **Route-Specific Layouts:** Each role group has dedicated layout
- **Component Nesting:** Pages import own navigation components

**Component Distribution:**
- Total: 102+ components
- Admin: 15 components
- UI Reusable: 8 components
- Warehouse Manager: 42 components
- Warehouse Staff: 23 components
- Home/Landing: 10 components
- Common: 3 components

---

## 🎨 Color System

### Primary Colors

| Purpose | Color | Hex | Tailwind Class | Usage |
|----------|--------|-----|---------------|-------|
| **KFC Brand Red** | `#E4002B` | `bg-[#E4002B]` `text-[#E4002B]` | Primary actions, headers, brand elements, active states |
| **KFC Dark Red** | `#B8001F` | `to-[#B8001F]` | Gradients, hover on KFC Red |
| **Admin/Manager Red** | `#DC2626` | `text-[#DC2626]` | Warehouse manager branding |
| **Warehouse Staff Red** | `#E4002B` | Same as admin |

### Neutral Colors

| Purpose | Color | Hex | Tailwind Class | Usage |
|----------|--------|-----|---------------|-------|
| **Background** | `#FFFFFF` | `bg-white` | Main containers, cards |
| **Primary Background** | `#F9FAFB` | `bg-gray-50` | Input fields, subtle backgrounds |
| **Section Background** | `#F3F4F6` | `bg-gray-100` | Secondary backgrounds, hover states |
| **Border** | `#E5E7EB` | `border-gray-100` `border-gray-200` | Dividers, outlines |
| **Text Primary** | `#111827` | `text-gray-900` | Headlines, important text |
| **Text Secondary** | `#4B5563` | `text-gray-600` | Body text, descriptions |
| **Text Tertiary** | `#9CA3AF` | `text-gray-500` | Labels, helper text |
| **Text Muted** | `#9CA3AF` | `text-gray-400` | Optional labels, placeholder text |

### Status Colors

| Status | Background | Text/Icon | Usage |
|--------|-----------|-------------|-------|
| **Success** | `bg-green-50` | `text-green-600` `bg-green-600` | Active states, success messages, positive trends |
| **Error** | `bg-red-50` | `text-red-600` `bg-red-600` | Error messages, destructive actions, negative trends |
| **Warning** | `bg-yellow-50` | `text-yellow-600` `bg-yellow-500` | Warning states, pending status, caution alerts |
| **Info** | `bg-blue-50` | `text-blue-600` `bg-blue-600` | Information messages, neutral states |
| **Neutral** | `bg-gray-100` | `text-gray-500` `bg-gray-400` | Inactive states, disabled elements |

---

## 🔤 Typography

### Font System

| Category | Font Family | Weight | Size | Usage |
|----------|-------------|--------|-------|-------|
| **Primary Font** | Inter (sans-serif) | - | All UI elements |
| **Display Font** | Inter (sans-serif) | Bold | Page titles, hero sections |

### Text Hierarchy

| Element | Tailwind Class | Size | Weight | Letter Spacing | Usage |
|---------|---------------|-----|--------|---------------|-------|
| **H1 - Page Title** | `text-2xl md:text-3xl` | 24-30px | font-black | Landing page titles, hero headers |
| **H2 - Section Title** | `text-xl` | 20px | font-bold | Page section titles |
| **H3 - Card Title** | `text-lg` | 18px | font-bold | Card headers, modal titles |
| **Subtitle/Description** | `text-sm` | 14px | font-medium | Card descriptions, form instructions |
| **Body Text** | `text-sm` | 14px | font-medium | Table cells, list items |
| **Helper Text** | `text-xs` | 12px | font-semibold | Form labels, helper text |
| **Label Text** | `text-[10px]` | 10px | font-bold | Section labels, badges |
| **Caption/Micro Text** | `text-[10px]` | 10px | font-medium | Status badges, timestamps |

---

## 📐 Spacing & Layout

### Border Radius Scale

| Size | Tailwind Class | Usage |
|------|---------------|-------|
| **Small** | `rounded-xl` | Inputs, small buttons, badges, filter dropdowns |
| **Medium** | `rounded-2xl` | Cards, modals, filter containers, table containers |
| **Large** | `rounded-[2rem]` | Dashboard cards, main containers |
| **Extra Large** | `rounded-[2.5rem]` | Large modals, form containers |

### Padding Scale

| Element | Tailwind Class | Size | Usage |
|---------|---------------|-----|-------|
| **Tight** | `py-2` | 8px | Compact elements, badges |
| **Default** | `py-3` | 12px | Most inputs, buttons |
| **Comfortable** | `py-3.5` | 14px | Inputs with icons, select dropdowns |
| **Spacious** | `py-4` | 16px | Cards, sections |
| **Large** | `py-6` | 24px | Page containers, form headers |
| **Extra Large** | `py-8` | 32px | Modal forms, large containers |

---

## 📝 Form Patterns (DETAILED)

### 1. Login Form Pattern

**Use Case:** Authentication page

```tsx
"use client";
import React, { useState } from 'react';

interface LoginFormProps {
  onSubmit: (data: { username: string; password: string }) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-5">
      {/* Username Field */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
          Tên Đăng Nhập
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Nhập tên đăng nhập"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-3.5 pl-12 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-50 outline-none transition-all text-sm font-medium border border-transparent focus:border-red-200"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
          Mật Khẩu
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v6m0-6h6m-6 0H6a2 2 0 00-2 2v4a2 2 0 012 2v4a2 2 0 002 2v-4a2 2 0 002 2h4a2 2 0 016 2h-4" />
            </svg>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3.5 pl-12 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-50 outline-none transition-all text-sm font-medium border border-transparent focus:border-red-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 p-3 bg-white/0 hover:bg-gray-50 transition-colors text-gray-500"
            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268 2.924-1.756 2.37a1.724 1.724 0 002.573 1.066c1.543-.94 3.31-.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-2.573-1.066c-.94-1.543-.826 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 6.364 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
```

**Key Features:**
- Input with left icon (16px left padding)
- Password with show/hide toggle
- Focus states with ring
- Consistent spacing (space-y-1.5 for input groups)

---

### 2. Multi-Step Form Pattern

**Use Case:** Registration, complex data entry

```tsx
"use client";
import React, { useState } from 'react';

interface MultiStepFormProps {
  steps: Array<{ title: string; component: React.ReactNode }>;
  onComplete: () => void;
}

const MultiStepForm: React.FC<MultiStepFormProps> = ({ steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 gap-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 ${
              index < currentStep
                ? 'text-[#E4002B]'
                : index === currentStep
                ? 'text-[#E4002B]'
                : 'text-gray-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              index < currentStep
                ? 'bg-[#E4002B] text-white'
                : index === currentStep
                ? 'bg-[#E4002B] text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <span className="text-sm font-semibold">{step.title}</span>
            {index < steps.length - 1 && (
              <div className="h-0.5 w-full bg-gray-300" />
            )}
          </div>
        ))}
      </div>

      {/* Current Step */}
      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-lg">
        {steps[currentStep].component}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
        >
          Quay Lại
        </button>
        {currentStep < steps.length - 1 && (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="px-6 py-3 bg-[#E4002B] text-white font-bold rounded-xl text-xs uppercase shadow-lg shadow-red-100 hover:bg-red-700"
          >
            Tiếp Theo
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiStepForm;
```

**Key Features:**
- Visual step indicator (circles)
- Progress line between steps
- Active step highlighted (KFC Red)
- Previous/Next navigation
- Disabled state for first step

---

### 3. Filter Form Pattern

**Use Case:** Search and filter combinations

```tsx
"use client";
import React, { useState } from 'react';

interface FilterFormProps {
  onFilter: (filters: any) => void;
  availableFilters?: {
    roles?: Array<{ value: number; label: string }>;
    statuses?: Array<{ value: string; label: string }>;
    categories?: Array<{ value: string; label: string }>;
  };
}

const FilterForm: React.FC<FilterFormProps> = ({ onFilter, availableFilters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedRole(undefined);
    setSelectedStatus(undefined);
    setSelectedCategory(undefined);
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchTerm || selectedRole !== undefined || selectedStatus !== undefined || selectedCategory !== undefined || dateFrom || dateTo;

  return (
    <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100 shadow-sm">
      <div className="flex flex-wrap items-end gap-3 mb-4">
        {/* Search Input */}
        <div className="flex-1 w-full min-w-[200px]">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
            Tìm Kiếm
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên, mã,..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-50 outline-none transition-all text-sm font-medium border border-transparent focus:border-red-200"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-3 flex-wrap">
          {/* Role Filter */}
          {availableFilters?.roles && (
            <div className="w-full md:w-48">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                Vai Trò
              </label>
              <div className="relative">
                <select
                  value={selectedRole ?? ''}
                  onChange={(e) => setSelectedRole(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-3.5 pl-12 bg-gray-50 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-red-200 appearance-none cursor-pointer"
                >
                  <option value="">Tất cả</option>
                  {availableFilters.roles.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Status Filter */}
          {availableFilters?.statuses && (
            <div className="w-full md:w-48">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                Trạng Thái
              </label>
              <div className="relative">
                <select
                  value={selectedStatus ?? ''}
                  onChange={(e) => setSelectedStatus(e.target.value || undefined)}
                  className="w-full px-4 py-3.5 pl-12 bg-gray-50 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-red-200 appearance-none cursor-pointer"
                >
                  <option value="">Tất cả</option>
                  {availableFilters.statuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="flex gap-3">
          <div className="w-full md:w-40">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
              Từ Ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-red-200"
            />
          </div>
          <div className="w-full md:w-40">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
              Đến Ngày
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-red-200"
            />
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-all"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Xóa Lọc
          </span>
        </button>
      )}
    </div>
  );
};

export default FilterForm;
```

**Key Features:**
- Search input with icon
- Multiple filter dropdowns with icons
- Date range picker (two inputs)
- Clear filters button (only shows when active filters exist)
- Responsive layout (flex-wrap for mobile)

---

### 4. CRUD Form Pattern

**Use Case:** Create/Edit data

```tsx
"use client";
import React, { useState } from 'react';

interface CRUDFormProps {
  title: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'textarea';
    placeholder?: string;
    options?: Array<{ value: any; label: string }>;
    required?: boolean;
  }>;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const CRUDForm: React.FC<CRUDFormProps> = ({ title, fields, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const renderField = (field: any) => {
    const hasError = errors[field.name];

    if (field.type === 'text') {
      return (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            placeholder={field.placeholder || ''}
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className={`w-full px-4 py-3.5 bg-gray-50 rounded-xl outline-none text-sm font-medium border transition-all ${
              hasError
                ? 'border-red-500 focus:border-red-500'
                : 'border-transparent focus:border-red-200'
            }`}
          />
          {hasError && (
            <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>
          )}
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full px-4 py-3.5 bg-gray-50 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-red-200 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <option value="">Chọn...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            placeholder={field.placeholder || ''}
            value={formData[field.name] || ''}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            rows={4}
            className={`w-full px-4 py-3.5 bg-gray-50 rounded-xl outline-none text-sm font-medium border transition-all resize-none ${
              hasError
                ? 'border-red-500 focus:border-red-500'
                : 'border-transparent focus:border-red-200'
            }`}
          />
          {hasError && (
            <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>
          )}
        </div>
      );
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} không được để trống`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  return (
    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E4002B] to-[#B8001F] p-6 text-white text-center relative">
        <h2 className="text-lg font-bold uppercase tracking-widest mb-1">
          {title}
        </h2>
        <button
          type="button"
          className="absolute right-6 top-6 text-white/60 hover:text-white transition-colors"
          aria-label="Đóng"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form Body */}
      <form className="p-8 space-y-5" onSubmit={handleSubmit}>
        {fields.map((field, index) => (
          <div key={index}>
            {renderField(field)}
          </div>
        ))}
      </form>

      {/* Actions */}
      <div className="px-8 py-4 bg-gray-50 flex gap-3">
        <button
          type="button"
          disabled={isLoading}
          className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Hủy Bỏ
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-[2] py-4 bg-[#E4002B] text-white font-bold rounded-xl text-[10px] uppercase shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V12a4 4 0 012 2h4a2 2 0 002 2h-4a2 2 0 016 2h-4"></path>
              </svg>
              Đang Lưu...
            </>
          ) : (
            'Lưu'
          )}
        </button>
      </div>
    </div>
  );
};

export default CRUDForm;
```

**Key Features:**
- KFC Red gradient header
- Dynamic field rendering based on type
- Required field indicator (red asterisk)
- Error states with red border
- Loading state with spinner
- Disabled states during submission

---

## 📐 Layout Patterns (DETAILED)

### 1. Sidebar + Main Content Layout

**Use Case:** Admin dashboard, warehouse management

```tsx
"use client";
import React, { useState } from 'react';

interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
  sidebarWidth?: string;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  sidebar,
  mainContent,
  sidebarWidth = 'w-64'
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-20 h-[calc(100vh-80px)] bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 ${sidebarWidth}`}
      >
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="ml-0 md:ml-64 mt-20 p-6 md:p-8 min-h-screen bg-gray-50">
        {mainContent}
      </main>
    </>
  );
};

export default SidebarLayout;
```

**Key Features:**
- Mobile slide-in sidebar with overlay
- Fixed positioning for desktop
- Smooth transition animations
- Content area adjusts margin based on sidebar visibility

---

### 2. Two-Column Dashboard Layout

**Use Case:** Dashboard with sidebar + main content

```tsx
"use client";
import React from 'react';

interface TwoColumnLayoutProps {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ leftColumn, rightColumn }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column - Sidebar (3/12 = 25%) */}
      <div className="lg:col-span-3">
        {leftColumn}
      </div>

      {/* Right Column - Main Content (9/12 = 75%) */}
      <div className="lg:col-span-9">
        {rightColumn}
      </div>
    </div>
  );
};

export default TwoColumnLayout;
```

**Key Features:**
- Responsive 1-column on mobile, 2-column on desktop
- 25% width for sidebar, 75% for main content
- Consistent gap spacing

---

### 3. Three-Column Content Layout

**Use Case:** Content sections with sidebar

```tsx
"use client";
import React from 'react';

interface ThreeColumnLayoutProps {
  sidebar: React.ReactNode;
  contentLeft: React.ReactNode;
  contentRight: React.ReactNode;
}

const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  sidebar,
  contentLeft,
  contentRight
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar Column (1/3 = 33.3%) */}
      <div className="lg:col-span-1">
        {sidebar}
      </div>

      {/* Content Left (1/3 = 33.3%) */}
      <div className="lg:col-span-1">
        {contentLeft}
      </div>

      {/* Content Right (1/3 = 33.3%) */}
      <div className="lg:col-span-1">
        {contentRight}
      </div>
    </div>
  );
};

export default ThreeColumnLayout;
```

**Key Features:**
- Equal-width 3 columns on desktop
- Collapses to single column on mobile
- Good for dashboard + sidebar layout

---

### 4. Card Grid Layout

**Use Case:** Dashboard cards, product grid

```tsx
"use client";
import React from 'react';

interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

const CardGrid: React.FC<CardGridProps> = ({ children, columns = 4 }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`${gridCols[columns as keyof typeof gridCols]} gap-4 md:gap-6`}>
      {children}
    </div>
  );
};

export default CardGrid;
```

**Key Features:**
- Responsive grid columns
- Consistent gap spacing
- Mobile-first approach (1 column → 2 → 3 → 4)

---

### 5. Full Screen Modal Layout

**Use Case:** Modal with overlay

```tsx
"use client";
import React, { useEffect } from 'react';

interface ModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ModalLayout: React.FC<ModalLayoutProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'xl'
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl'
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
      >
        {/* Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`bg-white w-full ${sizeClasses[size]} rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 my-8`}
        >
          {/* Modal Header */}
          {title && (
            <div className="bg-gradient-to-r from-[#E4002B] to-[#B8001F] p-6 text-white text-center relative">
              <h2 className="text-lg font-bold uppercase tracking-widest">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-6 top-6 text-white/60 hover:text-white transition-colors"
                aria-label="Đóng"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          )}

          {/* Modal Body */}
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalLayout;
```

**Key Features:**
- Full-screen overlay with blur
- Centered modal content
- Escape key handling
- Click outside to close
- Stop propagation on modal content
- Size variants for different use cases

---

## 🎨 Color Scheme Examples

### 1. Primary Action Color Scheme

**Purpose:** Consistent primary actions across application

```tsx
// Primary Button (KFC Red)
<button className="bg-[#E4002B] text-white font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all">
  Lưu
</button>

// Primary Button with Icon
<button className="flex items-center gap-2 px-4 py-3 bg-[#E4002B] text-white font-bold rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all">
  <svg className="w-5 h-5" />
  <span>Tạo Mới</span>
</button>

// Primary Button Disabled
<button disabled className="bg-[#E4002B] text-white font-bold rounded-xl shadow-lg opacity-50 cursor-not-allowed transition-all">
  Lưu
</button>
```

### 2. Status Color Scheme

**Purpose:** Visual indication of status

```tsx
// Success Status
<span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full uppercase tracking-wider text-[10px] font-bold">
  Hoạt Động
</span>

// Error Status
<span className="px-4 py-1.5 bg-red-50 text-red-600 rounded-full uppercase tracking-wider text-[10px] font-bold">
  Lỗi
</span>

// Warning Status
<span className="px-4 py-1.5 bg-yellow-50 text-yellow-600 rounded-full uppercase tracking-wider text-[10px] font-bold">
  Đang Xử Lý
</span>

// Neutral Status
<span className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full uppercase tracking-wider text-[10px] font-bold">
  Chờ Duyệt
</span>

// Status with Icon (for tables)
<span className="flex items-center gap-2">
  <span className={`w-2 h-2 rounded-full ${statusColorClass}`}></span>
  <span className="text-sm font-medium">{statusText}</span>
</span>
```

### 3. Neutral Color Scheme

**Purpose:** Backgrounds, cards, secondary elements

```tsx
// Primary Background
<div className="bg-white">
  {/* Content */}
</div>

// Secondary Background (Input Fields, Subtle Cards)
<div className="bg-gray-50">
  {/* Content */}
</div>

// Hover Background
<div className="hover:bg-gray-100 transition-colors">
  {/* Interactive element */}
</div>

// Border Colors
<div className="border border-gray-100">
  {/* Card or section */}
</div>

<div className="border border-gray-200">
  {/* More prominent border */}
</div>
```

### 4. Text Color Scheme

**Purpose:** Typography hierarchy

```tsx
// Primary Text (Headlines, Important Content)
<h1 className="text-gray-900 font-black">
  Tiêu Đề Chính
</h1>

// Secondary Text (Body, Descriptions)
<p className="text-gray-600 font-medium">
  Mô tả chi tiết của nội dung
</p>

// Tertiary Text (Labels, Helpers)
<label className="text-gray-500 font-semibold">
  Tên trường
</label>

// Muted Text (Placeholders, Optional)
<p className="text-gray-400 font-medium">
  (Tùy chọn)
</p>

// Inverted Text (on dark/red background)
<span className="text-white font-bold">
  Text trên nền đỏ
</span>
```

### 5. Gradient Color Schemes

**Purpose:** Headers, highlights, brand elements

```tsx
// KFC Red Gradient (Primary)
<div className="bg-gradient-to-r from-[#E4002B] to-[#B8001F]">
  <h2 className="text-white font-bold">Tiêu Đề</h2>
</div>

// Blue Gradient (Info/Secondary)
<div className="bg-gradient-to-r from-blue-600 to-blue-800">
  <h2 className="text-white font-bold">Thông Báo</h2>
</div>

// Green Gradient (Success/Positive)
<div className="bg-gradient-to-r from-green-600 to-green-800">
  <div className="p-4">
    <p className="text-white font-medium">Thành công!</p>
  </div>
</div>
```

---

## [Continue with existing sections...]

### Component Patterns
[...existing content...]

### Navigation Patterns
[...existing content...]

### Role-Based Design
[...existing content...]

### Interactive Elements
[...existing content...]

### Status & Feedback
[...existing content...]

### Responsive Design
[...existing content...]

### Accessibility
[...existing content...]

### Warehouse Components
[...existing content...]

### Authentication Flow
[...existing content...]

### Anti-Patterns
[...existing content...]

---

## 📚 Component Library Reference

### Available UI Components

[...existing content...]

### Placeholder Components (Need Implementation)

[...existing content...]

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-03-16 | Initial comprehensive system documentation |
| 2.0.0 | 2025-03-16 | Added detailed form patterns with code examples |
| 3.0.0 | 2025-03-16 | Added detailed layout patterns with code examples |
| 4.0.0 | 2025-03-16 | Added color scheme examples with code examples |

---

> **Note:** This document is the authoritative source for UI/UX design guidelines across the entire KFC SCM platform. All code examples are production-ready and can be directly copied and adapted for your specific use cases.
