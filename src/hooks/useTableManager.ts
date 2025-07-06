// src/hooks/useTableManager.ts
import { useState, useMemo, useEffect } from 'react';

interface UseTableManagerProps<T> {
  initialData: T[];
  itemsPerPage?: number;
  searchCallback: (item: T, searchTerm: string) => boolean;
}

export function useTableManager<T>({
  initialData,
  itemsPerPage = 10,
  searchCallback,
}: UseTableManagerProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset ke halaman pertama setiap kali user mengetik pencarian baru
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Lakukan filter data berdasarkan input pencarian
  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return initialData;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return initialData.filter(item => searchCallback(item, lowercasedTerm));
  }, [initialData, searchTerm, searchCallback]);

  // Hitung total halaman
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Ambil data untuk halaman saat ini
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [currentPage, filteredData, itemsPerPage]);

  return {
    // State & Setters
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    // Data turunan
    currentItems,
    totalPages,
    // Info tambahan
    itemCount: filteredData.length,
    itemsPerPage,
  };
}