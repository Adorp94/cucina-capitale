'use client';

import { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Pagination, PaginationContent, PaginationEllipsis, 
  PaginationItem, PaginationLink, PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import Link from 'next/link';

type Producto = {
  mueble_id: number;
  nombre_mueble: string | null;
  cajones: number | null;
  puertas: number | null;
  entrepaños: number | null;
  mat_huacal: number | null;
  mat_vista: number | null;
  chap_huacal: number | null;
  chap_vista: number | null;
  jaladera: number | null;
  corredera: number | null;
  bisagras: number | null;
  patas: number | null;
  clip_patas: number | null;
  mensulas: number | null;
  kit_tornillo: number | null;
  cif: number | null;
  created_at: string | null;
  updated_at: string | null;
  precio: number | null;
  descripcion: string | null;
  dimensiones: string | null;
  color: string | null;
  estilo: string | null;
  imagen_url: string | null;
  estado: string | null;
};

type ProductosTableProps = {
  productos: any[];
};

export default function ProductosTable({ productos }: ProductosTableProps) {
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>(productos);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Producto>('mueble_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  // Log the productos being received for debugging
  useEffect(() => {
    console.log("ProductosTable received data:", productos.length, "records");
    if (productos.length > 0) {
      console.log("First producto in component:", JSON.stringify(productos[0]));
    }
  }, [productos]);

  useEffect(() => {
    // Filter products based on search query
    let filtered = [...productos];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(producto => 
        producto.nombre_mueble?.toLowerCase().includes(query) ||
        producto.mueble_id.toString().includes(query)
      );
    }
    
    // Sort the filtered results
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === null) return sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });
    
    setFilteredProductos(filtered);
  }, [productos, searchQuery, sortField, sortDirection]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredProductos.length);
  const currentItems = filteredProductos.slice(startIndex, endIndex);

  // Handle sorting
  const handleSort = (field: keyof Producto) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPages = 5; // Max number of page links to show
    
    if (totalPages <= maxPages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show a range around current page
      let startPage = Math.max(currentPage - 2, 1);
      let endPage = Math.min(startPage + maxPages - 1, totalPages);
      
      if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(endPage - maxPages + 1, 1);
      }
      
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push('ellipsis-start');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push('ellipsis-end');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-1/3">
          <Input
            placeholder="Buscar por nombre o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Ordenar por:</span>
          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as keyof Producto)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Campo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mueble_id">ID</SelectItem>
              <SelectItem value="nombre_mueble">Nombre</SelectItem>
              <SelectItem value="cajones">Cajones</SelectItem>
              <SelectItem value="puertas">Puertas</SelectItem>
              <SelectItem value="entrepaños">Entrepaños</SelectItem>
              <SelectItem value="cif">CIF</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="cursor-pointer" onClick={() => handleSort('mueble_id')}>
                ID {sortField === 'mueble_id' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('nombre_mueble')}>
                Nombre {sortField === 'nombre_mueble' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => handleSort('cajones')}>
                Cajones {sortField === 'cajones' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => handleSort('puertas')}>
                Puertas {sortField === 'puertas' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer text-center" onClick={() => handleSort('entrepaños')}>
                Entrepaños {sortField === 'entrepaños' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('cif')}>
                CIF {sortField === 'cif' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((producto) => (
                <TableRow key={producto.mueble_id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{producto.mueble_id}</TableCell>
                  <TableCell>{producto.nombre_mueble || '-'}</TableCell>
                  <TableCell className="text-center">{producto.cajones || '0'}</TableCell>
                  <TableCell className="text-center">{producto.puertas || '0'}</TableCell>
                  <TableCell className="text-center">{producto.entrepaños || '0'}</TableCell>
                  <TableCell className="text-right">
                    {producto.cif 
                      ? `$${Number(producto.cif).toLocaleString('es-MX')}`
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        asChild 
                        size="sm" 
                        variant="ghost"
                      >
                        <Link href={`/productos/${producto.mueble_id}`}>
                          Ver
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        size="sm" 
                        variant="outline"
                      >
                        <Link href={`/productos/${producto.mueble_id}/editar`}>
                          Editar
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {endIndex} de {filteredProductos.length} productos
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {getPageNumbers().map((page, index) => (
                typeof page === 'number' ? (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href="#"
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={index}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
} 