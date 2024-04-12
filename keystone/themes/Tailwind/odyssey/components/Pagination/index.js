import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminLink } from "@keystone/components/AdminLink";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@keystone/primitives/default/ui/select";

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

  const nxtQuery = { ...query, page: nextPage };
  const prevQuery = { ...query, page: prevPage };

  const limit = Math.ceil(total / pageSize);
  const pages = [];

  useEffect(() => {
    // Check if the current page is larger than
    // the maximal page given the total and associated page size value.
    // (This could happen due to a deletion event, in which case we want to reroute the user to a previous page).
    if (currentPage > Math.ceil(total / pageSize)) {
      // push({
      //   pathname,
      //   query: {
      //     ...query,
      //     page: Math.ceil(total / pageSize),
      //   },
      // });
      push(`${pathname}?${searchParams}&page=${Math.ceil(total / pageSize)}`);
    }
  }, [total, pageSize, currentPage, pathname, query, push]);

  // Don't render the pagiantion component if the pageSize is greater than the total number of items in the list.
  if (total <= pageSize) return null;

  const onChange = (selectedOption) => {
    // push({
    //   pathname,
    //   query: {
    //     ...query,
    //     page: selectedOption.value,
    //   },
    // });
    push(`${pathname}?${searchParams}&page=${selectedOption.value}`);
  };

  for (let page = minPage; page <= limit; page++) {
    pages.push({
      label: String(page),
      value: String(page),
    });
  }

  return (
    <nav className="flex justify-between p-4" aria-label="Pagination">
      <div className="flex gap-x-8 items-center">
        <span>{`${list.plural} per page: ${pageSize}`}</span>
        <span>
          <strong>{stats}</strong>
        </span>
      </div>

      <div className="flex gap-x-4 items-center">
        <Select
          onValueChange={(newPage) =>
            onChange({ label: String(newPage), value: newPage })
          }
        >
          <SelectTrigger className="w-medium ...">
            <SelectValue>{String(currentPage)}</SelectValue>
            <ChevronDown />
          </SelectTrigger>
          <SelectContent>
            {pages.map((page) => (
              <SelectItem key={page} value={page}>
                {String(page)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>of {limit}</span>
        <AdminLink aria-label="Previous page" href={{ query: prevQuery }}>
          <ChevronLeftIcon />
        </AdminLink>
        <AdminLink aria-label="Next page" href={{ query: nxtQuery }}>
          <ChevronRightIcon />
        </AdminLink>
      </div>
    </nav>
  );
}

export function PaginationLabel({
  currentPage,
  pageSize,
  plural,
  singular,
  total,
}) {
  const { stats } = getPaginationStats({
    list: { plural, singular },
    currentPage,
    total,
    pageSize,
  });

  if (!total) {
    return <span>No {plural}</span>;
  }

  return (
    <span>
      Showing <strong>{stats}</strong>
    </span>
  );
}
