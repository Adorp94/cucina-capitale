import { pgTable, text, timestamp, uuid, integer, numeric, boolean, jsonb } from 'drizzle-orm/pg-core';

// Tabla de usuarios (complementa a la tabla auth.users de Supabase)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().notNull(),
  fullName: text('full_name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabla de clientes
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  rfc: text('rfc'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

// Tabla de productos/servicios
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  unit: text('unit'), // unidad de medida (m², pieza, servicio, etc.)
  basePrice: numeric('base_price').notNull(), // precio base sin impuestos
  category: text('category'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

// Tabla de cotizaciones
export const quotations = pgTable('quotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => clients.id),
  number: text('number').notNull(), // número de cotización (ej. COT-2023-001)
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('draft'), // draft, sent, approved, rejected, expired
  subtotal: numeric('subtotal').notNull(),
  taxes: numeric('taxes').notNull(),
  total: numeric('total').notNull(),
  validUntil: timestamp('valid_until'),
  terms: text('terms'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  metadata: jsonb('metadata'), // para almacenar datos adicionales específicos
});

// Tabla de elementos de cotización (líneas de items)
export const quotationItems = pgTable('quotation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull(),
  productId: uuid('product_id').references(() => products.id),
  description: text('description').notNull(),
  quantity: numeric('quantity').notNull(),
  unitPrice: numeric('unit_price').notNull(),
  discount: numeric('discount').default('0'),
  subtotal: numeric('subtotal').notNull(),
  notes: text('notes'),
  position: integer('position').notNull(), // para ordenar los items
});