import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Decimal } from 'decimal.js';
import { PDFContent } from '@/types/pdf';

// Create styles with modern minimalist design
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 50,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  header: {
    marginBottom: 40,
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    width: 160,
    height: 60,
    marginBottom: 10,
  },
  logoPlaceholder: {
    width: 160,
    height: 60,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    color: '#9ca3af',
    fontSize: 10,
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  idNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 10,
    color: '#6b7280',
    width: 90,
  },
  infoValue: {
    fontSize: 12,
    color: '#1a1a1a',
    flex: 1,
  },
  boldText: {
    fontWeight: 'bold',
  },
  summarySectionTop: {
    flexDirection: 'row',
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #f0f0f0',
  },
  summarySection: {
    flexDirection: 'row',
    marginTop: 15,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    width: 100,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    width: 100,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    paddingTop: 20,
    borderTop: '1px solid #f0f0f0',
  },
  companyName: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  companyInfo: {
    marginBottom: 4,
  },
  createdDate: {
    position: 'absolute',
    top: 50,
    right: 50,
    fontSize: 10,
    color: '#9ca3af',
  },
  highlightBox: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 6,
    marginBottom: 30,
    borderLeft: '4px solid #4f46e5',
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

// Simplified PDF Document component with modern design
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
    delivery_time: quotation.delivery_time || ''
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo, Title and Date */}
        <View style={styles.header}>
          <LogoComponent logoUrl={logoUrl} />
          <View style={styles.headerContent}>
            <Text style={styles.title}>COTIZACIÓN</Text>
            <Text style={styles.idNumber}>#{safeQuotation.id_cotizacion}</Text>
          </View>
        </View>
        
        <Text style={styles.createdDate}>
          Creada el {formatDate(safeQuotation.created_at)}
        </Text>

        {/* Client Information */}
        <View style={styles.section}>
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
        <View style={styles.section}>
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