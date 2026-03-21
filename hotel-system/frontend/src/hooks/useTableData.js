import { useState, useMemo } from 'react';

const useTableData = (data, searchKeys = [], itemsPerPage = 10) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        return data.filter(item => {
            return searchKeys.some(key => {
                const val = item[key];
                if (val == null) return false;
                return String(val).toLowerCase().includes(lowerCaseSearch);
            });
        });
    }, [data, searchTerm, searchKeys]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    // Ensure currentPage is valid after filtering reduces total pages
    const validCurrentPage = useMemo(() => {
        if (totalPages === 0) return 1;
        if (currentPage > totalPages) return totalPages;
        return currentPage;
    }, [currentPage, totalPages]);

    const currentData = useMemo(() => {
        const startIndex = (validCurrentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, validCurrentPage, itemsPerPage]);

    // Go to first page automatically when searching
    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    return {
        currentData,
        searchTerm,
        setSearchTerm: handleSearchChange,
        currentPage: validCurrentPage,
        setCurrentPage,
        totalPages,
        totalItems: filteredData.length
    };
};

export default useTableData;
