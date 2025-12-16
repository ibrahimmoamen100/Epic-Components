import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

export const DataLoader = () => {
  const { loadProducts, products, loading, loadVendors, vendors } = useStore();
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Load products on app initialization only once
    if (products.length === 0 && !loading && !hasLoaded.current) {
      hasLoaded.current = true;
      loadProducts();
    }

    // Load vendors if not already loaded
    if (vendors.length === 0) {
      loadVendors();
    }
  }, [loadProducts, products.length, loading, loadVendors, vendors.length]);

  return null; // This component doesn't render anything
}; 