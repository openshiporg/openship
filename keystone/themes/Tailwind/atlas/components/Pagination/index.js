import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MoveLeft, MoveRight } from "lucide-react";

const getPaginationStats = ({ list, pageSize, currentPage, total }) => {
  let stats = "";
  if (total > pageSize) {
    const start = pageSize * (currentPage - 1) + 1;
    const end = Math.min(start + pageSize - 1, total);
    stats = `${start} - ${end} of ${total} ${list.plural}`;
  } else {
    if (total > 1 && list.plural) {
      stats = `${total} ${list.plural}`;
    } else if (total === 1 && list.singular) {
      stats = `${total} ${list.singular}`;
    }
  }
  return { stats };
};

export function Pagination({ currentPage, total, pageSize, list }) {
  const [currentPageInput, setCurrentPageInput] = useState(currentPage);
  const [pageSizeInput, setPageSizeInput] = useState(pageSize.toString());

  const { push } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const { stats } = getPaginationStats({ list, currentPage, total, pageSize });

  const nextPage = currentPage + 1;
  const prevPage = currentPage - 1;
  const minPage = 1;
  const limit = Math.ceil(total / pageSize);

  const nxtQuery = { ...query, page: nextPage };
  const prevQuery = { ...query, page: prevPage };

  const getQueryString = (newParams) => {
    const allParams = new URLSearchParams(query);
    Object.keys(newParams).forEach((key) => {
      allParams.set(key, newParams[key]); // Use `set` to ensure unique keys
    });
    return allParams.toString();
  };

  if (total <= pageSize) return null;

  const handlePageChange = (newPage) => {
    const page = Math.max(minPage, Math.min(limit, Number(newPage)));
    const newQuery = getQueryString({ page });
    push(`${pathname}?${newQuery}`);
    setCurrentPageInput(page.toString());
  };

  const handlePageSizeChange = (newSize) => {
    const size = Math.max(1, Number(newSize));
    const newQuery = getQueryString({ pageSize: size });
    push(`${pathname}?${newQuery}`);
    setPageSizeInput(size.toString());
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

  const handlePageSizeInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue === "" || /^\d+$/.test(newValue)) {
      setPageSizeInput(newValue);
    }
  };

  const handlePageSizeInputCommit = (value) => {
    const newSize = Math.max(1, parseInt(value, 10) || 1);
    handlePageSizeChange(newSize);
    setPageSizeInput(newSize.toString());
  };

  const handlePageSizeInputBlur = () => {
    if (pageSizeInput === "") {
      setPageSizeInput(pageSize.toString());
    } else {
      handlePageSizeInputCommit(pageSizeInput);
    }
  };

  return (
    <nav className="flex gap-4 px-4 py-1.5" aria-label="Pagination">
      <div className="flex flex-col gap-0.5">
        <text className="text-xs text-muted-foreground">Showing {stats}</text>
        <div className="flex items-center text-xs">
          <div className="flex items-center">
            <input
              className={`-ml-[0.02rem] mr-1 bg-transparent border-0 text-gray-800 focus:ring-0 dark:text-slate-100 text-center appearance-none`}
              style={{
                width: `${Math.max(1.2, pageSizeInput.length * 0.6)}em`, // Adjust width dynamically based on input length
              }}
              type="text"
              value={pageSizeInput}
              onChange={handlePageSizeInputChange}
              onBlur={handlePageSizeInputBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handlePageSizeInputCommit(e.target.value);
                }
              }}
            />
            <span className="text-gray-500 dark:text-gray-400 lowercase">
              {pageSizeInput === 1 ? list.singular : list.plural} per page
            </span>
          </div>
        </div>
        <div className="flex items-center text-xs uppercase tracking-wide">
          <span className="text-gray-500 dark:text-gray-400">Page</span>
          <div className="flex items-center">
            <input
              className={`mx-1 bg-transparent border-0 text-gray-800 focus:ring-0 dark:text-slate-100 text-center appearance-none`}
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
                  handlePageChange(e.target.value);
                }
              }}
            />
            <span className="text-gray-500 dark:text-gray-400">of {limit}</span>
            <div className="px-3 flex gap-0.5">
              <button
                type="button"
                className="rounded-sm border h-4 px-1 inline-flex justify-center items-center gap-x-2 text-sm font-medium bg-slate-50 text-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                onClick={() => handlePageChange(parseInt(currentPageInput) - 1)}
              >
                <MoveLeft className="w-3 h-3 flex-shrink-0 size-3.5" />
              </button>
              <button
                type="button"
                className="rounded-sm border h-4 px-1 inline-flex justify-center items-center gap-x-2 text-sm font-medium bg-slate-50 text-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                onClick={() => handlePageChange(parseInt(currentPageInput) + 1)}
              >
                <MoveRight className="w-3 h-3 flex-shrink-0 size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
