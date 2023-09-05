import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Stack, useTheme } from "@keystone-ui/core";
import { Select } from "@keystone-ui/fields";
import { ChevronRightIcon, ChevronLeftIcon } from "@keystone-ui/icons";
import { AdminLink } from "@keystone/components/AdminLink";

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
  const { query, pathname, push } = useRouter();
  const { stats } = getPaginationStats({ list, currentPage, total, pageSize });
  const { opacity } = useTheme();

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
      push({
        pathname,
        query: {
          ...query,
          page: Math.ceil(total / pageSize),
        },
      });
    }
  }, [total, pageSize, currentPage, pathname, query, push]);

  // Don't render the pagiantion component if the pageSize is greater than the total number of items in the list.
  if (total <= pageSize) return null;

  const onChange = (selectedOption) => {
    push({
      pathname,
      query: {
        ...query,
        page: selectedOption.value,
      },
    });
  };

  for (let page = minPage; page <= limit; page++) {
    pages.push({
      label: String(page),
      value: String(page),
    });
  }

  return (
    <Stack
      as="nav"
      role="navigation"
      aria-label="Pagination"
      paddingLeft="medium"
      paddingRight="medium"
      paddingTop="large"
      paddingBottom="large"
      across
      align="center"
      css={{
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      <Stack across gap="xxlarge" align="center">
        <span>{`${list.plural} per page: ${pageSize}`}</span>
        <span>
          <strong>{stats}</strong>
        </span>
      </Stack>

      <Stack gap="medium" across align="center">
        <Select
          width="medium"
          value={{ label: String(currentPage), value: String(currentPage) }}
          options={pages}
          styles={{
            valueContainer: (provided) => ({
              ...provided,
              paddingLeft: "12px",
              paddingRight: "16px",
            }),
          }}
          menuPortalTarget={document.body}
          onChange={onChange}
        />
        <span>of {limit}</span>
        <AdminLink
          aria-label="Previous page"
          css={{
            color: "#415269",
            ...(prevPage < minPage && {
              pointerEvents: "none",
              opacity: opacity.disabled,
            }),
          }}
          href={{ query: prevQuery }}
        >
          <ChevronLeftIcon />
        </AdminLink>
        <AdminLink
          aria-label="Next page"
          css={{
            color: "#415269",
            ...(nextPage > limit && {
              pointerEvents: "none",
              opacity: opacity.disabled,
            }),
          }}
          href={{ query: nxtQuery }}
        >
          <ChevronRightIcon />
        </AdminLink>
      </Stack>
    </Stack>
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
