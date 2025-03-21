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

type Material = {
  id_material: number;
  tipo: string | null;
  nombre: string | null;
  costo: number | null;
  categoria: string | null;
  comentario: string | null;
};

type MaterialesTableProps = {
  materiales: any[];
};

export default function MaterialesTable({ materiales }: MaterialesTableProps) {
  const [filteredMateriales, setFilteredMateriales] = useState<Material[]>(materiales);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Material>('id_material');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  // Log the materiales being received for debugging
  useEffect(() => {
    console.log("MaterialesTable received data:", materiales.length, "records");
    if (materiales.length > 0) {
      console.log("First material in component:", JSON.stringify(materiales[0]));
    }
  }, [materiales]);

  useEffect(() => {
    // Filter materials based on search query
    let filtered = [...materiales];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(material => 
        material.nombre?.toLowerCase().includes(query) ||
        material.tipo?.toLowerCase().includes(query) ||
        material.id_material.toString().includes(query)
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
    
    setFilteredMateriales(filtered);
  }, [materiales, searchQuery, sortField, sortDirection]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredMateriales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredMateriales.length);
  const currentItems = filteredMateriales.slice(startIndex, endIndex);

  // Handle sorting
  const handleSort = (field: keyof Material) => {
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
            placeholder="Buscar por nombre, tipo o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Ordenar por:</span>
          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as keyof Material)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Campo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id_material">ID</SelectItem>
              <SelectItem value="nombre">Nombre</SelectItem>
              <SelectItem value="tipo">Tipo</SelectItem>
              <SelectItem value="categoria">Categoría</SelectItem>
              <SelectItem value="costo">Costo</SelectItem>
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
              <TableHead className="cursor-pointer" onClick={() => handleSort('id_material')}>
                ID {sortField === 'id_material' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('nombre')}>
                Nombre {sortField === 'nombre' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('tipo')}>
                Tipo {sortField === 'tipo' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('categoria')}>
                Categoría {sortField === 'categoria' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleSort('costo')}>
                Costo {sortField === 'costo' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron materiales
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((material) => (
                <TableRow key={material.id_material} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{material.id_material}</TableCell>
                  <TableCell>{material.nombre || '-'}</TableCell>
                  <TableCell>{material.tipo || '-'}</TableCell>
                  <TableCell>{material.categoria || '-'}</TableCell>
                  <TableCell className="text-right">
                    {material.costo 
                      ? `$${Number(material.costo).toLocaleString('es-MX')}`
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
                        <Link href={`/productos/materiales/${material.id_material}`}>
                          Ver
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        size="sm" 
                        variant="outline"
                      >
                        <Link href={`/productos/materiales/${material.id_material}/editar`}>
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
            Mostrando {startIndex + 1} a {endIndex} de {filteredMateriales.length} materiales
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