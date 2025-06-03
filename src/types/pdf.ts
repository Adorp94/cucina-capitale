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

// QuotationItem for PDF display
export interface QuotationItem {
  id: string | number;
  description: string;
  quantity: number;
  unitPrice: Decimal;
  discount: number;
  subtotal: Decimal;
}

// Full Quotation schema for PDF
export interface QuotationPDF {
  id_cotizacion: number;
  project_name: string;
  project_code?: string;
  project_type: string;
  subtotal: Decimal;
  tax_rate: number;
  taxes: Decimal;
  total: Decimal;
  created_at: string;
  delivery_time: string;
  status: string;
  valid_until: string;
  notes: string;
  items: QuotationItem[];
  materials?: Record<string, string>;
}

// Full PDF content schema
export interface PDFContent {
  quotation: QuotationPDF;
  client: ClientInfo;
  companyInfo: CompanyInfo;
} 