"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ItemPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export const ItemPagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: ItemPaginationProps) => {
  const [currentPageInput, setCurrentPageInput] = useState(currentPage.toString());
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalItems <= 5) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    const page = Math.max(1, Math.min(totalPages, Number(newPage)));
    onPageChange(page);
    setCurrentPageInput(page.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === "" || /^\d+$/.test(newValue)) {
      setCurrentPageInput(newValue);
    }
  };

  const handleInputBlur = () => {
    if (currentPageInput === "") {
      setCurrentPageInput(currentPage.toString());
    } else {
      handlePageChange(Number(currentPageInput));
    }
  };

  const colorClasses = "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 focus:ring-zinc-700 dark:bg-zinc-950 dark:border-zinc-900 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-700 dark:focus:ring-zinc-500";

  return (
    <div className="h-7 shadow-sm flex items-center border rounded-sm overflow-hidden">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`border-0 h-full flex border-r items-center gap-1.5 pr-1.5 pl-1.5 uppercase text-xs p-[.15rem] font-medium focus:z-10 focus:ring-2 disabled:opacity-50 disabled:pointer-events-none ${colorClasses}`}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="bg-background text-nowrap flex items-center border-r-0 px-1 text-sm h-full">
        <input
          className="mx-1 bg-transparent border-0 focus:ring-0 text-center appearance-none text-zinc-600 dark:text-zinc-100"
          style={{
            width: `${Math.max(
              0.5,
              Math.max(currentPageInput.toString().length) * 0.75
            )}em`,
          }}
          type="text"
          value={currentPageInput}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleInputBlur();
            }
          }}
        />
        <span className="mr-1.5 text-zinc-500 dark:text-zinc-400">
          / {totalPages}
        </span>
      </div>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`border-0 h-full flex border-l items-center gap-1.5 pr-1.5 pl-1.5 uppercase text-xs p-[.15rem] font-medium focus:z-10 focus:ring-2 disabled:opacity-50 disabled:pointer-events-none ${colorClasses}`}
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ItemPaginationStats = ({ currentPage, totalItems, itemsPerPage }: ItemPaginationProps) => {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="text-xs/3 text-muted-foreground pl-0.5 mb-3">
      Showing {start} - {end} of {totalItems} items
    </div>
  );
};
