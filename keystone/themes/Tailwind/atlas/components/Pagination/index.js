import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MoveLeft, MoveRight } from "lucide-react";
import { PaginationDropdown } from "./PaginationDropdown";
import { PaginationNavigation } from "./PaginationNavigation";
import { PaginationStats } from "./PaginationStats";

const getPaginationStats = ({ list, pageSize, currentPage, total }) => {
  let stats = "";
  if (total > pageSize) {
    const start = pageSize * (currentPage - 1) + 1;
    const end = Math.min(start + pageSize - 1, total);
    stats = `${start} ${start !== end ? `- ${end}` : ""} of ${total}`;
  } else {
    if (total > 1 && list.plural) {
      stats = `${total} ${list.plural}`;
    } else if (total === 1 && list.singular) {
      stats = `${total} ${list.singular}`;
    }
  }
  return { stats };
};

function Pagination({ currentPage, total, pageSize, list }) {
  const searchParams = useSearchParams();
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  if (total <= pageSize) return null;

  return (
    <nav className="flex gap-4 px-3.5 py-1.5" aria-label="Pagination">
      <div className="flex flex-col gap-0.5">
        <PaginationDropdown />

        <PaginationDropdown list={list} />

        <PaginationNavigation
          currentPage={currentPage}
          total={total}
          pageSize={pageSize}
        />
      </div>
    </nav>
  );
}

export {
  Pagination,
  PaginationNavigation,
  PaginationStats,
  PaginationDropdown,
};

// function PaginationDropdown({ currentPage, total, pageSize, list }) {
//   const { push } = useRouter();
//   const searchParams = useSearchParams();
//   const pathname = usePathname();

//   const query = {};
//   for (let [key, value] of searchParams.entries()) {
//     query[key] = value;
//   }

//   const [pageSizeInput, setPageSizeInput] = useState(pageSize.toString());
//   const [selectedPageSize, setSelectedPageSize] = useState(
//     [1, 5, 10, 25, 50, 100].includes(pageSize) ? pageSize : "Custom"
//   );

//   const handlePageSizeInputChange = (e) => {
//     const newValue = e.target.value;
//     if (newValue === "" || /^\d+$/.test(newValue)) {
//       setPageSizeInput(newValue);
//     }
//   };

//   const handlePageSizeInputBlur = () => {
//     if (pageSizeInput === "") {
//       setPageSizeInput(pageSize.toString());
//     } else {
//       handlePageSizeInputCommit(pageSizeInput);
//     }
//   };

//   const handlePageSizeChange = (newSize) => {
//     if (newSize === "Custom") {
//       setSelectedPageSize("Custom");
//       setPageSizeInput(pageSize.toString());
//     } else {
//       const size = Math.max(1, Number(newSize));
//       const newQuery = getQueryString({ pageSize: size });
//       push(`${pathname}?${newQuery}`);
//       setSelectedPageSize(size);
//       setPageSizeInput(size.toString());
//     }
//   };

//   const handlePageSizeInputCommit = (value) => {
//     const newSize = Math.max(1, parseInt(value, 10) || 1);
//     const newQuery = getQueryString({ pageSize: newSize });
//     push(`${pathname}?${newQuery}`);
//     setSelectedPageSize("Custom");
//     setPageSizeInput(newSize.toString());
//   };

//   const getQueryString = (newParams) => {
//     const allParams = new URLSearchParams(query);
//     Object.keys(newParams).forEach((key) => {
//       allParams.set(key, newParams[key]); // Use `set` to ensure unique keys
//     });
//     return allParams.toString();
//   };

//   return (
//     <div className="flex items-center text-xs">
//       <select
//         value={selectedPageSize}
//         onChange={(e) => handlePageSizeChange(e.target.value)}
//         className="bg-transparent border-0 text-gray-800 focus:ring-0 dark:text-slate-100 mr-2"
//       >
//         <option value={1}>1</option>
//         <option value={5}>5</option>
//         <option value={10}>10</option>
//         <option value={25}>25</option>
//         <option value={50}>50</option>
//         <option value={100}>100</option>
//         <option value="Custom">Custom</option>
//       </select>
//       {selectedPageSize === "Custom" && (
//         <div className="flex items-center">
//           <input
//             className={`-ml-[0.02rem] mr-1 bg-transparent border-0 text-gray-800 focus:ring-0 dark:text-slate-100 text-center appearance-none`}
//             style={{
//               width: `${Math.max(1.2, pageSizeInput.length * 0.6)}em`, // Adjust width dynamically based on input length
//             }}
//             type="text"
//             value={pageSizeInput}
//             onChange={handlePageSizeInputChange}
//             onBlur={handlePageSizeInputBlur}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") {
//                 handlePageSizeInputCommit(e.target.value);
//               }
//             }}
//           />
//         </div>
//       )}
//     </div>
//   );
// }