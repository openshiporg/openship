import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function PaginationNavigation({ currentPage, total, pageSize }) {
  const [currentPageInput, setCurrentPageInput] = useState(currentPage);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = {};

  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  const minPage = 1;
  const limit = Math.ceil(total / pageSize);

  const getQueryString = (newParams) => {
    const allParams = new URLSearchParams(query);
    Object.keys(newParams).forEach((key) => {
      allParams.set(key, newParams[key]);
    });
    return allParams.toString();
  };

  const handlePageChange = (newPage) => {
    const page = Math.max(minPage, Math.min(limit, Number(newPage)));
    const newQuery = getQueryString({ page });
    router.push(`${pathname}?${newQuery}`);
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
  return (
    <div className="h-[1.45rem] bg-white dark:bg-zinc-800 dark:border-zinc-600 shadow-sm flex items-center border rounded-md overflow-hidden">
      <button
        type="button"
        // className="h-full border-r p-1 inline-flex justify-center items-center gap-x-2 text-sm font-medium bg-white text-zinc-800 dark:bg-zinc-800 hover:bg-zinc-100 disabled:opacity-50 disabled:pointer-events-none dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
        className="border-0 h-full flex border-r items-center gap-1.5 pr-1.5 pl-1.5 uppercase text-xs p-[.15rem] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-600 dark:focus:ring-blue-500 dark:focus:text-white"
        onClick={() => handlePageChange(parseInt(currentPageInput) - 1)}
        disabled={parseInt(currentPageInput) <= minPage}
      >
        <ArrowLeft className="w-3 h-3" />
      </button>
      <div className="flex items-center border-r-0 px-1 text-xs h-full">
        <input
          className={`mx-1 bg-transparent border-0 text-zinc-800 focus:ring-0 dark:text-zinc-100 text-center appearance-none`}
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
        <span className="mr-1.5 text-zinc-500 dark:text-zinc-400">
          / {limit}
        </span>
      </div>
      <button
        type="button"
        className="border-0 h-full flex border-l items-center gap-1.5 pr-1.5 pl-1.5 uppercase text-xs p-[.15rem] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-zinc-600 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-600 dark:focus:ring-blue-500 dark:focus:text-white"
        onClick={() => handlePageChange(parseInt(currentPageInput) + 1)}
        disabled={parseInt(currentPageInput) >= limit}
      >
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
