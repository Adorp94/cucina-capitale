import { z } from 'zod';

// Esquema para validación de cliente
export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  rfc: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type Client = z.infer<typeof clientSchema>;

// Esquema para validación de producto
export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  basePrice: z.number().min(0, 'El precio no puede ser negativo'),
  category: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type Product = z.infer<typeof productSchema>;

// Esquema para materiales
export const materialsCombinationSchema = z.object({
  matHuacal: z.string().optional(),
  chapHuacal: z.string().optional(),
  matVista: z.string().optional(),
  chapVista: z.string().optional(),
  jaladera: z.string().optional(),
  corredera: z.string().optional(),
  bisagra: z.string().optional(),
});

export type MaterialsCombination = z.infer<typeof materialsCombinationSchema>;

// Esquema para validación de elemento de cotización
export const quotationItemSchema = z.object({
  id: z.string().optional(),
  quotationId: z.string().optional(),
  productId: z.string().optional().nullable(),
  area: z.string().optional(),
  description: z.string().min(1, 'La descripción es obligatoria'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number().min(0, 'El precio unitario no puede ser negativo'),
  discount: z.number().min(0, 'El descuento no puede ser negativo').default(0),
  subtotal: z.number().min(0, 'El subtotal no puede ser negativo').optional(),
  notes: z.string().optional().nullable(),
  position: z.number().int().nonnegative().default(0),
  drawers: z.number().int().nonnegative().default(0),
  doors: z.number().int().nonnegative().default(0),
  shelves: z.number().int().nonnegative().default(0),
});

export type QuotationItem = z.infer<typeof quotationItemSchema>;

// Esquema para validación de cotización
export const quotationSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, 'El cliente es obligatorio'),
  projectName: z.string().optional(),
  number: z.string().min(1, 'El número de cotización es obligatorio'),
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected', 'expired']).default('draft'),
  subtotal: z.number().min(0, 'El subtotal no puede ser negativo'),
  taxes: z.number().min(0, 'Los impuestos no pueden ser negativos'),
  total: z.number().min(0, 'El total no puede ser negativo'),
  anticipo: z.number().min(0, 'El anticipo no puede ser negativo').optional(),
  liquidacion: z.number().min(0, 'La liquidación no puede ser negativa').optional(),
  validUntil: z.date().optional().nullable(),
  deliveryTime: z.string().optional(),
  paymentTerms: z.string().optional(),
  paymentInfo: z.string().optional(),
  materialsCombination: materialsCombinationSchema.optional(),
  generalNotes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(quotationItemSchema),
  metadata: z.record(z.any()).optional().nullable(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export type Quotation = z.infer<typeof quotationSchema>;

// Tipos para el formulario de cotización
export const createQuotationSchema = quotationSchema.omit({ 
  id: true, 
  subtotal: true, 
  taxes: true, 
  total: true,
  anticipo: true,
  liquidacion: true
}).extend({
  items: z.array(quotationItemSchema.omit({ 
    id: true, 
    quotationId: true, 
    subtotal: true 
  }))
});

export type CreateQuotationFormData = z.infer<typeof createQuotationSchema>;

// Configuración del cotizador
export interface CotizadorConfig {
  taxRate: number;
  defaultTerms: string;
  validityDays: number;
  companyInfo: {
    name: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    rfc: string;
  };
}