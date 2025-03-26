'use client';

import React from 'react';
import Head from 'next/head';

export default function NoAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <title>Cucina Capitale</title>
        <meta name="description" content="Sistema de gestión para carpintería residencial" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white text-gray-900 font-sans antialiased">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
} 