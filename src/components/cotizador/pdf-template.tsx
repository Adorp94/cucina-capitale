import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Decimal } from 'decimal.js';
import { PDFContent } from '@/types/pdf';

// Create styles with modern minimalist design
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 40,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    fontSize: 10,
  },
  header: {
    marginBottom: 25,
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    width: 130,
    height: 50,
    marginBottom: 0,
  },
  logoPlaceholder: {
    width: 130,
    height: 50,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#9ca3af',
    fontSize: 9,
    textAlign: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  idNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateCreated: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    width: 60,
  },
  infoValue: {
    fontSize: 9,
    color: '#1a1a1a',
    flex: 1,
  },
  boldText: {
    fontWeight: 'bold',
  },
  summarySectionTop: {
    flexDirection: 'row',
    marginTop: 15,
    paddingTop: 10,
    borderTop: '1px solid #f0f0f0',
  },
  summarySection: {
    flexDirection: 'row',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    width: 80,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    width: 80,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    paddingTop: 10,
    borderTop: '1px solid #f0f0f0',
  },
  companyName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  companyInfo: {
    marginBottom: 2,
  },
  highlightBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderLeft: '3px solid #4f46e5',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6,
    marginBottom: 6,
    backgroundColor: '#f9fafb',
    paddingTop: 6,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  tableCell: {
    fontSize: 9,
    color: '#1f2937',
  },
  colNumber: { width: '5%' },
  colDescription: { width: '45%' },
  colQuantity: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colDiscount: { width: '10%', textAlign: 'right' },
  colSubtotal: { width: '15%', textAlign: 'right' },
  notesSection: {
    marginTop: 16,
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#4b5563',
  },
  notesText: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  validUntil: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  validUntilLabel: {
    fontSize: 9,
    color: '#4b5563',
    fontWeight: 'bold',
    marginRight: 6,
  },
  validUntilValue: {
    fontSize: 9,
    color: '#1f2937',
  },
  termsSection: {
    marginTop: 16,
    marginBottom: 60,
  },
  termsList: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  paymentInfo: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  paymentInfoTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#4b5563',
  },
  paymentInfoText: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginTop: 0,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  draft: { backgroundColor: '#e5e7eb', color: '#4b5563' },
  sent: { backgroundColor: '#dbeafe', color: '#1e40af' },
  approved: { backgroundColor: '#d1fae5', color: '#065f46' },
  rejected: { backgroundColor: '#fee2e2', color: '#b91c1c' },
  expired: { backgroundColor: '#fef3c7', color: '#92400e' },
  twoColumnContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  column: {
    flex: 1,
    paddingHorizontal: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});

// Format currency helper
const formatCurrency = (amount: number | Decimal | undefined | null) => {
  if (amount === undefined || amount === null) {
    return '$0.00';
  }
  const value = typeof amount === 'number' ? amount : amount.toNumber();
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
};

// Format date helper
const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }).format(date);
  } catch (error) {
    return '';
  }
};

// Translate status to Spanish
const translateStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'Borrador',
    sent: 'Enviada',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    expired: 'Expirada'
  };
  return statusMap[status] || status;
};

// Logo component that accepts a URL
const LogoComponent = ({ logoUrl }: { logoUrl?: string }) => {
  if (logoUrl) {
    return (
      <View style={styles.logoContainer}>
        <Image src={logoUrl} style={styles.logo} />
      </View>
    );
  }
  
  // Placeholder when no logo URL is provided
  return (
    <View style={styles.logoPlaceholder}>
      <Text style={styles.logoPlaceholderText}>LOGO</Text>
    </View>
  );
};

// PDF Document component with full quotation data
const CotizacionPDF = ({ 
  quotation, 
  client,
  companyInfo
}: PDFContent) => {
  // Safeguards against null values
  const safeQuotation = {
    ...quotation,
    id_cotizacion: quotation.id_cotizacion || 0,
    project_name: quotation.project_name || 'Sin nombre',
    project_type: quotation.project_type || 'Sin tipo',
    total: quotation.total || new Decimal(0),
    subtotal: quotation.subtotal || new Decimal(0),
    taxes: quotation.taxes || new Decimal(0),
    tax_rate: quotation.tax_rate || 0,
    created_at: quotation.created_at || new Date().toISOString(),
    delivery_time: quotation.delivery_time || '',
    status: quotation.status || 'draft',
    valid_until: quotation.valid_until || '',
    notes: quotation.notes || '',
    items: Array.isArray(quotation.items) ? quotation.items : []
  };
  
  const safeClient = {
    ...client,
    nombre: client.nombre || 'Cliente sin nombre',
    correo: client.correo || '',
    celular: client.celular || '',
    direccion: client.direccion || ''
  };
  
  const safeCompanyInfo = {
    ...companyInfo,
    name: companyInfo.name || 'Empresa',
    email: companyInfo.email || '',
    phone: companyInfo.phone || '',
    address: companyInfo.address || '',
    rfc: companyInfo.rfc || ''
  };

  // Optional logo URL - replace with your hosted logo URL when available
  const logoUrl = undefined; // Example: "https://example.com/your-logo.png"

  // Get status style
  const getStatusStyle = (status: string) => {
    if (styles[status as keyof typeof styles]) {
      return styles[status as keyof typeof styles];
    }
    return {};
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo, Title and Date */}
        <View style={styles.header}>
          <LogoComponent logoUrl={logoUrl} />
          <View style={styles.headerContent}>
            <Text style={styles.title}>COTIZACIÓN</Text>
            <Text style={styles.idNumber}>#{safeQuotation.id_cotizacion}</Text>
            <Text style={styles.dateCreated}>
              Creada el {formatDate(safeQuotation.created_at)}
            </Text>
          </View>
        </View>
        
        {/* Status and Valid Until Row */}
        <View style={styles.headerRow}>
          <View style={styles.statusDateContainer}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, getStatusStyle(safeQuotation.status)]}>
              <Text style={styles.statusText}>{translateStatus(safeQuotation.status)}</Text>
            </View>
            
            {/* Valid Until */}
            {safeQuotation.valid_until && (
              <View style={styles.validUntil}>
                <Text style={styles.validUntilLabel}>Válido hasta:</Text>
                <Text style={styles.validUntilValue}>{formatDate(safeQuotation.valid_until)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Two-column layout for client and project information */}
        <View style={styles.twoColumnContainer}>
          {/* Client Information */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Información del cliente</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{safeClient.nombre}</Text>
            </View>
            {safeClient.correo && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{safeClient.correo}</Text>
              </View>
            )}
            {safeClient.celular && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{safeClient.celular}</Text>
              </View>
            )}
            {safeClient.direccion && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dirección:</Text>
                <Text style={styles.infoValue}>{safeClient.direccion}</Text>
              </View>
            )}
          </View>

          {/* Project Information */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Detalles del proyecto</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{safeQuotation.project_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>{safeQuotation.project_type}</Text>
            </View>
            {safeQuotation.delivery_time && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Entrega:</Text>
                <Text style={styles.infoValue}>{safeQuotation.delivery_time}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Table */}
        {safeQuotation.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos y servicios</Text>
            
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colNumber]}>#</Text>
              <Text style={[styles.tableHeaderText, styles.colDescription]}>Descripción</Text>
              <Text style={[styles.tableHeaderText, styles.colQuantity]}>Cant.</Text>
              <Text style={[styles.tableHeaderText, styles.colPrice]}>Precio</Text>
              <Text style={[styles.tableHeaderText, styles.colDiscount]}>Desc.</Text>
              <Text style={[styles.tableHeaderText, styles.colSubtotal]}>Subtotal</Text>
            </View>
            
            {/* Table Rows - limit to 12 rows max to fit on page */}
            {safeQuotation.items.slice(0, 12).map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colNumber]}>{index + 1}</Text>
                <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQuantity]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={[styles.tableCell, styles.colDiscount]}>{item.discount}%</Text>
                <Text style={[styles.tableCell, styles.colSubtotal]}>{formatCurrency(item.subtotal)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary Section */}
        <View style={styles.highlightBox}>
          <View style={styles.summarySectionTop}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(safeQuotation.subtotal)}</Text>
          </View>
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>IVA ({safeQuotation.tax_rate}%):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(safeQuotation.taxes)}</Text>
          </View>
          <View style={styles.summarySection}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(safeQuotation.total)}</Text>
          </View>
        </View>

        <View style={styles.twoColumnContainer}>
          {/* Left column for Notes */}
          <View style={styles.column}>
            {safeQuotation.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Notas</Text>
                <Text style={styles.notesText}>{safeQuotation.notes}</Text>
              </View>
            )}
          </View>

          {/* Right column for Payment Info */}
          <View style={styles.column}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentInfoTitle}>Información de pago</Text>
              <Text style={styles.paymentInfoText}>
                Banco: BBVA{'\n'}
                Cuenta: 0123456789{'\n'}
                CLABE: 012 345 6789 0123 45{'\n'}
                A nombre de: {safeCompanyInfo.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Terms and Conditions - Condensed */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>Términos y condiciones</Text>
          <Text style={styles.termsList}>
            1. Los precios están sujetos a cambios sin previo aviso. 2. Esta cotización tiene una validez de 15 días a partir de la fecha de emisión. 3. Los tiempos de entrega se confirmarán al momento de la orden. 4. Se requiere un anticipo del 70% para iniciar el proyecto. 5. El precio no incluye instalación, a menos que se indique expresamente.
          </Text>
        </View>

        {/* Company Information in Footer */}
        <View style={styles.footer}>
          <Text style={styles.companyName}>{safeCompanyInfo.name}</Text>
          <Text style={styles.companyInfo}>{safeCompanyInfo.address}</Text>
          <Text style={styles.companyInfo}>
            {safeCompanyInfo.email} | {safeCompanyInfo.phone}
          </Text>
          {safeCompanyInfo.rfc && (
            <Text style={styles.companyInfo}>RFC: {safeCompanyInfo.rfc}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default CotizacionPDF; 