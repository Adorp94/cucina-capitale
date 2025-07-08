'use client';

import React from 'react';
import { Suspense } from 'react';
import DataManagementPage from '@/components/data-management/data-management-page';

export default function DatosPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="max-w-2xl">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Gestión de Datos
            </h1>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              Administre materiales, productos y relaciones
            </p>
          </div>
        </div>
        
        <div className="px-6 py-3">
          <Suspense fallback={
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <span>Cargando...</span>
              </div>
            </div>
          }>
            <DataManagementPage />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 