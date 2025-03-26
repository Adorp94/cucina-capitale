import { Decimal } from 'decimal.js';

// Company Information schema
export interface CompanyInfo {
  name: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  rfc: string;
}

// Client schema for PDF
export interface ClientInfo {
  id_cliente: number;
  nombre: string;
  correo?: string;
  celular?: string;
  direccion?: string;
  rfc?: string;
}

// Quotation Item schema for PDF
export interface QuotationItemPDF {
  id_item: number;
  description: string;
  quantity: number;
  unitPrice: number | Decimal;
  discount: number;
  subtotal: number | Decimal;
  area?: string;
  position?: number;
}

// Full Quotation schema for PDF
export interface QuotationPDF {
  id_cotizacion: number;
  created_at: string;
  project_name: string;
  project_type: string;
  subtotal: number | Decimal;
  tax_rate: number;
  taxes: number | Decimal;
  total: number | Decimal;
  valid_until?: string;
  delivery_time?: string;
  notes?: string;
  status: string;
  items: QuotationItemPDF[];
}

// Full PDF content schema
export interface PDFContent {
  quotation: QuotationPDF;
  client: ClientInfo;
  companyInfo: CompanyInfo;
} 