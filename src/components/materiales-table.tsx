useEffect(() => {
    // Filter materials based on search query and dropdown filters
    let filtered = [...materiales];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(material => 
        material.nombre?.toLowerCase().includes(query) ||
        material.id_material.toString().includes(query) ||
        material.tipo?.toLowerCase().includes(query) ||
        material.categoria?.toLowerCase().includes(query)
      );
    }
    
    if (tipoFilter && tipoFilter !== '_') {
      filtered = filtered.filter(material => material.tipo === tipoFilter);
    }
    
    if (categoriaFilter && categoriaFilter !== '_') {
      filtered = filtered.filter(material => material.categoria === categoriaFilter);
    }
  }, [materiales, searchQuery, tipoFilter, categoriaFilter]); 