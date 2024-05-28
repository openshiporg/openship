export function PaginationStats({ list, currentPage, total, pageSize }) {
    let stats;
  
    if (total > pageSize) {
      const start = pageSize * (currentPage - 1) + 1;
      const end = Math.min(start + pageSize - 1, total);
      stats = (
        <>
          <strong>{start}</strong> {start !== end ? <>- <strong>{end}</strong></> : ""} of <strong>{total}</strong> {list.plural.toLowerCase()}
        </>
      );
    } else {
      if (total > 1 && list.plural) {
        stats = (
          <>
            <strong>{total}</strong> {list.plural.toLowerCase()}
          </>
        );
      } else if (total === 1 && list.singular.toLowerCase()) {
        stats = (
          <>
            <strong>{total}</strong> {list.singular.toLowerCase()}
          </>
        );
      } else {
        stats = <>0 {list.plural.toLowerCase()}</>;
      }
    }
  
    return <span className="text-xs text-muted-foreground">Showing {stats}</span>;
  }
  