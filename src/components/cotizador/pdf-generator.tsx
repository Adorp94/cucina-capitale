'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Quotation } from '@/types/cotizacion';
import { formatCurrency } from '@/lib/cotizador/calculator';
import { DEFAULT_COTIZADOR_CONFIG } from '@/lib/cotizador/constants';
import { Download, Printer } from 'lucide-react';

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

    // Añade estilos Apple-inspired para la cotización
    printWindow.document.write(`
      <html>
        <head>
          <title>Cotización ${cotizacion.number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            body {
              font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.5;
              color: #1d1d1f;
              padding: 40px;
              max-width: 1000px;
              margin: 0 auto;
              font-weight: 300;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 1px solid #f5f5f7;
            }
            
            .company-info {
              text-align: right;
            }
            
            .company-name {
              font-size: 1.8rem;
              font-weight: 600;
              letter-spacing: -0.02em;
            }
            
            .quotation-label {
              color: #86868b;
              font-size: 0.875rem;
              letter-spacing: 0.02em;
              text-transform: uppercase;
              margin-top: 4px;
            }
            
            .quote-title {
              font-size: 2rem;
              font-weight: 500;
              letter-spacing: -0.02em;
              margin-bottom: 5px;
            }
            
            .quote-number {
              color: #86868b;
              margin-bottom: 8px;
              font-size: 0.9rem;
            }
            
            .section {
              margin-bottom: 32px;
            }
            
            .section-title {
              font-size: 1.1rem;
              font-weight: 500;
              margin-bottom: 16px;
              letter-spacing: -0.01em;
            }
            
            .card {
              background-color: #fbfbfd;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 24px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            
            .grid {
              display: flex;
              flex-wrap: wrap;
              gap: 24px;
            }
            
            .grid-col-2 {
              flex: 1 1 calc(50% - 12px);
              min-width: 280px;
            }
            
            .client-info-card {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            
            .info-label {
              font-size: 0.75rem;
              color: #86868b;
              text-transform: uppercase;
              letter-spacing: 0.02em;
              margin-bottom: 2px;
            }
            
            .info-value {
              font-weight: 400;
            }
            
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 32px;
            }
            
            .table th {
              background-color: #f5f5f7;
              text-align: left;
              padding: 12px 16px;
              font-weight: 500;
              font-size: 0.85rem;
              letter-spacing: 0.01em;
              color: #1d1d1f;
              border-bottom: none;
            }
            
            .table td {
              padding: 16px;
              border-bottom: 1px solid #f5f5f7;
              font-size: 0.95rem;
            }
            
            .text-right {
              text-align: right;
            }
            
            .text-center {
              text-align: center;
            }
            
            .materials-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 16px;
              margin-bottom: 24px;
            }
            
            .material-item {
              padding: 16px;
              background-color: #fbfbfd;
              border-radius: 8px;
            }
            
            .totals-table {
              width: 100%;
              margin-left: auto;
              max-width: 320px;
            }
            
            .totals-table td {
              padding: 8px 0;
            }
            
            .total-row {
              font-weight: 600;
              font-size: 1.1rem;
              border-top: 1px solid #e2e2e7;
              padding-top: 12px;
              margin-top: 8px;
            }
            
            .payment-box {
              background-color: #f5f5f7;
              padding: 24px;
              border-radius: 12px;
              margin-bottom: 24px;
            }
            
            .payment-title {
              font-weight: 500;
              margin-bottom: 12px;
            }
            
            .observations {
              font-size: 0.9rem;
              white-space: pre-line;
              line-height: 1.6;
            }
            
            .footer {
              margin-top: 64px;
              text-align: center;
              font-size: 0.85rem;
              color: #86868b;
              padding-top: 16px;
              border-top: 1px solid #f5f5f7;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              button {
                display: none;
              }
              
              .card, .payment-box {
                box-shadow: none;
                border: 1px solid #f5f5f7;
              }
              
              @page {
                margin: 0.5cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="quote-title">${cotizacion.title}</div>
              <div class="quote-number">Nº ${cotizacion.number}</div>
            </div>
            <div class="company-info">
              <div class="company-name">${DEFAULT_COTIZADOR_CONFIG.companyInfo.name}</div>
              <div class="quotation-label">Presupuesto</div>
            </div>
          </div>
          
          <div class="grid">
            <div class="grid-col-2 card">
              <div class="client-info-card">
                <div>
                  <div class="info-label">Cliente</div>
                  <div class="info-value">${cliente?.name || 'Cliente no especificado'}</div>
                </div>
                ${cliente?.email ? `
                <div>
                  <div class="info-label">Email</div>
                  <div class="info-value">${cliente.email}</div>
                </div>
                ` : ''}
                ${cliente?.phone ? `
                <div>
                  <div class="info-label">Teléfono</div>
                  <div class="info-value">${cliente.phone}</div>
                </div>
                ` : ''}
                ${cliente?.address ? `
                <div>
                  <div class="info-label">Dirección</div>
                  <div class="info-value">${cliente.address}</div>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="grid-col-2 card">
              <div class="client-info-card">
                <div>
                  <div class="info-label">Proyecto</div>
                  <div class="info-value">${cotizacion.projectName || 'No especificado'}</div>
                </div>
                <div>
                  <div class="info-label">Fecha de cotización</div>
                  <div class="info-value">${format(new Date(cotizacion.createdAt || new Date()), 'dd MMMM, yyyy', { locale: es })}</div>
                </div>
                <div>
                  <div class="info-label">Vigencia</div>
                  <div class="info-value">${cotizacion.validUntil ? format(new Date(cotizacion.validUntil), 'dd MMMM, yyyy', { locale: es }) : 'No especificado'}</div>
                </div>
                <div>
                  <div class="info-label">Tiempo de entrega</div>
                  <div class="info-value">${cotizacion.deliveryTime || 'No especificado'}</div>
                </div>
              </div>
            </div>
          </div>
          
          ${cotizacion.materialsCombination ? `
          <div class="section">
            <div class="section-title">Especificaciones de materiales</div>
            <div class="materials-grid">
              <div class="material-item">
                <div class="info-label">Material Huacal</div>
                <div class="info-value">${cotizacion.materialsCombination.matHuacal || 'No especificado'}</div>
              </div>
              <div class="material-item">
                <div class="info-label">Chapacinta Huacal</div>
                <div class="info-value">${cotizacion.materialsCombination.chapHuacal || 'No especificado'}</div>
              </div>
              <div class="material-item">
                <div class="info-label">Material Vista</div>
                <div class="info-value">${cotizacion.materialsCombination.matVista || 'No especificado'}</div>
              </div>
              <div class="material-item">
                <div class="info-label">Chapacinta Vista</div>
                <div class="info-value">${cotizacion.materialsCombination.chapVista || 'No especificado'}</div>
              </div>
              <div class="material-item">
                <div class="info-label">Jaladera</div>
                <div class="info-value">${cotizacion.materialsCombination.jaladera || 'No especificado'}</div>
              </div>
              <div class="material-item">
                <div class="info-label">Corredera</div>
                <div class="info-value">${cotizacion.materialsCombination.corredera || 'No especificado'}</div>
              </div>
              <div class="material-item">
                <div class="info-label">Bisagra</div>
                <div class="info-value">${cotizacion.materialsCombination.bisagra || 'No especificado'}</div>
              </div>
              <div class="material-item">
                <div class="info-label">Combinación</div>
                <div class="info-value" style="font-weight: 500;">Combinación #1</div>
              </div>
            </div>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">Productos y servicios</div>
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
                  <th class="text-right">Total</th>
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
                  <td class="text-right">$${formatCurrency(item.unitPrice)}</td>
                  <td class="text-right">$${formatCurrency(item.subtotal || (item.unitPrice * item.quantity))}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="display: flex; justify-content: flex-end;">
              <table class="totals-table">
                <tr>
                  <td class="text-right">Subtotal:</td>
                  <td class="text-right">$${formatCurrency(cotizacion.subtotal)}</td>
                </tr>
                <tr>
                  <td class="text-right">IVA (${DEFAULT_COTIZADOR_CONFIG.taxRate}%):</td>
                  <td class="text-right">$${formatCurrency(cotizacion.taxes)}</td>
                </tr>
                <tr class="total-row">
                  <td class="text-right">Total:</td>
                  <td class="text-right">$${formatCurrency(cotizacion.total)}</td>
                </tr>
              </table>
            </div>
            
            <div class="grid" style="margin-top: 32px;">
              <div class="grid-col-2">
                <div class="payment-box">
                  <div class="payment-title">Condiciones de pago</div>
                  <div class="client-info-card">
                    <div>
                      <div class="info-label">Esquema de pago</div>
                      <div class="info-value">${cotizacion.paymentTerms || 'No especificado'}</div>
                    </div>
                    <div>
                      <div class="info-label">Anticipo (70%)</div>
                      <div class="info-value">$${formatCurrency(cotizacion.total * 0.7)}</div>
                    </div>
                    <div>
                      <div class="info-label">Liquidación (30%)</div>
                      <div class="info-value">$${formatCurrency(cotizacion.total * 0.3)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="grid-col-2">
                <div class="payment-box">
                  <div class="payment-title">Información bancaria</div>
                  <div style="white-space: pre-line;">${cotizacion.paymentInfo?.replace(/\n/g, '<br>') || 'No especificado'}</div>
                </div>
              </div>
            </div>
          </div>
          
          ${cotizacion.generalNotes ? `
          <div class="section">
            <div class="section-title">Observaciones generales</div>
            <div class="card">
              <div class="observations">${cotizacion.generalNotes.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          ` : ''}
          
          ${cotizacion.terms ? `
          <div class="section">
            <div class="section-title">Términos y condiciones</div>
            <div class="card">
              <div class="observations">${cotizacion.terms.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          ` : ''}
          
          ${cotizacion.notes ? `
          <div class="section">
            <div class="section-title">Notas adicionales</div>
            <div class="card">
              <div class="observations">${cotizacion.notes.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>${DEFAULT_COTIZADOR_CONFIG.companyInfo.name} | ${DEFAULT_COTIZADOR_CONFIG.companyInfo.address}</p>
            <p>${DEFAULT_COTIZADOR_CONFIG.companyInfo.website} | ${DEFAULT_COTIZADOR_CONFIG.companyInfo.email} | ${DEFAULT_COTIZADOR_CONFIG.companyInfo.phone}</p>
            <p>Cotización generada el ${format(new Date(), 'dd MMMM, yyyy', { locale: es })}</p>
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

  const handleDownload = () => {
    handlePrint(); // Reutilizamos la función de impresión para descargar (el usuario puede guardar como PDF)
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handlePrint} variant="outline" className="h-10 gap-1 shadow-sm">
        <Printer size={16} />
        Imprimir
      </Button>
      <Button onClick={handleDownload} className="h-10 gap-1 shadow-sm bg-black hover:bg-gray-800">
        <Download size={16} />
        Descargar PDF
      </Button>
      
      {/* Contenido oculto que se utilizará para la impresión */}
      <div className="hidden">
        <div ref={contentRef}></div>
      </div>
    </div>
  );
}