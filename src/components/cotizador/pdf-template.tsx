import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Decimal } from 'decimal.js';
import { PDFContent } from '@/types/pdf';

// Create styles with modern minimalist design
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 45,
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
    fontSize: 18,
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
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
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
    marginTop: 5,
    paddingTop: 5,
    borderTop: '1px solid #f0f0f0',
    justifyContent: 'flex-end',
  },
  summarySection: {
    flexDirection: 'row',
    marginTop: 3,
    justifyContent: 'flex-end',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#6b7280',
    width: 70,
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1a1a',
    width: 80,
    textAlign: 'right',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    width: 70,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    width: 80,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
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
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    borderLeft: '3px solid #4f46e5',
    alignSelf: 'flex-end',
    width: '40%',
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
    marginTop: 12,
    marginBottom: 12,
    padding: 8,
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
    marginTop: 12,
    marginBottom: 40,
  },
  termsList: {
    fontSize: 7,
    color: '#4b5563',
    lineHeight: 1.3,
  },
  paymentInfo: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  paymentInfoTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#4b5563',
  },
  paymentInfoText: {
    fontSize: 8,
    color: '#4b5563',
    lineHeight: 1.2,
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
  materialSection: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  materialTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#4b5563',
  },
  materialsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  materialColumn: {
    width: '50%',
  },
  materialRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  materialLabel: {
    fontSize: 8,
    color: '#6b7280',
    width: 70,
  },
  materialValue: {
    fontSize: 8,
    color: '#1f2937',
    flex: 1,
  },
  tag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
    display: 'inline-block',
  },
  tagText: {
    fontSize: 8,
    color: '#4b5563',
  },
  compactTwoColumnContainer: {
    flexDirection: 'row',
    marginBottom: 10,
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

// Format material name
const formatMaterialName = (materialName: string) => {
  if (!materialName) return '';
  
  // Remove technical codes often found in material names
  const cleanName = materialName.replace(/^\d+(-|_|\s)?/, '');
  
  // Capitalize first letter of each word
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// PDF Document component with full quotation data
const CotizacionPDF = ({ 
  quotation, 
  client,
  companyInfo
}: PDFContent) => {
  console.log('PDF Template - Received quotation:', {
    id: quotation.id_cotizacion,
    items_count: (quotation.items || []).length,
    has_materials: !!quotation.materials,
    materials_type: quotation.materials ? typeof quotation.materials : 'undefined'
  });
  
  if (quotation.items && quotation.items.length > 0) {
    console.log('PDF Template - Sample item:', {
      description: quotation.items[0].description,
      quantity: quotation.items[0].quantity,
      unitPrice: typeof quotation.items[0].unitPrice === 'object' ? 'Decimal object' : typeof quotation.items[0].unitPrice
    });
  }
  
  // Debug materials
  console.log('PDF Template - Materials raw:', quotation.materials);
  
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
    items: Array.isArray(quotation.items) ? quotation.items : [],
    materials: quotation.materials || {}
  };
  
  // Ensure materials is an object
  if (typeof safeQuotation.materials === 'string') {
    try {
      safeQuotation.materials = JSON.parse(safeQuotation.materials);
      console.log('PDF Template - Parsed materials from string:', safeQuotation.materials);
    } catch (e) {
      console.error('Error parsing materials string in PDF component:', e);
      safeQuotation.materials = {};
    }
  }
  
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
  const logoUrl = "https://raw.githubusercontent.com/Adorp94/clientes/refs/heads/main/logo-completo.png";

  // Get status style
  const getStatusStyle = (status: string) => {
    if (styles[status as keyof typeof styles]) {
      return styles[status as keyof typeof styles];
    }
    return {};
  };

  // Check if materials exist and extract them
  const hasMaterials = safeQuotation.materials && 
                      typeof safeQuotation.materials === 'object' && 
                      Object.keys(safeQuotation.materials).length > 0;
  
  console.log('PDF Template - Has materials:', hasMaterials);
  console.log('PDF Template - Materials keys:', 
    hasMaterials ? Object.keys(safeQuotation.materials) : 'none');
  
  // Material name mapping for display in PDF (Spanish translations)
  const materialLabels: Record<string, string> = {
    matHuacal: 'Material Huacal',
    mat_huacal: 'Material Huacal',
    chapHuacal: 'Chapa Huacal',
    chap_huacal: 'Chapa Huacal',
    matVista: 'Material Vista',
    mat_vista: 'Material Vista',
    chapVista: 'Chapa Vista',
    chap_vista: 'Chapa Vista',
    jaladera: 'Jaladera',
    corredera: 'Corredera',
    bisagra: 'Bisagra'
  };
  
  // Function to create material pairs with two-column layout
  const getMaterialPairs = () => {
    if (!hasMaterials) return [];
    
    const pairs = [];
    const materials = safeQuotation.materials as Record<string, string>;
    
    // Create an array to sort the materials in a logical order
    const materialOrder = [
      'matHuacal', 'mat_huacal', 
      'chapHuacal', 'chap_huacal', 
      'matVista', 'mat_vista', 
      'chapVista', 'chap_vista', 
      'jaladera', 'corredera', 'bisagra'
    ];
    
    // Get all keys and sort them according to the preferred order
    const materialKeys = Object.keys(materials).sort((a, b) => {
      const indexA = materialOrder.indexOf(a);
      const indexB = materialOrder.indexOf(b);
      
      // If both exist in the order array, sort by that order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one exists, prefer the one in the order array
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Otherwise, sort alphabetically
      return a.localeCompare(b);
    });
    
    for (const key of materialKeys) {
      const materialValue = String(materials[key] || '').trim();
      if (materialValue) {
        // Get corresponding label, with failsafe to original key
        const label = materialLabels[key] || key;
        
        pairs.push({
          label,
          value: formatMaterialName(materialValue)
        });
      }
    }
    
    return pairs;
  };
  
  const materialPairs = getMaterialPairs();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo, Title and Date */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={logoUrl} style={styles.logo} />
          </View>
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
        <View style={styles.compactTwoColumnContainer}>
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

        {/* Materials Section with two columns */}
        {materialPairs.length > 0 && (
          <View style={styles.materialSection}>
            <Text style={styles.materialTitle}>Materiales seleccionados</Text>
            <View style={styles.materialsContainer}>
              {materialPairs.map((pair, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.materialColumn, 
                    // Add marginRight only to the first column items
                    index % 2 === 0 ? { paddingRight: 5 } : { paddingLeft: 5 }
                  ]}
                >
                  <View style={styles.materialRow}>
                    <Text style={styles.materialLabel}>{pair.label}:</Text>
                    <Text style={styles.materialValue}>{pair.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Items Table */}
        {safeQuotation.items.length > 0 ? (
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
            
            {/* Table Rows - limit to 6 rows max to fit on page */}
            {safeQuotation.items.slice(0, 6).map((item, index) => {
              // Convert to Decimal if not already
              const unitPrice = item.unitPrice instanceof Decimal ? 
                item.unitPrice : new Decimal(String(item.unitPrice || 0));
              
              const subtotal = item.subtotal instanceof Decimal ? 
                item.subtotal : new Decimal(String(item.subtotal || 0));
              
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colNumber]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, styles.colDescription]}>{item.description || `Item ${index + 1}`}</Text>
                  <Text style={[styles.tableCell, styles.colQuantity]}>{item.quantity || 0}</Text>
                  <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(unitPrice)}</Text>
                  <Text style={[styles.tableCell, styles.colDiscount]}>{item.discount || 0}%</Text>
                  <Text style={[styles.tableCell, styles.colSubtotal]}>{formatCurrency(subtotal)}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productos y servicios</Text>
            <Text style={styles.infoValue}>No hay productos o servicios en esta cotización.</Text>
          </View>
        )}

        {/* Summary Section - aligned to the right */}
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

        <View style={styles.compactTwoColumnContainer}>
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
                Para transferencia o Cheque: Grupo UCMV SA de CV{'\n'}
                Banco: BBVA | Cuenta: 0123022455{'\n'}
                CLABE: 0121 8000 1230 2245 50
              </Text>
            </View>
          </View>
        </View>

        {/* Terms and Conditions - Updated */}
        <View style={styles.termsSection}>
          <Text style={styles.sectionTitle}>Términos y condiciones</Text>
          <Text style={styles.termsList}>
            Observaciones generales:{'\n'}
            *En cubiertas y equipos: se liquida el 100%{'\n'}
            *No se realizan trabajos eléctricos, de fontanería o albañilería.{'\n'}
            *En sótanos o plantas altas, se realiza un cargo extra por servicio.{'\n'} 
            *Los precios USD o Euros estarán sujetos al tipo de cambio publicados en el DOF el día de la transacción.{'\n'}
            *No nos hacemos responsables de equipos y/o cubiertas no adquiridas en GRUPO UCMV
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