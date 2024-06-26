const { getGqlNames } = require("@keystone-6/core/types");

async function initializeAdminMeta(context, fieldViews, lazyMetadataQuery) {
  // Execute the query using context.sudo().graphql.run
  const result = await context.sudo().graphql.run({
    query: lazyMetadataQuery,
  });

  if (result.errors) {
    throw new Error(`Error fetching admin meta: ${result.errors.map(e => e.message).join(', ')}`);
  }

  const { lists } = result.data.keystone.adminMeta;
  const runtimeLists = {};

  for (const list of lists) {
    if (list.isHidden) continue;

    runtimeLists[list.key] = {
      ...list,
      gqlNames: getGqlNames({
        listKey: list.key,
        pluralGraphQLName: list.listQueryName,
      }),
      fields: {},
    };

    for (const field of list.fields) {
      const views = { ...fieldViews[field.viewsIndex] };
      const customViews = {};

      if (field.customViewsIndex !== null) {
        const customViewsSource = fieldViews[field.customViewsIndex];
        const allowedExportsOnCustomViews = new Set(views.allowedExportsOnCustomViews);
        
        Object.keys(customViewsSource).forEach((exportName) => {
          if (allowedExportsOnCustomViews.has(exportName)) {
            customViews[exportName] = customViewsSource[exportName];
          } else if (views.expectedExports.has(exportName)) {
            views[exportName] = customViewsSource[exportName];
          }
        });
      }

      runtimeLists[list.key].fields[field.path] = {
        ...field,
        views,
        controller: views.controller({
          listKey: list.key,
          fieldMeta: field.fieldMeta,
          label: field.label,
          description: field.description,
          path: field.path,
          customViews,
        }),
      };
    }
  }

  return runtimeLists;
}

let adminMetaPromise = null;

function getList(listKey) {
  return async (context, fieldViews, lazyMetadataQuery) => {
    if (!adminMetaPromise) {
      adminMetaPromise = initializeAdminMeta(context, fieldViews, lazyMetadataQuery);
    }
    
    const adminMeta = await adminMetaPromise;
    
    if (!adminMeta[listKey]) {
      throw new Error(`List "${listKey}" not found or is hidden.`);
    }
    
    return adminMeta[listKey];
  };
}

module.exports = { getList };