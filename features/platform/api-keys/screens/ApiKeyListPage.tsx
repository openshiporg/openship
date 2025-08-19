import { getListByPath, getAdminMetaAction } from "@/features/dashboard/actions";
import { getListItemsAction } from "@/features/dashboard/actions/getListItemsAction";
import { buildOrderByClause } from "@/features/dashboard/lib/buildOrderByClause";
import { buildWhereClause } from "@/features/dashboard/lib/buildWhereClause";
import { ApiKeyListPageClient } from "../components/ApiKeyListPageClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function ApiKeyListPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const searchParamsObj = Object.fromEntries(
    Object.entries(resolvedSearchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : value?.toString(),
    ])
  );

  // Get list metadata
  const list = await getListByPath("api-keys");
  
  if (!list) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-red-600">
          Invalid List
        </h1>
        <p className="mt-2 text-gray-600">The requested list could not be found.</p>
      </div>
    );
  }

  // Parse search params (same as dashboard ListPage)
  const currentPage = parseInt(searchParamsObj.page?.toString() || '1', 10) || 1
  const pageSize = parseInt(searchParamsObj.pageSize?.toString() || list.pageSize?.toString() || '50', 10)
  const searchString = searchParamsObj.search?.toString() || ''

  // Build dynamic orderBy clause using Keystone's defaults
  const orderBy = buildOrderByClause(list, searchParamsObj)

  // Build filters from URL params using Keystone's approach
  const filterWhere = buildWhereClause(list, searchParamsObj)

  // Build search where clause
  const searchParameters = searchString ? { search: searchString } : {}
  const searchWhere = buildWhereClause(list, searchParameters)

  // Combine search and filters - following Keystone's pattern
  const whereConditions = []
  if (Object.keys(searchWhere).length > 0) {
    whereConditions.push(searchWhere)
  }
  if (Object.keys(filterWhere).length > 0) {
    whereConditions.push(filterWhere)
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {}

  // Build GraphQL variables
  const variables = {
    where,
    take: pageSize,
    skip: (currentPage - 1) * pageSize,
    orderBy
  }

  // Build selected fields set from URL params or default to initial columns
  let selectedFields = ['id'] // Always include ID
  
  if (searchParamsObj.fields) {
    // Use fields from URL params
    const fieldsFromUrl = searchParamsObj.fields.toString().split(',').filter(field => {
      return field in (list.fields || {})
    })
    selectedFields = [...selectedFields, ...fieldsFromUrl]
  } else {
    // Use initial columns or fallback to basic fields
    if (list.initialColumns && list.initialColumns.length > 0) {
      selectedFields = [...selectedFields, ...list.initialColumns]
    } else if (list.fields) {
      // Fallback for lists without initialColumns
      Object.keys(list.fields).forEach(fieldKey => {
        if (['name', 'title', 'label', 'createdAt', 'updatedAt'].includes(fieldKey)) {
          selectedFields.push(fieldKey)
        }
      })
    }
  }
  
  // Remove duplicates
  selectedFields = [...new Set(selectedFields)]

  // Fetch list items data with cache options
  const cacheOptions = {
    next: {
      tags: [`list-${list.key}`],
      revalidate: 300, // 5 minutes
    },
  }

  // Use the dashboard action for list items data
  const response = await getListItemsAction("api-keys", variables, selectedFields, cacheOptions)

  let fetchedData: { items: any[], count: number } = { items: [], count: 0 }
  let error: string | null = null

  if (response.success) {
    fetchedData = response.data
  } else {
    console.error('Error fetching list items:', response.error)
    error = response.error
  }

  // Get adminMeta for the list structure
  const adminMetaResponse = await getAdminMetaAction(list.key)
  
  // Extract the list with proper field metadata if successful
  const adminMetaList = adminMetaResponse.success ? adminMetaResponse.data.list : null
  
  // Create enhanced list with validation data
  const enhancedList = adminMetaList || list

  return (
    <ApiKeyListPageClient
      list={enhancedList}
      initialData={fetchedData}
      initialError={error}
      initialSearchParams={{
        page: currentPage,
        pageSize,
        search: searchString
      }}
    />
  );
}