# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cucina Capitale is a kitchen design and quotation management system built with Next.js 14, React, TypeScript, and Supabase. The application serves as a comprehensive tool for managing kitchen projects, materials, quotations, and client relationships.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run vercel-build` - Build for Vercel deployment

### Database Management
- Database schema is managed with Drizzle ORM
- Schema file: `src/db/schema.ts`
- Migration files: `src/db/migrations/`
- Configuration: `drizzle.config.ts`

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: Clerk
- **UI Components**: Custom components built on Radix UI
- **PDF Generation**: @react-pdf/renderer
- **Forms**: React Hook Form with Zod validation

### Directory Structure

#### Core Application (`src/app/`)
- `(auth)/` - Authentication pages and layout
- `(dashboard)/` - Main application dashboard with nested routes:
  - `clientes/` - Client management
  - `cotizaciones/` - Quotation management and editing
  - `datos/` - Data management and import functionality
  - `productos/` - Product and material management
  - `reportes/` - Reports and analytics
- `cotizador/` - Quotation creation interface
- `api/` - API routes for backend functionality

#### Components (`src/components/`)
- `auth/` - Authentication components
- `cotizador/` - Quotation form and related components
- `dashboard/` - Dashboard-specific components
- `data-management/` - Data import and management tools
- `layout/` - Global layout components (header, footer)
- `productos/` - Product management components
- `project-codes/` - Project code generation
- `shared/` - Reusable components across the app
- `ui/` - Base UI components (buttons, forms, etc.)

#### Database & Services (`src/db/`, `src/lib/`)
- `db/` - Database schema and connection
- `lib/cotizador/` - Quotation calculation logic
- `lib/supabase/` - Supabase client configuration
- `hooks/` - Custom React hooks
- `types/` - TypeScript type definitions

### Key Database Tables

The system uses several interconnected tables:

1. **Core Business Tables**:
   - `users` - User accounts and roles
   - `clients` - Customer information
   - `products` - Kitchen products/services
   - `materials` - Construction materials catalog
   - `quotations` - Main quotation records
   - `quotation_items` - Individual quotation line items
   - `quotation_materials` - Material selections per quotation

2. **Inventory & Catalog**:
   - `insumos` - Main inventory (99K+ records)
   - `materiales` - Materials catalog (1.7K+ records)
   - `material_relationships` - Material compatibility mappings

### Application Features

#### Quotation System (`src/components/cotizador/`)
- Complex quotation form with material selection
- Dynamic pricing calculation based on materials and specifications
- PDF generation for quotations
- Material compatibility validation
- Inventory integration for product selection

#### Data Management (`src/components/data-management/`)
- Bulk import functionality for materials and products
- Material relationship management
- Inventory management with search and filtering

#### Authentication & Authorization
- Clerk integration for user management
- Route protection for dashboard areas
- Role-based access control

## Development Guidelines

### Material Selection Logic
The quotation system implements sophisticated material selection with:
- Material compatibility checking via `material_relationships` table
- Searchable comboboxes for material selection
- Real-time price calculations based on material choices
- Support for multiple material types: Tableros, Cubrecantos, Jaladeras, Correderas, Bisagras

### Database Queries
- Large datasets (insumos with 99K+ records) use pagination (20 items per page)
- Material searches implement efficient filtering by type and category
- Use parameterized queries for all database operations
- Implement proper error handling for Supabase operations

### Form Handling
- All forms use React Hook Form with Zod validation
- Complex forms (quotation form) use field arrays for dynamic item management
- Material selection uses custom combobox components with search functionality
- Form submission includes comprehensive error handling

### Performance Considerations
- Infinite scrolling for large datasets
- Dynamic imports for heavy components
- Proper error boundaries to handle component failures
- Material data is cached for efficient compatibility lookups

### Configuration Files
- Next.js config disabled TypeScript and ESLint checks during build
- Tailwind configured with custom design tokens
- Drizzle configured for PostgreSQL with Supabase

## Common Development Patterns

### Component Structure
- Use client components (`'use client'`) for interactive functionality
- Implement loading states and error boundaries
- Use Suspense for async operations
- Follow the established UI component patterns in `/components/ui/`

### Data Fetching
- Use Supabase client for database operations
- Implement proper error handling for all async operations
- Use React Query patterns for data caching where appropriate
- Follow the established patterns in existing components

### Styling
- Use Tailwind classes with the established design system
- Custom CSS variables defined in globals.css
- Consistent spacing and typography throughout
- Responsive design patterns already established

## Testing & Validation

When making changes:
1. Test the quotation form functionality at `/cotizador/nueva`
2. Verify material selection and compatibility checking
3. Test data import functionality in the data management section
4. Ensure PDF generation works correctly
5. Verify database operations don't break with large datasets

## Important Notes

- The quotation system is the core feature - changes should be thoroughly tested
- Material relationships are critical for business logic
- Large datasets require careful pagination handling
- Error boundaries are essential due to complex component interactions
- PDF generation has specific requirements and dependencies