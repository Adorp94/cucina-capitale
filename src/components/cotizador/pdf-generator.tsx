'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Quotation } from '@/types/cotizacion';
import { formatCurrency } from '@/lib/cotizador/calculator';
import { DEFAULT_COTIZADOR_CONFIG } from '@/lib/cotizador/constants';

interface PDFGeneratorProps {
  cotizacion: Quotation;
  cliente?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    rfc?: string;
  };
}

export default function PDFGenerator({ cotizacion, cliente }: PDFGeneratorProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!contentRef.current) return;
    
    // Crea un nuevo documento para impresión
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Asegúrate de que las ventanas emergentes estén permitidas para imprimir la cotización');
      return;
    }

    // Añade estilos básicos para impresión
    printWindow.document.write(`
      <html>
        <head>
          <title>Cotización ${cotizacion.number}</title>
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #e2e8f0;
            }
            .company-info {
              text-align: right;
            }
            .company-name {
              font-size: 1.5rem;
              font-weight: bold;
            }
            .quote-title {
              font-size: 1.5rem;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .quote-number {
              color: #6b7280;
              margin-bottom: 10px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 1rem;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .box {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #f9fafb;
              text-align: left;
              padding: 12px;
              font-weight: 600;
              border-bottom: 1px solid #e2e8f0;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            .text-right {
              text-align: right;
            }
            .total-section {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .separator {
              height: 1px;
              background-color: #e2e8f0;
              margin: 10px 0;
            }
            .grand-total {
              font-weight: bold;
              font-size: 1.2rem;
              margin-top: 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 0.8rem;
              color: #6b7280;
            }
            @media print {
              body {
                padding: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${contentRef.current.innerHTML}
          <div class="footer">
            <p>Cotización generada el ${format(new Date(), 'PPP', { locale: es })}</p>
            <p>${DEFAULT_COTIZADOR_CONFIG.companyInfo.website} | ${DEFAULT_COTIZADOR_CONFIG.companyInfo.email} | ${DEFAULT_COTIZADOR_CONFIG.companyInfo.phone}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div>
      <Button onClick={handlePrint} className="mb-4">
        Generar PDF
      </Button>
      
      {/* Contenido que se imprimirá - se mantiene oculto */}
      <div className="hidden">
        <div ref={contentRef}>
          <div className="header">
            <div>
              <div className="quote-title">{cotizacion.title}</div>
              <div className="quote-number">No. {cotizacion.number}</div>
            </div>
            <div className="company-info">
              <div className="company-name">{DEFAULT_COTIZADOR_CONFIG.companyInfo.name}</div>
              <div>{DEFAULT_COTIZADOR_CONFIG.companyInfo.address}</div>
              <div>RFC: {DEFAULT_COTIZADOR_CONFIG.companyInfo.rfc}</div>
            </div>
          </div>
          
          <div className="grid">
            <div className="section">
              <div className="section-title">Información del Cliente</div>
              <div className="box">
                {cliente ? (
                  <>
                    <div style={{ fontWeight: 500 }}>{cliente.name}</div>
                    {cliente.address && <div>{cliente.address}</div>}
                    {cliente.rfc && <div>RFC: {cliente.rfc}</div>}
                    {cliente.email && <div>{cliente.email}</div>}
                    {cliente.phone && <div>{cliente.phone}</div>}
                  </>
                ) : (
                  <div>Cliente no especificado</div>
                )}
              </div>
            </div>
            
            <div className="section">
              <div className="section-title">Detalles de Cotización</div>
              <div className="box">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <span>Fecha de emisión:</span>
                  <span>{format(new Date(cotizacion.createdAt || new Date()), 'PPP', { locale: es })}</span>
                  
                  <span>Válida hasta:</span>
                  <span>
                    {cotizacion.validUntil 
                      ? format(new Date(cotizacion.validUntil), 'PPP', { locale: es })
                      : 'No especificado'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {cotizacion.description && (
            <div className="section">
              <div className="section-title">Descripción</div>
              <div>{cotizacion.description}</div>
            </div>
          )}
          
          <div className="section">
            <div className="section-title">Productos y Servicios</div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Descripción</th>
                  <th className="text-right">Cantidad</th>
                  <th className="text-right">Precio Unit.</th>
                  <th className="text-right">Descuento</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cotizacion.items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td style={{ fontWeight: 500 }}>{index + 1}</td>
                    <td>{item.description}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">${formatCurrency(item.unitPrice)}</td>
                    <td className="text-right">
                      {item.discount > 0 ? `${item.discount}%` : '-'}
                    </td>
                    <td className="text-right">${formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="total-section">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(cotizacion.subtotal)}</span>
              </div>
              <div className="total-row">
                <span>IVA ({DEFAULT_COTIZADOR_CONFIG.taxRate}%):</span>
                <span>${formatCurrency(cotizacion.taxes)}</span>
              </div>
              <div className="separator"></div>
              <div className="total-row grand-total">
                <span>Total:</span>
                <span>${formatCurrency(cotizacion.total)}</span>
              </div>
            </div>
          </div>
          
          {cotizacion.terms && (
            <div className="section">
              <div className="section-title">Términos y Condiciones</div>
              <div className="box" style={{ whiteSpace: 'pre-line' }}>
                {cotizacion.terms}
              </div>
            </div>
          )}
          
          {cotizacion.notes && (
            <div className="section">
              <div className="section-title">Notas Adicionales</div>
              <div>{cotizacion.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}