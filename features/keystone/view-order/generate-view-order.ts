#!/usr/bin/env node
// @ts-nocheck
import pluralize from "pluralize";
import config from "../index";
import { graphql } from "@keystone-6/core";
import { resolveRelationships } from "./resolve-relationships";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// EXACT COPY from OpenShip utils converted to TypeScript
function humanize(str: string): string {
  return str.replace(/[A-Z]/g, (match, index) => (index === 0 ? '' : ' ') + match.toLowerCase()).replace(/^./, (s) => s.toUpperCase());
}

function labelToPath(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-');
}

function labelToClass(str: string): string {
  return str.replace(/\s+/g, '').replace(/^./, (s) => s.toUpperCase());
}

export function getGqlNames({ listKey, pluralGraphQLName }: { listKey: string, pluralGraphQLName: string }) {
  const lowerPluralName =
    pluralGraphQLName.slice(0, 1).toLowerCase() + pluralGraphQLName.slice(1);
  const lowerSingularName =
    listKey.slice(0, 1).toLowerCase() + listKey.slice(1);
  return {
    outputTypeName: listKey,
    itemQueryName: lowerSingularName,
    listQueryName: lowerPluralName,
    listQueryCountName: `${lowerPluralName}Count`,
    listOrderName: `${listKey}OrderByInput`,
    deleteMutationName: `delete${listKey}`,
    updateMutationName: `update${listKey}`,
    createMutationName: `create${listKey}`,
    deleteManyMutationName: `delete${pluralGraphQLName}`,
    updateManyMutationName: `update${pluralGraphQLName}`,
    createManyMutationName: `create${pluralGraphQLName}`,
    whereInputName: `${listKey}WhereInput`,
    whereUniqueInputName: `${listKey}WhereUniqueInput`,
    updateInputName: `${listKey}UpdateInput`,
    createInputName: `${listKey}CreateInput`,
    updateManyInputName: `${listKey}UpdateArgs`,
    relateToManyForCreateInputName: `${listKey}RelateToManyForCreateInput`,
    relateToManyForUpdateInputName: `${listKey}RelateToManyForUpdateInput`,
    relateToOneForCreateInputName: `${listKey}RelateToOneForCreateInput`,
    relateToOneForUpdateInputName: `${listKey}RelateToOneForUpdateInput`,
  };
}

export function getNamesFromList(listKey: string, { graphql: gqlConfig, ui, isSingleton }: any) {
  if (ui?.path !== undefined && !/^[a-z-_][a-z0-9-_]*$/.test(ui.path)) {
    throw new Error(
      `ui.path for ${listKey} is ${ui.path} but it must only contain lowercase letters, numbers, dashes, and underscores and not start with a number`
    );
  }

  const computedSingular = humanize(listKey);
  const computedPlural = pluralize.plural(computedSingular);
  const computedLabel = isSingleton ? computedSingular : computedPlural;
  const path = ui?.path || labelToPath(computedLabel);

  const pluralGraphQLName = gqlConfig?.plural || labelToClass(computedPlural);
  if (pluralGraphQLName === listKey) {
    throw new Error(
      `The list key and the plural name used in GraphQL must be different but the list key ${listKey} is the same as the plural GraphQL name, please specify graphql.plural`
    );
  }

  return {
    graphql: {
      names: getGqlNames({ listKey, pluralGraphQLName }),
      namePlural: pluralGraphQLName,
    },
    ui: {
      labels: {
        label: ui?.label || computedLabel,
        singular: ui?.singular || computedSingular,
        plural: ui?.plural || computedPlural,
        path,
      },
    },
    adminUILabels: {
      label: ui?.label || computedLabel,
      singular: ui?.singular || computedSingular,
      plural: ui?.plural || computedPlural,
      path,
    },
  };
}

// Missing functions from original
function graphqlForOutputField(field: any) {
  return field.output;
}

function outputTypeField(
  outputField: any,
  dbField: any,
  cacheHint: any,
  access: any,
  listKey: string,
  fieldPath: string,
  lists: any
) {
  return outputField;
}

function graphqlArgForInputField(field: any, operation: string) {
  return field.input?.[operation]?.arg;
}

const viewMappings = {
  [`@keystone-6/core/fields/types/text/views`]: `text`,
  [`@keystone-6/core/fields/types/password/views`]: `password`,
  [`@keystone-6/core/fields/types/relationship/views`]: `relationship`,
  [`@keystone-6/core/fields/types/json/views`]: `json`,
  [`@keystone-6/core/fields/types/timestamp/views`]: `timestamp`,
  [`@keystone-6/core/fields/types/checkbox/views`]: `checkbox`,
  [`@keystone-6/core/fields/types/select/views`]: `select`,
  [`@keystone-6/core/fields/types/integer/views`]: `integer`,
  [`@keystone-6/core/fields/types/bigInt/views`]: `bigInt`,
  [`@keystone-6/core/fields/types/float/views`]: `float`,
  [`@keystone-6/core/fields/types/decimal/views`]: `decimal`,
  [`@keystone-6/core/fields/types/image/views`]: `image`,
  [`@keystone-6/core/fields/types/virtual/views`]: `virtual`,
  [`@keystone-6/fields-document/views`]: `document`,
};

export function areArraysEqual(a: any[], b: any[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

/**
 * Main function to generate the view order configuration
 */
export function main() {
  // Access the default export properly
  const keystoneConfig = (config as any).default || config;

  const lists = initialiseLists(keystoneConfig);
  const uniqueViews = extractUniqueViews(lists);

  // Generate the view-order/index.ts file with just the VIEW_ORDER array
  const outputPath = join(dirname(fileURLToPath(import.meta.url)), 'index.ts');
  const fileContent = `/**
 * Auto-generated view order configuration from Keystone models
 * This file is generated by view-order/generate-view-order.ts
 * DO NOT EDIT THIS FILE MANUALLY
 */

/**
 * View order configuration for the Keystone application
 * This defines the order of field types that correspond to view indices
 */
export const VIEW_ORDER = [
${uniqueViews.map(view => `  "${view}"`).join(',\n')}
];`;

  writeFileSync(outputPath, fileContent);
  console.log(`Generated view order with ${uniqueViews.length} field types: ${uniqueViews.join(', ')}`);
}

function extractUniqueViews(jsonData: any) {
  let viewsArray: string[] = [];
  
  for (const key in jsonData) {
    if (jsonData.hasOwnProperty(key)) {
      const fields = jsonData[key].fields;
      if (fields) {
        for (const fieldKey in fields) {
          if (fields.hasOwnProperty(fieldKey)) {
            const field = fields[fieldKey];
            const viewMap = (viewMappings as any)[field.views] || field.views;
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

// All the helper functions from the original script...
export function initialiseLists(config: any) {
  const listsConfig = config.lists;

  let intermediateLists;
  intermediateLists = Object.fromEntries(
    Object.entries(getIsEnabled(listsConfig)).map(([key, isEnabled]) => [
      key,
      { graphql: { isEnabled } },
    ])
  );

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
          ...(list as any),
          resolvedDbFields: (resolvedDBFieldsForLists as any)[listKey],
        },
      ])
    );
  }

  intermediateLists = Object.fromEntries(
    Object.entries(intermediateLists).map(([listKey, list]) => {
      const fields: any = {};

      for (const [fieldKey, field] of Object.entries(list.fields)) {
        (fields as any)[fieldKey] = {
          ...(field as any),
          dbField: (list as any).resolvedDbFields[fieldKey],
        };
      }

      return [listKey, { ...list, fields }];
    })
  );

  for (const list of Object.values(intermediateLists)) {
    let hasAnEnabledCreateField = false;
    let hasAnEnabledUpdateField = false;

    for (const field of Object.values((list as any).fields)) {
      if ((field as any).input?.create?.arg && (field as any).graphql.isEnabled.create) {
        hasAnEnabledCreateField = true;
      }
      if ((field as any).input?.update && (field as any).graphql.isEnabled.update) {
        hasAnEnabledUpdateField = true;
      }
    }

    if (!hasAnEnabledCreateField) {
      (list as any).graphql.isEnabled.create = false;
    }
    if (!hasAnEnabledUpdateField) {
      (list as any).graphql.isEnabled.update = false;
    }
  }

  for (const [listKey, intermediateList] of Object.entries(intermediateLists)) {
    (listsRef as any)[listKey] = {
      ...intermediateList,
      lists: listsRef,
    };
  }

  return listsRef;
}

function getIsEnabled(listsConfig: any) {
  const isEnabled: any = {};

  for (const [listKey, listConfig] of Object.entries(listsConfig)) {
    const omit = (listConfig as any).graphql?.omit;
    const { defaultIsFilterable, defaultIsOrderable } = (listConfig as any);
    if (!omit) {
      throwIfNotAFilter(defaultIsFilterable, listKey, "defaultIsFilterable");
      throwIfNotAFilter(defaultIsOrderable, listKey, "defaultIsOrderable");
    }
    if (omit === true) {
      (isEnabled as any)[listKey] = {
        type: false,
        query: false,
        create: false,
        update: false,
        delete: false,
        filter: false,
        orderBy: false,
      };
    } else {
      (isEnabled as any)[listKey] = {
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

function throwIfNotAFilter(x: any, listKey: any, fieldKey: any) {
  if (["boolean", "undefined", "function"].includes(typeof x)) return;

  throw new Error(
    `Configuration option '${listKey}.${fieldKey}' must be either a boolean value or a function. Received '${x}'.`
  );
}

function getListGraphqlTypes(listsConfig: any, lists: any, intermediateLists: any) {
  const graphQLTypes: any = {};

  for (const [listKey, listConfig] of Object.entries(listsConfig)) {
    const {
      graphql: { names },
    } = getNamesFromList(listKey, listConfig);

    const output = graphql.object()({
      name: names.outputTypeName,
      fields: () => {
        const { fields } = (lists as any)[listKey];
        return {
          ...Object.fromEntries(
            Object.entries(fields).flatMap(([fieldPath, field]) => {
              if (
                !(field as any).output ||
                !(field as any).graphql.isEnabled.read ||
                ((field as any).dbField.kind === "relation" &&
                  !(intermediateLists as any)[(field as any).dbField.list].graphql.isEnabled
                    .query)
              ) {
                return [];
              }

              const outputFieldRoot = graphqlForOutputField(field as any);
              return [
                [fieldPath, outputFieldRoot],
                ...Object.entries((field as any).extraOutputFields || {}),
              ].map(([outputTypeFieldName, outputField]) => {
                return [
                  outputTypeFieldName,
                  outputTypeField(
                    outputField,
                    (field as any).dbField,
                    (field as any).graphql?.cacheHint,
                    (field as any).access.read,
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
        const { fields } = (lists as any)[listKey];
        return {
          ...Object.fromEntries(
            Object.entries(fields).flatMap(([key, field]) => {
              if (
                !(field as any).input?.uniqueWhere?.arg ||
                !(field as any).graphql.isEnabled.read ||
                !(field as any).graphql.isEnabled.filter
              ) {
                return [];
              }
              return [[key, (field as any).input.uniqueWhere.arg]];
            })
          ),
          id: graphql.arg({ type: graphql.ID }),
        };
      },
    });

    const where: any = graphql.inputObject({
      name: names.whereInputName,
      fields: (): any => {
        const { fields } = (lists as any)[listKey];
        return Object.assign(
          {
            AND: graphql.arg({ type: graphql.list(graphql.nonNull(where)) }),
            OR: graphql.arg({ type: graphql.list(graphql.nonNull(where)) }),
            NOT: graphql.arg({ type: graphql.list(graphql.nonNull(where)) }),
          },
          ...Object.entries(fields).map(
            ([fieldKey, field]) =>
              (field as any).input?.where?.arg &&
              (field as any).graphql.isEnabled.read &&
              (field as any).graphql.isEnabled.filter && {
                [fieldKey]: (field as any).input?.where?.arg,
              }
          )
        );
      },
    });

    const create = graphql.inputObject({
      name: names.createInputName,
      fields: () => {
        const { fields } = (lists as any)[listKey];
        const ret: any = {};

        for (const key in fields) {
          const arg = graphqlArgForInputField(fields[key], "create");
          if (!arg) continue;
          (ret as any)[key] = arg;
        }

        return ret;
      },
    });

    const update = graphql.inputObject({
      name: names.updateInputName,
      fields: () => {
        const { fields } = (lists as any)[listKey];
        const ret: any = {};

        for (const key in fields) {
          const arg = graphqlArgForInputField(fields[key], "update");
          if (!arg) continue;
          (ret as any)[key] = arg;
        }

        return ret;
      },
    });

    const orderBy = graphql.inputObject({
      name: names.listOrderName,
      fields: () => {
        const { fields } = (lists as any)[listKey];
        return Object.fromEntries(
          Object.entries(fields).flatMap(([key, field]) => {
            if (
              !(field as any).input?.orderBy?.arg ||
              !(field as any).graphql.isEnabled.read ||
              !(field as any).graphql.isEnabled.orderBy
            ) {
              return [];
            }
            return [[key, (field as any).input.orderBy.arg]];
          })
        );
      },
    });

    let take = graphql.arg({ type: graphql.Int });
    if ((listConfig as any).graphql?.maxTake !== undefined) {
      take = graphql.arg({
        type: graphql.nonNull(graphql.Int) as any,
        defaultValue: (listConfig as any).graphql.maxTake,
      });
    }

    const findManyArgs = {
      where: graphql.arg({
        type: graphql.nonNull(where) as any,
        defaultValue: (listConfig as any).isSingleton
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
            disconnect: graphql.arg({
              type: graphql.list(graphql.nonNull(uniqueWhere)),
            }),
            set: graphql.arg({
              type: graphql.list(graphql.nonNull(uniqueWhere)),
            }),
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
            ...(isEnabled.create && { create: graphql.arg({ type: create }) }),
            connect: graphql.arg({ type: uniqueWhere }),
          };
        },
      });

      relateToOneForUpdate = graphql.inputObject({
        name: names.relateToOneForUpdateInputName,
        fields: () => {
          return {
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

      throwIfNotAFilter(f.isFilterable, listKey, "isFilterable");
      throwIfNotAFilter(f.isOrderable, listKey, "isOrderable");

      const omit = f.graphql?.omit;
      const read = omit !== true && !omit?.read;
      const _isEnabled = {
        read,
        create: omit !== true && !omit?.create,
        update: omit !== true && !omit?.update,
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
        namePlural: names.graphql.namePlural,
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
      update: filter?.update ?? allowAll,
      delete: filter?.delete ?? allowAll,
    },
    item: {
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

// Execute the generation when this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}