
import React from 'react';
import Button from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/Icons';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const handlePrevious = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    return (
        <div className="flex items-center justify-between mt-4">
            <Button size="sm" variant="secondary" onClick={handlePrevious} disabled={currentPage === 1}>
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
            </span>
            <Button size="sm" variant="secondary" onClick={handleNext} disabled={currentPage === totalPages}>
                Next
                <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Button>
        </div>
    );
};

export default Pagination;
