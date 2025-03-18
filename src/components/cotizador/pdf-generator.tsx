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
              max-width: 1000px;
              margin: 0 auto;
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
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .table th {
              background-color: #f9fafb;
              text-align: left;
              padding: 8px;
              font-weight: 600;
              border-bottom: 1px solid #e2e8f0;
            }
            .table td {
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .info-table {
              width: 100%;
            }
            .info-table td {
              padding: 4px;
              vertical-align: top;
            }
            .label {
              font-weight: 600;
            }
            .materials-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .materials-table th, 
            .materials-table td {
              border: 1px solid #e2e8f0;
              padding: 6px;
              text-align: center;
            }
            .materials-table th {
              background-color: #f9fafb;
            }
            .payment-box {
              background-color: #ebf5ff;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .totals-box {
              margin-left: auto;
              width: 300px;
            }
            .totals-table {
              width: 100%;
            }
            .totals-table td {
              padding: 4px;
            }
            .total-row {
              font-weight: bold;
              border-top: 2px solid #e2e8f0;
            }
            .observations {
              font-size: 0.9rem;
              white-space: pre-line;
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
          <div class="header">
            <div>
              <div class="quote-title">${cotizacion.title}</div>
              <div class="quote-number">No. ${cotizacion.number}</div>
            </div>
            <div class="company-info">
              <div class="company-name">${DEFAULT_COTIZADOR_CONFIG.companyInfo.name}</div>
              <div>COTIZACIÓN</div>
            </div>
          </div>
          
          <table class="info-table">
            <tr>
              <td width="50%">
                <table>
                  <tr>
                    <td class="label">Presupuesto para:</td>
                    <td>${cliente?.name || 'Cliente no especificado'}</td>
                  </tr>
                  <tr>
                    <td class="label">Nombre de proyecto:</td>
                    <td>${cotizacion.projectName || 'No especificado'}</td>
                  </tr>
                </table>
              </td>
              <td width="50%">
                <table>
                  <tr>
                    <td class="label">Fecha de cotización:</td>
                    <td>${format(new Date(cotizacion.createdAt || new Date()), 'dd-MMM-yyyy', { locale: es })}</td>
                  </tr>
                  <tr>
                    <td class="label">Vigencia de cotización:</td>
                    <td>${cotizacion.validUntil ? format(new Date(cotizacion.validUntil), 'dd-MMM-yyyy', { locale: es }) : 'No especificado'}</td>
                  </tr>
                  <tr>
                    <td class="label">Tipo de Proyecto:</td>
                    <td>Desarrollo</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          
          ${cotizacion.materialsCombination ? `
          <div class="section">
            <div class="section-title">Materiales</div>
            <table class="materials-table">
              <tr>
                <th>Mat Huacal</th>
                <th>Chap. Huacal</th>
                <th>Jaladera</th>
                <th>Bisagras</th>
              </tr>
              <tr>
                <td>${cotizacion.materialsCombination.matHuacal || ''}</td>
                <td>${cotizacion.materialsCombination.chapHuacal || ''}</td>
                <td>${cotizacion.materialsCombination.jaladera || ''}</td>
                <td>${cotizacion.materialsCombination.bisagra || ''}</td>
              </tr>
              <tr>
                <th>Mat Vista</th>
                <th>Chap. Vista</th>
                <th>Corredera</th>
                <th>Combinación #1</th>
              </tr>
              <tr>
                <td>${cotizacion.materialsCombination.matVista || ''}</td>
                <td>${cotizacion.materialsCombination.chapVista || ''}</td>
                <td>${cotizacion.materialsCombination.corredera || ''}</td>
                <td><strong>Combinación #1</strong></td>
              </tr>
            </table>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">Productos y Servicios</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Área</th>
                  <th>Mueble</th>
                  <th class="text-center">Cant.</th>
                  <th class="text-center">Cajones</th>
                  <th class="text-center">Puertas</th>
                  <th class="text-center">Entrepaños</th>
                  <th class="text-right">P. Unit</th>
                  <th class="text-right">P. Total</th>
                </tr>
              </thead>
              <tbody>
                ${cotizacion.items.map((item, index) => `
                <tr>
                  <td>${item.area || '-'}</td>
                  <td>${item.description}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-center">${item.drawers || 0}</td>
                  <td class="text-center">${item.doors || 0}</td>
                  <td class="text-center">${item.shelves || 0}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                  <td class="text-right">${formatCurrency(item.subtotal || (item.unitPrice * item.quantity))}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="display: flex; justify-content: flex-end;">
              <div class="totals-box">
                <table class="totals-table">
                  <tr>
                    <td class="label text-right">Subtotal:</td>
                    <td class="text-right">${formatCurrency(cotizacion.subtotal)}</td>
                  </tr>
                  <tr>
                    <td class="label text-right">IVA (${DEFAULT_COTIZADOR_CONFIG.taxRate}%):</td>
                    <td class="text-right">${formatCurrency(cotizacion.taxes)}</td>
                  </tr>
                  <tr class="total-row">
                    <td class="label text-right">TOTAL:</td>
                    <td class="text-right">${formatCurrency(cotizacion.total)}</td>
                  </tr>
                </table>
                
                <table class="totals-table" style="margin-top: 15px;">
                  <tr>
                    <td class="label text-right">Desglose:</td>
                    <td class="text-right">70 / 30</td>
                  </tr>
                  <tr>
                    <td class="label text-right">Anticipo:</td>
                    <td class="text-right">${formatCurrency(cotizacion.anticipo || 0)}</td>
                  </tr>
                  <tr>
                    <td class="label text-right">Liquidación:</td>
                    <td class="text-right">${formatCurrency(cotizacion.liquidacion || 0)}</td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
            <div class="payment-box" style="flex: 1; min-width: 300px;">
              <div class="section-title">Para transferencia o Cheque: Grupo UCMV SA de CV:</div>
              <div>${cotizacion.paymentInfo?.replace(/\n/g, '<br>') || ''}</div>
            </div>
            
            <div style="flex: 1; min-width: 300px;">
              <table class="totals-table">
                <tr>
                  <td class="label text-right">Tiempo de entrega:</td>
                  <td>${cotizacion.deliveryTime || ''}</td>
                </tr>
                <tr>
                  <td class="label text-right">Términos:</td>
                  <td>${cotizacion.paymentTerms?.replace(/\n/g, '<br>') || ''}</td>
                </tr>
              </table>
            </div>
          </div>
          
          ${cotizacion.generalNotes ? `
          <div class="section">
            <div class="section-title">Observaciones generales:</div>
            <div class="observations">${cotizacion.generalNotes.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
          
          ${cotizacion.terms ? `
          <div class="section">
            <div class="section-title">Términos y Condiciones</div>
            <div class="observations">${cotizacion.terms.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
          
          ${cotizacion.notes ? `
          <div class="section">
            <div class="section-title">Notas Adicionales</div>
            <div>${cotizacion.notes.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
          
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
      <Button onClick={handlePrint} className="mb-4 shadow-sm">
        Imprimir Cotización
      </Button>
      
      {/* Contenido oculto que se utilizará para la impresión */}
      <div className="hidden">
        <div ref={contentRef}></div>
      </div>
    </div>
  );
}