import { useEffect, useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useList } from '@keystone/keystoneProvider';
import { getRootGraphQLFieldsFromFieldController } from '@keystone-6/core/admin-ui/utils';
import { useSearchParams } from 'next/navigation';
import { CheckboxControl } from '../Checkbox';
import { AdminLink } from '../AdminLink';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function ListDataTable({
  selectedFields,
  listKey,
  itemsGetter,
  count,
  sort,
  currentPage,
  pageSize,
  selectedItems,
  onSelectedItemsChange,
  orderableFields,
}) {
  const list = useList(listKey);
  const [rowData, setRowData] = useState(() => [...(itemsGetter.data ?? [])]);
  const searchParams = useSearchParams();
  const query = {};
  for (let [key, value] of searchParams.entries()) {
    query[key] = value;
  }

  useEffect(() => {
    setRowData([...(itemsGetter.data ?? [])]);
  }, [itemsGetter.data]);

  const [sorting, setSorting] = useState(() =>
    sort ? [{ colId: sort.field, sort: sort.direction.toLowerCase() }] : []
  );

  const columns = useMemo(() => {
    const checkboxColumn = {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      headerName: '',
      width: 45,
    };

    const fieldsArray = Array.isArray(selectedFields)
      ? selectedFields
      : Array.from(selectedFields);
    const orderableFieldsArray = Array.isArray(orderableFields)
      ? orderableFields
      : Array.from(orderableFields);

    return [
      checkboxColumn,
      ...fieldsArray.map((fieldKey, i) => {
        const field = list.fields[fieldKey];
        const { Cell } = field.views;
        const isOrderable = orderableFieldsArray.includes(fieldKey);

        return {
          headerName: (
            <AdminLink
              href={{
                query: {
                  ...query,
                  sortBy:
                    sort?.field === fieldKey && sort.direction === 'ASC'
                      ? `-${fieldKey}`
                      : fieldKey,
                },
              }}
              className="flex items-center justify-start gap-1"
            >
              {field.label}
              {query.sortBy === fieldKey && <ChevronDown size={16} />}
              {query.sortBy === `-${fieldKey}` && <ChevronUp size={16} />}
            </AdminLink>
          ),
          field: fieldKey,
          sortable: isOrderable,
          cellRendererFramework: ({ data }) => {
            const item = data;
            const itemId = item.id;
            const itemForField = {};

            for (const graphqlField of getRootGraphQLFieldsFromFieldController(
              field.controller
            )) {
              if (
                item[graphqlField] === null ||
                item[graphqlField] === undefined
              ) {
                return (
                  <div className="flex">
                    <div className="font-mono text-xs rounded-sm px-2 py-1 border-dashed border italic">
                      null
                    </div>
                  </div>
                );
              }
              itemForField[graphqlField] = item[graphqlField];
            }

            return (
              <Cell
                field={field.controller}
                item={itemForField}
                linkTo={
                  i === 0 && Cell.supportsLinkTo
                    ? {
                        href: `/${list.path}/${encodeURIComponent(itemId)}`,
                      }
                    : undefined
                }
              />
            );
          },
        };
      }),
    ];
  }, [selectedFields, list.fields, orderableFields]);

  const onGridReady = (params) => {
    params.api.sizeColumnsToFit();
  };

  const onSelectionChanged = (event) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes.map(node => node.data.id);
    onSelectedItemsChange(new Set(selectedData));
  };

  return (
    <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columns}
        rowSelection="multiple"
        onSelectionChanged={onSelectionChanged}
        onGridReady={onGridReady}
        defaultColDef={{
          sortable: true,
          resizable: true,
        }}
        sortModel={sorting}
        pagination={true}
        paginationPageSize={pageSize}
        onSortChanged={(params) => {
          const sortModel = params.api.getSortModel();
          setSorting(sortModel);
        }}
        onPaginationChanged={(params) => {
          const currentPage = params.api.paginationGetCurrentPage();
          // handle currentPage change
        }}
      />
    </div>
  );
}

export default ListDataTable;
