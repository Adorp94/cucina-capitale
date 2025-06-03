'use client';

import React from 'react';
import { Suspense } from 'react';
import DataManagementPage from '@/components/data-management/data-management-page';

export default function DatosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Datos
        </h1>
        <p className="text-gray-600 mt-2">
          Administre materiales, productos y sus relaciones
        </p>
      </div>
      
      <Suspense fallback={<div>Cargando...</div>}>
        <DataManagementPage />
      </Suspense>
    </div>
  );
} 