import { getNamesFromList } from "../utils/getNamesFromList";
import config from "..";
import { graphql } from "@keystone-6/core";
import { resolveRelationships } from "./resolve-relationships";
import { writeFile, mkdir } from "fs";
import { join } from "path";

const viewMappings = {
  "@keystone-6/core/fields/types/text/views": "@keystone/views/Text",
  "@keystone-6/core/fields/types/password/views": "@keystone/views/Password",
  "@keystone-6/core/fields/types/relationship/views":
    "@keystone/views/Relationship",
  "@keystone-6/core/fields/types/json/views": "@keystone/views/JSON",
  "@keystone-6/core/fields/types/timestamp/views": "@keystone/views/Timestamp",
  "@keystone-6/core/fields/types/checkbox/views": "@keystone/views/Checkbox",
  "@keystone-6/core/fields/types/select/views": "@keystone/views/Select",
  "@keystone-6/core/fields/types/integer/views": "@keystone/views/Integer",
  "@keystone-6/core/fields/types/float/views": "@keystone/views/Float",
  "@keystone-6/core/fields/types/image/views": "@keystone/views/Image",
};

// console.log(viewMappings["@keystone-6/core/fields/types/timestamp/views"]);

const lists = initialiseLists(config);

const allViews = extractUniqueViews(lists).map((viewRelativeToProject) => {
  const isRelativeToFile =
    viewRelativeToProject.startsWith("./") ||
    viewRelativeToProject.startsWith("../");
  const viewRelativeToAppFile = isRelativeToFile
    ? "../../../" + viewRelativeToProject
    : viewRelativeToProject;

  // we're not using serializePathForImport here because we want the thing you write for a view
  // to be exactly what you would put in an import in the project directory.
  // we're still using JSON.stringify to escape anything that might need to be though
  return JSON.stringify(viewRelativeToAppFile);
});
// Define the content you want to put in fieldViews.js
const content = `
// the fieldView order is based on the schema
// if the schema is changed, yarn generate-field-views should be run to update this file

import * as view0 from "@keystone/views/IDField";
${allViews
  .map((views, i) => `import * as view${i + 1} from ${views};`)
  .join("\n")}

export const fieldViews = [
  view0,
${allViews.map((view, i) => `  view${i + 1}`).join(",\n")}
];
`;

// Define the path to the parent directory of the current script
const parentDirectoryPath = join(__dirname, "..");

// Define the path to the keystone folder
const keystoneFolderPath = join(parentDirectoryPath, "./");

// Define the path to the fieldViews.js file
const filePath = join(keystoneFolderPath, "fieldViews.js");

// Function to create the keystone directory if it doesn't exist
const createKeystoneDirectory = (callback) => {
  mkdir(keystoneFolderPath, { recursive: true }, (err) => {
    if (err) {
      console.error("Error creating directory:", err);
      return;
    }
    callback();
  });
};

// Function to create the file
const createFieldViewsFile = () => {
  writeFile(filePath, content, (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return;
    }
    console.log("fieldViews.js created successfully in the keystone folder.");
  });
};

// Execute the functions
createKeystoneDirectory(createFieldViewsFile);

export function initialiseLists(config) {
  const listsConfig = config.lists;

  let intermediateLists;
  intermediateLists = Object.fromEntries(
    Object.entries(getIsEnabled(listsConfig)).map(([key, isEnabled]) => [
      key,
      { graphql: { isEnabled } },
    ])
  );

  /**
   * Lists is instantiated here so that it can be passed into the `getListGraphqlTypes` function
   * This function binds the listsRef object to the various graphql functions
   *
   * The object will be populated at the end of this function, and the reference will be maintained
   */
  const listsRef = {};

  {
    const listGraphqlTypes = getListGraphqlTypes(
      listsConfig,
      listsRef,
      intermediateLists
    );
    intermediateLists = getListsWithInitialisedFields(
      config,
      listGraphqlTypes,
      intermediateLists
    );
  }

  {
    const resolvedDBFieldsForLists = resolveRelationships(intermediateLists);
    intermediateLists = Object.fromEntries(
      Object.entries(intermediateLists).map(([listKey, list]) => [
        listKey,
        {
          ...list,
          resolvedDbFields: resolvedDBFieldsForLists[listKey],
        },
      ])
    );
  }

  intermediateLists = Object.fromEntries(
    Object.entries(intermediateLists).map(([listKey, list]) => {
      const fields = {};

      for (const [fieldKey, field] of Object.entries(list.fields)) {
        fields[fieldKey] = {
          ...field,
          dbField: list.resolvedDbFields[fieldKey],
        };
      }

      return [listKey, { ...list, fields }];
    })
  );

  for (const list of Object.values(intermediateLists)) {
    let hasAnEnabledCreateField = false;
    let hasAnEnabledUpdateField = false;

    for (const field of Object.values(list.fields)) {
      if (field.input?.create?.arg && field.graphql.isEnabled.create) {
        hasAnEnabledCreateField = true;
      }
      if (field.input?.update && field.graphql.isEnabled.update) {
        hasAnEnabledUpdateField = true;
      }
    }

    // you can't have empty GraphQL types
    //   if empty, omit the type completely
    if (!hasAnEnabledCreateField) {
      list.graphql.isEnabled.create = false;
    }
    if (!hasAnEnabledUpdateField) {
      list.graphql.isEnabled.update = false;
    }
  }

  // fixup the GraphQL refs
  for (const [listKey, intermediateList] of Object.entries(intermediateLists)) {
    listsRef[listKey] = {
      ...intermediateList,
      lists: listsRef,
    };
  }

  // Do some introspection
  // introspectGraphQLTypes(listsRef);
  // console.log(listsRef.ShippingMethodTaxLine);
  return listsRef;
}

function extractUniqueViews(jsonData) {
  let viewsArray = [];

  for (const key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      const fields = jsonData[key].fields;
      if (fields) {
        for (const fieldKey in fields) {
          if (fields.hasOwnProperty(fieldKey)) {
            const field = fields[fieldKey];
            const viewMap = viewMappings[field.views] || field.views;
            if (viewMap && !viewsArray.includes(viewMap)) {
              viewsArray.push(viewMap);
            }
          }
        }
      }
    }
  }

  return viewsArray;
}

function getIsEnabled(listsConfig) {
  const isEnabled = {};

  for (const [listKey, listConfig] of Object.entries(listsConfig)) {
    const omit = listConfig.graphql?.omit;
    const { defaultIsFilterable, defaultIsOrderable } = listConfig;
    if (!omit) {
      // We explicity check for boolean/function values here to ensure the dev hasn't made a mistake
      // when defining these values. We avoid duck-typing here as this is security related
      // and we want to make it hard to write incorrect code.
      throwIfNotAFilter(defaultIsFilterable, listKey, "defaultIsFilterable");
      throwIfNotAFilter(defaultIsOrderable, listKey, "defaultIsOrderable");
    }
    if (omit === true) {
      isEnabled[listKey] = {
        type: false,
        query: false,
        create: false,
        update: false,
        delete: false,
        filter: false,
        orderBy: false,
      };
    } else {
      isEnabled[listKey] = {
        type: true,
        query: !omit?.query,
        create: !omit?.create,
        update: !omit?.update,
        delete: !omit?.delete,
        filter: defaultIsFilterable ?? true,
        orderBy: defaultIsOrderable ?? true,
      };
    }
  }

  return isEnabled;
}

function throwIfNotAFilter(x, listKey, fieldKey) {
  if (["boolean", "undefined", "function"].includes(typeof x)) return;

  throw new Error(
    `Configuration option '${listKey}.${fieldKey}' must be either a boolean value or a function. Received '${x}'.`
  );
}

function getListGraphqlTypes(listsConfig, lists, intermediateLists) {
  const graphQLTypes = {};

  for (const [listKey, listConfig] of Object.entries(listsConfig)) {
    const {
      graphql: { names },
    } = getNamesFromList(listKey, listConfig);

    const output = graphql.object()({
      name: names.outputTypeName,
      fields: () => {
        const { fields } = lists[listKey];
        return {
          ...Object.fromEntries(
            Object.entries(fields).flatMap(([fieldPath, field]) => {
              if (
                !field.output ||
                !field.graphql.isEnabled.read ||
                (field.dbField.kind === "relation" &&
                  !intermediateLists[field.dbField.list].graphql.isEnabled
                    .query)
              ) {
                return [];
              }

              const outputFieldRoot = graphqlForOutputField(field);
              return [
                [fieldPath, outputFieldRoot],
                ...Object.entries(field.extraOutputFields || {}),
              ].map(([outputTypeFieldName, outputField]) => {
                return [
                  outputTypeFieldName,
                  outputTypeField(
                    outputField,
                    field.dbField,
                    field.graphql?.cacheHint,
                    field.access.read,
                    listKey,
                    fieldPath,
                    lists
                  ),
                ];
              });
            })
          ),
        };
      },
    });

    const uniqueWhere = graphql.inputObject({
      name: names.whereUniqueInputName,
      fields: () => {
        const { fields } = lists[listKey];
        return {
          ...Object.fromEntries(
            Object.entries(fields).flatMap(([key, field]) => {
              if (
                !field.input?.uniqueWhere?.arg ||
                !field.graphql.isEnabled.read ||
                !field.graphql.isEnabled.filter
              ) {
                return [];
              }
              return [[key, field.input.uniqueWhere.arg]];
            })
          ),
          // this is exactly what the id field will add
          // but this does it more explicitly so that typescript understands
          id: graphql.arg({ type: graphql.ID }),
        };
      },
    });

    const where = graphql.inputObject({
      name: names.whereInputName,
      fields: () => {
        const { fields } = lists[listKey];
        return Object.assign(
          {
            AND: graphql.arg({ type: graphql.list(graphql.nonNull(where)) }),
            OR: graphql.arg({ type: graphql.list(graphql.nonNull(where)) }),
            NOT: graphql.arg({ type: graphql.list(graphql.nonNull(where)) }),
          },
          ...Object.entries(fields).map(
            ([fieldKey, field]) =>
              field.input?.where?.arg &&
              field.graphql.isEnabled.read &&
              field.graphql.isEnabled.filter && {
                [fieldKey]: field.input?.where?.arg,
              }
          )
        );
      },
    });

    const create = graphql.inputObject({
      name: names.createInputName,
      fields: () => {
        const { fields } = lists[listKey];
        const ret = {};

        for (const key in fields) {
          const arg = graphqlArgForInputField(fields[key], "create");
          if (!arg) continue;
          ret[key] = arg;
        }

        return ret;
      },
    });

    const update = graphql.inputObject({
      name: names.updateInputName,
      fields: () => {
        const { fields } = lists[listKey];
        const ret = {};

        for (const key in fields) {
          const arg = graphqlArgForInputField(fields[key], "update");
          if (!arg) continue;
          ret[key] = arg;
        }

        return ret;
      },
    });

    const orderBy = graphql.inputObject({
      name: names.listOrderName,
      fields: () => {
        const { fields } = lists[listKey];
        return Object.fromEntries(
          Object.entries(fields).flatMap(([key, field]) => {
            if (
              !field.input?.orderBy?.arg ||
              !field.graphql.isEnabled.read ||
              !field.graphql.isEnabled.orderBy
            ) {
              return [];
            }
            return [[key, field.input.orderBy.arg]];
          })
        );
      },
    });

    let take = graphql.arg({ type: graphql.Int });
    if (listConfig.graphql?.maxTake !== undefined) {
      take = graphql.arg({
        type: graphql.nonNull(graphql.Int),
        // warning: this is used by queries/resolvers.ts to enforce the limit
        defaultValue: listConfig.graphql.maxTake,
      });
    }

    const findManyArgs = {
      where: graphql.arg({
        type: graphql.nonNull(where),
        defaultValue: listConfig.isSingleton
          ? {
              id: { equals: "1" },
            }
          : {},
      }),
      orderBy: graphql.arg({
        type: graphql.nonNull(graphql.list(graphql.nonNull(orderBy))),
        defaultValue: [],
      }),
      take,
      skip: graphql.arg({
        type: graphql.nonNull(graphql.Int),
        defaultValue: 0,
      }),
      cursor: graphql.arg({ type: uniqueWhere }),
    };

    const isEnabled = intermediateLists[listKey].graphql.isEnabled;
    let relateToManyForCreate,
      relateToManyForUpdate,
      relateToOneForCreate,
      relateToOneForUpdate;
    if (isEnabled.type) {
      relateToManyForCreate = graphql.inputObject({
        name: names.relateToManyForCreateInputName,
        fields: () => {
          return {
            // Create via a relationship is only supported if this list allows create
            ...(isEnabled.create && {
              create: graphql.arg({
                type: graphql.list(graphql.nonNull(create)),
              }),
            }),
            connect: graphql.arg({
              type: graphql.list(graphql.nonNull(uniqueWhere)),
            }),
          };
        },
      });

      relateToManyForUpdate = graphql.inputObject({
        name: names.relateToManyForUpdateInputName,
        fields: () => {
          return {
            // The order of these fields reflects the order in which they are applied
            // in the mutation.
            disconnect: graphql.arg({
              type: graphql.list(graphql.nonNull(uniqueWhere)),
            }),
            set: graphql.arg({
              type: graphql.list(graphql.nonNull(uniqueWhere)),
            }),
            // Create via a relationship is only supported if this list allows create
            ...(isEnabled.create && {
              create: graphql.arg({
                type: graphql.list(graphql.nonNull(create)),
              }),
            }),
            connect: graphql.arg({
              type: graphql.list(graphql.nonNull(uniqueWhere)),
            }),
          };
        },
      });

      relateToOneForCreate = graphql.inputObject({
        name: names.relateToOneForCreateInputName,
        fields: () => {
          return {
            // Create via a relationship is only supported if this list allows create
            ...(isEnabled.create && { create: graphql.arg({ type: create }) }),
            connect: graphql.arg({ type: uniqueWhere }),
          };
        },
      });

      relateToOneForUpdate = graphql.inputObject({
        name: names.relateToOneForUpdateInputName,
        fields: () => {
          return {
            // Create via a relationship is only supported if this list allows create
            ...(isEnabled.create && { create: graphql.arg({ type: create }) }),
            connect: graphql.arg({ type: uniqueWhere }),
            disconnect: graphql.arg({ type: graphql.Boolean }),
          };
        },
      });
    }

    graphQLTypes[listKey] = {
      types: {
        output,
        uniqueWhere,
        where,
        create,
        orderBy,
        update,
        findManyArgs,
        relateTo: {
          many: {
            where: graphql.inputObject({
              name: `${listKey}ManyRelationFilter`,
              fields: {
                every: graphql.arg({ type: where }),
                some: graphql.arg({ type: where }),
                none: graphql.arg({ type: where }),
              },
            }),
            create: relateToManyForCreate,
            update: relateToManyForUpdate,
          },
          one: { create: relateToOneForCreate, update: relateToOneForUpdate },
        },
      },
    };
  }

  return graphQLTypes;
}

function getListsWithInitialisedFields(
  { storage: configStorage, lists: listsConfig, db: { provider } },
  listGraphqlTypes,
  intermediateLists
) {
  const result = {};

  for (const [listKey, list] of Object.entries(listsConfig)) {
    const intermediateList = intermediateLists[listKey];
    const resultFields = {};
    const groups = [];
    const fieldKeys = Object.keys(list.fields);

    for (const [idx, [fieldKey, fieldFunc]] of Object.entries(
      list.fields
    ).entries()) {
      if (fieldKey.startsWith("__group")) {
        const group = fieldFunc;
        if (
          typeof group === "object" &&
          group !== null &&
          typeof group.label === "string" &&
          (group.description === null ||
            typeof group.description === "string") &&
          Array.isArray(group.fields) &&
          areArraysEqual(
            group.fields,
            fieldKeys.slice(idx + 1, idx + 1 + group.fields.length)
          )
        ) {
          groups.push(group);
          continue;
        }
        throw new Error(
          `unexpected value for a group at ${listKey}.${fieldKey}`
        );
      }

      if (typeof fieldFunc !== "function") {
        throw new Error(
          `The field at ${listKey}.${fieldKey} does not provide a function`
        );
      }

      const f = fieldFunc({
        fieldKey,
        listKey,
        lists: listGraphqlTypes,
        provider,
        getStorage: (storage) => configStorage?.[storage],
      });

      // We explicity check for boolean values here to ensure the dev hasn't made a mistake
      // when defining these values. We avoid duck-typing here as this is security related
      // and we want to make it hard to write incorrect code.
      throwIfNotAFilter(f.isFilterable, listKey, "isFilterable");
      throwIfNotAFilter(f.isOrderable, listKey, "isOrderable");

      const omit = f.graphql?.omit;
      const read = omit !== true && !omit?.read;
      const _isEnabled = {
        read,
        create: omit !== true && !omit?.create,
        update: omit !== true && !omit?.update,
        // Filter and orderBy can be defaulted at the list level, otherwise they
        // default to `false` if no value was set at the list level.
        filter:
          read && (f.isFilterable ?? intermediateList.graphql.isEnabled.filter),
        orderBy:
          read && (f.isOrderable ?? intermediateList.graphql.isEnabled.orderBy),
      };

      const fieldModes = {
        create:
          f.ui?.createView?.fieldMode ??
          list.ui?.createView?.defaultFieldMode ??
          "edit",
        item:
          f.ui?.itemView?.fieldMode ??
          list.ui?.itemView?.defaultFieldMode ??
          "edit",
        list:
          f.ui?.listView?.fieldMode ??
          list.ui?.listView?.defaultFieldMode ??
          "read",
      };

      resultFields[fieldKey] = {
        dbField: f.dbField,
        access: parseFieldAccessControl(f.access),
        hooks: parseFieldHooks(f.hooks ?? {}),
        graphql: {
          cacheHint: f.graphql?.cacheHint,
          isEnabled: _isEnabled,
          isNonNull: {
            read: f.graphql?.isNonNull?.read ?? false,
            create: f.graphql?.isNonNull?.create ?? false,
            update: f.graphql?.isNonNull?.update ?? false,
          },
        },
        ui: {
          label: f.label ?? null,
          description: f.ui?.description ?? null,
          views: f.ui?.views ?? null,
          createView: {
            fieldMode: _isEnabled.create ? fieldModes.create : "hidden",
          },

          itemView: {
            fieldPosition: f.ui?.itemView?.fieldPosition ?? "form",
            fieldMode: _isEnabled.update
              ? fieldModes.item
              : _isEnabled.read && fieldModes.item !== "hidden"
                ? "read"
                : "hidden",
          },

          listView: {
            fieldMode: _isEnabled.read ? fieldModes.list : "hidden",
          },
        },

        // copy
        __ksTelemetryFieldTypeName: f.__ksTelemetryFieldTypeName,
        extraOutputFields: f.extraOutputFields,
        getAdminMeta: f.getAdminMeta,
        input: { ...f.input },
        output: { ...f.output },
        unreferencedConcreteInterfaceImplementations:
          f.unreferencedConcreteInterfaceImplementations,
        views: f.views,
      };
    }

    // Default the labelField to `name`, `label`, or `title` if they exist; otherwise fall back to `id`
    const labelField =
      list.ui?.labelField ??
      (list.fields.label
        ? "label"
        : list.fields.name
          ? "name"
          : list.fields.title
            ? "title"
            : "id");

    const searchFields = new Set(list.ui?.searchFields ?? []);
    if (searchFields.has("id")) {
      throw new Error(`${listKey}.ui.searchFields cannot include 'id'`);
    }

    const names = getNamesFromList(listKey, list);

    result[listKey] = {
      access: parseListAccessControl(list.access),

      fields: resultFields,
      groups,

      graphql: {
        types: listGraphqlTypes[listKey].types,
        names: names.graphql.names,
        namePlural: names.graphql.namePlural, // TODO: remove
        ...intermediateList.graphql,
      },

      prisma: {
        listKey: listKey[0].toLowerCase() + listKey.slice(1),
        mapping: list.db?.map,
        extendPrismaSchema: list.db?.extendPrismaSchema,
      },

      ui: {
        labels: names.ui.labels,
        labelField,
        searchFields,
        searchableFields: new Map(),
      },
      hooks: parseListHooks(list.hooks ?? {}),
      listKey,
      cacheHint: (() => {
        const cacheHint = list.graphql?.cacheHint;
        if (cacheHint === undefined) {
          return undefined;
        }
        return typeof cacheHint === "function" ? cacheHint : () => cacheHint;
      })(),
      isSingleton: list.isSingleton ?? false,
    };
  }

  return result;
}

export function parseFieldAccessControl(access) {
  if (typeof access === "function") {
    return { read: access, create: access, update: access };
  }

  return {
    read: access?.read ?? allowAll,
    create: access?.create ?? allowAll,
    update: access?.update ?? allowAll,
  };
}

export function allowAll() {
  return true;
}

function parseFieldHooks(hooks) {
  return {
    resolveInput: {
      create: hooks.resolveInput ?? defaultFieldHooksResolveInput,
      update: hooks.resolveInput ?? defaultFieldHooksResolveInput,
    },
    validateInput: hooks.validateInput ?? defaultOperationHook,
    validateDelete: hooks.validateDelete ?? defaultOperationHook,
    beforeOperation: {
      create: hooks.beforeOperation ?? defaultOperationHook,
      update: hooks.beforeOperation ?? defaultOperationHook,
      delete: hooks.beforeOperation ?? defaultOperationHook,
    },
    afterOperation: {
      create: hooks.afterOperation ?? defaultOperationHook,
      update: hooks.afterOperation ?? defaultOperationHook,
      delete: hooks.afterOperation ?? defaultOperationHook,
    },
  };
}

function defaultFieldHooksResolveInput({ resolvedData, fieldKey }) {
  return resolvedData[fieldKey];
}

function defaultOperationHook() {}

export function parseListAccessControl(access) {
  if (typeof access === "function") {
    return {
      operation: {
        query: access,
        create: access,
        update: access,
        delete: access,
      },
      filter: {
        query: allowAll,
        update: allowAll,
        delete: allowAll,
      },
      item: {
        create: allowAll,
        update: allowAll,
        delete: allowAll,
      },
    };
  }

  let { operation, filter, item } = access;
  if (typeof operation === "function") {
    operation = {
      query: operation,
      create: operation,
      update: operation,
      delete: operation,
    };
  }

  return {
    operation: {
      query: operation.query ?? allowAll,
      create: operation.create ?? allowAll,
      update: operation.update ?? allowAll,
      delete: operation.delete ?? allowAll,
    },
    filter: {
      query: filter?.query ?? allowAll,
      // create: not supported
      update: filter?.update ?? allowAll,
      delete: filter?.delete ?? allowAll,
    },
    item: {
      // query: not supported
      create: item?.create ?? allowAll,
      update: item?.update ?? allowAll,
      delete: item?.delete ?? allowAll,
    },
  };
}

function parseListHooksResolveInput(f) {
  if (typeof f === "function") {
    return {
      create: f,
      update: f,
    };
  }

  const {
    create = defaultListHooksResolveInput,
    update = defaultListHooksResolveInput,
  } = f ?? {};
  return { create, update };
}

function parseListHooks(hooks) {
  return {
    resolveInput: parseListHooksResolveInput(hooks.resolveInput),
    validateInput: hooks.validateInput ?? defaultOperationHook,
    validateDelete: hooks.validateDelete ?? defaultOperationHook,
    beforeOperation: parseListHooksBeforeOperation(hooks.beforeOperation),
    afterOperation: parseListHooksAfterOperation(hooks.afterOperation),
  };
}

function defaultListHooksResolveInput({ resolvedData }) {
  return resolvedData;
}

function parseListHooksBeforeOperation(f) {
  if (typeof f === "function") {
    return {
      create: f,
      update: f,
      delete: f,
    };
  }

  const {
    create = defaultOperationHook,
    update = defaultOperationHook,
    delete: _delete = defaultOperationHook,
  } = f ?? {};
  return { create, update, delete: _delete };
}

function parseListHooksAfterOperation(f) {
  if (typeof f === "function") {
    return {
      create: f,
      update: f,
      delete: f,
    };
  }

  const {
    create = defaultOperationHook,
    update = defaultOperationHook,
    delete: _delete = defaultOperationHook,
  } = f ?? {};
  return { create, update, delete: _delete };
}
