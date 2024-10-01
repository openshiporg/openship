import React, { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function ItemPagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  isCartItem,
}) {
  const [currentPageInput, setCurrentPageInput] = useState(currentPage.toString());
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalItems <= 5) {
    return null;
  }

  const handlePageChange = (newPage) => {
    const page = Math.max(1, Math.min(totalPages, Number(newPage)));
    onPageChange(page);
    setCurrentPageInput(page.toString());
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue === "" || /^\d+$/.test(newValue)) {
      setCurrentPageInput(newValue);
    }
  };

  const handleInputBlur = () => {
    if (currentPageInput === "") {
      setCurrentPageInput(currentPage.toString());
    } else {
      handlePageChange(currentPageInput);
    }
  };

  const colorClasses = isCartItem
    ? "bg-white border-emerald-200 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700 focus:ring-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-700 dark:focus:ring-emerald-500"
    : "bg-white border-blue-200 text-blue-500 hover:bg-blue-100 hover:text-blue-700 focus:ring-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-700 dark:focus:ring-blue-500";

  return (
    <div className={`h-7 shadow-sm flex items-center border rounded-sm overflow-hidden`}>
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`border-0 h-full flex border-r items-center gap-1.5 pr-1.5 pl-1.5 uppercase text-xs p-[.15rem] font-medium focus:z-10 focus:ring-2 disabled:opacity-50 disabled:pointer-events-none ${colorClasses}`}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="bg-background text-nowrap flex items-center border-r-0 px-1 text-sm h-full">
        <input
          className={`mx-1 bg-transparent border-0 focus:ring-0 text-center appearance-none ${
            isCartItem ? "text-emerald-600 dark:text-emerald-100" : "text-blue-600 dark:text-blue-100"
          }`}
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
        <span className={`mr-1.5 ${
          isCartItem ? "text-emerald-500 dark:text-emerald-400" : "text-blue-500 dark:text-blue-400"
        }`}>
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
}

export function ItemPaginationStats({ currentPage, totalItems, itemsPerPage }) {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="text-xs/3 text-muted-foreground pl-0.5 mb-3">
      Showing {start} - {end} of {totalItems} items
    </div>
  );
}
