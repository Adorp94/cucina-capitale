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

// Tabla de materiales
export const materials = pgTable('materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull(), // huacal, vista, jaladera, corredera, bisagra, etc.
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
});

// Tabla de cotizaciones
export const quotations = pgTable('quotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => clients.id),
  projectName: text('project_name'),
  number: text('number').notNull(), // número de cotización (ej. COT-2023-001)
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('draft'), // draft, sent, approved, rejected, expired
  subtotal: numeric('subtotal').notNull(),
  taxes: numeric('taxes').notNull(),
  total: numeric('total').notNull(),
  anticipo: numeric('anticipo'), // 70% del total
  liquidacion: numeric('liquidacion'), // 30% del total
  validUntil: timestamp('valid_until'),
  deliveryTime: text('delivery_time'),
  paymentTerms: text('payment_terms'),
  paymentInfo: text('payment_info'),
  generalNotes: text('general_notes'),
  terms: text('terms'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  metadata: jsonb('metadata'), // para almacenar datos adicionales específicos
});

// Tabla de materiales de cotización
export const quotationMaterials = pgTable('quotation_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull(),
  matHuacal: text('mat_huacal'),
  chapHuacal: text('chap_huacal'),
  matVista: text('mat_vista'),
  chapVista: text('chap_vista'),
  jaladera: text('jaladera'),
  corredera: text('corredera'),
  bisagra: text('bisagra'),
  combinationName: text('combination_name').default('Combinación #1'),
});

// Tabla de elementos de cotización (líneas de items)
export const quotationItems = pgTable('quotation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull(),
  productId: uuid('product_id').references(() => products.id),
  area: text('area'),
  description: text('description').notNull(),
  quantity: numeric('quantity').notNull(),
  unitPrice: numeric('unit_price').notNull(),
  discount: numeric('discount').default('0'),
  subtotal: numeric('subtotal').notNull(),
  drawers: integer('drawers').default(0),
  doors: integer('doors').default(0),
  shelves: integer('shelves').default(0),
  notes: text('notes'),
  position: integer('position').notNull(), // para ordenar los items
});