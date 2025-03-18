import { Decimal } from 'decimal.js';
import { QuotationItem, Quotation } from '@/types/cotizacion';

// Configurando Decimal para manejar precisión monetaria
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

// Interfaz para los elementos del cálculo
export interface CalculationItem extends Omit<QuotationItem, 'quantity' | 'unitPrice' | 'discount' | 'subtotal'> {
  quantity: Decimal;
  unitPrice: Decimal;
  discount: Decimal;
  subtotal: Decimal;
}

// Función para calcular el subtotal de un ítem
export function calculateItemSubtotal(
  quantity: Decimal, 
  unitPrice: Decimal, 
  discountRate: Decimal
): Decimal {
  const baseAmount = quantity.mul(unitPrice);
  const discountAmount = baseAmount.mul(discountRate.div(100));
  return baseAmount.minus(discountAmount);
}

// Función para convertir un ítem normal a ítem de cálculo
export function toCalculationItem(item: Omit<QuotationItem, 'subtotal'>): CalculationItem {
  const quantity = new Decimal(item.quantity);
  const unitPrice = new Decimal(item.unitPrice);
  const discount = new Decimal(item.discount);
  
  const subtotal = calculateItemSubtotal(quantity, unitPrice, discount);
  
  return {
    ...item,
    quantity,
    unitPrice,
    discount,
    subtotal
  };
}

// Función para calcular todos los totales de la cotización
export function calculateQuotationTotals(
  items: Omit<QuotationItem, 'subtotal'>[],
  taxRate: number = 16
): {
  items: CalculationItem[];
  subtotal: Decimal;
  taxes: Decimal;
  total: Decimal;
} {
  // Convertir ítems y calcular subtotales
  const calculatedItems = items.map(toCalculationItem);
  
  // Calcular subtotal, impuestos y total
  const subtotal = calculatedItems.reduce(
    (sum, item) => sum.plus(item.subtotal),
    new Decimal(0)
  );
  
  const taxes = subtotal.mul(new Decimal(taxRate).div(100));
  const total = subtotal.plus(taxes);
  
  return {
    items: calculatedItems,
    subtotal,
    taxes,
    total
  };
}

// Función para formatear un valor decimal como moneda
export function formatCurrency(value: Decimal | number): string {
  const decimalValue = value instanceof Decimal ? value : new Decimal(value);
  return decimalValue.toFixed(2);
}

// Función para formatear como porcentaje
export function formatPercent(value: Decimal | number): string {
  const decimalValue = value instanceof Decimal ? value : new Decimal(value);
  return `${decimalValue.toFixed(2)}%`;
}

// Función para convertir los valores Decimal a number para la base de datos
export function prepareQuotationForStorage(
  quotation: Quotation
): Omit<Quotation, 'subtotal' | 'taxes' | 'total'> & {
  subtotal: number;
  taxes: number;
  total: number;
  items: (Omit<QuotationItem, 'subtotal'> & { subtotal: number })[];
} {
  return {
    ...quotation,
    subtotal: Number(quotation.subtotal),
    taxes: Number(quotation.taxes),
    total: Number(quotation.total),
    items: quotation.items.map(item => ({
      ...item,
      subtotal: Number(item.subtotal)
    }))
  };
}